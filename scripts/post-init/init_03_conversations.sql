-- Nooble8 Conversations Schema
-- Version: 4.0 - camelCase
-- Description: Conversations and messages for agent interactions with camelCase convention

-- Step 1: Create conversations table
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY, -- Deterministic: uuid5(namespace, tenant:session:agent)
  "tenantId" uuid NOT NULL, -- Owner of the agent (userId)
  "sessionId" uuid NOT NULL, -- Visitor's session
  "agentId" uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  "visitorInfo" jsonb DEFAULT '{
    "ip": null,
    "location": null,
    "deviceType": null,
    "userAgent": null
  }'::jsonb,
  "startedAt" timestamptz NOT NULL DEFAULT now(),
  "endedAt" timestamptz,
  "isActive" boolean DEFAULT true,
  "messageCount" integer DEFAULT 0,
  "lastMessageAt" timestamptz DEFAULT now(),
  CONSTRAINT unique_conversation UNIQUE("tenantId", "sessionId", "agentId")
);

-- Step 2: Create messages table
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "conversationId" uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role varchar(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb, -- tokens used, model, etc.
  "createdAt" timestamptz DEFAULT now()
);

-- Step 3: Create indexes
CREATE INDEX idx_conversations_tenant ON public.conversations("tenantId");
CREATE INDEX idx_conversations_session ON public.conversations("sessionId");
CREATE INDEX idx_conversations_agent ON public.conversations("agentId");
CREATE INDEX idx_conversations_active ON public.conversations("isActive") WHERE "isActive" = true;
CREATE INDEX idx_conversations_dates ON public.conversations("startedAt", "endedAt");
CREATE INDEX idx_messages_conversation ON public.messages("conversationId");
CREATE INDEX idx_messages_created ON public.messages("createdAt");

-- Step 4: Function to update message count
CREATE OR REPLACE FUNCTION update_conversation_message_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET "messageCount" = "messageCount" + 1,
      "lastMessageAt" = NEW."createdAt"
  WHERE id = NEW."conversationId";
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_message_count_on_insert
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_message_count();

-- Step 5: View for conversation summary
CREATE OR REPLACE VIEW conversation_summary AS
SELECT 
  c.id,
  c."tenantId",
  c."sessionId",
  c."agentId",
  a.name as "agentName",
  c."visitorInfo",
  c."startedAt",
  c."endedAt",
  c."isActive",
  c."messageCount",
  c."lastMessageAt",
  CASE 
    WHEN c."endedAt" IS NOT NULL THEN c."endedAt" - c."startedAt"
    ELSE now() - c."startedAt"
  END as duration,
  COUNT(m.id) FILTER (WHERE m.role = 'user') as "userMessages",
  COUNT(m.id) FILTER (WHERE m.role = 'assistant') as "agentMessages"
FROM conversations c
LEFT JOIN agents a ON c."agentId" = a.id
LEFT JOIN messages m ON c.id = m."conversationId"
GROUP BY c.id, a.name;

-- Step 6: Auto-close old conversations (3 months)
CREATE OR REPLACE FUNCTION auto_close_old_conversations()
RETURNS void AS $$
BEGIN
  UPDATE conversations
  SET "isActive" = false,
      "endedAt" = "lastMessageAt"
  WHERE "isActive" = true
    AND "lastMessageAt" < now() - interval '3 months';
END;
$$ LANGUAGE plpgsql;