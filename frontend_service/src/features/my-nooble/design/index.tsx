import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { usePageContext } from '@/context/page-context';
import { useProfile } from '@/context/profile-context';
import { designPresets } from '@/api/design-api';
import { ProfileDesign, ProfileTheme, ProfileLayout } from '@/types/profile';
import { IconPalette, IconEye, IconDeviceFloppy, IconRefresh, IconCheck } from '@tabler/icons-react';
import { useDesign } from '@/hooks/use-design';
import { LayoutWithMobile } from '@/components/layout/layout-with-mobile';
import PublicProfile from '@/features/public-profile';

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

  const updateLocalTheme = (updates: Partial<ProfileTheme>) => {
    if (!localDesign) return;
    
    setLocalDesign({
      ...localDesign,
      theme: { ...localDesign.theme, ...updates }
    });
  };

  const updateLocalLayout = (updates: Partial<ProfileLayout>) => {
    if (!localDesign) return;
    
    setLocalDesign({
      ...localDesign,
      layout: { ...localDesign.layout, ...updates }
    });
  };

  const hasLocalChanges = localDesign && currentDesign && 
    JSON.stringify(localDesign) !== JSON.stringify(currentDesign);

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

  // Contenido de vista previa móvil - usando el username real del usuario
  const mobilePreviewContent = profile?.username ? (
    <PublicProfile username={profile.username} isPreview={true} />
  ) : (
    <div className="p-4 text-center text-gray-500">Cargando vista previa...</div>
  );

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

      {hasLocalChanges && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-orange-800">
              <IconEye size={16} />
              <span className="text-sm font-medium">
                Tienes cambios sin guardar. Guarda para aplicarlos a tu Nooble.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Panel de personalización */}
      <div className="space-y-6">
        {/* Presets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconPalette size={20} />
              Presets de Diseño
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(designPresets).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => handlePresetSelect(key as keyof typeof designPresets)}
                  className="p-3 border-2 rounded-lg hover:border-gray-400 transition-colors text-left"
                  style={{
                    borderColor: localDesign && JSON.stringify(localDesign.theme) === JSON.stringify(preset.theme) 
                      ? preset.theme.primaryColor 
                      : '#e5e7eb'
                  }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div 
                      className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: preset.theme.primaryColor }}
                    />
                    <span className="font-medium capitalize">{key}</span>
                    {localDesign && JSON.stringify(localDesign.theme) === JSON.stringify(preset.theme) && (
                      <IconCheck size={16} className="ml-auto text-green-600" />
                    )}
                  </div>
                  <div 
                    className="w-full h-3 rounded"
                    style={{ 
                      background: preset.theme.backgroundImage || preset.theme.backgroundColor 
                    }}
                  />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Personalización detallada */}
        <Card>
          <CardHeader>
            <CardTitle>Personalización</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="theme">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="theme">Tema</TabsTrigger>
                <TabsTrigger value="layout">Layout</TabsTrigger>
              </TabsList>

              <TabsContent value="theme" className="space-y-4">
                {/* Color primario */}
                <div className="space-y-2">
                  <Label>Color Primario</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={localDesign.theme.primaryColor}
                      onChange={(e) => updateLocalTheme({ primaryColor: e.target.value })}
                      className="w-12 h-10 p-1 border-2"
                    />
                    <Input
                      value={localDesign.theme.primaryColor}
                      onChange={(e) => updateLocalTheme({ primaryColor: e.target.value })}
                      className="flex-1"
                      placeholder="#000000"
                    />
                  </div>
                </div>

                {/* Color de fondo */}
                <div className="space-y-2">
                  <Label>Color de Fondo</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={localDesign.theme.backgroundColor}
                      onChange={(e) => updateLocalTheme({ backgroundColor: e.target.value })}
                      className="w-12 h-10 p-1 border-2"
                    />
                    <Input
                      value={localDesign.theme.backgroundColor}
                      onChange={(e) => updateLocalTheme({ backgroundColor: e.target.value })}
                      className="flex-1"
                      placeholder="#ffffff"
                    />
                  </div>
                </div>

                {/* Imagen de fondo */}
                <div className="space-y-2">
                  <Label>Imagen de Fondo (URL)</Label>
                  <Input
                    value={localDesign.theme.backgroundImage || ''}
                    onChange={(e) => updateLocalTheme({ backgroundImage: e.target.value || undefined })}
                    placeholder="https://ejemplo.com/imagen.jpg"
                  />
                </div>

                <Separator />

                {/* Border Radius */}
                <div className="space-y-2">
                  <Label>Esquinas</Label>
                  <Select
                    value={localDesign.theme.borderRadius}
                    onValueChange={(value: 'sm' | 'md' | 'lg' | 'xl') => updateLocalTheme({ borderRadius: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sm">Pequeñas</SelectItem>
                      <SelectItem value="md">Medianas</SelectItem>
                      <SelectItem value="lg">Grandes</SelectItem>
                      <SelectItem value="xl">Extra grandes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Font Family */}
                <div className="space-y-2">
                  <Label>Fuente</Label>
                  <Select
                    value={localDesign.theme.fontFamily}
                    onValueChange={(value: 'sans' | 'serif' | 'mono') => updateLocalTheme({ fontFamily: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sans">Sans Serif</SelectItem>
                      <SelectItem value="serif">Serif</SelectItem>
                      <SelectItem value="mono">Monoespaciada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="layout" className="space-y-4">
                {/* Estilo de enlaces */}
                <div className="space-y-2">
                  <Label>Estilo de Enlaces</Label>
                  <Select
                    value={localDesign.layout?.linkStyle}
                    onValueChange={(value: 'card' | 'button' | 'minimal') => updateLocalLayout({ linkStyle: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="card">Tarjetas</SelectItem>
                      <SelectItem value="button">Botones</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Posición de redes sociales */}
                <div className="space-y-2">
                  <Label>Posición de Redes Sociales</Label>
                  <Select
                    value={localDesign.layout?.socialPosition}
                    onValueChange={(value: 'top' | 'bottom' | 'hidden') => updateLocalLayout({ socialPosition: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top">Arriba</SelectItem>
                      <SelectItem value="bottom">Abajo</SelectItem>
                      <SelectItem value="hidden">Ocultas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <LayoutWithMobile previewContent={mobilePreviewContent}>
      {designContent}
    </LayoutWithMobile>
  );
}