// src/features/public-profile/widgets/public-youtube-widget.tsx
import React, { useState } from 'react';
import { IconBrandYoutube, IconPlayerPlay } from '@tabler/icons-react';
import { PublicWidgetProps } from './types';

interface PublicYouTubeWidgetProps extends PublicWidgetProps {
  data: {
    videoUrl: string;
    title?: string;
    autoplay: boolean;
    showControls: boolean;
  };
}

export function PublicYouTubeWidget({ data, theme, className }: PublicYouTubeWidgetProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Extract video ID from URL
  const getVideoId = (url: string) => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?]*)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const videoId = getVideoId(data.videoUrl);
  
  if (!videoId) {
    return (
      <div className={`p-4 text-center ${className}`}>
        <p style={{ color: theme?.textColor || theme?.primaryColor }}>Video no válido</p>
      </div>
    );
  }

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const containerStyles = {
    borderRadius: theme?.borderRadius === 'sharp' ? '0.5rem' :
                 theme?.borderRadius === 'curved' ? '0.75rem' : '1rem',
    overflow: 'hidden',
    boxShadow: theme?.buttonShadow === 'none' ? 'none' :
               theme?.buttonShadow === 'hard' ? '4px 4px 0 rgba(0,0,0,0.2)' :
               '0 2px 8px rgba(0,0,0,0.15)',
  };

  return (
    <div className={className}>
      {data.title && (
        <h3 
          className="font-medium mb-3 text-lg"
          style={{ 
            color: theme?.textColor || theme?.primaryColor,
            fontFamily: theme?.fontFamily === 'serif' ? 'serif' :
                       theme?.fontFamily === 'mono' ? 'monospace' : 'sans-serif',
          }}
        >
          {data.title}
        </h3>
      )}
      
      <div 
        className="relative w-full" 
        style={{ ...containerStyles, paddingBottom: '56.25%' }}
      >
        {/* Thumbnail with play button overlay */}
        {!isPlaying ? (
          <div className="absolute inset-0 cursor-pointer group" onClick={handlePlay}>
            <img
              src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
              alt={data.title || 'Video thumbnail'}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to lower quality if maxresdefault doesn't exist
                e.currentTarget.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
              }}
            />
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-30 group-hover:bg-opacity-40 transition-all">
              {/* Center play button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div 
                  className="rounded-full p-4 group-hover:scale-110 transition-transform shadow-lg"
                  style={{
                    backgroundColor: theme?.buttonFill === 'glass' 
                      ? 'rgba(255, 255, 255, 0.9)' 
                      : '#ff0000',
                  }}
                >
                  <IconPlayerPlay 
                    size={32} 
                    className="ml-1" 
                    style={{ 
                      color: theme?.buttonFill === 'glass' ? '#ff0000' : 'white',
                      fill: theme?.buttonFill === 'glass' ? '#ff0000' : 'white'
                    }}
                  />
                </div>
              </div>
            </div>
            {/* YouTube logo */}
            <div className="absolute top-3 right-3">
              <IconBrandYoutube size={24} className="text-white drop-shadow-lg" />
            </div>
            {/* Title overlay if exists */}
            {data.title && (
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                <p className="text-white font-medium">{data.title}</p>
              </div>
            )}
          </div>
        ) : (
          /* YouTube embed when playing */
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&controls=${data.showControls ? '1' : '0'}`}
            title={data.title || 'YouTube video'}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>
    </div>
  );
}