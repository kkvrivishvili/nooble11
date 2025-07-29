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

  return (
    <div className={className}>
      <div 
        className="p-6 rounded-lg border-2 border-dashed transition-all hover:border-solid hover:shadow-md"
        style={{
          borderColor: theme?.primaryColor || '#e5e7eb',
          backgroundColor: `${theme?.primaryColor || '#f3f4f6'}05`,
        }}
      >
        {/* Header */}
        <div className="text-center mb-4">
          <div 
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-3"
            style={{ backgroundColor: `${theme?.primaryColor || '#3b82f6'}20` }}
          >
            <IconCalendar size={32} style={{ color: theme?.primaryColor || '#3b82f6' }} />
          </div>
          
          <h3 
            className="text-xl font-semibold mb-2"
            style={{ color: theme?.primaryColor }}
          >
            {data.title}
          </h3>
          
          <p className="text-sm opacity-70 flex items-center justify-center gap-1">
            <IconClock size={14} />
            Calendario de {getCalendlyUsername()}
          </p>
        </div>

        {/* Features list */}
        <div className="space-y-2 mb-6 text-sm opacity-80">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme?.primaryColor }}></div>
            <span>Selecciona fecha y hora disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme?.primaryColor }}></div>
            <span>Confirmación automática por email</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme?.primaryColor }}></div>
            <span>Enlace de videollamada incluido</span>
          </div>
        </div>

        {/* Call to action button */}
        <button
          onClick={handleCalendlyClick}
          className="w-full py-4 px-6 rounded-lg font-semibold transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
          style={{
            backgroundColor: theme?.primaryColor || '#3b82f6',
            color: theme?.backgroundColor || '#ffffff',
          }}
        >
          <IconCalendar size={20} />
          <span>Agendar Reunión</span>
          <IconExternalLink size={16} />
        </button>

        {/* Powered by Calendly */}
        <div className="text-center mt-3">
          <p className="text-xs opacity-50">
            Powered by Calendly
          </p>
        </div>
      </div>
    </div>
  );
}