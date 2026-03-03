import React from 'react';
import { Typography } from 'antd';
import './cyberpunk.css';

interface HolographicTextProps {
  children: React.ReactNode;
  level?: 1 | 2 | 3 | 4 | 5;
  className?: string;
  style?: React.CSSProperties;
  glitch?: boolean;
}

export const HolographicText: React.FC<HolographicTextProps> = ({ 
  children, 
  level = 1,
  className = '', 
  style = {},
  glitch = false
}) => {
  const Component = level === 1 ? Typography.Title : Typography.Text;
  const holographicClassName = `holographic-text ${glitch ? 'holographic-text--glitch' : ''} ${className}`;
  
  const titleProps = level === 1 ? { level } : {};

  return (
    <Component 
      {...titleProps}
      className={holographicClassName}
      style={{
        background: 'linear-gradient(45deg, #00f2ff, #ff00e5, #39ff14)',
        backgroundSize: '200% 200%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        fontFamily: '"Orbitron", "JetBrains Mono", monospace',
        fontWeight: 'bold',
        textShadow: '0 0 10px rgba(0, 242, 255, 0.5)',
        ...style
      }}
    >
      {children}
    </Component>
  );
};