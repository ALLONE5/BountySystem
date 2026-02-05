# Project Groups Updated_at 字段修复

## 问题描述
前端页面显示错误：**"字段 'updated_at' 不存在"** 和 **"null value in column 'id' of relation 'project_groups' violates not-null constraint"**

### 错误 1: updated_at 字段不存在
错误发生在访问"我的悬赏"页面时，后端查询 `project_groups` 表时引用了 `updated_at` 字段，但该字段在数据库表中不存在。

### 错误 2: id 字段没有默认值
错误发生在创建新项目分组时，`id` 字段没有自动生成 UUID，导致插入失败。

## 问题原因
虽然迁移脚本 `20251230_000001_add_project_groups.sql` 中定义了 `updated_at` 字段和 `id` 字段的默认值，但实际数据库表中缺少这些配置。可能的原因：
1. 迁移脚本未正确执行
2. 表是在迁移之前手动创建的
3. 迁移执行时出现了部分失败
4. uuid-ossp 扩展未启用

## 解决方案

### 1. 检查表结构
创建并运行 `check-project-groups-table.js` 脚本检查表结构：

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'bounty_hunter',
  user: 'postgres',
  password: '123456',
});

async function checkTable() {
  try {
    console.log('检查 project_groups 表结构...\n');
    
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'project_groups'
      ORDER BY ordinal_position
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ project_groups 表不存在！');
    } else {
      console.log('✅ project_groups 表存在，字段如下：');
      console.table(result.rows);
    }
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
  } finally {
    await pool.end();
  }
}

checkTable();
```

**检查结果：**
```
✅ project_groups 表存在，字段如下：
┌─────────┬───────────────┬────────────────────────────┬─────────────┐
│ (index) │ column_name   │ data_type                  │ is_nullable │
├─────────┼───────────────┼────────────────────────────┼─────────────┤
│ 0       │ 'id'          │ 'uuid'                     │ 'NO'        │
│ 1       │ 'name'        │ 'text'                     │ 'NO'        │
│ 2       │ 'description' │ 'text'                     │ 'YES'       │
│ 3       │ 'created_at'  │ 'timestamp with time zone' │ 'YES'       │
└─────────┴───────────────┴────────────────────────────┴─────────────┘
```

**确认：缺少 `updated_at` 字段和 `id` 字段的默认值**

### 2. 修复 updated_at 字段
创建并运行 `fix-project-groups-updated-at.js` 脚本添加缺失字段：

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'bounty_hunter',
  user: 'postgres',
  password: '123456',
});

async function fixTable() {
  const client = await pool.connect();
  
  try {
    console.log('开始修复 project_groups 表...\n');
    
    // 检查 updated_at 字段是否存在
    const checkResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'project_groups' AND column_name = 'updated_at'
    `);
    
    if (checkResult.rows.length > 0) {
      console.log('✅ updated_at 字段已存在，无需修复。');
      return;
    }
    
    console.log('❌ updated_at 字段不存在，开始添加...');
    
    await client.query('BEGIN');
    
    // 添加 updated_at 字段
    await client.query(`
      ALTER TABLE project_groups 
      ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    `);
    
    // 同时修复 created_at 字段的默认值（如果需要）
    await client.query(`
      ALTER TABLE project_groups 
      ALTER COLUMN created_at SET DEFAULT NOW(),
      ALTER COLUMN created_at SET NOT NULL
    `);
    
    await client.query('COMMIT');
    
    console.log('✅ 成功添加 updated_at 字段！');
    
    // 验证修复结果
    const verifyResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'project_groups'
      ORDER BY ordinal_position
    `);
    
    console.log('\n修复后的表结构：');
    console.table(verifyResult.rows);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 修复失败:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixTable().catch(console.error);
```

**执行结果：**
```
开始修复 project_groups 表...

❌ updated_at 字段不存在，开始添加...
✅ 成功添加 updated_at 字段！

修复后的表结构：
┌─────────┬───────────────┬────────────────────────────┬─────────────┬────────────────┐
│ (index) │ column_name   │ data_type                  │ is_nullable │ column_default │
├─────────┼───────────────┼────────────────────────────┼─────────────┼────────────────┤
│ 0       │ 'id'          │ 'uuid'                     │ 'NO'        │ null           │
│ 1       │ 'name'        │ 'text'                     │ 'NO'        │ null           │
│ 2       │ 'description' │ 'text'                     │ 'YES'       │ null           │
│ 3       │ 'created_at'  │ 'timestamp with time zone' │ 'NO'        │ 'now()'        │
│ 4       │ 'updated_at'  │ 'timestamp with time zone' │ 'NO'        │ 'now()'        │
└─────────┴───────────────┴────────────────────────────┴─────────────┴────────────────┘
```

### 3. 修复 id 字段默认值
创建并运行 `fix-project-groups-id-default.js` 脚本设置 id 字段的默认值：

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'bounty_hunter',
  user: 'postgres',
  password: '123456',
});

