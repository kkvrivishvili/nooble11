import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query';
import { publicProfileApi } from '@/api/public-profile-api';
import ProfileComponent from './components/ProfileComponent'
import PublicContentComponent from './components/PublicContentComponent'
import ChatInput from './components/ChatInput'
import { ProfileThemeProvider } from '@/context/profile-theme-context';

interface PublicProfileProps {
  username: string;
  isPreview?: boolean
}

export default function PublicProfile({ username, isPreview = false }: PublicProfileProps) {
  // Always use the public profile API for both preview and public pages
  const { data: publicProfile, isLoading: isLoadingPublic } = useQuery({
    queryKey: ['public-profile', username],
    queryFn: () => {
      if (!username) return null;
      return publicProfileApi.getPublicProfile(username);
    },
    enabled: !!username, // Run this query whenever we have a username
  });

  // Use the same profile and loading state for both preview and public
  const profile = publicProfile;
  const isLoading = isLoadingPublic;

  const [activeTab, setActiveTab] = useState('chats');
  const [currentAgentId, setCurrentAgentId] = useState<string>();

  useEffect(() => {
    // Set the main agent as active by default when the profile loads
    if (profile?.agentDetails?.length && !currentAgentId) {
      setCurrentAgentId(profile.agentDetails[0].id);
    }
  }, [profile?.agentDetails, currentAgentId]);

  const handleSendMessage = (message: string) => {
    if (message.trim()) {
      // Si estamos en Links, cambiar a Chats
      if (activeTab === 'links') {
        setActiveTab('chats')
      }
      // Aquí irá la lógica para enviar el mensaje
    }
  }

  const handleAgentClick = (agentId: string) => {
    setCurrentAgentId(agentId)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">No se encontró el perfil</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "min-h-screen bg-gray-50 relative"
      // Removed overflow-hidden in preview mode so content can scroll with parent
    )}>
      <ProfileThemeProvider profileDesign={profile.design}>
        <div className="pb-24"> 
          {/* Profile Header */}
          <ProfileComponent 
            profile={profile} 
            isPreview={isPreview}
            showSocialLinks={activeTab === 'links'}
          />
          
          {/* Content Tabs */}
          <PublicContentComponent
            profile={profile}
            isPreview={isPreview}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            currentAgentId={currentAgentId}
            onAgentClick={handleAgentClick}
          />
        </div>
      </ProfileThemeProvider>
      
      {/* Chat Input - Always sticky at the bottom */}
      <div 
        className={cn(
          "w-full z-50 sticky bottom-0 left-0 right-0"
        )}
        style={{ 
          position: 'sticky',
          bottom: 0,
          left: 0,
          right: 0
        }}
      >
        <ChatInput
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  )
}