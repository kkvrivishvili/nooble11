// src/features/public-profile/index.tsx
import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query';
import { publicProfileApi } from '@/api/public-profile-api';
import { useProfile } from '@/context/profile-context';
import { ProfileDesign, ProfileWithAgents, Widget } from '@/types/profile';
import ProfileComponent from './components/profile-component'
import ChatInput from './components/chat-input'
import { ProfileThemeProvider, useProfileTheme } from '@/context/profile-theme-context';
import { PublicWidgetRenderer } from './widgets/public-widget-renderer';

interface PublicProfileProps {
  username: string;
  isPreview?: boolean;
  previewDesign?: ProfileDesign;
}

// Wallpaper component
function ProfileWallpaper() {
  const { theme } = useProfileTheme();
  
  if (!theme.wallpaper) return null;
  
  const wallpaper = theme.wallpaper;
  
  // Get CSS for wallpaper
  const getWallpaperStyle = (): React.CSSProperties => {
    switch (wallpaper.type) {
      case 'fill':
        return {
          backgroundColor: wallpaper.fillColor || '#ffffff'
        };
      
      case 'gradient':
        if (!wallpaper.gradientColors) return {};
        const direction = wallpaper.gradientDirection === 'diagonal' ? 'to bottom right' :
                         wallpaper.gradientDirection === 'up' ? 'to top' :
                         wallpaper.gradientDirection === 'down' ? 'to bottom' :
                         wallpaper.gradientDirection === 'left' ? 'to left' : 'to right';
        return {
          background: `linear-gradient(${direction}, ${wallpaper.gradientColors.join(', ')})`
        };
      
      case 'blur':
        return {
          backgroundColor: wallpaper.blurColor || '#f3f4f6',
          backdropFilter: `blur(${wallpaper.blurIntensity || 20}px)`,
          WebkitBackdropFilter: `blur(${wallpaper.blurIntensity || 20}px)`
        };
      
      case 'pattern':
        // Pattern is handled via CSS classes
        return {
          color: wallpaper.patternColor || theme.primaryColor,
          opacity: wallpaper.patternOpacity || 0.1
        };
      
      case 'image':
        return {
          backgroundImage: wallpaper.imageUrl ? `url(${wallpaper.imageUrl})` : undefined,
          backgroundPosition: wallpaper.imagePosition || 'center',
          backgroundSize: wallpaper.imageSize || 'cover',
          backgroundRepeat: 'no-repeat'
        };
      
      case 'video':
        return {}; // Video is handled separately
      
      default:
        return {};
    }
  };
  
  // Video wallpaper
  if (wallpaper.type === 'video' && wallpaper.videoUrl) {
    return (
      <div className="fixed inset-0 z-[-2] overflow-hidden">
        <video
          autoPlay
          loop={wallpaper.videoLoop}
          muted={wallpaper.videoMuted}
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={wallpaper.videoUrl} type="video/mp4" />
        </video>
        {wallpaper.videoOverlay && (
          <div 
            className="absolute inset-0"
            style={{ backgroundColor: wallpaper.videoOverlay }}
          />
        )}
      </div>
    );
  }
  
  // Pattern classes
  const patternClass = wallpaper.type === 'pattern' ? `profile-pattern-${wallpaper.patternType}` : '';
  
  return (
    <div 
      className={cn("fixed inset-0 z-[-2]", patternClass)}
      style={getWallpaperStyle()}
    />
  );
}

