import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { usePageContext } from '@/context/page-context';
import { useProfile } from '@/context/profile-context';
import { designPresets, gradientPresets } from '@/api/design-api';
import { ProfileDesign, ProfileWallpaper } from '@/types/profile';
import { 
  IconPalette, 
  IconDeviceFloppy, 
  IconRefresh, 
  IconCheck,
  IconSquare,
  IconCircle,
  IconSquareRoundedFilled,
  IconShadow,
  IconPhoto,
  IconColorSwatch,
  IconBlur,
  IconGridDots,
  IconMovie,
  IconUser
} from '@tabler/icons-react';
import { useDesign } from '@/hooks/use-design';
import { LayoutWithMobile } from '@/components/layout/layout-with-mobile';
import PublicProfile from '@/features/public-profile';
import { ProfileThemeProvider } from '@/context/profile-theme-context';

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
  const [activeTab, setActiveTab] = useState('presets');

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

  // Memoize preview content to avoid re-renders
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
              <IconCheck size={16} />
              <span className="text-sm font-medium">
                Tienes cambios sin guardar. Guarda para aplicarlos a tu Nooble.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="presets">Presets</TabsTrigger>
          <TabsTrigger value="text">Text</TabsTrigger>
          <TabsTrigger value="buttons">Buttons</TabsTrigger>
          <TabsTrigger value="wallpaper">Wallpaper</TabsTrigger>
        </TabsList>

        {/* Presets Tab */}
        <TabsContent value="presets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Button and font</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(designPresets).slice(0, 9).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => handlePresetSelect(key as keyof typeof designPresets)}
                    className={`p-4 border-2 rounded-lg transition-all hover:shadow-md ${
                      JSON.stringify(localDesign) === JSON.stringify(preset) 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200'
                    }`}
                  >
                    <div 
                      className="h-10 rounded-md mb-2 flex items-center justify-center text-sm font-medium"
                      style={{
                        backgroundColor: preset.theme.buttonFill === 'outline' 
                          ? 'transparent' 
                          : preset.theme.primaryColor,
                        color: preset.theme.buttonFill === 'outline' 
                          ? preset.theme.primaryColor 
                          : preset.theme.buttonTextColor,
                        border: `2px solid ${preset.theme.primaryColor}`,
                        borderRadius: preset.theme.borderRadius === 'sharp' ? '0.25rem' :
                                     preset.theme.borderRadius === 'curved' ? '0.5rem' : '9999px',
                        boxShadow: preset.theme.buttonShadow === 'hard' ? '4px 4px 0 rgba(0,0,0,0.2)' :
                                  preset.theme.buttonShadow === 'subtle' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                      }}
                    >
                      Button
                    </div>
                    <p className="text-sm font-medium capitalize">{key}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Color scheme</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <button
                  className={`p-6 border-2 rounded-lg transition-all ${
                    localDesign.theme.primaryColor === '#64748b' ? 'border-blue-500' : 'border-gray-200'
                  }`}
                  onClick={() => updateTheme({ 
                    primaryColor: '#64748b', 
                    backgroundColor: '#f8fafc',
                    textColor: '#334155'
                  })}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-full bg-gray-500"></div>
                    <div className="w-8 h-8 rounded-full bg-gray-100"></div>
                  </div>
                  <p className="text-sm font-medium">Subtle</p>
                </button>
                
                <button
                  className={`p-6 border-2 rounded-lg transition-all ${
                    localDesign.theme.primaryColor === '#ec4899' ? 'border-blue-500' : 'border-gray-200'
                  }`}
                  onClick={() => updateTheme({ 
                    primaryColor: '#ec4899', 
                    backgroundColor: '#fce7f3',
                    textColor: '#831843'
                  })}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 rounded-full bg-pink-500"></div>
                    <div className="w-8 h-8 rounded-full bg-pink-100"></div>
                  </div>
                  <p className="text-sm font-medium">Vibrant</p>
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Text Tab */}
        <TabsContent value="text" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Colors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Page text</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={localDesign.theme.textColor || '#111827'}
                      onChange={(e) => updateTheme({ textColor: e.target.value })}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={localDesign.theme.textColor || '#111827'}
                      onChange={(e) => updateTheme({ textColor: e.target.value })}
                      className="w-28"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Button text</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={localDesign.theme.buttonTextColor || '#ffffff'}
                      onChange={(e) => updateTheme({ buttonTextColor: e.target.value })}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={localDesign.theme.buttonTextColor || '#ffffff'}
                      onChange={(e) => updateTheme({ buttonTextColor: e.target.value })}
                      className="w-28"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Font</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {(['sans', 'serif', 'mono'] as const).map((font) => (
                  <button
                    key={font}
                    onClick={() => updateTheme({ fontFamily: font })}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      localDesign.theme.fontFamily === font ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                    style={{ fontFamily: font === 'serif' ? 'serif' : font === 'mono' ? 'monospace' : 'sans-serif' }}
                  >
                    <p className="text-lg mb-1">Aa Bb Cc</p>
                    <p className="text-sm capitalize">{font}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Buttons Tab */}
        <TabsContent value="buttons" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Fill</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {(['solid', 'glass', 'outline'] as const).map((fill) => (
                  <button
                    key={fill}
                    onClick={() => updateTheme({ buttonFill: fill })}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      localDesign.theme.buttonFill === fill ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <IconSquare size={24} className="mx-auto mb-2" />
                    <p className="text-sm capitalize">{fill}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Corners</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {(['sharp', 'curved', 'round'] as const).map((radius) => (
                  <button
                    key={radius}
                    onClick={() => updateTheme({ borderRadius: radius })}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      localDesign.theme.borderRadius === radius ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    {radius === 'sharp' && <IconSquare size={24} className="mx-auto mb-2" />}
                    {radius === 'curved' && <IconSquareRoundedFilled size={24} className="mx-auto mb-2" />}
                    {radius === 'round' && <IconCircle size={24} className="mx-auto mb-2" />}
                    <p className="text-sm capitalize">{radius}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shadow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {(['none', 'subtle', 'hard'] as const).map((shadow) => (
                  <button
                    key={shadow}
                    onClick={() => updateTheme({ buttonShadow: shadow })}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      localDesign.theme.buttonShadow === shadow ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <IconShadow size={24} className="mx-auto mb-2" />
                    <p className="text-sm capitalize">{shadow}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Colors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Buttons</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={localDesign.theme.primaryColor}
                    onChange={(e) => updateTheme({ primaryColor: e.target.value })}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={localDesign.theme.primaryColor}
                    onChange={(e) => updateTheme({ primaryColor: e.target.value })}
                    className="w-28"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <Label>Text</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={localDesign.theme.buttonTextColor || '#ffffff'}
                    onChange={(e) => updateTheme({ buttonTextColor: e.target.value })}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={localDesign.theme.buttonTextColor || '#ffffff'}
                    onChange={(e) => updateTheme({ buttonTextColor: e.target.value })}
                    className="w-28"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Wallpaper Tab */}
        <TabsContent value="wallpaper" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Wallpaper</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {/* Hero */}
                <button
                  onClick={() => updateWallpaper({ type: 'hero' })}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    localDesign.theme.wallpaper?.type === 'hero' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <IconUser size={24} className="mx-auto mb-2" />
                  <p className="text-sm">Hero</p>
                </button>

                {/* Fill */}
                <button
                  onClick={() => updateWallpaper({ type: 'fill', fillColor: '#f3f4f6' })}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    localDesign.theme.wallpaper?.type === 'fill' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <IconSquare size={24} className="mx-auto mb-2" />
                  <p className="text-sm">Fill</p>
                </button>

                {/* Gradient */}
                <button
                  onClick={() => updateWallpaper({ 
                    type: 'gradient',
                    gradientColors: ['#fbbf24', '#f97316', '#dc2626'],
                    gradientDirection: 'diagonal'
                  })}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    localDesign.theme.wallpaper?.type === 'gradient' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <IconColorSwatch size={24} className="mx-auto mb-2" />
                  <p className="text-sm">Gradient</p>
                </button>

                {/* Blur */}
                <button
                  onClick={() => updateWallpaper({ 
                    type: 'blur',
                    blurIntensity: 20,
                    blurColor: '#f3f4f6'
                  })}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    localDesign.theme.wallpaper?.type === 'blur' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <IconBlur size={24} className="mx-auto mb-2" />
                  <p className="text-sm">Blur</p>
                </button>

                {/* Pattern */}
                <button
                  onClick={() => updateWallpaper({ 
                    type: 'pattern',
                    patternType: 'dots',
                    patternColor: '#6b7280',
                    patternOpacity: 0.2
                  })}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    localDesign.theme.wallpaper?.type === 'pattern' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <IconGridDots size={24} className="mx-auto mb-2" />
                  <p className="text-sm">Pattern</p>
                </button>

                {/* Image */}
                <button
                  onClick={() => updateWallpaper({ 
                    type: 'image',
                    imageUrl: '',
                    imagePosition: 'center',
                    imageSize: 'cover'
                  })}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    localDesign.theme.wallpaper?.type === 'image' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <IconPhoto size={24} className="mx-auto mb-2" />
                  <p className="text-sm">Image</p>
                </button>

                {/* Video */}
                <button
                  onClick={() => updateWallpaper({ 
                    type: 'video',
                    videoUrl: '',
                    videoMuted: true,
                    videoLoop: true
                  })}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    localDesign.theme.wallpaper?.type === 'video' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <IconMovie size={24} className="mx-auto mb-2" />
                  <p className="text-sm">Video</p>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Wallpaper Options */}
          {localDesign.theme.wallpaper && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {localDesign.theme.wallpaper.type.charAt(0).toUpperCase() + 
                   localDesign.theme.wallpaper.type.slice(1)} Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Gradient Options */}
                {localDesign.theme.wallpaper.type === 'gradient' && (
                  <>
                    <div>
                      <Label>Suggested</Label>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {gradientPresets.map((preset) => (
                          <button
                            key={preset.name}
                            onClick={() => updateWallpaper({
                              ...localDesign.theme.wallpaper!,
                              gradientColors: preset.colors,
                              gradientDirection: preset.direction
                            })}
                            className="h-16 rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-all"
                            style={{
                              background: `linear-gradient(to ${preset.direction === 'diagonal' ? 'bottom right' : preset.direction}, ${preset.colors.join(', ')})`
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <Label>Direction</Label>
                      <Select
                        value={localDesign.theme.wallpaper.gradientDirection || 'down'}
                        onValueChange={(value: any) => updateWallpaper({
                          ...localDesign.theme.wallpaper!,
                          gradientDirection: value
                        })}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="up">Up</SelectItem>
                          <SelectItem value="down">Down</SelectItem>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                          <SelectItem value="diagonal">Diagonal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {/* Pattern Options */}
                {localDesign.theme.wallpaper.type === 'pattern' && (
                  <>
                    <div>
                      <Label>Pattern Type</Label>
                      <Select
                        value={localDesign.theme.wallpaper.patternType || 'dots'}
                        onValueChange={(value: any) => updateWallpaper({
                          ...localDesign.theme.wallpaper!,
                          patternType: value
                        })}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dots">Dots</SelectItem>
                          <SelectItem value="lines">Lines</SelectItem>
                          <SelectItem value="grid">Grid</SelectItem>
                          <SelectItem value="waves">Waves</SelectItem>
                          <SelectItem value="circles">Circles</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Pattern Opacity</Label>
                      <Slider
                        value={[(localDesign.theme.wallpaper.patternOpacity || 0.2) * 100]}
                        onValueChange={([value]) => updateWallpaper({
                          ...localDesign.theme.wallpaper!,
                          patternOpacity: value / 100
                        })}
                        max={100}
                        step={5}
                        className="mt-2"
                      />
                    </div>
                  </>
                )}

                {/* Image Options */}
                {localDesign.theme.wallpaper.type === 'image' && (
                  <>
                    <div>
                      <Label>Image URL</Label>
                      <Input
                        value={localDesign.theme.wallpaper.imageUrl || ''}
                        onChange={(e) => updateWallpaper({
                          ...localDesign.theme.wallpaper!,
                          imageUrl: e.target.value
                        })}
                        placeholder="https://example.com/image.jpg"
                        className="mt-2"
                      />
                    </div>
                    
                    <div>
                      <Label>Image Position</Label>
                      <Select
                        value={localDesign.theme.wallpaper.imagePosition || 'center'}
                        onValueChange={(value: any) => updateWallpaper({
                          ...localDesign.theme.wallpaper!,
                          imagePosition: value
                        })}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="top">Top</SelectItem>
                          <SelectItem value="bottom">Bottom</SelectItem>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {/* Video Options */}
                {localDesign.theme.wallpaper.type === 'video' && (
                  <>
                    <div>
                      <Label>Video URL</Label>
                      <Input
                        value={localDesign.theme.wallpaper.videoUrl || ''}
                        onChange={(e) => updateWallpaper({
                          ...localDesign.theme.wallpaper!,
                          videoUrl: e.target.value
                        })}
                        placeholder="https://example.com/video.mp4"
                        className="mt-2"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label>Muted</Label>
                      <Switch
                        checked={localDesign.theme.wallpaper.videoMuted ?? true}
                        onCheckedChange={(checked) => updateWallpaper({
                          ...localDesign.theme.wallpaper!,
                          videoMuted: checked
                        })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label>Loop</Label>
                      <Switch
                        checked={localDesign.theme.wallpaper.videoLoop ?? true}
                        onCheckedChange={(checked) => updateWallpaper({
                          ...localDesign.theme.wallpaper!,
                          videoLoop: checked
                        })}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <LayoutWithMobile previewContent={mobilePreviewContent}>
      {designContent}
    </LayoutWithMobile>
  );
}