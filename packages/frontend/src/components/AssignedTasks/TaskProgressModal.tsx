/**
 * 任务进度更新模态框组件
 * 用于更新任务进度
 */

import React, { useState, useEffect } from 'react';
import { Modal, Slider } from 'antd';
import { Task } from '../../types';
import { taskApi } from '../../api/task';
import { useErrorHandler } from '../../hooks/useErrorHandler';

interface TaskProgressModalProps {
  visible: boolean;
  task: Task | null;
  onClose: () => void;
  onProgressUpdated: () => void;
}

export const TaskProgressModal: React.FC<TaskProgressModalProps> = ({
  visible,
  task,
  onClose,
  onProgressUpdated
}) => {
  const [progressValue, setProgressValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const { handleAsyncError } = useErrorHandler();

  useEffect(() => {
    if (task && visible) {
      setProgressValue(task.progress || 0);
    }
  }, [task, visible]);

  const handleProgressSubmit = async () => {
    if (!task) return;

    setLoading(true);
    await handleAsyncError(
      async () => {
        await taskApi.updateProgress(task.id, progressValue);
        onClose();
        onProgressUpdated();
      },
      'TaskProgressModal.updateProgress',
      '进度更新成功',
      '更新进度失败'
    ).finally(() => {
      setLoading(false);
    });
  };

  return (
    <Modal
      title="更新任务进度"
      open={visible}
      onOk={handleProgressSubmit}
      onCancel={onClose}
      confirmLoading={loading}
    >
      {task && (
        <div>
          <p><strong>任务：</strong>{task.name}</p>
          <p><strong>当前进度：</strong>{task.progress}%</p>
          <div style={{ marginTop: 20 }}>
            <p>新进度：</p>
            <Slider
              value={progressValue}
              onChange={setProgressValue}
              marks={{
                0: '0%',
                25: '25%',
                50: '50%',
                75: '75%',
                100: '100%',
              }}
            />
            <div style={{ textAlign: 'center', marginTop: 10, fontSize: 24, fontWeight: 'bold' }}>
              {progressValue}%
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};