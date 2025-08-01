// src/features/public-profile/index.tsx - Enhanced version with wallpaper
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query';
import { publicProfileApi } from '@/api/public-profile-api';
import { ProfileDesign, ProfileWithAgents } from '@/types/profile';
import ProfileComponent from './components/ProfileComponent'
import PublicContentComponent from './components/PublicContentComponent'
import ChatInput from './components/ChatInput'
import SocialLinks from './components/SocialLinks'
import { ProfileThemeProvider, useProfileTheme } from '@/context/profile-theme-context';
import './styles/profile-theme.css';

interface PublicProfileProps {
  username: string;
  isPreview?: boolean;
  previewDesign?: ProfileDesign;
}

// Wallpaper component - now only handles special cases
function ProfileWallpaper() {
  const { theme } = useProfileTheme();
  
  // Video wallpaper
  if (theme.wallpaper?.type === 'video' && theme.wallpaper.videoUrl) {
    return (
      <div className="profile-video-wallpaper">
        <video
          autoPlay
          loop={theme.wallpaper.videoLoop}
          muted={theme.wallpaper.videoMuted}
          playsInline
        >
          <source src={theme.wallpaper.videoUrl} type="video/mp4" />
        </video>
        {theme.wallpaper.videoOverlay && (
          <div 
            className="absolute inset-0 z-0"
            style={{ backgroundColor: theme.wallpaper.videoOverlay }}
          />
        )}
      </div>
    );
  }
  
  // Blur overlay (only for blur wallpaper type)
  if (theme.wallpaper?.type === 'blur') {
    return <div className="profile-wallpaper-blur" />;
  }
  
  // Image overlay (only if specified)
  if (theme.wallpaper?.type === 'image' && theme.wallpaper.imageOverlay) {
    return (
      <div 
        className="absolute inset-0 z-0 pointer-events-none"
        style={{ backgroundColor: theme.wallpaper.imageOverlay }}
      />
    );
  }
  
  // For other wallpaper types (fill, gradient, pattern), the background is applied directly to .profile-container
  return null;
}

// Profile content wrapper
function ProfileContent({ profile, isPreview }: { profile: ProfileWithAgents; isPreview: boolean }) {
  const { layout, getCSSVariables } = useProfileTheme();
  const [currentAgentId, setCurrentAgentId] = useState<string>();

  useEffect(() => {
    if (profile?.agentDetails?.length && !currentAgentId) {
      setCurrentAgentId(profile.agentDetails[0].id);
    }
  }, [profile?.agentDetails, currentAgentId]);

  const handleAgentClick = (agentId: string) => {
    setCurrentAgentId(agentId);
  };

  return (
    <div className="profile-container" style={getCSSVariables()}>
      <ProfileWallpaper />
      
      <div className="profile-content pb-24">
        
        {/* Profile Header */}
        <div className="profile-animate-in">
          <ProfileComponent 
            profile={profile} 
            isPreview={isPreview}
            showSocialLinks={layout.socialPosition === 'top'}
          />
        </div>
        
        {/* Content Tabs */}
        <div className="profile-animate-in" style={{ animationDelay: '0.1s' }}>
          <PublicContentComponent
            profile={profile}
            onAgentClick={handleAgentClick}
          />
        </div>
        
        {/* Bottom social links */}
        {layout.socialPosition === 'bottom' && (
          <div className="mt-6 profile-animate-in" style={{ animationDelay: '0.2s' }}>
            <SocialLinks 
              socialLinks={profile.socialLinks || []}
              isPreview={isPreview}
              position="bottom"
              iconSize={20}
            />
          </div>
        )}
      </div>
      
      {/* Chat Input */}
      {!isPreview && (
        <div className="w-full z-50 fixed bottom-0 left-0 right-0">
          <ChatInput onSendMessage={() => {}} />
        </div>
      )}
    </div>
  );
}

export default function PublicProfile({ username, isPreview = false, previewDesign }: PublicProfileProps) {
  const { data: publicProfile, isLoading, error } = useQuery<ProfileWithAgents | null>({
    queryKey: ['public-profile', username],
    queryFn: () => {
      if (!username) return null;
      return publicProfileApi.getPublicProfile(username);
    },
    enabled: !!username,
    retry: 2,
    staleTime: 1000 * 60 * 5,
  });

  const profile = publicProfile;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-xl font-semibold mb-2">Perfil no encontrado</h2>
          <p className="text-gray-600">
            {error ? 'Error al cargar el perfil' : 'No se encontró el perfil solicitado'}
          </p>
        </div>
      </div>
    );
  }

  // Use previewDesign if provided and we're in preview mode, otherwise use profile.design
  const designToUse = isPreview && previewDesign ? previewDesign : profile.design;

  return (
    <div className={cn(
      "min-h-screen relative transition-all duration-300",
      isPreview && "rounded-lg overflow-hidden"
    )}>
      {/* Wrap everything in ProfileThemeProvider with the appropriate design */}
      <ProfileThemeProvider profileDesign={designToUse}>
        <ProfileContent profile={profile} isPreview={isPreview} />
      </ProfileThemeProvider>
    </div>
  );
}