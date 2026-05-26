const fs = require('fs').promises;
const path = require('path');

class VectorSearch {
    constructor() {
        this.quranEmbeddings = null;
        this.quranMetadata = null;
        this.hadithEmbeddings = null;
        this.hadithMetadata = null;
        this.loaded = false;
    }

    async load() {
        if (this.loaded) return;
        
        try {
            // Load Quran embeddings
            const quranEmbPath = path.join(__dirname, '../embeddings/quran-embeddings.json');
            const quranMetaPath = path.join(__dirname, '../embeddings/quran-metadata.json');
            
            const quranEmbData = JSON.parse(await fs.readFile(quranEmbPath, 'utf8'));
            const quranMetaData = JSON.parse(await fs.readFile(quranMetaPath, 'utf8'));
            
            this.quranEmbeddings = quranEmbData.embeddings;
            this.quranMetadata = quranMetaData.metadata;
            
            // Load Hadith embeddings
            const hadithEmbPath = path.join(__dirname, '../embeddings/hadith-embeddings.json');
            const hadithMetaPath = path.join(__dirname, '../embeddings/hadith-metadata.json');
            
            const hadithEmbData = JSON.parse(await fs.readFile(hadithEmbPath, 'utf8'));
            const hadithMetaData = JSON.parse(await fs.readFile(hadithMetaPath, 'utf8'));
            
            this.hadithEmbeddings = hadithEmbData.embeddings;
            this.hadithMetadata = hadithMetaData.metadata;
            
            this.loaded = true;
            console.log('✅ Vector search loaded');
            
        } catch (error) {
            console.error('Failed to load vector search:', error);
            throw error;
        }
    }

    cosineSimilarity(vecA, vecB) {
        if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
        
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        
        if (normA === 0 || normB === 0) return 0;
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    async searchQuran(queryEmbedding, topK = 5) {
        if (!this.loaded) await this.load();
        
        const similarities = this.quranEmbeddings.map((emb, idx) => ({
            similarity: this.cosineSimilarity(queryEmbedding, emb),
            metadata: this.quranMetadata[idx],
            index: idx
        }));
        
        similarities.sort((a, b) => b.similarity - a.similarity);
        return similarities.slice(0, topK);
    }

    async searchHadith(queryEmbedding, topK = 5, gradeFilter = null) {
        if (!this.loaded) await this.load();
        
        let similarities = this.hadithEmbeddings.map((emb, idx) => ({
            similarity: this.cosineSimilarity(queryEmbedding, emb),
            metadata: this.hadithMetadata[idx],
            index: idx
        }));
        
        // Apply grade filter if specified
        if (gradeFilter) {
            similarities = similarities.filter(s => 
                s.metadata.grade?.toLowerCase() === gradeFilter.toLowerCase()
            );
        }
        
        similarities.sort((a, b) => b.similarity - a.similarity);
        return similarities.slice(0, topK);
    }

    async searchAll(queryEmbedding, topK = 10) {
        const [quranResults, hadithResults] = await Promise.all([
            this.searchQuran(queryEmbedding, Math.ceil(topK / 2)),
            this.searchHadith(queryEmbedding, Math.ceil(topK / 2))
        ]);
        
        const allResults = [
            ...quranResults.map(r => ({ ...r, type: 'quran' })),
            ...hadithResults.map(r => ({ ...r, type: 'hadith' }))
        ];
        
        allResults.sort((a, b) => b.similarity - a.similarity);
        return allResults.slice(0, topK);
    }
}

module.exports = new VectorSearch();