import React, { useEffect } from 'react';
import {
  Button,
  Space,
  Form,
  Input,
} from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import { positionApi } from '../../api/position';
import type { Position } from '../../api/position';
import { PageHeaderBar } from '../../components/common/PageHeaderBar';
import { TableCard } from '../../components/common/TableCard';
import { TagList } from '../../components/common/TagList';
import { ConfirmDeleteButton } from '../../components/common/ConfirmDeleteButton';
import { CrudFormModal } from '../../components/common/CrudFormModal';
import { useCrudOperations } from '../../hooks/useCrudOperations';
import { useModalState } from '../../hooks/useModalState';
import { formRules } from '../../utils/formRules';

const { TextArea } = Input;

export const PositionManagementPage: React.FC = () => {
  const [form] = Form.useForm();

  // 使用CRUD Hook管理数据操作
  const {
    data: positions,
    loading,
    create,
    update,
    deleteItem,
    loadAll,
  } = useCrudOperations<Position>({
    fetchAll: positionApi.getAllPositions,
    create: async (data) => {
      const formattedData = {
        ...data,
        requiredSkills: data.requiredSkills
          ? Array.isArray(data.requiredSkills) 
            ? data.requiredSkills 
            : (data.requiredSkills as unknown as string).split(',').map((s: string) => s.trim()).filter((s: string) => s)
          : [],
      };
      return positionApi.createPosition(formattedData);
    },
    update: async (id, data) => {
      const formattedData = {
        ...data,
        requiredSkills: data.requiredSkills
          ? Array.isArray(data.requiredSkills) 
            ? data.requiredSkills 
            : (data.requiredSkills as unknown as string).split(',').map((s: string) => s.trim()).filter((s: string) => s)
          : [],
      };
      return positionApi.updatePosition(id, formattedData);
    },
    delete: positionApi.deletePosition,
    successMessages: {
      create: '岗位创建成功',
      update: '岗位更新成功',
      delete: '岗位删除成功',
    },
    errorMessages: {
      fetch: '加载岗位列表失败',
      create: '创建岗位失败',
      update: '更新岗位失败',
      delete: '删除岗位失败',
    },
  });

  // 使用Modal Hook管理模态框状态
  const editModal = useModalState<Position>();

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleAdd = () => {
    form.resetFields();
    editModal.open();
  };

  const handleEdit = (position: Position) => {
    form.setFieldsValue({
      name: position.name,
      description: position.description,
      requiredSkills: position.requiredSkills?.join(', '),
    });
    editModal.open(position);
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
      title: '岗位名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '所需技能',
      dataIndex: 'requiredSkills',
      key: 'requiredSkills',
      render: (skills: string[]) => (
        <TagList
          color="blue"
          items={skills?.map((skill) => ({ key: skill, label: skill }))}
          emptyText={<span style={{ color: '#999' }}>无</span>}
        />
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: Position) => (
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
            popconfirmProps={{ title: '确定要删除这个岗位吗？' }}
            buttonText="删除"
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeaderBar
        title="岗位管理"
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加岗位
          </Button>
        }
      />

      <TableCard
        columns={columns}
        dataSource={positions}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 个岗位`,
        }}
      />

      <CrudFormModal
        title={editModal.data ? '编辑岗位' : '添加岗位'}
        open={editModal.visible}
        onCancel={editModal.close}
        onSubmit={handleSubmit}
        formProps={{ form }}
      >
        <Form.Item
          name="name"
          label="岗位名称"
          rules={[
            formRules.required('请输入岗位名称'),
            formRules.lengthRange(2, 50, '岗位名称长度应在2-50个字符之间'),
          ]}
        >
          <Input placeholder="例如：开发工程师" />
        </Form.Item>

        <Form.Item
          name="description"
          label="岗位描述"
          extra="简要描述该岗位的职责和要求"
        >
          <TextArea
            rows={4}
            placeholder="例如：负责系统开发和维护工作"
          />
        </Form.Item>

        <Form.Item
          name="requiredSkills"
          label="所需技能"
          extra="多个技能用逗号分隔，例如：JavaScript, React, Node.js"
        >
          <Input placeholder="JavaScript, React, Node.js" />
        </Form.Item>
      </CrudFormModal>
    </div>
  );
};
