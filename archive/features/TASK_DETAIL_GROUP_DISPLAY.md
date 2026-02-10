# 任务详情显示组群和项目组信息

## 需求描述
在任务详情抽屉中显示任务所属的组群和项目组信息（如果有的话）。

## 实现内容

### 前端修改
**文件**: `packages/frontend/src/components/TaskDetailDrawer.tsx`

在任务描述之后、可见性之前添加了两个新的信息行：

1. **所属组群**（如果任务关联了组群）
   - 显示条件：`task.groupName` 存在
   - 显示样式：紫色标签，带团队图标
   - 标签颜色：`purple`
   - 图标：`<TeamOutlined />`

2. **项目分组**（如果任务关联了项目组）
   - 显示条件：`task.projectGroupName` 存在
   - 显示样式：蓝色标签
   - 标签颜色：`geekblue`

### 代码实现

```tsx
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
```

### 显示位置
信息显示在以下位置：
1. 任务描述之后
2. 所属组群（如果有）
3. 项目分组（如果有）
4. 可见性之前

### 数据来源
- `task.groupName`: 从后端 `task_groups` 表的 `name` 字段获取
- `task.projectGroupName`: 从后端 `project_groups` 表的 `name` 字段获取

这两个字段已经在后端的 SQL 查询中正确返回（通过 LEFT JOIN）。

## 用户体验

### 显示效果
- **所属组群**: 紫色标签，带团队图标，突出显示这是一个团队协作任务
- **项目分组**: 蓝色标签，表示任务所属的项目分类

### 条件显示
- 只有当任务实际关联了组群或项目组时才显示对应的信息行
- 如果任务既没有组群也没有项目组，这两行都不会显示
- 如果只有其中一个，只显示存在的那个

## 相关功能
- 组群任务管理
- 项目组分类管理
- 任务详情展示

## 状态
✅ 已完成并验证

## 实现日期
2026-02-05
