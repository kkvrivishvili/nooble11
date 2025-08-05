// src/features/my-nooble/design/index.tsx - UPDATED to use only design-api.ts
import { useState, useEffect, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { useProfile } from '@/context/profile-context';
import { designApi, designPresets } from '@/api/design-api'; // ONLY use design-api
import { ProfileDesign, ProfileWallpaper, ProfileLayout } from '@/types/profile';

import { cn } from '@/lib/utils';
import { toast } from 'sonner';

import { useDesign } from '@/hooks/use-design'; // This hook already uses design-api correctly
import { LayoutWithMobile } from '@/components/layout/layout-with-mobile';
import PublicProfile from '@/features/public-profile';

// Import updated components
import { PresetGrid } from './components/preset-grid';
import { ColorPicker } from './components/color-picker';
import { WallpaperConfig } from './components/wallpaper-config';
import { StyleSelector } from './components/style-selector';
import { LayoutControls } from './components/layout-controls';
import {
  IconSquare,
  IconCircle,
  IconSquareRoundedFilled,
  IconShadow,
} from '@tabler/icons-react';

export default function DesignPage() {
  const { profile } = useProfile();
  const {
    currentDesign,
    isLoading,
    updateDesign: _updateDesign,
    isSaving,
  } = useDesign(); // This hook uses design-api correctly

  const [localDesign, setLocalDesign] = useState<ProfileDesign | null>(null);
  const [activeTab, setActiveTab] = useState('buttons');
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (currentDesign) {
      setLocalDesign(currentDesign);
    }
  }, [currentDesign]);

  const handlePresetSelect = async (presetName: keyof typeof designPresets) => {
    try {
      const preset = designPresets[presetName];
      setLocalDesign(camelToSnakeDesign(preset));
      
      // Apply preset immediately using design-api
      await designApi.applyPreset(presetName);
      toast.success(`"${presetName}" design applied successfully!`);
    } catch (_error) {
      toast.error('Failed to apply preset');
    }
  };

  // Ensure presets (which may be camelCase) are normalized to snake_case
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const camelToSnakeDesign = (design: any): ProfileDesign => {
    const theme = design?.theme ?? {};
    const wp = theme?.wallpaper ?? {};
    const layout = design?.layout ?? {};
    const normalized: ProfileDesign = {
      theme: {
        primary_color: theme.primary_color ?? theme.primaryColor,
        background_color: theme.background_color ?? theme.backgroundColor,
        text_color: theme.text_color ?? theme.textColor,
        button_text_color: theme.button_text_color ?? theme.buttonTextColor,
        font_family: theme.font_family ?? theme.fontFamily,
        font_size: theme.font_size ?? theme.fontSize,
        border_radius: theme.border_radius ?? theme.borderRadius,
        button_fill: theme.button_fill ?? theme.buttonFill,
        button_shadow: theme.button_shadow ?? theme.buttonShadow,
        wallpaper: wp && Object.keys(wp).length ? {
          type: wp.type,
          fill_color: wp.fill_color ?? wp.fillColor,
          gradient_colors: wp.gradient_colors ?? wp.gradientColors,
          gradient_direction: wp.gradient_direction ?? wp.gradientDirection,
          gradient_type: wp.gradient_type ?? wp.gradientType,
          pattern_type: wp.pattern_type ?? wp.patternType,
          pattern_color: wp.pattern_color ?? wp.patternColor,
          pattern_opacity: wp.pattern_opacity ?? wp.patternOpacity,
          pattern_blur: wp.pattern_blur ?? wp.patternBlur,
          pattern_blur_intensity: wp.pattern_blur_intensity ?? wp.patternBlurIntensity,
          image_url: wp.image_url ?? wp.imageUrl,
          image_position: wp.image_position ?? wp.imagePosition,
          image_size: wp.image_size ?? wp.imageSize,
          image_overlay: wp.image_overlay ?? wp.imageOverlay,
          image_blur: wp.image_blur ?? wp.imageBlur,
          image_blur_intensity: wp.image_blur_intensity ?? wp.imageBlurIntensity,
          video_url: wp.video_url ?? wp.videoUrl,
          video_muted: wp.video_muted ?? wp.videoMuted,
          video_loop: wp.video_loop ?? wp.videoLoop,
          video_overlay: wp.video_overlay ?? wp.videoOverlay,
          video_blur: wp.video_blur ?? wp.videoBlur,
          video_blur_intensity: wp.video_blur_intensity ?? wp.videoBlurIntensity,
        } : undefined,
      },
      layout: {
        social_position: layout.social_position ?? layout.socialPosition,
        content_width: layout.content_width ?? layout.contentWidth,
      }
    };
    return normalized;
  };

  const updateTheme = (updates: Partial<ProfileDesign['theme']>) => {
    if (!localDesign) return;
    
    const newDesign = {
      ...localDesign,
      theme: { ...localDesign.theme, ...updates }
    };
    
    setLocalDesign(newDesign);
    scheduleAutoSave(newDesign);
  };

  const updateWallpaper = (wallpaper: ProfileWallpaper) => {
    if (!localDesign) return;
    
    const newDesign = {
      ...localDesign,
      theme: { ...localDesign.theme, wallpaper }
    };
    
    setLocalDesign(newDesign);
    scheduleAutoSave(newDesign);
  };

  const updateLayout = (updates: Partial<ProfileDesign['layout']>) => {
    if (!localDesign) return;
    
    const newDesign = {
      ...localDesign,
      layout: { ...localDesign.layout, ...updates }
    };
    
    setLocalDesign(newDesign);
    scheduleAutoSave(newDesign);
  };

  // Auto-save logic with debouncing
  const scheduleAutoSave = (design: ProfileDesign) => {
    // Clear existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    // Schedule new save
    const timeout = setTimeout(async () => {
      try {
        await designApi.updateDesign(design);
        // Don't show success toast for auto-saves to avoid spam
        // auto-saved
      } catch (_error) {
        toast.error('Failed to save design changes');
      }
    }, 1500); // 1.5 second debounce

    setSaveTimeout(timeout);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [saveTimeout]);

  const hasLocalChanges = useMemo(() => 
    localDesign && currentDesign && 
    JSON.stringify(localDesign) !== JSON.stringify(currentDesign),
    [localDesign, currentDesign]
  );

  // Mobile preview content
  const mobilePreviewContent = useMemo(() => {
    if (!profile?.username || !localDesign) return null;
    
    return (
      <div className="h-full overflow-y-auto">
        <PublicProfile username={profile.username} isPreview={true} previewDesign={localDesign} />
      </div>
    );
  }, [profile?.username, localDesign]);

  // Manual save function for explicit user actions
  const handleManualSave = async () => {
    if (!localDesign) return;
    
    try {
      await designApi.updateDesign(localDesign);
      toast.success('Design saved successfully!');
    } catch (_error) {
      toast.error('Failed to save design');
    }
  };

  // Reset to default design
  const handleResetDesign = async () => {
    try {
      const defaultDesign = await designApi.resetToDefault();
      setLocalDesign(defaultDesign);
      toast.success('Design reset to default');
    } catch (_error) {
      toast.error('Failed to reset design');
    }
  };

  if (isLoading || !localDesign) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Cargando diseño...</p>
        </div>
      </div>
    );
  }

  const designContent = (
    <div className="space-y-8">
      {/* Save Status Indicator */}
      {(hasLocalChanges || isSaving) && (
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-blue-600">Saving changes...</span>
                </>
              ) : hasLocalChanges ? (
                <>
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-sm text-orange-600">Unsaved changes</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600">All changes saved</span>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleResetDesign}
                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
              >
                Reset to Default
              </button>
              {hasLocalChanges && (
                <button
                  onClick={handleManualSave}
                  className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50"
                  disabled={isSaving}
                >
                  Save Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 1. Presets Grid - Primera posición */}
      <PresetGrid 
        currentDesign={localDesign}
        onSelectPreset={handlePresetSelect}
      />

      {/* 2. Wallpaper Config - Segunda posición */}
      <WallpaperConfig
        wallpaper={localDesign.theme.wallpaper}
        onChange={updateWallpaper}
        theme={localDesign.theme}
      />

      {/* 3. Design Tabs - Tercera posición (Botones, Tipografías, Distribución) */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Personalización</h3>
        
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'buttons', label: 'Estilos de botones' },
              { id: 'typography', label: 'Tipografías' },
              { id: 'layout', label: 'Distribución' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "py-2 px-1 border-b-2 font-medium text-sm transition-colors",
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                )}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="py-4">
          {activeTab === 'buttons' && (
            <div className="space-y-6">
              <StyleSelector
                label="Relleno"
                value={localDesign.theme.button_fill || 'solid'}
                options={[
                  { value: 'solid', label: 'Sólido', icon: <IconSquare size={24} fill="currentColor" /> },
                  { value: 'glass', label: 'Cristal', icon: <IconSquare size={24} className="opacity-50" /> },
                  { value: 'outline', label: 'Contorno', icon: <IconSquare size={24} /> },
                ]}
                onChange={(value) => updateTheme({ button_fill: value as ProfileDesign['theme']['button_fill'] })}
                columns={3}
              />
              
              <StyleSelector
                label="Bordes"
                value={localDesign.theme.border_radius || 'curved'}
                options={[
                  { value: 'sharp', label: 'Recto', icon: <IconSquare size={24} /> },
                  { value: 'curved', label: 'Curvo', icon: <IconSquareRoundedFilled size={24} /> },
                  { value: 'round', label: 'Redondo', icon: <IconCircle size={24} /> },
                ]}
                onChange={(value) => updateTheme({ border_radius: value as ProfileDesign['theme']['border_radius'] })}
                columns={3}
              />
              
              <StyleSelector
                label="Sombra"
                value={localDesign.theme.button_shadow || 'subtle'}
                options={[
                  { value: 'none', label: 'Sin sombra', icon: <IconShadow size={24} className="opacity-30" /> },
                  { value: 'subtle', label: 'Sutil', icon: <IconShadow size={24} className="opacity-60" /> },
                  { value: 'hard', label: 'Dura', icon: <IconShadow size={24} /> },
                ]}
                onChange={(value) => updateTheme({ button_shadow: value as ProfileDesign['theme']['button_shadow'] })}
                columns={3}
              />
            </div>
          )}

          {activeTab === 'typography' && (
            <div className="space-y-6">
              <StyleSelector
                label="Fuente"
                value={localDesign.theme.font_family || 'sans'}
                options={[
                  { 
                    value: 'sans', 
                    label: 'Sans',
                    preview: <span style={{ fontFamily: 'sans-serif' }}>Aa Bb Cc</span>
                  },
                  { 
                    value: 'serif', 
                    label: 'Serif',
                    preview: <span style={{ fontFamily: 'serif' }}>Aa Bb Cc</span>
                  },
                  { 
                    value: 'mono', 
                    label: 'Mono',
                    preview: <span style={{ fontFamily: 'monospace' }}>Aa Bb Cc</span>
                  },
                ]}
                onChange={(value) => updateTheme({ font_family: value as ProfileDesign['theme']['font_family'] })}
                columns={3}
              />
            </div>
          )}

          {activeTab === 'layout' && (
            <LayoutControls
              layout={(localDesign.layout ?? {}) as ProfileLayout}
              onChange={updateLayout}
            />
          )}
        </div>
      </div>

      {/* 4. Color Picker - Al final */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Colores</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Color primario</Label>
            <ColorPicker
              value={localDesign.theme.primary_color}
              onChange={(color) => updateTheme({ primary_color: color })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label>Color de texto</Label>
            <ColorPicker
              value={localDesign.theme.text_color || '#111827'}
              onChange={(color) => updateTheme({ text_color: color })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label>Color de texto en botones</Label>
            <ColorPicker
              value={localDesign.theme.button_text_color || '#ffffff'}
              onChange={(color) => updateTheme({ button_text_color: color })}
            />
          </div>
        </div>
      </div>

      {/* Help text */}
      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
        💡 <strong>Tip:</strong> Los cambios se guardan automáticamente después de 1.5 segundos de inactividad. 
        También puedes usar "Save Now" para guardar inmediatamente.
      </div>
    </div>
  );

  return (
    <LayoutWithMobile previewContent={mobilePreviewContent}>
      {designContent}
    </LayoutWithMobile>
  );
}