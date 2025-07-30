// src/features/public-profile/index.tsx - Enhanced version with wallpaper
import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query';
import { publicProfileApi } from '@/api/public-profile-api';
import { useProfile } from '@/context/profile-context';
import { ProfileDesign } from '@/types/profile';
import ProfileComponent from './components/ProfileComponent'
import PublicContentComponent from './components/PublicContentComponent'
import ChatInput from './components/ChatInput'
import { ProfileThemeProvider, useProfileTheme } from '@/context/profile-theme-context';
// Styles are loaded globally in the app, not here

interface PublicProfileProps {
  username: string;
  isPreview?: boolean;
  previewDesign?: ProfileDesign;
}

// Wallpaper component
function ProfileWallpaper() {
  const { theme } = useProfileTheme();
  
  if (!theme.wallpaper) return null;
  
  // Video wallpaper
  if (theme.wallpaper.type === 'video' && theme.wallpaper.videoUrl) {
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
  
  // Regular wallpaper
  return (
    <>
      <div className="profile-wallpaper" />
      {theme.wallpaper.type === 'blur' && (
        <div className="profile-wallpaper-blur" />
      )}
      {theme.wallpaper.type === 'image' && theme.wallpaper.imageOverlay && (
        <div 
          className="fixed inset-0 z-[-1]"
          style={{ backgroundColor: theme.wallpaper.imageOverlay }}
        />
      )}
    </>
  );
}

// Profile content wrapper
function ProfileContent({ profile, isPreview }: { profile: any; isPreview: boolean }) {
  const { theme, layout } = useProfileTheme();
  const [activeTab, setActiveTab] = useState('chats');
  const [currentAgentId, setCurrentAgentId] = useState<string>();

  useEffect(() => {
    if (profile?.agentDetails?.length && !currentAgentId) {
      setCurrentAgentId(profile.agentDetails[0].id);
    }
  }, [profile?.agentDetails, currentAgentId]);

  const handleSendMessage = (message: string) => {
    if (message.trim() && activeTab === 'links') {
      setActiveTab('chats');
    }
  };

  const handleAgentClick = (agentId: string) => {
    setCurrentAgentId(agentId);
  };

  // Apply button styles based on theme
  const getButtonClass = () => {
    const baseClass = 'profile-button';
    const fillClass = `profile-button-${theme.buttonFill || 'solid'}`;
    return cn(baseClass, fillClass);
  };

  // Apply link styles based on layout
  const getLinkClass = () => {
    return `profile-link-${layout.linkStyle || 'card'}`;
  };

  return (
    <div className="profile-container">
      <ProfileWallpaper />
      
      <div className="profile-content pb-24">
        {/* Hero wallpaper */}
        {theme.wallpaper?.type === 'hero' && theme.wallpaper.heroImage && (
          <div 
            className="w-full h-64 -mx-4 -mt-8 mb-8 bg-cover bg-center"
            style={{ 
              backgroundImage: `url(${theme.wallpaper.heroImage})`,
              backgroundPosition: theme.wallpaper.heroPosition || 'center'
            }}
          />
        )}
        
        {/* Profile Header */}
        <div className="profile-animate-in">
          <ProfileComponent 
            profile={profile} 
            isPreview={isPreview}
            showSocialLinks={activeTab === 'links' && layout.socialPosition === 'top'}
          />
        </div>
        
        {/* Content Tabs */}
        <div className="profile-animate-in" style={{ animationDelay: '0.1s' }}>
          <PublicContentComponent
            profile={profile}
            isPreview={isPreview}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            currentAgentId={currentAgentId}
            onAgentClick={handleAgentClick}
          />
        </div>
        
        {/* Bottom social links */}
        {activeTab === 'links' && layout.socialPosition === 'bottom' && profile.socialLinks?.length > 0 && (
          <div className="flex gap-3 justify-center mt-6 profile-animate-in" style={{ animationDelay: '0.2s' }}>
            {/* Social links would be rendered here */}
          </div>
        )}
      </div>
      
      {/* Chat Input */}
      {!isPreview && (
        <div className="w-full z-50 fixed bottom-0 left-0 right-0">
          <ChatInput onSendMessage={handleSendMessage} />
        </div>
      )}
    </div>
  );
}

export default function PublicProfile({ username, isPreview = false }: PublicProfileProps) {
  const { data: publicProfile, isLoading, error } = useQuery({
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

  return (
    <div className={cn(
      "min-h-screen relative transition-all duration-300",
      isPreview && "rounded-lg overflow-hidden"
    )}>
      {/* Wrap everything in ProfileThemeProvider with the profile's design */}
      <ProfileThemeProvider profileDesign={profile.design}>
        <ProfileContent profile={profile} isPreview={isPreview} />
      </ProfileThemeProvider>
    </div>
  );
}