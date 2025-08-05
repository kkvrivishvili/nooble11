// src/api/ingestion-api.ts
import { supabase } from '@/lib/supabase';
import { PostgrestError } from '@supabase/supabase-js';

// Configuration
const INGESTION_SERVICE_URL = import.meta.env.VITE_INGESTION_SERVICE_URL || 'http://localhost:8002';

// Types
export interface RAGConfig {
  embedding_model?: string;
  embedding_dimensions?: number;
  encoding_format?: string;
  chunk_size?: number;
  chunk_overlap?: number;
}

export interface DocumentIngestionRequest {
  document_name: string;
  document_type: 'pdf' | 'docx' | 'txt' | 'html' | 'markdown' | 'url';
  rag_config?: RAGConfig;
  collection_id?: string;
  agent_ids?: string[];
  file_path?: string;
  content?: string;
  url?: string;
  metadata?: Record<string, any>;
}

export interface IngestionResponse {
  task_id: string;
  document_id: string;
  collection_id: string;
  agent_ids: string[];
  status: string;
  message: string;
  websocket_url?: string;
}

export interface DocumentRecord {
  id: string;
  profile_id: string;
  tenant_id: string;
  collection_id: string;
  document_id: string;
  document_name: string;
  document_type: string;
  embedding_model: string;
  embedding_dimensions: number;
  total_chunks: number;
  processed_chunks: number;
  status: string;
  metadata: {
    agent_ids: string[];
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

// Helper Functions
const handleApiError = (error: PostgrestError | Error | null, context: string) => {
  if (error) {
    console.error(`Error in ${context}:`, error.message);
    throw new Error(`A problem occurred in ${context}: ${error.message}`);
  }
};

const getAuthToken = async (): Promise<string> => {
  const { data: { session }, error } = await supabase.auth.getSession();
  handleApiError(error, 'auth token retrieval');
  if (!session?.access_token) throw new Error('User not authenticated.');
  return session.access_token;
};

class IngestionAPI {
  /**
   * Upload and ingest a single document
   * Note: tenant_id = user_id (used internally by backend)
   */
  async uploadDocument(
    file: File,
    agentIds: string[] = [],
    collectionId?: string,
    ragConfig?: RAGConfig
  ): Promise<IngestionResponse> {
    const token = await getAuthToken();
    
    const formData = new FormData();
    formData.append('file', file);
    
    if (collectionId) formData.append('collection_id', collectionId);
    // FastAPI expects multiple fields named 'agent_ids' for List[str] in multipart.
    // Do NOT JSON.stringify here; append each id separately. If empty, omit the field.
    if (agentIds && agentIds.length > 0) {
      agentIds.forEach((id) => formData.append('agent_ids', id));
    }
    
    // Add RAG config parameters
    if (ragConfig?.embedding_model) {
      formData.append('embedding_model', ragConfig.embedding_model);
    }
    if (ragConfig?.chunk_size) {
      formData.append('chunk_size', ragConfig.chunk_size.toString());
    }
    if (ragConfig?.chunk_overlap) {
      formData.append('chunk_overlap', ragConfig.chunk_overlap.toString());
    }
    
    const response = await fetch(`${INGESTION_SERVICE_URL}/api/v1/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to upload document');
    }
    
    return response.json();
  }

  /**
   * Ingest document from URL
   */
  async ingestFromUrl(
    url: string,
    documentName: string,
    agentIds: string[] = [],
    collectionId?: string,
    ragConfig?: RAGConfig
  ): Promise<IngestionResponse> {
    const token = await getAuthToken();
    
    const request: DocumentIngestionRequest = {
      document_name: documentName,
      document_type: 'url',
      url,
      agent_ids: agentIds,
      collection_id: collectionId,
      rag_config: ragConfig,
      metadata: {
        source_url: url
      }
    };
    
    const response = await fetch(`${INGESTION_SERVICE_URL}/api/v1/ingest`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to ingest from URL');
    }
    
    return response.json();
  }

  /**
   * Batch upload multiple documents
   */
  async batchUploadDocuments(
    files: File[],
    agentIds: string[] = [],
    collectionId?: string,
    ragConfig?: RAGConfig
  ): Promise<{
    batch_id: string;
    collection_id: string;
    results: Array<{
      document_name: string;
      task_id?: string;
      error?: string;
    }>;
  }> {
    const token = await getAuthToken();
    
    // Convert files to requests
    const documents: DocumentIngestionRequest[] = await Promise.all(
      files.map(async (file) => {
        const base64 = await this.fileToBase64(file);
        return {
          document_name: file.name,
          document_type: this.getDocumentType(file.name),
          content: base64,
          agent_ids: agentIds,
          rag_config: ragConfig,
          metadata: {
            file_size: file.size,
            mime_type: file.type
          }
        };
      })
    );
    
    const response = await fetch(`${INGESTION_SERVICE_URL}/api/v1/batch-ingest`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        documents,
        collection_id: collectionId,
        agent_ids: agentIds,
        default_rag_config: ragConfig
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to batch upload documents');
    }
    
    return response.json();
  }

  /**
   * Get ingestion status
   */
  async getIngestionStatus(taskId: string): Promise<{
    task_id: string;
    status: string;
    message: string;
    percentage: number;
    total_chunks?: number;
    processed_chunks?: number;
    error?: string;
  }> {
    const token = await getAuthToken();
    
    const response = await fetch(`${INGESTION_SERVICE_URL}/api/v1/status/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get status');
    }
    
    return response.json();
  }

  /**
   * Delete document from both Qdrant and Supabase
   */
  async deleteDocument(documentId: string, collectionId: string): Promise<void> {
    const token = await getAuthToken();
    
    const response = await fetch(`${INGESTION_SERVICE_URL}/api/v1/document/${documentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ collection_id: collectionId })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete document');
    }
  }

  /**
   * Update document agents assignment
   */
  async updateDocumentAgents(
    documentId: string,
    agentIds: string[],
    operation: 'set' | 'add' | 'remove' = 'set'
  ): Promise<void> {
    const token = await getAuthToken();
    
    const response = await fetch(`${INGESTION_SERVICE_URL}/api/v1/document/${documentId}/agents`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        agent_ids: agentIds,
        operation
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to update agents');
    }
  }

  /**
   * Get user's documents from Supabase
   */
  async getUserDocuments(): Promise<DocumentRecord[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
      .from('documents_rag')
      .select('*')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false });
    
    handleApiError(error, 'getUserDocuments');
    return data || [];
  }

  /**
   * Get documents by agent ID
   */
  async getDocumentsByAgent(agentId: string): Promise<DocumentRecord[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
      .from('documents_rag')
      .select('*')
      .eq('profile_id', user.id)
      .contains('metadata', { agent_ids: [agentId] })
      .order('created_at', { ascending: false });
    
    handleApiError(error, 'getDocumentsByAgent');
    return data || [];
  }

  /**
   * Get documents by collection
   */
  async getDocumentsByCollection(collectionId: string): Promise<DocumentRecord[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
      .from('documents_rag')
      .select('*')
      .eq('profile_id', user.id)
      .eq('collection_id', collectionId)
      .order('created_at', { ascending: false });
    
    handleApiError(error, 'getDocumentsByCollection');
    return data || [];
  }

  /**
   * Create WebSocket connection for progress tracking
   */
  createProgressWebSocket(taskId: string, token: string): WebSocket {
    const wsUrl = INGESTION_SERVICE_URL.replace(/^http/, 'ws');
    const ws = new WebSocket(`${wsUrl}/ws/ingestion/${taskId}?token=${token}`);
    
    ws.onopen = () => {
      console.log('WebSocket connected for task:', taskId);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    return ws;
  }

  /**
   * Get knowledge base statistics
   */
  async getKnowledgeStats(): Promise<{
    total_documents: number;
    total_chunks: number;
    collections_count: number;
    agents_with_knowledge: number;
    storage_used_mb?: number;
  }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    const { data: documents, error } = await supabase
      .from('documents_rag')
      .select('collection_id, total_chunks, metadata')
      .eq('profile_id', user.id);
    
    handleApiError(error, 'getKnowledgeStats');
    
    if (!documents) {
      return {
        total_documents: 0,
        total_chunks: 0,
        collections_count: 0,
        agents_with_knowledge: 0
      };
    }
    
    // Calculate stats
    const uniqueCollections = new Set(documents.map(d => d.collection_id));
    const uniqueAgents = new Set();
    let totalChunks = 0;
    
    documents.forEach(doc => {
      totalChunks += doc.total_chunks || 0;
      const agentIds = doc.metadata?.agent_ids || [];
      agentIds.forEach((id: string) => uniqueAgents.add(id));
    });
    
    return {
      total_documents: documents.length,
      total_chunks: totalChunks,
      collections_count: uniqueCollections.size,
      agents_with_knowledge: uniqueAgents.size
    };
  }

  // Helper methods
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  private getDocumentType(filename: string): DocumentIngestionRequest['document_type'] {
    const ext = filename.split('.').pop()?.toLowerCase();
    const typeMap: Record<string, DocumentIngestionRequest['document_type']> = {
      'pdf': 'pdf',
      'docx': 'docx',
      'doc': 'docx',
      'txt': 'txt',
      'html': 'html',
      'htm': 'html',
      'md': 'markdown'
    };
    return typeMap[ext || ''] || 'txt';
  }
}

export const ingestionApi = new IngestionAPI();