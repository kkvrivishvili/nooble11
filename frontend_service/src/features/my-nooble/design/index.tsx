import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { usePageContext } from '@/context/page-context';
import { useProfile } from '@/context/profile-context';
import { designPresets } from '@/api/design-api';
import { ProfileDesign, ProfileWallpaper } from '@/types/profile';
import { 
  IconDeviceFloppy, 
  IconRefresh, 
  IconCheck,
} from '@tabler/icons-react';
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
  const { setTitle } = usePageContext();
  const { profile } = useProfile();
  const {
    currentDesign,
    isLoading,
    isSaving,
    isResetting,
    updateDesign,
    resetToDefault
  } = useDesign();

  const [localDesign, setLocalDesign] = useState<ProfileDesign | null>(null);

  useEffect(() => {
    setTitle('Diseño');
  }, [setTitle]);

  useEffect(() => {
    if (currentDesign) {
      setLocalDesign(currentDesign);
    }
  }, [currentDesign]);

  const handleSave = () => {
    if (localDesign) {
      updateDesign(localDesign);
    }
  };

  const handlePresetSelect = (presetName: keyof typeof designPresets) => {
    const preset = designPresets[presetName];
    setLocalDesign(preset);
  };

  const handleReset = () => {
    resetToDefault();
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

  const mobilePreviewContent = useMemo(() => {
    if (!profile?.username || !localDesign) return null;
    
    return <PublicProfile username={profile.username} isPreview={true} previewDesign={localDesign} />;
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
      {/* Header con acciones */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Diseño</h1>
          <p className="text-muted-foreground">
            Personaliza la apariencia de tu Nooble
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isSaving || isResetting}
          >
            {isResetting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
            ) : (
              <IconRefresh size={16} className="mr-2" />
            )}
            Restablecer
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasLocalChanges || isSaving}
          >
            {isSaving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <IconDeviceFloppy size={16} className="mr-2" />
            )}
            Guardar cambios
          </Button>
        </div>
      </div>

      {/* Notificación de cambios sin guardar */}
      {hasLocalChanges && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-orange-800">
              <IconCheck size={16} />
              <span className="text-sm font-medium">
                Tienes cambios sin guardar. Guarda para aplicarlos a tu Nooble.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Presets Grid */}
      <PresetGrid 
        currentDesign={localDesign}
        onSelectPreset={handlePresetSelect}
      />

      {/* Colors Section */}
      <Card>
        <CardHeader>
          <CardTitle>Colores</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ColorPicker
            label="Color primario"
            value={localDesign.theme.primaryColor}
            onChange={(color) => updateTheme({ primaryColor: color })}
          />
          <ColorPicker
            label="Color de fondo"
            value={localDesign.theme.backgroundColor || '#ffffff'}
            onChange={(color) => updateTheme({ backgroundColor: color })}
          />
          <ColorPicker
            label="Color de texto"
            value={localDesign.theme.textColor || '#111827'}
            onChange={(color) => updateTheme({ textColor: color })}
          />
          <ColorPicker
            label="Color de texto en botones"
            value={localDesign.theme.buttonTextColor || '#ffffff'}
            onChange={(color) => updateTheme({ buttonTextColor: color })}
          />
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
            onChange={(value) => updateTheme({ fontFamily: value as any })}
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
            onChange={(value) => updateTheme({ buttonFill: value as any })}
            columns={3}
          />
          
          <StyleSelector
            label="Bordes"
            value={localDesign.theme.borderRadius || 'curved'}
            options={borderRadiusOptions}
            onChange={(value) => updateTheme({ borderRadius: value as any })}
            columns={3}
          />
          
          <StyleSelector
            label="Sombra"
            value={localDesign.theme.buttonShadow || 'subtle'}
            options={shadowOptions}
            onChange={(value) => updateTheme({ buttonShadow: value as any })}
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