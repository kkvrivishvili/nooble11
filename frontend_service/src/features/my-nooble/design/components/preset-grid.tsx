
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
    const linkStyle = layout?.linkStyle || 'button';
    const socialPosition = layout?.socialPosition || 'bottom';
    const spacing = layout?.spacing || 'normal';
    
    const spacingClass = spacing === 'compact' ? 'gap-1' : spacing === 'relaxed' ? 'gap-3' : 'gap-2';
    
    return (
      <div className={`flex flex-col ${spacingClass}`}>
        {/* Social links preview (top position) */}
        {socialPosition === 'top' && (
          <div className="flex justify-center gap-1 mb-1">
            <div className="w-2 h-2 rounded-full bg-current opacity-40"></div>
            <div className="w-2 h-2 rounded-full bg-current opacity-40"></div>
            <div className="w-2 h-2 rounded-full bg-current opacity-40"></div>
          </div>
        )}
        
        {/* Link style preview */}
        <div className="space-y-1">
          {linkStyle === 'card' && (
            <div className="bg-current bg-opacity-10 rounded p-1 text-center">
              <div className="text-xs opacity-60">Link Card</div>
            </div>
          )}
          {linkStyle === 'button' && (
            <div className="bg-current rounded-full px-2 py-1 text-center">
              <div className="text-xs text-white opacity-80">Link Button</div>
            </div>
          )}
          {linkStyle === 'minimal' && (
            <div className="text-center border-b border-current border-opacity-30 pb-1">
              <div className="text-xs opacity-70">Link Minimal</div>
            </div>
          )}
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
    
    return (
      <div 
        className="p-3 rounded-md relative"
        style={{
          backgroundColor: theme.backgroundColor,
          color: theme.textColor,
          fontFamily: theme.fontFamily === 'serif' ? 'serif' :
                     theme.fontFamily === 'mono' ? 'monospace' : 'sans-serif',
        }}
      >
        {/* Mini wallpaper preview */}
        {theme.wallpaper && (
          <div 
            className="absolute inset-0 rounded-md opacity-30"
            style={{
              background: theme.wallpaper.type === 'gradient' && theme.wallpaper.gradientColors
                ? `linear-gradient(135deg, ${theme.wallpaper.gradientColors.join(', ')})`
                : theme.wallpaper.type === 'fill'
                ? theme.wallpaper.fillColor
                : undefined,
              zIndex: -1,
            }}
          />
        )}
        
        {/* Mini avatar */}
        <div className="flex items-center gap-2 mb-2">
          <div 
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
            style={{
              backgroundColor: theme.primaryColor,
              color: theme.buttonTextColor,
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
        
        {/* Layout preview */}
        {renderLayoutPreview(preset)}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Diseños predefinidos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Object.entries(designPresets).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => onSelectPreset(key as keyof typeof designPresets)}
              className={cn(
                "relative p-4 border-2 rounded-lg transition-all hover:shadow-md overflow-hidden",
                isPresetActive(preset) 
                  ? "border-blue-500 bg-blue-50 shadow-md" 
                  : "border-gray-200"
              )}
            >
              {renderPresetPreview(preset)}
              <p className="text-sm font-medium capitalize mt-2">{key}</p>
              
              {isPresetActive(preset) && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}