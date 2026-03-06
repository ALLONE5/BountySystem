/**
 * 任务进度编辑组件
 * 显示和编辑任务进度
 */

import React from 'react';
import { Divider } from 'antd';
import { InfoRow } from '../common/InfoRow';
import { ProgressEditor } from '../common/ProgressEditor';

interface TaskProgressSectionProps {
  progressValue: number;
  onProgressChange: (value: number) => void;
  onProgressSave: () => void;
  loading: boolean;
}

export const TaskProgressSection: React.FC<TaskProgressSectionProps> = ({
  progressValue,
  onProgressChange,
  onProgressSave,
  loading
}) => {
  return (
    <>
      <Divider style={{ margin: '16px 0' }} />
      <InfoRow label="进度">
        <ProgressEditor
          value={progressValue}
          onChange={onProgressChange}
          onSave={onProgressSave}
          loading={loading}
        />
      </InfoRow>
    </>
  );
};