import React from 'react';
import { Modal, Row, Col, Card, Image, Typography, Tag, Tooltip } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { Avatar as AvatarType } from '../../api/avatar';
import { useErrorHandler } from '../../hooks/useErrorHandler';

const { Text } = Typography;

interface AvatarSelectionModalProps {
  visible: boolean;
  availableAvatars: AvatarType[];
  allAvatars: AvatarType[];
  currentAvatar: AvatarType | null;
  onClose: () => void;
  onSelectAvatar: (avatarId: string) => Promise<void>;
}

export const AvatarSelectionModal: React.FC<AvatarSelectionModalProps> = ({
  visible,
  availableAvatars,
  allAvatars,
  currentAvatar,
  onClose,
  onSelectAvatar,
}) => {
  const { handleAsyncError } = useErrorHandler();

  const isAvatarUnlocked = (avatarId: string) => {
    return availableAvatars && availableAvatars.some((a) => a.id === avatarId);
  };

  const handleSelectAvatar = async (avatarId: string) => {
    await handleAsyncError(
      async () => {
        await onSelectAvatar(avatarId);
        onClose();
      },
      'AvatarSelectionModal.selectAvatar',
      '头像更换成功',
      '头像更换失败'
    );
  };

  return (
    <Modal
      title="选择头像"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary">
          根据您上月的排名，您可以解锁不同的头像。排名越高，可选择的头像越多。
        </Text>
      </div>
      <Row gutter={[16, 16]}>
        {allAvatars && allAvatars.map((avatar) => {
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
  );
};