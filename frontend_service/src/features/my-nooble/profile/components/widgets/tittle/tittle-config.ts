// src/features/my-nooble/profile/components/widgets/title/title-config.ts
import { IconLetterT } from '@tabler/icons-react';
import { TitleWidgetData, WidgetConfig, ValidationResult, WidgetType } from '@/types/widget';

export function validateTitleData(data: TitleWidgetData): ValidationResult {
  const errors: Record<string, string> = {};
  
  // Validate text
  if (!data.text?.trim()) {
    errors.text = 'El texto es requerido';
  } else if (data.text.length > 200) {
    errors.text = 'El texto no puede tener más de 200 caracteres';
  }
  
  // Validate fontSize
  if (!['sm', 'md', 'lg', 'xl', '2xl', '3xl'].includes(data.fontSize)) {
    errors.fontSize = 'Tamaño de fuente inválido';
  }
  
  // Validate textAlign
  if (!['left', 'center', 'right'].includes(data.textAlign)) {
    errors.textAlign = 'Alineación inválida';
  }
  
  // Validate fontWeight
  if (!['normal', 'medium', 'semibold', 'bold'].includes(data.fontWeight)) {
    errors.fontWeight = 'Peso de fuente inválido';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export const titleWidgetConfig: WidgetConfig<TitleWidgetData> = {
  type: WidgetType.Title,
  label: 'Título',
  description: 'Agrega un título o encabezado para organizar tu contenido',
  icon: IconLetterT,
  defaultData: {
    text: '',
    fontSize: 'xl',
    textAlign: 'center',
    fontWeight: 'bold'
  },
  validator: validateTitleData
};