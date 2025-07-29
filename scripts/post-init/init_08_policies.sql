-- Nooble8 RLS Policies
-- Version: 4.0 - camelCase
-- Description: Row Level Security policies with camelCase convention

-- Enable RLS on all tables
ALTER TABLE public."agentTemplates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."documentCollections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."documentsRag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."agentDocuments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."widgetLinks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."widgetGallery" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."widgetAgents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."widgetYoutube" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."widgetMaps" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."widgetSpotify" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."widgetCalendar" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."widgetSeparator" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."widgetTitle" ENABLE ROW LEVEL SECURITY;

-- AGENT TEMPLATES (public read)
CREATE POLICY "Agent templates are viewable by everyone" ON public."agentTemplates"
  FOR SELECT USING ("isActive" = true);

-- AGENTS
CREATE POLICY "Public agents are viewable by everyone" ON public.agents
  FOR SELECT USING ("isPublic" = true AND "isActive" = true);

CREATE POLICY "Users can view their own agents" ON public.agents
  FOR SELECT USING (auth.uid() = "userId");

CREATE POLICY "Users can manage their own agents" ON public.agents
  FOR ALL USING (auth.uid() = "userId");


CREATE POLICY "Anyone can create conversations with public agents" ON public.conversations
  FOR INSERT WITH CHECK (
    "agentId" IN (SELECT id FROM agents WHERE "isPublic" = true AND "isActive" = true)
  );

-- MESSAGES
CREATE POLICY "Users can view messages in conversations they have access to" ON public.messages
  FOR SELECT USING (
    "conversationId" IN (
      SELECT id FROM conversations WHERE 
      auth.uid() = "tenantId" OR
      "agentId" IN (SELECT id FROM agents WHERE "userId" = auth.uid())
    )
  );

CREATE POLICY "Anyone can create messages in their conversations" ON public.messages
  FOR INSERT WITH CHECK (
    -- This will be validated at application level for anonymous users
    true
  );

-- DOCUMENTS
CREATE POLICY "Users can manage their own document collections" ON public."documentCollections"
  FOR ALL USING (auth.uid() = "tenantId");

CREATE POLICY "Users can manage their own documents" ON public."documentsRag"
  FOR ALL USING (auth.uid() = "tenantId");

CREATE POLICY "Users can manage agent-document relationships" ON public."agentDocuments"
  FOR ALL USING (
    "agentId" IN (SELECT id FROM agents WHERE "userId" = auth.uid())
  );

-- PRODUCTS
CREATE POLICY "Products of public profiles are viewable" ON public.products
  FOR SELECT USING (
    "tenantId" IN (SELECT id FROM profiles WHERE "isPublic" = true)
  );

CREATE POLICY "Users can manage their own products" ON public.products
  FOR ALL USING (auth.uid() = "tenantId");

-- WIDGET LINKS
DROP POLICY IF EXISTS "Authenticated users can view all link widgets" ON public."widgetLinks";
DROP POLICY IF EXISTS "Users can manage their own link widgets" ON public."widgetLinks";
-- WIDGET LINKS - All widgets are public
CREATE POLICY "Anyone can view link widgets" ON public."widgetLinks"
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own link widgets" ON public."widgetLinks"
  FOR ALL USING (auth.uid() = "profileId");

-- WIDGET GALLERY
DROP POLICY IF EXISTS "Authenticated users can view all gallery widgets" ON public."widgetGallery";
DROP POLICY IF EXISTS "Users can manage their own gallery widgets" ON public."widgetGallery";
-- WIDGET GALLERY - All widgets are public
CREATE POLICY "Anyone can view gallery widgets" ON public."widgetGallery"
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own gallery widgets" ON public."widgetGallery"
  FOR ALL USING (auth.uid() = "profileId");

-- WIDGET AGENTS
DROP POLICY IF EXISTS "Authenticated users can view all agent widgets" ON public."widgetAgents";
DROP POLICY IF EXISTS "Users can manage their own agent widgets" ON public."widgetAgents";
-- WIDGET AGENTS - All widgets are public
CREATE POLICY "Anyone can view agent widgets" ON public."widgetAgents"
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own agent widgets" ON public."widgetAgents"
  FOR ALL USING (auth.uid() = "profileId");

-- WIDGET YOUTUBE
DROP POLICY IF EXISTS "Authenticated users can view all youtube widgets" ON public."widgetYoutube";
DROP POLICY IF EXISTS "Users can manage their own youtube widgets" ON public."widgetYoutube";
-- WIDGET YOUTUBE - All widgets are public
CREATE POLICY "Anyone can view youtube widgets" ON public."widgetYoutube"
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own youtube widgets" ON public."widgetYoutube"
  FOR ALL USING (auth.uid() = "profileId");

-- WIDGET MAPS
DROP POLICY IF EXISTS "Authenticated users can view all map widgets" ON public."widgetMaps";
DROP POLICY IF EXISTS "Users can manage their own map widgets" ON public."widgetMaps";
-- WIDGET MAPS - All widgets are public
CREATE POLICY "Anyone can view map widgets" ON public."widgetMaps"
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own map widgets" ON public."widgetMaps"
  FOR ALL USING (auth.uid() = "profileId");

-- WIDGET SPOTIFY
DROP POLICY IF EXISTS "Authenticated users can view all spotify widgets" ON public."widgetSpotify";
DROP POLICY IF EXISTS "Users can manage their own spotify widgets" ON public."widgetSpotify";
-- WIDGET SPOTIFY - All widgets are public
CREATE POLICY "Anyone can view spotify widgets" ON public."widgetSpotify"
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own spotify widgets" ON public."widgetSpotify"
  FOR ALL USING (auth.uid() = "profileId");

-- WIDGET CALENDAR
DROP POLICY IF EXISTS "Authenticated users can view all calendar widgets" ON public."widgetCalendar";
DROP POLICY IF EXISTS "Users can manage their own calendar widgets" ON public."widgetCalendar";
-- WIDGET CALENDAR - All widgets are public
CREATE POLICY "Anyone can view calendar widgets" ON public."widgetCalendar"
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own calendar widgets" ON public."widgetCalendar"
  FOR ALL USING (auth.uid() = "profileId");

-- WIDGET SEPARATOR
DROP POLICY IF EXISTS "Authenticated users can view all separator widgets" ON public."widgetSeparator";
DROP POLICY IF EXISTS "Users can manage their own separator widgets" ON public."widgetSeparator";
-- WIDGET SEPARATOR - All widgets are public
CREATE POLICY "Anyone can view separator widgets" ON public."widgetSeparator"
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own separator widgets" ON public."widgetSeparator"
  FOR ALL USING (auth.uid() = "profileId");

-- WIDGET TITLE
DROP POLICY IF EXISTS "Authenticated users can view all title widgets" ON public."widgetTitle";
DROP POLICY IF EXISTS "Users can manage their own title widgets" ON public."widgetTitle";
-- WIDGET TITLE - All widgets are public
CREATE POLICY "Anyone can view title widgets" ON public."widgetTitle"
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own title widgets" ON public."widgetTitle"
  FOR ALL USING (auth.uid() = "profileId");