// src/features/my-nooble/profile/components/widgets/agents/agents-config.ts
import { IconUsers } from '@tabler/icons-react';
import { AgentsWidgetData, WidgetConfig, ValidationResult, WidgetType } from '@/types/widget';

export function validateAgentsData(data: AgentsWidgetData): ValidationResult {
  const errors: Record<string, string> = {};
  
  // Validate title
  if (!data.title?.trim()) {
    errors.title = 'El título es requerido';
  } else if (data.title.length > 100) {
    errors.title = 'El título no puede tener más de 100 caracteres';
  }
  
  // Validate agentIds
  if (!data.agentIds || data.agentIds.length === 0) {
    errors.agentIds = 'Debes seleccionar al menos un agente';
  } else if (data.agentIds.length > 10) {
    errors.agentIds = 'No puedes seleccionar más de 10 agentes';
  }
  
  // Validate displayStyle
  if (!['card', 'list', 'bubble'].includes(data.displayStyle)) {
    errors.displayStyle = 'Estilo de visualización inválido';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export const agentsWidgetConfig: WidgetConfig<AgentsWidgetData> = {
  type: WidgetType.Agents,
  label: 'Agentes',
  description: 'Muestra tus agentes de chat para que los visitantes puedan interactuar',
  icon: IconUsers,
  defaultData: {
    title: 'Chat con nuestros agentes',
    agentIds: [],
    displayStyle: 'card'
  },
  validator: validateAgentsData
};