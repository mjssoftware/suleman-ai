#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { HfInference } = require('@huggingface/inference');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

class VectorIndexBuilder {
    constructor() {
        this.client = new HfInference(process.env.HF_API_TOKEN);
        this.embeddingModel = process.env.EMBEDDING_MODEL || 'sentence-transformers/all-MiniLM-L6-v2';
        this.batchSize = 10; // Process in batches to avoid rate limits
        this.delayBetweenBatches = 1000; // 1 second delay
    }

    async buildQuranEmbeddings() {
        console.log('📖 Building Quran embeddings...');
        
        const quranData = await this.loadQuranData();
        const embeddings = [];
        
        for (let i = 0; i < quranData.length; i += this.batchSize) {
            const batch = quranData.slice(i, i + this.batchSize);
            console.log(`Processing Quran batch ${Math.floor(i / this.batchSize) + 1}/${Math.ceil(quranData.length / this.batchSize)}`);
            
            const batchEmbeddings = await this.generateBatchEmbeddings(batch.map(item => item.text));
            embeddings.push(...batchEmbeddings);
            
            // Save checkpoint
            await this.saveCheckpoint('quran', i + batch.length, embeddings);
            
            // Delay to avoid rate limiting
            if (i + this.batchSize < quranData.length) {
                await this.sleep(this.delayBetweenBatches);
            }
        }
        
        // Save final embeddings
        await this.saveEmbeddings('quran', embeddings, quranData);
        console.log('✅ Quran embeddings completed!');
        
        return embeddings;
    }

    async buildHadithEmbeddings() {
        console.log('📜 Building Hadith embeddings...');
        
        const hadithData = await this.loadHadithData();
        const embeddings = [];
        
        for (let i = 0; i < hadithData.length; i += this.batchSize) {
            const batch = hadithData.slice(i, i + this.batchSize);
            console.log(`Processing Hadith batch ${Math.floor(i / this.batchSize) + 1}/${Math.ceil(hadithData.length / this.batchSize)}`);
            
            const batchEmbeddings = await this.generateBatchEmbeddings(batch.map(item => item.text));
            embeddings.push(...batchEmbeddings);
            
            // Save checkpoint
            await this.saveCheckpoint('hadith', i + batch.length, embeddings);
            
            if (i + this.batchSize < hadithData.length) {
                await this.sleep(this.delayBetweenBatches);
            }
        }
        
        await this.saveEmbeddings('hadith', embeddings, hadithData);
        console.log('✅ Hadith embeddings completed!');
        
        return embeddings;
    }

    async loadQuranData() {
        const quranPath = path.join(__dirname, '../../server/src/data/quran/quran-english.json');
        const data = JSON.parse(await fs.readFile(quranPath, 'utf8'));
        
        const verses = [];
        for (const surah of data.surahs) {
            for (const verse of surah.verses) {
                verses.push({
                    id: `${surah.id}:${verse.verse_id}`,
                    surah: surah.id,
                    surahName: surah.name,
                    verse: verse.verse_id,
                    text: verse.text,
                    type: 'quran',
                    metadata: {
                        juz: verse.juz || null,
                        page: verse.page || null,
                        keywords: verse.keywords || []
                    }
                });
            }
        }
        
        return verses;
    }

    async loadHadithData() {
        const hadithCollections = ['bukhari', 'muslim'];
        const allHadith = [];
        
        for (const collection of hadithCollections) {
            const hadithPath = path.join(__dirname, `../../server/src/data/hadith/${collection}.json`);
            try {
                const data = JSON.parse(await fs.readFile(hadithPath, 'utf8'));
                
                // Extract hadiths from chapters
                if (data.chapters) {
                    for (const chapter in data.chapters) {
                        for (const hadith of data.chapters[chapter]) {
                            allHadith.push({
                                id: hadith.id,
                                reference: hadith.reference,
                                text: hadith.text_english,
                                simpleText: hadith.text_simple,
                                grade: hadith.grade,
                                collection: collection,
                                type: 'hadith',
                                keywords: hadith.keywords || [],
                                narrator: hadith.narrator || null
                            });
                        }
                    }
                }
                
                // Extract from direct hadiths array
                if (data.hadiths) {
                    for (const hadith of data.hadiths) {
                        allHadith.push({
                            id: hadith.id,
                            reference: hadith.reference,
                            text: hadith.text_english,
                            simpleText: hadith.text_simple,
                            grade: hadith.grade,
                            collection: collection,
                            type: 'hadith',
                            keywords: hadith.keywords || []
                        });
                    }
                }
                
            } catch (error) {
                console.warn(`Could not load ${collection}:`, error.message);
            }
        }
        
        return allHadith;
    }

