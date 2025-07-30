// src/features/my-nooble/design/index.tsx
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { usePageContext } from '@/context/page-context';
import { useProfile } from '@/context/profile-context';
import { ProfileDesign } from '@/types/profile';
import { 
  IconDeviceFloppy, 
  IconRefresh,
} from '@tabler/icons-react';
import { useDesign } from './components/hooks/use-design';
import { LayoutWithMobile } from '@/components/layout/layout-with-mobile';
import PublicProfile from '@/features/public-profile';
import { ProfileThemeProvider } from '@/context/profile-theme-context';
import { ThemeSection } from './components/theme-section';
import { StyleSection } from './components/style-section';
import { WallpaperSection } from './components/wallpaper-section';
import { LayoutSection } from './components/layout-section';

export default function DesignPage() {
  const { setTitle } = usePageContext();
  const { profile } = useProfile();
  const {
    currentDesign,
    isLoading,
    isSaving,
    isResetting,
    updateDesign,
    resetToDefault
  } = useDesign();

  const [localDesign, setLocalDesign] = useState<ProfileDesign | null>(null);

  useEffect(() => {
    setTitle('');
  }, [setTitle]);

  useEffect(() => {
    if (currentDesign) {
      setLocalDesign(currentDesign);
    }
  }, [currentDesign]);

  const handleSave = () => {
    if (localDesign) {
      updateDesign(localDesign);
    }
  };

  const handleReset = () => {
    resetToDefault();
  };

  const updateTheme = (updates: Partial<ProfileDesign['theme']>) => {
    if (!localDesign) return;
    setLocalDesign(prev => ({
      ...prev!,
      theme: { ...prev!.theme, ...updates }
    }));
  };

  const updateLayout = (updates: Partial<ProfileDesign['layout']>) => {
    if (!localDesign) return;
    setLocalDesign(prev => ({
      ...prev!,
      layout: { ...prev!.layout, ...updates }
    }));
  };

  const hasLocalChanges = useMemo(() => 
    localDesign && currentDesign && 
    JSON.stringify(localDesign) !== JSON.stringify(currentDesign),
    [localDesign, currentDesign]
  );

  // Live preview with local design
  const mobilePreviewContent = useMemo(() => {
    if (!profile?.username) return null;
    
    return (
      <ProfileThemeProvider profileDesign={localDesign || currentDesign}>
        <PublicProfile 
          username={profile.username} 
          isPreview={true} 
        />
      </ProfileThemeProvider>
    );
  }, [profile?.username, localDesign, currentDesign]);

  if (isLoading || !localDesign) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Cargando diseño...</p>
        </div>
      </div>
    );
  }

  const designContent = (
    <div className="space-y-6">
      {/* Acciones flotantes */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 pb-4 -mx-6 px-6 pt-6 border-b">
        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={isSaving || isResetting}
          >
            {isResetting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
            ) : (
              <IconRefresh size={16} className="mr-2" />
            )}
            Restablecer
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasLocalChanges || isSaving}
          >
            {isSaving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <IconDeviceFloppy size={16} className="mr-2" />
            )}
            Guardar cambios
          </Button>
        </div>
      </div>

      {/* Notificación de cambios sin guardar */}
      {hasLocalChanges && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
          <p className="text-sm text-orange-800 dark:text-orange-200">
            Tienes cambios sin guardar. Guarda para aplicarlos a tu Nooble.
          </p>
        </div>
      )}

      {/* Secciones de diseño */}
      <div className="space-y-8">
        <ThemeSection 
          design={localDesign} 
          onUpdate={setLocalDesign}
        />
        
        <StyleSection 
          theme={localDesign.theme}
          onUpdateTheme={updateTheme}
        />
        
        <WallpaperSection
          wallpaper={localDesign.theme.wallpaper}
          primaryColor={localDesign.theme.primaryColor}
          onUpdateWallpaper={(wallpaper) => updateTheme({ wallpaper })}
        />
        
        <LayoutSection
          layout={localDesign.layout}
          onUpdateLayout={updateLayout}
        />
      </div>
    </div>
  );

  return (
    <LayoutWithMobile previewContent={mobilePreviewContent}>
      {designContent}
    </LayoutWithMobile>
  );
}