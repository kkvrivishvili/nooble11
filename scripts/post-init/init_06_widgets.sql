-- Nooble8 Widgets Schema
-- Version: 4.0 - camelCase
-- Description: Individual widget tables for profile customization with camelCase convention

-- Widget: Links
CREATE TABLE public."widgetLinks" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "profileId" uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  url text NOT NULL,
  description text,
  icon text,
  "createdAt" timestamptz DEFAULT now()
);

-- Widget: Gallery
CREATE TABLE public."widgetGallery" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "profileId" uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text,
  products jsonb DEFAULT '[]'::jsonb, -- Array of product IDs to display
  "showPrice" boolean DEFAULT true,
  "showDescription" boolean DEFAULT true,
  columns integer DEFAULT 3 CHECK (columns BETWEEN 1 AND 4),
  "createdAt" timestamptz DEFAULT now()
);

-- Widget: Agents
CREATE TABLE public."widgetAgents" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "profileId" uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text DEFAULT 'Chat with our agents',
  "agentIds" jsonb DEFAULT '[]'::jsonb, -- Array of selected agent IDs
  "displayStyle" text DEFAULT 'card' CHECK ("displayStyle" IN ('card', 'list', 'bubble')),
  "createdAt" timestamptz DEFAULT now()
);

-- Widget: YouTube
CREATE TABLE public."widgetYoutube" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "profileId" uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  "videoUrl" text NOT NULL,
  title text,
  autoplay boolean DEFAULT false,
  "showControls" boolean DEFAULT true,
  "createdAt" timestamptz DEFAULT now()
);

-- Widget: Maps
CREATE TABLE public."widgetMaps" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "profileId" uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  address text NOT NULL,
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  "zoomLevel" integer DEFAULT 15 CHECK ("zoomLevel" BETWEEN 1 AND 20),
  "mapStyle" text DEFAULT 'roadmap',
  "createdAt" timestamptz DEFAULT now()
);

-- Widget: Spotify
CREATE TABLE public."widgetSpotify" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "profileId" uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  "spotifyUrl" text NOT NULL,
  "embedType" text DEFAULT 'playlist' CHECK ("embedType" IN ('track', 'playlist', 'album', 'artist')),
  height integer DEFAULT 380,
  theme text DEFAULT 'dark' CHECK (theme IN ('dark', 'light')),
  "createdAt" timestamptz DEFAULT now()
);

-- Widget: Calendar (Calendly)
CREATE TABLE public."widgetCalendar" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "profileId" uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  "calendlyUrl" text NOT NULL,
  title text DEFAULT 'Schedule a meeting',
  "hideEventDetails" boolean DEFAULT false,
  "hideCookieBanner" boolean DEFAULT true,
  "createdAt" timestamptz DEFAULT now()
);

-- Widget: Separator
CREATE TABLE public."widgetSeparator" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "profileId" uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  style text DEFAULT 'solid' CHECK (style IN ('solid', 'dashed', 'dotted')),
  thickness integer DEFAULT 1 CHECK (thickness BETWEEN 1 AND 5),
  color text DEFAULT '#cccccc',
  "marginTop" integer DEFAULT 20,
  "marginBottom" integer DEFAULT 20,
  "createdAt" timestamptz DEFAULT now()
);

-- Widget: Title
CREATE TABLE public."widgetTitle" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "profileId" uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text text NOT NULL,
  "fontSize" text DEFAULT 'xl' CHECK ("fontSize" IN ('sm', 'md', 'lg', 'xl', '2xl', '3xl')),
  "textAlign" text DEFAULT 'center' CHECK ("textAlign" IN ('left', 'center', 'right')),
  "fontWeight" text DEFAULT 'bold' CHECK ("fontWeight" IN ('normal', 'medium', 'semibold', 'bold')),
  "createdAt" timestamptz DEFAULT now()
);

-- Create indexes for all widget tables
CREATE INDEX idx_widget_links_profile ON public."widgetLinks"("profileId");
CREATE INDEX idx_widget_gallery_profile ON public."widgetGallery"("profileId");
CREATE INDEX idx_widget_agents_profile ON public."widgetAgents"("profileId");
CREATE INDEX idx_widget_youtube_profile ON public."widgetYoutube"("profileId");
CREATE INDEX idx_widget_maps_profile ON public."widgetMaps"("profileId");
CREATE INDEX idx_widget_spotify_profile ON public."widgetSpotify"("profileId");
CREATE INDEX idx_widget_calendar_profile ON public."widgetCalendar"("profileId");
CREATE INDEX idx_widget_separator_profile ON public."widgetSeparator"("profileId");
CREATE INDEX idx_widget_title_profile ON public."widgetTitle"("profileId");