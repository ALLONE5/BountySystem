import React from 'react';
import { Button, ButtonProps } from 'antd';
import './cyberpunk.css';

interface NeonButtonProps extends ButtonProps {
  neonColor?: 'cyan' | 'magenta' | 'green';
  variant?: 'primary' | 'secondary' | 'ghost';
}

export const NeonButton: React.FC<NeonButtonProps> = ({ 
  children, 
  className = '', 
  neonColor = 'cyan',
  variant = 'primary',
  ...props 
}) => {
  const neonClassName = `neon-button neon-button--${neonColor} neon-button--${variant} ${className}`;
  
  return (
    <Button 
      {...props}
      className={neonClassName}
    >
      <span className="neon-button__text">{children}</span>
    </Button>
  );
};