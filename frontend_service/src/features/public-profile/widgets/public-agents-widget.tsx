// src/features/public-profile/widgets/public-agents-widget.tsx
import React from 'react';
import { IconMessage } from '@tabler/icons-react';
import { PublicWidgetProps, PublicAgentsWidgetData } from './types';

interface PublicAgentsWidgetProps extends PublicWidgetProps {
  data: PublicAgentsWidgetData;
}

export function PublicAgentsWidget({ data, theme, className }: PublicAgentsWidgetProps) {
  const getButtonStyles = (isCard: boolean = false) => {
    const baseRadius = theme?.borderRadius === 'sharp' ? '0.5rem' :
                      theme?.borderRadius === 'curved' ? '0.75rem' : '1rem';
    
    const baseStyles = {
      borderRadius: baseRadius,
      transition: 'all 0.2s ease',
      fontFamily: theme?.fontFamily === 'serif' ? 'serif' :
                 theme?.fontFamily === 'mono' ? 'monospace' : 'sans-serif',
    };

    if (isCard) {
      if (theme?.buttonFill === 'glass') {
        return {
          ...baseStyles,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: `1px solid rgba(255, 255, 255, 0.2)`,
        };
      }
      return {
        ...baseStyles,
        backgroundColor: theme?.backgroundColor || '#ffffff',
        border: `1px solid ${theme?.primaryColor || '#e5e7eb'}`,
      };
    }
    
    return baseStyles;
  };

  const getShadowStyle = () => {
    if (theme?.buttonShadow === 'none') return 'none';
    if (theme?.buttonShadow === 'hard') return '3px 3px 0 rgba(0, 0, 0, 0.2)';
    return '0 2px 4px rgba(0, 0, 0, 0.1)';
  };

  const renderAgentCard = (agent: typeof data.agents[0]) => (
    <button
      key={agent.id}
      onClick={() => data.onAgentClick?.(agent.id)}
      className="w-full p-3 transition-all duration-200 hover:shadow-md active:scale-[0.98]"
      style={{
        ...getButtonStyles(true),
        boxShadow: getShadowStyle(),
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = '';
      }}
    >
      <div className="flex items-center gap-3">
        <div className="text-2xl">{agent.icon}</div>
        <div className="flex-1 text-left">
          <h4 
            className="font-medium text-sm"
            style={{ color: theme?.textColor || theme?.primaryColor || '#111827' }}
          >
            {agent.name}
          </h4>
          {agent.description && (
            <p 
              className="text-xs mt-1"
              style={{ 
                color: theme?.textColor || theme?.primaryColor || '#6b7280',
                opacity: 0.7
              }}
            >
              {agent.description}
            </p>
          )}
        </div>
        <IconMessage 
          size={16} 
          style={{ color: theme?.primaryColor || '#6b7280' }}
        />
      </div>
    </button>
  );

  const renderAgentList = (agent: typeof data.agents[0]) => (
    <button
      key={agent.id}
      onClick={() => data.onAgentClick?.(agent.id)}
      className="w-full flex items-center gap-3 p-2 rounded-lg transition-colors"
      style={{
        backgroundColor: 'transparent',
        fontFamily: theme?.fontFamily === 'serif' ? 'serif' :
                   theme?.fontFamily === 'mono' ? 'monospace' : 'sans-serif',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = `${theme?.primaryColor || '#000'}10`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <div className="text-xl">{agent.icon}</div>
      <span 
        className="flex-1 text-left font-medium text-sm"
        style={{ color: theme?.textColor || theme?.primaryColor || '#111827' }}
      >
        {agent.name}
      </span>
    </button>
  );

  const renderAgentBubble = (agent: typeof data.agents[0]) => {
    const bubbleStyles = {
      backgroundColor: `${theme?.primaryColor || '#f3f4f6'}20`,
      color: theme?.primaryColor || '#374151',
      border: `1px solid ${theme?.primaryColor || '#e5e7eb'}`,
      borderRadius: theme?.borderRadius === 'sharp' ? '0.5rem' :
                   theme?.borderRadius === 'curved' ? '1rem' : '9999px',
      fontFamily: theme?.fontFamily === 'serif' ? 'serif' :
                 theme?.fontFamily === 'mono' ? 'monospace' : 'sans-serif',
    };

    return (
      <button
        key={agent.id}
        onClick={() => data.onAgentClick?.(agent.id)}
        className="inline-flex items-center gap-2 px-3 py-2 transition-all hover:scale-105"
        style={bubbleStyles}
      >
        <span className="text-lg">{agent.icon}</span>
        <span className="font-medium text-sm">{agent.name}</span>
      </button>
    );
  };

  return (
    <div className={className}>
      <h3 
        className="font-semibold mb-3 text-lg"
        style={{ 
          color: theme?.textColor || theme?.primaryColor || '#111827',
          fontFamily: theme?.fontFamily === 'serif' ? 'serif' :
                     theme?.fontFamily === 'mono' ? 'monospace' : 'sans-serif',
        }}
      >
        {data.title}
      </h3>
      
      {data.displayStyle === 'card' && (
        <div className="space-y-2">
          {data.agents.map(renderAgentCard)}
        </div>
      )}
      
      {data.displayStyle === 'list' && (
        <div className="space-y-1">
          {data.agents.map(renderAgentList)}
        </div>
      )}
      
      {data.displayStyle === 'bubble' && (
        <div className="flex flex-wrap gap-2">
          {data.agents.map(renderAgentBubble)}
        </div>
      )}
    </div>
  );
}