// src/features/public-profile/components/ThemedProfileComponent.tsx
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Profile } from '@/types/profile'
import { useProfileTheme } from '@/context/profile-theme-context'
import { 
  IconBrandInstagram, 
  IconBrandTiktok, 
  IconBrandYoutube, 
  IconBrandX,
  IconBrandLinkedin,
  IconBrandFacebook,
  IconBrandSpotify,
  IconLink
} from '@tabler/icons-react'
import { ComponentType } from 'react';

const socialIcons: Record<string, ComponentType<{ size: number; strokeWidth: number; className: string }>> = {
  instagram: IconBrandInstagram,
  tiktok: IconBrandTiktok,
  youtube: IconBrandYoutube,
  twitter: IconBrandX,
  linkedin: IconBrandLinkedin,
  facebook: IconBrandFacebook,
  spotify: IconBrandSpotify,
}

interface ThemedProfileComponentProps {
  profile: Profile
  isPreview?: boolean
  showSocialLinks?: boolean
}

export default function ThemedProfileComponent({ 
  profile, 
  isPreview = false,
  showSocialLinks = false 
}: ThemedProfileComponentProps) {
  const { theme, layout, isLoading } = useProfileTheme();

  if (isLoading) {
    return (
      <div className="w-full max-w-xl mx-auto px-4 pt-8 pb-4">
        <div className="animate-pulse">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-20 w-20 bg-gray-200 rounded-full"></div>
            <div className="space-y-2">
              <div className="h-6 bg-gray-200 rounded w-32"></div>
              <div className="h-4 bg-gray-200 rounded w-48"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="w-full max-w-xl mx-auto px-4 pt-8 pb-4 transition-all duration-300"
      style={{
        backgroundColor: theme.backgroundColor,
        backgroundImage: theme.backgroundImage ? `url(${theme.backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        fontFamily: theme.fontFamily === 'serif' ? 'serif' :
                   theme.fontFamily === 'mono' ? 'monospace' : 'sans-serif'
      }}
    >
      {/* Avatar y Nombre en la misma línea */}
      <div className="flex items-center gap-4 mb-4">
        <Avatar className={cn(
          "border-2 transition-all duration-300",
          isPreview ? "h-16 w-16" : "h-20 w-20"
        )}
        style={{
          borderColor: theme.primaryColor,
          borderRadius: theme.borderRadius === 'sm' ? '6px' : 
                       theme.borderRadius === 'md' ? '8px' :
                       theme.borderRadius === 'lg' ? '12px' : '16px'
        }}
        >
          <AvatarImage src={profile.avatar} />
          <AvatarFallback 
            className="text-white font-bold"
            style={{ 
              backgroundColor: theme.primaryColor,
              color: theme.backgroundColor 
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
          color: theme.primaryColor,
          fontFamily: theme.fontFamily === 'serif' ? 'serif' :
                     theme.fontFamily === 'mono' ? 'monospace' : 'sans-serif'
        }}
        >
          {profile.displayName}
        </h1>
      </div>
      
      {/* Descripción */}
      <p className={cn(
        "mb-6 transition-all duration-300",
        isPreview && "text-sm"
      )}
      style={{ 
        color: theme.primaryColor,
        opacity: 0.8,
        fontFamily: theme.fontFamily === 'serif' ? 'serif' :
                   theme.fontFamily === 'mono' ? 'monospace' : 'sans-serif'
      }}
      >
        {profile.description}
      </p>
      
      {/* Social Links (solo si showSocialLinks es true y están en la posición correcta) */}
      {showSocialLinks && layout.socialPosition === 'top' && profile.socialLinks?.length > 0 && (
        <div className="flex gap-3 transition-all duration-300">
          {profile.socialLinks.map((link) => {
            const Icon = socialIcons[link.platform] || IconLink
            return (
              <a
                key={link.platform}
                href={isPreview ? undefined : link.url}
                target={isPreview ? undefined : "_blank"}
                rel={isPreview ? undefined : "noopener noreferrer"}
                className="p-2 transition-all duration-200 hover:scale-110 active:scale-95"
                style={{
                  backgroundColor: `${theme.primaryColor}20`,
                  color: theme.primaryColor,
                  borderRadius: theme.borderRadius === 'sm' ? '4px' : 
                               theme.borderRadius === 'md' ? '6px' :
                               theme.borderRadius === 'lg' ? '8px' : '12px'
                }}
                onClick={isPreview ? (e) => e.preventDefault() : undefined}
              >
                <Icon 
                  size={isPreview ? 18 : 20} 
                  strokeWidth={1.5} 
                  className="transition-colors duration-200" 
                />
              </a>
            )
          })}
        </div>
      )}

      {/* Social Links at bottom if configured that way */}
      {showSocialLinks && layout.socialPosition === 'bottom' && profile.socialLinks?.length > 0 && (
        <div className="flex gap-3 justify-center mt-6 transition-all duration-300">
          {profile.socialLinks.map((link) => {
            const Icon = socialIcons[link.platform] || IconLink
            return (
              <a
                key={link.platform}
                href={isPreview ? undefined : link.url}
                target={isPreview ? undefined : "_blank"}
                rel={isPreview ? undefined : "noopener noreferrer"}
                className="p-2 transition-all duration-200 hover:scale-110 active:scale-95"
                style={{
                  backgroundColor: `${theme.primaryColor}20`,
                  color: theme.primaryColor,
                  borderRadius: theme.borderRadius === 'sm' ? '4px' : 
                               theme.borderRadius === 'md' ? '6px' :
                               theme.borderRadius === 'lg' ? '8px' : '12px'
                }}
                onClick={isPreview ? (e) => e.preventDefault() : undefined}
              >
                <Icon 
                  size={isPreview ? 18 : 20} 
                  strokeWidth={1.5} 
                  className="transition-colors duration-200" 
                />
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}