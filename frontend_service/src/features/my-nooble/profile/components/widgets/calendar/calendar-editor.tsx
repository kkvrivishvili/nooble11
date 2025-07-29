// src/features/my-nooble/profile/components/widgets/calendar/calendar-editor.tsx
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { IconCalendar, IconAlertCircle } from '@tabler/icons-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { WidgetEditor } from '../common/widget-editor';
import { CalendarWidgetData, WidgetEditorProps } from '@/types/widget';
import { validateCalendarData } from './calendar-config';

export function CalendarEditor({
  data: initialData,
  onSave,
  onCancel,
  isLoading = false,
}: WidgetEditorProps<CalendarWidgetData>) {
  const [formData, setFormData] = useState<CalendarWidgetData>({
    calendlyUrl: initialData?.calendlyUrl || '',
    title: initialData?.title || 'Agenda una reunión',
    hideEventDetails: initialData?.hideEventDetails ?? false,
    hideCookieBanner: initialData?.hideCookieBanner ?? true,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const validation = validateCalendarData(formData);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    
    setIsSaving(true);
    try {
      await onSave(formData);
    } catch (error) {
      setErrors({ 
        general: error instanceof Error ? error.message : 'Error al guardar el calendario' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <WidgetEditor
      title={initialData ? 'Editar calendario' : 'Nuevo calendario'}
      icon={IconCalendar}
      onSave={handleSave}
      onCancel={onCancel}
      isLoading={isLoading}
      isSaving={isSaving}
      error={errors.general}
    >
      {/* Calendly URL input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          URL de Calendly *
        </label>
        <Input
          type="url"
          placeholder="https://calendly.com/tu-usuario"
          value={formData.calendlyUrl}
          onChange={(e) => {
            setFormData({ ...formData, calendlyUrl: e.target.value });
            if (errors.calendlyUrl) {
              const newErrors = { ...errors };
              delete newErrors.calendlyUrl;
              setErrors(newErrors);
            }
          }}
          className={errors.calendlyUrl ? 'border-red-300' : ''}
          disabled={isSaving || isLoading}
        />
        {errors.calendlyUrl && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <IconAlertCircle size={12} />
            {errors.calendlyUrl}
          </p>
        )}
        <p className="text-xs text-gray-500">
          Ingresa tu enlace público de Calendly
        </p>
      </div>

      {/* Title input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Título *
        </label>
        <Input
          placeholder="Ej: Agenda una llamada conmigo"
          value={formData.title}
          onChange={(e) => {
            setFormData({ ...formData, title: e.target.value });
            if (errors.title) {
              const newErrors = { ...errors };
              delete newErrors.title;
              setErrors(newErrors);
            }
          }}
          className={errors.title ? 'border-red-300' : ''}
          disabled={isSaving || isLoading}
          maxLength={100}
        />
        <div className="flex justify-between">
          {errors.title && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <IconAlertCircle size={12} />
              {errors.title}
            </p>
          )}
          <span className="text-xs text-gray-500 ml-auto">
            {formData.title.length}/100
          </span>
        </div>
      </div>

      {/* Options */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="hide-details" className="text-sm font-medium">
              Ocultar detalles del evento
            </Label>
            <p className="text-xs text-gray-500">
              No muestra la descripción del tipo de evento
            </p>
          </div>
          <Switch
            id="hide-details"
            checked={formData.hideEventDetails}
            onCheckedChange={(checked) => 
              setFormData({ ...formData, hideEventDetails: checked })
            }
            disabled={isSaving || isLoading}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="hide-cookie" className="text-sm font-medium">
              Ocultar aviso de cookies
            </Label>
            <p className="text-xs text-gray-500">
              Oculta el banner de cookies de Calendly
            </p>
          </div>
          <Switch
            id="hide-cookie"
            checked={formData.hideCookieBanner}
            onCheckedChange={(checked) => 
              setFormData({ ...formData, hideCookieBanner: checked })
            }
            disabled={isSaving || isLoading}
          />
        </div>
      </div>

      {/* Help text */}
      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          <strong>Nota:</strong> Asegúrate de que tu evento en Calendly esté configurado como público 
          para que los visitantes puedan agendar reuniones.
        </p>
      </div>
    </WidgetEditor>
  );
}