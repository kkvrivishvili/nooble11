// src/features/public-profile/components/ProfileComponent.tsx
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
  onlyShowSocial?: boolean
}

export default function ProfileComponent({ 
  profile, 
  isPreview = false,
  showSocialLinks = false,
  onlyShowSocial = false
}: ProfileComponentProps) {
  const { theme, layout } = useProfileTheme();

  // Get avatar styles based on theme
  const getAvatarStyles = () => {
    const baseRadius = theme.borderRadius === 'sharp' ? '0.5rem' :
                      theme.borderRadius === 'curved' ? '1rem' : '9999px';
    
    return {
      borderRadius: baseRadius,
      border: 'none' // No border as requested
    };
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

  // Social links component
  const SocialLinks = () => {
    if (!profile.socialLinks?.length) return null;
    
    return (
      <div className={cn(
        "flex gap-3 transition-all duration-300",
        "justify-center"
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
                if (!isPreview) {
                  if (theme.buttonFill === 'outline') {
                    e.currentTarget.style.backgroundColor = theme.primaryColor;
                    e.currentTarget.style.color = theme.buttonTextColor || '#ffffff';
                  } else if (theme.buttonFill === 'glass') {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                  } else {
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }
                }
              }}
              onMouseLeave={(e) => {
                if (!isPreview) {
                  Object.assign(e.currentTarget.style, socialButtonStyles);
                  e.currentTarget.style.transform = '';
                }
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
    );
  };

  // If only showing social links
  if (onlyShowSocial) {
    return <SocialLinks />;
  }

  return (
    <div 
      className={cn(
        "w-full mx-auto",
        layout.spacing === 'compact' && 'space-y-3',
        layout.spacing === 'normal' && 'space-y-4',
        layout.spacing === 'relaxed' && 'space-y-6'
      )}
      style={{
        fontFamily: theme.fontFamily === 'serif' ? 'serif' :
                   theme.fontFamily === 'mono' ? 'monospace' : 'sans-serif'
      }}
    >
      {/* Avatar y Nombre */}
      <div className="flex items-center gap-4">
        <Avatar 
          className={cn(
            "transition-all duration-300 overflow-hidden",
            isPreview ? "h-16 w-16" : "h-20 w-20"
          )}
          style={getAvatarStyles()}
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
      {profile.description && (
        <p className={cn(
          "transition-all duration-300",
          isPreview && "text-sm"
        )}
        style={{ 
          color: theme.textColor || theme.primaryColor,
          opacity: 0.8,
        }}
        >
          {profile.description}
        </p>
      )}
      
      {/* Social Links */}
      {showSocialLinks && <SocialLinks />}
    </div>
  );
}