    async generateBatchEmbeddings(texts) {
        try {
            // Clean and prepare texts
            const cleanedTexts = texts.map(text => 
                text.replace(/\s+/g, ' ').trim().substring(0, 512)
            );
            
            const response = await this.client.featureExtraction({
                model: this.embeddingModel,
                inputs: cleanedTexts
            });
            
            // Handle different response formats
            if (Array.isArray(response) && response.length === texts.length) {
                return response;
            } else if (Array.isArray(response) && !Array.isArray(response[0])) {
                // Single embedding returned
                return [response];
            } else {
                return response;
            }
            
        } catch (error) {
            console.error('Batch embedding error:', error);
            // Return zero embeddings as fallback
            return texts.map(() => new Array(384).fill(0));
        }
    }

    async saveEmbeddings(name, embeddings, metadata) {
        const embeddingsDir = path.join(__dirname, '../embeddings');
        await fs.mkdir(embeddingsDir, { recursive: true });
        
        // Save embeddings as numpy-like format (JSON for compatibility)
        const embeddingsPath = path.join(embeddingsDir, `${name}-embeddings.json`);
        const metadataPath = path.join(embeddingsDir, `${name}-metadata.json`);
        
        // Convert to serializable format
        const serializableEmbeddings = embeddings.map(emb => 
            Array.isArray(emb) ? emb : Array.from(emb)
        );
        
        await fs.writeFile(embeddingsPath, JSON.stringify({
            embeddings: serializableEmbeddings,
            dimension: serializableEmbeddings[0]?.length || 384,
            count: serializableEmbeddings.length,
            createdAt: new Date().toISOString(),
            model: this.embeddingModel
        }, null, 2));
        
        await fs.writeFile(metadataPath, JSON.stringify({
            metadata,
            totalItems: metadata.length,
            createdAt: new Date().toISOString()
        }, null, 2));
        
        console.log(`💾 Saved ${name} embeddings: ${embeddings.length} vectors`);
    }

    async saveCheckpoint(name, processed, embeddings) {
        const checkpointDir = path.join(__dirname, '../checkpoints');
        await fs.mkdir(checkpointDir, { recursive: true });
        
        const checkpointPath = path.join(checkpointDir, `${name}-checkpoint.json`);
        await fs.writeFile(checkpointPath, JSON.stringify({
            name,
            processed,
            embeddingsCount: embeddings.length,
            timestamp: new Date().toISOString()
        }, null, 2));
    }

    async loadCheckpoint(name) {
        const checkpointPath = path.join(__dirname, '../checkpoints', `${name}-checkpoint.json`);
        try {
            const data = await fs.readFile(checkpointPath, 'utf8');
            return JSON.parse(data);
        } catch {
            return null;
        }
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async buildAll() {
        console.log('🚀 Starting vector index building...');
        console.log(`📊 Embedding Model: ${this.embeddingModel}`);
        
        const startTime = Date.now();
        
        try {
            await this.buildQuranEmbeddings();
            await this.buildHadithEmbeddings();
            
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            console.log(`✨ All embeddings built successfully in ${duration} seconds!`);
            
            // Create index manifest
            await this.createManifest();
            
        } catch (error) {
            console.error('❌ Failed to build embeddings:', error);
            process.exit(1);
        }
    }

    async createManifest() {
        const manifest = {
            version: '1.0.0',
            createdAt: new Date().toISOString(),
            model: this.embeddingModel,
            collections: {
                quran: {
                    path: 'embeddings/quran-embeddings.json',
                    metadataPath: 'embeddings/quran-metadata.json',
                    totalVerses: (await this.loadQuranData()).length
                },
                hadith: {
                    path: 'embeddings/hadith-embeddings.json',
                    metadataPath: 'embeddings/hadith-metadata.json',
                    totalHadith: (await this.loadHadithData()).length
                }
            }
        };
        
        const manifestPath = path.join(__dirname, '../embeddings/manifest.json');
        await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
        console.log('📋 Created index manifest');
    }
}

// Run the builder
if (require.main === module) {
    const builder = new VectorIndexBuilder();
    builder.buildAll().catch(console.error);
}

module.exports = VectorIndexBuilder;