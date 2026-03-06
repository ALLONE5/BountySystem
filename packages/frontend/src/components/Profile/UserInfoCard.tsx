import React from 'react';
import { Card, Row, Col, Avatar, Button, Space, Typography, Tag, Divider } from 'antd';
import { UserOutlined, CameraOutlined, SwapOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { User, Position } from '../../types';
import { Avatar as AvatarType } from '../../api/avatar';

const { Title, Text } = Typography;

interface UserInfoCardProps {
  user: User;
  currentAvatar: AvatarType | null;
  userPositions: Position[];
  onAvatarClick: () => void;
  onPositionChangeClick: () => void;
}

export const UserInfoCard: React.FC<UserInfoCardProps> = ({
  user,
  currentAvatar,
  userPositions,
  onAvatarClick,
  onPositionChangeClick,
}) => {
  return (
    <Card style={{ marginBottom: 24 }}>
      <Row gutter={24}>
        <Col xs={24} md={12} style={{ textAlign: 'center' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            {currentAvatar ? (
              <Avatar size={120} src={currentAvatar.imageUrl} style={{ marginBottom: 16 }} />
            ) : (
              <Avatar size={120} icon={<UserOutlined />} style={{ marginBottom: 16 }} />
            )}
            <Button
              type="primary"
              shape="circle"
              icon={<CameraOutlined />}
              size="small"
              style={{
                position: 'absolute',
                bottom: 16,
                right: 0,
              }}
              onClick={onAvatarClick}
            />
          </div>
          <div>
            <Title level={4}>{user.username}</Title>
            <Text type="secondary">{user.email}</Text>
          </div>
        </Col>

        <Col xs={24} md={12}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {/* 角色和注册时间 */}
            <div>
              <div style={{ marginBottom: 8 }}>
                <Text strong>角色: </Text>
                <Tag color="blue">{user.role}</Tag>
              </div>
              <div>
                <Text strong>注册时间: </Text>
                <Text type="secondary">{dayjs(user.createdAt).format('YYYY-MM-DD')}</Text>
              </div>
            </div>

            <Divider style={{ margin: '8px 0' }} />

            {/* 岗位信息 */}
            <div>
              <div style={{ marginBottom: 12 }}>
                <Title level={5} style={{ margin: 0 }}>岗位信息</Title>
              </div>
              {userPositions.length > 0 ? (
                <div style={{ marginBottom: 16 }}>
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    {userPositions.map((pos) => (
                      <Card key={pos.id} size="small" style={{ borderLeft: '4px solid #52c41a' }}>
                        <Space direction="vertical" size={0}>
                          <Text strong style={{ fontSize: 16 }}>{pos.name}</Text>
                          {pos.description && (
                            <Text type="secondary" style={{ fontSize: 12 }}>{pos.description}</Text>
                          )}
                        </Space>
                      </Card>
                    ))}
                  </Space>
                </div>
              ) : (
                <div style={{ marginBottom: 16 }}>
                  <Text type="secondary">暂无岗位</Text>
                </div>
              )}
              <Button
                type="primary"
                icon={<SwapOutlined />}
                onClick={onPositionChangeClick}
              >
                申请岗位变更
              </Button>
            </div>
          </Space>
        </Col>
      </Row>
    </Card>
  );
};