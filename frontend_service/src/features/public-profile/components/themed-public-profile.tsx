import React, { useState, useEffect } from 'react';
import { ProfileThemeProvider, useProfileTheme } from '@/context/profile-theme-context';
import { PublicWidgetRenderer } from '../widgets/PublicWidgetRenderer';
import { ProfileWithAgents } from '@/types/profile';
import { cn } from '@/lib/utils';

interface ThemedPublicProfileProps {
  profile: ProfileWithAgents;
  isPreview?: boolean;
}

function PublicProfileContent({ profile, isPreview }: ThemedPublicProfileProps) {
  const { theme, layout, isLoading } = useProfileTheme();
  const [activeTab, setActiveTab] = useState('chats');
  const [currentAgentId, setCurrentAgentId] = useState<string>();

  useEffect(() => {
    if (profile?.agentDetails?.length && !currentAgentId) {
      setCurrentAgentId(profile.agentDetails[0].id);
    }
  }, [profile?.agentDetails, currentAgentId]);

  if (isLoading) {
    return <div className="animate-pulse">Loading theme...</div>;
  }

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
                agents
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
        default:
          return null;
      }
    })
    ?.filter(Boolean) || [];

  const handleAgentClick = (agentId: string) => {
    setCurrentAgentId(agentId);
    setActiveTab('chats');
  };

  return (
    <div 
      className={cn(
        "min-h-screen transition-all duration-300",
        isPreview && "rounded-lg overflow-hidden"
      )}
      style={{
        backgroundColor: theme.backgroundColor,
        backgroundImage: theme.backgroundImage ? `url(${theme.backgroundImage})` : undefined,
        fontFamily: theme.fontFamily === 'serif' ? 'serif' :
                   theme.fontFamily === 'mono' ? 'monospace' : 'sans-serif'
      }}
    >
      {/* Profile Header */}
      <div className="w-full max-w-xl mx-auto px-4 pt-8 pb-4">
        <div className="flex items-center gap-4 mb-4">
          <div 
            className="h-20 w-20 rounded-full border-2 bg-gray-100 flex items-center justify-center text-2xl font-bold"
            style={{ 
              borderColor: theme.primaryColor,
              color: theme.primaryColor 
            }}
          >
            {profile.avatar ? (
              <img 
                src={profile.avatar} 
                alt={profile.displayName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              profile.displayName
                ?.split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase() || 'NN'
            )}
          </div>
          
          <h1 
            className="font-semibold text-2xl"
            style={{ color: theme.primaryColor }}
          >
            {profile.displayName}
          </h1>
        </div>
        
        <p 
          className="mb-6"
          style={{ 
            color: theme.primaryColor,
            opacity: 0.8 
          }}
        >
          {profile.description}
        </p>
        
        {/* Social Links - if positioned at top */}
        {layout.socialPosition === 'top' && profile.socialLinks?.length > 0 && (
          <div className="flex gap-3 mb-6">
            {profile.socialLinks.map((link) => (
              <a
                key={link.platform}
                href={isPreview ? undefined : link.url}
                target={isPreview ? undefined : "_blank"}
                rel={isPreview ? undefined : "noopener noreferrer"}
                className="p-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: `${theme.primaryColor}10`,
                  color: theme.primaryColor,
                  borderRadius: theme.borderRadius === 'sm' ? '4px' : 
                             theme.borderRadius === 'md' ? '8px' :
                             theme.borderRadius === 'lg' ? '12px' : '16px'
                }}
                onClick={isPreview ? (e) => e.preventDefault() : undefined}
              >
                <span className="text-xl">{link.icon}</span>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="w-full max-w-xl mx-auto px-4 space-y-4">
        {activeWidgets.map(({ widget, data }) => (
          <PublicWidgetRenderer
            key={widget.id}
            widget={widget}
            data={data}
            theme={theme}
            onAgentClick={handleAgentClick}
            className="mb-4"
          />
        ))}
      </div>

      {/* Social Links - if positioned at bottom */}
      {layout.socialPosition === 'bottom' && profile.socialLinks?.length > 0 && (
        <div className="w-full max-w-xl mx-auto px-4 pt-6 pb-4">
          <div className="flex gap-3 justify-center">
            {profile.socialLinks.map((link) => (
              <a
                key={link.platform}
                href={isPreview ? undefined : link.url}
                target={isPreview ? undefined : "_blank"}
                rel={isPreview ? undefined : "noopener noreferrer"}
                className="p-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: `${theme.primaryColor}10`,
                  color: theme.primaryColor,
                }}
                onClick={isPreview ? (e) => e.preventDefault() : undefined}
              >
                <span className="text-xl">{link.icon}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ThemedPublicProfile(props: ThemedPublicProfileProps) {
  return (
    <ProfileThemeProvider profileDesign={props.profile.design}>
      <PublicProfileContent {...props} />
    </ProfileThemeProvider>
  );
}