import React, { useEffect, useState, useRef } from 'react';
import { Modal, Tabs, message, Form } from 'antd';
import { Task } from '../types';
import { taskApi } from '../api/task';
import { userApi } from '../api/user';
import { positionApi } from '../api/position';
import { projectGroupApi } from '../api/projectGroup';
import { groupApi } from '../api/group';
import { TaskComments } from './TaskComments';
import { TaskAttachments } from './TaskAttachments';
import { TaskDetailHeader } from './TaskDetail/TaskDetailHeader';
import { TaskBasicInfo } from './TaskDetail/TaskBasicInfo';
import { TaskProgressSection } from './TaskDetail/TaskProgressSection';
import { TaskActions } from './TaskDetail/TaskActions';
import { SubtaskManager } from './TaskDetail/SubtaskManager';
import { TaskModals } from './TaskDetail/TaskModals';
import type { Assistant } from './TaskAssistants';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useAuthStore } from '../store/authStore';
import { logger } from '../utils/logger';

interface TaskDetailDrawerProps {
  task: Task | null;
  visible: boolean;
  onClose: () => void;
  onUpdateProgress?: (task: Task) => void;
  onCompleteTask?: (taskId: string) => void;
  onTaskUpdated?: () => void;
  onTaskClick?: (taskId: string) => Promise<void>;
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
  const { handleAsyncError } = useErrorHandler();
  
