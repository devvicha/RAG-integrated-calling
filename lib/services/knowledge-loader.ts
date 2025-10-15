/**
 * Knowledge Base Document Loader
 * Loads and converts knowledge base documents for vector database
 */

import { VectorDocument } from '../services/vector-db-service';
import knowledgeBaseData from '../prompts/knowledge-base.json';

export interface KnowledgeBaseEntry {
  id: string;
  title: string;
  tags: string[];
  product_area: string;
  requires_auth: boolean;
  last_reviewed: string;
  pii: boolean;
  type: string;
  content: any;
}

/**
 * Load and convert knowledge base documents
 */
export function loadKnowledgeBase(): VectorDocument[] {
  const documents: VectorDocument[] = [];
  
  for (const entry of knowledgeBaseData as KnowledgeBaseEntry[]) {
    // Convert content to string format
    let contentString: string;
    
    if (typeof entry.content === 'string') {
      contentString = entry.content;
    } else if (typeof entry.content === 'object') {
      // Convert JSON content to searchable text
      contentString = JSON.stringify(entry.content, null, 2);
    } else {
      contentString = String(entry.content);
    }
    
    const document: VectorDocument = {
      id: entry.id,
      title: entry.title,
      content: contentString,
      metadata: {
        tags: entry.tags,
        product_area: entry.product_area,
        requires_auth: entry.requires_auth,
        last_reviewed: entry.last_reviewed,
        pii: entry.pii,
        type: entry.type
      }
    };
    
    documents.push(document);
  }
  
  console.log(`📚 Loaded ${documents.length} knowledge base documents`);
  return documents;
}

/**
 * Get documents by product area
 */
export function getDocumentsByProductArea(productArea: string): VectorDocument[] {
  const allDocs = loadKnowledgeBase();
  return allDocs.filter(doc => doc.metadata.product_area === productArea);
}

/**
 * Get documents by tags
 */
export function getDocumentsByTags(tags: string[]): VectorDocument[] {
  const allDocs = loadKnowledgeBase();
  return allDocs.filter(doc => 
    tags.some(tag => doc.metadata.tags.includes(tag))
  );
}

/**
 * Get public documents (no authentication required)
 */
export function getPublicDocuments(): VectorDocument[] {
  const allDocs = loadKnowledgeBase();
  return allDocs.filter(doc => !doc.metadata.requires_auth);
}

/**
 * Get documents without PII
 */
export function getNonPIIDocuments(): VectorDocument[] {
  const allDocs = loadKnowledgeBase();
  return allDocs.filter(doc => !doc.metadata.pii);
}

/**
 * Get knowledge base statistics
 */
export function getKnowledgeBaseStats() {
  const allDocs = loadKnowledgeBase();
  
  const productAreas = [...new Set(allDocs.map(doc => doc.metadata.product_area))];
  const allTags = [...new Set(allDocs.flatMap(doc => doc.metadata.tags))];
  const documentTypes = [...new Set(allDocs.map(doc => doc.metadata.type))];
  
  return {
    total_documents: allDocs.length,
    product_areas: productAreas,
    total_product_areas: productAreas.length,
    all_tags: allTags,
    total_tags: allTags.length,
    document_types: documentTypes,
    public_documents: allDocs.filter(doc => !doc.metadata.requires_auth).length,
    non_pii_documents: allDocs.filter(doc => !doc.metadata.pii).length,
    last_updated: new Date().toISOString()
  };
}

// Pre-load and export for easy access
export const knowledgeDocuments = loadKnowledgeBase();
