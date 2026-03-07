import React, { useState } from 'react';
import { Typography } from 'antd';
import { useAuthStore } from '../store/authStore';
import { UserInfoCard } from '../components/Profile/UserInfoCard';
import { ProfileEditForm } from '../components/Profile/ProfileEditForm';
import { AvatarSelectionModal } from '../components/Profile/AvatarSelectionModal';
import { PositionChangeModal } from '../components/Profile/PositionChangeModal';
import { useDataFetch } from '../hooks/useDataFetch';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { avatarApi, Avatar as AvatarType } from '../api/avatar';
import { positionApi } from '../api/position';
import { userApi } from '../api/user';
import { Position } from '../types';
import { logger } from '../utils/logger';

const { Title, Text } = Typography;

export const ProfilePage: React.FC = () => {
  const { user, token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [positionModalVisible, setPositionModalVisible] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState<AvatarType | null>(null);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const { handleAsyncError } = useErrorHandler();

  // 数据获取
  const { data: availableAvatars = [], refetch: refetchAvailableAvatars } = useDataFetch(
    () => avatarApi.getAvailableAvatars(),
    [],
    { errorMessage: '加载可用头像失败', context: 'ProfilePage.loadAvailableAvatars' }
  );

  const { data: allAvatars = [] } = useDataFetch(
    () => avatarApi.getAllAvatars(),
    [],
    { errorMessage: '加载所有头像失败', context: 'ProfilePage.loadAllAvatars' }
  );

  const { data: allPositions = [] } = useDataFetch(
    () => positionApi.getAllPositions(),
    [],
    { errorMessage: '加载岗位列表失败', context: 'ProfilePage.loadAllPositions' }
  );

  const { data: userPositions = [] } = useDataFetch(
    () => user ? positionApi.getUserPositions(user.id) : Promise.resolve([]),
    [user?.id],
    { 
      errorMessage: '加载用户岗位失败', 
      context: 'ProfilePage.loadUserPositions',
      immediate: !!user 
    }
  );

  // 加载用户当前头像
  React.useEffect(() => {
    const loadCurrentAvatar = async () => {
      if (!user) return;
      try {
        const current = await avatarApi.getUserAvatar();
        setCurrentAvatar(current);
      } catch (error: any) {
        // User has no avatar - this is normal, don't show error
        if (error.response?.status !== 404) {
          logger.error('Failed to load user avatar:', error);
        }
        setCurrentAvatar(null);
      }
    };

    loadCurrentAvatar();
  }, [user]);

  const handleUpdateProfile = async (values: any) => {
    setLoading(true);
    setFormErrors({});
    
    await handleAsyncError(
      async () => {
        const response = await userApi.updateProfile({ username: values.username });
        
        // Update the auth store with the new user data
        if (response.user && token) {
          useAuthStore.getState().setAuth(token, response.user);
        }
      },
      'ProfilePage.updateProfile',
      '个人信息更新成功',
      undefined
    ).catch((error: any) => {
      // Handle validation errors
      if (error.response?.data) {
        const responseData = error.response.data;
        
        if (responseData.code === 'VALIDATION_ERROR' && responseData.details) {
          const newErrors: {[key: string]: string} = {};
          responseData.details.forEach((detail: any) => {
            if (detail.path && detail.path.length > 0) {
              newErrors[detail.path[0]] = detail.message;
            }
          });
          setFormErrors(newErrors);
        } else if (responseData.type === 'ValidationError' && responseData.details) {
          const newErrors: {[key: string]: string} = {};
          responseData.details.forEach((detail: any) => {
            if (detail.path && detail.path.length > 0) {
              newErrors[detail.path[0]] = detail.message;
            }
          });
          setFormErrors(newErrors);
        } else if (responseData.error || responseData.message) {
          const errorMessage = responseData.error || responseData.message;
          if (errorMessage.includes('用户名') || errorMessage.includes('username')) {
            setFormErrors({ username: errorMessage });
          } else if (errorMessage.includes('邮箱') || errorMessage.includes('email')) {
            setFormErrors({ email: errorMessage });
          }
        }
      }
    });
    
    setLoading(false);
  };

  const handleSelectAvatar = async (avatarId: string) => {
    await avatarApi.selectAvatar(avatarId);
    const selected = [...(availableAvatars as AvatarType[]), ...(allAvatars as AvatarType[])].find((a) => a.id === avatarId);
    if (selected) {
      setCurrentAvatar(selected);
    }
    await refetchAvailableAvatars();
    // Notify layout/header to refresh avatar display
    window.dispatchEvent(new CustomEvent('avatar-updated'));
  };

  const handlePositionChangeRequest = async (selectedPositions: string[]) => {
    const currentPositionIds = (userPositions as Position[]).map(pos => pos.id);
    
    // Calculate positions to remove and add
    const positionsToRemove = currentPositionIds.filter(
      posId => !selectedPositions.includes(posId)
    );
    const positionsToAdd = selectedPositions.filter(
      posId => !currentPositionIds.includes(posId)
    );
    
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
    
    // Show success message through handleAsyncError wrapper
    throw new Error(successMsg);
  };

  const handleErrorChange = (field: string, error: string) => {
    setFormErrors(prev => ({ ...prev, [field]: error }));
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

      <UserInfoCard
        user={user}
        currentAvatar={currentAvatar}
        userPositions={userPositions as Position[]}
        onAvatarClick={() => setAvatarModalVisible(true)}
        onPositionChangeClick={() => setPositionModalVisible(true)}
      />

      <ProfileEditForm
        user={user}
        loading={loading}
        formErrors={formErrors}
        onSubmit={handleUpdateProfile}
        onErrorChange={handleErrorChange}
      />

      <AvatarSelectionModal
        visible={avatarModalVisible}
        availableAvatars={availableAvatars as AvatarType[]}
        allAvatars={allAvatars as AvatarType[]}
        currentAvatar={currentAvatar}
        onClose={() => setAvatarModalVisible(false)}
        onSelectAvatar={handleSelectAvatar}
      />

      <PositionChangeModal
        visible={positionModalVisible}
        userPositions={userPositions as Position[]}
        allPositions={allPositions as Position[]}
        onClose={() => setPositionModalVisible(false)}
        onSubmit={handlePositionChangeRequest}
      />
    </div>
  );
};

export default ProfilePage;