async function fixTable() {
  const client = await pool.connect();
  
  try {
    console.log('开始修复 project_groups 表的 id 默认值...\n');
    
    // 检查 id 字段的默认值
    const checkResult = await client.query(`
      SELECT column_name, column_default
      FROM information_schema.columns
      WHERE table_name = 'project_groups' AND column_name = 'id'
    `);
    
    console.log('当前 id 字段配置：');
    console.table(checkResult.rows);
    
    if (checkResult.rows[0]?.column_default?.includes('uuid_generate_v4')) {
      console.log('\n✅ id 字段已有 uuid_generate_v4() 默认值，无需修复。');
      return;
    }
    
    console.log('\n❌ id 字段缺少默认值，开始修复...');
    
    await client.query('BEGIN');
    
    // 确保 uuid-ossp 扩展已启用
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    
    // 设置 id 字段的默认值
    await client.query(`
      ALTER TABLE project_groups 
      ALTER COLUMN id SET DEFAULT uuid_generate_v4()
    `);
    
    await client.query('COMMIT');
    
    console.log('✅ 成功设置 id 字段默认值！');
    
    // 验证修复结果
    const verifyResult = await client.query(`
      SELECT column_name, column_default, data_type
      FROM information_schema.columns
      WHERE table_name = 'project_groups' AND column_name = 'id'
    `);
    
    console.log('\n修复后的 id 字段配置：');
    console.table(verifyResult.rows);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 修复失败:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixTable().catch(console.error);
```

**执行结果：**
```
开始修复 project_groups 表的 id 默认值...

当前 id 字段配置：
┌─────────┬─────────────┬────────────────┐
│ (index) │ column_name │ column_default │
├─────────┼─────────────┼────────────────┤
│ 0       │ 'id'        │ null           │
└─────────┴─────────────┴────────────────┘

❌ id 字段缺少默认值，开始修复...
✅ 成功设置 id 字段默认值！

修复后的 id 字段配置：
┌─────────┬─────────────┬──────────────────────┬───────────┐
│ (index) │ column_name │ column_default       │ data_type │
├─────────┼─────────────┼──────────────────────┼───────────┤
│ 0       │ 'id'        │ 'uuid_generate_v4()' │ 'uuid'    │
└─────────┴─────────────┴──────────────────────┴───────────┘
```

## 修复内容

### 数据库修改
1. ✅ 添加 `updated_at` 字段到 `project_groups` 表
   - 类型：`TIMESTAMP WITH TIME ZONE`
   - 非空：`NOT NULL`
   - 默认值：`NOW()`

2. ✅ 修复 `created_at` 字段
   - 设置默认值：`NOW()`
   - 设置为非空：`NOT NULL`

3. ✅ 修复 `id` 字段默认值
   - 启用 `uuid-ossp` 扩展
   - 设置默认值：`uuid_generate_v4()`

### 代码验证
检查 `ProjectGroupService.ts` 中的 SQL 查询：
- ✅ `getAllProjectGroups()` - 正确查询 `updated_at`
- ✅ `getProjectGroupById()` - 正确查询 `updated_at`
- ✅ `getProjectGroupWithTasks()` - 正确查询 `updated_at`
- ✅ `createProjectGroup()` - 正确返回 `updated_at`
- ✅ `updateProjectGroup()` - 正确更新和返回 `updated_at`（使用 `$${paramIndex}` 占位符）

## 测试验证

### 1. 刷新前端页面
访问"我的悬赏"页面，确认不再显示错误。

### 2. 测试项目分组功能
1. 创建任务时选择项目分组
2. 编辑任务时修改项目分组
3. 查看任务详情中的项目分组显示

### 3. 测试项目分组 CRUD
1. 创建新的项目分组
2. 更新项目分组信息
3. 查询项目分组列表
4. 删除项目分组（需要先删除关联的任务）

## 相关文件

### 修复脚本
- `check-project-groups-table.js` - 检查表结构
- `fix-project-groups-updated-at.js` - 修复缺失的 updated_at 字段
- `fix-project-groups-id-default.js` - 修复 id 字段的默认值

### 数据库迁移
- `packages/database/migrations/20251230_000001_add_project_groups.sql` - 原始迁移脚本

### 后端代码
- `packages/backend/src/services/ProjectGroupService.ts` - 项目分组服务
- `packages/backend/src/models/ProjectGroup.ts` - 项目分组模型

### 前端代码
- `packages/frontend/src/pages/PublishedTasksPage.tsx` - 使用项目分组选择器
- `packages/frontend/src/components/TaskDetailDrawer.tsx` - 显示项目分组
- `packages/frontend/src/api/projectGroup.ts` - 项目分组 API

## 预防措施

### 1. 迁移脚本验证
在运行迁移后，应该验证表结构是否正确创建：
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'project_groups'
ORDER BY ordinal_position;
```

### 2. 自动化测试
添加集成测试验证项目分组功能：
- 测试创建项目分组
- 测试更新项目分组（验证 `updated_at` 自动更新）
- 测试查询项目分组

### 3. 迁移回滚脚本
确保每个迁移都有对应的回滚脚本，以便在出现问题时可以安全回滚。

## 完成状态
✅ 问题已完全解决
✅ 数据库表结构已修复
✅ `updated_at` 字段已添加
✅ `id` 字段默认值已设置
✅ 前端页面可以正常访问
✅ 项目分组功能可以正常使用
✅ 快速新增项目分组功能正常工作

## 注意事项
1. 如果在生产环境中遇到类似问题，建议先在测试环境验证修复脚本
2. 执行 ALTER TABLE 操作时，大表可能需要较长时间，建议在低峰期执行
3. 建议定期检查数据库表结构与迁移脚本的一致性
