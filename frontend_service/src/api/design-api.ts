// src/api/design-api.ts - Updated version without hero and export/import
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

// Enhanced design presets
export const designPresets = {
  minimal: {
    theme: {
      primaryColor: '#374151',
      backgroundColor: '#ffffff',
      textColor: '#111827',
      buttonTextColor: '#111827',
      fontFamily: 'sans' as const,
      borderRadius: 'sharp' as const,
      buttonFill: 'outline' as const,
      buttonShadow: 'none' as const,
      wallpaper: {
        type: 'fill' as const,
        fillColor: '#f9fafb'
      }
    },
    layout: {
      linkStyle: 'minimal' as const,
      socialPosition: 'bottom' as const,
      contentWidth: 'narrow' as const,
      spacing: 'normal' as const,
    }
  },
  
  classic: {
    theme: {
      primaryColor: '#111827',
      backgroundColor: '#ffffff',
      textColor: '#111827',
      buttonTextColor: '#ffffff',
      fontFamily: 'serif' as const,
      borderRadius: 'curved' as const,
      buttonFill: 'solid' as const,
      buttonShadow: 'subtle' as const,
      wallpaper: {
        type: 'fill' as const,
        fillColor: '#ffffff'
      }
    },
    layout: {
      linkStyle: 'card' as const,
      socialPosition: 'top' as const,
      contentWidth: 'normal' as const,
      spacing: 'normal' as const,
    }
  },
  
  unique: {
    theme: {
      primaryColor: '#7c3aed',
      backgroundColor: '#faf5ff',
      textColor: '#581c87',
      buttonTextColor: '#ffffff',
      fontFamily: 'sans' as const,
      borderRadius: 'round' as const,
      buttonFill: 'solid' as const,
      buttonShadow: 'hard' as const,
      wallpaper: {
        type: 'gradient' as const,
        gradientColors: ['#faf5ff', '#e9d5ff', '#c084fc'],
        gradientDirection: 'diagonal' as const,
        gradientType: 'linear' as const
      }
    },
    layout: {
      linkStyle: 'button' as const,
      socialPosition: 'top' as const,
      contentWidth: 'normal' as const,
      spacing: 'relaxed' as const,
    }
  },
  
  zen: {
    theme: {
      primaryColor: '#059669',
      backgroundColor: '#ecfdf5',
      textColor: '#064e3b',
      buttonTextColor: '#ffffff',
      fontFamily: 'sans' as const,
      borderRadius: 'round' as const,
      buttonFill: 'glass' as const,
      buttonShadow: 'subtle' as const,
      wallpaper: {
        type: 'pattern' as const,
        patternType: 'waves' as const,
        patternColor: '#059669',
        patternOpacity: 0.1
      }
    },
    layout: {
      linkStyle: 'card' as const,
      socialPosition: 'hidden' as const,
      contentWidth: 'narrow' as const,
      spacing: 'relaxed' as const,
    }
  },
  
  modern: {
    theme: {
      primaryColor: '#000000',
      backgroundColor: '#ffffff',
      textColor: '#000000',
      buttonTextColor: '#ffffff',
      fontFamily: 'sans' as const,
      borderRadius: 'sharp' as const,
      buttonFill: 'solid' as const,
      buttonShadow: 'hard' as const,
      wallpaper: {
        type: 'blur' as const,
        blurIntensity: 20,
        blurColor: '#f3f4f6'
      }
    },
    layout: {
      linkStyle: 'button' as const,
      socialPosition: 'bottom' as const,
      contentWidth: 'normal' as const,
      spacing: 'normal' as const,
    }
  },
  
  industrial: {
    theme: {
      primaryColor: '#525252',
      backgroundColor: '#f5f5f5',
      textColor: '#171717',
      buttonTextColor: '#fafafa',
      fontFamily: 'mono' as const,
      borderRadius: 'sharp' as const,
      buttonFill: 'solid' as const,
      buttonShadow: 'none' as const,
      wallpaper: {
        type: 'pattern' as const,
        patternType: 'grid' as const,
        patternColor: '#d4d4d4',
        patternOpacity: 0.5
      }
    },
    layout: {
      linkStyle: 'minimal' as const,
      socialPosition: 'top' as const,
      contentWidth: 'wide' as const,
      spacing: 'compact' as const,
    }
  },
  
  retro: {
    theme: {
      primaryColor: '#dc2626',
      backgroundColor: '#fef3c7',
      textColor: '#7c2d12',
      buttonTextColor: '#fef3c7',
      fontFamily: 'serif' as const,
      borderRadius: 'round' as const,
      buttonFill: 'solid' as const,
      buttonShadow: 'hard' as const,
      wallpaper: {
        type: 'pattern' as const,
        patternType: 'dots' as const,
        patternColor: '#f59e0b',
        patternOpacity: 0.2
      }
    },
    layout: {
      linkStyle: 'button' as const,
      socialPosition: 'bottom' as const,
      contentWidth: 'normal' as const,
      spacing: 'relaxed' as const,
    }
  },
  
  subtle: {
    theme: {
      primaryColor: '#64748b',
      backgroundColor: '#f8fafc',
      textColor: '#334155',
      buttonTextColor: '#f8fafc',
      fontFamily: 'sans' as const,
      borderRadius: 'curved' as const,
      buttonFill: 'glass' as const,
      buttonShadow: 'subtle' as const,
      wallpaper: {
        type: 'fill' as const,
        fillColor: '#f1f5f9'
      }
    },
    layout: {
      linkStyle: 'card' as const,
      socialPosition: 'top' as const,
      contentWidth: 'normal' as const,
      spacing: 'normal' as const,
    }
  },
  
  vibrant: {
    theme: {
      primaryColor: '#ec4899',
      backgroundColor: '#fce7f3',
      textColor: '#831843',
      buttonTextColor: '#ffffff',
      fontFamily: 'sans' as const,
      borderRadius: 'round' as const,
      buttonFill: 'solid' as const,
      buttonShadow: 'hard' as const,
      wallpaper: {
        type: 'gradient' as const,
        gradientColors: ['#fbbf24', '#f97316', '#ec4899', '#a855f7'],
        gradientDirection: 'diagonal' as const,
        gradientType: 'linear' as const
      }
    },
    layout: {
      linkStyle: 'button' as const,
      socialPosition: 'top' as const,
      contentWidth: 'normal' as const,
      spacing: 'normal' as const,
    }
  }
};

