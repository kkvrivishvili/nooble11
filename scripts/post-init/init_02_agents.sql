-- Nooble8 Agents Schema
-- Version: 4.0 - camelCase
-- Description: Agent templates and user agents with camelCase convention

-- Step 1: Create agentTemplates table
CREATE TABLE public."agentTemplates" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  category text NOT NULL,
  description text,
  icon text DEFAULT '🤖',
  "systemPromptTemplate" text NOT NULL,
  "defaultQueryConfig" jsonb DEFAULT '{
    "model": "llama-3.3-70b-versatile",
    "temperature": 0.7,
    "maxTokens": 4096,
    "topP": 0.9,
    "frequencyPenalty": 0.0,
    "presencePenalty": 0.0,
    "stream": true
  }'::jsonb,
  "defaultRagConfig" jsonb DEFAULT '{
    "embeddingModel": "text-embedding-3-small",
    "embeddingDimensions": 1536,
    "chunkSize": 512,
    "chunkOverlap": 50,
    "topK": 10,
    "similarityThreshold": 0.7,
    "hybridSearch": false,
    "rerank": false
  }'::jsonb,
  "defaultExecutionConfig" jsonb DEFAULT '{
    "historyEnabled": true,
    "historyWindow": 10,
    "historyTtl": 3600,
    "maxIterations": 5,
    "timeoutSeconds": 30
  }'::jsonb,
  "isActive" boolean DEFAULT true,
  "createdAt" timestamptz DEFAULT now(),
  "updatedAt" timestamptz DEFAULT now()
);

-- Step 2: Create agents table
CREATE TABLE public.agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  "templateId" uuid REFERENCES public."agentTemplates"(id),
  name text NOT NULL,
  description text,
  icon text DEFAULT '🤖',
  "systemPromptOverride" text, -- User's additional prompt
  "queryConfig" jsonb NOT NULL,
  "ragConfig" jsonb NOT NULL,
  "executionConfig" jsonb NOT NULL,
  "isActive" boolean DEFAULT true,
  "isPublic" boolean DEFAULT true, -- Can be accessed by visitors
  "createdAt" timestamptz DEFAULT now(),
  "updatedAt" timestamptz DEFAULT now(),
  CONSTRAINT unique_agent_name_per_user UNIQUE("userId", name)
);

-- Step 3: Create a function to get the full system prompt
CREATE OR REPLACE FUNCTION get_agent_system_prompt(agent_id uuid)
RETURNS text AS $$
DECLARE
  v_template_prompt text;
  v_override_prompt text;
BEGIN
  SELECT 
    at."systemPromptTemplate",
    a."systemPromptOverride"
  INTO 
    v_template_prompt,
    v_override_prompt
  FROM agents a
  LEFT JOIN "agentTemplates" at ON a."templateId" = at.id
  WHERE a.id = agent_id;
  
  RETURN COALESCE(v_template_prompt, '') || 
         CASE 
           WHEN v_override_prompt IS NOT NULL AND v_override_prompt != '' 
           THEN E'\n\n' || v_override_prompt 
           ELSE '' 
         END;
END;
$$ LANGUAGE plpgsql STABLE;

-- Step 4: Create a view that includes the computed system prompt
CREATE OR REPLACE VIEW agents_with_prompt AS
SELECT 
  a.*,
  get_agent_system_prompt(a.id) as "systemPrompt"
FROM agents a;

-- Step 5: Create indexes
CREATE INDEX idx_agents_user_id ON public.agents("userId");
CREATE INDEX idx_agents_template_id ON public.agents("templateId");
CREATE INDEX idx_agents_is_public ON public.agents("isPublic") WHERE "isPublic" = true;
CREATE INDEX idx_agents_is_active ON public.agents("isActive") WHERE "isActive" = true;

-- Step 6: Add triggers for updatedAt
CREATE TRIGGER update_agent_templates_updated_at 
  BEFORE UPDATE ON public."agentTemplates"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at 
  BEFORE UPDATE ON public.agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 7: Grant permissions on the view (for RLS)
GRANT SELECT ON agents_with_prompt TO authenticated;
GRANT SELECT ON agents_with_prompt TO anon;