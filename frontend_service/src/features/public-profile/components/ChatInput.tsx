import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { IconSend } from '@tabler/icons-react'

interface ChatInputProps {
  onSendMessage: (message: string) => void
}

export default function ChatInput({ onSendMessage }: ChatInputProps) {
  const [message, setMessage] = useState('')

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

  return (
    <div className="w-full bg-gradient-to-t from-gray-50 to-transparent">
      <div className="px-4 pb-4 pt-8">
        <div className="max-w-xl mx-auto">
          <div className="flex gap-2 items-center bg-white rounded-full shadow-xl border border-gray-200 px-2 py-1">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe para comenzar una conversación..."
              className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent px-4 py-3"
            />
            <Button 
              onClick={handleSend}
              size="icon"
              className="h-10 w-10 rounded-full bg-gray-900 hover:bg-gray-800 shrink-0"
            >
              <IconSend size={18} className="text-white" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}