// src/features/public-profile/components/SocialLinks.tsx - Consolidated social links component
import { cn } from '@/lib/utils'
import { SocialLink } from '@/types/profile'
import { useProfileTheme } from '@/context/profile-theme-context'
import { getButtonStyles } from '@/features/public-profile/utils/theme-styles'
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
import { ComponentType } from 'react'

const socialIcons: Record<string, ComponentType<{ size: number; strokeWidth: number; className?: string }>> = {
  instagram: IconBrandInstagram,
  tiktok: IconBrandTiktok,
  youtube: IconBrandYoutube,
  twitter: IconBrandX,
  linkedin: IconBrandLinkedin,
  facebook: IconBrandFacebook,
  spotify: IconBrandSpotify,
}

interface SocialLinksProps {
  socialLinks: SocialLink[]
  isPreview?: boolean
  position?: 'top' | 'bottom'
  className?: string
  iconSize?: number
}

export default function SocialLinks({ 
  socialLinks, 
  isPreview = false, 
  position = 'top',
  className = '',
  iconSize = 20
}: SocialLinksProps) {
  const { theme, layout } = useProfileTheme()
  
  // Get social button styles using theme utility
  const socialButtonStyles = getButtonStyles(theme, 'secondary')
  
  if (!socialLinks?.length) return null

  return (
    <div className={cn(
      "flex gap-3 transition-all duration-300",
      position === 'bottom' && layout.socialPosition === 'bottom' && 'justify-center',
      className
    )}>
      {socialLinks.map((link) => {
        const Icon = socialIcons[link.platform] || IconLink
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
                e.currentTarget.style.backgroundColor = theme.primaryColor
                e.currentTarget.style.color = theme.buttonTextColor || '#ffffff'
              } else if (theme.buttonFill === 'glass') {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'
              } else {
                e.currentTarget.style.transform = 'scale(1.1)'
              }
            }}
            onMouseLeave={(e) => {
              Object.assign(e.currentTarget.style, socialButtonStyles)
              e.currentTarget.style.transform = ''
            }}
          >
            <Icon 
              size={isPreview ? Math.max(16, iconSize - 2) : iconSize} 
              strokeWidth={1.5} 
            />
          </a>
        )
      })}
    </div>
  )
}
