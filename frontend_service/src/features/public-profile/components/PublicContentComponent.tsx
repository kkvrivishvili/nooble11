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

type ActiveWidget = {
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
  const { theme } = useProfileTheme();
  const [messages] = useState<Array<{id: string, text: string, sender: 'user' | 'agent'}>>([]);

  // Early return if profile is not loaded
  if (!profile) {
    return <div>Loading...</div>;
  }

  const currentAgent = profile.agentDetails.find((a) => a.id === currentAgentId)

  // Get active widgets with their data
  const activeWidgets = profile.widgets
    ?.filter(w => w.isActive)
    ?.sort((a, b) => a.position - b.position)
    ?.map(widget => {
      switch (widget.type) {
        case 'link': {
          const linkData = profile.linkWidgets?.find(l => l.id === widget.id);
          return linkData ? { widget, data: linkData } : null;
        }
        case 'agents': {
          const agentData = profile.agentWidgets?.find(w => w.id === widget.id);
          if (agentData) {
            // Map agent IDs to actual agent objects
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

  return (
    <div className="w-full max-w-xl mx-auto px-4">
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className={cn(
          "grid w-full grid-cols-2 mb-6 bg-gray-100",
          isPreview && "text-sm"
        )}>
          <TabsTrigger value="chats" className="data-[state=active]:bg-white">
            <IconMessage size={isPreview ? 16 : 18} className="mr-2" />
            Chats
          </TabsTrigger>
          <TabsTrigger value="links" className="data-[state=active]:bg-white">
            <IconLink size={isPreview ? 16 : 18} className="mr-2" />
            Widgets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chats" className="space-y-4">
          {/* Agentes como iconos arriba */}
          <div className="flex gap-3 justify-center mb-6">
            {profile.agentDetails.map((agent) => (
              <button
                key={agent.id}
                onClick={() => onAgentClick?.(agent.id)}
                className={cn(
                  "p-3 rounded-lg transition-colors",
                  currentAgentId === agent.id
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                )}
                title={agent.name}
              >
                <span className="text-2xl">{agent.icon}</span>
              </button>
            ))}
          </div>

          {/* Área de chat mejorada */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 min-h-[400px] max-h-[500px] overflow-y-auto">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <span className="text-4xl mb-4">{currentAgent?.icon}</span>
                <h3 className="font-semibold text-lg mb-2">{currentAgent?.name}</h3>
                <p className="text-gray-500">{currentAgent?.description}</p>
                <p className="text-gray-400 text-sm mt-4">
                  Escribe un mensaje para comenzar la conversación
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "p-3 rounded-lg max-w-[80%]",
                      message.sender === 'user' 
                        ? "bg-gray-900 text-white ml-auto" 
                        : "bg-gray-100"
                    )}
                  >
                    {message.text}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="links" className="space-y-3">
          {activeWidgets.map(({ widget, data }) => (
            <PublicWidgetRenderer
              key={widget.id}
              widget={widget}
              data={data}
              theme={theme}
              onAgentClick={onAgentClick}
              className="mb-4"
            />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
