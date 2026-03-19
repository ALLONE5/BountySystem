import React, { useEffect, useState } from 'react';
import {
  Table, Button, Space, Form, Input, Select, Modal, Tag, Popconfirm, Typography,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, KeyOutlined, ReloadOutlined, UserOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { devUserApi, DevCreateUserRequest, DevUpdateUserRequest } from '../../api/devUser';
import { User, UserRole } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { message } from '../../utils/message';
import { PageHeaderBar } from '../../components/common/PageHeaderBar';
import { TableCard } from '../../components/common/TableCard';

const { Option } = Select;
const { Text } = Typography;

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'red',
  position_admin: 'orange',
  developer: 'purple',
  user: 'blue',
};

const ROLE_LABELS: Record<string, string> = {
  super_admin: '超级管理员',
  position_admin: '岗位管理员',
  developer: '开发者',
  user: '普通用户',
};

export const DevUserManagementPage: React.FC = () => {
  const currentUser = useAuthStore((s) => s.user);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Edit modal
  const [editVisible, setEditVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [editForm] = Form.useForm();

  // Create modal
  const [createVisible, setCreateVisible] = useState(false);
  const [createForm] = Form.useForm();

  // Reset password modal
  const [resetVisible, setResetVisible] = useState(false);
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [resetForm] = Form.useForm();

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await devUserApi.getUsers();
      setUsers(data.users);
    } catch {
      message.error('加载用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      !searchText ||
      u.username.toLowerCase().includes(searchText.toLowerCase()) ||
      u.email.toLowerCase().includes(searchText.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  // ── Create ──────────────────────────────────────────────────────────────────
  const openCreate = () => {
    createForm.resetFields();
    setCreateVisible(true);
  };

  const handleCreate = async () => {
    const values: DevCreateUserRequest = await createForm.validateFields();
    setSubmitting(true);
    try {
      await devUserApi.createUser(values);
      message.success('用户创建成功');
      setCreateVisible(false);
      loadUsers();
    } catch (e: any) {
      message.error(e?.response?.data?.message || '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Edit ────────────────────────────────────────────────────────────────────
  const openEdit = (user: User) => {
    setEditTarget(user);
    editForm.setFieldsValue({ username: user.username, email: user.email, role: user.role });
    setEditVisible(true);
  };

  const handleEdit = async () => {
    const values: DevUpdateUserRequest = await editForm.validateFields();
    if (!editTarget) return;
    setSubmitting(true);
    try {
      await devUserApi.updateUser(editTarget.id, values);
      message.success('用户更新成功');
      setEditVisible(false);
      loadUsers();
    } catch (e: any) {
      message.error(e?.response?.data?.message || '更新失败');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async (userId: string) => {
    try {
      await devUserApi.deleteUser(userId);
      message.success('用户已删除');
      loadUsers();
    } catch (e: any) {
      message.error(e?.response?.data?.message || '删除失败');
    }
  };

  // ── Reset Password ───────────────────────────────────────────────────────────
  const openReset = (user: User) => {
    setResetTarget(user);
    resetForm.resetFields();
    setResetVisible(true);
  };

  const handleReset = async () => {
    const { newPassword } = await resetForm.validateFields();
    if (!resetTarget) return;
    setSubmitting(true);
    try {
      await devUserApi.resetPassword(resetTarget.id, newPassword);
      message.success('密码重置成功');
      setResetVisible(false);
    } catch (e: any) {
      message.error(e?.response?.data?.message || '重置失败');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Columns ──────────────────────────────────────────────────────────────────
  const columns: ColumnsType<User> = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      render: (v) => (
        <Space>
          <UserOutlined />
          <Text strong>{v}</Text>
        </Space>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={ROLE_COLORS[role] ?? 'default'}>{ROLE_LABELS[role] ?? role}</Tag>
      ),
    },
    {
      title: '余额',
      dataIndex: 'balance',
      key: 'balance',
      render: (v) => `¥${(v ?? 0).toFixed(2)}`,
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '最后登录',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      render: (v) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '—'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Button size="small" icon={<KeyOutlined />} onClick={() => openReset(record)}>
            重置密码
          </Button>
          <Popconfirm
            title="确认删除该用户？此操作不可撤销。"
            onConfirm={() => handleDelete(record.id)}
            disabled={record.id === currentUser?.id}
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled={record.id === currentUser?.id}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container fade-in">
      <PageHeaderBar
        title="用户管理"
        description={`共 ${filteredUsers.length} 个用户（开发者视图，无权限限制）`}
        actions={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadUsers}>刷新</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建用户</Button>
          </Space>
        }
      />

      <TableCard>
        <Space style={{ marginBottom: 16 }}>
          <Input.Search
            placeholder="搜索用户名或邮箱"
            allowClear
            style={{ width: 260 }}
            onSearch={setSearchText}
            onChange={(e) => !e.target.value && setSearchText('')}
          />
          <Select value={roleFilter} onChange={setRoleFilter} style={{ width: 140 }}>
            <Option value="all">全部角色</Option>
            <Option value="user">普通用户</Option>
            <Option value="position_admin">岗位管理员</Option>
            <Option value="super_admin">超级管理员</Option>
            <Option value="developer">开发者</Option>
          </Select>
        </Space>

        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
          size="middle"
        />
      </TableCard>

      {/* Create Modal */}
      <Modal
        title="新建用户"
        open={createVisible}
        onOk={handleCreate}
        onCancel={() => setCreateVisible(false)}
        confirmLoading={submitting}
        okText="创建"
        cancelText="取消"
      >
        <Form form={createForm} layout="vertical">
          <Form.Item name="username" label="用户名" rules={[{ required: true, min: 3 }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, min: 6 }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="role" label="角色" initialValue={UserRole.USER}>
            <Select>
              <Option value={UserRole.USER}>普通用户</Option>
              <Option value={UserRole.POSITION_ADMIN}>岗位管理员</Option>
              <Option value={UserRole.SUPER_ADMIN}>超级管理员</Option>
              <Option value={UserRole.DEVELOPER}>开发者</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        title={`编辑用户：${editTarget?.username}`}
        open={editVisible}
        onOk={handleEdit}
        onCancel={() => setEditVisible(false)}
        confirmLoading={submitting}
        okText="保存"
        cancelText="取消"
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="username" label="用户名" rules={[{ required: true, min: 1 }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="role" label="角色">
            <Select>
              <Option value={UserRole.USER}>普通用户</Option>
              <Option value={UserRole.POSITION_ADMIN}>岗位管理员</Option>
              <Option value={UserRole.SUPER_ADMIN}>超级管理员</Option>
              <Option value={UserRole.DEVELOPER}>开发者</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        title={`重置密码：${resetTarget?.username}`}
        open={resetVisible}
        onOk={handleReset}
        onCancel={() => setResetVisible(false)}
        confirmLoading={submitting}
        okText="重置"
        cancelText="取消"
      >
        <Form form={resetForm} layout="vertical">
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[{ required: true, min: 6, message: '密码至少 6 位' }]}
          >
            <Input.Password placeholder="输入新密码" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认密码"
            dependencies={['newPassword']}
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                  return Promise.reject(new Error('两次密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="再次输入新密码" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
