// src/features/public-profile/widgets/public-spotify-widget.tsx
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
        <p style={{ color: theme?.textColor || theme?.primaryColor }}>
          Enlace de Spotify no válido
        </p>
      </div>
    );
  }

  const containerStyles = {
    borderRadius: theme?.borderRadius === 'sharp' ? '0.5rem' :
                 theme?.borderRadius === 'curved' ? '0.75rem' : '1rem',
    overflow: 'hidden',
    boxShadow: theme?.buttonShadow === 'none' ? 'none' :
               theme?.buttonShadow === 'hard' ? '4px 4px 0 rgba(0,0,0,0.2)' :
               '0 2px 8px rgba(0,0,0,0.15)',
    backgroundColor: theme?.buttonFill === 'glass' 
      ? 'rgba(255, 255, 255, 0.1)'
      : theme?.backgroundColor || '#ffffff',
    backdropFilter: theme?.buttonFill === 'glass' ? 'blur(10px)' : 'none',
    WebkitBackdropFilter: theme?.buttonFill === 'glass' ? 'blur(10px)' : 'none',
  };

  const ctaStyles = {
    backgroundColor: theme?.buttonFill === 'outline' 
      ? 'transparent'
      : '#1DB954',
    color: theme?.buttonFill === 'outline' 
      ? '#1DB954'
      : 'white',
    border: theme?.buttonFill === 'outline' 
      ? '2px solid #1DB954'
      : 'none',
    fontFamily: theme?.fontFamily === 'serif' ? 'serif' :
               theme?.fontFamily === 'mono' ? 'monospace' : 'sans-serif',
  };

  return (
    <div className={className}>
      <div 
        className="relative cursor-pointer group"
        onClick={handleSpotifyClick}
        style={containerStyles}
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
            <div 
              className="rounded-full p-4 group-hover:scale-110 transition-transform shadow-lg opacity-0 group-hover:opacity-100"
              style={{
                backgroundColor: theme?.buttonFill === 'glass'
                  ? 'rgba(255, 255, 255, 0.9)'
                  : '#1DB954',
              }}
            >
              <IconBrandSpotify 
                size={32} 
                className={theme?.buttonFill === 'glass' ? "text-green-500" : "text-white"} 
                fill={theme?.buttonFill === 'glass' ? "#1DB954" : "white"}
              />
            </div>
          </div>
          
          {/* Type badge */}
          <div className="absolute top-3 left-3">
            <div 
              className="px-2 py-1 rounded text-xs font-medium"
              style={{
                backgroundColor: theme?.buttonFill === 'glass'
                  ? 'rgba(29, 185, 84, 0.9)'
                  : '#1DB954',
                color: 'white',
                borderRadius: theme?.borderRadius === 'sharp' ? '0.25rem' :
                             theme?.borderRadius === 'curved' ? '0.5rem' : '9999px',
              }}
            >
              {getTypeLabel()}
            </div>
          </div>
          
          {/* External link */}
          <div className="absolute top-3 right-3">
            <div 
              className="p-2 rounded-full"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
              }}
            >
              <IconExternalLink size={16} className="text-white" />
            </div>
          </div>
        </div>
        
        {/* Call to action */}
        <div 
          className="p-4 text-center transition-all"
          style={ctaStyles}
          onMouseEnter={(e) => {
            if (theme?.buttonFill === 'outline') {
              e.currentTarget.style.backgroundColor = '#1DB954';
              e.currentTarget.style.color = 'white';
            }
          }}
          onMouseLeave={(e) => {
            if (theme?.buttonFill === 'outline') {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#1DB954';
            }
          }}
        >
          <div className="flex items-center justify-center gap-2">
            <IconBrandSpotify size={20} />
            <span className="font-medium">Escuchar en Spotify</span>
          </div>
        </div>
      </div>
    </div>
  );
}