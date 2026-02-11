import React, { useEffect, useState } from 'react';
import { List, Avatar, Form, Input, Button, message, Divider, Space, Typography, Spin } from 'antd';
import { UserOutlined, DollarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { taskApi } from '../api/task';
import { useAuthStore } from '../store/authStore';
import { Task, UserRole } from '../types';

const { Text } = Typography;

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  username: string;
  avatar_url?: string;
}

interface BonusReward {
  id: string;
  amount: number;
  description: string;
  created_at: string;
  admin_username: string;
  admin_email: string;
}

interface TaskCommentsProps {
  taskId: string;
  task: Task;
  bonusRewards?: BonusReward[];
  loadingBonusRewards?: boolean;
}

export const TaskComments: React.FC<TaskCommentsProps> = ({ 
  taskId, 
  task, 
  bonusRewards = [], 
  loadingBonusRewards = false 
}) => {
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
      {/* 奖赏记录部分 */}
      {(bonusRewards.length > 0 || loadingBonusRewards) && (
        <>
          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
              🎁 奖赏记录
            </Text>
            {loadingBonusRewards ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Spin />
              </div>
            ) : (
              <List
                style={{ marginTop: 12 }}
                dataSource={bonusRewards}
                renderItem={(reward) => (
                  <List.Item style={{ padding: '12px 0' }}>
                    <List.Item.Meta
                      avatar={
                        <Avatar 
                          style={{ backgroundColor: '#52c41a' }} 
                          icon={<DollarOutlined />} 
                        />
                      }
                      title={
                        <Space>
                          <Text strong style={{ color: '#52c41a' }}>
                            +${Number(reward.amount).toFixed(2)}
                          </Text>
                          <Text type="secondary">
                            由 {reward.admin_username || '管理员'} 发放
                          </Text>
                        </Space>
                      }
                      description={
                        <div>
                          <div style={{ marginBottom: 4 }}>{reward.description}</div>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {dayjs(reward.created_at).format('YYYY-MM-DD HH:mm:ss')}
                          </Text>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </div>
          <Divider />
        </>
      )}

      {/* 评论部分 */}
      <div>
        <Text strong style={{ fontSize: '16px' }}>
          💬 评论
        </Text>
        <List
          style={{ marginTop: 12 }}
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
      </div>
      
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
