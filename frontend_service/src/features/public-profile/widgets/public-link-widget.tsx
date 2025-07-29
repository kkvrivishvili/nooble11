import React from 'react';
import { IconExternalLink } from '@tabler/icons-react';
import { PublicWidgetProps, PublicLinkWidgetData } from './types';

interface PublicLinkWidgetProps extends PublicWidgetProps {
  data: PublicLinkWidgetData;
}

export function PublicLinkWidget({ data, theme, className }: PublicLinkWidgetProps) {
  const handleClick = () => {
    window.open(data.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      onClick={handleClick}
      className={`
        w-full p-4 rounded-lg border transition-all duration-200
        hover:shadow-md active:scale-[0.98]
        ${className}
      `}
      style={{
        backgroundColor: theme?.backgroundColor || '#ffffff',
        borderColor: theme?.primaryColor || '#e5e7eb',
        borderRadius: theme?.borderRadius === 'sm' ? '6px' : 
                     theme?.borderRadius === 'md' ? '8px' :
                     theme?.borderRadius === 'lg' ? '12px' : '16px'
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 text-left">
          <h3 
            className="font-medium mb-1"
            style={{ color: theme?.primaryColor || '#111827' }}
          >
            {data.title}
          </h3>
          {data.description && (
            <p className="text-sm opacity-70">
              {data.description}
            </p>
          )}
        </div>
        <div className="ml-3 flex-shrink-0">
          <IconExternalLink 
            size={18} 
            style={{ color: theme?.primaryColor || '#6b7280' }}
          />
        </div>
      </div>
    </button>
  );
}