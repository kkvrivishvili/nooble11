// src/features/my-nooble/design/components/WallpaperSection.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { ProfileWallpaper } from '@/types/profile';
import { gradientPresets } from '@/api/design-api';
import { cn } from '@/lib/utils';
import {
  IconPhoto,
  IconColorSwatch,
  IconBlur,
  IconGridDots,
  IconMovie,
  IconUser,
  IconSquare
} from '@tabler/icons-react';

interface WallpaperSectionProps {
  wallpaper?: ProfileWallpaper;
  primaryColor: string;
  onUpdateWallpaper: (wallpaper: ProfileWallpaper) => void;
}

export function WallpaperSection({ wallpaper, primaryColor, onUpdateWallpaper }: WallpaperSectionProps) {
  const wallpaperTypes = [
    { type: 'fill' as const, icon: IconSquare, label: 'Color sólido' },
    { type: 'gradient' as const, icon: IconColorSwatch, label: 'Degradado' },
    { type: 'pattern' as const, icon: IconGridDots, label: 'Patrón' },
    { type: 'blur' as const, icon: IconBlur, label: 'Desenfoque' },
    { type: 'image' as const, icon: IconPhoto, label: 'Imagen' },
    { type: 'video' as const, icon: IconMovie, label: 'Video' },
  ];

  const WallpaperTypeButton = ({ 
    type, 
    icon: Icon, 
    label 
  }: typeof wallpaperTypes[0]) => (
    <button
      onClick={() => {
        const defaults: Record<typeof type, ProfileWallpaper> = {
          fill: { type: 'fill', fillColor: '#f9fafb' },
          gradient: { 
            type: 'gradient', 
            gradientColors: ['#fbbf24', '#f97316', '#dc2626'],
            gradientDirection: 'diagonal',
            gradientType: 'linear'
          },
          pattern: { 
            type: 'pattern',
            patternType: 'dots',
            patternColor: primaryColor,
            patternOpacity: 0.1
          },
          blur: { 
            type: 'blur',
            blurIntensity: 20,
            blurColor: '#f3f4f6'
          },
          image: { 
            type: 'image',
            imageUrl: '',
            imagePosition: 'center',
            imageSize: 'cover'
          },
          video: { 
            type: 'video',
            videoUrl: '',
            videoMuted: true,
            videoLoop: true
          }
        };
        onUpdateWallpaper(defaults[type]);
      }}
      className={cn(
        "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all",
        "hover:scale-105",
        wallpaper?.type === type 
          ? "border-primary bg-primary/10" 
          : "border-gray-200 dark:border-gray-700"
      )}
    >
      <Icon size={20} className={wallpaper?.type === type ? "text-primary" : "text-gray-600"} />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Fondo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Wallpaper Type Selection */}
        <div className="grid grid-cols-3 gap-3">
          {wallpaperTypes.map((type) => (
            <WallpaperTypeButton key={type.type} {...type} />
          ))}
        </div>

        {/* Wallpaper Options */}
        {wallpaper && (
          <div className="space-y-4 pt-4 border-t">
            {/* Fill Options */}
            {wallpaper.type === 'fill' && (
              <div className="space-y-2">
                <Label className="text-sm">Color de fondo</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={wallpaper.fillColor || '#f9fafb'}
                    onChange={(e) => onUpdateWallpaper({
                      ...wallpaper,
                      fillColor: e.target.value
                    })}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={wallpaper.fillColor || '#f9fafb'}
                    onChange={(e) => onUpdateWallpaper({
                      ...wallpaper,
                      fillColor: e.target.value
                    })}
                    className="flex-1 font-mono text-sm"
                  />
                </div>
              </div>
            )}

            {/* Gradient Options */}
            {wallpaper.type === 'gradient' && (
              <>
                <div>
                  <Label className="text-sm mb-2 block">Presets</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {gradientPresets.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => onUpdateWallpaper({
                          ...wallpaper,
                          gradientColors: preset.colors,
                          gradientDirection: preset.direction
                        })}
                        className="h-12 rounded-lg border hover:scale-105 transition-transform"
                        style={{
                          background: `linear-gradient(to ${
                            preset.direction === 'diagonal' ? 'bottom right' : preset.direction
                          }, ${preset.colors.join(', ')})`
                        }}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm">Dirección</Label>
                  <Select
                    value={wallpaper.gradientDirection || 'down'}
                    onValueChange={(value: any) => onUpdateWallpaper({
                      ...wallpaper,
                      gradientDirection: value
                    })}
                  >
                    <SelectTrigger className="h-9">
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
              </>
            )}

            {/* Pattern Options */}
            {wallpaper.type === 'pattern' && (
              <>
                <div className="space-y-2">
                  <Label className="text-sm">Tipo de patrón</Label>
                  <Select
                    value={wallpaper.patternType || 'dots'}
                    onValueChange={(value: any) => onUpdateWallpaper({
                      ...wallpaper,
                      patternType: value
                    })}
                  >
                    <SelectTrigger className="h-9">
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
                
                <div className="space-y-2">
                  <Label className="text-sm">Opacidad del patrón</Label>
                  <Slider
                    value={[(wallpaper.patternOpacity || 0.2) * 100]}
                    onValueChange={([value]) => onUpdateWallpaper({
                      ...wallpaper,
                      patternOpacity: value / 100
                    })}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm">Color del patrón</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={wallpaper.patternColor || primaryColor}
                      onChange={(e) => onUpdateWallpaper({
                        ...wallpaper,
                        patternColor: e.target.value
                      })}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={wallpaper.patternColor || primaryColor}
                      onChange={(e) => onUpdateWallpaper({
                        ...wallpaper,
                        patternColor: e.target.value
                      })}
                      className="flex-1 font-mono text-sm"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Blur Options */}
            {wallpaper.type === 'blur' && (
              <>
                <div className="space-y-2">
                  <Label className="text-sm">Intensidad del desenfoque</Label>
                  <Slider
                    value={[wallpaper.blurIntensity || 20]}
                    onValueChange={([value]) => onUpdateWallpaper({
                      ...wallpaper,
                      blurIntensity: value
                    })}
                    max={50}
                    step={5}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm">Color base</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={wallpaper.blurColor || '#f3f4f6'}
                      onChange={(e) => onUpdateWallpaper({
                        ...wallpaper,
                        blurColor: e.target.value
                      })}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={wallpaper.blurColor || '#f3f4f6'}
                      onChange={(e) => onUpdateWallpaper({
                        ...wallpaper,
                        blurColor: e.target.value
                      })}
                      className="flex-1 font-mono text-sm"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Image Options */}
            {wallpaper.type === 'image' && (
              <>
                <div className="space-y-2">
                  <Label className="text-sm">URL de la imagen</Label>
                  <Input
                    value={wallpaper.imageUrl || ''}
                    onChange={(e) => onUpdateWallpaper({
                      ...wallpaper,
                      imageUrl: e.target.value
                    })}
                    placeholder="https://ejemplo.com/imagen.jpg"
                    className="font-mono text-sm"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm">Posición</Label>
                  <Select
                    value={wallpaper.imagePosition || 'center'}
                    onValueChange={(value: any) => onUpdateWallpaper({
                      ...wallpaper,
                      imagePosition: value
                    })}
                  >
                    <SelectTrigger className="h-9">
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
              </>
            )}

            {/* Video Options */}
            {wallpaper.type === 'video' && (
              <>
                <div className="space-y-2">
                  <Label className="text-sm">URL del video</Label>
                  <Input
                    value={wallpaper.videoUrl || ''}
                    onChange={(e) => onUpdateWallpaper({
                      ...wallpaper,
                      videoUrl: e.target.value
                    })}
                    placeholder="https://ejemplo.com/video.mp4"
                    className="font-mono text-sm"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Silenciado</Label>
                  <Switch
                    checked={wallpaper.videoMuted ?? true}
                    onCheckedChange={(checked) => onUpdateWallpaper({
                      ...wallpaper,
                      videoMuted: checked
                    })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Repetir</Label>
                  <Switch
                    checked={wallpaper.videoLoop ?? true}
                    onCheckedChange={(checked) => onUpdateWallpaper({
                      ...wallpaper,
                      videoLoop: checked
                    })}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}