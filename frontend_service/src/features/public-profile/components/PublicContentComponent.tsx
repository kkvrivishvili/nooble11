// src/features/public-profile/components/PublicContentComponent.tsx - Enhanced version
import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProfileWithAgents, Widget } from '@/types/profile'
import { 
  IconLink,
  IconMessage,
} from '@tabler/icons-react'
import { PublicWidgetRenderer } from '@/features/public-profile/widgets/public-widget-renderer'
import { useProfileTheme } from '@/context/profile-theme-context'

interface ActiveWidget {
  widget: Widget;
  data: any;
}

interface PublicContentComponentProps {
  profile: ProfileWithAgents
  isPreview?: boolean
  activeTab: string
  onTabChange: (value: string) => void
  currentAgentId?: string
  onAgentClick?: (agentId: string) => void
}

export default function PublicContentComponent({ 
  profile, 
  isPreview = false,
  activeTab,
  onTabChange,
  currentAgentId,
  onAgentClick
}: PublicContentComponentProps) {
  const { theme, layout } = useProfileTheme();
  const [messages] = useState<Array<{id: string, text: string, sender: 'user' | 'agent'}>>([]);

  if (!profile) {
    return <div>Loading...</div>;
  }

  const currentAgent = profile.agentDetails.find((a) => a.id === currentAgentId);

  // Get active widgets with their data
  const activeWidgets = profile.widgets
    .filter(widget => widget.isActive)
    .map(widget => {
      switch (widget.type) {
        case 'link': {
          const linkData = profile.linkWidgets?.find(l => l.id === widget.id);
          return linkData ? { widget, data: linkData } : null;
        }
        case 'agents': {
          const agentData = profile.agentWidgets?.find(w => w.id === widget.id);
          if (agentData) {
            const agents = agentData.agentIds
              .map(id => profile.agentDetails.find(a => a.id === id))
              .filter(Boolean)
              .map(agent => ({
                id: agent!.id,
                name: agent!.name,
                description: agent!.description,
                icon: agent!.icon
              }));
            
            return {
              widget,
              data: {
                ...agentData,
                agents,
                onAgentClick
              }
            };
          }
          return null;
        }
        case 'separator': {
          const separatorData = profile.separatorWidgets?.find(w => w.id === widget.id);
          return separatorData ? { widget, data: separatorData } : null;
        }
        case 'title': {
          const titleData = profile.titleWidgets?.find(w => w.id === widget.id);
          return titleData ? { widget, data: titleData } : null;
        }
        case 'gallery': {
          const galleryData = profile.galleryWidgets?.find(w => w.id === widget.id);
          return galleryData ? { widget, data: galleryData } : null;
        }
        case 'youtube': {
          const youtubeData = profile.youtubeWidgets?.find(w => w.id === widget.id);
          return youtubeData ? { widget, data: youtubeData } : null;
        }
        case 'maps': {
          const mapsData = profile.mapsWidgets?.find(w => w.id === widget.id);
          return mapsData ? { widget, data: mapsData } : null;
        }
        case 'spotify': {
          const spotifyData = profile.spotifyWidgets?.find(w => w.id === widget.id);
          return spotifyData ? { widget, data: spotifyData } : null;
        }
        case 'calendar': {
          const calendarData = profile.calendarWidgets?.find(w => w.id === widget.id);
          return calendarData ? { widget, data: calendarData } : null;
        }
        default:
          return null;
      }
    })
    ?.filter(Boolean) as ActiveWidget[] || [];

  // Get tab styles based on theme
  const getTabStyles = () => {
    return {
      backgroundColor: `${theme.primaryColor}10`,
      borderRadius: theme.borderRadius === 'sharp' ? '0.25rem' :
                   theme.borderRadius === 'curved' ? '0.5rem' : '9999px',
    };
  };

  const getActiveTabStyles = () => {
    if (theme.buttonFill === 'glass') {
      return {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        color: theme.primaryColor,
      };
    } else if (theme.buttonFill === 'outline') {
      return {
        backgroundColor: 'transparent',
        border: `2px solid ${theme.primaryColor}`,
        color: theme.primaryColor,
      };
    } else {
      return {
        backgroundColor: theme.primaryColor,
        color: theme.buttonTextColor || '#ffffff',
      };
    }
  };

  return (
    <div className={cn(
      "w-full mx-auto px-4",
      layout.contentWidth === 'narrow' && 'max-w-md',
      layout.contentWidth === 'normal' && 'max-w-xl',
      layout.contentWidth === 'wide' && 'max-w-3xl'
    )}>
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList 
          className={cn(
            "grid w-full grid-cols-2 mb-6",
            isPreview && "text-sm"
          )}
          style={{
            ...getTabStyles(),
            fontFamily: theme.fontFamily === 'serif' ? 'serif' :
                       theme.fontFamily === 'mono' ? 'monospace' : 'sans-serif'
          }}
        >
          <TabsTrigger 
            value="chats" 
            className="data-[state=active]:shadow-sm transition-all"
            style={{
              ...(activeTab === 'chats' ? getActiveTabStyles() : {}),
              borderRadius: theme.borderRadius === 'sharp' ? '0.25rem' :
                           theme.borderRadius === 'curved' ? '0.5rem' : '9999px',
            }}
          >
            <IconMessage size={isPreview ? 16 : 18} className="mr-2" />
            Chats
          </TabsTrigger>
          <TabsTrigger 
            value="links" 
            className="data-[state=active]:shadow-sm transition-all"
            style={{
              ...(activeTab === 'links' ? getActiveTabStyles() : {}),
              borderRadius: theme.borderRadius === 'sharp' ? '0.25rem' :
                           theme.borderRadius === 'curved' ? '0.5rem' : '9999px',
            }}
          >
            <IconLink size={isPreview ? 16 : 18} className="mr-2" />
            Widgets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chats" className={cn(
          layout.spacing === 'compact' && 'space-y-3',
          layout.spacing === 'normal' && 'space-y-4',
          layout.spacing === 'relaxed' && 'space-y-6'
        )}>
          {/* Agentes como iconos arriba */}
          <div className={cn(
            "flex gap-3 justify-center",
            layout.spacing === 'compact' && 'mb-4',
            layout.spacing === 'normal' && 'mb-6',
            layout.spacing === 'relaxed' && 'mb-8'
          )}>
            {profile.agentDetails.map((agent) => (
              <button
                key={agent.id}
                onClick={() => onAgentClick?.(agent.id)}
                className={cn(
                  "p-3 transition-all duration-200",
                  currentAgentId === agent.id
                    ? "scale-110"
                    : "hover:scale-105"
                )}
                style={{
                  ...(currentAgentId === agent.id 
                    ? {
                        backgroundColor: theme.primaryColor,
                        color: theme.buttonTextColor || '#ffffff',
                      }
                    : {
                        backgroundColor: `${theme.primaryColor}20`,
                        color: theme.primaryColor,
                      }
                  ),
                  borderRadius: theme.borderRadius === 'sharp' ? '0.5rem' :
                               theme.borderRadius === 'curved' ? '0.75rem' : '9999px',
                  boxShadow: theme.buttonShadow === 'none' ? 'none' :
                            theme.buttonShadow === 'hard' ? '3px 3px 0 rgba(0,0,0,0.2)' :
                            '0 2px 4px rgba(0,0,0,0.1)',
                }}
                title={agent.name}
              >
                <span className="text-2xl">{agent.icon}</span>
              </button>
            ))}
          </div>

          {/* Área de chat */}
          <div 
            className="border p-4 min-h-[400px] max-h-[500px] overflow-y-auto"
            style={{
              backgroundColor: theme.buttonFill === 'glass' 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: theme.buttonFill === 'glass' ? 'blur(10px)' : 'none',
              WebkitBackdropFilter: theme.buttonFill === 'glass' ? 'blur(10px)' : 'none',
              borderRadius: theme.borderRadius === 'sharp' ? '0.5rem' :
                           theme.borderRadius === 'curved' ? '0.75rem' : '1rem',
              borderColor: `${theme.primaryColor}30`,
            }}
          >
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <span className="text-4xl mb-4">{currentAgent?.icon}</span>
                <h3 
                  className="font-semibold text-lg mb-2"
                  style={{ color: theme.primaryColor }}
                >
                  {currentAgent?.name}
                </h3>
                <p 
                  className="opacity-70"
                  style={{ color: theme.textColor }}
                >
                  {currentAgent?.description}
                </p>
                <p className="text-sm mt-4 opacity-50">
                  Escribe un mensaje para comenzar la conversación
                </p>
              </div>
            ) : (
              <div className={cn(
                layout.spacing === 'compact' && 'space-y-2',
                layout.spacing === 'normal' && 'space-y-3',
                layout.spacing === 'relaxed' && 'space-y-4'
              )}>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "p-3 max-w-[80%]",
                      message.sender === 'user' ? "ml-auto" : ""
                    )}
                    style={{
                      backgroundColor: message.sender === 'user' 
                        ? theme.primaryColor 
                        : `${theme.primaryColor}10`,
                      color: message.sender === 'user' 
                        ? theme.buttonTextColor || '#ffffff'
                        : theme.textColor,
                      borderRadius: theme.borderRadius === 'sharp' ? '0.5rem' :
                                   theme.borderRadius === 'curved' ? '0.75rem' : '1rem',
                    }}
                  >
                    {message.text}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="links" className={cn(
          layout.spacing === 'compact' && 'space-y-2',
          layout.spacing === 'normal' && 'space-y-3',
          layout.spacing === 'relaxed' && 'space-y-4'
        )}>
          {activeWidgets.map(({ widget, data }) => (
            <div key={widget.id}>
              <PublicWidgetRenderer
                widget={widget}
                data={data}
                theme={theme}
                onAgentClick={onAgentClick}
              />
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}