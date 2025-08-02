import { useState, useEffect, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { useProfile } from '@/context/profile-context';
import { designPresets } from '@/api/design-api';
import { ProfileDesign, ProfileWallpaper } from '@/types/profile';
import { cn } from '@/lib/utils';

import { useDesign } from '@/hooks/use-design';
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
    updateDesign
  } = useDesign();

  const [localDesign, setLocalDesign] = useState<ProfileDesign | null>(null);
  const [activeTab, setActiveTab] = useState('buttons');

  useEffect(() => {
    if (currentDesign) {
      setLocalDesign(currentDesign);
    }
  }, [currentDesign]);

  const handlePresetSelect = (presetName: keyof typeof designPresets) => {
    const preset = designPresets[presetName];
    setLocalDesign(preset);
  };

  const updateTheme = (updates: Partial<ProfileDesign['theme']>) => {
    if (!localDesign) return;
    setLocalDesign(prev => ({
      ...prev!,
      theme: { ...prev!.theme, ...updates }
    }));
  };

  const updateWallpaper = (wallpaper: ProfileWallpaper) => {
    if (!localDesign) return;
    setLocalDesign(prev => ({
      ...prev!,
      theme: { ...prev!.theme, wallpaper }
    }));
  };

  const updateLayout = (updates: Partial<ProfileDesign['layout']>) => {
    if (!localDesign) return;
    setLocalDesign(prev => ({
      ...prev!,
      layout: { ...prev!.layout, ...updates }
    }));
  };

  const hasLocalChanges = useMemo(() => 
    localDesign && currentDesign && 
    JSON.stringify(localDesign) !== JSON.stringify(currentDesign),
    [localDesign, currentDesign]
  );

  // Auto-save logic
  useEffect(() => {
    // Don't run on initial load
    if (!hasLocalChanges || !localDesign) {
      return;
    }

    const debounceTimer = setTimeout(() => {
      updateDesign(localDesign);
    }, 1500); // Auto-save after 1.5s of inactivity

    // Save when the component unmounts (e.g., user navigates away)
    const handleBeforeUnload = () => {
      updateDesign(localDesign);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearTimeout(debounceTimer);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [localDesign, updateDesign, hasLocalChanges]);

  const mobilePreviewContent = useMemo(() => {
    if (!profile?.username || !localDesign) return null;
    
    return (
      <div className="h-full overflow-y-auto">
        <PublicProfile username={profile.username} isPreview={true} previewDesign={localDesign} />
      </div>
    );
  }, [profile?.username, localDesign]);

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
                value={localDesign.theme.buttonFill || 'solid'}
                options={[
                  { value: 'solid', label: 'Sólido', icon: <IconSquare size={24} fill="currentColor" /> },
                  { value: 'glass', label: 'Cristal', icon: <IconSquare size={24} className="opacity-50" /> },
                  { value: 'outline', label: 'Contorno', icon: <IconSquare size={24} /> },
                ]}
                onChange={(value) => updateTheme({ buttonFill: value as ProfileDesign['theme']['buttonFill'] })}
                columns={3}
              />
              
              <StyleSelector
                label="Bordes"
                value={localDesign.theme.borderRadius || 'curved'}
                options={[
                  { value: 'sharp', label: 'Recto', icon: <IconSquare size={24} /> },
                  { value: 'curved', label: 'Curvo', icon: <IconSquareRoundedFilled size={24} /> },
                  { value: 'round', label: 'Redondo', icon: <IconCircle size={24} /> },
                ]}
                onChange={(value) => updateTheme({ borderRadius: value as ProfileDesign['theme']['borderRadius'] })}
                columns={3}
              />
              
              <StyleSelector
                label="Sombra"
                value={localDesign.theme.buttonShadow || 'subtle'}
                options={[
                  { value: 'none', label: 'Sin sombra', icon: <IconShadow size={24} className="opacity-30" /> },
                  { value: 'subtle', label: 'Sutil', icon: <IconShadow size={24} className="opacity-60" /> },
                  { value: 'hard', label: 'Dura', icon: <IconShadow size={24} /> },
                ]}
                onChange={(value) => updateTheme({ buttonShadow: value as ProfileDesign['theme']['buttonShadow'] })}
                columns={3}
              />
            </div>
          )}

          {activeTab === 'typography' && (
            <div className="space-y-6">
              <StyleSelector
                label="Fuente"
                value={localDesign.theme.fontFamily || 'sans'}
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
                onChange={(value) => updateTheme({ fontFamily: value as ProfileDesign['theme']['fontFamily'] })}
                columns={3}
              />
            </div>
          )}

          {activeTab === 'layout' && (
            <LayoutControls
              layout={localDesign.layout}
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
              value={localDesign.theme.primaryColor}
              onChange={(color) => updateTheme({ primaryColor: color })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label>Color de texto</Label>
            <ColorPicker
              value={localDesign.theme.textColor || '#111827'}
              onChange={(color) => updateTheme({ textColor: color })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label>Color de texto en botones</Label>
            <ColorPicker
              value={localDesign.theme.buttonTextColor || '#ffffff'}
              onChange={(color) => updateTheme({ buttonTextColor: color })}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <LayoutWithMobile previewContent={mobilePreviewContent}>
      {designContent}
    </LayoutWithMobile>
  );
}