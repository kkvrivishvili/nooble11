import React from 'react';
import { IconBrandSpotify, IconExternalLink } from '@tabler/icons-react';
import { PublicWidgetProps } from './types';

interface PublicSpotifyWidgetProps extends PublicWidgetProps {
  data: {
    spotifyUrl: string;
    embedType: 'track' | 'playlist' | 'album' | 'artist';
    height: number;
    theme: 'dark' | 'light';
  };
}

export function PublicSpotifyWidget({ data, theme, className }: PublicSpotifyWidgetProps) {
  // Extract Spotify ID from URL
  const getSpotifyId = (url: string) => {
    const match = url.match(/\/([a-zA-Z0-9]+)(\?|$)/);
    return match ? match[1] : null;
  };

  const spotifyId = getSpotifyId(data.spotifyUrl);

  // Generate thumbnail URL (Spotify doesn't provide direct thumbnail access, so we'll use a placeholder)
  const getThumbnailUrl = () => {
    // In a real implementation, you'd need to use Spotify Web API to get track/album artwork
    return `https://via.placeholder.com/300x300/1DB954/white?text=${data.embedType.toUpperCase()}`;
  };

  const handleSpotifyClick = () => {
    window.open(data.spotifyUrl, '_blank', 'noopener,noreferrer');
  };

  const getTypeLabel = () => {
    const labels = {
      track: 'Canción',
      playlist: 'Playlist', 
      album: 'Álbum',
      artist: 'Artista'
    };
    return labels[data.embedType];
  };

  if (!spotifyId) {
    return (
      <div className={`p-4 text-center ${className}`}>
        <p style={{ color: theme?.primaryColor }}>Enlace de Spotify no válido</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div 
        className="relative rounded-lg overflow-hidden cursor-pointer group"
        onClick={handleSpotifyClick}
        style={{
          borderRadius: theme?.borderRadius === 'sm' ? '6px' : 
                       theme?.borderRadius === 'md' ? '8px' :
                       theme?.borderRadius === 'lg' ? '12px' : '16px'
        }}
      >
        {/* Album/Playlist artwork */}
        <div className="aspect-square bg-gray-100 flex items-center justify-center relative">
          <img
            src={getThumbnailUrl()}
            alt={`${getTypeLabel()} en Spotify`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          {/* Spotify overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
            <div className="bg-green-500 rounded-full p-4 group-hover:scale-110 transition-transform shadow-lg opacity-0 group-hover:opacity-100">
              <IconBrandSpotify size={32} className="text-white" fill="white" />
            </div>
          </div>
          
          {/* Type badge */}
          <div className="absolute top-3 left-3">
            <div className="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
              {getTypeLabel()}
            </div>
          </div>
          
          {/* External link */}
          <div className="absolute top-3 right-3">
            <div className="bg-black bg-opacity-50 p-2 rounded-full">
              <IconExternalLink size={16} className="text-white" />
            </div>
          </div>
        </div>
        
        {/* Call to action */}
        <div className="p-4 bg-green-500 text-white text-center">
          <div className="flex items-center justify-center gap-2">
            <IconBrandSpotify size={20} />
            <span className="font-medium">Escuchar en Spotify</span>
          </div>
        </div>
      </div>
    </div>
  );
}