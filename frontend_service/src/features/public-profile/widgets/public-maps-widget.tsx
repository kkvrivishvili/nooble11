import React from 'react';
import { IconMapPin, IconExternalLink } from '@tabler/icons-react';
import { PublicWidgetProps } from './types';

interface PublicMapsWidgetProps extends PublicWidgetProps {
  data: {
    address: string;
    latitude?: number;
    longitude?: number;
    zoomLevel: number;
    mapStyle: string;
  };
}

export function PublicMapsWidget({ data, theme, className }: PublicMapsWidgetProps) {
  // Generate Google Maps URL for click
  const getMapsUrl = () => {
    if (data.latitude && data.longitude) {
      return `https://www.google.com/maps/search/?api=1&query=${data.latitude},${data.longitude}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.address)}`;
  };

  const handleMapClick = () => {
    window.open(getMapsUrl(), '_blank', 'noopener,noreferrer');
  };

  // Generate static map image URL (using a placeholder since Google Static Maps requires API key)
  const getStaticMapUrl = () => {
    // In production, you'd use Google Static Maps API with your API key
    // For now, we'll use a placeholder that shows the concept
    return `https://via.placeholder.com/600x300/f0f0f0/666666?text=Mapa+de+${encodeURIComponent(data.address.substring(0, 20))}`;
  };

  return (
    <div className={className}>
      <div className="space-y-3">
        {/* Static map image */}
        <div 
          className="relative aspect-[2/1] rounded-lg overflow-hidden cursor-pointer group"
          onClick={handleMapClick}
          style={{
            borderRadius: theme?.borderRadius === 'sm' ? '6px' : 
                         theme?.borderRadius === 'md' ? '8px' :
                         theme?.borderRadius === 'lg' ? '12px' : '16px'
          }}
        >
          <img
            src={getStaticMapUrl()}
            alt={`Mapa de ${data.address}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          {/* Overlay with map pin */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-center justify-center">
            <div 
              className="bg-white bg-opacity-90 p-3 rounded-full shadow-lg group-hover:scale-110 transition-transform"
            >
              <IconMapPin size={24} style={{ color: theme?.primaryColor || '#ef4444' }} />
            </div>
          </div>
          
          {/* External link indicator */}
          <div className="absolute top-3 right-3">
            <div className="bg-black bg-opacity-50 p-2 rounded-full">
              <IconExternalLink size={16} className="text-white" />
            </div>
          </div>
        </div>
        
        {/* Address and call-to-action */}
        <div className="text-center space-y-2">
          <p 
            className="font-medium"
            style={{ color: theme?.primaryColor }}
          >
            <IconMapPin size={16} className="inline mr-1" />
            {data.address}
          </p>
          <button
            onClick={handleMapClick}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:scale-105 active:scale-95"
            style={{
              backgroundColor: `${theme?.primaryColor || '#3b82f6'}20`,
              color: theme?.primaryColor || '#3b82f6',
              border: `1px solid ${theme?.primaryColor || '#3b82f6'}`,
            }}
          >
            <IconExternalLink size={16} />
            <span className="font-medium text-sm">Ver en Google Maps</span>
          </button>
        </div>
      </div>
    </div>
  );
}