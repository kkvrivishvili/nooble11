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
  theme: any;
  className: string;
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
        <p style={{ color: theme?.primaryColor }}>Video no válido</p>
      </div>
    );
  }

  const handlePlay = () => {
    setIsPlaying(true);
  };

  return (
    <div className={className}>
      {data.title && (
        <h3 
          className="font-medium mb-3 text-lg"
          style={{ color: theme?.primaryColor }}
        >
          {data.title}
        </h3>
      )}
      
      <div className="relative w-full rounded-lg overflow-hidden" style={{ paddingBottom: '56.25%' }}>
        {/* Thumbnail with play button overlay */}
        {!isPlaying ? (
          <div className="absolute inset-0 cursor-pointer group" onClick={handlePlay}>
            <img
              src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
              alt={data.title || 'Video thumbnail'}
              className="w-full h-full object-cover"
            />
            {/* Play button overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center group-hover:bg-opacity-40 transition-all">
              <div 
                className="bg-red-600 rounded-full p-4 group-hover:scale-110 transition-transform shadow-lg"
              >
                <IconPlayerPlay size={32} className="text-white ml-1" fill="white" />
              </div>
            </div>
            {/* YouTube logo */}
            <div className="absolute top-3 right-3">
              <IconBrandYoutube size={24} className="text-white drop-shadow-lg" />
            </div>
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