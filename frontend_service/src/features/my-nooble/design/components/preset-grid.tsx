import { designPresets } from '@/api/design-api';
import { ProfileDesign } from '@/types/profile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface PresetGridProps {
  currentDesign: ProfileDesign;
  onSelectPreset: (presetName: keyof typeof designPresets) => void;
}

export function PresetGrid({ currentDesign, onSelectPreset }: PresetGridProps) {
  const isPresetActive = (preset: ProfileDesign) => {
    return JSON.stringify(currentDesign) === JSON.stringify(preset);
  };

  const renderLayoutPreview = (preset: ProfileDesign) => {
    const { layout } = preset;
    const socialPosition = layout?.socialPosition || 'bottom';
    
    return (
      <div className="flex flex-col gap-1">
        {/* Social links preview (top position) */}
        {socialPosition === 'top' && (
          <div className="flex justify-center gap-1 mb-1">
            <div className="w-2 h-2 rounded-full bg-current opacity-40"></div>
            <div className="w-2 h-2 rounded-full bg-current opacity-40"></div>
            <div className="w-2 h-2 rounded-full bg-current opacity-40"></div>
          </div>
        )}
        
        {/* Content preview - always card style */}
        <div className="space-y-1">
          <div className="bg-current bg-opacity-10 rounded p-1 text-center">
            <div className="text-xs opacity-60">Content</div>
          </div>
        </div>
        
        {/* Social links preview (bottom position) */}
        {socialPosition === 'bottom' && (
          <div className="flex justify-center gap-1 mt-1">
            <div className="w-2 h-2 rounded-full bg-current opacity-40"></div>
            <div className="w-2 h-2 rounded-full bg-current opacity-40"></div>
            <div className="w-2 h-2 rounded-full bg-current opacity-40"></div>
          </div>
        )}
      </div>
    );
  };

  const renderPresetPreview = (preset: ProfileDesign) => {
    const { theme } = preset;
    
    // Get wallpaper background
    const getWallpaperStyle = () => {
      if (!theme.wallpaper) return {};
      
      switch (theme.wallpaper.type) {
        case 'gradient':
          if (theme.wallpaper.gradientColors) {
            const direction = theme.wallpaper.gradientDirection === 'diagonal' ? '135deg' :
                            theme.wallpaper.gradientDirection === 'up' ? '0deg' :
                            theme.wallpaper.gradientDirection === 'down' ? '180deg' :
                            theme.wallpaper.gradientDirection === 'left' ? '270deg' : '90deg';
            return {
              background: `linear-gradient(${direction}, ${theme.wallpaper.gradientColors.join(', ')})`,
            };
          }
          break;
        case 'pattern':
          if (theme.wallpaper.patternType === 'dots') {
            return {
              backgroundColor: theme.backgroundColor,
              backgroundImage: `radial-gradient(circle, ${theme.wallpaper.patternColor}40 1px, transparent 1px)`,
              backgroundSize: '10px 10px',
            };
          } else if (theme.wallpaper.patternType === 'grid') {
            return {
              backgroundColor: theme.backgroundColor,
              backgroundImage: `
                repeating-linear-gradient(0deg, ${theme.wallpaper.patternColor}20, ${theme.wallpaper.patternColor}20 1px, transparent 1px, transparent 10px),
                repeating-linear-gradient(90deg, ${theme.wallpaper.patternColor}20, ${theme.wallpaper.patternColor}20 1px, transparent 1px, transparent 10px)
              `,
            };
          }
          break;
        case 'fill':
          return {
            backgroundColor: theme.wallpaper.fillColor || theme.backgroundColor,
          };
      }
      
      return { backgroundColor: theme.backgroundColor };
    };
    
    return (
      <div 
        className="p-3 rounded-md relative overflow-hidden"
        style={{
          ...getWallpaperStyle(),
          color: theme.textColor,
          fontFamily: theme.fontFamily === 'serif' ? 'serif' :
                     theme.fontFamily === 'mono' ? 'monospace' : 'sans-serif',
        }}
      >
        {/* Mini avatar */}
        <div className="flex items-center gap-2 mb-2">
          <div 
            className="w-6 h-6 flex items-center justify-center text-xs font-bold"
            style={{
              backgroundColor: theme.primaryColor,
              color: theme.buttonTextColor,
              borderRadius: theme.borderRadius === 'sharp' ? '0.25rem' :
                          theme.borderRadius === 'round' ? '9999px' : '0.5rem',
            }}
          >
            JD
          </div>
          <div className="text-xs font-medium">John Doe</div>
        </div>
        
        {/* Sample text */}
        <p className="text-xs opacity-70 mb-2">
          Descripción del perfil
        </p>
        
        {/* Button preview */}
        <div 
          className="px-3 py-1 text-xs text-center"
          style={{
            backgroundColor: theme.buttonFill === 'glass' 
              ? 'rgba(255, 255, 255, 0.1)'
              : theme.buttonFill === 'outline'
              ? 'transparent'
              : theme.primaryColor,
            color: theme.buttonFill === 'outline'
              ? theme.primaryColor
              : theme.buttonTextColor,
            border: theme.buttonFill === 'outline'
              ? `1px solid ${theme.primaryColor}`
              : 'none',
            borderRadius: theme.borderRadius === 'sharp' ? '0.25rem' :
                         theme.borderRadius === 'round' ? '9999px' : '0.5rem',
            backdropFilter: theme.buttonFill === 'glass' ? 'blur(10px)' : 'none',
            boxShadow: theme.buttonShadow === 'hard' ? '2px 2px 0 rgba(0,0,0,0.2)' :
                      theme.buttonShadow === 'subtle' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          }}
        >
          Botón de ejemplo
        </div>
        
        {/* Layout preview */}
        <div className="mt-2">
          {renderLayoutPreview(preset)}
        </div>
      </div>
    );
  };

  // Order presets for better visual organization
  const presetOrder = [
    'minimal', 'classic', 'modern', 
    'aurora', 'nature', 'pastel',
    'neon', 'luxury', 'industrial'
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Diseños predefinidos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {presetOrder.map((key) => {
            const preset = designPresets[key as keyof typeof designPresets];
            if (!preset) return null;
            
            return (
              <button
                key={key}
                onClick={() => onSelectPreset(key as keyof typeof designPresets)}
                className={cn(
                  "relative p-0 border-2 rounded-lg transition-all hover:shadow-lg overflow-hidden group",
                  isPresetActive(preset) 
                    ? "border-blue-500 shadow-lg" 
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                {renderPresetPreview(preset)}
                
                {/* Preset name */}
                <div className={cn(
                  "px-3 py-2 border-t transition-colors",
                  isPresetActive(preset)
                    ? "bg-blue-50 border-blue-200"
                    : "bg-gray-50 border-gray-200 group-hover:bg-gray-100"
                )}>
                  <p className="text-sm font-medium capitalize">{key}</p>
                </div>
                
                {/* Active indicator */}
                {isPresetActive(preset) && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}