import React from 'react';
import { AnimationStyle } from '../../styles/themes';
import './animations.css';

interface AnimationEffectsProps {
  style: AnimationStyle;
  enabled: boolean;
  reducedMotion: boolean;
}

export const AnimationEffects: React.FC<AnimationEffectsProps> = ({ 
  style, 
  enabled, 
  reducedMotion 
}) => {
  if (!enabled || reducedMotion || style === 'none') {
    return null;
  }

  const renderEffect = () => {
    switch (style) {
      case 'scanline':
        return (
          <>
            <div className="scanline-vertical" />
            <div className="scanline-horizontal" />
          </>
        );
      
      case 'particles':
        return (
          <div className="floating-particles">
            {Array.from({ length: 20 }, (_, i) => (
              <div
                key={i}
                className="particle"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 15}s`,
                  animationDuration: `${15 + Math.random() * 10}s`,
                }}
              />
            ))}
          </div>
        );
      
      case 'hexagon':
        return (
          <div className="hex-background">
            <div className="hex-layer-1" />
            <div className="hex-layer-2" />
          </div>
        );
      
      case 'datastream':
        return (
          <div className="data-stream">
            {Array.from({ length: 10 }, (_, i) => (
              <div
                key={i}
                className="stream-line"
                style={{
                  left: `${i * 10}%`,
                  animationDelay: `${i * 0.5}s`,
                }}
              />
            ))}
          </div>
        );
      
      case 'hologram':
        return <div className="hologram-overlay" />;
      
      case 'ripple':
        return (
          <div className="energy-effects">
            <div className="energy-ripple" />
            <div className="pulse-grid" />
          </div>
        );
      
      case 'minimal':
        return (
          <div className="grid-background">
            <div className="grid-dots" />
            <div className="grid-lines" />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="animation-container">
      {renderEffect()}
    </div>
  );
};