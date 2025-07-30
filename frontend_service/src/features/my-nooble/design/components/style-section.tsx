// src/features/my-nooble/design/components/StyleSection.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ProfileDesign } from '@/types/profile';
import { cn } from '@/lib/utils';
import { 
  IconSquare,
  IconCircle,
  IconSquareRoundedFilled,
  IconShadow,
  IconTypography,
  IconPalette
} from '@tabler/icons-react';

interface StyleSectionProps {
  theme: ProfileDesign['theme'];
  onUpdateTheme: (updates: Partial<ProfileDesign['theme']>) => void;
}

export function StyleSection({ theme, onUpdateTheme }: StyleSectionProps) {
  // Mini style button component
  const StyleButton = ({ 
    label, 
    icon: Icon, 
    isActive, 
    onClick 
  }: { 
    label: string; 
    icon: any; 
    isActive: boolean; 
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all",
        "hover:scale-105",
        isActive 
          ? "border-primary bg-primary/10" 
          : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
      )}
    >
      <Icon size={20} className={isActive ? "text-primary" : "text-gray-600"} />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Text & Colors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <IconPalette size={20} />
            Colores
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Color principal</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={theme.primaryColor}
                  onChange={(e) => onUpdateTheme({ primaryColor: e.target.value })}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={theme.primaryColor}
                  onChange={(e) => onUpdateTheme({ primaryColor: e.target.value })}
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm">Fondo</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={theme.backgroundColor}
                  onChange={(e) => onUpdateTheme({ backgroundColor: e.target.value })}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={theme.backgroundColor}
                  onChange={(e) => onUpdateTheme({ backgroundColor: e.target.value })}
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm">Texto</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={theme.textColor || '#111827'}
                  onChange={(e) => onUpdateTheme({ textColor: e.target.value })}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={theme.textColor || '#111827'}
                  onChange={(e) => onUpdateTheme({ textColor: e.target.value })}
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm">Texto botones</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={theme.buttonTextColor || '#ffffff'}
                  onChange={(e) => onUpdateTheme({ buttonTextColor: e.target.value })}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={theme.buttonTextColor || '#ffffff'}
                  onChange={(e) => onUpdateTheme({ buttonTextColor: e.target.value })}
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <IconTypography size={20} />
            Tipografía
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => onUpdateTheme({ fontFamily: 'sans' })}
              className={cn(
                "p-4 rounded-lg border-2 transition-all hover:scale-105",
                theme.fontFamily === 'sans' 
                  ? "border-primary bg-primary/10" 
                  : "border-gray-200 dark:border-gray-700"
              )}
            >
              <p className="font-sans text-lg mb-1">Aa</p>
              <p className="text-xs">Sans</p>
            </button>
            
            <button
              onClick={() => onUpdateTheme({ fontFamily: 'serif' })}
              className={cn(
                "p-4 rounded-lg border-2 transition-all hover:scale-105",
                theme.fontFamily === 'serif' 
                  ? "border-primary bg-primary/10" 
                  : "border-gray-200 dark:border-gray-700"
              )}
            >
              <p className="font-serif text-lg mb-1">Aa</p>
              <p className="text-xs">Serif</p>
            </button>
            
            <button
              onClick={() => onUpdateTheme({ fontFamily: 'mono' })}
              className={cn(
                "p-4 rounded-lg border-2 transition-all hover:scale-105",
                theme.fontFamily === 'mono' 
                  ? "border-primary bg-primary/10" 
                  : "border-gray-200 dark:border-gray-700"
              )}
            >
              <p className="font-mono text-lg mb-1">Aa</p>
              <p className="text-xs">Mono</p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Button Styles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Estilo de botones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Fill */}
          <div>
            <Label className="text-sm mb-3 block">Relleno</Label>
            <div className="grid grid-cols-3 gap-3">
              <StyleButton
                label="Sólido"
                icon={IconSquare}
                isActive={theme.buttonFill === 'solid'}
                onClick={() => onUpdateTheme({ buttonFill: 'solid' })}
              />
              <StyleButton
                label="Cristal"
                icon={IconSquare}
                isActive={theme.buttonFill === 'glass'}
                onClick={() => onUpdateTheme({ buttonFill: 'glass' })}
              />
              <StyleButton
                label="Contorno"
                icon={IconSquare}
                isActive={theme.buttonFill === 'outline'}
                onClick={() => onUpdateTheme({ buttonFill: 'outline' })}
              />
            </div>
          </div>

          {/* Corners */}
          <div>
            <Label className="text-sm mb-3 block">Esquinas</Label>
            <div className="grid grid-cols-3 gap-3">
              <StyleButton
                label="Rectas"
                icon={IconSquare}
                isActive={theme.borderRadius === 'sharp'}
                onClick={() => onUpdateTheme({ borderRadius: 'sharp' })}
              />
              <StyleButton
                label="Curvas"
                icon={IconSquareRoundedFilled}
                isActive={theme.borderRadius === 'curved'}
                onClick={() => onUpdateTheme({ borderRadius: 'curved' })}
              />
              <StyleButton
                label="Redondas"
                icon={IconCircle}
                isActive={theme.borderRadius === 'round'}
                onClick={() => onUpdateTheme({ borderRadius: 'round' })}
              />
            </div>
          </div>

          {/* Shadow */}
          <div>
            <Label className="text-sm mb-3 block">Sombra</Label>
            <div className="grid grid-cols-3 gap-3">
              <StyleButton
                label="Sin sombra"
                icon={IconShadow}
                isActive={theme.buttonShadow === 'none'}
                onClick={() => onUpdateTheme({ buttonShadow: 'none' })}
              />
              <StyleButton
                label="Suave"
                icon={IconShadow}
                isActive={theme.buttonShadow === 'subtle'}
                onClick={() => onUpdateTheme({ buttonShadow: 'subtle' })}
              />
              <StyleButton
                label="Fuerte"
                icon={IconShadow}
                isActive={theme.buttonShadow === 'hard'}
                onClick={() => onUpdateTheme({ buttonShadow: 'hard' })}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}