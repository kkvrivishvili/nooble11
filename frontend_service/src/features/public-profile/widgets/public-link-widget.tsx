// src/features/public-profile/widgets/public-link-widget.tsx - Enhanced version
import React from 'react';
import { IconExternalLink } from '@tabler/icons-react';
import { PublicWidgetProps, PublicLinkWidgetData } from './types';
import { cn } from '@/lib/utils';

interface PublicLinkWidgetProps extends PublicWidgetProps {
  data: PublicLinkWidgetData;
}

export function PublicLinkWidget({ data, theme, className }: PublicLinkWidgetProps) {
  const handleClick = () => {
    window.open(data.url, '_blank', 'noopener,noreferrer');
  };

  // Get button class based on theme settings
  const getButtonStyles = () => {
    const baseStyles = {
      borderRadius: theme?.borderRadius === 'sharp' ? '0.25rem' :
                   theme?.borderRadius === 'curved' ? '0.5rem' : '9999px',
      transition: 'all 0.2s ease',
      cursor: 'pointer',
    };

    // Button fill styles
    if (theme?.buttonFill === 'glass') {
      return {
        ...baseStyles,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: `1px solid rgba(255, 255, 255, 0.2)`,
        color: theme.primaryColor,
      };
    } else if (theme?.buttonFill === 'outline') {
      return {
        ...baseStyles,
        backgroundColor: 'transparent',
        border: `2px solid ${theme?.primaryColor || '#000000'}`,
        color: theme?.primaryColor || '#000000',
      };
    } else {
      // Solid fill (default)
      return {
        ...baseStyles,
        backgroundColor: theme?.primaryColor || '#000000',
        color: theme?.buttonTextColor || '#ffffff',
        border: 'none',
      };
    }
  };

  // Get shadow based on theme
  const getShadowStyle = () => {
    if (theme?.buttonShadow === 'none') return 'none';
    if (theme?.buttonShadow === 'hard') return '4px 4px 0 rgba(0, 0, 0, 0.2)';
    return '0 2px 4px rgba(0, 0, 0, 0.1)'; // subtle (default)
  };

  const buttonStyles = {
    ...getButtonStyles(),
    boxShadow: getShadowStyle(),
  };

  // Hover styles
  const hoverStyles = theme?.buttonFill === 'outline' ? {
    backgroundColor: theme?.primaryColor,
    color: theme?.buttonTextColor || '#ffffff',
  } : theme?.buttonFill === 'glass' ? {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  } : {
    transform: 'translateY(-2px)',
    boxShadow: theme?.buttonShadow === 'hard' ? '6px 6px 0 rgba(0, 0, 0, 0.2)' : '0 4px 8px rgba(0, 0, 0, 0.15)',
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-full p-4 flex items-center justify-between group",
        className
      )}
      style={buttonStyles}
      onMouseEnter={(e) => {
        Object.assign(e.currentTarget.style, hoverStyles);
      }}
      onMouseLeave={(e) => {
        Object.assign(e.currentTarget.style, buttonStyles);
      }}
    >
      <div className="flex-1 text-left">
        <h3 
          className="font-medium mb-1"
          style={{ 
            color: theme?.buttonFill === 'outline' ? theme?.primaryColor : 'inherit',
            fontFamily: theme?.fontFamily === 'serif' ? 'serif' :
                       theme?.fontFamily === 'mono' ? 'monospace' : 'sans-serif'
          }}
        >
          {data.title}
        </h3>
        {data.description && (
          <p 
            className="text-sm opacity-70"
            style={{
              fontFamily: theme?.fontFamily === 'serif' ? 'serif' :
                         theme?.fontFamily === 'mono' ? 'monospace' : 'sans-serif'
            }}
          >
            {data.description}
          </p>
        )}
      </div>
      <div className="ml-3 flex-shrink-0 transition-transform group-hover:translate-x-1">
        <IconExternalLink 
          size={18} 
          style={{ 
            color: theme?.buttonFill === 'outline' ? theme?.primaryColor : 'inherit'
          }}
        />
      </div>
    </button>
  );
}