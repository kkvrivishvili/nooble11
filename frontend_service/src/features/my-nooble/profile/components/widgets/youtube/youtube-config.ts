// src/features/my-nooble/profile/components/widgets/youtube/youtube-config.ts
import { IconBrandYoutube } from '@tabler/icons-react';
import { YouTubeWidgetData, WidgetConfig, ValidationResult, WidgetType } from '@/types/widget';

export function validateYouTubeData(data: YouTubeWidgetData): ValidationResult {
  const errors: Record<string, string> = {};
  
  // Validate video URL
  if (!data.videoUrl?.trim()) {
    errors.videoUrl = 'La URL del video es requerida';
  } else {
    // Basic YouTube URL validation
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w-]+/;
    if (!youtubeRegex.test(data.videoUrl)) {
      errors.videoUrl = 'URL de YouTube inválida';
    }
  }
  
  // Validate title
  if (data.title && data.title.length > 100) {
    errors.title = 'El título no puede tener más de 100 caracteres';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export const youtubeWidgetConfig: WidgetConfig<YouTubeWidgetData> = {
  type: WidgetType.YouTube,
  label: 'YouTube',
  description: 'Inserta un video de YouTube',
  icon: IconBrandYoutube,
  defaultData: {
    videoUrl: '',
    title: '',
    autoplay: false,
    showControls: true
  },
  validator: validateYouTubeData
};