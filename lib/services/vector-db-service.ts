/**
 * Vector Database Service for Sampath Bank Customer Care
 * Handles document embeddings, similarity search, and RAG operations
 */

export type RagHit = { score: number; chunk_text: string; file_path: string };
export type RagResponse = { result: string; hits?: RagHit[] };

const RAG_URL = process.env.NEXT_PUBLIC_RAG_URL ?? 'http://localhost:8000/rag';

export async function queryRag(query: string, k: number = 3): Promise<RagResponse> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(RAG_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      mode: 'cors',
      body: JSON.stringify({ query, k }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`RAG ${res.status}: ${text}`);
    }

    const data = await res.json().catch(() => ({}));
    if (data.error) throw new Error(data.error);

    const result: string = typeof data.result === 'string' ? data.result : '';
    const hits: RagHit[] = Array.isArray(data.hits) ? data.hits : [];

    return {
      result: result || 'කණගාටුයි, මේ ප්‍රශ්නයට අදාල තොරතුරු හමු නොවුණා.',
      hits,
    };
  } catch (err) {
    console.error('RAG fetch failed:', err);
    return {
      result: 'කණගාටුයි, දැනට මට ආරිය තොරතුරු ගන්න බැහැ. ටික වේලාවකින් නැවත උත්සාහ කරන්න.',
    };
  } finally {
    clearTimeout(id);
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
