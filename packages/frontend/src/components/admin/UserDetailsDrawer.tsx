import React, { useEffect, useState } from 'react';
import { Drawer, Descriptions, Space, Tag, Button, Modal, Table, Typography, Divider } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { User, UserRole, Task, TaskStatus } from '../../types';
import { adminApi } from '../../api/admin';
import { StatusTag } from '../common/StatusTag';
import { formatBounty } from '../../utils/formatters';

interface UserDetailsDrawerProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  currentUser?: User | null;
  onEdit?: (user: User) => void;
  onDelete?: (userId: string) => void;
}

export const UserDetailsDrawer: React.FC<UserDetailsDrawerProps> = ({
  open,
  onClose,
  user,
  currentUser,
  onEdit,
  onDelete,
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchUserTasks(user.id);
    } else {
      setTasks([]);
    }
  }, [open, user]);

  const fetchUserTasks = async (userId: string) => {
    setLoadingTasks(true);
    try {
      const data = await adminApi.getUserTasks(userId);
      setTasks(data.tasks);
    } catch (error) {
      console.error('Failed to fetch user tasks:', error);
    } finally {
      setLoadingTasks(false);
    }
  };

  const totalBounty = tasks
    .filter(t => t.status === TaskStatus.COMPLETED)
    .reduce((sum, t) => sum + (Number(t.bountyAmount) || 0), 0);

  const taskColumns = [
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: TaskStatus) => <StatusTag value={status} />,
    },
    {
      title: '赏金',
      dataIndex: 'bountyAmount',
      key: 'bountyAmount',
      width: 100,
      render: (amount: number) => formatBounty(amount),
    },
  ];

  return (
    <Drawer
      title="用户详情"
      placement="right"
      width={600}
      onClose={onClose}
      open={open}
    >
      {user && (
        <div>
          <Descriptions column={1} bordered>
            <Descriptions.Item label="用户名">{user.username}</Descriptions.Item>
            <Descriptions.Item label="邮箱">{user.email}</Descriptions.Item>
            <Descriptions.Item label="角色"><StatusTag value={user.role} /></Descriptions.Item>
            <Descriptions.Item label="用户ID">
              <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{user.id}</span>
            </Descriptions.Item>
            <Descriptions.Item label="岗位">
              {user.positions && user.positions.length > 0 ? (
                <Space direction="vertical" size="small">
                  {user.positions.map((position) => (
                    <Tag key={position.id} color="blue">{position.name}</Tag>
                  ))}
                </Space>
              ) : (
                <span style={{ color: '#999' }}>无岗位</span>
              )}
            </Descriptions.Item>
            {user.role === UserRole.POSITION_ADMIN && (
              <Descriptions.Item label="管理岗位">
                {user.managedPositions && user.managedPositions.length > 0 ? (
                  <Space direction="vertical" size="small">
                    {user.managedPositions.map((position) => (
                      <Tag key={position.id} color="purple">{position.name}</Tag>
                    ))}
                  </Space>
                ) : (
                  <span style={{ color: '#999' }}>无管理岗位</span>
                )}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="注册时间">
              {dayjs(user.createdAt).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label="最后登录">
              {dayjs(user.lastLogin).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label="累计收益">
              <Typography.Text type="success" strong>
                {formatBounty(totalBounty)}
              </Typography.Text>
            </Descriptions.Item>
          </Descriptions>

          <Divider>承接任务</Divider>
          <Table
            dataSource={tasks}
            columns={taskColumns}
            rowKey="id"
            size="small"
            pagination={false}
            loading={loadingTasks}
            scroll={{ y: 300 }}
          />

          {(onEdit || onDelete) && (
            <div style={{ marginTop: 24, display: 'flex', gap: 8 }}>
              {onEdit && (
                <Button type="primary" icon={<EditOutlined />} onClick={() => {
                  onClose();
                  onEdit(user);
                }}>
                  编辑用户
                </Button>
              )}
              {onDelete && currentUser?.role === UserRole.SUPER_ADMIN && (
                <Button danger icon={<DeleteOutlined />} onClick={() => {
                  Modal.confirm({
                    title: '确定要删除此用户吗？',
                    content: '此操作不可撤销',
                    onOk: () => onDelete(user.id),
                  });
                }}>
                  删除用户
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
};
