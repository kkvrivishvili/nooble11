-- Migration: Fix 403 Forbidden errors for widget access
-- This script fixes RLS policies and ensures proper access control

-- Grant necessary permissions to authenticated users
GRANT SELECT ON public."widgetLinks" TO authenticated;
GRANT SELECT ON public."widgetGallery" TO authenticated;
GRANT SELECT ON public."widgetAgents" TO authenticated;
GRANT SELECT ON public."widgetYoutube" TO authenticated;
GRANT SELECT ON public."widgetMaps" TO authenticated;
GRANT SELECT ON public."widgetSpotify" TO authenticated;
GRANT SELECT ON public."widgetCalendar" TO authenticated;
GRANT SELECT ON public."widgetSeparator" TO authenticated;
GRANT SELECT ON public."widgetTitle" TO authenticated;

-- Update RLS policies for widget tables to fix 403 errors
-- These policies allow users to view their own widgets and public profile widgets

-- WIDGET LINKS
DROP POLICY IF EXISTS "Authenticated users can view all link widgets" ON public."widgetLinks";
DROP POLICY IF EXISTS "Users can view their own link widgets" ON public."widgetLinks";
DROP POLICY IF EXISTS "Users can manage their own link widgets" ON public."widgetLinks";

CREATE POLICY "Users can view their own link widgets" ON public."widgetLinks"
  FOR SELECT USING (
    auth.uid() = "profileId" OR
    "profileId" IN (SELECT id FROM profiles WHERE "isPublic" = true)
  );

CREATE POLICY "Users can manage their own link widgets" ON public."widgetLinks"
  FOR ALL USING (auth.uid() = "profileId");

-- WIDGET GALLERY
DROP POLICY IF EXISTS "Authenticated users can view all gallery widgets" ON public."widgetGallery";
DROP POLICY IF EXISTS "Users can view their own gallery widgets" ON public."widgetGallery";
DROP POLICY IF EXISTS "Users can manage their own gallery widgets" ON public."widgetGallery";

CREATE POLICY "Users can view their own gallery widgets" ON public."widgetGallery"
  FOR SELECT USING (
    auth.uid() = "profileId" OR
    "profileId" IN (SELECT id FROM profiles WHERE "isPublic" = true)
  );

CREATE POLICY "Users can manage their own gallery widgets" ON public."widgetGallery"
  FOR ALL USING (auth.uid() = "profileId");

-- WIDGET AGENTS
DROP POLICY IF EXISTS "Authenticated users can view all agent widgets" ON public."widgetAgents";
DROP POLICY IF EXISTS "Users can view their own agent widgets" ON public."widgetAgents";
DROP POLICY IF EXISTS "Users can manage their own agent widgets" ON public."widgetAgents";

CREATE POLICY "Users can view their own agent widgets" ON public."widgetAgents"
  FOR SELECT USING (
    auth.uid() = "profileId" OR
    "profileId" IN (SELECT id FROM profiles WHERE "isPublic" = true)
  );

CREATE POLICY "Users can manage their own agent widgets" ON public."widgetAgents"
  FOR ALL USING (auth.uid() = "profileId");

-- WIDGET YOUTUBE
DROP POLICY IF EXISTS "Authenticated users can view all youtube widgets" ON public."widgetYoutube";
DROP POLICY IF EXISTS "Users can view their own youtube widgets" ON public."widgetYoutube";
DROP POLICY IF EXISTS "Users can manage their own youtube widgets" ON public."widgetYoutube";

CREATE POLICY "Users can view their own youtube widgets" ON public."widgetYoutube"
  FOR SELECT USING (
    auth.uid() = "profileId" OR
    "profileId" IN (SELECT id FROM profiles WHERE "isPublic" = true)
  );

CREATE POLICY "Users can manage their own youtube widgets" ON public."widgetYoutube"
  FOR ALL USING (auth.uid() = "profileId");

-- WIDGET MAPS
DROP POLICY IF EXISTS "Authenticated users can view all map widgets" ON public."widgetMaps";
DROP POLICY IF EXISTS "Users can view their own map widgets" ON public."widgetMaps";
DROP POLICY IF EXISTS "Users can manage their own map widgets" ON public."widgetMaps";

CREATE POLICY "Users can view their own map widgets" ON public."widgetMaps"
  FOR SELECT USING (
    auth.uid() = "profileId" OR
    "profileId" IN (SELECT id FROM profiles WHERE "isPublic" = true)
  );

CREATE POLICY "Users can manage their own map widgets" ON public."widgetMaps"
  FOR ALL USING (auth.uid() = "profileId");

-- WIDGET SPOTIFY
DROP POLICY IF EXISTS "Authenticated users can view all spotify widgets" ON public."widgetSpotify";
DROP POLICY IF EXISTS "Users can view their own spotify widgets" ON public."widgetSpotify";
DROP POLICY IF EXISTS "Users can manage their own spotify widgets" ON public."widgetSpotify";

CREATE POLICY "Users can view their own spotify widgets" ON public."widgetSpotify"
  FOR SELECT USING (
    auth.uid() = "profileId" OR
    "profileId" IN (SELECT id FROM profiles WHERE "isPublic" = true)
  );

CREATE POLICY "Users can manage their own spotify widgets" ON public."widgetSpotify"
  FOR ALL USING (auth.uid() = "profileId");

-- WIDGET CALENDAR
DROP POLICY IF EXISTS "Authenticated users can view all calendar widgets" ON public."widgetCalendar";
DROP POLICY IF EXISTS "Users can view their own calendar widgets" ON public."widgetCalendar";
DROP POLICY IF EXISTS "Users can manage their own calendar widgets" ON public."widgetCalendar";

CREATE POLICY "Users can view their own calendar widgets" ON public."widgetCalendar"
  FOR SELECT USING (
    auth.uid() = "profileId" OR
    "profileId" IN (SELECT id FROM profiles WHERE "isPublic" = true)
  );

CREATE POLICY "Users can manage their own calendar widgets" ON public."widgetCalendar"
  FOR ALL USING (auth.uid() = "profileId");

-- WIDGET SEPARATOR
DROP POLICY IF EXISTS "Authenticated users can view all separator widgets" ON public."widgetSeparator";
DROP POLICY IF EXISTS "Users can view their own separator widgets" ON public."widgetSeparator";
DROP POLICY IF EXISTS "Users can manage their own separator widgets" ON public."widgetSeparator";

CREATE POLICY "Users can view their own separator widgets" ON public."widgetSeparator"
  FOR SELECT USING (
    auth.uid() = "profileId" OR
    "profileId" IN (SELECT id FROM profiles WHERE "isPublic" = true)
  );

CREATE POLICY "Users can manage their own separator widgets" ON public."widgetSeparator"
  FOR ALL USING (auth.uid() = "profileId");

-- WIDGET TITLE
DROP POLICY IF EXISTS "Authenticated users can view all title widgets" ON public."widgetTitle";
DROP POLICY IF EXISTS "Users can view their own title widgets" ON public."widgetTitle";
DROP POLICY IF EXISTS "Users can manage their own title widgets" ON public."widgetTitle";

CREATE POLICY "Users can view their own title widgets" ON public."widgetTitle"
  FOR SELECT USING (
    auth.uid() = "profileId" OR
    "profileId" IN (SELECT id FROM profiles WHERE "isPublic" = true)
  );

CREATE POLICY "Users can manage their own title widgets" ON public."widgetTitle"
  FOR ALL USING (auth.uid() = "profileId");

-- Commit the changes
COMMIT;
