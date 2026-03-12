/**
 * 任务进度更新模态框组件
 * 用于更新任务进度
 */

import React, { useState, useEffect } from 'react';
import { Form, Slider, Typography } from 'antd';
import { Task } from '../../types';
import { taskApi } from '../../api/task';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { BaseFormModal } from '../common/BaseFormModal';

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
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { handleAsyncError } = useErrorHandler();

  useEffect(() => {
    if (task && visible) {
      form.setFieldsValue({
        progress: task.progress || 0
      });
    }
  }, [task, visible, form]);

  const handleSubmit = async (values: { progress: number }) => {
    if (!task) return;

    setLoading(true);
    try {
      await handleAsyncError(
        async () => {
          await taskApi.updateProgress(task.id, values.progress);
          onClose();
          onProgressUpdated();
        },
        'TaskProgressModal.updateProgress',
        '进度更新成功',
        '更新进度失败'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseFormModal
      visible={visible}
      title="更新任务进度"
      form={form}
      onSubmit={handleSubmit}
      onCancel={onClose}
      okText="更新进度"
      cancelText="取消"
      loading={loading}
    >
      {task && (
        <>
          <div style={{ marginBottom: 16 }}>
            <Typography.Text><strong>任务：</strong>{task.name}</Typography.Text>
          </div>
          <div style={{ marginBottom: 16 }}>
            <Typography.Text><strong>当前进度：</strong>{task.progress}%</Typography.Text>
          </div>
          
          <Form.Item
            name="progress"
            label="新进度"
            rules={[
              { required: true, message: '请设置进度' },
              { type: 'number', min: 0, max: 100, message: '进度必须在0-100之间' }
            ]}
          >
            <Slider
              marks={{
                0: '0%',
                25: '25%',
                50: '50%',
                75: '75%',
                100: '100%',
              }}
            />
          </Form.Item>
          
          <Form.Item shouldUpdate>
            {({ getFieldValue }) => {
              const progress = getFieldValue('progress') || 0;
              return (
                <div style={{ textAlign: 'center', fontSize: 24, fontWeight: 'bold' }}>
                  {progress}%
                </div>
              );
            }}
          </Form.Item>
        </>
      )}
    </BaseFormModal>
  );
};