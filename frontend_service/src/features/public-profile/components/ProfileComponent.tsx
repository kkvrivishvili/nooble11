// src/features/public-profile/components/ProfileComponent.tsx - Enhanced version
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Profile } from '@/types/profile'
import { useProfileTheme } from '@/context/profile-theme-context'
import SocialLinks from './SocialLinks'

interface ProfileComponentProps {
  profile: Profile
  isPreview?: boolean
  showSocialLinks?: boolean
}

export default function ProfileComponent({ 
  profile, 
  isPreview = false,
  showSocialLinks = false 
}: ProfileComponentProps) {
  const { theme, layout } = useProfileTheme();

  // Use theme utility for avatar radius (avatar uses specific Tailwind classes)
  const avatarRadiusClass = theme.borderRadius === 'sharp' ? 'rounded-md' :
                           theme.borderRadius === 'round' ? 'rounded-full' : 'rounded-xl';

  // Social links are now handled by the consolidated SocialLinks component

  return (
    <div 
      className={cn(
        "w-full mx-auto px-4 pt-8 pb-4",
        layout.contentWidth === 'narrow' && 'max-w-md',
        layout.contentWidth === 'normal' && 'max-w-xl',
        layout.contentWidth === 'wide' && 'max-w-3xl'
      )}
      style={{
        fontFamily: theme.fontFamily === 'serif' ? 'serif' :
                   theme.fontFamily === 'mono' ? 'monospace' : 'sans-serif'
      }}
    >
      {/* Avatar y Nombre */}
      <div className={cn(
        "flex items-center gap-4",
        layout.spacing === 'compact' && 'mb-3',
        layout.spacing === 'normal' && 'mb-4',
        layout.spacing === 'relaxed' && 'mb-6'
      )}>
        <Avatar className={cn(
          "transition-all duration-300",
          isPreview ? "h-16 w-16" : "h-20 w-20",
          avatarRadiusClass
        )}
        >
          <AvatarImage src={profile.avatar} />
          <AvatarFallback 
            className="font-bold"
            style={{ 
              backgroundColor: theme.primaryColor,
              color: theme.buttonTextColor || '#ffffff'
            }}
          >
            {profile.displayName
              ? profile.displayName.split(' ').map((n: string) => n[0]).join('')
              : 'NN'}
          </AvatarFallback>
        </Avatar>
        
        <h1 className={cn(
          "font-semibold transition-all duration-300",
          isPreview ? "text-xl" : "text-2xl"
        )}
        style={{ 
          color: theme.textColor || theme.primaryColor,
        }}
        >
          {profile.displayName}
        </h1>
      </div>
      
      {/* Descripción */}
      <p className={cn(
        "transition-all duration-300",
        isPreview && "text-sm",
        layout.spacing === 'compact' && 'mb-4',
        layout.spacing === 'normal' && 'mb-6',
        layout.spacing === 'relaxed' && 'mb-8'
      )}
      style={{ 
        color: theme.textColor || theme.primaryColor,
        opacity: 0.8,
      }}
      >
        {profile.description}
      </p>
      
      {/* Social Links */}
      {showSocialLinks && (
        <SocialLinks 
          socialLinks={profile.socialLinks || []}
          isPreview={isPreview}
          position="top"
          iconSize={20}
        />
      )}
    </div>
  );
}