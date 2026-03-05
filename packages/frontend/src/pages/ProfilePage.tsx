import React, { useEffect, useState } from 'react';
import {
  Typography,
  Card,
  Form,
  Input,
  Button,
  Avatar,
  Space,
  message,
  Divider,
  Row,
  Col,
  Tag,
  Modal,
  Image,
  Tooltip,
  Select,
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  CameraOutlined,
  LockOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import { avatarApi, Avatar as AvatarType } from '../api/avatar';
import { positionApi, Position } from '../api/position';
import { userApi } from '../api/user';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

export const ProfilePage: React.FC = () => {
  const { user, token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [positionModalVisible, setPositionModalVisible] = useState(false);
  const [availableAvatars, setAvailableAvatars] = useState<AvatarType[]>([]);
  const [allAvatars, setAllAvatars] = useState<AvatarType[]>([]);
  const [currentAvatar, setCurrentAvatar] = useState<AvatarType | null>(null);
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [allPositions, setAllPositions] = useState<Position[]>([]);
  const [userPositions, setUserPositions] = useState<Position[]>([]);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [positionError, setPositionError] = useState<string>('');

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        username: user.username,
        email: user.email,
      });
      loadAvatarData();
      loadPositionData();
    }
  }, [user, form]);

  const loadAvatarData = async () => {
    try {
      const [available, all] = await Promise.all([
        avatarApi.getAvailableAvatars(),
        avatarApi.getAllAvatars(),
      ]);
      setAvailableAvatars(available);
      setAllAvatars(all);
      
      // Get current avatar separately with proper error handling
      try {
        const current = await avatarApi.getUserAvatar();
        setCurrentAvatar(current);
      } catch (error: any) {
        // User has no avatar - this is normal, don't show error
        if (error.response?.status !== 404) {
          console.error('Failed to load user avatar:', error);
        }
        setCurrentAvatar(null);
      }
    } catch (error) {
      console.error('Failed to load avatar data:', error);
    }
  };

  const loadPositionData = async () => {
    if (!user) return;
    try {
      const [all, userPos] = await Promise.all([
        positionApi.getAllPositions(),
        positionApi.getUserPositions(user.id),
      ]);
      setAllPositions(all);
      setUserPositions(userPos);
    } catch (error) {
      console.error('Failed to load position data:', error);
    }
  };

  const handleUpdateProfile = async (values: any) => {
    try {
      setLoading(true);
      setFormErrors({}); // Clear previous errors
      const response = await userApi.updateProfile({ username: values.username });
      message.success(response.message || '个人信息更新成功');
      // Update the auth store with the new user data
      if (response.user && token) {
        useAuthStore.getState().setAuth(token, response.user);
      }
    } catch (error: any) {
      if (error.response?.data) {
        const responseData = error.response.data;
        
        // Check if it's a validation error with details (new format)
        if (responseData.code === 'VALIDATION_ERROR' && responseData.details) {
          const newErrors: {[key: string]: string} = {};
          responseData.details.forEach((detail: any) => {
            if (detail.path && detail.path.length > 0) {
              newErrors[detail.path[0]] = detail.message;
            }
          });
          setFormErrors(newErrors);
        } 
        // Check if it's a validation error with details (old format)
        else if (responseData.type === 'ValidationError' && responseData.details) {
          const newErrors: {[key: string]: string} = {};
          responseData.details.forEach((detail: any) => {
            if (detail.path && detail.path.length > 0) {
              newErrors[detail.path[0]] = detail.message;
            }
          });
          setFormErrors(newErrors);
        } 
        // Check if it's a field-specific error by message content
        else if (responseData.error || responseData.message) {
          const errorMessage = responseData.error || responseData.message;
          if (errorMessage.includes('用户名') || errorMessage.includes('username')) {
            setFormErrors({ username: errorMessage });
          } else if (errorMessage.includes('邮箱') || errorMessage.includes('email')) {
            setFormErrors({ email: errorMessage });
          } else {
            // General error, show at top
            message.error(errorMessage);
          }
        } else {
          message.error('更新失败');
        }
      } else {
        message.error('更新失败');
      }
      console.error('Failed to update profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAvatar = async (avatarId: string) => {
    try {
      await avatarApi.selectAvatar(avatarId);
      message.success('头像更换成功');
      setAvatarModalVisible(false);
      const selected = [...availableAvatars, ...allAvatars].find((a) => a.id === avatarId);
      if (selected) {
        setCurrentAvatar(selected);
      }
      await loadAvatarData();
      // Notify layout/header to refresh avatar display
      window.dispatchEvent(new CustomEvent('avatar-updated'));
    } catch (error: any) {
      if (error.response?.data?.error) {
        message.error(error.response.data.error);
      } else {
        message.error('头像更换失败');
      }
      console.error('Failed to select avatar:', error);
    }
  };

  const handlePositionChangeRequest = async () => {
    setPositionError(''); // Clear previous errors
    
    if (!selectedPositions || selectedPositions.length === 0) {
      setPositionError('请至少选择一个岗位');
      return;
    }
    
    // Validate position limit
    if (selectedPositions.length > 3) {
      setPositionError('最多只能选择3个岗位');
      return;
    }
    
    try {
      const currentPositionIds = userPositions.map(pos => pos.id);
      
      // Check if positions have changed
      const hasChanged = 
        selectedPositions.length !== currentPositionIds.length ||
        selectedPositions.some(posId => !currentPositionIds.includes(posId));
      
      if (!hasChanged) {
        setPositionError('岗位未发生变化');
        return;
      }
      
      // Calculate positions to remove and add
      const positionsToRemove = currentPositionIds.filter(
        posId => !selectedPositions.includes(posId)
      );
      const positionsToAdd = selectedPositions.filter(
        posId => !currentPositionIds.includes(posId)
      );
      
      if (positionsToAdd.length === 0 && positionsToRemove.length === 0) {
        setPositionError('岗位未发生变化');
        return;
      }
      
      // Use the replacement API endpoint
      await positionApi.requestPositionReplacement({
        positionsToRemove,
        positionsToAdd,
      });
      
      let successMsg = '岗位变更申请已提交';
      if (positionsToAdd.length > 0) {
        successMsg += `，申请新增 ${positionsToAdd.length} 个岗位`;
      }
      if (positionsToRemove.length > 0) {
        successMsg += `，移除 ${positionsToRemove.length} 个岗位`;
      }
      successMsg += '。等待管理员审核，审核通过后将按新选择的岗位更新。';
      
      message.success(successMsg);
      setPositionModalVisible(false);
      setSelectedPositions([]);
      setPositionError('');
    } catch (error: any) {
      if (error.response?.data?.error) {
        setPositionError(error.response.data.error);
      } else {
        setPositionError('申请提交失败');
      }
      console.error('Failed to submit position change request:', error);
    }
  };

  const isAvatarUnlocked = (avatarId: string) => {
    return availableAvatars.some((a) => a.id === avatarId);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="page-container fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <Title level={2} style={{ margin: 0 }}>个人信息</Title>
          <Text type="secondary">管理您的个人资料</Text>
        </div>
      </div>

      {/* 用户信息卡片 */}
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
                onClick={() => setAvatarModalVisible(true)}
              />
            </div>
            <div>
              <Title level={4}>{user.username}</Title>
              <Text type="secondary">{user.email}</Text>
            </div>
          </Col>

          <Col xs={24} md={12}>
            <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
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
                    <Space orientation="vertical" size="small" style={{ width: '100%' }}>
                      {userPositions.map((pos) => (
                        <Card key={pos.id} size="small" style={{ borderLeft: '4px solid #52c41a' }}>
                          <Space orientation="vertical" size={0}>
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
                  onClick={() => {
                    // Pre-populate with current positions
                    setSelectedPositions(userPositions.map(pos => pos.id));
                    setPositionError('');
                    setPositionModalVisible(true);
                  }}
                >
                  申请岗位变更
                </Button>
              </div>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 编辑信息表单 */}
      <Card title="编辑个人信息">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateProfile}
          style={{ maxWidth: 600 }}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
            validateStatus={formErrors.username ? 'error' : ''}
            help={formErrors.username || ''}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="用户名" 
              onChange={() => {
                // Clear error when user starts typing
                if (formErrors.username) {
                  setFormErrors(prev => ({ ...prev, username: '' }));
                }
              }}
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
            validateStatus={formErrors.email ? 'error' : ''}
            help={formErrors.email || ''}
          >
            <Input 
              prefix={<MailOutlined />} 
              placeholder="邮箱" 
              disabled 
              onChange={() => {
                // Clear error when user starts typing
                if (formErrors.email) {
                  setFormErrors(prev => ({ ...prev, email: '' }));
                }
              }}
            />
          </Form.Item>

          <Divider />

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                保存修改
              </Button>
              <Button onClick={() => form.resetFields()}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* 头像选择模态框 */}
      <Modal
        title="选择头像"
        open={avatarModalVisible}
        onCancel={() => setAvatarModalVisible(false)}
        footer={null}
        width={800}
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">
            根据您上月的排名，您可以解锁不同的头像。排名越高，可选择的头像越多。
          </Text>
        </div>
        <Row gutter={[16, 16]}>
          {allAvatars.map((avatar) => {
            const unlocked = isAvatarUnlocked(avatar.id);
            return (
              <Col key={avatar.id} xs={12} sm={8} md={6}>
                <Card
                  hoverable={unlocked}
                  style={{
                    textAlign: 'center',
                    opacity: unlocked ? 1 : 0.5,
                    cursor: unlocked ? 'pointer' : 'not-allowed',
                  }}
                  onClick={() => unlocked && handleSelectAvatar(avatar.id)}
                >
                  <div style={{ position: 'relative' }}>
                    <Image
                      src={avatar.imageUrl}
                      alt={avatar.name}
                      preview={false}
                      style={{ width: '100%', height: 100, objectFit: 'cover' }}
                    />
                    {!unlocked && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        }}
                      >
                        <LockOutlined style={{ fontSize: 32, color: 'white' }} />
                      </div>
                    )}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <Text strong>{avatar.name}</Text>
                  </div>
                  {!unlocked && (
                    <Tooltip title={`需要排名前 ${avatar.requiredRank} 名才能解锁`}>
                      <Tag color="red" style={{ marginTop: 4 }}>
                        需排名 ≤ {avatar.requiredRank}
                      </Tag>
                    </Tooltip>
                  )}
                  {currentAvatar?.id === avatar.id && (
                    <Tag color="blue" style={{ marginTop: 4 }}>
                      当前使用
                    </Tag>
                  )}
                </Card>
              </Col>
            );
          })}
        </Row>
      </Modal>

      {/* 岗位变更申请模态框 */}
      <Modal
        title="申请岗位变更"
        open={positionModalVisible}
        onOk={handlePositionChangeRequest}
        onCancel={() => {
          setPositionModalVisible(false);
          setSelectedPositions([]);
          setPositionError('');
        }}
        okText="提交申请"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16 }}>
          <Text>当前岗位: </Text>
          {userPositions.length > 0 ? (
            userPositions.map((pos) => (
              <Tag key={pos.id} color="green">
                {pos.name}
              </Tag>
            ))
          ) : (
            <Text type="secondary">暂无岗位</Text>
          )}
        </div>
        <Form layout="vertical">
          <Form.Item 
            label="选择岗位" 
            required 
            help={positionError || "最多可选择3个岗位"}
            validateStatus={positionError ? 'error' : ''}
          >
            <Select
              mode="multiple"
              placeholder="请选择岗位（可多选、可删减）"
              value={selectedPositions}
              onChange={(value) => {
                setSelectedPositions(value);
                // Clear error when user makes changes
                if (positionError) {
                  setPositionError('');
                }
              }}
              showSearch
              maxTagCount="responsive"
              maxCount={3}
            >
              {allPositions.map((pos) => (
                <Option key={pos.id} value={pos.id}>
                  {pos.name}
                  {pos.description && ` - ${pos.description}`}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Text type="secondary">
              直接在下拉框中选择您想要的所有岗位（最多3个）。提交后，系统将用您选择的岗位覆盖当前岗位。管理员审核通过后生效。
            </Text>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
