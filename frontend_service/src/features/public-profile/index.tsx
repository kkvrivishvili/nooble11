// src/features/public-profile/index.tsx - Simple structure with bottom animated tabs
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query';
import { publicProfileApi } from '@/api/public-profile-api';
import { ProfileDesign, ProfileWithAgents } from '@/types/profile';
import ProfileComponent from './components/ProfileComponent'
import PublicContentComponent from './components/PublicContentComponent'
import SocialLinks from './components/SocialLinks'
import { ProfileThemeProvider, useProfileTheme } from '@/context/profile-theme-context';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/animated-tabs'
import ChatsView from './components/ChatsView'
import ShopView from './components/ShopView'
import ChatInput from './components/ChatInput'
import './styles/profile-theme.css';

interface PublicProfileProps {
  username: string;
  isPreview?: boolean;
  previewDesign?: ProfileDesign;
  useExternalTheme?: boolean;
}

// Wallpaper component - handles video and blur overlays
function ProfileWallpaper() {
  const { theme } = useProfileTheme();
  
  // Video wallpaper
  if (theme.wallpaper?.type === 'video' && theme.wallpaper.video_url) {
    return (
      <div className="profile-video-wallpaper">
        <video
          autoPlay
          loop={theme.wallpaper.video_loop}
          muted={theme.wallpaper.video_muted}
          playsInline
          style={{
            filter: theme.wallpaper.video_blur ? `blur(${theme.wallpaper.video_blur_intensity || 10}px)` : 'none'
          }}
        >
          <source src={theme.wallpaper.video_url} type="video/mp4" />
        </video>
        {theme.wallpaper.video_overlay && (
          <div 
            className="absolute inset-0 z-0"
            style={{ backgroundColor: theme.wallpaper.video_overlay }}
          />
        )}
      </div>
    );
  }
  
  // For other wallpaper types, blur is handled via CSS
  return null;
}

