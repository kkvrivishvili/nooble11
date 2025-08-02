import { useState } from 'react';
import { ProfileWallpaper } from '@/types/profile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { gradientPresets } from '@/api/design-api';
import { StyleSelector } from './style-selector';
import { ColorPicker } from './color-picker';
import {
  IconSquare,
  IconColorSwatch,
  IconGridDots,
  IconPhoto,
  IconMovie,
  IconPlus,
  IconTrash,
} from '@tabler/icons-react';

interface WallpaperConfigProps {
  wallpaper?: ProfileWallpaper;
  onChange: (wallpaper: ProfileWallpaper) => void;
  theme: any;
}

export function WallpaperConfig({ wallpaper, onChange, theme }: WallpaperConfigProps) {
  const [customGradientColors, setCustomGradientColors] = useState<string[]>(
    wallpaper?.gradientColors || ['#fbbf24', '#f97316', '#dc2626']
  );

  const wallpaperTypes = [
    { value: 'fill', label: 'Color sólido', icon: <IconSquare size={24} /> },
    { value: 'gradient', label: 'Degradado', icon: <IconColorSwatch size={24} /> },
    { value: 'pattern', label: 'Patrón', icon: <IconGridDots size={24} /> },
    { value: 'image', label: 'Imagen', icon: <IconPhoto size={24} /> },
    { value: 'video', label: 'Video', icon: <IconMovie size={24} /> },
  ];

  const handleTypeChange = (type: string) => {
    const newWallpaper: ProfileWallpaper = { type: type as any };
    
    // Set default values for each type
    switch (type) {
      case 'fill':
        newWallpaper.fillColor = theme?.backgroundColor || '#f3f4f6';
        break;
      case 'gradient':
        newWallpaper.gradientColors = customGradientColors;
        newWallpaper.gradientDirection = 'diagonal';
        break;
      case 'pattern':
        newWallpaper.patternType = 'dots';
        newWallpaper.patternColor = '#6b7280';
        newWallpaper.patternOpacity = 0.2;
        newWallpaper.patternBlur = false;
        newWallpaper.patternBlurIntensity = 5;
        break;
      case 'image':
        newWallpaper.imageUrl = '';
        newWallpaper.imagePosition = 'center';
        newWallpaper.imageSize = 'cover';
        newWallpaper.imageBlur = false;
        newWallpaper.imageBlurIntensity = 10;
        break;
      case 'video':
        newWallpaper.videoUrl = '';
        newWallpaper.videoMuted = true;
        newWallpaper.videoLoop = true;
        newWallpaper.videoBlur = false;
        newWallpaper.videoBlurIntensity = 10;
        break;
    }
    
    onChange(newWallpaper);
  };

  const addGradientColor = () => {
    const newColors = [...customGradientColors, '#000000'];
    setCustomGradientColors(newColors);
    if (wallpaper?.type === 'gradient') {
      onChange({ ...wallpaper, gradientColors: newColors });
    }
  };

  const removeGradientColor = (index: number) => {
    if (customGradientColors.length <= 2) return; // Mínimo 2 colores
    const newColors = customGradientColors.filter((_, i) => i !== index);
    setCustomGradientColors(newColors);
    if (wallpaper?.type === 'gradient') {
      onChange({ ...wallpaper, gradientColors: newColors });
    }
  };

  const updateGradientColor = (index: number, color: string) => {
    const newColors = [...customGradientColors];
    newColors[index] = color;
    setCustomGradientColors(newColors);
    if (wallpaper?.type === 'gradient') {
      onChange({ ...wallpaper, gradientColors: newColors });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fondo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <StyleSelector
          label="Tipo de fondo"
          value={wallpaper?.type || 'fill'}
          options={wallpaperTypes}
          onChange={handleTypeChange}
          columns={3}
        />

        {/* Fill Options */}
        {wallpaper?.type === 'fill' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Color de fondo</Label>
              <ColorPicker
                value={wallpaper.fillColor || '#f3f4f6'}
                onChange={(color) => onChange({ ...wallpaper, fillColor: color })}
              />
            </div>
          </div>
        )}

        {/* Gradient Options */}
        {wallpaper?.type === 'gradient' && (
          <div className="space-y-4">
            <div>
              <Label className="mb-3 block">Degradados sugeridos</Label>
              <div className="grid grid-cols-2 gap-3">
                {gradientPresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => {
                      setCustomGradientColors(preset.colors);
                      onChange({
                        ...wallpaper,
                        gradientColors: preset.colors,
                        gradientDirection: preset.direction
                      });
                    }}
                    className="relative h-24 rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-all overflow-hidden group"
                  >
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(to ${preset.direction === 'diagonal' ? 'bottom right' : preset.direction}, ${preset.colors.join(', ')})`
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                      <span className="text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity capitalize">
                        {preset.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-3 block">Colores personalizados</Label>
              <div className="space-y-3">
                {customGradientColors.map((color, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-sm font-medium w-16">Color {index + 1}</span>
                    <div className="flex-1">
                      <ColorPicker
                        value={color}
                        onChange={(newColor) => updateGradientColor(index, newColor)}
                      />
                    </div>
                    {customGradientColors.length > 2 && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeGradientColor(index)}
                      >
                        <IconTrash size={16} />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addGradientColor}
                  className="w-full"
                >
                  <IconPlus size={16} className="mr-2" />
                  Agregar color
                </Button>
              </div>
            </div>
            
            <div>
              <Label>Dirección</Label>
              <Select
                value={wallpaper.gradientDirection || 'down'}
                onValueChange={(value: any) => onChange({
                  ...wallpaper,
                  gradientDirection: value
                })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent portal={false}>
                  <SelectItem value="up">Arriba</SelectItem>
                  <SelectItem value="down">Abajo</SelectItem>
                  <SelectItem value="left">Izquierda</SelectItem>
                  <SelectItem value="right">Derecha</SelectItem>
                  <SelectItem value="diagonal">Diagonal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Vista previa del degradado */}
            <div>
              <Label className="mb-2 block">Vista previa</Label>
              <div
                className="h-32 rounded-lg border-2 border-gray-200"
                style={{
                  background: `linear-gradient(to ${wallpaper.gradientDirection === 'diagonal' ? 'bottom right' : wallpaper.gradientDirection}, ${customGradientColors.join(', ')})`
                }}
              />
            </div>
          </div>
        )}

        {/* Pattern Options */}
        {wallpaper?.type === 'pattern' && (
          <div className="space-y-4">
            <div>
              <Label>Tipo de patrón</Label>
              <Select
                value={wallpaper.patternType || 'dots'}
                onValueChange={(value: any) => onChange({
                  ...wallpaper,
                  patternType: value
                })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent portal={false}>
                  <SelectItem value="dots">Puntos</SelectItem>
                  <SelectItem value="lines">Líneas</SelectItem>
                  <SelectItem value="grid">Cuadrícula</SelectItem>
                  <SelectItem value="waves">Ondas</SelectItem>
                  <SelectItem value="circles">Círculos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <Label>Color del patrón</Label>
              <ColorPicker
                value={wallpaper.patternColor || '#6b7280'}
                onChange={(color) => onChange({ ...wallpaper, patternColor: color })}
              />
            </div>
            
            <div>
              <Label>Opacidad del patrón</Label>
              <div className="mt-2" style={{ touchAction: 'none' }}>
                <Slider
                  value={[(wallpaper.patternOpacity || 0.2) * 100]}
                  onValueChange={([value]) => onChange({
                    ...wallpaper,
                    patternOpacity: value / 100
                  })}
                  max={100}
                  step={5}
                />
              </div>
              <span className="text-xs text-gray-500 mt-1">
                {Math.round((wallpaper.patternOpacity || 0.2) * 100)}%
              </span>
            </div>

            <div className="flex items-center justify-between">
              <Label>Aplicar desenfoque</Label>
              <Switch
                checked={wallpaper.patternBlur ?? false}
                onCheckedChange={(checked) => onChange({
                  ...wallpaper,
                  patternBlur: checked
                })}
              />
            </div>

            {wallpaper.patternBlur && (
              <div>
                <Label>Intensidad del desenfoque</Label>
                <div className="mt-2" style={{ touchAction: 'none' }}>
                  <Slider
                    value={[wallpaper.patternBlurIntensity || 5]}
                    onValueChange={([value]) => onChange({
                      ...wallpaper,
                      patternBlurIntensity: value
                    })}
                    max={20}
                    step={1}
                  />
                </div>
                <span className="text-xs text-gray-500 mt-1">
                  {wallpaper.patternBlurIntensity || 5}px
                </span>
              </div>
            )}
          </div>
        )}

        {/* Image Options */}
        {wallpaper?.type === 'image' && (
          <div className="space-y-4">
            <div>
              <Label>URL de la imagen</Label>
              <Input
                value={wallpaper.imageUrl || ''}
                onChange={(e) => onChange({
                  ...wallpaper,
                  imageUrl: e.target.value
                })}
                placeholder="https://ejemplo.com/imagen.jpg"
                className="mt-2"
              />
            </div>
            
            <div>
              <Label>Posición de la imagen</Label>
              <Select
                value={wallpaper.imagePosition || 'center'}
                onValueChange={(value: any) => onChange({
                  ...wallpaper,
                  imagePosition: value
                })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent portal={false}>
                  <SelectItem value="center">Centro</SelectItem>
                  <SelectItem value="top">Arriba</SelectItem>
                  <SelectItem value="bottom">Abajo</SelectItem>
                  <SelectItem value="left">Izquierda</SelectItem>
                  <SelectItem value="right">Derecha</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Tamaño de la imagen</Label>
              <Select
                value={wallpaper.imageSize || 'cover'}
                onValueChange={(value: any) => onChange({
                  ...wallpaper,
                  imageSize: value
                })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent portal={false}>
                  <SelectItem value="cover">Cubrir</SelectItem>
                  <SelectItem value="contain">Contener</SelectItem>
                  <SelectItem value="auto">Automático</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label>Aplicar desenfoque</Label>
              <Switch
                checked={wallpaper.imageBlur ?? false}
                onCheckedChange={(checked) => onChange({
                  ...wallpaper,
                  imageBlur: checked
                })}
              />
            </div>

            {wallpaper.imageBlur && (
              <div>
                <Label>Intensidad del desenfoque</Label>
                <div className="mt-2" style={{ touchAction: 'none' }}>
                  <Slider
                    value={[wallpaper.imageBlurIntensity || 10]}
                    onValueChange={([value]) => onChange({
                      ...wallpaper,
                      imageBlurIntensity: value
                    })}
                    max={50}
                    step={5}
                  />
                </div>
                <span className="text-xs text-gray-500 mt-1">
                  {wallpaper.imageBlurIntensity || 10}px
                </span>
              </div>
            )}
          </div>
        )}

        {/* Video Options */}
        {wallpaper?.type === 'video' && (
          <div className="space-y-4">
            <div>
              <Label>URL del video</Label>
              <Input
                value={wallpaper.videoUrl || ''}
                onChange={(e) => onChange({
                  ...wallpaper,
                  videoUrl: e.target.value
                })}
                placeholder="https://ejemplo.com/video.mp4"
                className="mt-2"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label>Silenciado</Label>
              <Switch
                checked={wallpaper.videoMuted ?? true}
                onCheckedChange={(checked) => onChange({
                  ...wallpaper,
                  videoMuted: checked
                })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label>Reproducir en bucle</Label>
              <Switch
                checked={wallpaper.videoLoop ?? true}
                onCheckedChange={(checked) => onChange({
                  ...wallpaper,
                  videoLoop: checked
                })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Aplicar desenfoque</Label>
              <Switch
                checked={wallpaper.videoBlur ?? false}
                onCheckedChange={(checked) => onChange({
                  ...wallpaper,
                  videoBlur: checked
                })}
              />
            </div>

            {wallpaper.videoBlur && (
              <div>
                <Label>Intensidad del desenfoque</Label>
                <div className="mt-2" style={{ touchAction: 'none' }}>
                  <Slider
                    value={[wallpaper.videoBlurIntensity || 10]}
                    onValueChange={([value]) => onChange({
                      ...wallpaper,
                      videoBlurIntensity: value
                    })}
                    max={50}
                    step={5}
                  />
                </div>
                <span className="text-xs text-gray-500 mt-1">
                  {wallpaper.videoBlurIntensity || 10}px
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}