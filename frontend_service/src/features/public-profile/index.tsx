// src/features/public-profile/index.tsx - Simple structure with bottom animated tabs
import { useEffect, useRef, useState } from 'react'
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
import { chatApi, ChatSocketConnection } from '@/api/chat-api'
import './styles/profile-theme.css';

interface PublicProfileProps {
  username: string;
  isPreview?: boolean;
  previewDesign?: ProfileDesign;
}

interface UIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
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
    <div className="profile-container" style={{ ...getCSSVariables(), minHeight: isPreview ? '100%' : undefined }}>
      <div className={cn("profile-content", isPreview ? undefined : "pb-24")}>
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
  const [messagesByAgent, setMessagesByAgent] = useState<Record<string, UIChatMessage[]>>({});
  // Orchestrator sessions and sockets by agent
  const [sessionsByAgent, setSessionsByAgent] = useState<Record<string, { sessionId: string; wsUrl: string }>>({});
  const [socketsByAgent, setSocketsByAgent] = useState<Record<string, ChatSocketConnection | null>>({});
  const [_draftByAgent, setDraftByAgent] = useState<Record<string, { taskId?: string; messageId: string }>>({});
  const socketsRef = useRef<Record<string, ChatSocketConnection | null>>({});

  // Keep socketsRef in sync and close all on unmount
  useEffect(() => {
    socketsRef.current = socketsByAgent;
  }, [socketsByAgent]);

  useEffect(() => {
    return () => {
      Object.values(socketsRef.current).forEach((s) => {
        try { s?.close(); } catch { /* noop */ }
      });
    };
  }, []);

  // Handle sending messages in chat (allows override of agentId when starting from suggestions)
  const handleSendMessage = async (message: string, overrideAgentId?: string) => {
    const trimmed = message.trim();
    if (!trimmed) return;

    const firstAgentId = profile?.agentDetails?.[0]?.id;
    const targetAgentId = overrideAgentId || currentAgentId || firstAgentId;
    if (!targetAgentId) return;

    // If we got an override and current is different or unset, sync it
    if (overrideAgentId && overrideAgentId !== currentAgentId) {
      setCurrentAgentId(overrideAgentId);
    }
    // If there was no current agent selected, sync it to target
    if (!currentAgentId && targetAgentId) {
      setCurrentAgentId(targetAgentId);
    }

    const newMessage: UIChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user' as const,
      content: trimmed,
      created_at: new Date().toISOString()
    };

    setMessagesByAgent(prev => ({
      ...prev,
      [targetAgentId]: [...(prev[targetAgentId] || []), newMessage]
    }));
    // Orchestrator: ensure session + websocket, then send message
    try {
      const tenantId = profile?.id as string | undefined;
      if (!tenantId) return;

      // 1) Ensure session exists
      let session = sessionsByAgent[targetAgentId];
      if (!session) {
        const init = await chatApi.initChatSession({
          tenant_id: tenantId,
          agent_id: targetAgentId,
          metadata: { source: 'public_profile' }
        });
        session = { sessionId: init.session_id, wsUrl: init.websocket_url };
        setSessionsByAgent(prev => ({ ...prev, [targetAgentId]: session! }));
      }

      // 2) Ensure websocket
      let socket = socketsByAgent[targetAgentId];
      if (!socket || !socket.isOpen()) {
        socket = chatApi.connectWebSocket(session.wsUrl, {
          onError: (err) => {
            const errorMsg = {
              id: `msg-${Date.now()}-error`,
              role: 'assistant' as const,
              content: `⚠️ Error de chat: ${err.message}`,
              created_at: new Date().toISOString()
            };
            setMessagesByAgent(prev => ({
              ...prev,
              [targetAgentId]: [...(prev[targetAgentId] || []), errorMsg]
            }));
          },
          onStreaming: (taskId, data) => {
            if (!data) return;
            setDraftByAgent(prevDraft => {
              const existing = prevDraft[targetAgentId];
              let draftId = existing?.messageId;
              if (!draftId) {
                draftId = `msg-${Date.now()}-assistant-draft`;
                setMessagesByAgent(prev => ({
                  ...prev,
                  [targetAgentId]: [
                    ...(prev[targetAgentId] || []),
                    { id: draftId, role: 'assistant' as const, content: '', created_at: new Date().toISOString() }
                  ]
                }));
              }
              // Append chunk
              setMessagesByAgent(prev => {
                const arr = prev[targetAgentId] || [];
                const updated = arr.map(m => m.id === draftId
                  ? { ...m, content: `${m.content || ''}${data.content || ''}` }
                  : m
                );
                return { ...prev, [targetAgentId]: updated };
              });
              return { ...prevDraft, [targetAgentId]: { taskId: taskId || existing?.taskId, messageId: draftId } };
            });
          },
          onResponse: (taskId, payload) => {
            const content = payload?.message?.content || '';
            setDraftByAgent(prevDraft => {
              const existing = prevDraft[targetAgentId];
              if (!existing?.messageId) {
                const msgId = `msg-${Date.now()}-assistant`;
                setMessagesByAgent(prev => ({
                  ...prev,
                  [targetAgentId]: [
                    ...(prev[targetAgentId] || []),
                    { id: msgId, role: 'assistant' as const, content, created_at: new Date().toISOString() }
                  ]
                }));
                return { ...prevDraft, [targetAgentId]: { taskId: taskId || undefined, messageId: msgId } };
              }
              const draftId = existing.messageId;
              setMessagesByAgent(prev => {
                const arr = prev[targetAgentId] || [];
                const updated = arr.map(m => m.id === draftId
                  ? { ...m, content: content || m.content }
                  : m
                );
                return { ...prev, [targetAgentId]: updated };
              });
              return prevDraft;
            });
          },
          onClose: () => {
            setSocketsByAgent(prev => ({ ...prev, [targetAgentId]: null }));
          },
        });
        setSocketsByAgent(prev => ({ ...prev, [targetAgentId]: socket! }));
      }

      // 3) Send user message
      const sendNow = () => socket!.sendUserMessage(trimmed, { sessionId: session!.sessionId });
      if (socket.isOpen()) sendNow();
      else {
        const origOpen = socket.ws.onopen;
        socket.ws.onopen = (ev) => {
          // @ts-expect-error allow chaining any existing handler
          if (typeof origOpen === 'function') origOpen(ev);
          sendNow();
        };
      }
    } catch (err: unknown) {
      const messageText = err instanceof Error ? err.message : 'Error desconocido';
      const errorMsg = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant' as const,
        content: `⚠️ No se pudo enviar el mensaje: ${messageText}`,
        created_at: new Date().toISOString()
      };
      setMessagesByAgent(prev => ({
        ...prev,
        [targetAgentId]: [...(prev[targetAgentId] || []), errorMsg]
      }));
    }
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
            onSendMessage={handleSendMessage}
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
      <div className="profile-container" style={{ ...getCSSVariables(), minHeight: isPreview ? '100%' : undefined }}>
        <div className={cn("profile-content", isPreview ? undefined : "pb-24")}>
          {children}
        </div>
      </div>
    );
  };

  return (
    <div className={cn(
      "relative transition-all duration-300",
      isPreview ? "h-full w-full rounded-lg overflow-hidden flex flex-col" : "min-h-screen"
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
            <div className="w-full px-4 py-2">
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
            <div className="w-full px-4 py-2">
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