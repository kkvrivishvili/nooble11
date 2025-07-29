-- Nooble8 Documents RAG Schema
-- Version: 4.0 - camelCase
-- Description: Document management for RAG system with camelCase convention

-- Step 1: Create document collections table
CREATE TABLE public."documentCollections" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" uuid NOT NULL,
  name text NOT NULL,
  "collectionType" text DEFAULT 'general' CHECK ("collectionType" IN ('general', 'products', 'services')),
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  "createdAt" timestamptz DEFAULT now(),
  "updatedAt" timestamptz DEFAULT now(),
  CONSTRAINT unique_collection_name_per_tenant UNIQUE("tenantId", name)
);

-- Step 2: Create documents table
CREATE TABLE public."documentsRag" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" uuid NOT NULL,
  "collectionId" uuid NOT NULL REFERENCES public."documentCollections"(id) ON DELETE CASCADE,
  "documentName" text NOT NULL,
  "documentType" text NOT NULL CHECK ("documentType" IN ('pdf', 'docx', 'txt', 'html', 'markdown', 'url')),
  
  -- Embedding configuration (must be consistent within collection)
  "embeddingModel" text NOT NULL,
  "embeddingDimensions" integer NOT NULL,
  "encodingFormat" text DEFAULT 'float',
  "chunkSize" integer NOT NULL,
  "chunkOverlap" integer NOT NULL,
  
  -- Status tracking
  "totalChunks" integer DEFAULT 0,
  "processedChunks" integer DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  "errorMessage" text,
  
  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,
  "createdAt" timestamptz DEFAULT now(),
  "updatedAt" timestamptz DEFAULT now()
);

-- Step 3: Create agent-document relationship
CREATE TABLE public."agentDocuments" (
  "agentId" uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  "documentId" uuid NOT NULL REFERENCES public."documentsRag"(id) ON DELETE CASCADE,
  "assignedAt" timestamptz DEFAULT now(),
  PRIMARY KEY ("agentId", "documentId")
);

-- Step 4: Create indexes
CREATE INDEX idx_document_collections_tenant ON public."documentCollections"("tenantId");
CREATE INDEX idx_documents_rag_tenant ON public."documentsRag"("tenantId");
CREATE INDEX idx_documents_rag_collection ON public."documentsRag"("collectionId");
CREATE INDEX idx_documents_rag_status ON public."documentsRag"(status);
CREATE INDEX idx_agent_documents_agent ON public."agentDocuments"("agentId");
CREATE INDEX idx_agent_documents_document ON public."agentDocuments"("documentId");

-- Step 5: Add triggers
CREATE TRIGGER update_document_collections_updated_at 
  BEFORE UPDATE ON public."documentCollections"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_rag_updated_at 
  BEFORE UPDATE ON public."documentsRag"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();