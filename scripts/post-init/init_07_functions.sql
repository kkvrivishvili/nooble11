-- Nooble8 Functions and Triggers
-- Version: 4.2 - camelCase with proper permissions
-- Description: Helper functions and automation with camelCase convention

-- Function: Generate deterministic conversation ID
CREATE OR REPLACE FUNCTION generate_conversation_id(
  p_tenant_id uuid,
  p_session_id uuid,
  p_agent_id uuid
) RETURNS uuid AS $$
BEGIN
  -- Use a fixed namespace for Nooble8 conversations
  RETURN uuid_generate_v5(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, -- Fixed namespace
    p_tenant_id::text || ':' || p_session_id::text || ':' || p_agent_id::text
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Create widget helper
CREATE OR REPLACE FUNCTION create_widget(
  p_profile_id uuid,
  p_widget_type text,
  p_widget_data jsonb
) RETURNS uuid AS $$
DECLARE
  v_widget_id uuid;
  v_position integer;
BEGIN
  -- Generate widget ID
  v_widget_id := gen_random_uuid();
  
  -- Get next position
  SELECT COALESCE(MAX((w->>'position')::integer), -1) + 1
  INTO v_position
  FROM profiles p, jsonb_array_elements(p.widgets) w
  WHERE p.id = p_profile_id;
  
  -- Add to profile widgets array
  UPDATE profiles
  SET widgets = widgets || jsonb_build_array(
    jsonb_build_object(
      'id', v_widget_id,
      'type', p_widget_type,
      'position', v_position,
      'isActive', true
    )
  ),
  "updatedAt" = now()
  WHERE id = p_profile_id;
  
  -- Insert widget data into appropriate table
  CASE p_widget_type
    WHEN 'gallery' THEN
      INSERT INTO "widgetGallery" (id, "profileId", title, products, "showPrice", "showDescription", columns)
      VALUES (v_widget_id, p_profile_id, 
              p_widget_data->>'title', 
              COALESCE(p_widget_data->'products', '[]'::jsonb),
              COALESCE((p_widget_data->>'showPrice')::boolean, true),
              COALESCE((p_widget_data->>'showDescription')::boolean, true),
              COALESCE((p_widget_data->>'columns')::integer, 3));
    WHEN 'agents' THEN
      INSERT INTO "widgetAgents" (id, "profileId", title, "agentIds", "displayStyle")
      VALUES (v_widget_id, p_profile_id,
              COALESCE(p_widget_data->>'title', 'Chat con nuestros agentes'),
              COALESCE(p_widget_data->'agentIds', '[]'::jsonb),
              COALESCE(p_widget_data->>'displayStyle', 'card'));
    WHEN 'youtube' THEN
      INSERT INTO "widgetYoutube" (id, "profileId", "videoUrl", title, autoplay, "showControls")
      VALUES (v_widget_id, p_profile_id,
              p_widget_data->>'videoUrl',
              p_widget_data->>'title',
              COALESCE((p_widget_data->>'autoplay')::boolean, false),
              COALESCE((p_widget_data->>'showControls')::boolean, true));
    WHEN 'maps' THEN
      INSERT INTO "widgetMaps" (id, "profileId", address, latitude, longitude, "zoomLevel", "mapStyle")
      VALUES (v_widget_id, p_profile_id,
              p_widget_data->>'address',
              (p_widget_data->>'latitude')::decimal,
              (p_widget_data->>'longitude')::decimal,
              COALESCE((p_widget_data->>'zoomLevel')::integer, 15),
              COALESCE(p_widget_data->>'mapStyle', 'roadmap'));
    WHEN 'spotify' THEN
      INSERT INTO "widgetSpotify" (id, "profileId", "spotifyUrl", "embedType", height, theme)
      VALUES (v_widget_id, p_profile_id, 
              p_widget_data->>'spotifyUrl',
              COALESCE(p_widget_data->>'embedType', 'playlist'),
              COALESCE((p_widget_data->>'height')::integer, 380),
              COALESCE(p_widget_data->>'theme', 'dark'));
    WHEN 'calendar' THEN
      INSERT INTO "widgetCalendar" (id, "profileId", "calendlyUrl", title, "hideEventDetails", "hideCookieBanner")
      VALUES (v_widget_id, p_profile_id,
              p_widget_data->>'calendlyUrl',
              COALESCE(p_widget_data->>'title', 'Schedule a meeting'),
              COALESCE((p_widget_data->>'hideEventDetails')::boolean, false),
              COALESCE((p_widget_data->>'hideCookieBanner')::boolean, true));
    WHEN 'separator' THEN
      INSERT INTO "widgetSeparator" (id, "profileId", style, thickness, color, "marginTop", "marginBottom")
      VALUES (v_widget_id, p_profile_id,
              COALESCE(p_widget_data->>'style', 'solid'),
              COALESCE((p_widget_data->>'thickness')::integer, 1),
              COALESCE(p_widget_data->>'color', '#cccccc'),
              COALESCE((p_widget_data->>'marginTop')::integer, 20),
              COALESCE((p_widget_data->>'marginBottom')::integer, 20));
    WHEN 'title' THEN
      INSERT INTO "widgetTitle" (id, "profileId", text, "fontSize", "textAlign", "fontWeight")
      VALUES (v_widget_id, p_profile_id,
              p_widget_data->>'text',
              COALESCE(p_widget_data->>'fontSize', 'xl'),
              COALESCE(p_widget_data->>'textAlign', 'center'),
              COALESCE(p_widget_data->>'fontWeight', 'bold'));
    WHEN 'link' THEN
      INSERT INTO "widgetLinks" (id, "profileId", title, url, description, icon)
      VALUES (v_widget_id, p_profile_id,
              p_widget_data->>'title',
              p_widget_data->>'url',
              p_widget_data->>'description',
              p_widget_data->>'icon');
  END CASE;
  
  RETURN v_widget_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Reorder widgets
CREATE OR REPLACE FUNCTION reorder_widgets(
  p_profile_id uuid,
  p_widget_ids uuid[]
) RETURNS void AS $$
DECLARE
  v_widgets jsonb;
  v_widget jsonb;
  v_new_widgets jsonb := '[]'::jsonb;
  v_position integer := 0;
  v_widget_id uuid;
BEGIN
  -- Get current widgets
  SELECT widgets INTO v_widgets
  FROM profiles
  WHERE id = p_profile_id;
  
  -- Rebuild widgets array in new order
  FOREACH v_widget_id IN ARRAY p_widget_ids LOOP
    FOR v_widget IN SELECT * FROM jsonb_array_elements(v_widgets) LOOP
      IF (v_widget->>'id')::uuid = v_widget_id THEN
        v_new_widgets := v_new_widgets || jsonb_set(
          v_widget,
          '{position}',
          to_jsonb(v_position)
        );
        v_position := v_position + 1;
        EXIT;
      END IF;
    END LOOP;
  END LOOP;
  
  -- Update profile
  UPDATE profiles
  SET widgets = v_new_widgets,
      "updatedAt" = now()
  WHERE id = p_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Copy agent from template
CREATE OR REPLACE FUNCTION copy_agent_from_template(
  p_user_id uuid,
  p_template_id uuid,
  p_agent_name text DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_template record;
  v_agent_id uuid;
BEGIN
  -- Get template
  SELECT * INTO v_template
  FROM "agentTemplates"
  WHERE id = p_template_id AND "isActive" = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template not found or inactive';
  END IF;
  
  -- Create agent
  INSERT INTO agents (
    "userId",
    "templateId",
    name,
    description,
    icon,
    "systemPromptOverride",
    "queryConfig",
    "ragConfig",
    "executionConfig"
  ) VALUES (
    p_user_id,
    p_template_id,
    COALESCE(p_agent_name, v_template.name),
    v_template.description,
    v_template.icon,
    NULL, -- No override initially
    v_template."defaultQueryConfig",
    v_template."defaultRagConfig",
    v_template."defaultExecutionConfig"
  ) RETURNING id INTO v_agent_id;
  
  -- Add agent ID to user's profile
  UPDATE profiles
  SET agents = agents || to_jsonb(v_agent_id::text),
      "updatedAt" = now()
  WHERE id = p_user_id;
  
  RETURN v_agent_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Simplified handle_new_user (without links column)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, "displayName", description, avatar, "socialLinks", agents, widgets)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substring(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'displayName', NEW.email),
    'Bienvenido a mi Nooble',
    COALESCE(NEW.raw_user_meta_data->>'avatar', ''),
    '[]'::jsonb,
    '[]'::jsonb,
    '[]'::jsonb
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Re-create trigger after updating function
DROP TRIGGER IF EXISTS "onAuthUserCreated" ON auth.users;
CREATE TRIGGER "onAuthUserCreated"
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- IMPORTANT: Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION create_widget TO authenticated;
GRANT EXECUTE ON FUNCTION create_widget TO anon;
GRANT EXECUTE ON FUNCTION reorder_widgets TO authenticated;
GRANT EXECUTE ON FUNCTION copy_agent_from_template TO authenticated;
GRANT EXECUTE ON FUNCTION generate_conversation_id TO authenticated;
GRANT EXECUTE ON FUNCTION generate_conversation_id TO anon;