import React from 'react';
import { IconMessage } from '@tabler/icons-react';
import { PublicWidgetProps, PublicAgentsWidgetData } from './types';

interface PublicAgentsWidgetProps extends PublicWidgetProps {
  data: PublicAgentsWidgetData;
}

export function PublicAgentsWidget({ data, theme, className }: PublicAgentsWidgetProps) {
  const renderAgentCard = (agent: typeof data.agents[0]) => (
    <button
      key={agent.id}
      onClick={() => data.onAgentClick?.(agent.id)}
      className="w-full p-3 rounded-lg border transition-all duration-200 hover:shadow-md active:scale-[0.98]"
      style={{
        backgroundColor: theme?.backgroundColor || '#ffffff',
        borderColor: theme?.primaryColor || '#e5e7eb',
      }}
    >
      <div className="flex items-center gap-3">
        <div className="text-2xl">{agent.icon}</div>
        <div className="flex-1 text-left">
          <h4 
            className="font-medium text-sm"
            style={{ color: theme?.primaryColor || '#111827' }}
          >
            {agent.name}
          </h4>
          {agent.description && (
            <p className="text-xs opacity-70 mt-1">
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
      className="w-full flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-gray-50"
      style={{
        backgroundColor: 'transparent',
      }}
    >
      <div className="text-xl">{agent.icon}</div>
      <span 
        className="flex-1 text-left font-medium text-sm"
        style={{ color: theme?.primaryColor || '#111827' }}
      >
        {agent.name}
      </span>
    </button>
  );

  const renderAgentBubble = (agent: typeof data.agents[0]) => (
    <button
      key={agent.id}
      onClick={() => data.onAgentClick?.(agent.id)}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-full transition-all"
      style={{
        backgroundColor: `${theme?.primaryColor || '#f3f4f6'}20`,
        color: theme?.primaryColor || '#374151',
        border: `1px solid ${theme?.primaryColor || '#e5e7eb'}`,
      }}
    >
      <span className="text-lg">{agent.icon}</span>
      <span className="font-medium text-sm">{agent.name}</span>
    </button>
  );

  return (
    <div className={className}>
      <h3 
        className="font-semibold mb-3 text-lg"
        style={{ color: theme?.primaryColor || '#111827' }}
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