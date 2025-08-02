import { designPresets } from '@/api/design-api';
import { ProfileDesign } from '@/types/profile';
import { cn } from '@/lib/utils';

interface PresetGridProps {
  currentDesign: ProfileDesign;
  onSelectPreset: (presetName: keyof typeof designPresets) => void;
}

export function PresetGrid({ currentDesign, onSelectPreset }: PresetGridProps) {
  const isPresetActive = (preset: ProfileDesign) => {
    return JSON.stringify(currentDesign) === JSON.stringify(preset);
  };

  const getWallpaperStyle = (theme: ProfileDesign['theme']) => {
    if (!theme.wallpaper) return { backgroundColor: theme.backgroundColor };
    
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
        const opacity = theme.wallpaper.patternOpacity || 0.3;
        const hexOpacity = Math.round(opacity * 255).toString(16).padStart(2, '0');
        
        if (theme.wallpaper.patternType === 'dots') {
          return {
            backgroundColor: theme.backgroundColor,
            backgroundImage: `radial-gradient(circle, ${theme.wallpaper.patternColor}${hexOpacity} 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
          };
        } else if (theme.wallpaper.patternType === 'grid') {
          return {
            backgroundColor: theme.backgroundColor,
            backgroundImage: `
              repeating-linear-gradient(0deg, ${theme.wallpaper.patternColor}${hexOpacity}, ${theme.wallpaper.patternColor}${hexOpacity} 1px, transparent 1px, transparent 20px),
              repeating-linear-gradient(90deg, ${theme.wallpaper.patternColor}${hexOpacity}, ${theme.wallpaper.patternColor}${hexOpacity} 1px, transparent 1px, transparent 20px)
            `,
          };
        } else if (theme.wallpaper.patternType === 'lines') {
          return {
            backgroundColor: theme.backgroundColor,
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              ${theme.wallpaper.patternColor}${hexOpacity} 10px,
              ${theme.wallpaper.patternColor}${hexOpacity} 11px
            )`,
          };
        } else if (theme.wallpaper.patternType === 'waves') {
          return {
            backgroundColor: theme.backgroundColor,
            backgroundImage: `repeating-radial-gradient(
              circle at 0 0,
              transparent 0,
              ${theme.wallpaper.patternColor}${hexOpacity} 10px,
              transparent 10px,
              transparent 20px,
              ${theme.wallpaper.patternColor}${hexOpacity} 20px,
              ${theme.wallpaper.patternColor}${hexOpacity} 30px,
              transparent 30px,
              transparent 40px
            )`,
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

  const getBorderRadius = (borderRadius?: string) => {
    switch (borderRadius) {
      case 'sharp': return '0.25rem';
      case 'round': return '9999px';
      case 'curved': 
      default: return '0.75rem';
    }
  };

  const getFontFamily = (font?: string) => {
    switch (font) {
      case 'serif': return 'Georgia, serif';
      case 'mono': return 'Monaco, monospace';
      case 'sans':
      default: return 'system-ui, -apple-system, sans-serif';
    }
  };

  const renderButtonShape = (theme: ProfileDesign['theme']) => {
    const borderRadius = getBorderRadius(theme.borderRadius);
    const isRound = theme.borderRadius === 'round';
    
    // Posición y tamaño dinámicos basados en el estilo
    const shapeStyles = {
      width: isRound ? '25%' : '30%',
      height: isRound ? '50%' : '55%',
      borderRadius: borderRadius,
      position: 'absolute' as const,
      bottom: '20%',
      right: '15%',
    };

    // Estilos según el tipo de relleno
    if (theme.buttonFill === 'glass') {
      return (
        <div
          style={{
            ...shapeStyles,
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: theme.buttonShadow === 'subtle' ? '0 2px 8px rgba(0,0,0,0.1)' : 
                      theme.buttonShadow === 'hard' ? '4px 4px 0 rgba(0,0,0,0.2)' : 'none',
          }}
        />
      );
    } else if (theme.buttonFill === 'outline') {
      return (
        <div
          style={{
            ...shapeStyles,
            backgroundColor: 'transparent',
            border: `2px solid ${theme.primaryColor}`,
            boxShadow: theme.buttonShadow === 'subtle' ? '0 2px 8px rgba(0,0,0,0.1)' : 
                      theme.buttonShadow === 'hard' ? '4px 4px 0 rgba(0,0,0,0.2)' : 'none',
          }}
        />
      );
    } else {
      // Solid fill
      return (
        <div
          style={{
            ...shapeStyles,
            backgroundColor: theme.primaryColor,
            boxShadow: theme.buttonShadow === 'subtle' ? '0 2px 8px rgba(0,0,0,0.1)' : 
                      theme.buttonShadow === 'hard' ? '4px 4px 0 rgba(0,0,0,0.2)' : 'none',
          }}
        />
      );
    }
  };

  const renderPresetPreview = (preset: ProfileDesign, name: string) => {
    const { theme } = preset;
    const displayName = name.charAt(0).toUpperCase() + name.slice(1);
    
    return (
      <div className="relative w-full h-full">
        {/* Background con wallpaper */}
        <div 
          className="absolute inset-0 rounded-xl overflow-hidden"
          style={getWallpaperStyle(theme)}
        />
        
        {/* Texto "Aa" */}
        <div className="absolute top-1/2 left-1/3 transform -translate-x-1/2 -translate-y-1/2">
          <span 
            style={{
              fontFamily: getFontFamily(theme.fontFamily),
              fontSize: '2.5rem',
              fontWeight: '500',
              color: theme.textColor || '#000000',
              letterSpacing: '-0.02em',
            }}
          >
            Aa
          </span>
        </div>
        
        {/* Forma del botón */}
        {renderButtonShape(theme)}
        
        {/* Nombre del preset */}
        <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm px-3 py-2 border-t border-gray-100">
          <p className="text-sm font-medium text-gray-900">{displayName}</p>
        </div>
      </div>
    );
  };

  // Orden de los presets para mejor organización visual
  const presetOrder = [
    'minimal', 'classic', 'modern', 
    'aurora', 'nature', 'pastel',
    'neon', 'luxury', 'industrial'
  ];

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Diseños predefinidos</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {presetOrder.map((key) => {
          const preset = designPresets[key as keyof typeof designPresets];
          if (!preset) return null;
          
          return (
            <button
              key={key}
              onClick={() => onSelectPreset(key as keyof typeof designPresets)}
              className={cn(
                "relative aspect-[16/9] rounded-xl overflow-hidden transition-all",
                isPresetActive(preset) 
                  ? "ring-2 ring-blue-500 shadow-lg scale-[0.98]" 
                  : "ring-1 ring-gray-200 hover:ring-gray-300 hover:shadow-md"
              )}
            >
              {renderPresetPreview(preset, key)}
              
              {/* Indicador activo */}
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
    </div>
  );
}