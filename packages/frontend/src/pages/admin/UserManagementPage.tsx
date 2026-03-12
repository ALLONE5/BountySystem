import React, { useEffect, useState } from 'react';
import {
  Button,
  Space,
  Form,
  Input,
  Select,
} from 'antd';
import { EditOutlined, UserOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { adminApi, UpdateUserRequest } from '../../api/admin';
import { positionApi } from '../../api/position';
import type { Position } from '../../types';
import { User, UserRole } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { UserDetailsDrawer } from '../../components/admin/UserDetailsDrawer';
import { PageHeaderBar } from '../../components/common/PageHeaderBar';
import { TableCard } from '../../components/common/TableCard';
import { StatusTag } from '../../components/common/StatusTag';
import { TagList } from '../../components/common/TagList';
import { ConfirmDeleteButton } from '../../components/common/ConfirmDeleteButton';
import { CrudFormModal } from '../../components/common/CrudFormModal';
import { useCrudOperations } from '../../hooks/useCrudOperations';
import { useModalState } from '../../hooks/useModalState';
import { formRules } from '../../utils/formRules';
import { logger } from '../../utils/logger';

const { Search } = Input;
const { Option } = Select;

export const UserManagementPage: React.FC = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [form] = Form.useForm();
  const currentUser = useAuthStore((state) => state.user);

  // 使用CRUD Hook管理数据操作
  const {
    data: users,
    loading,
    update,
    deleteItem,
    loadAll,
    selectedItem: selectedUser,
    setSelectedItem: setSelectedUser,
  }: {
    data: User[];
    loading: boolean;
    update: (id: string, data: Partial<User>) => Promise<User | null>;
    deleteItem: (id: string) => Promise<boolean>;
    loadAll: () => Promise<void>;
    selectedItem: User | null;
    setSelectedItem: (item: User | null) => void;
  } = useCrudOperations<User>({
    fetchAll: async () => {
      const data = await adminApi.getUsers();
      return data.users;
    },
    update: async (id, data): Promise<User> => {
      await adminApi.updateUser(id, data as UpdateUserRequest);
      return { ...selectedUser!, ...data } as User;
    },
    delete: async (id: string) => {
      await adminApi.deleteUser(id);
    },
    successMessages: {
      update: '用户信息更新成功',
      delete: '用户删除成功',
    },
    errorMessages: {
      fetch: '加载用户列表失败',
      update: '更新用户信息失败',
      delete: '删除用户失败',
    },
  });

  // 使用Modal Hook管理模态框状态
  const detailsDrawer = useModalState<User>();
  const editModal = useModalState<User>();

  useEffect(() => {
    loadAll();
    loadPositions();
  }, [loadAll]);

  const loadPositions = async () => {
    try {
      const data = await positionApi.getAllPositions();
      setPositions(data);
    } catch (error: any) {
      logger.error('Failed to load positions:', error);
    }
  };

  const handleViewDetails = async (user: User) => {
    const data = await adminApi.getUserDetails(user.id);
    setSelectedUser(data.user);
    detailsDrawer.open(data.user);
  };

  const handleEdit = async (user: User | { id: string }) => {
    const data = await adminApi.getUserDetails(user.id);
    const fullUser = data.user;
    
    setSelectedUser(fullUser);
    form.setFieldsValue({
      role: fullUser.role,
      positionIds: fullUser.positions?.map(p => p.id) || [],
      managedPositionIds: fullUser.managedPositions?.map(p => p.id) || [],
    });
    editModal.open(fullUser);
  };

  const handleSubmitEdit = async (values: UpdateUserRequest & { positionIds?: string[], managedPositionIds?: string[] }) => {
    if (!selectedUser) return;

    const result = await update(selectedUser.id, values);
    if (result) {
      editModal.close();
      form.resetFields();
    }
  };

  const handleDelete = async (userId: string) => {
    const success = await deleteItem(userId);
    if (success && selectedUser?.id === userId) {
      detailsDrawer.close();
      setSelectedUser(null);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username.toLowerCase().includes(searchText.toLowerCase()) ||
      user.email.toLowerCase().includes(searchText.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const columns: ColumnsType<User> = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      render: (username: string, record: User) => (
        <Button
          type="link"
          icon={<UserOutlined />}
          onClick={() => handleViewDetails(record)}
          style={{ padding: 0 }}
        >
          {username}
        </Button>
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
      render: (role: UserRole) => <StatusTag value={role} />,
    },
    {
      title: '岗位',
      key: 'positions',
      render: (_, record: User) => (
        <TagList
          items={record.positions?.map((pos) => ({ key: pos.id, label: pos.name }))}
          emptyText={<span style={{ color: '#999' }}>-</span>}
        />
      ),
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: Date) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      render: (_, record: User) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          {currentUser?.role === UserRole.SUPER_ADMIN && (
            <ConfirmDeleteButton
              buttonProps={{ type: 'link', size: 'small', danger: true, icon: undefined, style: { padding: 0 } }}
              onConfirm={() => handleDelete(record.id)}
              buttonText={
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  删除
                </span>
              }
              popconfirmProps={{
                title: '确定要删除此用户吗？',
                description: '此操作不可撤销',
              }}
            />
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeaderBar title="用户管理" />

      <TableCard
        columns={columns}
        dataSource={filteredUsers}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 个用户`,
        }}
        cardProps={{
          extra: (
            <Space>
              <Search
                placeholder="搜索用户名或邮箱"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 300 }}
                allowClear
              />
              <Select
                value={roleFilter}
                onChange={setRoleFilter}
                style={{ width: 150 }}
              >
                <Option value="all">所有角色</Option>
                <Option value={UserRole.USER}>普通用户</Option>
                <Option value={UserRole.POSITION_ADMIN}>职位管理员</Option>
                <Option value={UserRole.SUPER_ADMIN}>超级管理员</Option>
              </Select>
            </Space>
          ),
        }}
      />

      {/* 用户详情抽屉 */}
      <UserDetailsDrawer
        open={detailsDrawer.visible}
        onClose={detailsDrawer.close}
        user={detailsDrawer.data}
        currentUser={currentUser}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* 编辑用户模态框 */}
      <CrudFormModal
        title="编辑用户"
        open={editModal.visible}
        onCancel={editModal.close}
        onSubmit={handleSubmitEdit}
        formProps={{ form }}
        okText="保存"
      >
        <Form.Item label="用户名">
          <Input value={selectedUser?.username} disabled />
        </Form.Item>

        <Form.Item label="邮箱">
          <Input value={selectedUser?.email} disabled />
        </Form.Item>

        {currentUser?.role === UserRole.SUPER_ADMIN && (
          <Form.Item
            name="role"
            label="角色"
            rules={[formRules.required('请选择角色')]}
          >
            <Select>
              <Option value={UserRole.USER}>普通用户</Option>
              <Option value={UserRole.POSITION_ADMIN}>职位管理员</Option>
              <Option value={UserRole.SUPER_ADMIN}>超级管理员</Option>
            </Select>
          </Form.Item>
        )}

        <Form.Item
          name="positionIds"
          label="岗位"
        >
          <Select
            mode="multiple"
            placeholder="请选择岗位"
            optionFilterProp="children"
          >
            {positions.map(pos => (
              <Option key={pos.id} value={pos.id}>{pos.name}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) => prevValues.role !== currentValues.role}
        >
          {({ getFieldValue }) =>
            getFieldValue('role') === UserRole.POSITION_ADMIN ? (
              <Form.Item
                name="managedPositionIds"
                label="管理岗位"
                tooltip="该管理员负责管理的岗位"
              >
                <Select
                  mode="multiple"
                  placeholder="请选择管理的岗位"
                  optionFilterProp="children"
                >
                  {positions.map(pos => (
                    <Option key={pos.id} value={pos.id}>{pos.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            ) : null
          }
        </Form.Item>
      </CrudFormModal>
    </div>
  );
};
