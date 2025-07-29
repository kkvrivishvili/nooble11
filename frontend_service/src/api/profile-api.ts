// src/api/profile-api.ts
import { supabase } from '@/lib/supabase';
import { 
  Profile, 
  ProfileWithAgents, 
  ProfileUpdatePayload, 
  ProfileLink,
  Agent,
  Widget,
  WidgetAgents,
  WidgetGallery
} from '@/types/profile';

class ProfileAPI {
  /**
   * Get the current user's profile with all related data
   */
  async getMyProfile(): Promise<ProfileWithAgents | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Get base profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return null;
    }

    // Ensure widgets are sorted by position - using slice() to avoid mutation
    const widgets = (profile.widgets || []) as Widget[];
    const sortedWidgets = widgets.length > 0 
      ? widgets.slice().sort((a, b) => a.position - b.position) 
      : [];

    // Get agents details
    const agentIds = (profile.agents || []) as string[];
    let agentDetails: Agent[] = [];
    
    if (agentIds.length > 0) {
      const { data: agents, error: agentsError } = await supabase
        .from('agents_with_prompt') // Using the view to get systemPrompt
        .select('*')
        .in('id', agentIds);

      if (!agentsError && agents) {
        agentDetails = agents;
      }
    }

    // Get all widget data based on active widgets
    const activeWidgets = sortedWidgets.filter((w: Widget) => w.isActive);
    
    // Separate widget IDs by type
    const widgetIdsByType = activeWidgets.reduce((acc, widget) => {
      if (!acc[widget.type]) {
        acc[widget.type] = [];
      }
      acc[widget.type].push(widget.id);
      return acc;
    }, {} as Record<string, string[]>);

    // Fetch all widget data in parallel - RLS policies handle access control
    const [
      linkWidgets,
      agentWidgets,
      galleryWidgets,
      youtubeWidgets,
      mapsWidgets,
      spotifyWidgets,
      calendarWidgets,
      separatorWidgets,
      titleWidgets
    ] = await Promise.all([
      // Link widgets - RLS policies will filter by authenticated user
      widgetIdsByType.link?.length > 0
        ? supabase.from('widgetLinks').select('*').in('id', widgetIdsByType.link)
        : Promise.resolve({ data: [] }),
      
      // Agent widgets - RLS policies will filter by authenticated user
      widgetIdsByType.agents?.length > 0
        ? supabase.from('widgetAgents').select('*').in('id', widgetIdsByType.agents)
        : Promise.resolve({ data: [] }),
      
      // Gallery widgets - RLS policies will filter by authenticated user
      widgetIdsByType.gallery?.length > 0
        ? supabase.from('widgetGallery').select('*').in('id', widgetIdsByType.gallery)
        : Promise.resolve({ data: [] }),
      
      // YouTube widgets - RLS policies will filter by authenticated user
      widgetIdsByType.youtube?.length > 0
        ? supabase.from('widgetYoutube').select('*').in('id', widgetIdsByType.youtube)
        : Promise.resolve({ data: [] }),
      
      // Maps widgets - RLS policies will filter by authenticated user
      widgetIdsByType.maps?.length > 0
        ? supabase.from('widgetMaps').select('*').in('id', widgetIdsByType.maps)
        : Promise.resolve({ data: [] }),
      
      // Spotify widgets - RLS policies will filter by authenticated user
      widgetIdsByType.spotify?.length > 0
        ? supabase.from('widgetSpotify').select('*').in('id', widgetIdsByType.spotify)
        : Promise.resolve({ data: [] }),
      
      // Calendar widgets - RLS policies will filter by authenticated user
      widgetIdsByType.calendar?.length > 0
        ? supabase.from('widgetCalendar').select('*').in('id', widgetIdsByType.calendar)
        : Promise.resolve({ data: [] }),
      
      // Separator widgets - RLS policies will filter by authenticated user
      widgetIdsByType.separator?.length > 0
        ? supabase.from('widgetSeparator').select('*').in('id', widgetIdsByType.separator)
        : Promise.resolve({ data: [] }),
      
      // Title widgets - RLS policies will filter by authenticated user
      widgetIdsByType.title?.length > 0
        ? supabase.from('widgetTitle').select('*').in('id', widgetIdsByType.title)
        : Promise.resolve({ data: [] })
    ]);

    // Sort widget data according to widget order
    const sortWidgetData = <T extends { id: string }>(
      widgetData: T[] | null,
      widgetIds: string[]
    ): T[] => {
      if (!widgetData || !widgetIds) return [];
      const dataMap = new Map(widgetData.map(item => [item.id, item]));
      return widgetIds
        .map(id => dataMap.get(id))
        .filter((item): item is T => item !== undefined);
    };

    // Construct the full profile
    const fullProfile: ProfileWithAgents = {
      ...profile,
      widgets: sortedWidgets,
      agentDetails,
      linkWidgets: sortWidgetData(linkWidgets.data, widgetIdsByType.link || []),
      agentWidgets: sortWidgetData(agentWidgets.data, widgetIdsByType.agents || []),
      galleryWidgets: sortWidgetData(galleryWidgets.data, widgetIdsByType.gallery || []),
      youtubeWidgets: sortWidgetData(youtubeWidgets.data, widgetIdsByType.youtube || []),
      mapsWidgets: sortWidgetData(mapsWidgets.data, widgetIdsByType.maps || []),
      spotifyWidgets: sortWidgetData(spotifyWidgets.data, widgetIdsByType.spotify || []),
      calendarWidgets: sortWidgetData(calendarWidgets.data, widgetIdsByType.calendar || []),
      separatorWidgets: sortWidgetData(separatorWidgets.data, widgetIdsByType.separator || []),
      titleWidgets: sortWidgetData(titleWidgets.data, widgetIdsByType.title || [])
    };

    return fullProfile;
  }

  /**
   * Get a profile by username (public view)
   */
  async getProfileByUsername(username: string): Promise<ProfileWithAgents | null> {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .eq('isPublic', true)
      .single();

    if (profileError || !profile) {
      return null;
    }

    // Ensure widgets are sorted by position
    const widgets = (profile.widgets || []) as Widget[];
    const sortedWidgets = widgets.length > 0 
      ? widgets.slice().sort((a, b) => a.position - b.position) 
      : [];

    // Get public agents
    const agentIds = (profile.agents || []) as string[];
    let agentDetails: Agent[] = [];
    
    if (agentIds.length > 0) {
      const { data: agents } = await supabase
        .from('agents_with_prompt')
        .select('*')
        .in('id', agentIds)
        .eq('isPublic', true)
        .eq('isActive', true);

      if (agents) {
        agentDetails = agents;
      }
    }

    // Get active widgets only
    const activeWidgets = sortedWidgets.filter((w: Widget) => w.isActive);
    
    // Separate widget IDs by type
    const widgetIdsByType = activeWidgets.reduce((acc, widget) => {
      if (!acc[widget.type]) {
        acc[widget.type] = [];
      }
      acc[widget.type].push(widget.id);
      return acc;
    }, {} as Record<string, string[]>);

    // Fetch all widget data in parallel - RLS policies handle access control
    const [
      linkWidgets,
      agentWidgets,
      galleryWidgets,
      youtubeWidgets,
      mapsWidgets,
      spotifyWidgets,
      calendarWidgets,
      separatorWidgets,
      titleWidgets
    ] = await Promise.all([
      widgetIdsByType.link?.length > 0
        ? supabase.from('widgetLinks').select('*').in('id', widgetIdsByType.link).eq('profileId', profile.id)
        : Promise.resolve({ data: [] }),
      widgetIdsByType.agents?.length > 0
        ? supabase.from('widgetAgents').select('*').in('id', widgetIdsByType.agents).eq('profileId', profile.id)
        : Promise.resolve({ data: [] }),
      widgetIdsByType.gallery?.length > 0
        ? supabase.from('widgetGallery').select('*').in('id', widgetIdsByType.gallery).eq('profileId', profile.id)
        : Promise.resolve({ data: [] }),
      widgetIdsByType.youtube?.length > 0
        ? supabase.from('widgetYoutube').select('*').in('id', widgetIdsByType.youtube).eq('profileId', profile.id)
        : Promise.resolve({ data: [] }),
      widgetIdsByType.maps?.length > 0
        ? supabase.from('widgetMaps').select('*').in('id', widgetIdsByType.maps).eq('profileId', profile.id)
        : Promise.resolve({ data: [] }),
      widgetIdsByType.spotify?.length > 0
        ? supabase.from('widgetSpotify').select('*').in('id', widgetIdsByType.spotify).eq('profileId', profile.id)
        : Promise.resolve({ data: [] }),
      widgetIdsByType.calendar?.length > 0
        ? supabase.from('widgetCalendar').select('*').in('id', widgetIdsByType.calendar).eq('profileId', profile.id)
        : Promise.resolve({ data: [] }),
      widgetIdsByType.separator?.length > 0
        ? supabase.from('widgetSeparator').select('*').in('id', widgetIdsByType.separator).eq('profileId', profile.id)
        : Promise.resolve({ data: [] }),
      widgetIdsByType.title?.length > 0
        ? supabase.from('widgetTitle').select('*').in('id', widgetIdsByType.title).eq('profileId', profile.id)
        : Promise.resolve({ data: [] })
    ]);

    // Sort widget data according to widget order
    const sortWidgetData = <T extends { id: string }>(
      widgetData: T[] | null,
      widgetIds: string[]
    ): T[] => {
      if (!widgetData || !widgetIds) return [];
      const dataMap = new Map(widgetData.map(item => [item.id, item]));
      return widgetIds
        .map(id => dataMap.get(id))
        .filter((item): item is T => item !== undefined);
    };

    // Filter agent widgets to only show public agents
    const filteredAgentWidgets = agentWidgets.data?.map(widget => ({
      ...widget,
      agentIds: (widget.agentIds || []).filter((agentId: string) =>
        agentDetails.some(agent => agent.id === agentId)
      )
    })) || [];

    return {
      ...profile,
      widgets: sortedWidgets,
      agentDetails,
      linkWidgets: sortWidgetData(linkWidgets.data, widgetIdsByType.link || []),
      agentWidgets: sortWidgetData(filteredAgentWidgets, widgetIdsByType.agents || []),
      galleryWidgets: sortWidgetData(galleryWidgets.data, widgetIdsByType.gallery || []),
      youtubeWidgets: sortWidgetData(youtubeWidgets.data, widgetIdsByType.youtube || []),
      mapsWidgets: sortWidgetData(mapsWidgets.data, widgetIdsByType.maps || []),
      spotifyWidgets: sortWidgetData(spotifyWidgets.data, widgetIdsByType.spotify || []),
      calendarWidgets: sortWidgetData(calendarWidgets.data, widgetIdsByType.calendar || []),
      separatorWidgets: sortWidgetData(separatorWidgets.data, widgetIdsByType.separator || []),
      titleWidgets: sortWidgetData(titleWidgets.data, widgetIdsByType.title || [])
    };
  }

  /**
   * Update profile basic info
   */
  async updateProfile(payload: ProfileUpdatePayload): Promise<Profile> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Check if a username is available
   */
  async isUsernameAvailable(username: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (error) throw error;
    return !data;
  }

  /**
   * Create a new link widget
   */
  async createLinkWidget(profileId: string, link: Omit<ProfileLink, 'id' | 'createdAt'>): Promise<string> {
    const { data: widgetId, error } = await supabase
      .rpc('create_widget', {
        p_profile_id: profileId,
        p_widget_type: 'link',
        p_widget_data: {
          title: link.title,
          url: link.url,
          description: link.description,
          icon: link.icon
        }
      });

    if (error) throw error;
    return widgetId;
  }

  /**
   * Update a link widget
   */
  async updateLinkWidget(widgetId: string, data: Partial<ProfileLink>): Promise<void> {
    const { error } = await supabase
      .from('widgetLinks')
      .update(data)
      .eq('id', widgetId);

    if (error) throw error;
  }

  /**
   * Delete a widget (removes from profile.widgets and widget table)
   */
  async deleteWidget(profileId: string, widgetId: string, _widgetType: string): Promise<void> {
    // First, remove from profile.widgets array
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('widgets')
      .eq('id', profileId)
      .single();

    if (fetchError) throw fetchError;

    const widgets = (profile.widgets || []) as Widget[];
    const updatedWidgets = widgets.filter((w: Widget) => w.id !== widgetId);
    
    // Recalculate positions to ensure continuous sequence
    const reorderedWidgets = updatedWidgets.map((w, index) => ({
      ...w,
      position: index
    }));

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ widgets: reorderedWidgets })
      .eq('id', profileId);

    if (updateError) throw updateError;

    // Widget data will be cascade deleted automatically
  }

  /**
   * Reorder widgets
   */
  async reorderWidgets(profileId: string, widgetIds: string[]): Promise<void> {
    const { error } = await supabase
      .rpc('reorder_widgets', {
        p_profile_id: profileId,
        p_widget_ids: widgetIds
      });

    if (error) throw error;
  }

  /**
   * Create a new agent from template
   */
  async createAgentFromTemplate(templateId: string, name?: string): Promise<Agent> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data: agentId, error } = await supabase
      .rpc('copy_agent_from_template', {
        p_user_id: user.id,
        p_template_id: templateId,
        p_agent_name: name
      });

    if (error) throw error;

    // Fetch the created agent
    const { data: agent, error: fetchError } = await supabase
      .from('agents_with_prompt')
      .select('*')
      .eq('id', agentId)
      .single();

    if (fetchError) throw fetchError;
    return agent;
  }

  /**
   * Update an agent
   */
  async updateAgent(agentId: string, data: Partial<Agent>): Promise<void> {
    const { error } = await supabase
      .from('agents')
      .update(data)
      .eq('id', agentId);

    if (error) throw error;
  }

  /**
   * Delete an agent
   */
  async deleteAgent(profileId: string, agentId: string): Promise<void> {
    // Remove from profile.agents array
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('agents')
      .eq('id', profileId)
      .single();

    if (fetchError) throw fetchError;

    const updatedAgents = (profile.agents || []).filter(
      (id: string) => id !== agentId
    );

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ agents: updatedAgents })
      .eq('id', profileId);

    if (updateError) throw updateError;

    // Delete the agent (will cascade delete conversations, etc.)
    const { error: deleteError } = await supabase
      .from('agents')
      .delete()
      .eq('id', agentId);

    if (deleteError) throw deleteError;
  }

  /**
   * Get available agent templates
   */
  async getAgentTemplates() {
    const { data, error } = await supabase
      .from('agentTemplates')
      .select('*')
      .eq('isActive', true)
      .order('name');

    if (error) throw error;
    return data;
  }

  /**
   * Create a new agents widget
   */
  async createAgentsWidget(profileId: string, agentsData: {
    title: string;
    agentIds: string[];
    displayStyle: 'card' | 'list' | 'bubble';
  }): Promise<string> {
    const { data: widgetId, error } = await supabase
      .rpc('create_widget', {
        p_profile_id: profileId,
        p_widget_type: 'agents',
        p_widget_data: {
          title: agentsData.title,
          agentIds: agentsData.agentIds,
          displayStyle: agentsData.displayStyle
        }
      });

    if (error) throw error;
    return widgetId;
  }

  /**
   * Update an agents widget
   */
  async updateAgentsWidget(widgetId: string, data: {
    title?: string;
    agentIds?: string[];
    displayStyle?: 'card' | 'list' | 'bubble';
  }): Promise<void> {
    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.agentIds !== undefined) updateData.agentIds = data.agentIds;
    if (data.displayStyle !== undefined) updateData.displayStyle = data.displayStyle;

    const { error } = await supabase
      .from('widgetAgents')
      .update(updateData)
      .eq('id', widgetId);

    if (error) throw error;
  }

  /**
   * Create a new gallery widget
   */
  async createGalleryWidget(profileId: string, gallery: {
    title?: string;
    products: string[];
    showPrice?: boolean;
    showDescription?: boolean;
    columns?: number;
  }): Promise<string> {
    const { data: widgetId, error } = await supabase
      .rpc('create_widget', {
        p_profile_id: profileId,
        p_widget_type: 'gallery',
        p_widget_data: {
          title: gallery.title || '',
          products: gallery.products || [],
          showPrice: gallery.showPrice ?? true,
          showDescription: gallery.showDescription ?? true,
          columns: gallery.columns || 3
        }
      });

    if (error) throw error;
    return widgetId;
  }

  /**
   * Update a gallery widget
   */
  async updateGalleryWidget(widgetId: string, data: {
    title?: string;
    products?: string[];
    showPrice?: boolean;
    showDescription?: boolean;
    columns?: number;
  }): Promise<void> {
    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.products !== undefined) updateData.products = data.products;
    if (data.showPrice !== undefined) updateData.showPrice = data.showPrice;
    if (data.showDescription !== undefined) updateData.showDescription = data.showDescription;
    if (data.columns !== undefined) updateData.columns = data.columns;

    const { error } = await supabase
      .from('widgetGallery')
      .update(updateData)
      .eq('id', widgetId);

    if (error) throw error;
  }

  /**
   * Create a new YouTube widget
   */
  async createYouTubeWidget(profileId: string, youtube: {
    videoUrl: string;
    title?: string;
    autoplay?: boolean;
    showControls?: boolean;
  }): Promise<string> {
    const { data: widgetId, error } = await supabase
      .rpc('create_widget', {
        p_profile_id: profileId,
        p_widget_type: 'youtube',
        p_widget_data: {
          videoUrl: youtube.videoUrl,
          title: youtube.title || '',
          autoplay: youtube.autoplay ?? false,
          showControls: youtube.showControls ?? true
        }
      });

    if (error) throw error;
    return widgetId;
  }

  /**
   * Update a YouTube widget
   */
  async updateYouTubeWidget(widgetId: string, data: {
    videoUrl?: string;
    title?: string;
    autoplay?: boolean;
    showControls?: boolean;
  }): Promise<void> {
    const { error } = await supabase
      .from('widgetYoutube')
      .update(data)
      .eq('id', widgetId);

    if (error) throw error;
  }

  /**
   * Create a new Maps widget
   */
  async createMapsWidget(profileId: string, maps: {
    address: string;
    latitude?: number;
    longitude?: number;
    zoomLevel?: number;
    mapStyle?: string;
  }): Promise<string> {
    const { data: widgetId, error } = await supabase
      .rpc('create_widget', {
        p_profile_id: profileId,
        p_widget_type: 'maps',
        p_widget_data: {
          address: maps.address,
          latitude: maps.latitude,
          longitude: maps.longitude,
          zoomLevel: maps.zoomLevel || 15,
          mapStyle: maps.mapStyle || 'roadmap'
        }
      });

    if (error) throw error;
    return widgetId;
  }

  /**
   * Update a Maps widget
   */
  async updateMapsWidget(widgetId: string, data: {
    address?: string;
    latitude?: number;
    longitude?: number;
    zoomLevel?: number;
    mapStyle?: string;
  }): Promise<void> {
    const { error } = await supabase
      .from('widgetMaps')
      .update(data)
      .eq('id', widgetId);

    if (error) throw error;
  }

  /**
   * Create a new Spotify widget
   */
  async createSpotifyWidget(profileId: string, spotify: {
    spotifyUrl: string;
    embedType?: 'track' | 'playlist' | 'album' | 'artist';
    height?: number;
    theme?: 'dark' | 'light';
  }): Promise<string> {
    const { data: widgetId, error } = await supabase
      .rpc('create_widget', {
        p_profile_id: profileId,
        p_widget_type: 'spotify',
        p_widget_data: {
          spotifyUrl: spotify.spotifyUrl,
          embedType: spotify.embedType || 'playlist',
          height: spotify.height || 380,
          theme: spotify.theme || 'dark'
        }
      });

    if (error) throw error;
    return widgetId;
  }

  /**
   * Update a Spotify widget
   */
  async updateSpotifyWidget(widgetId: string, data: {
    spotifyUrl?: string;
    embedType?: 'track' | 'playlist' | 'album' | 'artist';
    height?: number;
    theme?: 'dark' | 'light';
  }): Promise<void> {
    const { error } = await supabase
      .from('widgetSpotify')
      .update(data)
      .eq('id', widgetId);

    if (error) throw error;
  }

  /**
   * Create a new Calendar widget
   */
  async createCalendarWidget(profileId: string, calendar: {
    calendlyUrl: string;
    title?: string;
    hideEventDetails?: boolean;
    hideCookieBanner?: boolean;
  }): Promise<string> {
    const { data: widgetId, error } = await supabase
      .rpc('create_widget', {
        p_profile_id: profileId,
        p_widget_type: 'calendar',
        p_widget_data: {
          calendlyUrl: calendar.calendlyUrl,
          title: calendar.title || 'Schedule a meeting',
          hideEventDetails: calendar.hideEventDetails ?? false,
          hideCookieBanner: calendar.hideCookieBanner ?? true
        }
      });

    if (error) throw error;
    return widgetId;
  }

  /**
   * Update a Calendar widget
   */
  async updateCalendarWidget(widgetId: string, data: {
    calendlyUrl?: string;
    title?: string;
    hideEventDetails?: boolean;
    hideCookieBanner?: boolean;
  }): Promise<void> {
    const { error } = await supabase
      .from('widgetCalendar')
      .update(data)
      .eq('id', widgetId);

    if (error) throw error;
  }

  /**
   * Create a new Separator widget
   */
  async createSeparatorWidget(profileId: string, separator: {
    style?: 'solid' | 'dashed' | 'dotted';
    thickness?: number;
    color?: string;
    marginTop?: number;
    marginBottom?: number;
  }): Promise<string> {
    const { data: widgetId, error } = await supabase
      .rpc('create_widget', {
        p_profile_id: profileId,
        p_widget_type: 'separator',
        p_widget_data: {
          style: separator.style || 'solid',
          thickness: separator.thickness || 1,
          color: separator.color || '#cccccc',
          marginTop: separator.marginTop || 20,
          marginBottom: separator.marginBottom || 20
        }
      });

    if (error) throw error;
    return widgetId;
  }

  /**
   * Update a Separator widget
   */
  async updateSeparatorWidget(widgetId: string, data: {
    style?: 'solid' | 'dashed' | 'dotted';
    thickness?: number;
    color?: string;
    marginTop?: number;
    marginBottom?: number;
  }): Promise<void> {
    const { error } = await supabase
      .from('widgetSeparator')
      .update(data)
      .eq('id', widgetId);

    if (error) throw error;
  }

  /**
   * Create a new Title widget
   */
  async createTitleWidget(profileId: string, title: {
    text: string;
    fontSize?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
    textAlign?: 'left' | 'center' | 'right';
    fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';
  }): Promise<string> {
    const { data: widgetId, error } = await supabase
      .rpc('create_widget', {
        p_profile_id: profileId,
        p_widget_type: 'title',
        p_widget_data: {
          text: title.text,
          fontSize: title.fontSize || 'xl',
          textAlign: title.textAlign || 'center',
          fontWeight: title.fontWeight || 'bold'
        }
      });

    if (error) throw error;
    return widgetId;
  }

  /**
   * Update a Title widget
   */
  async updateTitleWidget(widgetId: string, data: {
    text?: string;
    fontSize?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
    textAlign?: 'left' | 'center' | 'right';
    fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';
  }): Promise<void> {
    const { error } = await supabase
      .from('widgetTitle')
      .update(data)
      .eq('id', widgetId);

    if (error) throw error;
  }

  /**
   * TEMPORARY FIX: Sync widgets for profiles where widgets exist in individual tables
   * but are not registered in the profile.widgets array
   */
  async syncProfileWidgets(profileId: string): Promise<void> {
    // Get current profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('widgets')
      .eq('id', profileId)
      .single();

    if (profileError || !profile) {
      throw new Error('Profile not found');
    }

    // If widgets array already has entries, skip sync
    if (profile.widgets && profile.widgets.length > 0) {
      return;
    }

    const widgetEntries = [];
    let position = 0;

    // Sync all widget types - RLS policies will handle filtering
    const widgetTables = [
      { table: 'widgetLinks', type: 'link' },
      { table: 'widgetAgents', type: 'agents' },
      { table: 'widgetGallery', type: 'gallery' },
      { table: 'widgetYoutube', type: 'youtube' },
      { table: 'widgetMaps', type: 'maps' },
      { table: 'widgetSpotify', type: 'spotify' },
      { table: 'widgetCalendar', type: 'calendar' },
      { table: 'widgetSeparator', type: 'separator' },
      { table: 'widgetTitle', type: 'title' }
    ];

    for (const { table, type } of widgetTables) {
      const { data: widgets } = await supabase
        .from(table)
        .select('id, createdAt')
        .order('createdAt', { ascending: true });

      if (widgets && widgets.length > 0) {
        for (const widget of widgets) {
          widgetEntries.push({
            id: widget.id,
            type: type,
            position: position++,
            isActive: true
          });
        }
      }
    }

    // Update profile with synced widgets
    if (widgetEntries.length > 0) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          widgets: widgetEntries,
          updatedAt: new Date().toISOString()
        })
        .eq('id', profileId);

      if (updateError) {
        throw updateError;
      }

      console.log(`✅ Synced ${widgetEntries.length} widgets to profile.widgets array`);
    } else {
      console.log('ℹ️ No widgets found to sync');
    }
  }
}

export const profileApi = new ProfileAPI();