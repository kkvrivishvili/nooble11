import { supabase } from '@/lib/supabase';
import { 
  Profile, 
  ProfileWithAgents, 
  ProfileLink,
  Agent,
  Widget,
  WidgetAgents,
  WidgetGallery
} from '@/types/profile';

class PublicProfileAPI {
  /**
   * Get a public profile by username with all related data
   * This method does not require authentication
   */
  async getPublicProfile(username: string): Promise<ProfileWithAgents | null> {
    if (!username) return null;

    // Get base profile by username
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching public profile:', profileError);
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

    // Get link widgets
    const linkWidgetIds = sortedWidgets
      .filter(w => w.type === 'link' && w.isActive)
      .map(w => w.id);
    
    let linkWidgets: ProfileLink[] = [];
    if (linkWidgetIds.length > 0) {
      const { data: links, error: linksError } = await supabase
        .from('profile_links')
        .select('*')
        .in('id', linkWidgetIds);
      
      if (!linksError && links) {
        linkWidgets = links;
      }
    }

    // Get agent widgets
    const agentWidgetIds = sortedWidgets
      .filter(w => w.type === 'agents' && w.isActive)
      .map(w => w.id);
    
    let agentWidgets: WidgetAgents[] = [];
    if (agentWidgetIds.length > 0) {
      const { data: agentWidgetsData, error: agentWidgetsError } = await supabase
        .from('widget_agents')
        .select('*')
        .in('id', agentWidgetIds);
      
      if (!agentWidgetsError && agentWidgetsData) {
        agentWidgets = agentWidgetsData;
      }
    }

    // Get separator widgets
    const separatorWidgetIds = sortedWidgets
      .filter(w => w.type === 'separator' && w.isActive)
      .map(w => w.id);
    
    let separatorWidgets: any[] = [];
    if (separatorWidgetIds.length > 0) {
      const { data: separatorWidgetsData, error: separatorWidgetsError } = await supabase
        .from('widget_separators')
        .select('*')
        .in('id', separatorWidgetIds);
      
      if (!separatorWidgetsError && separatorWidgetsData) {
        separatorWidgets = separatorWidgetsData;
      }
    }

    // Get title widgets
    const titleWidgetIds = sortedWidgets
      .filter(w => w.type === 'title' && w.isActive)
      .map(w => w.id);
    
    let titleWidgets: any[] = [];
    if (titleWidgetIds.length > 0) {
      const { data: titleWidgetsData, error: titleWidgetsError } = await supabase
        .from('widget_titles')
        .select('*')
        .in('id', titleWidgetIds);
      
      if (!titleWidgetsError && titleWidgetsData) {
        titleWidgets = titleWidgetsData;
      }
    }

    // Get gallery widgets
    const galleryWidgetIds = sortedWidgets
      .filter(w => w.type === 'gallery' && w.isActive)
      .map(w => w.id);
    
    let galleryWidgets: WidgetGallery[] = [];
    if (galleryWidgetIds.length > 0) {
      const { data: galleryWidgetsData, error: galleryWidgetsError } = await supabase
        .from('widget_galleries')
        .select('*')
        .in('id', galleryWidgetIds);
      
      if (!galleryWidgetsError && galleryWidgetsData) {
        galleryWidgets = galleryWidgetsData;
      }
    }

    // Get YouTube widgets
    const youtubeWidgetIds = sortedWidgets
      .filter(w => w.type === 'youtube' && w.isActive)
      .map(w => w.id);
    
    let youtubeWidgets: any[] = [];
    if (youtubeWidgetIds.length > 0) {
      const { data: youtubeWidgetsData, error: youtubeWidgetsError } = await supabase
        .from('widget_youtubes')
        .select('*')
        .in('id', youtubeWidgetIds);
      
      if (!youtubeWidgetsError && youtubeWidgetsData) {
        youtubeWidgets = youtubeWidgetsData;
      }
    }

    // Get Maps widgets
    const mapsWidgetIds = sortedWidgets
      .filter(w => w.type === 'maps' && w.isActive)
      .map(w => w.id);
    
    let mapsWidgets: any[] = [];
    if (mapsWidgetIds.length > 0) {
      const { data: mapsWidgetsData, error: mapsWidgetsError } = await supabase
        .from('widget_maps')
        .select('*')
        .in('id', mapsWidgetIds);
      
      if (!mapsWidgetsError && mapsWidgetsData) {
        mapsWidgets = mapsWidgetsData;
      }
    }

    // Get Spotify widgets
    const spotifyWidgetIds = sortedWidgets
      .filter(w => w.type === 'spotify' && w.isActive)
      .map(w => w.id);
    
    let spotifyWidgets: any[] = [];
    if (spotifyWidgetIds.length > 0) {
      const { data: spotifyWidgetsData, error: spotifyWidgetsError } = await supabase
        .from('widget_spotifies')
        .select('*')
        .in('id', spotifyWidgetIds);
      
      if (!spotifyWidgetsError && spotifyWidgetsData) {
        spotifyWidgets = spotifyWidgetsData;
      }
    }

    // Get Calendar widgets
    const calendarWidgetIds = sortedWidgets
      .filter(w => w.type === 'calendar' && w.isActive)
      .map(w => w.id);
    
    let calendarWidgets: any[] = [];
    if (calendarWidgetIds.length > 0) {
      const { data: calendarWidgetsData, error: calendarWidgetsError } = await supabase
        .from('widget_calendars')
        .select('*')
        .in('id', calendarWidgetIds);
      
      if (!calendarWidgetsError && calendarWidgetsData) {
        calendarWidgets = calendarWidgetsData;
      }
    }

    // Construct the complete profile object
    const profileWithAgents: ProfileWithAgents = {
      ...profile,
      widgets: sortedWidgets,
      agentDetails,
      linkWidgets,
      agentWidgets,
      separatorWidgets,
      titleWidgets,
      galleryWidgets,
      youtubeWidgets,
      mapsWidgets,
      spotifyWidgets,
      calendarWidgets
    };

    return profileWithAgents;
  }

  /**
   * Get only the basic profile information by username
   * This method does not require authentication
   */
  async getPublicProfileBasic(username: string): Promise<Profile | null> {
    if (!username) return null;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, username, display_name, description, avatar, social_links')
      .eq('username', username)
      .single();

    if (error || !profile) {
      console.error('Error fetching basic public profile:', error);
      return null;
    }

    return profile;
  }
}

export const publicProfileApi = new PublicProfileAPI();