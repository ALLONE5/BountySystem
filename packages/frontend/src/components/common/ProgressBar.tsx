/**
 * 进度条组件
 */
import React from 'react';
import { Progress } from 'antd';
import { colors } from '../../styles/design-tokens';

interface ProgressBarProps {
  percent: number;
  showInfo?: boolean;
  status?: 'normal' | 'success' | 'exception';
  size?: 'small' | 'default';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  percent, 
  showInfo = true,
  status = 'normal',
  size = 'default',
}) => {
  const getStrokeColor = () => {
    if (status === 'success') return colors.success;
    if (status === 'exception') return colors.error;
    if (percent >= 80) return colors.success;
    if (percent >= 50) return colors.warning;
    return colors.primary;
  };

  return (
    <Progress 
      percent={percent}
      showInfo={showInfo}
      strokeColor={getStrokeColor()}
      status={status === 'normal' ? undefined : status}
      size={size === 'small' ? 'small' : 'default'}
    />
  );
};
