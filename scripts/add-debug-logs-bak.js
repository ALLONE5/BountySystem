/**
 * 为备份前端的 TaskListTable 添加调试日志
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../packages/frontend-bak/src/components/TaskList/TaskListTable.tsx');

let content = fs.readFileSync(filePath, 'utf8');

// 在 hasActions 定义后添加调试日志
const hasActionsPattern = /const hasActions = showAssignButton \|\| showAcceptButton \|\| onCompleteTask \|\| onPublishTask \|\| onEditTask \|\| onJoinGroup \|\| onDeleteTask;/;

if (hasActionsPattern.test(content)) {
  content = content.replace(
    hasActionsPattern,
    `const hasActions = showAssignButton || showAcceptButton || onCompleteTask || onPublishTask || onEditTask || onJoinGroup || onDeleteTask;
  
  // 调试日志
  console.log('🔍 TaskListTable - hasActions:', hasActions, {
    showAssignButton,
    showAcceptButton,
    hasOnCompleteTask: !!onCompleteTask,
    hasOnPublishTask: !!onPublishTask,
    hasOnEditTask: !!onEditTask,
    hasOnJoinGroup: !!onJoinGroup,
    hasOnDeleteTask: !!onDeleteTask,
    isPublishedTasksPage,
    user: user ? { id: user.id, username: user.username } : null,
    tasksCount: tasks.length
  });`
  );
  
  console.log('✅ 已添加 hasActions 调试日志');
} else {
  console.log('❌ 未找到 hasActions 定义');
}

// 在按钮渲染逻辑中添加调试日志
const canDeletePattern = /const canDelete = onDeleteTask && isPublisher && \(\s*record\.status === TaskStatus\.NOT_STARTED \|\| record\.status === TaskStatus\.AVAILABLE\s*\);/;

if (canDeletePattern.test(content)) {
  content = content.replace(
    canDeletePattern,
    `const canDelete = onDeleteTask && isPublisher && (
          record.status === TaskStatus.NOT_STARTED || record.status === TaskStatus.AVAILABLE
        );

        // 调试日志 - 每个任务的按钮渲染条件
        console.log(\`🔍 任务 "\${record.name}" 按钮条件:\`, {
          taskId: record.id,
          status: record.status,
          isAssignee,
          isPublisher,
          isPendingAcceptance,
          isInProgress,
          isNotStarted,
          canAssign,
          canAccept,
          canPublish,
          canDelete,
          hasAssigneeId: !!record.assigneeId,
          publisherId: record.publisherId,
          userId: user?.id
        });`
  );
  
  console.log('✅ 已添加按钮条件调试日志');
} else {
  console.log('❌ 未找到 canDelete 定义');
}

// 在 return 语句前添加按钮数量日志
const returnPattern = /return buttons\.length > 0 \? <div className="action-buttons">\{buttons\}<\/div> : null;/;

if (returnPattern.test(content)) {
  content = content.replace(
    returnPattern,
    `// 调试日志 - 最终渲染的按钮数量
        console.log(\`🔍 任务 "\${record.name}" 最终按钮数量:\`, buttons.length, buttons.map(b => b?.key));
        
        return buttons.length > 0 ? <div className="action-buttons">{buttons}</div> : null;`
  );
  
  console.log('✅ 已添加按钮数量调试日志');
} else {
  console.log('❌ 未找到 return 语句');
}

// 写回文件
fs.writeFileSync(filePath, content, 'utf8');

console.log('\n✅ 调试日志添加完成！');
console.log('📝 文件路径:', filePath);
console.log('\n请重启备份前端（5174端口）并查看浏览器控制台');
