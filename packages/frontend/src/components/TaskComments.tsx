import React, { useEffect, useState } from 'react';
import { List, Avatar, Form, Input, Button, message } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { taskApi } from '../api/task';
import { useAuthStore } from '../store/authStore';
import { Task, UserRole } from '../types';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  username: string;
  avatar_url?: string;
}

interface TaskCommentsProps {
  taskId: string;
  task: Task;
}

export const TaskComments: React.FC<TaskCommentsProps> = ({ taskId, task }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuthStore();
  const [form] = Form.useForm();

  const fetchComments = async () => {
    setLoading(true);
    try {
      const data = await taskApi.getComments(taskId);
      setComments(data);
    } catch (error) {
      message.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [taskId]);

  const handleSubmit = async (values: { content: string }) => {
    if (!user) return;
    setSubmitting(true);
    try {
      await taskApi.addComment(taskId, values.content);
      form.resetFields();
      message.success('Comment added');
      fetchComments();
    } catch (error) {
      message.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const canComment = user && (
    user.role === UserRole.SUPER_ADMIN ||
    task.publisherId === user.id ||
    task.assigneeId === user.id
  );

  return (
    <div style={{ marginTop: 16 }}>
      <List
        loading={loading}
        dataSource={comments}
        renderItem={(item) => (
          <List.Item>
            <List.Item.Meta
              avatar={<Avatar src={item.avatar_url} icon={<UserOutlined />} />}
              title={
                <span>
                  {item.username} <span style={{ color: '#ccc', fontSize: '12px', marginLeft: 8 }}>{dayjs(item.created_at).format('YYYY-MM-DD HH:mm')}</span>
                </span>
              }
              description={item.content}
            />
          </List.Item>
        )}
      />
      
      {canComment && (
        <div style={{ marginTop: 24 }}>
          <Form form={form} onFinish={handleSubmit}>
            <Form.Item name="content" rules={[{ required: true, message: 'Please input your comment!' }]}>
              <Input.TextArea rows={4} placeholder="Add a comment..." />
            </Form.Item>
            <Form.Item>
              <Button htmlType="submit" loading={submitting} type="primary">
                Add Comment
              </Button>
            </Form.Item>
          </Form>
        </div>
      )}
    </div>
  );
};
