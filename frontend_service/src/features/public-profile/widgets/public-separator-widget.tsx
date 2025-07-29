import React from 'react';
import { PublicWidgetProps } from './types';

interface PublicSeparatorWidgetProps extends PublicWidgetProps {
  data: {
    style: 'solid' | 'dashed' | 'dotted';
    thickness: number;
    color: string;
    marginTop: number;
    marginBottom: number;
  };
}

export function PublicSeparatorWidget({ data, className }: PublicSeparatorWidgetProps) {
  return (
    <div 
      className={className}
      style={{
        marginTop: `${data.marginTop}px`,
        marginBottom: `${data.marginBottom}px`,
      }}
    >
      <hr
        style={{
          border: 'none',
          borderTop: `${data.thickness}px ${data.style} ${data.color}`,
          margin: 0,
        }}
      />
    </div>
  );
}