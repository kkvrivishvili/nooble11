// src/features/public-profile/index.tsx
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
  const { data: publicProfile, isLoading: isLoadingPublic, error } = useQuery({
    queryKey: ['public-profile', username],
    queryFn: () => {
      if (!username) return null;
      return publicProfileApi.getPublicProfile(username);
    },
    enabled: !!username,
    retry: 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const profile = publicProfile;
  const isLoading = isLoadingPublic;

  const [activeTab, setActiveTab] = useState('chats');
  const [currentAgentId, setCurrentAgentId] = useState<string>();

  useEffect(() => {
    // Set the first agent as active by default when the profile loads
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

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-xl font-semibold mb-2">Perfil no encontrado</h2>
          <p className="text-gray-600">
            {error ? 'Error al cargar el perfil' : 'No se encontró el perfil solicitado'}
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Usuario: {username}
          </p>
        </div>
      </div>
    )
  }

  // Debug: Log design info
  console.log('🎨 Profile design:', profile.design);

  return (
    <div className={cn(
      "min-h-screen relative transition-all duration-300",
      isPreview && "rounded-lg overflow-hidden"
    )}>
      {/* Wrap everything in ProfileThemeProvider with the profile's design */}
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
      {!isPreview && (
        <div 
          className="w-full z-50 fixed bottom-0 left-0 right-0"
        >
          <ChatInput
            onSendMessage={handleSendMessage}
          />
        </div>
      )}
    </div>
  )
}