// src/features/my-nooble/profile/components/widgets/youtube/youtube-editor.tsx
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { IconBrandYoutube, IconAlertCircle } from '@tabler/icons-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { WidgetEditor } from '../common/widget-editor';
import { YouTubeWidgetData, WidgetEditorProps } from '@/types/widget';
import { validateYouTubeData } from './youtube-config';

export function YouTubeEditor({
  data: initialData,
  onSave,
  onCancel,
  isLoading = false,
}: WidgetEditorProps<YouTubeWidgetData>) {
  const [formData, setFormData] = useState<YouTubeWidgetData>({
    videoUrl: initialData?.videoUrl || '',
    title: initialData?.title || '',
    autoplay: initialData?.autoplay ?? false,
    showControls: initialData?.showControls ?? true,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const validation = validateYouTubeData(formData);
    
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

  return (
    <WidgetEditor
      title={initialData ? 'Editar video de YouTube' : 'Nuevo video de YouTube'}
      icon={IconBrandYoutube}
      onSave={handleSave}
      onCancel={onCancel}
      isLoading={isLoading}
      isSaving={isSaving}
      error={errors.general}
    >
      {/* Video URL input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          URL del video *
        </label>
        <Input
          type="url"
          placeholder="https://www.youtube.com/watch?v=..."
          value={formData.videoUrl}
          onChange={(e) => {
            setFormData({ ...formData, videoUrl: e.target.value });
            if (errors.videoUrl) {
              const newErrors = { ...errors };
              delete newErrors.videoUrl;
              setErrors(newErrors);
            }
          }}
          className={errors.videoUrl ? 'border-red-300' : ''}
          disabled={isSaving || isLoading}
        />
        {errors.videoUrl && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <IconAlertCircle size={12} />
            {errors.videoUrl}
          </p>
        )}
      </div>

      {/* Title input (optional) */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Título (opcional)
        </label>
        <Input
          placeholder="Ej: Mi último video"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          disabled={isSaving || isLoading}
          maxLength={100}
        />
      </div>

      {/* Options */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="autoplay" className="text-sm font-medium">
            Reproducir automáticamente
          </Label>
          <Switch
            id="autoplay"
            checked={formData.autoplay}
            onCheckedChange={(checked) => 
              setFormData({ ...formData, autoplay: checked })
            }
            disabled={isSaving || isLoading}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="show-controls" className="text-sm font-medium">
            Mostrar controles del video
          </Label>
          <Switch
            id="show-controls"
            checked={formData.showControls}
            onCheckedChange={(checked) => 
              setFormData({ ...formData, showControls: checked })
            }
            disabled={isSaving || isLoading}
          />
        </div>
      </div>
    </WidgetEditor>
  );
}