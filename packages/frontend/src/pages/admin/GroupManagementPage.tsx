import React, { useEffect, useState } from 'react';
import {
  Button,
  Space,
  Input,
  message,
  Modal,
  List,
  Avatar,
  Popconfirm,
} from 'antd';
import {
  TeamOutlined,
  DeleteOutlined,
  UserOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { adminApi } from '../../api/admin';
import { groupApi } from '../../api/group';
import { TaskGroup } from '../../types';
import { PageHeaderBar } from '../../components/common/PageHeaderBar';
import { TableCard } from '../../components/common/TableCard';
import { UserChip } from '../../components/common/UserChip';

const { Search } = Input;

export const GroupManagementPage: React.FC = () => {
  const [groups, setGroups] = useState<TaskGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<TaskGroup | null>(null);
  const [membersModalVisible, setMembersModalVisible] = useState(false);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      console.log('Fetching groups...');
      const data = await adminApi.getGroups();
      console.log('Groups data:', data);
      if (data && data.groups) {
        setGroups(data.groups);
      } else {
        console.warn('No groups found in response:', data);
        setGroups([]);
      }
    } catch (error) {
      console.error('Error loading groups:', error);
      message.error('加载组群列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleViewMembers = async (group: TaskGroup) => {
    try {
      const members = await groupApi.getGroupMembers(group.id);
      setGroupMembers(members || []);
      setSelectedGroup(group);
      setMembersModalVisible(true);
    } catch (error) {
      message.error('加载成员失败');
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      await adminApi.deleteGroup(groupId);
      message.success('组群已删除');
      loadGroups();
    } catch (error) {
      message.error('删除组群失败');
    }
  };

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: '组群名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Space><TeamOutlined /> {text}</Space>,
    },
    {
      title: '创建者',
      dataIndex: 'creatorId',
      key: 'creator',
      render: (_: string, record: TaskGroup) => (
        <UserChip 
          username={record.creatorName || 'Unknown'} 
          avatarUrl={record.creatorAvatarUrl}
          size={24} 
        />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: TaskGroup) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleViewMembers(record)}>
            查看成员
          </Button>
          <Popconfirm
            title="确定要删除这个组群吗？"
            onConfirm={() => handleDeleteGroup(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <PageHeaderBar 
        title="组群管理" 
        actions={
          <Button type="primary" icon={<PlusOutlined />}>
            创建组群
          </Button>
        }
      />

      <TableCard
        columns={columns}
        dataSource={filteredGroups}
        rowKey="id"
        loading={loading}
        cardProps={{
          extra: (
            <Space>
              <Search
                placeholder="搜索组群名称"
                allowClear
                onSearch={setSearchText}
                onChange={e => setSearchText(e.target.value)}
                style={{ width: 300 }}
              />
            </Space>
          )
        }}
      />

      <Modal
        title={`成员列表 - ${selectedGroup?.name}`}
        open={membersModalVisible}
        onCancel={() => setMembersModalVisible(false)}
        footer={null}
      >
        <List
          dataSource={groupMembers}
          renderItem={member => (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar src={member.avatarUrl} icon={<UserOutlined />} />}
                title={member.username}
                description={member.email}
              />
            </List.Item>
          )}
        />
      </Modal>
    </div>
  );
};
