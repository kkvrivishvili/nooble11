// src/features/public-profile/components/ProfileComponent.tsx - Enhanced version
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

const socialIcons: Record<string, ComponentType<{ size: number; strokeWidth: number; className?: string }>> = {
  instagram: IconBrandInstagram,
  tiktok: IconBrandTiktok,
  youtube: IconBrandYoutube,
  twitter: IconBrandX,
  linkedin: IconBrandLinkedin,
  facebook: IconBrandFacebook,
  spotify: IconBrandSpotify,
}

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

  // Get avatar border radius based on theme
  const getAvatarRadius = () => {
    if (theme.borderRadius === 'sharp') return 'rounded-md';
    if (theme.borderRadius === 'round') return 'rounded-full';
    return 'rounded-xl'; // curved
  };

  // Get social button styles
  const getSocialButtonStyles = () => {
    const baseRadius = theme.borderRadius === 'sharp' ? '0.25rem' :
                      theme.borderRadius === 'curved' ? '0.5rem' : '9999px';
    
    if (theme.buttonFill === 'glass') {
      return {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        color: theme.primaryColor,
        borderRadius: baseRadius,
      };
    } else if (theme.buttonFill === 'outline') {
      return {
        backgroundColor: 'transparent',
        border: `2px solid ${theme.primaryColor}`,
        color: theme.primaryColor,
        borderRadius: baseRadius,
      };
    } else {
      return {
        backgroundColor: `${theme.primaryColor}20`,
        color: theme.primaryColor,
        borderRadius: baseRadius,
      };
    }
  };

  const socialButtonStyles = getSocialButtonStyles();

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
          "border-2 transition-all duration-300",
          isPreview ? "h-16 w-16" : "h-20 w-20",
          getAvatarRadius()
        )}
        style={{
          borderColor: theme.primaryColor,
        }}
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
      {showSocialLinks && profile.socialLinks?.length > 0 && (
        <div className={cn(
          "flex gap-3 transition-all duration-300",
          layout.socialPosition === 'bottom' && 'justify-center'
        )}>
          {profile.socialLinks.map((link) => {
            const Icon = socialIcons[link.platform] || IconLink;
            return (
              <a
                key={link.platform}
                href={isPreview ? undefined : link.url}
                target={isPreview ? undefined : "_blank"}
                rel={isPreview ? undefined : "noopener noreferrer"}
                className={cn(
                  "p-2 transition-all duration-200 hover:scale-110 active:scale-95",
                  isPreview && "cursor-default"
                )}
                style={socialButtonStyles}
                onClick={isPreview ? (e) => e.preventDefault() : undefined}
                onMouseEnter={(e) => {
                  if (theme.buttonFill === 'outline') {
                    e.currentTarget.style.backgroundColor = theme.primaryColor;
                    e.currentTarget.style.color = theme.buttonTextColor || '#ffffff';
                  } else if (theme.buttonFill === 'glass') {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                  } else {
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  Object.assign(e.currentTarget.style, socialButtonStyles);
                  e.currentTarget.style.transform = '';
                }}
              >
                <Icon 
                  size={isPreview ? 18 : 20} 
                  strokeWidth={1.5} 
                />
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}