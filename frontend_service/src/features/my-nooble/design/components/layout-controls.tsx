import { ProfileLayout } from '@/types/profile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StyleSelector } from './style-selector';
import { 
  IconLayoutNavbar,
  IconLayoutBottombar,
  IconEyeOff,
  IconSquare,
  IconRectangle,
  IconRectangleVertical,
} from '@tabler/icons-react';

interface LayoutControlsProps {
  layout: ProfileLayout;
  onChange: (updates: Partial<ProfileLayout>) => void;
}

export function LayoutControls({ layout, onChange }: LayoutControlsProps) {
  const socialPositionOptions = [
    { value: 'top', label: 'Arriba', icon: <IconLayoutNavbar size={24} /> },
    { value: 'bottom', label: 'Abajo', icon: <IconLayoutBottombar size={24} /> },
    { value: 'hidden', label: 'Oculto', icon: <IconEyeOff size={24} /> },
  ];

  const contentWidthOptions = [
    { value: 'narrow', label: 'Estrecho', icon: <IconRectangleVertical size={24} /> },
    { value: 'normal', label: 'Normal', icon: <IconRectangle size={24} /> },
    { value: 'wide', label: 'Ancho', icon: <IconSquare size={24} /> },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribución</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <StyleSelector
          label="Posición de redes sociales"
          value={layout.socialPosition || 'top'}
          options={socialPositionOptions}
          onChange={(value) => onChange({ socialPosition: value as any })}
          columns={3}
        />

        <StyleSelector
          label="Ancho del contenido"
          value={layout.contentWidth || 'normal'}
          options={contentWidthOptions}
          onChange={(value) => onChange({ contentWidth: value as any })}
          columns={3}
        />
      </CardContent>
    </Card>
  );
}