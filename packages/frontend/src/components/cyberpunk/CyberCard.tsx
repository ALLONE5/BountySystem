import React from 'react';
import { Card, CardProps } from 'antd';
import './cyberpunk.css';

interface CyberCardProps extends CardProps {
  glowColor?: 'cyan' | 'magenta' | 'green';
  intensity?: 'low' | 'medium' | 'high';
}

export const CyberCard: React.FC<CyberCardProps> = ({ 
  children, 
  className = '', 
  glowColor = 'cyan',
  intensity = 'medium',
  ...props 
}) => {
  const cyberClassName = `cyber-card cyber-card--${glowColor} cyber-card--${intensity} ${className}`;
  
  return (
    <Card 
      {...props}
      className={cyberClassName}
      style={{
        background: 'rgba(26, 13, 26, 0.85)',
        border: '1px solid rgba(0, 242, 255, 0.6)',
        borderRadius: '0.25rem',
        backdropFilter: 'blur(10px)',
        ...props.style
      }}
    >
      <div className="cyber-card__content">
        {children}
      </div>
    </Card>
  );
};