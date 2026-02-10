import React, { useEffect, useState, useRef } from 'react';
import { Modal, Typography, Button, Space, Divider, Tabs, Tooltip, message, Tag, List, Progress, Badge, Card, Form, Input, DatePicker, InputNumber, Select, Popover } from 'antd';
import { PlusOutlined, TeamOutlined, EditOutlined, EyeOutlined, DeleteOutlined, CheckOutlined, CloseOutlined, ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { Task, TaskStatus, Visibility, InvitationStatus } from '../types';
import { taskApi } from '../api/task';
import { userApi } from '../api/user';
import { positionApi } from '../api/position';
import { projectGroupApi } from '../api/projectGroup';
import { groupApi } from '../api/group';
import { TaskComments } from './TaskComments';
import { TaskAttachments } from './TaskAttachments';
import type { Assistant } from './TaskAssistants';
import { InfoRow } from './common/InfoRow';
import { UserChip } from './common/UserChip';
import { StatusTag } from './common/StatusTag';
import { ProgressEditor } from './common/ProgressEditor';
import { AddAssistantModal } from './common/AddAssistantModal';
import { TaskViews } from './TaskViews';
import { formatBounty } from '../utils/formatters';
import { useAuthStore } from '../store/authStore';

const { Title, Text } = Typography;

interface TaskDetailDrawerProps {
  task: Task | null;
  visible: boolean;
  onClose: () => void;
  onUpdateProgress?: (task: Task) => void;
  onCompleteTask?: (taskId: string) => void;
  onTaskUpdated?: () => void; // Callback to refresh task list after any update
  onTaskClick?: (taskId: string) => void; // Callback to open a different task
}

export const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({
  task,
  visible,
  onClose,
  onUpdateProgress,
  onCompleteTask,
  onTaskUpdated,
}) => {
  const { user } = useAuthStore();
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [assigneeFallback, setAssigneeFallback] = useState<{ username: string; avatarUrl?: string } | null>(null);
  const [progressValue, setProgressValue] = useState<number>(0);
  const [updatingProgress, setUpdatingProgress] = useState(false);
  const [addAssistantModalVisible, setAddAssistantModalVisible] = useState(false);
  const [addAssistantSubmitting, setAddAssistantSubmitting] = useState(false);
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [createSubtaskVisible, setCreateSubtaskVisible] = useState(false);
  const [_createSubtaskLoading, setCreateSubtaskLoading] = useState(false);
  const [publishSubtaskVisible, setPublishSubtaskVisible] = useState(false);
  const [publishingSubtask, setPublishingSubtask] = useState<Task | null>(null);
  const [publishSubtaskLoading, setPublishSubtaskLoading] = useState(false);
  const [subtaskPopoverVisible, setSubtaskPopoverVisible] = useState<Record<string, boolean>>({});
  const [subtaskForm] = Form.useForm();
  const [publishSubtaskForm] = Form.useForm();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm] = Form.useForm();
  const [_taskModified, setTaskModified] = useState(false); // Track if task was modified
  const isUpdatingProgressRef = useRef(false); // Track if we're currently updating progress
  const [positions, setPositions] = useState<any[]>([]);
  const [projectGroups, setProjectGroups] = useState<any[]>([]);
  const [newProjectGroupName, setNewProjectGroupName] = useState('');
  const [addingProjectGroup, setAddingProjectGroup] = useState(false);
  const [rejectInvitationModalVisible, setRejectInvitationModalVisible] = useState(false);
  const [rejectInvitationReason, setRejectInvitationReason] = useState('');
  const [invitationActionLoading, setInvitationActionLoading] = useState(false);
  const [convertToGroupModalVisible, setConvertToGroupModalVisible] = useState(false);
  const [userGroups, setUserGroups] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>();
  const [convertingToGroup, setConvertingToGroup] = useState(false);
  const [bonusModalVisible, setBonusModalVisible] = useState(false);
  const [bonusForm] = Form.useForm();
  const [addingBonus, setAddingBonus] = useState(false);
  const [bonusRewards, setBonusRewards] = useState<any[]>([]);
  const [loadingBonusRewards, setLoadingBonusRewards] = useState(false);

  // Define helper functions before useEffect
  const loadProjectGroups = async () => {
    try {
      const data = await projectGroupApi.getAllProjectGroups();
      setProjectGroups(data);
    } catch (error) {
      console.error('Failed to load project groups:', error);
    }
  };

  const loadUserGroups = async () => {
    try {
      const data = await groupApi.getUserGroups();
      setUserGroups(data);
    } catch (error) {
      console.error('Failed to load user groups:', error);
    }
  };

  const loadBonusRewards = async () => {
    if (!task?.id) return;
    
    try {
      setLoadingBonusRewards(true);
      const data = await taskApi.getBonusRewards(task.id);
      setBonusRewards(data.bonusRewards);
    } catch (error) {
      console.error('Failed to load bonus rewards:', error);
    } finally {
      setLoadingBonusRewards(false);
    }
  };

  // Load positions and project groups for edit form
  useEffect(() => {
    positionApi.getAllPositions().then(setPositions).catch(console.error);
    loadProjectGroups();
    loadUserGroups();
  }, []);

  // Load bonus rewards when task changes
  useEffect(() => {
    if (task?.id) {
      loadBonusRewards();
    }
  }, [task?.id]);

  const handleAddProjectGroup = async () => {
    if (!newProjectGroupName || newProjectGroupName.trim().length === 0) {
      message.error('请输入项目分组名称');
      return;
    }

    setAddingProjectGroup(true);
    try {
      const newGroup = await projectGroupApi.createProjectGroup({
        name: newProjectGroupName.trim(),
      });
      message.success('项目分组创建成功');
      setNewProjectGroupName('');
      
      // 刷新项目分组列表
      await loadProjectGroups();
      
      // 自动选中新创建的项目分组
      editForm.setFieldsValue({
        projectGroupId: newGroup.id,
      });
    } catch (error: any) {
      message.error(error.response?.data?.error || '创建项目分组失败');
      console.error('Failed to create project group:', error);
    } finally {
      setAddingProjectGroup(false);
    }
  };

  useEffect(() => {
    console.log('[TaskDetailDrawer] Component mounted/updated, onTaskUpdated prop:', onTaskUpdated ? 'defined' : 'undefined');
    if (task) {
      taskApi.getAssistants(task.id).then(setAssistants).catch(console.error);
      taskApi.getSubtasks(task.id).then(setSubtasks).catch(console.error);
      
      // Only update progressValue if we're not currently updating progress
      // This prevents resetting the progress bar after an update
      if (!isUpdatingProgressRef.current) {
        console.log('[TaskDetailDrawer] useEffect - updating progressValue to', task.progress);
        setProgressValue(task.progress || 0);
      } else {
        console.log('[TaskDetailDrawer] useEffect - skipping progressValue update (currently updating)');
      }
      
      setTaskModified(false); // Reset modified flag when task changes
      // If assignee is missing but assigneeId exists, fetch user details as fallback
      if (!task.assignee && task.assigneeId) {
        userApi.getUser(task.assigneeId)
          .then(u => setAssigneeFallback({ username: u.username, avatarUrl: u.avatarUrl }))
          .catch(() => setAssigneeFallback(null));
      } else {
        setAssigneeFallback(null);
      }
    } else {
      setAssistants([]);
      setAssigneeFallback(null);
      setProgressValue(0);
      setSubtasks([]);
      setTaskModified(false);
    }
  }, [task, onTaskUpdated]);

  const handleCreateSubtask = async (values: any) => {
    if (!task) return;
    try {
      setCreateSubtaskLoading(true);
      
      // Extract dates from RangePicker
      const subtaskData: any = {
        name: values.name,
        description: values.description,
        tags: values.tags || [],
        estimatedHours: values.estimatedHours,
        complexity: values.complexity,
        priority: values.priority,
        parentId: task.id,
        publisherId: task.publisherId,
      };
      
      // Convert dateRange to separate start and end dates
      if (values.dateRange && values.dateRange.length === 2) {
        subtaskData.plannedStartDate = values.dateRange[0].toDate();
        subtaskData.plannedEndDate = values.dateRange[1].toDate();
      }
      
      await taskApi.createTask(subtaskData);
      message.success('子任务创建成功');
      setCreateSubtaskVisible(false);
      subtaskForm.resetFields();
      
      // Refresh subtasks
      const updatedSubtasks = await taskApi.getSubtasks(task.id);
      setSubtasks(updatedSubtasks);
    } catch (error) {
      console.error('Failed to create subtask:', error);
      message.error('创建子任务失败');
    } finally {
      setCreateSubtaskLoading(false);
    }
  };

  const handleDeleteSubtask = async (subtaskId: string, subtaskName: string) => {
    if (!task) return;
    
    Modal.confirm({
      title: '确认删除子任务',
      content: `确定要删除子任务"${subtaskName}"吗？此操作不可恢复。`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await taskApi.deleteTask(subtaskId);
          message.success('子任务删除成功');
          
          // Refresh subtasks
          const updatedSubtasks = await taskApi.getSubtasks(task.id);
          setSubtasks(updatedSubtasks);
          
          // Close popover if it's open for this subtask
          setSubtaskPopoverVisible(prev => ({
            ...prev,
            [subtaskId]: false
          }));
          setSubtaskInPopover(null);
          
          // Notify parent to refresh task data
          if (onTaskUpdated) {
            onTaskUpdated();
          }
        } catch (error) {
          console.error('Failed to delete subtask:', error);
          message.error('删除子任务失败');
        }
      },
    });
  };

  const handlePublishSubtask = (subtask: Task) => {
    setPublishingSubtask(subtask);
    publishSubtaskForm.setFieldsValue({
      visibility: 'public',
      bountyAmount: 0,
    });
    setPublishSubtaskVisible(true);
  };

  const handlePublishSubtaskSubmit = async (values: any) => {
    if (!publishingSubtask) return;
    
    try {
      setPublishSubtaskLoading(true);
      
      await taskApi.publishSubtask(publishingSubtask.id, {
        visibility: values.visibility,
        bountyAmount: values.bountyAmount,
        positionId: values.positionId || undefined,
      });
      
      message.success('子任务发布成功，现在可以被其他用户承接');
      setPublishSubtaskVisible(false);
      publishSubtaskForm.resetFields();
      setPublishingSubtask(null);
      
      // Refresh subtasks
      if (task) {
        const updatedSubtasks = await taskApi.getSubtasks(task.id);
        setSubtasks(updatedSubtasks);
      }
      
      // Notify parent to refresh task data
      if (onTaskUpdated) {
        onTaskUpdated();
      }
    } catch (error: any) {
      console.error('Failed to publish subtask:', error);
      message.error(error.response?.data?.error || '发布子任务失败');
    } finally {
      setPublishSubtaskLoading(false);
    }
  };

  const handleSearchUsers = async (keyword: string) => {
    if (!keyword) return [];
    try {
      const users = await userApi.searchUsers(keyword);
      return users.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        avatarUrl: u.avatarUrl
      }));
    } catch (error) {
      console.error('Failed to search users:', error);
      return [];
    }
  };

  const handleAddAssistant = async (values: { assistantId: string; bountyAllocation: number }) => {
    if (!task) return;
    setAddAssistantSubmitting(true);
    try {
      await taskApi.addAssistant(task.id, values.assistantId, values.bountyAllocation);
      message.success('已添加协作者');
      setAddAssistantModalVisible(false);
      const assistantsData = await taskApi.getAssistants(task.id);
      setAssistants(assistantsData);
    } catch (error) {
      message.error('添加协作者失败');
    } finally {
      setAddAssistantSubmitting(false);
    }
  };

  const handleUpdateProgress = async () => {
    if (!task) return;
    setUpdatingProgress(true);
    isUpdatingProgressRef.current = true; // Mark that we're updating
    try {
      console.log('[TaskDetailDrawer] handleUpdateProgress - updating progress to:', progressValue);
      const updated = await taskApi.updateProgress(task.id, progressValue);
      console.log('[TaskDetailDrawer] handleUpdateProgress - API returned full object:', updated);
      console.log('[TaskDetailDrawer] handleUpdateProgress - API returned progress:', updated?.progress);
      setProgressValue(updated.progress || progressValue);
      message.success('进度已更新');
      setTaskModified(true); // Mark task as modified
      
      // Call both callbacks
      if (onUpdateProgress) {
        console.log('[TaskDetailDrawer] handleUpdateProgress - calling onUpdateProgress');
        onUpdateProgress(updated);
      }
      
      // Immediately refresh the task list
      if (onTaskUpdated) {
        console.log('[TaskDetailDrawer] handleUpdateProgress - calling onTaskUpdated, type:', typeof onTaskUpdated);
        await onTaskUpdated(); // Wait for refresh to complete
        console.log('[TaskDetailDrawer] handleUpdateProgress - onTaskUpdated complete');
      } else {
        console.log('[TaskDetailDrawer] handleUpdateProgress - onTaskUpdated is undefined!');
      }
    } catch (error) {
      console.error('[TaskDetailDrawer] handleUpdateProgress - error:', error);
      message.error('更新进度失败');
    } finally {
      setUpdatingProgress(false);
      // Reset the flag after a short delay to allow the useEffect to run
      setTimeout(() => {
        isUpdatingProgressRef.current = false;
        console.log('[TaskDetailDrawer] handleUpdateProgress - reset isUpdatingProgressRef');
      }, 100);
    }
  };

  const handleEditTask = () => {
    if (!task) return;
    editForm.setFieldsValue({
      name: task.name,
      description: task.description,
      tags: task.tags,
      dateRange: task.plannedStartDate && task.plannedEndDate 
        ? [dayjs(task.plannedStartDate), dayjs(task.plannedEndDate)] 
        : null,
      estimatedHours: task.estimatedHours,
      complexity: task.complexity,
      priority: task.priority,
      visibility: task.visibility,
      positionId: task.positionId,
      projectGroupId: task.projectGroupId,
    });
    setEditModalVisible(true);
  };

  const handleEditSubmit = async () => {
    if (!task) return;
    try {
      const values = await editForm.validateFields();
      
      // Extract dates from RangePicker
      const updateData: any = {
        name: values.name,
        description: values.description,
        tags: values.tags,
        estimatedHours: values.estimatedHours,
        complexity: values.complexity,
        priority: values.priority,
        visibility: values.visibility,
        positionId: values.positionId || null,
        projectGroupId: values.projectGroupId || null,
      };
      
      // Convert dateRange to separate start and end dates
      if (values.dateRange && values.dateRange.length === 2) {
        updateData.plannedStartDate = values.dateRange[0].toDate();
        updateData.plannedEndDate = values.dateRange[1].toDate();
      }
      
      await taskApi.updateTask(task.id, updateData);
      message.success('任务更新成功');
      setEditModalVisible(false);
      editForm.resetFields();
      setTaskModified(true); // Mark task as modified
      
      // Immediately refresh the task list
      if (onTaskUpdated) {
        await onTaskUpdated(); // Wait for refresh to complete
      }
    } catch (error) {
      message.error('更新任务失败');
      console.error('Failed to update task:', error);
    }
  };

  const handleClose = () => {
    // Don't refresh again if we already refreshed during update
    // The taskModified flag is just for safety in case user closes quickly
    onClose();
  };

  const handleAcceptInvitation = async () => {
    if (!task) return;
    setInvitationActionLoading(true);
    try {
      await taskApi.acceptTaskAssignment(task.id);
      message.success('已接受任务');
      if (onTaskUpdated) {
        await onTaskUpdated();
      }
      onClose();
    } catch (error: any) {
      message.error(error.response?.data?.message || '接受任务失败');
      console.error('Failed to accept task:', error);
    } finally {
      setInvitationActionLoading(false);
    }
  };

  const handleRejectInvitation = () => {
    setRejectInvitationReason('');
    setRejectInvitationModalVisible(true);
  };

  const handleRejectInvitationConfirm = async () => {
    if (!task) return;
    setInvitationActionLoading(true);
    try {
      await taskApi.rejectTaskAssignment(task.id, rejectInvitationReason);
      message.success('已拒绝任务');
      setRejectInvitationModalVisible(false);
      setRejectInvitationReason('');
      if (onTaskUpdated) {
        await onTaskUpdated();
      }
      onClose();
    } catch (error: any) {
      message.error(error.response?.data?.message || '拒绝任务失败');
      console.error('Failed to reject task:', error);
    } finally {
      setInvitationActionLoading(false);
    }
  };

  const handleConvertToGroup = () => {
    // If task already has a group, just show the modal in view mode
    // Otherwise, show the modal in select mode
    setSelectedGroupId(task?.groupId || undefined);
    setConvertToGroupModalVisible(true);
  };

  const handleAddBonus = () => {
    bonusForm.resetFields();
    setBonusModalVisible(true);
  };

  const handleSubmitBonus = async (values: { amount: number; reason?: string }) => {
    if (!task) return;
    
    try {
      setAddingBonus(true);
      await taskApi.addBonusReward(task.id, values.amount, values.reason);
      
      message.success('额外奖赏发放成功');
      
      // 立即重置状态并关闭模态框
      setAddingBonus(false);
      setBonusModalVisible(false);
      bonusForm.resetFields();
      
      // 刷新奖赏记录
      loadBonusRewards();
      
    } catch (error: any) {
      setAddingBonus(false);
      message.error(error.response?.data?.error || '发放额外奖赏失败');
    }
  };

  const handleConvertToGroupConfirm = async () => {
    // If task already has a group, just close the modal (view mode)
    if (task?.groupId) {
      setConvertToGroupModalVisible(false);
      return;
    }

    // Otherwise, proceed with conversion
    if (!task || !selectedGroupId) {
      message.error('请选择要关联的组群');
      return;
    }

    setConvertingToGroup(true);
    try {
      await groupApi.convertTaskToGroupTask(selectedGroupId, task.id);
      message.success('任务已加入群组');
      setConvertToGroupModalVisible(false);
      setSelectedGroupId(undefined);
      if (onTaskUpdated) {
        await onTaskUpdated();
      }
    } catch (error: any) {
      message.error(error.response?.data?.error || '转换失败');
      console.error('Failed to convert task to group task:', error);
    } finally {
      setConvertingToGroup(false);
    }
  };

  const isPublisher = user && task && user.id === task.publisherId;
  const isInvitedUser = user && task && task.invitedUserId === user.id;
  const isAssignee = user && task && user.id === task.assigneeId;

  const renderDetails = () => {
    if (!task) return null;
    return (
      <div>
        <InfoRow label="状态">
          <StatusTag value={task.groupName && (task.status === TaskStatus.NOT_STARTED || task.status === TaskStatus.AVAILABLE) ? TaskStatus.IN_PROGRESS : task.status} />
        </InfoRow>

        {/* 显示邀请状态 */}
        {task.invitedUserId && task.invitationStatus && (
          <InfoRow label="邀请状态">
            <Space>
              {task.invitationStatus === InvitationStatus.PENDING && (
                <Tag color="orange" icon={<ClockCircleOutlined />}>待接受</Tag>
              )}
              {task.invitationStatus === InvitationStatus.ACCEPTED && (
                <Tag color="green" icon={<CheckOutlined />}>已接受</Tag>
              )}
              {task.invitationStatus === InvitationStatus.REJECTED && (
                <Tag color="red" icon={<CloseOutlined />}>已拒绝</Tag>
              )}
              {isInvitedUser && task.invitationStatus === InvitationStatus.PENDING && (
                <Space>
                  <Button
                    type="primary"
                    size="small"
                    icon={<CheckOutlined />}
                    onClick={handleAcceptInvitation}
                    loading={invitationActionLoading}
                  >
                    接受
                  </Button>
                  <Button
                    danger
                    size="small"
                    icon={<CloseOutlined />}
                    onClick={handleRejectInvitation}
                    loading={invitationActionLoading}
                  >
                    拒绝
                  </Button>
                </Space>
              )}
            </Space>
          </InfoRow>
        )}

        <InfoRow label="任务类型">
          {task.depth === 0 ? (
            <Tag color="green">顶级任务</Tag>
          ) : (
            <Tag color="blue">子任务</Tag>
          )}
        </InfoRow>

        {task.publisher && (
          <InfoRow label="发布者">
            <Space>
              <UserChip avatarUrl={task.publisher.avatarUrl} username={task.publisher.username} tip={task.publisher.email} size={32} />
              <Tag>{task.publisher.email}</Tag>
            </Space>
          </InfoRow>
        )}

        <InfoRow label="承接者 / 协作者">
          <Space wrap>
            {/* Show assignee user if exists, otherwise show fallback user, otherwise show "未分配" */}
            {task.assignee ? (
              <>
                <UserChip
                  avatarUrl={task.assignee.avatarUrl}
                  username={task.assignee.username}
                  tip="承接者"
                  size={32}
                  highlight
                />
                {task.groupName && (
                  <Tag color="geekblue" icon={<TeamOutlined />} style={{ padding: '4px 10px', fontSize: '14px' }}>
                    {task.groupName}
                  </Tag>
                )}
              </>
            ) : assigneeFallback ? (
              <>
                <UserChip
                  avatarUrl={assigneeFallback.avatarUrl}
                  username={assigneeFallback.username}
                  tip="承接者"
                  size={32}
                  highlight
                />
                {task.groupName && (
                  <Tag color="geekblue" icon={<TeamOutlined />} style={{ padding: '4px 10px', fontSize: '14px' }}>
                    {task.groupName}
                  </Tag>
                )}
              </>
            ) : (
              <>
                <Text type="secondary" style={{ marginRight: 16 }}>未分配</Text>
                {task.groupName && (
                  <Tag color="geekblue" icon={<TeamOutlined />} style={{ padding: '4px 10px', fontSize: '14px' }}>
                    {task.groupName}
                  </Tag>
                )}
              </>
            )}
            {assistants.map(assistant => (
              <UserChip
                key={assistant.id}
                avatarUrl={assistant.avatar_url}
                username={assistant.username}
                tip={`协作者 (赏金: ${assistant.bounty_allocation}%)`}
                extra={<Text type="secondary" style={{ fontSize: 12 }}>({assistant.bounty_allocation}%)</Text>}
              />
            ))}

            <Tooltip title="添加协作者">
              <Button
                size="small"
                type="text"
                icon={<PlusOutlined />}
                onClick={() => setAddAssistantModalVisible(true)}
                style={{ padding: 4 }}
              />
            </Tooltip>
          </Space>
        </InfoRow>
        
        <InfoRow label="描述">
          <Text style={{ color: '#666' }}>{task.description || '无描述'}</Text>
        </InfoRow>

        {task.groupName && (
          <InfoRow label="所属组群">
            <Tag color="purple" icon={<TeamOutlined />}>{task.groupName}</Tag>
          </InfoRow>
        )}

        {task.projectGroupName && (
          <InfoRow label="项目分组">
            <Tag color="geekblue">{task.projectGroupName}</Tag>
          </InfoRow>
        )}

        <InfoRow label="可见性">
          {task.visibility === Visibility.PUBLIC && (
            <Tag color="green" icon={<TeamOutlined />}>公开</Tag>
          )}
          {task.visibility === Visibility.POSITION_ONLY && (
            <Tag color="orange">仅特定岗位</Tag>
          )}
          {task.visibility === Visibility.PRIVATE && (
            <Tag color="red">私有</Tag>
          )}
        </InfoRow>
        
        <Divider style={{ margin: '16px 0' }} />
        
        <InfoRow label="赏金">
          <Text strong style={{ fontSize: 16, color: '#faad14' }}>
            {formatBounty(task.bountyAmount)}
          </Text>
        </InfoRow>
        
        <InfoRow label="进度">
          <ProgressEditor
            value={progressValue}
            onChange={setProgressValue}
            onSave={handleUpdateProgress}
            loading={updatingProgress}
          />
        </InfoRow>
        
        <Divider style={{ margin: '16px 0' }} />
        
        <InfoRow label="复杂度">
          <Tag color="blue">{task.complexity}/5</Tag>
        </InfoRow>
        
        <InfoRow label="优先级">
          <Tag color="orange">{task.priority}/5</Tag>
        </InfoRow>
        
        <InfoRow label="预估工时">
          <Text>{task.estimatedHours}小时</Text>
        </InfoRow>
        
        <Divider style={{ margin: '16px 0' }} />
        
        <InfoRow label="计划开始">
          <Text>{dayjs(task.plannedStartDate).format('YYYY-MM-DD HH:mm')}</Text>
        </InfoRow>
        
        <InfoRow label="计划结束">
          <Text>{dayjs(task.plannedEndDate).format('YYYY-MM-DD HH:mm')}</Text>
        </InfoRow>
        
        {task.actualStartDate && (
          <InfoRow label="实际开始">
            <Text>{dayjs(task.actualStartDate).format('YYYY-MM-DD HH:mm')}</Text>
          </InfoRow>
        )}
        
        {task.actualEndDate && (
          <InfoRow label="实际结束">
            <Text>{dayjs(task.actualEndDate).format('YYYY-MM-DD HH:mm')}</Text>
          </InfoRow>
        )}
        
        {task.tags && task.tags.length > 0 && (
          <>
            <Divider style={{ margin: '16px 0' }} />
            <InfoRow label="标签">
              <Space wrap>
                {task.tags.map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </Space>
            </InfoRow>
          </>
        )}
        
        <Divider style={{ margin: '16px 0' }} />
        
        <InfoRow label="创建时间">
          <Text type="secondary">{dayjs(task.createdAt).format('YYYY-MM-DD HH:mm')}</Text>
        </InfoRow>
      </div>
    );
  };

  // Note: direct acceptance of subtasks has been disabled per new rules;
  // assignment of subtasks should be handled by parent task or via explicit assignment flows.

  const [subtaskInPopover, setSubtaskInPopover] = useState<Task | null>(null);
  const [loadingSubtaskDetail, setLoadingSubtaskDetail] = useState(false);
  const [subtaskProgressValue, setSubtaskProgressValue] = useState<number>(0);
  const [updatingSubtaskProgress, setUpdatingSubtaskProgress] = useState(false);
  const [editSubtaskModalVisible, setEditSubtaskModalVisible] = useState(false);
  const [editSubtaskForm] = Form.useForm();

  const handleSubtaskClick = async (subtaskId: string) => {
    try {
      setLoadingSubtaskDetail(true);
      const subtaskData = await taskApi.getTask(subtaskId);
      setSubtaskInPopover(subtaskData);
      setSubtaskProgressValue(subtaskData.progress || 0);
    } catch (error) {
      message.error('加载子任务详情失败');
      console.error(error);
    } finally {
      setLoadingSubtaskDetail(false);
    }
  };

  const handleUpdateSubtaskProgress = async () => {
    if (!subtaskInPopover) return;
    setUpdatingSubtaskProgress(true);
    try {
      const updated = await taskApi.updateProgress(subtaskInPopover.id, subtaskProgressValue);
      setSubtaskInPopover(updated);
      setSubtaskProgressValue(updated.progress || subtaskProgressValue);
      message.success('进度已更新');
      
      // Refresh parent task's subtasks list
      if (task) {
        const updatedSubtasks = await taskApi.getSubtasks(task.id);
        setSubtasks(updatedSubtasks);
      }
      
      // Refresh main task list
      if (onTaskUpdated) {
        await onTaskUpdated();
      }
    } catch (error) {
      console.error('Failed to update subtask progress:', error);
      message.error('更新进度失败');
    } finally {
      setUpdatingSubtaskProgress(false);
    }
  };

  const handleCompleteSubtask = async (subtaskId: string) => {
    if (!onCompleteTask) return;
    try {
      await onCompleteTask(subtaskId);
      message.success('子任务已完成');
      
      // Close popover and refresh
      setSubtaskPopoverVisible({});
      setSubtaskInPopover(null);
      
      // Refresh parent task's subtasks list
      if (task) {
        const updatedSubtasks = await taskApi.getSubtasks(task.id);
        setSubtasks(updatedSubtasks);
      }
      
      // Refresh main task list
      if (onTaskUpdated) {
        await onTaskUpdated();
      }
    } catch (error) {
      console.error('Failed to complete subtask:', error);
      message.error('完成任务失败');
    }
  };

  const handleEditSubtask = () => {
    if (!subtaskInPopover || !task) return;
    editSubtaskForm.setFieldsValue({
      name: subtaskInPopover.name,
      description: subtaskInPopover.description,
      tags: subtaskInPopover.tags,
      dateRange: subtaskInPopover.plannedStartDate && subtaskInPopover.plannedEndDate 
        ? [dayjs(subtaskInPopover.plannedStartDate), dayjs(subtaskInPopover.plannedEndDate)] 
        : null,
      estimatedHours: subtaskInPopover.estimatedHours,
      complexity: subtaskInPopover.complexity,
      priority: subtaskInPopover.priority,
    });
    setEditSubtaskModalVisible(true);
  };

  const handleEditSubtaskSubmit = async () => {
    if (!subtaskInPopover || !task) return;
    try {
      const values = await editSubtaskForm.validateFields();
      
      // Extract dates from RangePicker
      const updateData: any = {
        name: values.name,
        description: values.description,
        tags: values.tags,
        estimatedHours: values.estimatedHours,
        complexity: values.complexity,
        priority: values.priority,
      };
      
      // Convert dateRange to separate start and end dates
      if (values.dateRange && values.dateRange.length === 2) {
        updateData.plannedStartDate = values.dateRange[0].toDate();
        updateData.plannedEndDate = values.dateRange[1].toDate();
      }
      
      await taskApi.updateTask(subtaskInPopover.id, updateData);
      message.success('子任务更新成功');
      setEditSubtaskModalVisible(false);
      editSubtaskForm.resetFields();
      
      // Refresh subtask data in popover
      const updatedSubtask = await taskApi.getTask(subtaskInPopover.id);
      setSubtaskInPopover(updatedSubtask);
      
      // Refresh parent task's subtasks list
      const updatedSubtasks = await taskApi.getSubtasks(task.id);
      setSubtasks(updatedSubtasks);
      
      // Refresh main task list
      if (onTaskUpdated) {
        await onTaskUpdated();
      }
    } catch (error) {
      message.error('更新子任务失败');
      console.error('Failed to update subtask:', error);
    }
  };

  const renderSubtaskPopoverContent = () => {
    if (loadingSubtaskDetail) {
      return (
        <div style={{ width: 600, padding: 40, textAlign: 'center' }}>
          <Space direction="vertical">
            <div>加载中...</div>
          </Space>
        </div>
      );
    }

    if (!subtaskInPopover) {
      return (
        <div style={{ width: 600, padding: 40, textAlign: 'center' }}>
          <Space direction="vertical">
            <div>加载中...</div>
          </Space>
        </div>
      );
    }

    // Render full task detail content in popover
    const subtaskItems = [
      {
        key: 'details',
        label: '详情',
        children: (
          <div>
            <InfoRow label="状态">
              <StatusTag value={subtaskInPopover.groupName && (subtaskInPopover.status === TaskStatus.NOT_STARTED || subtaskInPopover.status === TaskStatus.AVAILABLE) ? TaskStatus.IN_PROGRESS : subtaskInPopover.status} />
            </InfoRow>

            <InfoRow label="任务类型">
              <Tag color="blue">子任务</Tag>
            </InfoRow>

            {subtaskInPopover.publisher && (
              <InfoRow label="发布者">
                <Space>
                  <UserChip avatarUrl={subtaskInPopover.publisher.avatarUrl} username={subtaskInPopover.publisher.username} tip={subtaskInPopover.publisher.email} size={28} />
                </Space>
              </InfoRow>
            )}

            <InfoRow label="承接者">
              {subtaskInPopover.assignee ? (
                <UserChip
                  avatarUrl={subtaskInPopover.assignee.avatarUrl}
                  username={subtaskInPopover.assignee.username}
                  tip="承接者"
                  size={28}
                />
              ) : (
                <Text type="secondary">未分配</Text>
              )}
            </InfoRow>
            
            <InfoRow label="描述">
              <Text style={{ color: '#666' }}>{subtaskInPopover.description || '无描述'}</Text>
            </InfoRow>

            {subtaskInPopover.projectGroupName && (
              <InfoRow label="项目分组">
                <Tag color="geekblue">{subtaskInPopover.projectGroupName}</Tag>
              </InfoRow>
            )}

            <InfoRow label="可见性">
              {subtaskInPopover.visibility === Visibility.PUBLIC && (
                <Tag color="green" icon={<TeamOutlined />}>公开</Tag>
              )}
              {subtaskInPopover.visibility === Visibility.POSITION_ONLY && (
                <Tag color="orange">仅特定岗位</Tag>
              )}
              {subtaskInPopover.visibility === Visibility.PRIVATE && (
                <Tag color="red">私有</Tag>
              )}
            </InfoRow>
            
            <Divider style={{ margin: '12px 0' }} />
            
            <InfoRow label="赏金">
              <Text strong style={{ fontSize: 14, color: '#faad14' }}>
                {formatBounty(subtaskInPopover.bountyAmount)}
              </Text>
            </InfoRow>
            
            <InfoRow label="进度">
              <ProgressEditor
                value={subtaskProgressValue}
                onChange={setSubtaskProgressValue}
                onSave={handleUpdateSubtaskProgress}
                loading={updatingSubtaskProgress}
              />
            </InfoRow>
            
            <Divider style={{ margin: '12px 0' }} />
            
            <InfoRow label="复杂度">
              <Tag color="blue">{subtaskInPopover.complexity}/5</Tag>
            </InfoRow>
            
            <InfoRow label="优先级">
              <Tag color="orange">{subtaskInPopover.priority}/5</Tag>
            </InfoRow>
            
            <InfoRow label="预估工时">
              <Text>{subtaskInPopover.estimatedHours}小时</Text>
            </InfoRow>
            
            <Divider style={{ margin: '12px 0' }} />
            
            <InfoRow label="计划开始">
              <Text>{dayjs(subtaskInPopover.plannedStartDate).format('YYYY-MM-DD HH:mm')}</Text>
            </InfoRow>
            
            <InfoRow label="计划结束">
              <Text>{dayjs(subtaskInPopover.plannedEndDate).format('YYYY-MM-DD HH:mm')}</Text>
            </InfoRow>
            
            {subtaskInPopover.tags && subtaskInPopover.tags.length > 0 && (
              <>
                <Divider style={{ margin: '12px 0' }} />
                <InfoRow label="标签">
                  <Space wrap>
                    {subtaskInPopover.tags.map((tag) => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                  </Space>
                </InfoRow>
              </>
            )}
          </div>
        ),
      },
      {
        key: 'comments',
        label: '评论',
        children: <TaskComments taskId={subtaskInPopover.id} task={subtaskInPopover} />,
      },
      {
        key: 'attachments',
        label: '附件',
        children: <TaskAttachments taskId={subtaskInPopover.id} task={subtaskInPopover} />,
      },
    ];

    // Render action buttons for subtask
    const isSubtaskAssignee = user && subtaskInPopover.assigneeId === user.id;
    const isSubtaskPublisher = user && subtaskInPopover.publisherId === user.id;
    
    const renderSubtaskActions = () => {
      const buttons: React.ReactNode[] = [];

      // Show complete and abandon buttons if user is assignee and task is in progress
      if (isSubtaskAssignee && subtaskInPopover.status === TaskStatus.IN_PROGRESS) {
        if (onCompleteTask) {
          buttons.push(
            <Button
              key="complete"
              type="primary"
              size="small"
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
              onClick={() => handleCompleteSubtask(subtaskInPopover.id)}
            >
              完成
            </Button>
          );
        }
      }

      // Show edit button if user is publisher
      if (isSubtaskPublisher) {
        buttons.push(
          <Button
            key="edit"
            size="small"
            icon={<EditOutlined />}
            onClick={handleEditSubtask}
          >
            编辑
          </Button>
        );
      }

      return buttons.length > 0 ? (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0', textAlign: 'right' }}>
          <Space>{buttons}</Space>
        </div>
      ) : null;
    };

    return (
      <div style={{ width: 600, maxHeight: '70vh', overflow: 'auto' }}>
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Text strong style={{ fontSize: 16 }}>{subtaskInPopover.name}</Text>
          <Tag color="blue">子任务</Tag>
        </div>
        <Tabs defaultActiveKey="details" items={subtaskItems} size="small" />
        {renderSubtaskActions()}
      </div>
    );
  };

  const renderSubtasks = () => {
    // 创建子任务列表视图
    const subtaskListView = (
      <List
        dataSource={subtasks}
        locale={{ emptyText: '暂无子任务' }}
        renderItem={(sub) => (
          <List.Item
            actions={[
              <Popover
                key="popover"
                content={renderSubtaskPopoverContent()}
                title={null}
                trigger="click"
                open={subtaskPopoverVisible[sub.id] || false}
                onOpenChange={(visible) => {
                  // Update visibility state first
                  setSubtaskPopoverVisible(prev => ({
                    ...prev,
                    [sub.id]: visible
                  }));
                  
                  if (visible) {
                    // Fetch subtask data when opening
                    handleSubtaskClick(sub.id);
                  } else {
                    // Clear subtask data when closing
                    setSubtaskInPopover(null);
                  }
                }}
                placement="left"
                overlayStyle={{ maxWidth: '650px' }}
              >
                <Button 
                  type="link" 
                  size="small"
                  icon={<EyeOutlined />}
                >
                  查看详情
                </Button>
              </Popover>,
              // Show publish button only if subtask is not published yet
              !sub.isPublished && sub.assigneeId ? (
                <Button
                  key="publish"
                  type="link"
                  size="small"
                  icon={<TeamOutlined />}
                  onClick={() => handlePublishSubtask(sub)}
                >
                  发布
                </Button>
              ) : null,
              <Button
                key="delete"
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteSubtask(sub.id, sub.name)}
              >
                删除
              </Button>,
            ].filter(Boolean)}
          >
            <List.Item.Meta
              title={
                <Space size="small">
                  <Badge color="blue" text={sub.name} />
                  <StatusTag value={sub.status} />
                  {typeof sub.priority === 'number' && <Tag color="gold">P{sub.priority}</Tag>}
                </Space>
              }
              description={
                <Space size="middle" wrap>
                  <span>
                    计划: {sub.plannedStartDate ? dayjs(sub.plannedStartDate).format('MM/DD') : '--'}
                    {' '}~ {sub.plannedEndDate ? dayjs(sub.plannedEndDate).format('MM/DD') : '--'}
                  </span>
                  <Space size="small">
                    进度: <Progress percent={sub.progress} size="small" steps={5} strokeColor="#52c41a" style={{ width: 60 }} />
                  </Space>
                  {sub.assignee ? (
                    <Space size={4}>
                      <UserChip 
                        username={sub.assignee.username} 
                        avatarUrl={sub.assignee.avatarUrl} 
                        size={20} 
                      />
                    </Space>
                  ) : (
                      <Tag>待指派</Tag>
                  )}
                </Space>
              }
            />
          </List.Item>
        )}
      />
    );

    return (
      <Card 
        bordered={false} 
        bodyStyle={{ padding: 0 }}
      >
        <TaskViews
          tasks={subtasks}
          loading={false}
          listView={subtaskListView}
          extra={
            // Only show "Create Subtask" button for top-level tasks (depth 0)
            // System only allows 2 levels: depth 0 (parent) and depth 1 (subtask)
            // NEW REQUIREMENT: Button is disabled if task has no assignee
            task && task.depth === 0 ? (
              <Button 
                type="primary" 
                size="small" 
                icon={<PlusOutlined />}
                onClick={() => setCreateSubtaskVisible(true)}
                disabled={!task.assigneeId}
                title={!task.assigneeId ? '母任务必须先被承接才能创建子任务' : ''}
              >
                创建子任务
              </Button>
            ) : null
          }
        />
      </Card>
    );
  };

  const items = task ? [
    {
      key: 'details',
      label: '详情',
      children: renderDetails(),
    },
    // Only show "子任务" tab for top-level tasks (depth 0)
    // Subtasks (depth 1) cannot have their own subtasks
    ...(task.depth === 0 ? [{
      key: 'subtasks',
      label: '子任务',
      children: renderSubtasks(),
    }] : []),
    {
      key: 'comments',
      label: '评论',
      children: <TaskComments taskId={task.id} task={task} bonusRewards={bonusRewards} loadingBonusRewards={loadingBonusRewards} />,
    },
    {
      key: 'attachments',
      label: '附件',
      children: <TaskAttachments taskId={task.id} task={task} />,
    },
  ] : [];

  const renderFooter = () => {
    if (!task) return <Button onClick={handleClose}>关闭</Button>;

    const buttons: React.ReactNode[] = [];

    // 如果是承接者且任务进行中，显示完成按钮
    if (isAssignee && task.status === TaskStatus.IN_PROGRESS) {
      if (onCompleteTask) {
        buttons.push(
          <Button
            key="complete"
            type="primary"
            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
            onClick={() => onCompleteTask(task.id)}
          >
            完成
          </Button>
        );
      }
    }

    // 如果是管理员且任务已完成，显示额外奖赏按钮
    if (
      (user?.role === 'super_admin' || user?.role === 'position_admin') &&
      task.status === TaskStatus.COMPLETED &&
      task.assigneeId
    ) {
      // 检查当前管理员是否已经给过奖赏
      const hasGivenBonus = bonusRewards.some(reward => reward.from_user_id === user?.id);
      
      buttons.push(
        <Button
          key="bonus"
          type="default"
          style={{ borderColor: '#faad14', color: '#faad14' }}
          onClick={handleAddBonus}
          disabled={hasGivenBonus}
        >
          {hasGivenBonus ? '已奖赏' : '额外奖赏'}
        </Button>
      );
    }

    // 如果是承接者，显示群组按钮（已关联显示群组信息，未关联可以加入）
    if (isAssignee && userGroups.length > 0) {
      buttons.push(
        <Button
          key="convertToGroup"
          icon={<TeamOutlined />}
          onClick={handleConvertToGroup}
        >
          群组
        </Button>
      );
    }

    // 如果是发布者，显示编辑按钮
    if (isPublisher) {
      buttons.push(
        <Button
          key="edit"
          icon={<EditOutlined />}
          onClick={handleEditTask}
        >
          编辑
        </Button>
      );
    }

    // 始终显示关闭按钮
    buttons.push(
      <Button key="close" onClick={handleClose}>
        关闭
      </Button>
    );

    return <Space>{buttons}</Space>;
  };

  return (
    <Modal
      title={
        <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          {task?.name || '任务详情'}
          {task && task.depth === 1 && (
            <Tag color="blue" style={{ marginLeft: 8 }}>子任务</Tag>
          )}
        </Title>
      }
      open={visible}
      onCancel={handleClose}
      width={700}
      footer={renderFooter()}
    >
      {task && (
        <Tabs defaultActiveKey="details" items={items} />
      )}

      {/* 添加协作者 */}
      <AddAssistantModal
        open={addAssistantModalVisible}
        onCancel={() => setAddAssistantModalVisible(false)}
        onSubmit={handleAddAssistant}
        loading={addAssistantSubmitting}
        searchUsers={handleSearchUsers}
      />

      {/* 编辑任务 */}
      <Modal
        title="编辑任务"
        open={editModalVisible}
        onOk={handleEditSubmit}
        onCancel={() => {
          setEditModalVisible(false);
          editForm.resetFields();
        }}
        width={600}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            name="name"
            label="任务名称"
            rules={[{ required: true, message: '请输入任务名称' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="任务描述"
            rules={[{ required: true, message: '请输入任务描述' }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          
          <Form.Item name="tags" label="标签">
            <Select mode="tags" placeholder="输入标签后按回车" />
          </Form.Item>
          
          <Form.Item
            name="dateRange"
            label="计划时间"
            rules={[{ required: true, message: '请选择计划时间' }]}
          >
            <DatePicker.RangePicker style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="estimatedHours"
            label="预估工时（小时）"
            rules={[{ required: true, message: '请输入预估工时' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="complexity"
            label="复杂度"
            rules={[{ required: true, message: '请选择复杂度' }]}
          >
            <Select>
              <Select.Option value={1}>1 - 非常简单</Select.Option>
              <Select.Option value={2}>2 - 简单</Select.Option>
              <Select.Option value={3}>3 - 中等</Select.Option>
              <Select.Option value={4}>4 - 复杂</Select.Option>
              <Select.Option value={5}>5 - 非常复杂</Select.Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="priority"
            label="优先级"
            rules={[{ required: true, message: '请选择优先级' }]}
          >
            <Select>
              <Select.Option value={1}>1 - 最低</Select.Option>
              <Select.Option value={2}>2 - 低</Select.Option>
              <Select.Option value={3}>3 - 中</Select.Option>
              <Select.Option value={4}>4 - 高</Select.Option>
              <Select.Option value={5}>5 - 最高</Select.Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="visibility"
            label="可见性"
            rules={[{ required: true, message: '请选择可见性' }]}
          >
            <Select>
              <Select.Option value={Visibility.PUBLIC}>公开</Select.Option>
              <Select.Option value={Visibility.POSITION_ONLY}>仅特定岗位</Select.Option>
              <Select.Option value={Visibility.PRIVATE}>私有</Select.Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.visibility !== currentValues.visibility}
          >
            {({ getFieldValue }) => {
              const visibility = getFieldValue('visibility');
              return (
                <Form.Item
                  name="positionId"
                  label="岗位限制"
                  rules={[{ 
                    required: visibility === Visibility.POSITION_ONLY, 
                    message: '当可见性为"仅特定岗位"时，必须选择岗位' 
                  }]}
                  tooltip="选择岗位后，只有具备该岗位的用户才能承接此任务。如果可见性为'仅特定岗位'，则只有具备该岗位的用户能看到此任务。"
                >
                  <Select allowClear placeholder="选择岗位（可选）">
                    {positions.map(p => (
                      <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              );
            }}
          </Form.Item>
          
          <Form.Item
            name="projectGroupId"
            label="项目分组"
            tooltip="将任务归类到项目分组中，便于管理和查看"
          >
            <Select 
              allowClear 
              placeholder="选择项目分组（可选）"
              dropdownRender={(menu) => (
                <>
                  {menu}
                  <Divider style={{ margin: '8px 0' }} />
                  <Space style={{ padding: '0 8px 4px' }}>
                    <Input
                      placeholder="输入新分组名称"
                      value={newProjectGroupName}
                      onChange={(e) => setNewProjectGroupName(e.target.value)}
                      onPressEnter={handleAddProjectGroup}
                      style={{ flex: 1 }}
                    />
                    <Button
                      type="text"
                      icon={<PlusOutlined />}
                      onClick={handleAddProjectGroup}
                      loading={addingProjectGroup}
                    >
                      新增
                    </Button>
                  </Space>
                </>
              )}
            >
              {projectGroups.map(pg => (
                <Select.Option key={pg.id} value={pg.id}>{pg.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="创建子任务"
        open={createSubtaskVisible}
        onCancel={() => {
          setCreateSubtaskVisible(false);
          subtaskForm.resetFields();
        }}
        onOk={() => subtaskForm.submit()}
        width={600}
      >
        {task && (
          <>
            <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f0f2f5' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <strong>母任务约束：</strong>
              </Text>
              <div style={{ marginTop: 8 }}>
                {task.assignee && (
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      • 负责人：{task.assignee.username}（子任务将自动继承）
                    </Text>
                  </div>
                )}
                {task.plannedStartDate && task.plannedEndDate && (
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      • 时间范围：{dayjs(task.plannedStartDate).format('YYYY-MM-DD')} ~ {dayjs(task.plannedEndDate).format('YYYY-MM-DD')}
                    </Text>
                  </div>
                )}
                {task.estimatedHours && (
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      • 最大工时：{task.estimatedHours} 小时
                    </Text>
                  </div>
                )}
              </div>
            </Card>
            <Form
              form={subtaskForm}
              layout="vertical"
              onFinish={handleCreateSubtask}
            >
              <Form.Item
                name="name"
                label="任务名称"
                rules={[{ required: true, message: '请输入任务名称' }]}
              >
                <Input />
              </Form.Item>

              <Form.Item
                name="description"
                label="任务描述"
                rules={[{ required: true, message: '请输入任务描述' }]}
              >
                <Input.TextArea rows={4} />
              </Form.Item>
              
              <Form.Item name="tags" label="标签">
                <Select mode="tags" placeholder="输入标签后按回车" />
              </Form.Item>

              <Form.Item
                name="dateRange"
                label="计划时间"
                rules={[
                  { required: true, message: '请选择计划时间' },
                  {
                    validator: (_, value) => {
                      if (!value || value.length !== 2) return Promise.resolve();
                      if (!task.plannedStartDate || !task.plannedEndDate) return Promise.resolve();
                      
                      const subtaskStart = dayjs(value[0]);
                      const subtaskEnd = dayjs(value[1]);
                      const parentStart = dayjs(task.plannedStartDate);
                      const parentEnd = dayjs(task.plannedEndDate);
                      
                      if (subtaskStart.isBefore(parentStart)) {
                        return Promise.reject(new Error(`开始时间不能早于母任务开始时间 (${parentStart.format('YYYY-MM-DD')})`));
                      }
                      
                      if (subtaskEnd.isAfter(parentEnd)) {
                        return Promise.reject(new Error(`结束时间不能晚于母任务结束时间 (${parentEnd.format('YYYY-MM-DD')})`));
                      }
                      
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <DatePicker.RangePicker 
                  style={{ width: '100%' }}
                  disabledDate={(current) => {
                    if (!task.plannedStartDate || !task.plannedEndDate) return false;
                    const parentStart = dayjs(task.plannedStartDate).startOf('day');
                    const parentEnd = dayjs(task.plannedEndDate).endOf('day');
                    return current && (current.isBefore(parentStart) || current.isAfter(parentEnd));
                  }}
                />
              </Form.Item>

              <Form.Item
                name="estimatedHours"
                label="预估工时（小时）"
                rules={[
                  { required: true, message: '请输入预估工时' },
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.resolve();
                      if (!task.estimatedHours) return Promise.resolve();
                      
                      if (value > task.estimatedHours) {
                        return Promise.reject(new Error(`工时不能超过母任务工时 (${task.estimatedHours}h)`));
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <InputNumber 
                  min={0} 
                  max={task.estimatedHours || undefined}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              
              <Form.Item
                name="complexity"
                label="复杂度"
                rules={[{ required: true, message: '请选择复杂度' }]}
              >
                <Select>
                  <Select.Option value={1}>1 - 非常简单</Select.Option>
                  <Select.Option value={2}>2 - 简单</Select.Option>
                  <Select.Option value={3}>3 - 中等</Select.Option>
                  <Select.Option value={4}>4 - 复杂</Select.Option>
                  <Select.Option value={5}>5 - 非常复杂</Select.Option>
                </Select>
              </Form.Item>
              
              <Form.Item
                name="priority"
                label="优先级"
                rules={[{ required: true, message: '请选择优先级' }]}
              >
                <Select>
                  <Select.Option value={1}>1 - 最低</Select.Option>
                  <Select.Option value={2}>2 - 低</Select.Option>
                  <Select.Option value={3}>3 - 中</Select.Option>
                  <Select.Option value={4}>4 - 高</Select.Option>
                  <Select.Option value={5}>5 - 最高</Select.Option>
                </Select>
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>

      {/* 编辑子任务 */}
      <Modal
        title="编辑子任务"
        open={editSubtaskModalVisible}
        onOk={handleEditSubtaskSubmit}
        onCancel={() => {
          setEditSubtaskModalVisible(false);
          editSubtaskForm.resetFields();
        }}
        width={600}
      >
        {subtaskInPopover && task && (
          <>
            <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f0f2f5' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <strong>母任务约束：</strong>
              </Text>
              <div style={{ marginTop: 8 }}>
                {task.plannedStartDate && task.plannedEndDate && (
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      • 时间范围：{dayjs(task.plannedStartDate).format('YYYY-MM-DD')} ~ {dayjs(task.plannedEndDate).format('YYYY-MM-DD')}
                    </Text>
                  </div>
                )}
                {task.estimatedHours && (
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      • 最大工时：{task.estimatedHours} 小时
                    </Text>
                  </div>
                )}
              </div>
            </Card>
            <Form form={editSubtaskForm} layout="vertical">
              <Form.Item
                name="name"
                label="任务名称"
                rules={[{ required: true, message: '请输入任务名称' }]}
              >
                <Input />
              </Form.Item>

              <Form.Item
                name="description"
                label="任务描述"
                rules={[{ required: true, message: '请输入任务描述' }]}
              >
                <Input.TextArea rows={4} />
              </Form.Item>
              
              <Form.Item name="tags" label="标签">
                <Select mode="tags" placeholder="输入标签后按回车" />
              </Form.Item>

              <Form.Item
                name="dateRange"
                label="计划时间"
                rules={[
                  { required: true, message: '请选择计划时间' },
                  {
                    validator: (_, value) => {
                      if (!value || value.length !== 2) return Promise.resolve();
                      if (!task.plannedStartDate || !task.plannedEndDate) return Promise.resolve();
                      
                      const subtaskStart = dayjs(value[0]);
                      const subtaskEnd = dayjs(value[1]);
                      const parentStart = dayjs(task.plannedStartDate);
                      const parentEnd = dayjs(task.plannedEndDate);
                      
                      if (subtaskStart.isBefore(parentStart)) {
                        return Promise.reject(new Error(`开始时间不能早于母任务开始时间 (${parentStart.format('YYYY-MM-DD')})`));
                      }
                      
                      if (subtaskEnd.isAfter(parentEnd)) {
                        return Promise.reject(new Error(`结束时间不能晚于母任务结束时间 (${parentEnd.format('YYYY-MM-DD')})`));
                      }
                      
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <DatePicker.RangePicker 
                  style={{ width: '100%' }}
                  disabledDate={(current) => {
                    if (!task.plannedStartDate || !task.plannedEndDate) return false;
                    const parentStart = dayjs(task.plannedStartDate).startOf('day');
                    const parentEnd = dayjs(task.plannedEndDate).endOf('day');
                    return current && (current.isBefore(parentStart) || current.isAfter(parentEnd));
                  }}
                />
              </Form.Item>

              <Form.Item
                name="estimatedHours"
                label="预估工时（小时）"
                rules={[
                  { required: true, message: '请输入预估工时' },
                  {
                    validator: (_, value) => {
                      if (!value) return Promise.resolve();
                      if (!task.estimatedHours) return Promise.resolve();
                      
                      if (value > task.estimatedHours) {
                        return Promise.reject(new Error(`工时不能超过母任务工时 (${task.estimatedHours}h)`));
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <InputNumber 
                  min={0} 
                  max={task.estimatedHours || undefined}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              
              <Form.Item
                name="complexity"
                label="复杂度"
                rules={[{ required: true, message: '请选择复杂度' }]}
              >
                <Select>
                  <Select.Option value={1}>1 - 非常简单</Select.Option>
                  <Select.Option value={2}>2 - 简单</Select.Option>
                  <Select.Option value={3}>3 - 中等</Select.Option>
                  <Select.Option value={4}>4 - 复杂</Select.Option>
                  <Select.Option value={5}>5 - 非常复杂</Select.Option>
                </Select>
              </Form.Item>
              
              <Form.Item
                name="priority"
                label="优先级"
                rules={[{ required: true, message: '请选择优先级' }]}
              >
                <Select>
                  <Select.Option value={1}>1 - 最低</Select.Option>
                  <Select.Option value={2}>2 - 低</Select.Option>
                  <Select.Option value={3}>3 - 中</Select.Option>
                  <Select.Option value={4}>4 - 高</Select.Option>
                  <Select.Option value={5}>5 - 最高</Select.Option>
                </Select>
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>

      {/* 发布子任务 */}
      <Modal
        title="发布子任务"
        open={publishSubtaskVisible}
        onOk={() => publishSubtaskForm.submit()}
        onCancel={() => {
          setPublishSubtaskVisible(false);
          publishSubtaskForm.resetFields();
          setPublishingSubtask(null);
        }}
        confirmLoading={publishSubtaskLoading}
        width={500}
      >
        {publishingSubtask && (
          <>
            <Card size="small" style={{ marginBottom: 16, backgroundColor: '#fff7e6', borderColor: '#ffa940' }}>
              <Text type="warning" style={{ fontSize: 13 }}>
                <strong>⚠️ 发布说明：</strong>
              </Text>
              <div style={{ marginTop: 8 }}>
                <Text style={{ fontSize: 12 }}>
                  • 发布后，子任务的承接人将被清空<br />
                  • 子任务状态将变为"可承接"<br />
                  • 其他用户可以在赏金任务中看到并承接此任务<br />
                  • 您需要设置赏金金额（从您的账户余额扣除）
                </Text>
              </div>
            </Card>

            <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f0f2f5', borderRadius: 4 }}>
              <Text strong>子任务：</Text> {publishingSubtask.name}
            </div>

            <Form
              form={publishSubtaskForm}
              layout="vertical"
              onFinish={handlePublishSubtaskSubmit}
              initialValues={{
                visibility: 'public',
                bountyAmount: 0,
              }}
            >
              <Form.Item
                name="visibility"
                label="可见性"
                rules={[{ required: true, message: '请选择可见性' }]}
              >
                <Select>
                  <Select.Option value="public">公开 - 所有用户可见</Select.Option>
                  <Select.Option value="position_only">仅特定岗位</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="bountyAmount"
                label="赏金金额"
                rules={[
                  { required: true, message: '请输入赏金金额' },
                  {
                    validator: (_, value) => {
                      if (value <= 0) {
                        return Promise.reject(new Error('赏金金额必须大于0'));
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
                extra="赏金将从您的账户余额中扣除"
              >
                <InputNumber
                  min={0}
                  step={10}
                  style={{ width: '100%' }}
                  prefix="$"
                />
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>

      {/* 拒绝任务邀请模态框 */}
      <Modal
        title="拒绝任务邀请"
        open={rejectInvitationModalVisible}
        onOk={handleRejectInvitationConfirm}
        onCancel={() => {
          setRejectInvitationModalVisible(false);
          setRejectInvitationReason('');
        }}
        okText="确认拒绝"
        cancelText="取消"
        okButtonProps={{ danger: true, loading: invitationActionLoading }}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Text>您确定要拒绝任务 "{task?.name}" 吗？</Text>
          
          <div>
            <Text>拒绝原因（可选）：</Text>
            <Input.TextArea
              rows={4}
              placeholder="请输入拒绝原因，这将发送给任务发布者"
              value={rejectInvitationReason}
              onChange={(e) => setRejectInvitationReason(e.target.value)}
              maxLength={500}
              showCount
            />
          </div>
        </Space>
      </Modal>

      {/* 群组模态框 */}
      <Modal
        title={task?.groupId ? "任务群组" : "加入群组"}
        open={convertToGroupModalVisible}
        onOk={handleConvertToGroupConfirm}
        onCancel={() => {
          setConvertToGroupModalVisible(false);
          setSelectedGroupId(undefined);
        }}
        okText={task?.groupId ? "关闭" : "确认加入"}
        cancelText={task?.groupId ? null : "取消"}
        confirmLoading={convertingToGroup}
        footer={task?.groupId ? [
          <Button key="close" type="primary" onClick={() => setConvertToGroupModalVisible(false)}>
            关闭
          </Button>
        ] : undefined}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {task?.groupId ? (
            // View mode: Show current group information
            <>
              <Text>此任务已关联到以下群组：</Text>
              
              <div style={{ padding: 16, background: '#f0f2f5', borderRadius: 4 }}>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <div>
                    <Text strong style={{ fontSize: 16 }}>
                      <TeamOutlined /> {task.groupName || '未知群组'}
                    </Text>
                  </div>
                  {userGroups.find(g => g.id === task.groupId) && (
                    <Text type="secondary">
                      成员数：{userGroups.find(g => g.id === task.groupId)?.members?.length || 0} 人
                    </Text>
                  )}
                </Space>
              </div>

              <div style={{ marginTop: 16, padding: 12, background: '#e6f7ff', borderRadius: 4, borderLeft: '3px solid #1890ff' }}>
                <Text style={{ fontSize: 12, color: '#096dd9' }}>
                  <strong>说明：</strong>
                  <br />
                  • 群组中的所有成员都可以查看此任务
                  <br />
                  • 您仍然是任务的承接者
                  <br />
                  • 任务关联的群组不可更改
                </Text>
              </div>
            </>
          ) : (
            // Select mode: Allow joining a group
            <>
              <Text>将任务 "{task?.name}" 加入群组后，组群中的所有成员都可以查看和协作此任务。</Text>
              
              <div>
                <Text strong>选择组群：</Text>
                <Select
                  placeholder="请选择要关联的组群"
                  value={selectedGroupId}
                  onChange={setSelectedGroupId}
                  style={{ width: '100%', marginTop: 8 }}
                >
                  {userGroups.map(group => (
                    <Select.Option key={group.id} value={group.id}>
                      <Space>
                        <TeamOutlined />
                        <span>{group.name}</span>
                        <Text type="secondary">({group.members?.length || 0} 成员)</Text>
                      </Space>
                    </Select.Option>
                  ))}
                </Select>
              </div>

              <div style={{ marginTop: 16, padding: 12, background: '#fff7e6', borderRadius: 4, borderLeft: '3px solid #faad14' }}>
                <Text style={{ fontSize: 12, color: '#d46b08' }}>
                  <strong>注意：</strong>
                  <br />
                  • 加入后，您仍然是任务的承接者
                  <br />
                  • 组群成员可以查看任务详情和进度
                  <br />
                  • 此操作不可撤销
                </Text>
              </div>
            </>
          )}
        </Space>
      </Modal>

      {/* 额外奖赏模态框 */}
      <Modal
        title="添加额外奖赏"
        open={bonusModalVisible}
        onCancel={() => {
          setBonusModalVisible(false);
          bonusForm.resetFields();
        }}
        onOk={() => bonusForm.submit()}
        okText="确认发放"
        cancelText="取消"
        confirmLoading={addingBonus}
      >
        <Form
          form={bonusForm}
          layout="vertical"
          onFinish={handleSubmitBonus}
        >
          <Form.Item
            name="amount"
            label="额外奖赏金额"
            rules={[
              { required: true, message: '请输入奖赏金额' },
              { type: 'number', min: 0.01, message: '金额必须大于0' },
            ]}
            extra={task && `当前任务赏金: ${formatBounty(task.bountyAmount || 0)}`}
          >
            <InputNumber
              min={0.01}
              step={10}
              precision={2}
              style={{ width: '100%' }}
              prefix="$"
              placeholder="请输入额外奖赏金额"
            />
          </Form.Item>

          <Form.Item
            name="reason"
            label="奖赏原因"
            extra="可选，说明发放额外奖赏的原因"
          >
            <Input.TextArea
              rows={3}
              placeholder="例如：任务完成质量优秀，提前完成等"
            />
          </Form.Item>
        </Form>
      </Modal>
    </Modal>
  );
};


