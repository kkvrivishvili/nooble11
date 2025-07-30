-- Add this migration to update the design jsonb structure
-- Migration: Update design structure to support enhanced customization

-- Update the default design structure for new profiles
ALTER TABLE public.profiles 
ALTER COLUMN design SET DEFAULT '{
  "theme": {
    "primaryColor": "#000000",
    "backgroundColor": "#ffffff",
    "textColor": "#111827",
    "buttonTextColor": "#ffffff",
    "borderRadius": "curved",
    "buttonFill": "solid",
    "buttonShadow": "subtle",
    "fontFamily": "sans",
    "wallpaper": {
      "type": "fill",
      "fillColor": "#ffffff"
    }
  },
  "layout": {
    "linkStyle": "card",
    "socialPosition": "top",
    "contentWidth": "normal",
    "spacing": "normal",
    "showChatInput": true
  },
  "version": 2
}'::jsonb;

-- Function to migrate existing profiles to new design structure
CREATE OR REPLACE FUNCTION migrate_profile_designs()
RETURNS void AS $$
DECLARE
  profile_record RECORD;
BEGIN
  FOR profile_record IN 
    SELECT id, design 
    FROM public.profiles 
    WHERE design IS NOT NULL 
    AND (design->>'version' IS NULL OR (design->>'version')::int < 2)
  LOOP
    UPDATE public.profiles
    SET design = jsonb_build_object(
      'theme', jsonb_build_object(
        'primaryColor', COALESCE(profile_record.design->'theme'->>'primaryColor', '#000000'),
        'backgroundColor', COALESCE(profile_record.design->'theme'->>'backgroundColor', '#ffffff'),
        'textColor', COALESCE(profile_record.design->'theme'->>'textColor', '#111827'),
        'buttonTextColor', COALESCE(profile_record.design->'theme'->>'buttonTextColor', '#ffffff'),
        'borderRadius', COALESCE(profile_record.design->'theme'->>'borderRadius', 'curved'),
        'buttonFill', COALESCE(profile_record.design->'theme'->>'buttonFill', 'solid'),
        'buttonShadow', COALESCE(profile_record.design->'theme'->>'buttonShadow', 'subtle'),
        'fontFamily', COALESCE(profile_record.design->'theme'->>'fontFamily', 'sans'),
        'wallpaper', COALESCE(
          profile_record.design->'theme'->'wallpaper',
          jsonb_build_object('type', 'fill', 'fillColor', '#ffffff')
        )
      ),
      'layout', jsonb_build_object(
        'linkStyle', COALESCE(profile_record.design->'layout'->>'linkStyle', 'card'),
        'socialPosition', COALESCE(profile_record.design->'layout'->>'socialPosition', 'top'),
        'contentWidth', COALESCE(profile_record.design->'layout'->>'contentWidth', 'normal'),
        'spacing', COALESCE(profile_record.design->'layout'->>'spacing', 'normal'),
        'showChatInput', COALESCE((profile_record.design->'layout'->>'showChatInput')::boolean, true)
      ),
      'version', 2
    ),
    "updatedAt" = now()
    WHERE id = profile_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run the migration
SELECT migrate_profile_designs();

-- Add validation for the enhanced design structure
CREATE OR REPLACE FUNCTION validate_profile_design()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure design has required structure
  IF NEW.design IS NOT NULL THEN
    -- Ensure it has theme object
    IF NEW.design->'theme' IS NULL THEN
      NEW.design = jsonb_set(NEW.design, '{theme}', '{}'::jsonb);
    END IF;
    
    -- Ensure it has layout object
    IF NEW.design->'layout' IS NULL THEN
      NEW.design = jsonb_set(NEW.design, '{layout}', '{}'::jsonb);
    END IF;
    
    -- Set version if not present
    IF NEW.design->>'version' IS NULL THEN
      NEW.design = jsonb_set(NEW.design, '{version}', '2'::jsonb);
    END IF;
    
    -- Validate wallpaper structure if present
    IF NEW.design->'theme'->'wallpaper' IS NOT NULL THEN
      DECLARE
        wallpaper_type text;
      BEGIN
        wallpaper_type := NEW.design->'theme'->'wallpaper'->>'type';
        
        -- Ensure wallpaper type is valid
        IF wallpaper_type NOT IN ('hero', 'fill', 'gradient', 'blur', 'pattern', 'image', 'video') THEN
          RAISE EXCEPTION 'Invalid wallpaper type: %', wallpaper_type;
        END IF;
      END;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for design validation
DROP TRIGGER IF EXISTS validate_profile_design_trigger ON public.profiles;
CREATE TRIGGER validate_profile_design_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION validate_profile_design();

-- Add comment explaining the enhanced design structure
COMMENT ON COLUMN public.profiles.design IS 'Enhanced design configuration supporting themes, layouts, and wallpapers. Structure: {
  theme: {
    primaryColor: string,
    backgroundColor: string,
    textColor: string,
    buttonTextColor: string,
    borderRadius: "sharp" | "curved" | "round",
    buttonFill: "solid" | "glass" | "outline",
    buttonShadow: "none" | "subtle" | "hard",
    fontFamily: "sans" | "serif" | "mono",
    wallpaper: {
      type: "hero" | "fill" | "gradient" | "blur" | "pattern" | "image" | "video",
      // Additional properties based on type
    }
  },
  layout: {
    linkStyle: "card" | "button" | "minimal",
    socialPosition: "top" | "bottom" | "hidden",
    contentWidth: "narrow" | "normal" | "wide",
    spacing: "compact" | "normal" | "relaxed",
    showChatInput: boolean
  },
  version: number
}';