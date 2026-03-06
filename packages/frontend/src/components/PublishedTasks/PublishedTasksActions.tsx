import { Modal } from 'antd';
import { Task } from '../../types';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { taskApi } from '../../api/task';

interface PublishedTasksActionsProps {
  onTasksUpdate: () => Promise<void>;
}

export const usePublishedTasksActions = ({
  onTasksUpdate,
}: PublishedTasksActionsProps) => {
  const { handleAsyncError } = useErrorHandler();

  const handlePublishTask = (task: Task) => {
    Modal.confirm({
      title: '发布任务',
      content: '是否由您自己承接此任务？',
      okText: '是，我来做',
      cancelText: '否，发布给他人',
      onOk: async () => {
        await handleAsyncError(
          async () => {
            await taskApi.publishTask(task.id, true);
            await onTasksUpdate();
          },
          'PublishedTasksActions.publishTaskSelf',
          '任务已发布并由您承接',
          '发布任务失败'
        );
      },
      onCancel: async () => {
        await handleAsyncError(
          async () => {
            await taskApi.publishTask(task.id, false);
            await onTasksUpdate();
          },
          'PublishedTasksActions.publishTaskPublic',
          '任务已发布到赏金任务列表',
          '发布任务失败'
        );
      },
    });
  };

  const handleCompleteTask = async (taskId: string) => {
    await handleAsyncError(
      async () => {
        await taskApi.completeTask(taskId);
        await onTasksUpdate();
      },
      'PublishedTasksActions.completeTask',
      '任务已完成',
      '完成任务失败'
    );
  };

  const handleDeleteTask = async (taskId: string) => {
    await handleAsyncError(
      async () => {
        await taskApi.deleteTask(taskId);
        await onTasksUpdate();
      },
      'PublishedTasksActions.deleteTask',
      '任务已删除',
      '删除任务失败'
    );
  };

  const handleAssignTask = async (taskId: string, userId: string) => {
    await handleAsyncError(
      async () => {
        await taskApi.assignTaskToUser(taskId, userId);
        await onTasksUpdate();
      },
      'PublishedTasksActions.assignTask',
      '任务指派成功，已发送邀请通知',
      '指派任务失败'
    );
  };

  return {
    handlePublishTask,
    handleCompleteTask,
    handleDeleteTask,
    handleAssignTask,
  };
};