import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Profile } from '@/types/profile'
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
  return (
    <div className="w-full max-w-xl mx-auto px-4 pt-8 pb-4">
      {/* Avatar y Nombre en la misma línea */}
      <div className="flex items-center gap-4 mb-4">
        <Avatar className={cn(
          "border-2 border-gray-200",
          isPreview ? "h-16 w-16" : "h-20 w-20"
        )}>
          <AvatarImage src={profile.avatar} />
          <AvatarFallback className="bg-gray-100 text-gray-700">
            {profile.displayName
              ? profile.displayName.split(' ').map((n: string) => n[0]).join('')
              : 'NN'}
          </AvatarFallback>
        </Avatar>
        
        <h1 className={cn(
          "font-semibold text-gray-900",
          isPreview ? "text-xl" : "text-2xl"
        )}>
          {profile.displayName}
        </h1>
      </div>
      
      {/* Descripción */}
      <p className={cn(
        "text-gray-600 mb-6",
        isPreview && "text-sm"
      )}>
        {profile.description}
      </p>
      
      {/* Social Links (solo en vista Links) */}
      {showSocialLinks && (
        <div className="flex gap-3">
          {profile.socialLinks.map((link) => {
            const Icon = socialIcons[link.platform] || IconLink
            return (
              <a
                key={link.platform}
                href={isPreview ? undefined : link.url}
                target={isPreview ? undefined : "_blank"}
                rel={isPreview ? undefined : "noopener noreferrer"}
                className={cn(
                  "p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors",
                  isPreview && "cursor-default"
                )}
                onClick={isPreview ? (e) => e.preventDefault() : undefined}
              >
                <Icon 
                  size={isPreview ? 18 : 20} 
                  strokeWidth={1.5} 
                  className="text-gray-700" 
                />
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}