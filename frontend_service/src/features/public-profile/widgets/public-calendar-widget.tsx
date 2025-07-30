// src/features/public-profile/widgets/public-calendar-widget.tsx
import React from 'react';
import { IconCalendar, IconClock, IconExternalLink } from '@tabler/icons-react';
import { PublicWidgetProps } from './types';

interface PublicCalendarWidgetProps extends PublicWidgetProps {
  data: {
    calendlyUrl: string;
    title: string;
    hideEventDetails: boolean;
    hideCookieBanner: boolean;
  };
}

export function PublicCalendarWidget({ data, theme, className }: PublicCalendarWidgetProps) {
  const handleCalendlyClick = () => {
    window.open(data.calendlyUrl, '_blank', 'noopener,noreferrer');
  };

  // Extract username from Calendly URL for display
  const getCalendlyUsername = () => {
    const match = data.calendlyUrl.match(/calendly\.com\/([^/?]+)/);
    return match ? match[1] : 'usuario';
  };

  const containerStyles = {
    borderRadius: theme?.borderRadius === 'sharp' ? '0.5rem' :
                 theme?.borderRadius === 'curved' ? '0.75rem' : '1rem',
    borderColor: theme?.primaryColor || '#e5e7eb',
    backgroundColor: theme?.buttonFill === 'glass'
      ? 'rgba(255, 255, 255, 0.05)'
      : `${theme?.primaryColor || '#f3f4f6'}05`,
    backdropFilter: theme?.buttonFill === 'glass' ? 'blur(10px)' : 'none',
    WebkitBackdropFilter: theme?.buttonFill === 'glass' ? 'blur(10px)' : 'none',
    fontFamily: theme?.fontFamily === 'serif' ? 'serif' :
               theme?.fontFamily === 'mono' ? 'monospace' : 'sans-serif',
  };

  const buttonStyles = {
    backgroundColor: theme?.buttonFill === 'glass'
      ? 'rgba(255, 255, 255, 0.1)'
      : theme?.buttonFill === 'outline'
      ? 'transparent'
      : theme?.primaryColor || '#3b82f6',
    color: theme?.buttonFill === 'outline'
      ? theme?.primaryColor || '#3b82f6'
      : theme?.buttonTextColor || '#ffffff',
    border: theme?.buttonFill === 'outline'
      ? `2px solid ${theme?.primaryColor || '#3b82f6'}`
      : 'none',
    borderRadius: theme?.borderRadius === 'sharp' ? '0.5rem' :
                 theme?.borderRadius === 'curved' ? '0.75rem' : '9999px',
    boxShadow: theme?.buttonShadow === 'none' ? 'none' :
               theme?.buttonShadow === 'hard' ? '4px 4px 0 rgba(0,0,0,0.2)' :
               '0 2px 4px rgba(0,0,0,0.1)',
    backdropFilter: theme?.buttonFill === 'glass' ? 'blur(10px)' : 'none',
    WebkitBackdropFilter: theme?.buttonFill === 'glass' ? 'blur(10px)' : 'none',
  };

  return (
    <div className={className}>
      <div 
        className="p-6 border-2 border-dashed transition-all hover:border-solid hover:shadow-md"
        style={containerStyles}
      >
        {/* Header */}
        <div className="text-center mb-4">
          <div 
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-3"
            style={{ 
              backgroundColor: `${theme?.primaryColor || '#3b82f6'}20`,
              borderRadius: theme?.borderRadius === 'sharp' ? '0.5rem' :
                           theme?.borderRadius === 'round' ? '9999px' : '1rem',
            }}
          >
            <IconCalendar size={32} style={{ color: theme?.primaryColor || '#3b82f6' }} />
          </div>
          
          <h3 
            className="text-xl font-semibold mb-2"
            style={{ 
              color: theme?.textColor || theme?.primaryColor,
              fontFamily: theme?.fontFamily === 'serif' ? 'serif' :
                         theme?.fontFamily === 'mono' ? 'monospace' : 'sans-serif',
            }}
          >
            {data.title}
          </h3>
          
          <p 
            className="text-sm flex items-center justify-center gap-1"
            style={{ 
              color: theme?.textColor || theme?.primaryColor,
              opacity: 0.7 
            }}
          >
            <IconClock size={14} />
            Calendario de {getCalendlyUsername()}
          </p>
        </div>

        {/* Features list */}
        <div className="space-y-2 mb-6 text-sm">
          <div className="flex items-center gap-2">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: theme?.primaryColor }}
            ></div>
            <span style={{ color: theme?.textColor || theme?.primaryColor, opacity: 0.8 }}>
              Selecciona fecha y hora disponible
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: theme?.primaryColor }}
            ></div>
            <span style={{ color: theme?.textColor || theme?.primaryColor, opacity: 0.8 }}>
              Confirmación automática por email
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: theme?.primaryColor }}
            ></div>
            <span style={{ color: theme?.textColor || theme?.primaryColor, opacity: 0.8 }}>
              Enlace de videollamada incluido
            </span>
          </div>
        </div>

        {/* Call to action button */}
        <button
          onClick={handleCalendlyClick}
          className="w-full py-4 px-6 font-semibold transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
          style={buttonStyles}
          onMouseEnter={(e) => {
            if (theme?.buttonFill === 'outline') {
              e.currentTarget.style.backgroundColor = theme?.primaryColor || '#3b82f6';
              e.currentTarget.style.color = theme?.buttonTextColor || '#ffffff';
            } else if (theme?.buttonFill !== 'glass') {
              e.currentTarget.style.transform = 'scale(1.05)';
            }
          }}
          onMouseLeave={(e) => {
            if (theme?.buttonFill === 'outline') {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = theme?.primaryColor || '#3b82f6';
            }
            e.currentTarget.style.transform = '';
          }}
        >
          <IconCalendar size={20} />
          <span>Agendar Reunión</span>
          <IconExternalLink size={16} />
        </button>

        {/* Powered by Calendly */}
        <div className="text-center mt-3">
          <p 
            className="text-xs"
            style={{ color: theme?.textColor || theme?.primaryColor, opacity: 0.5 }}
          >
            Powered by Calendly
          </p>
        </div>
      </div>
    </div>
  );
}