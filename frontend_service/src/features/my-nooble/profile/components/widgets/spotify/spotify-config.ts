// src/features/my-nooble/profile/components/widgets/spotify/spotify-config.ts
import { IconBrandSpotify } from '@tabler/icons-react';
import { SpotifyWidgetData, WidgetConfig, ValidationResult, WidgetType } from '@/types/widget';

export function validateSpotifyData(data: SpotifyWidgetData): ValidationResult {
  const errors: Record<string, string> = {};
  
  // Validate Spotify URL
  if (!data.spotifyUrl?.trim()) {
    errors.spotifyUrl = 'La URL de Spotify es requerida';
  } else {
    // Basic Spotify URL validation
    const spotifyRegex = /^(https?:\/\/)?(open\.)?spotify\.com\/(track|playlist|album|artist|show|episode)\/[a-zA-Z0-9]+/;
    if (!spotifyRegex.test(data.spotifyUrl)) {
      errors.spotifyUrl = 'URL de Spotify inválida';
    }
  }
  
  // Validate height
  if (data.height < 80 || data.height > 600) {
    errors.height = 'La altura debe estar entre 80 y 600 píxeles';
  }
  
  // Validate embed type
  if (!['track', 'playlist', 'album', 'artist'].includes(data.embedType)) {
    errors.embedType = 'Tipo de contenido inválido';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export const spotifyWidgetConfig: WidgetConfig<SpotifyWidgetData> = {
  type: WidgetType.Spotify,
  label: 'Spotify',
  description: 'Comparte tu música favorita de Spotify',
  icon: IconBrandSpotify,
  defaultData: {
    spotifyUrl: '',
    embedType: 'playlist',
    height: 380,
    theme: 'dark'
  },
  validator: validateSpotifyData
};