// Active widgets component
function WidgetsList({ profile, onAgentClick }: { profile: ProfileWithAgents; onAgentClick?: (id: string) => void }) {
  const { theme, layout } = useProfileTheme();
  
  // Get active widgets with their data
  const activeWidgets = profile.widgets
    .filter(widget => widget.isActive)
    .map(widget => {
      switch (widget.type) {
        case 'link':
          return { widget, data: profile.linkWidgets?.find(l => l.id === widget.id) };
        case 'agents':
          const agentWidget = profile.agentWidgets?.find(w => w.id === widget.id);
          if (agentWidget) {
            const agents = agentWidget.agentIds
              .map(id => profile.agentDetails.find(a => a.id === id))
              .filter(Boolean)
              .map(agent => ({
                id: agent!.id,
                name: agent!.name,
                description: agent!.description,
                icon: agent!.icon
              }));
            return { widget, data: { ...agentWidget, agents, onAgentClick } };
          }
          return null;
        case 'separator':
          return { widget, data: profile.separatorWidgets?.find(w => w.id === widget.id) };
        case 'title':
          return { widget, data: profile.titleWidgets?.find(w => w.id === widget.id) };
        case 'gallery':
          return { widget, data: profile.galleryWidgets?.find(w => w.id === widget.id) };
        case 'youtube':
          return { widget, data: profile.youtubeWidgets?.find(w => w.id === widget.id) };
        case 'maps':
          return { widget, data: profile.mapsWidgets?.find(w => w.id === widget.id) };
        case 'spotify':
          return { widget, data: profile.spotifyWidgets?.find(w => w.id === widget.id) };
        case 'calendar':
          return { widget, data: profile.calendarWidgets?.find(w => w.id === widget.id) };
        default:
          return null;
      }
    })
    .filter(item => item && item.data) as Array<{ widget: Widget; data: any }>;

  return (
    <div className={cn(
      layout.spacing === 'compact' && 'space-y-2',
      layout.spacing === 'normal' && 'space-y-3',
      layout.spacing === 'relaxed' && 'space-y-4'
    )}>
      {activeWidgets.map(({ widget, data }) => (
        <PublicWidgetRenderer
          key={widget.id}
          widget={widget}
          data={data}
          theme={theme}
          onAgentClick={onAgentClick}
        />
      ))}
    </div>
  );
}

// Profile content wrapper
function ProfileContent({ profile, isPreview }: { profile: ProfileWithAgents; isPreview: boolean }) {
  const { theme, layout } = useProfileTheme();
  const [currentAgentId, setCurrentAgentId] = useState<string>();

  useEffect(() => {
    if (profile?.agentDetails?.length && !currentAgentId) {
      setCurrentAgentId(profile.agentDetails[0].id);
    }
  }, [profile?.agentDetails, currentAgentId]);

  const handleSendMessage = (message: string) => {
    // Handle message sending
    console.log('Message:', message);
  };

  const handleAgentClick = (agentId: string) => {
    setCurrentAgentId(agentId);
  };

  const showChatInput = layout.showChatInput !== false && !isPreview;

  return (
    <div className="min-h-screen relative">
      <ProfileWallpaper />
      
      <div className={cn(
        "relative z-10 min-h-screen",
        showChatInput && "pb-24"
      )}>
        <div className={cn(
          "w-full mx-auto px-4 py-8",
          layout.contentWidth === 'narrow' && 'max-w-md',
          layout.contentWidth === 'normal' && 'max-w-xl',
          layout.contentWidth === 'wide' && 'max-w-3xl'
        )}>
          {/* Profile Header */}
          <div className="profile-animate-in">
            <ProfileComponent 
              profile={profile} 
              isPreview={isPreview}
              showSocialLinks={layout.socialPosition === 'top'}
            />
          </div>
          
          {/* Widgets */}
          <div className="profile-animate-in" style={{ animationDelay: '0.1s' }}>
            <WidgetsList 
              profile={profile}
              onAgentClick={handleAgentClick}
            />
          </div>
          
          {/* Bottom social links */}
          {layout.socialPosition === 'bottom' && (
            <div className="profile-animate-in mt-8" style={{ animationDelay: '0.2s' }}>
              <ProfileComponent 
                profile={profile} 
                isPreview={isPreview}
                showSocialLinks={true}
                onlyShowSocial={true}
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Chat Input */}
      {showChatInput && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <ChatInput onSendMessage={handleSendMessage} />
        </div>
      )}
    </div>
  );
}

export default function PublicProfile({ username, isPreview = false, previewDesign }: PublicProfileProps) {
  // Import profile from context for preview mode
  const { profile: contextProfile } = isPreview ? useProfile() : { profile: null };
  
  const { data: publicProfile, isLoading, error } = useQuery({
    queryKey: ['public-profile', username],
    queryFn: () => {
      if (!username) return null;
      return publicProfileApi.getPublicProfile(username);
    },
    enabled: !!username && !isPreview,
    retry: 2,
    staleTime: 1000 * 60 * 5,
  });

  // Use context profile for preview, public profile for normal view
  const profile = isPreview ? contextProfile : publicProfile;

  if (!isPreview && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!isPreview && (error || !profile)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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

  if (!profile) return null;

  return (
    <div className={cn(
      "w-full h-full relative",
      isPreview && "rounded-lg overflow-hidden"
    )}>
      <ProfileThemeProvider profileDesign={previewDesign || profile.design}>
        <ProfileContent profile={profile} isPreview={isPreview} />
      </ProfileThemeProvider>
    </div>
  );
}