import { supabase } from '@/lib/supabase';
import { ProfileDesign } from '@/types/profile';
import { PostgrestError, AuthError } from '@supabase/supabase-js';

// Helper Functions
const handleApiError = (error: PostgrestError | AuthError | null, context: string) => {
  if (error) {
    console.error(`Error in ${context}:`, error.message);
    throw new Error(`A problem occurred in ${context}: ${error.message}`);
  }
};

const getUserId = async (): Promise<string> => {
  const { data: { session }, error } = await supabase.auth.getSession();
  handleApiError(error, 'session check');
  if (!session?.user?.id) throw new Error('User not authenticated.');
  return session.user.id;
};

// Design presets
export const designPresets = {
  default: {
    theme: {
      primaryColor: '#000000',
      backgroundColor: '#ffffff',
      backgroundImage: null,
      borderRadius: 'md' as const,
      fontFamily: 'sans' as const,
    },
    layout: {
      linkStyle: 'card' as const,
      socialPosition: 'top' as const,
    }
  },
  dark: {
    theme: {
      primaryColor: '#ffffff',
      backgroundColor: '#000000',
      backgroundImage: null,
      borderRadius: 'md' as const,
      fontFamily: 'sans' as const,
    },
    layout: {
      linkStyle: 'card' as const,
      socialPosition: 'top' as const,
    }
  },
  neon: {
    theme: {
      primaryColor: '#00ff88',
      backgroundColor: '#0a0a0a',
      backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: 'xl' as const,
      fontFamily: 'mono' as const,
    },
    layout: {
      linkStyle: 'button' as const,
      socialPosition: 'bottom' as const,
    }
  },
  minimal: {
    theme: {
      primaryColor: '#333333',
      backgroundColor: '#fafafa',
      backgroundImage: null,
      borderRadius: 'sm' as const,
      fontFamily: 'serif' as const,
    },
    layout: {
      linkStyle: 'minimal' as const,
      socialPosition: 'hidden' as const,
    }
  }
};

// API Implementation
export const designApi = {
  /**
   * Get current design settings
   */
  async getDesign(): Promise<ProfileDesign> {
    const userId = await getUserId();
    
    const { data, error } = await supabase
      .from('profiles')
      .select('design')
      .eq('id', userId)
      .single();

    handleApiError(error, 'getDesign');
    
    return data?.design || designPresets.default;
  },

  /**
   * Update design settings
   */
  async updateDesign(design: Partial<ProfileDesign>): Promise<ProfileDesign> {
    const userId = await getUserId();
    const currentDesign = await this.getDesign();
    
    // Merge with current design
    const newDesign = {
      theme: {
        ...currentDesign.theme,
        ...(design.theme || {})
      },
      layout: {
        ...currentDesign.layout,
        ...(design.layout || {})
      }
    };
    
    const { error } = await supabase
      .from('profiles')
      .update({
        design: newDesign,
        updatedAt: new Date().toISOString()
      })
      .eq('id', userId);

    handleApiError(error, 'updateDesign');
    
    return newDesign;
  },

  /**
   * Apply a preset design
   */
  async applyPreset(presetName: keyof typeof designPresets): Promise<ProfileDesign> {
    const preset = designPresets[presetName];
    if (!preset) {
      throw new Error(`Preset "${presetName}" not found`);
    }
    
    return this.updateDesign(preset);
  },

  /**
   * Reset design to default
   */
  async resetToDefault(): Promise<ProfileDesign> {
    return this.applyPreset('default');
  },

  /**
   * Update theme only
   */
  async updateTheme(theme: Partial<ProfileDesign['theme']>): Promise<ProfileDesign> {
    return this.updateDesign({ theme });
  },

  /**
   * Update layout only
   */
  async updateLayout(layout: Partial<ProfileDesign['layout']>): Promise<ProfileDesign> {
    return this.updateDesign({ layout });
  },

  /**
   * Get available presets
   */
  getPresets() {
    return Object.keys(designPresets).map(key => ({
      name: key,
      design: designPresets[key as keyof typeof designPresets],
      preview: {
        primaryColor: designPresets[key as keyof typeof designPresets].theme.primaryColor,
        backgroundColor: designPresets[key as keyof typeof designPresets].theme.backgroundColor,
      }
    }));
  }
};