import React, { useEffect } from 'react';
import {
  Button,
  Space,
  Form,
  Input,
  InputNumber,
  Image,
} from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import { avatarApi, Avatar } from '../../api/avatar';
import { PageHeaderBar } from '../../components/common/PageHeaderBar';
import { TableCard } from '../../components/common/TableCard';
import { ConfirmDeleteButton } from '../../components/common/ConfirmDeleteButton';
import { CrudFormModal } from '../../components/common/CrudFormModal';
import { useCrudOperations } from '../../hooks/useCrudOperations';
import { useModalState } from '../../hooks/useModalState';
import { formRules, commonRuleSets } from '../../utils/formRules';

export const AvatarManagementPage: React.FC = () => {
  const [form] = Form.useForm();

  // 使用CRUD Hook管理数据操作
  const {
    data: avatars,
    loading,
    create,
    update,
    deleteItem,
    loadAll,
  } = useCrudOperations<Avatar>({
    fetchAll: avatarApi.getAllAvatars,
    create: avatarApi.createAvatar,
    update: avatarApi.updateAvatar,
    delete: avatarApi.deleteAvatar,
    successMessages: {
      create: '头像创建成功',
      update: '头像更新成功',
      delete: '头像删除成功',
    },
    errorMessages: {
      fetch: '加载头像列表失败',
      create: '创建头像失败',
      update: '更新头像失败',
      delete: '删除头像失败',
    },
  });

  // 使用Modal Hook管理模态框状态
  const editModal = useModalState<Avatar>();

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleAdd = () => {
    form.resetFields();
    editModal.open();
  };

  const handleEdit = (avatar: Avatar) => {
    form.setFieldsValue({
      name: avatar.name,
      imageUrl: avatar.imageUrl,
      requiredRank: avatar.requiredRank,
    });
    editModal.open(avatar);
  };

  const handleSubmit = async (values: any) => {
    const result = editModal.data
      ? await update(editModal.data.id, values)
      : await create(values);
    
    if (result) {
      editModal.close();
      form.resetFields();
    }
  };

  const columns = [
    {
      title: '预览',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 100,
      render: (url: string) => (
        <Image 
          src={url} 
          alt="avatar" 
          width={60} 
          height={60} 
          style={{ objectFit: 'cover' }}
          fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Crect width='60' height='60' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='12' fill='%23999'%3E加载失败%3C/text%3E%3C/svg%3E"
          preview={{
            mask: '预览',
          }}
          onError={(e) => {
            console.error('图片加载失败:', url);
            console.error('错误详情:', e);
          }}
        />
      ),
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '图片URL',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      ellipsis: true,
    },
    {
      title: '所需排名',
      dataIndex: 'requiredRank',
      key: 'requiredRank',
      width: 120,
      render: (rank: number) => `前 ${rank} 名`,
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: Avatar) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            style={{ padding: 0 }}
          >
            编辑
          </Button>
          <ConfirmDeleteButton
            buttonProps={{ type: 'link', danger: true, icon: undefined, style: { padding: 0 } }}
            onConfirm={async () => {
              await deleteItem(record.id);
            }}
            popconfirmProps={{ title: '确定要删除这个头像吗？' }}
            buttonText="删除"
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeaderBar
        title="头像管理"
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加头像
          </Button>
        }
      />

      <TableCard
        columns={columns}
        dataSource={avatars}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 个头像`,
        }}
      />

      <CrudFormModal
        title={editModal.data ? '编辑头像' : '添加头像'}
        open={editModal.visible}
        onCancel={editModal.close}
        onSubmit={handleSubmit}
        formProps={{ form }}
      >
        <Form.Item
          name="name"
          label="头像名称"
          rules={[
            formRules.required('请输入头像名称'),
            formRules.lengthRange(2, 50, '头像名称长度应在2-50个字符之间'),
          ]}
        >
          <Input placeholder="例如：金色徽章" />
        </Form.Item>

        <Form.Item
          name="imageUrl"
          label="图片URL"
          rules={commonRuleSets.requiredUrl()}
          extra="请输入图片的完整URL地址"
        >
          <Input placeholder="https://example.com/avatar.png" />
        </Form.Item>

        <Form.Item
          name="requiredRank"
          label="所需排名"
          rules={commonRuleSets.requiredPositiveInteger('请输入所需排名')}
          extra="用户需要达到此排名或更高才能解锁此头像（基于上月排名）"
        >
          <InputNumber
            min={1}
            placeholder="例如：10"
            style={{ width: '100%' }}
            addonAfter="名"
          />
        </Form.Item>
      </CrudFormModal>
    </div>
  );
};
