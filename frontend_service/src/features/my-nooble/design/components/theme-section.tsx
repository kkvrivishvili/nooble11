// src/features/my-nooble/design/components/ThemeSection.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileDesign } from '@/types/profile';
import { designPresets } from '@/api/design-api';
import { cn } from '@/lib/utils';

interface ThemeSectionProps {
  design: ProfileDesign;
  onUpdate: (design: ProfileDesign) => void;
}

export function ThemeSection({ design, onUpdate }: ThemeSectionProps) {
  const handlePresetSelect = (presetName: keyof typeof designPresets) => {
    const preset = designPresets[presetName];
    onUpdate(preset);
  };

  // Theme card component
  const ThemeCard = ({ 
    name, 
    preset,
    isActive 
  }: { 
    name: string; 
    preset: ProfileDesign;
    isActive: boolean;
  }) => {
    // Get gradient or color for background
    const getBackgroundStyle = () => {
      const wallpaper = preset.theme.wallpaper;
      if (wallpaper?.type === 'gradient' && wallpaper.gradientColors) {
        const direction = wallpaper.gradientDirection === 'diagonal' ? 'to bottom right' :
                         wallpaper.gradientDirection === 'up' ? 'to top' :
                         wallpaper.gradientDirection === 'down' ? 'to bottom' :
                         wallpaper.gradientDirection === 'left' ? 'to left' : 'to right';
        return {
          background: `linear-gradient(${direction}, ${wallpaper.gradientColors.join(', ')})`
        };
      } else if (wallpaper?.type === 'fill' && wallpaper.fillColor) {
        return { backgroundColor: wallpaper.fillColor };
      }
      return { backgroundColor: preset.theme.backgroundColor };
    };

    return (
      <button
        onClick={() => handlePresetSelect(name as keyof typeof designPresets)}
        className={cn(
          "relative w-full aspect-[3/4] rounded-xl overflow-hidden transition-all",
          "hover:scale-105 hover:shadow-lg",
          isActive && "ring-2 ring-primary ring-offset-2"
        )}
      >
        {/* Background */}
        <div 
          className="absolute inset-0"
          style={getBackgroundStyle()}
        />
        
        {/* Content preview */}
        <div className="relative h-full p-4 flex flex-col">
          {/* Mini header */}
          <div className="flex items-center gap-2 mb-auto">
            <div 
              className="w-8 h-8 rounded-full"
              style={{ 
                backgroundColor: preset.theme.primaryColor,
                borderRadius: preset.theme.borderRadius === 'sharp' ? '20%' :
                             preset.theme.borderRadius === 'curved' ? '30%' : '50%'
              }}
            />
            <div className="flex-1">
              <div 
                className="h-2 w-16 rounded-full"
                style={{ 
                  backgroundColor: preset.theme.textColor || preset.theme.primaryColor,
                  opacity: 0.8
                }}
              />
            </div>
          </div>
          
          {/* Mini buttons */}
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="w-full py-2 px-3"
                style={{
                  backgroundColor: preset.theme.buttonFill === 'outline' 
                    ? 'transparent' 
                    : preset.theme.buttonFill === 'glass'
                    ? 'rgba(255,255,255,0.1)'
                    : preset.theme.primaryColor,
                  color: preset.theme.buttonFill === 'outline' 
                    ? preset.theme.primaryColor 
                    : preset.theme.buttonTextColor,
                  border: preset.theme.buttonFill === 'outline' 
                    ? `1px solid ${preset.theme.primaryColor}` 
                    : 'none',
                  borderRadius: preset.theme.borderRadius === 'sharp' ? '0.25rem' :
                               preset.theme.borderRadius === 'curved' ? '0.5rem' : '9999px',
                  boxShadow: preset.theme.buttonShadow === 'hard' ? '2px 2px 0 rgba(0,0,0,0.2)' :
                            preset.theme.buttonShadow === 'subtle' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                  backdropFilter: preset.theme.buttonFill === 'glass' ? 'blur(10px)' : 'none',
                  fontFamily: preset.theme.fontFamily === 'serif' ? 'serif' :
                             preset.theme.fontFamily === 'mono' ? 'monospace' : 'sans-serif',
                  fontSize: '0.625rem'
                }}
              >
                <div className="h-1.5 w-12 mx-auto rounded-full bg-current opacity-60" />
              </div>
            ))}
          </div>
        </div>
        
        {/* Theme name */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm p-2">
          <p className="text-white text-xs font-medium capitalize">{name}</p>
        </div>
      </button>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Temas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(designPresets).map(([key, preset]) => (
            <ThemeCard
              key={key}
              name={key}
              preset={preset}
              isActive={JSON.stringify(design) === JSON.stringify(preset)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}