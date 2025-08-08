import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { useProfileTheme } from '@/context/profile-theme-context'
import { Agent, ProfileWithAgents } from '@/types/profile'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface ChatsViewProps {
  profile: ProfileWithAgents
  currentAgentId?: string
  onAgentChange?: (agentId: string) => void
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export default function ChatsView({ profile, currentAgentId, onAgentChange }: ChatsViewProps) {
  const { theme, layout } = useProfileTheme()
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>(currentAgentId)
  const [messagesByAgent, setMessagesByAgent] = useState<Record<string, ChatMessage[]>>({})
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!selectedAgentId && profile?.agentDetails?.length) {
      setSelectedAgentId(profile.agentDetails[0].id)
    }
  }, [profile?.agentDetails, selectedAgentId])

  useEffect(() => {
    if (currentAgentId) {
      setSelectedAgentId(currentAgentId)
    }
  }, [currentAgentId])

  const selectedAgent: Agent | undefined = useMemo(
    () => profile?.agentDetails?.find(a => a.id === selectedAgentId),
    [profile?.agentDetails, selectedAgentId]
  )

  useEffect(() => {
    // Seed mock messages for newly selected agent
    if (selectedAgentId && !messagesByAgent[selectedAgentId]) {
      setMessagesByAgent(prev => ({
        ...prev,
        [selectedAgentId]: [
          {
            id: 'm1',
            role: 'assistant',
            content: `Hola! Soy ${selectedAgent?.name}. ¿En qué puedo ayudarte?`,
            created_at: new Date().toISOString(),
          },
        ],
      }))
    }
  }, [selectedAgentId])

  useEffect(() => {
    // Auto scroll on new messages
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messagesByAgent, selectedAgentId])

  const getBubbleStyles = (role: ChatMessage['role']) => ({
    backgroundColor:
      role === 'user'
        ? theme.primary_color
        : `${theme.primary_color || '#000'}10`,
    color: role === 'user' ? (theme.button_text_color || '#fff') : (theme.text_color || '#111827'),
    borderRadius:
      theme.border_radius === 'sharp' ? '0.5rem' : theme.border_radius === 'curved' ? '0.75rem' : '1.25rem',
    border: role === 'assistant' ? `1px solid ${theme.primary_color || '#e5e7eb'}` : 'none',
  })

  return (
    <div
      className={cn(
        'w-full mx-auto px-4 pb-28',
        layout.content_width === 'narrow' && 'max-w-md',
        layout.content_width === 'normal' && 'max-w-xl',
        layout.content_width === 'wide' && 'max-w-3xl'
      )}
    >
      {/* Agent selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {profile.agentDetails?.map(agent => {
          const isActive = agent.id === selectedAgentId
          return (
            <button
              key={agent.id}
              onClick={() => {
                setSelectedAgentId(agent.id)
                onAgentChange?.(agent.id)
              }}
              className={cn(
                'flex items-center gap-2 px-3 py-2 border rounded-full whitespace-nowrap transition-colors',
                isActive ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-900 border-gray-200'
              )}
              style={{
                fontFamily: theme.font_family === 'serif' ? 'serif' : theme.font_family === 'mono' ? 'monospace' : 'sans-serif',
              }}
            >
              <span className="text-lg">{agent.icon}</span>
              <span className="text-sm font-medium">{agent.name}</span>
            </button>
          )
        })}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="mt-3 space-y-3 max-h-[50vh] overflow-auto pr-1">
        {(selectedAgentId && messagesByAgent[selectedAgentId])?.map(msg => (
          <div key={msg.id} className={cn('flex items-start gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            {msg.role === 'assistant' && (
              <Avatar className="h-6 w-6">
                <AvatarFallback>{selectedAgent?.name?.[0] || 'A'}</AvatarFallback>
              </Avatar>
            )}
            <div className="max-w-[75%] px-3 py-2 text-sm" style={getBubbleStyles(msg.role)}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
