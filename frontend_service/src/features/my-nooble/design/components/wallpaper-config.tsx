import React from 'react';
import { ProfileWallpaper } from '@/types/profile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { gradientPresets } from '@/api/design-api';
import { StyleSelector } from './style-selector';
import { ColorPicker } from './color-picker';
import {
  IconSquare,
  IconColorSwatch,
  IconBlur,
  IconGridDots,
  IconPhoto,
  IconMovie,
} from '@tabler/icons-react';

interface WallpaperConfigProps {
  wallpaper?: ProfileWallpaper;
  onChange: (wallpaper: ProfileWallpaper) => void;
  theme: any;
}

export function WallpaperConfig({ wallpaper, onChange, theme }: WallpaperConfigProps) {
  const wallpaperTypes = [
    { value: 'fill', label: 'Color sólido', icon: <IconSquare size={24} /> },
    { value: 'gradient', label: 'Degradado', icon: <IconColorSwatch size={24} /> },
    { value: 'blur', label: 'Desenfoque', icon: <IconBlur size={24} /> },
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
        newWallpaper.gradientColors = ['#fbbf24', '#f97316', '#dc2626'];
        newWallpaper.gradientDirection = 'diagonal';
        break;
      case 'blur':
        newWallpaper.blurIntensity = 20;
        newWallpaper.blurColor = '#f3f4f6';
        break;
      case 'pattern':
        newWallpaper.patternType = 'dots';
        newWallpaper.patternColor = '#6b7280';
        newWallpaper.patternOpacity = 0.2;
        break;
      case 'image':
        newWallpaper.imageUrl = '';
        newWallpaper.imagePosition = 'center';
        newWallpaper.imageSize = 'cover';
        break;
      case 'video':
        newWallpaper.videoUrl = '';
        newWallpaper.videoMuted = true;
        newWallpaper.videoLoop = true;
        break;
    }
    
    onChange(newWallpaper);
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
            <ColorPicker
              label="Color de fondo"
              value={wallpaper.fillColor || '#f3f4f6'}
              onChange={(color) => onChange({ ...wallpaper, fillColor: color })}
            />
          </div>
        )}

        {/* Gradient Options */}
        {wallpaper?.type === 'gradient' && (
          <div className="space-y-4">
            <div>
              <Label>Degradados sugeridos</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {gradientPresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => onChange({
                      ...wallpaper,
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
                <SelectContent>
                  <SelectItem value="up">Arriba</SelectItem>
                  <SelectItem value="down">Abajo</SelectItem>
                  <SelectItem value="left">Izquierda</SelectItem>
                  <SelectItem value="right">Derecha</SelectItem>
                  <SelectItem value="diagonal">Diagonal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Blur Options */}
        {wallpaper?.type === 'blur' && (
          <div className="space-y-4">
            <ColorPicker
              label="Color base"
              value={wallpaper.blurColor || '#f3f4f6'}
              onChange={(color) => onChange({ ...wallpaper, blurColor: color })}
            />
            
            <div>
              <Label>Intensidad del desenfoque</Label>
              <Slider
                value={[(wallpaper.blurIntensity || 20)]}
                onValueChange={([value]) => onChange({
                  ...wallpaper,
                  blurIntensity: value
                })}
                max={50}
                step={5}
                className="mt-2"
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
                <SelectContent>
                  <SelectItem value="dots">Puntos</SelectItem>
                  <SelectItem value="lines">Líneas</SelectItem>
                  <SelectItem value="grid">Cuadrícula</SelectItem>
                  <SelectItem value="waves">Ondas</SelectItem>
                  <SelectItem value="circles">Círculos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <ColorPicker
              label="Color del patrón"
              value={wallpaper.patternColor || '#6b7280'}
              onChange={(color) => onChange({ ...wallpaper, patternColor: color })}
            />
            
            <div>
              <Label>Opacidad del patrón</Label>
              <Slider
                value={[(wallpaper.patternOpacity || 0.2) * 100]}
                onValueChange={([value]) => onChange({
                  ...wallpaper,
                  patternOpacity: value / 100
                })}
                max={100}
                step={5}
                className="mt-2"
              />
            </div>
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
                <SelectContent>
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
                <SelectContent>
                  <SelectItem value="cover">Cubrir</SelectItem>
                  <SelectItem value="contain">Contener</SelectItem>
                  <SelectItem value="auto">Automático</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}