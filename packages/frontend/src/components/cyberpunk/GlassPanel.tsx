import React from 'react';
import './cyberpunk.css';

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  blur?: 'light' | 'medium' | 'heavy';
  opacity?: number;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({ 
  children, 
  className = '', 
  style = {},
  blur = 'medium',
  opacity = 0.85
}) => {
  const blurValues = {
    light: '5px',
    medium: '10px',
    heavy: '15px'
  };

  return (
    <div 
      className={`glass-panel glass-panel--${blur} ${className}`}
      style={{
        background: `rgba(26, 13, 26, ${opacity})`,
        backdropFilter: `blur(${blurValues[blur]})`,
        border: '1px solid rgba(0, 242, 255, 0.3)',
        borderRadius: '0.25rem',
        ...style
      }}
    >
      <div className="glass-panel__content">
        {children}
      </div>
    </div>
  );
};