// Dynamic gradient presets
export const gradientPresets = [
  { 
    name: 'sunset', 
    colors: ['#fbbf24', '#f97316', '#dc2626'],
    direction: 'diagonal' as const
  },
  { 
    name: 'ocean', 
    colors: ['#0ea5e9', '#3b82f6', '#6366f1'],
    direction: 'down' as const
  },
  { 
    name: 'forest', 
    colors: ['#84cc16', '#22c55e', '#059669'],
    direction: 'diagonal' as const
  },
  { 
    name: 'lavender', 
    colors: ['#e9d5ff', '#c084fc', '#9333ea'],
    direction: 'down' as const
  },
  { 
    name: 'candy', 
    colors: ['#fbbf24', '#f97316', '#ec4899', '#a855f7'],
    direction: 'right' as const
  },
  { 
    name: 'midnight', 
    colors: ['#1e293b', '#334155', '#475569'],
    direction: 'up' as const
  }
];

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
      return designPresets.classic;
    }
    
    // Ensure the design has all required fields with defaults
    const design = data.design as ProfileDesign;
    return {
      theme: {
        ...designPresets.classic.theme,
        ...design.theme
      },
      layout: {
        ...designPresets.classic.layout,
        ...design.layout
      },
      version: design.version || 1
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
      },
      version: 2 // Mark as new version
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
    return this.applyPreset('classic');
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
   * Update wallpaper settings
   */
  async updateWallpaper(wallpaper: ProfileDesign['theme']['wallpaper']): Promise<ProfileDesign> {
    const currentDesign = await this.getDesign();
    return this.updateDesign({
      theme: {
        ...currentDesign.theme,
        wallpaper
      }
    });
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
        wallpaper: designPresets[key as keyof typeof designPresets].theme.wallpaper,
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
    
    // Check layout (optional)
    if (design.layout && typeof design.layout !== 'object') return false;
    
    return true;
  }
};