  // State management
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [assigneeFallback, setAssigneeFallback] = useState<{ username: string; avatarUrl?: string } | null>(null);
  const [progressValue, setProgressValue] = useState<number>(0);
  const [updatingProgress, setUpdatingProgress] = useState(false);
  const [addAssistantModalVisible, setAddAssistantModalVisible] = useState(false);
  const [addAssistantSubmitting, setAddAssistantSubmitting] = useState(false);
  const [subtasks, setSubtasks] = useState<Task[]>([]);
  const [createSubtaskVisible, setCreateSubtaskVisible] = useState(false);
  // 移除未使用的发布子任务相关状态
  const [subtaskPopoverVisible, setSubtaskPopoverVisible] = useState<Record<string, boolean>>({});
  const [subtaskForm] = Form.useForm();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm] = Form.useForm();
  const isUpdatingProgressRef = useRef(false);
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
  const [subtaskInPopover, setSubtaskInPopover] = useState<Task | null>(null);
  const [loadingSubtaskDetail, setLoadingSubtaskDetail] = useState(false);
  // 移除未使用的编辑子任务状态
  // 移除未使用的editSubtaskForm

  // Helper functions
  const loadProjectGroups = async () => {
    await handleAsyncError(
      () => projectGroupApi.getAllProjectGroups(),
      'TaskDetailDrawer.loadProjectGroups'
    ).then(data => data && setProjectGroups(data));
  };

  const loadUserGroups = async () => {
    await handleAsyncError(
      () => groupApi.getUserGroups(),
      'TaskDetailDrawer.loadUserGroups'
    ).then(data => data && setUserGroups(data));
  };

  const loadBonusRewards = async () => {
    if (!task?.id) return;
    
    setLoadingBonusRewards(true);
    try {
      const data = await handleAsyncError(
        () => taskApi.getBonusRewards(task.id),
        'TaskDetailDrawer.loadBonusRewards'
      );
      if (data) {
        setBonusRewards(data.bonusRewards);
      }
    } finally {
      setLoadingBonusRewards(false);
    }
  };

  // Load initial data
  useEffect(() => {
    positionApi.getAllPositions().then(setPositions).catch(console.error);
    loadProjectGroups();
    loadUserGroups();
  }, []);

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
      
      await loadProjectGroups();
      
      editForm.setFieldsValue({
        projectGroupId: newGroup.id,
      });
    } catch (error: any) {
      message.error(error.response?.data?.error || '创建项目分组失败');
      logger.error('Failed to create project group:', error);
    } finally {
      setAddingProjectGroup(false);
    }
  };

  useEffect(() => {
    if (task) {
      taskApi.getAssistants(task.id).then(setAssistants).catch(console.error);
      taskApi.getSubtasks(task.id).then(setSubtasks).catch(console.error);
      
      if (!isUpdatingProgressRef.current) {
        setProgressValue(task.progress || 0);
      }
      
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
    }
  }, [task, onTaskUpdated]);

  // Event handlers
  // 移除未使用的handleSearchUsers函数

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
    isUpdatingProgressRef.current = true;
    try {
      const updated = await taskApi.updateProgress(task.id, progressValue);
      setProgressValue(updated.progress || progressValue);
      message.success('进度已更新');
      
      if (onUpdateProgress) {
        onUpdateProgress(updated);
      }
      
      if (onTaskUpdated) {
        await onTaskUpdated();
      }
    } catch (error) {
      logger.error('Failed to update progress:', error);
      message.error('更新进度失败');
    } finally {
      setUpdatingProgress(false);
      setTimeout(() => {
        isUpdatingProgressRef.current = false;
      }, 100);
    }
  };

  const handleEditTask = () => {
    if (!task) return;
    editForm.setFieldsValue({
      name: task.name,
      description: task.description,
      tags: task.tags,
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
      
      await taskApi.updateTask(task.id, updateData);
      message.success('任务更新成功');
      setEditModalVisible(false);
      editForm.resetFields();
      
      if (onTaskUpdated) {
        await onTaskUpdated();
      }
    } catch (error) {
      message.error('更新任务失败');
      logger.error('Failed to update task:', error);
    }
  };

  const handleClose = () => {
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
      logger.error('Failed to accept task:', error);
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
      logger.error('Failed to reject task:', error);
    } finally {
      setInvitationActionLoading(false);
    }
  };

  const handleConvertToGroup = () => {
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
      
      setAddingBonus(false);
      setBonusModalVisible(false);
      bonusForm.resetFields();
      
      loadBonusRewards();
      
    } catch (error: any) {
      setAddingBonus(false);
      message.error(error.response?.data?.error || '发放额外奖赏失败');
    }
  };

  const handleConvertToGroupConfirm = async () => {
    if (task?.groupId) {
      setConvertToGroupModalVisible(false);
      return;
    }

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
      logger.error('Failed to convert task to group task:', error);
    } finally {
      setConvertingToGroup(false);
    }
  };

  // Create subtask handlers
  const handleCreateSubtask = async (values: any) => {
    if (!task) return;
    try {
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
      
      if (values.dateRange && values.dateRange.length === 2) {
        subtaskData.plannedStartDate = values.dateRange[0].toDate();
        subtaskData.plannedEndDate = values.dateRange[1].toDate();
      }
      
      await taskApi.createTask(subtaskData);
      message.success('子任务创建成功');
      setCreateSubtaskVisible(false);
      subtaskForm.resetFields();
      
      const updatedSubtasks = await taskApi.getSubtasks(task.id);
      setSubtasks(updatedSubtasks);
    } catch (error) {
      logger.error('Failed to create subtask:', error);
      message.error('创建子任务失败');
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
          
          const updatedSubtasks = await taskApi.getSubtasks(task.id);
          setSubtasks(updatedSubtasks);
          
          setSubtaskPopoverVisible(prev => ({
            ...prev,
            [subtaskId]: false
          }));
          setSubtaskInPopover(null);
          
          if (onTaskUpdated) {
            onTaskUpdated();
          }
        } catch (error) {
          logger.error('Failed to delete subtask:', error);
          message.error('删除子任务失败');
        }
      },
    });
  };

  // 移除未使用的发布子任务相关函数

  const handleSubtaskClick = async (subtaskId: string) => {
    try {
      setLoadingSubtaskDetail(true);
      const subtaskData = await taskApi.getTask(subtaskId);
      setSubtaskInPopover(subtaskData);
    } catch (error) {
      message.error('加载子任务详情失败');
      logger.error(String(error));
    } finally {
      setLoadingSubtaskDetail(false);
    }
  };

  // User role checks
  const isPublisher = Boolean(user && task && user.id === task.publisherId);
  const isInvitedUser = Boolean(user && task && task.invitedUserId === user.id);
  const isAssignee = Boolean(user && task && user.id === task.assigneeId);

  // 搜索用户函数
  const searchUsers = async (_keyword: string) => {
    try {
      // 这里应该调用实际的用户搜索API
      return [];
    } catch (error) {
      logger.error('搜索用户失败:', error);
      return [];
    }
  };

  const renderDetails = () => {
    if (!task) return null;
    return (
      <div>
        <TaskBasicInfo
          task={task}
          assigneeFallback={assigneeFallback}
          assistants={assistants}
          onAddAssistant={() => setAddAssistantModalVisible(true)}
        />
        <TaskProgressSection
          progressValue={progressValue}
          onProgressChange={setProgressValue}
          onProgressSave={handleUpdateProgress}
          loading={updatingProgress}
        />
      </div>
    );
  };

  const renderSubtaskPopoverContent = () => {
    if (loadingSubtaskDetail) {
      return (
        <div style={{ width: 600, padding: 40, textAlign: 'center' }}>
          加载中...
        </div>
      );
    }

    if (!subtaskInPopover) {
      return (
        <div style={{ width: 600, padding: 40, textAlign: 'center' }}>
          加载中...
        </div>
      );
    }

    return (
      <div style={{ width: 600, maxHeight: '70vh', overflow: 'auto' }}>
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16, fontWeight: 'bold' }}>{subtaskInPopover.name}</span>
        </div>
        <TaskBasicInfo
          task={subtaskInPopover}
          assigneeFallback={null}
          assistants={[]}
          onAddAssistant={() => {}}
        />
      </div>
    );
  };

  const renderSubtasks = () => {
    return (
      <SubtaskManager
        task={task!}
        subtasks={subtasks}
        subtaskPopoverVisible={subtaskPopoverVisible}
        onSubtaskClick={handleSubtaskClick}
        onPublishSubtask={handlePublishSubtask}
        onDeleteSubtask={handleDeleteSubtask}
        onCreateSubtask={() => setCreateSubtaskVisible(true)}
        renderSubtaskPopoverContent={renderSubtaskPopoverContent}
        setSubtaskPopoverVisible={setSubtaskPopoverVisible}
        setSubtaskInPopover={setSubtaskInPopover}
      />
    );
  };

  const renderFooter = () => {
    if (!task) return null;

    return (
      <TaskActions
        task={task}
        user={user}
        userGroups={userGroups}
        bonusRewards={bonusRewards}
        isAssignee={isAssignee}
        isPublisher={isPublisher}
        isInvitedUser={isInvitedUser}
        invitationActionLoading={invitationActionLoading}
        onCompleteTask={onCompleteTask}
        onEditTask={handleEditTask}
        onConvertToGroup={handleConvertToGroup}
        onAddBonus={handleAddBonus}
        onAcceptInvitation={handleAcceptInvitation}
        onRejectInvitation={handleRejectInvitation}
        onClose={handleClose}
      />
    );
  };

  const items = task ? [
    {
      key: 'details',
      label: '详情',
      children: renderDetails(),
    },
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

  return (
    <Modal
      title={<TaskDetailHeader task={task} />}
      open={visible}
      onCancel={handleClose}
      width={700}
      footer={renderFooter()}
    >
      {task && (
        <Tabs defaultActiveKey="details" items={items} />
      )}

      <TaskModals
        // 编辑任务
        editModalVisible={editModalVisible}
        editForm={editForm}
        positions={positions}
        projectGroups={projectGroups}
        newProjectGroupName={newProjectGroupName}
        addingProjectGroup={addingProjectGroup}
        onEditSubmit={handleEditSubmit}
        onEditCancel={() => {
          setEditModalVisible(false);
          editForm.resetFields();
        }}
        onAddProjectGroup={handleAddProjectGroup}
        setNewProjectGroupName={setNewProjectGroupName}

        // 创建子任务
        createSubtaskVisible={createSubtaskVisible}
        subtaskForm={subtaskForm}
        task={task}
        onCreateSubtask={handleCreateSubtask}
        onCreateSubtaskCancel={() => {
          setCreateSubtaskVisible(false);
          subtaskForm.resetFields();
        }}

        // 添加协作者模态框
        addAssistantModalVisible={addAssistantModalVisible}
        addAssistantSubmitting={addAssistantSubmitting}
        onAddAssistant={handleAddAssistant}
        onAddAssistantCancel={() => setAddAssistantModalVisible(false)}
        searchUsers={searchUsers}

        // 拒绝邀请模态框
        rejectInvitationModalVisible={rejectInvitationModalVisible}
        rejectInvitationReason={rejectInvitationReason}
        invitationActionLoading={invitationActionLoading}
        onRejectInvitationConfirm={handleRejectInvitationConfirm}
        onRejectInvitationCancel={() => setRejectInvitationModalVisible(false)}
        setRejectInvitationReason={setRejectInvitationReason}

        // 群组模态框
        convertToGroupModalVisible={convertToGroupModalVisible}
        userGroups={userGroups}
        selectedGroupId={selectedGroupId}
        convertingToGroup={convertingToGroup}
        onConvertToGroupConfirm={handleConvertToGroupConfirm}
        onConvertToGroupCancel={() => setConvertToGroupModalVisible(false)}
        setSelectedGroupId={setSelectedGroupId}

        // 额外奖赏模态框
        bonusModalVisible={bonusModalVisible}
        bonusForm={bonusForm}
        addingBonus={addingBonus}
        onSubmitBonus={handleSubmitBonus}
        onBonusCancel={() => setBonusModalVisible(false)}
      />
    </Modal>
  );
};