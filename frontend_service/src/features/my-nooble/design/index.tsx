import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Label } from '@/components/ui/label';
import { useProfile } from '@/context/profile-context';
import { designPresets } from '@/api/design-api';
import { ProfileDesign, ProfileWallpaper } from '@/types/profile';

import { useDesign } from '@/hooks/use-design';
import { LayoutWithMobile } from '@/components/layout/layout-with-mobile';
import PublicProfile from '@/features/public-profile';

// Import new components
import { PresetGrid } from './components/preset-grid';
import { ColorPicker } from './components/color-picker';
import { StyleSelector } from './components/style-selector';
import { WallpaperConfig } from './components/wallpaper-config';
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

  // Style options
  const fontOptions = [
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
  ];

  const buttonFillOptions = [
    { value: 'solid', label: 'Sólido', icon: <IconSquare size={24} fill="currentColor" /> },
    { value: 'glass', label: 'Cristal', icon: <IconSquare size={24} className="opacity-50" /> },
    { value: 'outline', label: 'Contorno', icon: <IconSquare size={24} /> },
  ];

  const borderRadiusOptions = [
    { value: 'sharp', label: 'Recto', icon: <IconSquare size={24} /> },
    { value: 'curved', label: 'Curvo', icon: <IconSquareRoundedFilled size={24} /> },
    { value: 'round', label: 'Redondo', icon: <IconCircle size={24} /> },
  ];

  const shadowOptions = [
    { value: 'none', label: 'Sin sombra', icon: <IconShadow size={24} className="opacity-30" /> },
    { value: 'subtle', label: 'Sutil', icon: <IconShadow size={24} className="opacity-60" /> },
    { value: 'hard', label: 'Dura', icon: <IconShadow size={24} /> },
  ];

  const designContent = (
    <div className="space-y-6">


      {/* Presets Grid */}
      <PresetGrid 
        currentDesign={localDesign}
        onSelectPreset={handlePresetSelect}
      />

      {/* Colors Section - Sin color de fondo */}
      <Card>
        <CardHeader>
          <CardTitle>Colores</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>

      {/* Typography Section */}
      <Card>
        <CardHeader>
          <CardTitle>Tipografía</CardTitle>
        </CardHeader>
        <CardContent>
          <StyleSelector
            label="Fuente"
            value={localDesign.theme.fontFamily || 'sans'}
            options={fontOptions}
            onChange={(value) => updateTheme({ fontFamily: value as ProfileDesign['theme']['fontFamily'] })}
            columns={3}
          />
        </CardContent>
      </Card>

      {/* Button Styles Section */}
      <Card>
        <CardHeader>
          <CardTitle>Estilo de botones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <StyleSelector
            label="Relleno"
            value={localDesign.theme.buttonFill || 'solid'}
            options={buttonFillOptions}
            onChange={(value) => updateTheme({ buttonFill: value as ProfileDesign['theme']['buttonFill'] })}
            columns={3}
          />
          
          <StyleSelector
            label="Bordes"
            value={localDesign.theme.borderRadius || 'curved'}
            options={borderRadiusOptions}
            onChange={(value) => updateTheme({ borderRadius: value as ProfileDesign['theme']['borderRadius'] })}
            columns={3}
          />
          
          <StyleSelector
            label="Sombra"
            value={localDesign.theme.buttonShadow || 'subtle'}
            options={shadowOptions}
            onChange={(value) => updateTheme({ buttonShadow: value as ProfileDesign['theme']['buttonShadow'] })}
            columns={3}
          />
        </CardContent>
      </Card>

      {/* Wallpaper Section */}
      <WallpaperConfig
        wallpaper={localDesign.theme.wallpaper}
        onChange={updateWallpaper}
        theme={localDesign.theme}
      />

      {/* Layout Section */}
      <LayoutControls
        layout={localDesign.layout}
        onChange={updateLayout}
      />
    </div>
  );

  return (
    <LayoutWithMobile previewContent={mobilePreviewContent}>
      {designContent}
    </LayoutWithMobile>
  );
}