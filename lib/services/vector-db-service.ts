/**
 * Vector Database Service for Sampath Bank Customer Care
 * Handles document embeddings, similarity search, and RAG operations
 */

const DEFAULT_RAG_BASE_URL = 'http://127.0.0.1:8000';

interface RagResponse {
  result?: string;
  error?: string;
}

const buildRagEndpoint = () => {
  const base =
    process.env.NEXT_PUBLIC_RAG_BASE_URL ||
    process.env.RAG_BASE_URL ||
    DEFAULT_RAG_BASE_URL;
  return `${base.replace(/\/$/, '')}/rag`;
};

/**
 * Call the local FastAPI RAG backend and return the combined answer text.
 */
export async function searchKnowledgeBase(query: string): Promise<string | null> {
  try {
    const response = await fetch("http://127.0.0.1:8000/rag", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      console.error("RAG backend error:", response.statusText);
      return null;
    }

    const data = await response.json();
    if (data.result) return data.result;
    console.warn("No result field in RAG response:", data);
    return null;
  } catch (err) {
    console.error("Error calling /rag endpoint:", err);
    return null;
  }
}

export interface VectorDocument {
  id: string;
  title: string;
  content: string;
  metadata: {
    tags: string[];
    product_area: string;
    last_reviewed: string;
    type: string;
    requires_auth: boolean;
    pii: boolean;
  };
  embedding?: number[];
  score?: number;
}

export interface SearchResult {
  documents: VectorDocument[];
  query: string;
  total_results: number;
  search_time_ms: number;
}

export class VectorDatabaseService {
  private apiKey: string;
  private documents: VectorDocument[] = [];
  private embeddings: Map<string, number[]> = new Map();

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Initialize the vector database with documents
   */
  async initialize(documents: VectorDocument[]): Promise<void> {
    console.log('🚀 Initializing Vector Database...');
    this.documents = documents;
    
    // Generate embeddings for all documents
    await this.generateEmbeddings();
    console.log(`✅ Vector DB initialized with ${documents.length} documents`);
  }

  /**
   * Generate embeddings for all documents using Gemini API
   */
  private async generateEmbeddings(): Promise<void> {
    for (const doc of this.documents) {
      try {
        const text = `${doc.title}\n${doc.content}`;
        const embedding = await this.generateEmbedding(text);
        
        if (embedding) {
          this.embeddings.set(doc.id, embedding);
          doc.embedding = embedding;
        }
      } catch (error) {
        console.error(`Failed to generate embedding for ${doc.id}:`, error);
      }
    }
  }

  /**
   * Generate embedding for a single text using Gemini API
   */
  private async generateEmbedding(text: string): Promise<number[] | null> {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: {
              parts: [{ text }]
            }
          })
        }
      );

      const data = await response.json();
      return data.embedding?.values || null;
    } catch (error) {
      console.error('Embedding generation failed:', error);
      return null;
    }
  }

  /**
   * Search for similar documents using vector similarity
   */
  async searchSimilar(
    query: string, 
    limit: number = 5, 
    threshold: number = 0.7
  ): Promise<SearchResult> {
    const startTime = Date.now();
    
    try {
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query);

      if (!queryEmbedding) {
        throw new Error('Failed to generate query embedding');
      }

      // Calculate similarities
      const results: VectorDocument[] = [];
      
      for (const doc of this.documents) {
        const docEmbedding = this.embeddings.get(doc.id);
        if (docEmbedding) {
          const similarity = this.cosineSimilarity(queryEmbedding, docEmbedding);
          
          if (similarity >= threshold) {
            results.push({
              ...doc,
              score: similarity
            });
          }
        }
      }

      // Sort by similarity score
      results.sort((a, b) => (b.score || 0) - (a.score || 0));
      
      const searchTime = Date.now() - startTime;
      
      return {
        documents: results.slice(0, limit),
        query,
        total_results: results.length,
        search_time_ms: searchTime
      };
    } catch (error) {
      console.error('Vector search failed:', error);
      return {
        documents: [],
        query,
        total_results: 0,
        search_time_ms: Date.now() - startTime
      };
    }
  }

  /**
   * Search by specific criteria
   */
  searchByFilter(filters: {
    product_area?: string;
    tags?: string[];
    requires_auth?: boolean;
    type?: string;
  }): VectorDocument[] {
    return this.documents.filter(doc => {
      if (filters.product_area && doc.metadata.product_area !== filters.product_area) {
        return false;
      }
      if (filters.requires_auth !== undefined && doc.metadata.requires_auth !== filters.requires_auth) {
        return false;
      }
      if (filters.type && doc.metadata.type !== filters.type) {
        return false;
      }
      if (filters.tags && filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(tag => 
          doc.metadata.tags.includes(tag)
        );
        if (!hasMatchingTag) return false;
      }
      return true;
    });
  }

  /**
   * Get document by ID
   */
  getDocumentById(id: string): VectorDocument | undefined {
    return this.documents.find(doc => doc.id === id);
  }

  /**
   * Add new document to the vector database
   */
  async addDocument(document: VectorDocument): Promise<void> {
    // Generate embedding for the new document
    const text = `${document.title}\n${document.content}`;
    const embedding = await this.generateEmbedding(text);
    
    if (embedding) {
      document.embedding = embedding;
      this.embeddings.set(document.id, embedding);
      this.documents.push(document);
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Get database statistics
   */
  getStats(): {
    total_documents: number;
    total_embeddings: number;
    product_areas: string[];
    document_types: string[];
  } {
    const productAreas = [...new Set(this.documents.map(doc => doc.metadata.product_area))];
    const documentTypes = [...new Set(this.documents.map(doc => doc.metadata.type))];

    return {
      total_documents: this.documents.length,
      total_embeddings: this.embeddings.size,
      product_areas: productAreas,
      document_types: documentTypes
    };
  }
}
