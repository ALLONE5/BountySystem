import React from 'react';
import { Card, Typography, List, Tag } from 'antd';

const { Title, Text } = Typography;

const mockTasks = [
  {
    id: '1',
    name: '开发用户登录功能',
    status: 'in_progress',
    bounty: 500,
    deadline: '2026-03-10',
  },
  {
    id: '2',
    name: '设计主页UI界面',
    status: 'available',
    bounty: 300,
    deadline: '2026-03-15',
  },
  {
    id: '3',
    name: '编写API文档',
    status: 'completed',
    bounty: 200,
    deadline: '2026-03-05',
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'green';
    case 'in_progress': return 'blue';
    case 'available': return 'orange';
    default: return 'default';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'completed': return '已完成';
    case 'in_progress': return '进行中';
    case 'available': return '可接取';
    default: return status;
  }
};

export const SimpleTasksPage: React.FC = () => {
  return (
    <div style={{ padding: '20px', minHeight: '100vh', background: '#f0f2f5' }}>
      <Card>
        <Title level={2}>📋 任务列表</Title>
        <Text type="secondary">管理和查看您的任务</Text>
        
        <List
          style={{ marginTop: '20px' }}
          dataSource={mockTasks}
          renderItem={(task) => (
            <List.Item
              actions={[
                <Tag color={getStatusColor(task.status)}>
                  {getStatusText(task.status)}
                </Tag>,
                <Text strong>¥{task.bounty}</Text>
              ]}
            >
              <List.Item.Meta
                title={task.name}
                description={`截止日期: ${task.deadline}`}
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};