import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query';
import { profileApi } from '@/api/profile-api';
import { useProfile } from '@/hooks/use-profile';
import ProfileComponent from './components/ProfileComponent'
import ContentComponent from './components/ContentComponent'
import ChatInput from './components/ChatInput'
import { ProfileThemeProvider } from '@/context/profile-theme-context';

interface PublicProfileProps {
  username: string;
  isPreview?: boolean
}

export default function PublicProfile({ username, isPreview = false }: PublicProfileProps) {
  // Use the context hook for the preview mode
  const contextProfile = useProfile();

  // Use a separate query for the public profile page
  const { data: publicProfile, isLoading: isLoadingPublic } = useQuery({
    queryKey: ['profile', username],
    queryFn: () => {
      if (!username) return null;
      return profileApi.getProfileByUsername(username);
    },
    enabled: !isPreview && !!username, // Only run this query on public pages
  });

  // Determine which profile and loading state to use
  const profile = isPreview ? contextProfile.profile : publicProfile;
  const isLoading = isPreview ? contextProfile.isLoading : isLoadingPublic;

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
      <div className="pb-24"> 
        {/* Profile Header */}
        <ProfileComponent 
          profile={profile} 
          isPreview={isPreview}
          showSocialLinks={activeTab === 'links'}
        />
        
        {/* Content Tabs */}
        <ContentComponent
          profile={profile}
          isPreview={isPreview}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          currentAgentId={currentAgentId}
          onAgentClick={handleAgentClick}
        />
      </div>
      
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