// Profile content - original structure
function ProfileContent({ profile, isPreview, onAgentClick }: { profile: ProfileWithAgents; isPreview: boolean; onAgentClick?: (agentId: string) => void }) {
  const { layout, getCSSVariables } = useProfileTheme();

  return (
    <div className="profile-container" style={getCSSVariables()}>
      <div className="profile-content pb-24">
        {/* Profile Header */}
        <div className="profile-animate-in">
          <ProfileComponent 
            profile={profile} 
            isPreview={isPreview}
            showSocialLinks={layout.social_position === 'top'}
          />
        </div>
        
        {/* Content */}
        <div className="profile-animate-in" style={{ animationDelay: '0.1s' }}>
          <PublicContentComponent
            profile={profile}
            onAgentClick={onAgentClick}
          />
        </div>
        
        {/* Bottom social links */}
        {layout.social_position === 'bottom' && (
          <div className="mt-6 profile-animate-in" style={{ animationDelay: '0.2s' }}>
            <SocialLinks 
              social_links={profile.social_links || []}
              isPreview={isPreview}
              position="bottom"
              iconSize={20}
              className="justify-center"
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Bottom animated tabs menu - mobile viewport style
function BottomTabsMenu({ activeTab, onTabChange, isPreview }: { activeTab: string; onTabChange: (tab: string) => void; isPreview?: boolean }) {
  const { theme } = useProfileTheme();
  const fill = theme.button_fill || 'solid';
  const primary = theme.primary_color;
  const text = theme.text_color || '#111827';
  const btnText = theme.button_text_color || '#ffffff';

  const tabVars = {
    '--tab-active-bg': fill === 'solid' ? primary : fill === 'glass' ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.06)',
    '--tab-active-text': fill === 'solid' ? btnText : primary,
    '--color-base-content': text,
  } as React.CSSProperties;

  return (
    <div className="w-full bg-white/70 backdrop-blur border-t z-50">
      <div className={cn(
        "mx-auto px-4 py-2",
        isPreview ? "max-w-full" : "max-w-3xl"
      )}>
        <Tabs value={activeTab} onValueChange={onTabChange}>
          <TabsList style={tabVars} className="w-full justify-between">
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="chats">Chats</TabsTrigger>
            <TabsTrigger value="shop">Shop</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}

export default function PublicProfile({ username, isPreview = false, previewDesign, useExternalTheme = false }: PublicProfileProps) {
  const { data: publicProfile, isLoading, error } = useQuery<ProfileWithAgents | null>({
    queryKey: ['public-profile', username],
    queryFn: async () => {
      if (!username) return null;
      return await publicProfileApi.getPublicProfile(username);
    },
    enabled: !!username,
    retry: 2,
    staleTime: isPreview ? 0 : 1000 * 60 * 5,
    refetchOnMount: isPreview ? 'always' : true,
    refetchOnWindowFocus: isPreview ? false : true,
  });

  const profile = publicProfile;
  const [activeTab, setActiveTab] = useState<'profile' | 'chats' | 'shop'>('profile');
  const [currentAgentId, setCurrentAgentId] = useState<string | undefined>(undefined);
  const [messagesByAgent, setMessagesByAgent] = useState<Record<string, any[]>>({});

  // Handle sending messages in chat
  const handleSendMessage = (message: string) => {
    if (!currentAgentId || !message.trim()) return;

    const newMessage = {
      id: `msg-${Date.now()}`,
      role: 'user' as const,
      content: message.trim(),
      created_at: new Date().toISOString()
    };

    setMessagesByAgent(prev => ({
      ...prev,
      [currentAgentId]: [...(prev[currentAgentId] || []), newMessage]
    }));

    // Mock agent response
    setTimeout(() => {
      const agentResponse = {
        id: `msg-${Date.now()}-agent`,
        role: 'assistant' as const,
        content: `Respuesta automática del agente a: "${message}"`,
        created_at: new Date().toISOString()
      };

      setMessagesByAgent(prev => ({
        ...prev,
        [currentAgentId]: [...(prev[currentAgentId] || []), agentResponse]
      }));
    }, 1000);
  };

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

  const designToUse = isPreview && previewDesign ? previewDesign : profile.design;

  // Render content based on active tab with proper wallpaper container
  const renderContent = () => {
    switch (activeTab) {
      case 'chats':
        return (
          <ChatsView 
            profile={profile}
            currentAgentId={currentAgentId}
            onAgentChange={setCurrentAgentId}
            messagesByAgent={messagesByAgent}
          />
        );
      case 'shop':
        return <ShopView profile={profile} />;
      default:
        return (
          <ProfileContent 
            profile={profile} 
            isPreview={isPreview}
            onAgentClick={(agentId: string) => { 
              setCurrentAgentId(agentId); 
              setActiveTab('chats'); 
            }}
          />
        );
    }
  };

  // Wrapper component for non-profile content to inherit wallpaper
  const ContentWithWallpaper = ({ children }: { children: React.ReactNode }) => {
    const { getCSSVariables } = useProfileTheme();
    return (
      <div className="profile-container" style={getCSSVariables()}>
        <div className="profile-content pb-24">
          {children}
        </div>
      </div>
    );
  };

  return (
    <div className={cn(
      "relative transition-all duration-300",
      isPreview ? "h-[600px] w-full rounded-lg overflow-hidden flex flex-col" : "min-h-screen"
    )}>
      {useExternalTheme ? (
        <>
          {/* Wallpaper always visible */}
          <ProfileWallpaper />
          {/* Scrollable content area */}
          <div className={cn(
            "relative",
            isPreview ? "flex-1 overflow-y-auto" : "min-h-screen"
          )}>
            {activeTab === 'profile' ? (
              renderContent()
            ) : (
              <ContentWithWallpaper>
                {renderContent()}
              </ContentWithWallpaper>
            )}
          </div>
          {/* Chat input - only visible in chats tab, above tabs menu */}
          {activeTab === 'chats' && (
            <div className="w-full bg-white/90 backdrop-blur border-t px-4 py-2">
              <ChatInput onSendMessage={handleSendMessage} />
            </div>
          )}
          {/* Bottom tabs menu - always at bottom */}
          <BottomTabsMenu 
            activeTab={activeTab} 
            onTabChange={(tab) => setActiveTab(tab as 'profile' | 'chats' | 'shop')}
            isPreview={isPreview}
          />
        </>
      ) : (
        <ProfileThemeProvider profileDesign={designToUse}>
          {/* Wallpaper always visible */}
          <ProfileWallpaper />
          {/* Scrollable content area */}
          <div className={cn(
            "relative",
            isPreview ? "flex-1 overflow-y-auto" : "min-h-screen"
          )}>
            {activeTab === 'profile' ? (
              renderContent()
            ) : (
              <ContentWithWallpaper>
                {renderContent()}
              </ContentWithWallpaper>
            )}
          </div>
          {/* Chat input - only visible in chats tab, above tabs menu */}
          {activeTab === 'chats' && (
            <div className="w-full bg-white/90 backdrop-blur border-t px-4 py-2">
              <ChatInput onSendMessage={handleSendMessage} />
            </div>
          )}
          {/* Bottom tabs menu - always at bottom */}
          <BottomTabsMenu 
            activeTab={activeTab} 
            onTabChange={(tab) => setActiveTab(tab as 'profile' | 'chats' | 'shop')}
            isPreview={isPreview}
          />
        </ProfileThemeProvider>
      )}
    </div>
  );
}