import React, { useEffect, useState } from 'react';
import { List, Button, Modal, Input, Form } from 'antd';
import { UploadOutlined, FileOutlined } from '@ant-design/icons';
import { taskApi } from '../api/task';
import { useAuthStore } from '../store/authStore';
import { Task } from '../types';
import { message } from '../utils/message';

interface Attachment {
  id: string;
  file_name: string;
  file_url: string;
  created_at: string;
  username: string;
}

interface TaskAttachmentsProps {
  taskId: string;
  task: Task;
}

export const TaskAttachments: React.FC<TaskAttachmentsProps> = ({ taskId, task }) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuthStore();
  const [form] = Form.useForm();

  const fetchAttachments = async () => {
    setLoading(true);
    try {
      const data = await taskApi.getAttachments(taskId);
      setAttachments(data);
    } catch (error) {
      message.error('Failed to load attachments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttachments();
  }, [taskId]);

  const handleAddAttachment = async (values: { fileName: string; fileUrl: string }) => {
    setSubmitting(true);
    try {
      await taskApi.addAttachment(taskId, values);
      message.success('Attachment added');
      setIsModalVisible(false);
      form.resetFields();
      fetchAttachments();
    } catch (error) {
      message.error('Failed to add attachment');
    } finally {
      setSubmitting(false);
    }
  };

  const canAddAttachment = user && (
    task.publisherId === user.id ||
    task.assigneeId === user.id
  );

  return (
    <div style={{ marginTop: 16 }}>
      {canAddAttachment && (
        <Button icon={<UploadOutlined />} onClick={() => setIsModalVisible(true)} style={{ marginBottom: 16 }}>
          Add Attachment
        </Button>
      )}
      
      <List
        loading={loading}
        dataSource={attachments}
        renderItem={(item) => (
          <List.Item
            actions={[
              <a href={item.file_url} target="_blank" rel="noopener noreferrer" key="download">Download</a>
            ]}
          >
            <List.Item.Meta
              avatar={<FileOutlined style={{ fontSize: 24 }} />}
              title={<a href={item.file_url} target="_blank" rel="noopener noreferrer">{item.file_name}</a>}
              description={`Uploaded by ${item.username}`}
            />
          </List.Item>
        )}
      />

      <Modal
        title="Add Attachment"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleAddAttachment} layout="vertical">
          <Form.Item name="fileName" label="File Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="fileUrl" label="File URL" rules={[{ required: true, type: 'url' }]}>
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting} block>
              Add
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
