// src/features/my-nooble/profile/components/widgets/spotify/spotify-editor.tsx
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { IconBrandSpotify, IconAlertCircle } from '@tabler/icons-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { WidgetEditor } from '../common/widget-editor';
import { SpotifyWidgetData, WidgetEditorProps } from '@/types/widget';
import { validateSpotifyData } from './spotify-config';

export function SpotifyEditor({
  data: initialData,
  onSave,
  onCancel,
  isLoading = false,
}: WidgetEditorProps<SpotifyWidgetData>) {
  const [formData, setFormData] = useState<SpotifyWidgetData>({
    spotifyUrl: initialData?.spotifyUrl || '',
    embedType: initialData?.embedType || 'playlist',
    height: initialData?.height || 380,
    theme: initialData?.theme || 'dark',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Auto-detect embed type from URL
  useEffect(() => {
    if (formData.spotifyUrl) {
      const url = formData.spotifyUrl;
      if (url.includes('/track/')) {
        setFormData(prev => ({ ...prev, embedType: 'track' }));
      } else if (url.includes('/playlist/')) {
        setFormData(prev => ({ ...prev, embedType: 'playlist' }));
      } else if (url.includes('/album/')) {
        setFormData(prev => ({ ...prev, embedType: 'album' }));
      } else if (url.includes('/artist/')) {
        setFormData(prev => ({ ...prev, embedType: 'artist' }));
      }
    }
  }, [formData.spotifyUrl]);

  const handleSave = async () => {
    const validation = validateSpotifyData(formData);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    
    setIsSaving(true);
    try {
      await onSave(formData);
    } catch (error) {
      setErrors({ 
        general: error instanceof Error ? error.message : 'Error al guardar el widget' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Get recommended heights based on embed type
  const getRecommendedHeight = () => {
    switch (formData.embedType) {
      case 'track':
        return { min: 80, recommended: 152, max: 200 };
      case 'playlist':
      case 'album':
        return { min: 300, recommended: 380, max: 600 };
      case 'artist':
        return { min: 200, recommended: 350, max: 500 };
      default:
        return { min: 80, recommended: 380, max: 600 };
    }
  };

  const heights = getRecommendedHeight();

  return (
    <WidgetEditor
      title={initialData ? 'Editar widget de Spotify' : 'Nuevo widget de Spotify'}
      icon={IconBrandSpotify}
      onSave={handleSave}
      onCancel={onCancel}
      isLoading={isLoading}
      isSaving={isSaving}
      error={errors.general}
    >
      {/* Spotify URL input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          URL de Spotify *
        </label>
        <Input
          type="url"
          placeholder="https://open.spotify.com/playlist/..."
          value={formData.spotifyUrl}
          onChange={(e) => {
            setFormData({ ...formData, spotifyUrl: e.target.value });
            if (errors.spotifyUrl) {
              const newErrors = { ...errors };
              delete newErrors.spotifyUrl;
              setErrors(newErrors);
            }
          }}
          className={errors.spotifyUrl ? 'border-red-300' : ''}
          disabled={isSaving || isLoading}
        />
        {errors.spotifyUrl && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <IconAlertCircle size={12} />
            {errors.spotifyUrl}
          </p>
        )}
        <p className="text-xs text-gray-500">
          Pega el enlace de una canción, playlist, álbum o artista
        </p>
      </div>

      {/* Embed type (auto-detected) */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Tipo de contenido
        </label>
        <Select
          value={formData.embedType}
          onValueChange={(value: 'track' | 'playlist' | 'album' | 'artist') => 
            setFormData({ ...formData, embedType: value })
          }
          disabled={isSaving || isLoading}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="track">Canción</SelectItem>
            <SelectItem value="playlist">Playlist</SelectItem>
            <SelectItem value="album">Álbum</SelectItem>
            <SelectItem value="artist">Artista</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500">
          Se detecta automáticamente desde la URL
        </p>
      </div>

      {/* Theme */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Tema</Label>
        <RadioGroup
          value={formData.theme}
          onValueChange={(value: 'dark' | 'light') => 
            setFormData({ ...formData, theme: value })
          }
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="dark" id="dark" />
            <Label htmlFor="dark" className="font-normal cursor-pointer">
              Oscuro - Fondo negro con texto blanco
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="light" id="light" />
            <Label htmlFor="light" className="font-normal cursor-pointer">
              Claro - Fondo blanco con texto negro
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Height */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Altura: {formData.height}px
        </Label>
        <Slider
          value={[formData.height]}
          onValueChange={([value]) => setFormData({ ...formData, height: value })}
          min={heights.min}
          max={heights.max}
          step={10}
          className="w-full"
          disabled={isSaving || isLoading}
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>Compacto ({heights.min}px)</span>
          <span className="text-primary">Recomendado ({heights.recommended}px)</span>
          <span>Expandido ({heights.max}px)</span>
        </div>
      </div>

      {/* Help text */}
      <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
        <p className="text-xs text-green-700 dark:text-green-300">
          <strong>Tip:</strong> Para obtener el enlace, abre Spotify, busca el contenido, 
          haz clic en los tres puntos (...) y selecciona "Compartir" → "Copiar enlace".
        </p>
      </div>
    </WidgetEditor>
  );
}