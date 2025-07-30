import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { IconSend } from '@tabler/icons-react'
import { useProfileTheme } from '@/context/profile-theme-context'

interface ChatInputProps {
  onSendMessage: (message: string) => void
}

export default function ChatInput({ onSendMessage }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const { theme } = useProfileTheme()

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message)
      setMessage('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const getInputStyles = () => {
    const baseRadius = theme.borderRadius === 'sharp' ? '1.5rem' :
                      theme.borderRadius === 'curved' ? '2rem' : '9999px';
    
    return {
      borderRadius: baseRadius,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      fontFamily: theme.fontFamily === 'serif' ? 'serif' :
                 theme.fontFamily === 'mono' ? 'monospace' : 'sans-serif',
    };
  };

  const getButtonStyles = () => {
    const baseRadius = theme.borderRadius === 'sharp' ? '0.5rem' :
                      theme.borderRadius === 'curved' ? '1rem' : '9999px';
    
    return {
      backgroundColor: theme.primaryColor,
      color: theme.buttonTextColor || '#ffffff',
      borderRadius: baseRadius,
      boxShadow: theme.buttonShadow === 'none' ? 'none' :
                theme.buttonShadow === 'hard' ? '2px 2px 0 rgba(0,0,0,0.2)' :
                '0 2px 4px rgba(0,0,0,0.1)',
    };
  };

  return (
    <div className="w-full bg-gradient-to-t from-gray-50/80 to-transparent backdrop-blur-sm">
      <div className="px-4 pb-4 pt-8">
        <div className="max-w-xl mx-auto">
          <div 
            className="flex gap-2 items-center shadow-xl border border-gray-200/50 px-2 py-1"
            style={getInputStyles()}
          >
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe para comenzar una conversación..."
              className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent px-4 py-3"
              style={{
                fontFamily: theme.fontFamily === 'serif' ? 'serif' :
                           theme.fontFamily === 'mono' ? 'monospace' : 'sans-serif',
              }}
            />
            <Button 
              onClick={handleSend}
              size="icon"
              className="h-10 w-10 shrink-0 transition-all hover:scale-105 active:scale-95"
              style={getButtonStyles()}
            >
              <IconSend size={18} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}