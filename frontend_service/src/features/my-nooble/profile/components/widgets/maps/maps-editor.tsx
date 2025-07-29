// src/features/my-nooble/profile/components/widgets/maps/maps-editor.tsx
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { IconMap, IconAlertCircle } from '@tabler/icons-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { WidgetEditor } from '../common/widget-editor';
import { MapsWidgetData, WidgetEditorProps } from '@/types/widget';
import { validateMapsData } from './maps-config';

export function MapsEditor({
  data: initialData,
  onSave,
  onCancel,
  isLoading = false,
}: WidgetEditorProps<MapsWidgetData>) {
  const [formData, setFormData] = useState<MapsWidgetData>({
    address: initialData?.address || '',
    latitude: initialData?.latitude,
    longitude: initialData?.longitude,
    zoomLevel: initialData?.zoomLevel || 15,
    mapStyle: initialData?.mapStyle || 'roadmap',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const validation = validateMapsData(formData);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    
    setIsSaving(true);
    try {
      await onSave(formData);
    } catch (error) {
      setErrors({ 
        general: error instanceof Error ? error.message : 'Error al guardar el mapa' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <WidgetEditor
      title={initialData ? 'Editar mapa' : 'Nuevo mapa'}
      icon={IconMap}
      onSave={handleSave}
      onCancel={onCancel}
      isLoading={isLoading}
      isSaving={isSaving}
      error={errors.general}
    >
      {/* Address input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Dirección *
        </label>
        <Input
          placeholder="Ej: Av. 9 de Julio 1234, Buenos Aires"
          value={formData.address}
          onChange={(e) => {
            setFormData({ ...formData, address: e.target.value });
            if (errors.address) {
              const newErrors = { ...errors };
              delete newErrors.address;
              setErrors(newErrors);
            }
          }}
          className={errors.address ? 'border-red-300' : ''}
          disabled={isSaving || isLoading}
          maxLength={500}
        />
        {errors.address && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <IconAlertCircle size={12} />
            {errors.address}
          </p>
        )}
      </div>

      {/* Coordinates (optional) */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Coordenadas (opcional)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Input
              type="number"
              placeholder="Latitud"
              value={formData.latitude || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                latitude: e.target.value ? parseFloat(e.target.value) : undefined 
              })}
              step="0.00000001"
              min="-90"
              max="90"
              disabled={isSaving || isLoading}
            />
          </div>
          <div>
            <Input
              type="number"
              placeholder="Longitud"
              value={formData.longitude || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                longitude: e.target.value ? parseFloat(e.target.value) : undefined 
              })}
              step="0.00000001"
              min="-180"
              max="180"
              disabled={isSaving || isLoading}
            />
          </div>
        </div>
        <p className="text-xs text-gray-500">
          Si proporcionas coordenadas, se usarán en lugar de la dirección
        </p>
      </div>

      {/* Map style */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Estilo de mapa
        </label>
        <Select
          value={formData.mapStyle}
          onValueChange={(value) => setFormData({ ...formData, mapStyle: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="roadmap">Mapa de calles</SelectItem>
            <SelectItem value="satellite">Satélite</SelectItem>
            <SelectItem value="hybrid">Híbrido</SelectItem>
            <SelectItem value="terrain">Terreno</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Zoom level */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Nivel de zoom: {formData.zoomLevel}
        </Label>
        <Slider
          value={[formData.zoomLevel]}
          onValueChange={([value]) => setFormData({ ...formData, zoomLevel: value })}
          min={1}
          max={20}
          step={1}
          className="w-full"
          disabled={isSaving || isLoading}
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>Mundo</span>
          <span>Ciudad</span>
          <span>Calle</span>
        </div>
      </div>
    </WidgetEditor>
  );
}