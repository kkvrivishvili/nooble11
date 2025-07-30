// src/features/my-nooble/design/components/LayoutSection.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ProfileLayout } from '@/types/profile';
import { cn } from '@/lib/utils';
import { 
  IconLayoutDashboard,
  IconBrandInstagram,
  IconDevices,
  IconDimensions
} from '@tabler/icons-react';

interface LayoutSectionProps {
  layout?: ProfileLayout;
  onUpdateLayout: (updates: Partial<ProfileLayout>) => void;
}

export function LayoutSection({ layout, onUpdateLayout }: LayoutSectionProps) {
  const currentLayout = {
    linkStyle: layout?.linkStyle || 'card',
    socialPosition: layout?.socialPosition || 'top',
    contentWidth: layout?.contentWidth || 'normal',
    spacing: layout?.spacing || 'normal',
    showChatInput: layout?.showChatInput !== false // Default true
  };

  // Layout option button
  const LayoutOption = ({ 
    label, 
    value, 
    isActive, 
    onClick 
  }: { 
    label: string; 
    value: string;
    isActive: boolean; 
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-lg border-2 transition-all text-sm",
        "hover:scale-105",
        isActive 
          ? "border-primary bg-primary/10 font-medium" 
          : "border-gray-200 dark:border-gray-700"
      )}
    >
      {label}
    </button>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <IconLayoutDashboard size={20} />
          Diseño
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Social Links Position */}
        <div>
          <Label className="text-sm mb-3 flex items-center gap-2">
            <IconBrandInstagram size={16} />
            Posición de redes sociales
          </Label>
          <div className="grid grid-cols-3 gap-2">
            <LayoutOption
              label="Arriba"
              value="top"
              isActive={currentLayout.socialPosition === 'top'}
              onClick={() => onUpdateLayout({ socialPosition: 'top' })}
            />
            <LayoutOption
              label="Abajo"
              value="bottom"
              isActive={currentLayout.socialPosition === 'bottom'}
              onClick={() => onUpdateLayout({ socialPosition: 'bottom' })}
            />
            <LayoutOption
              label="Ocultar"
              value="hidden"
              isActive={currentLayout.socialPosition === 'hidden'}
              onClick={() => onUpdateLayout({ socialPosition: 'hidden' })}
            />
          </div>
        </div>

        {/* Content Width */}
        <div>
          <Label className="text-sm mb-3 flex items-center gap-2">
            <IconDevices size={16} />
            Ancho del contenido
          </Label>
          <div className="grid grid-cols-3 gap-2">
            <LayoutOption
              label="Angosto"
              value="narrow"
              isActive={currentLayout.contentWidth === 'narrow'}
              onClick={() => onUpdateLayout({ contentWidth: 'narrow' })}
            />
            <LayoutOption
              label="Normal"
              value="normal"
              isActive={currentLayout.contentWidth === 'normal'}
              onClick={() => onUpdateLayout({ contentWidth: 'normal' })}
            />
            <LayoutOption
              label="Ancho"
              value="wide"
              isActive={currentLayout.contentWidth === 'wide'}
              onClick={() => onUpdateLayout({ contentWidth: 'wide' })}
            />
          </div>
        </div>

        {/* Spacing */}
        <div>
          <Label className="text-sm mb-3 flex items-center gap-2">
            <IconDimensions size={16} />
            Espaciado
          </Label>
          <div className="grid grid-cols-3 gap-2">
            <LayoutOption
              label="Compacto"
              value="compact"
              isActive={currentLayout.spacing === 'compact'}
              onClick={() => onUpdateLayout({ spacing: 'compact' })}
            />
            <LayoutOption
              label="Normal"
              value="normal"
              isActive={currentLayout.spacing === 'normal'}
              onClick={() => onUpdateLayout({ spacing: 'normal' })}
            />
            <LayoutOption
              label="Relajado"
              value="relaxed"
              isActive={currentLayout.spacing === 'relaxed'}
              onClick={() => onUpdateLayout({ spacing: 'relaxed' })}
            />
          </div>
        </div>

        {/* Widget Display Style */}
        <div>
          <Label className="text-sm mb-3">Estilo de widgets</Label>
          <div className="grid grid-cols-3 gap-2">
            <LayoutOption
              label="Tarjetas"
              value="card"
              isActive={currentLayout.linkStyle === 'card'}
              onClick={() => onUpdateLayout({ linkStyle: 'card' })}
            />
            <LayoutOption
              label="Botones"
              value="button"
              isActive={currentLayout.linkStyle === 'button'}
              onClick={() => onUpdateLayout({ linkStyle: 'button' })}
            />
            <LayoutOption
              label="Mínimo"
              value="minimal"
              isActive={currentLayout.linkStyle === 'minimal'}
              onClick={() => onUpdateLayout({ linkStyle: 'minimal' })}
            />
          </div>
        </div>

        {/* Chat Input Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div>
            <Label className="text-sm font-medium">Chat de entrada</Label>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Mostrar campo de entrada de chat en la parte inferior
            </p>
          </div>
          <Switch
            checked={currentLayout.showChatInput}
            onCheckedChange={(checked) => onUpdateLayout({ showChatInput: checked })}
          />
        </div>
      </CardContent>
    </Card>
  );
}