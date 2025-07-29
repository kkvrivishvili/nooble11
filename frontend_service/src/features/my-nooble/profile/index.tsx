// src/features/my-nooble/profile/index.tsx
import { useEffect } from 'react';
import { Profile as ProfileComponent } from './components/profile';
import { usePageContext } from '@/context/page-context';
import { LayoutWithMobile } from '@/components/layout/layout-with-mobile';
import PublicProfile from '@/features/public-profile';

export function ProfilePage() {
  const { setTitle, setShareUrl } = usePageContext();

  useEffect(() => {
    setTitle('My Profile');
    // Establecer la URL para compartir el perfil
    const shareUrl = `${window.location.origin}/johndoe`; // Usamos el username del mock por ahora
    setShareUrl(shareUrl);

    // Limpiar la URL de compartir al desmontar el componente
    return () => {
      setShareUrl(undefined);
    };
  }, [setTitle, setShareUrl]);

  // Contenido de vista previa móvil - ahora usando el PublicProfile real
  const mobilePreviewContent = <PublicProfile isPreview={true} />;

  return (
    <LayoutWithMobile previewContent={mobilePreviewContent}>
      <ProfileComponent />
    </LayoutWithMobile>
  );
}