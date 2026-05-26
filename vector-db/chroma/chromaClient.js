const { ChromaClient } = require('chromadb');
const path = require('path');

class ChromaVectorStore {
    constructor() {
        this.client = null;
        this.collections = {
            quran: null,
            hadith: null
        };
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;
        
        try {
            this.client = new ChromaClient({
                path: path.join(__dirname, '../chroma-data')
            });
            
            // Create or get collections
            this.collections.quran = await this.client.getOrCreateCollection({
                name: 'quran_verses',
                metadata: { description: 'Quranic verses embeddings' }
            });
            
            this.collections.hadith = await this.client.getOrCreateCollection({
                name: 'hadith_collection',
                metadata: { description: 'Hadith embeddings' }
            });
            
            this.initialized = true;
            console.log('✅ ChromaDB initialized');
            
        } catch (error) {
            console.warn('ChromaDB not available, using fallback:', error.message);
            this.initialized = false;
        }
    }

    async addQuranVerses(verses, embeddings) {
        await this.initialize();
        if (!this.initialized) return false;
        
        try {
            const ids = verses.map(v => `quran_${v.surah}_${v.verse}`);
            const metadatas = verses.map(v => ({
                surah: v.surah,
                surahName: v.surahName,
                verse: v.verse,
                type: 'quran'
            }));
            
            await this.collections.quran.add({
                ids: ids,
                embeddings: embeddings,
                metadatas: metadatas,
                documents: verses.map(v => v.text)
            });
            
            console.log(`Added ${verses.length} Quran verses to ChromaDB`);
            return true;
            
        } catch (error) {
            console.error('Error adding to ChromaDB:', error);
            return false;
        }
    }

    async addHadith(hadiths, embeddings) {
        await this.initialize();
        if (!this.initialized) return false;
        
        try {
            const ids = hadiths.map(h => `hadith_${h.collection}_${h.id}`);
            const metadatas = hadiths.map(h => ({
                collection: h.collection,
                reference: h.reference,
                grade: h.grade,
                type: 'hadith'
            }));
            
            await this.collections.hadith.add({
                ids: ids,
                embeddings: embeddings,
                metadatas: metadatas,
                documents: hadiths.map(h => h.text)
            });
            
            console.log(`Added ${hadiths.length} Hadith to ChromaDB`);
            return true;
            
        } catch (error) {
            console.error('Error adding to ChromaDB:', error);
            return false;
        }
    }

    async searchQuran(queryEmbedding, topK = 5) {
        await this.initialize();
        if (!this.initialized) return [];
        
        try {
            const results = await this.collections.quran.query({
                queryEmbeddings: [queryEmbedding],
                nResults: topK
            });
            
            return results;
        } catch (error) {
            console.error('ChromaDB search error:', error);
            return [];
        }
    }

    async searchHadith(queryEmbedding, topK = 5) {
        await this.initialize();
        if (!this.initialized) return [];
        
        try {
            const results = await this.collections.hadith.query({
                queryEmbeddings: [queryEmbedding],
                nResults: topK
            });
            
            return results;
        } catch (error) {
            console.error('ChromaDB search error:', error);
            return [];
        }
    }
}

module.exports = new ChromaVectorStore();