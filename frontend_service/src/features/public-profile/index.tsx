// src/features/public-profile/index.tsx - Updated with tabs (Profile/Chats/Shop) and proper blur handling
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query';
import { publicProfileApi } from '@/api/public-profile-api';
import { ProfileDesign, ProfileWithAgents } from '@/types/profile';
import ProfileComponent from './components/ProfileComponent'
import PublicContentComponent from './components/PublicContentComponent'
import SocialLinks from './components/SocialLinks'
import { ProfileThemeProvider, useProfileTheme } from '@/context/profile-theme-context';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import ChatsView from './components/ChatsView'
import ShopView from './components/ShopView'
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

// Profile content wrapper
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

export default function PublicProfile({ username, isPreview = false, previewDesign, useExternalTheme = false }: PublicProfileProps) {
  const { data: publicProfile, isLoading, error } = useQuery<ProfileWithAgents | null>({
    queryKey: ['public-profile', username],
    queryFn: async () => {
      if (!username) return null;
      return await publicProfileApi.getPublicProfile(username);
    },
    enabled: !!username,
    retry: 2,
    // En modo preview (usado dentro de Profile), siempre refetch al montar para evitar cache stale
    staleTime: isPreview ? 0 : 1000 * 60 * 5,
    refetchOnMount: isPreview ? 'always' : true,
    refetchOnWindowFocus: isPreview ? false : true,
  });

  const profile = publicProfile;
  const [activeTab, setActiveTab] = useState<'profile' | 'chats' | 'shop'>('profile');
  const [currentAgentId, setCurrentAgentId] = useState<string | undefined>(undefined);

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
      isPreview && "rounded-lg overflow-hidden max-h-[600px]" // Added max-height for preview
    )}>
      {/* If an external theme provider is supplied, don't wrap again */}
      {useExternalTheme ? (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'profile' | 'chats' | 'shop')}>
          {/* Wallpaper for all tabs */}
          <ProfileWallpaper />

          <TabsContent value="profile">
            <ProfileContent 
              profile={profile} 
              isPreview={isPreview}
              onAgentClick={(agentId) => { setCurrentAgentId(agentId); setActiveTab('chats'); }}
            />
          </TabsContent>
          <TabsContent value="chats">
            <ChatsView 
              profile={profile}
              currentAgentId={currentAgentId}
              onAgentChange={setCurrentAgentId}
            />
          </TabsContent>
          <TabsContent value="shop">
            <ShopView profile={profile} />
          </TabsContent>

          {/* Fixed bottom menu */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur border-t">
            <div className="max-w-3xl mx-auto px-4 py-2">
              <TabsList className="w-full justify-between">
                <TabsTrigger value="profile">Perfil</TabsTrigger>
                <TabsTrigger value="chats">Chats</TabsTrigger>
                <TabsTrigger value="shop">Shop</TabsTrigger>
              </TabsList>
            </div>
          </div>
        </Tabs>
      ) : (
        <ProfileThemeProvider profileDesign={designToUse}>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'profile' | 'chats' | 'shop')}>
            {/* Wallpaper for all tabs */}
            <ProfileWallpaper />

            <TabsContent value="profile">
              <ProfileContent 
                profile={profile} 
                isPreview={isPreview}
                onAgentClick={(agentId) => { setCurrentAgentId(agentId); setActiveTab('chats'); }}
              />
            </TabsContent>
            <TabsContent value="chats">
              <ChatsView 
                profile={profile}
                currentAgentId={currentAgentId}
                onAgentChange={setCurrentAgentId}
              />
            </TabsContent>
            <TabsContent value="shop">
              <ShopView profile={profile} />
            </TabsContent>

            {/* Fixed bottom menu */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur border-t">
              <div className="max-w-3xl mx-auto px-4 py-2">
                <TabsList className="w-full justify-between">
                  <TabsTrigger value="profile">Perfil</TabsTrigger>
                  <TabsTrigger value="chats">Chats</TabsTrigger>
                  <TabsTrigger value="shop">Shop</TabsTrigger>
                </TabsList>
              </div>
            </div>
          </Tabs>
        </ProfileThemeProvider>
      )}
    </div>
  );
}