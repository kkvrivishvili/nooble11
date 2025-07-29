// src/api/design-api.ts
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

// Design presets - Compatible con init_01_core.sql
export const designPresets = {
  default: {
    theme: {
      primaryColor: '#3b82f6',
      backgroundColor: '#ffffff',
      backgroundImage: undefined,
      borderRadius: 'lg' as const,
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
      backgroundImage: undefined,
      borderRadius: 'lg' as const,
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
      borderRadius: 'lg' as const,
      fontFamily: 'mono' as const,
    },
    layout: {
      linkStyle: 'button' as const,
      socialPosition: 'bottom' as const,
    }
  },
  minimal: {
    theme: {
      primaryColor: '#6b7280',
      backgroundColor: '#f9fafb',
      backgroundImage: undefined,
      borderRadius: 'sm' as const,
      fontFamily: 'mono' as const,
    },
    layout: {
      linkStyle: 'minimal' as const,
      socialPosition: 'hidden' as const,
    }
  },
  ocean: {
    theme: {
      primaryColor: '#0ea5e9',
      backgroundColor: '#f0f9ff',
      backgroundImage: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 50%, #6366f1 100%)',
      borderRadius: 'lg' as const,
      fontFamily: 'sans' as const,
    },
    layout: {
      linkStyle: 'card' as const,
      socialPosition: 'top' as const,
    }
  },
  sunset: {
    theme: {
      primaryColor: '#f97316',
      backgroundColor: '#fff7ed',
      backgroundImage: 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #dc2626 100%)',
      borderRadius: 'lg' as const,
      fontFamily: 'sans' as const,
    },
    layout: {
      linkStyle: 'button' as const,
      socialPosition: 'bottom' as const,
    }
  }
};

// API Implementation
export const designApi = {
  /**
   * Get current design settings from profile.design
   */
  async getDesign(): Promise<ProfileDesign> {
    const userId = await getUserId();
    
    const { data, error } = await supabase
      .from('profiles')
      .select('design')
      .eq('id', userId)
      .single();

    handleApiError(error, 'getDesign');
    
    // If no design exists, return default preset
    if (!data?.design) {
      return designPresets.default;
    }
    
    // Ensure the design has both theme and layout with all required fields
    const design = data.design as ProfileDesign;
    return {
      theme: {
        ...designPresets.default.theme,
        ...design.theme
      },
      layout: {
        ...designPresets.default.layout,
        ...design.layout
      }
    };
  },

  /**
   * Update design settings in profile.design
   */
  async updateDesign(design: Partial<ProfileDesign>): Promise<ProfileDesign> {
    const userId = await getUserId();
    const currentDesign = await this.getDesign();
    
    // Merge with current design, ensuring all required fields
    const newDesign: ProfileDesign = {
      theme: {
        ...currentDesign.theme,
        ...(design.theme || {})
      },
      layout: {
        ...currentDesign.layout,
        ...(design.layout || {})
      }
    };
    
    // Update the profile with new design and updatedAt timestamp
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
   * Reset design to default preset
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
   * Get available presets with preview info
   */
  getPresets() {
    return Object.keys(designPresets).map(key => ({
      name: key,
      displayName: key.charAt(0).toUpperCase() + key.slice(1),
      design: designPresets[key as keyof typeof designPresets],
      preview: {
        primaryColor: designPresets[key as keyof typeof designPresets].theme.primaryColor,
        backgroundColor: designPresets[key as keyof typeof designPresets].theme.backgroundColor,
        backgroundImage: designPresets[key as keyof typeof designPresets].theme.backgroundImage,
      }
    }));
  },

  /**
   * Validate design structure
   */
  validateDesign(design: any): design is ProfileDesign {
    if (!design || typeof design !== 'object') return false;
    
    // Check theme
    if (!design.theme || typeof design.theme !== 'object') return false;
    if (typeof design.theme.primaryColor !== 'string') return false;
    if (typeof design.theme.backgroundColor !== 'string') return false;
    
    // Check layout
    if (!design.layout || typeof design.layout !== 'object') return false;
    
    return true;
  },

  /**
   * Export design as JSON
   */
  async exportDesign(): Promise<string> {
    const design = await this.getDesign();
    return JSON.stringify(design, null, 2);
  },

  /**
   * Import design from JSON
   */
  async importDesign(jsonString: string): Promise<ProfileDesign> {
    try {
      const design = JSON.parse(jsonString);
      
      if (!this.validateDesign(design)) {
        throw new Error('Invalid design format');
      }
      
      return this.updateDesign(design);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('Invalid JSON format');
      }
      throw error;
    }
  },

  /**
   * Create custom preset from current design
   */
  async saveAsCustomPreset(name: string): Promise<void> {
    const design = await this.getDesign();
    
    // In a real implementation, you might save this to a user_presets table
    // For now, we'll just store it in localStorage as an example
    const customPresets = JSON.parse(localStorage.getItem('customPresets') || '{}');
    customPresets[name] = design;
    localStorage.setItem('customPresets', JSON.stringify(customPresets));
  },

  /**
   * Get user's custom presets
   */
  getCustomPresets(): Record<string, ProfileDesign> {
    try {
      return JSON.parse(localStorage.getItem('customPresets') || '{}');
    } catch {
      return {};
    }
  },

  /**
   * Delete custom preset
   */
  deleteCustomPreset(name: string): void {
    const customPresets = this.getCustomPresets();
    delete customPresets[name];
    localStorage.setItem('customPresets', JSON.stringify(customPresets));
  }
};