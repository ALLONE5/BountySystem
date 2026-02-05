import pg from 'pg';
import { randomUUID } from 'crypto';
const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'bounty_hunter'
});

async function seedEnhancedTestData() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🚀 开始注入增强测试数据（包含子任务和组群任务）...\n');

    // 1. 获取测试用户
    console.log('📋 获取测试用户...');
    const usersResult = await client.query(`
      SELECT id, username FROM users 
      WHERE username IN ('admin', 'developer1', 'developer2', 'designer1', 'manager1')
      ORDER BY username
    `);
    
    if (usersResult.rows.length === 0) {
      throw new Error('未找到测试用户，请先运行 seed_db.ts');
    }
    
    const users = {};
    usersResult.rows.forEach(u => {
      users[u.username] = u.id;
    });
    
    console.log(`✓ 找到 ${usersResult.rows.length} 个测试用户\n`);

    // 2. 获取或创建任务组
    console.log('👥 获取/创建任务组...');
    const groupsResult = await client.query(`
      SELECT id, name FROM task_groups
      WHERE name IN ('前端开发组', '后端开发组', '设计团队', '测试团队')
    `);
    
    const groups = {};
    groupsResult.rows.forEach(g => {
      groups[g.name] = g.id;
    });

    // 如果组不存在，创建它们
    const groupsToCreate = [
      { name: '前端开发组' },
      { name: '后端开发组' },
      { name: '设计团队' },
      { name: '测试团队' }
    ];

    for (const group of groupsToCreate) {
      if (!groups[group.name]) {
        const id = randomUUID();
        await client.query(
          'INSERT INTO task_groups (id, name, creator_id) VALUES ($1, $2, $3)',
          [id, group.name, users['admin']]
        );
        groups[group.name] = id;
        console.log(`  ✓ 创建任务组: ${group.name}`);
      }
    }
    console.log('');

    // 3. 清理现有的项目组和任务
    console.log('🧹 清理现有数据...');
    await client.query('DELETE FROM tasks WHERE TRUE');
    await client.query('DELETE FROM project_groups WHERE TRUE');
    console.log('✓ 清理完成\n');

    // 4. 创建项目组
    console.log('📁 创建项目组...');
    const projectGroups = [
      {
        name: '电商平台开发',
        description: '构建一个完整的电商平台系统，包括前端、后端和移动端'
      },
      {
        name: '企业管理系统',
        description: '开发企业内部管理系统，包括人事、财务、项目管理等模块'
      },
      {
        name: 'AI 智能助手',
        description: '基于大语言模型的智能助手应用开发'
      }
    ];

    const projectGroupIds = {};
    for (const pg of projectGroups) {
      const id = randomUUID();
      const result = await client.query(
        'INSERT INTO project_groups (id, name, description) VALUES ($1, $2, $3) RETURNING id',
        [id, pg.name, pg.description]
      );
      projectGroupIds[pg.name] = result.rows[0].id;
      console.log(`  ✓ 创建项目组: ${pg.name}`);
    }
    console.log('');

    // 5. 创建任务（包含母任务和子任务）
    console.log('📝 创建任务（包含子任务）...');
    
    const taskIds = {};
    let taskCount = 0;

    // 辅助函数：创建任务
    async function createTask(task) {
      const id = randomUUID();
      const projectGroupId = task.project ? projectGroupIds[task.project] : null;
      const publisherId = users[task.publisher];
      const assigneeId = task.assignee ? users[task.assignee] : null;
      const groupId = task.group ? groups[task.group] : null;
      const parentId = task.parent ? taskIds[task.parent] : null;
      
      const plannedStartDate = new Date();
      plannedStartDate.setDate(plannedStartDate.getDate() - Math.floor(Math.random() * 30));
      
      const plannedEndDate = new Date(plannedStartDate);
      plannedEndDate.setDate(plannedEndDate.getDate() + (task.estimatedHours || 20) / 8 * 7);

      await client.query(`
        INSERT INTO tasks (
          id, name, description, project_group_id, publisher_id, assignee_id,
          group_id, parent_id, status, bounty_amount, complexity, priority, progress,
          estimated_hours, tags, planned_start_date, planned_end_date,
          visibility, is_executable, depth
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      `, [
        id,
        task.name,
        task.description,
        projectGroupId,
        publisherId,
        assigneeId,
        groupId,
        parentId,
        task.status,
        task.bounty,
        task.complexity,
        task.priority,
        task.progress,
        task.estimatedHours || 20,
        task.tags || [],
        plannedStartDate,
        plannedEndDate,
        'public',
        task.isExecutable !== false,
        task.depth || 0
      ]);
      
      taskIds[task.key] = id;
      taskCount++;
      const indent = '  '.repeat((task.depth || 0) + 1);
      console.log(`${indent}✓ 创建任务 ${taskCount}: ${task.name}`);
      
      return id;
    }

    // 电商平台开发项目 - 包含多级子任务
    console.log('\n  📦 电商平台开发项目:');
    
    // 母任务1: 用户系统开发
    await createTask({
      key: 'user-system',
      name: '用户系统开发',
      description: '完整的用户管理系统，包括认证、授权、个人信息管理等',
      project: '电商平台开发',
      publisher: 'admin',
      assignee: null,
      status: 'in_progress',
      bounty: 2000,
      complexity: 4,
      priority: 5,
      progress: 45,
      estimatedHours: 100,
      tags: ['后端', '用户系统'],
      isExecutable: false,
      depth: 0
    });

    // 子任务1-1: 用户认证
    await createTask({
      key: 'user-auth',
      name: '用户认证模块',
      description: '实现用户注册、登录、密码重置等功能',
      project: '电商平台开发',
      publisher: 'admin',
      assignee: 'developer1',
      parent: 'user-system',
      status: 'in_progress',
      bounty: 800,
      complexity: 3,
      priority: 5,
      progress: 70,
      estimatedHours: 40,
      tags: ['后端', '认证', 'JWT'],
      depth: 1
    });

    // 二级子任务1-1-1
    await createTask({
      key: 'user-register',
      name: '用户注册功能',
      description: '实现用户注册接口，包括邮箱验证',
      project: '电商平台开发',
      publisher: 'admin',
      assignee: 'developer1',
      parent: 'user-auth',
      status: 'completed',
      bounty: 300,
      complexity: 2,
      priority: 5,
      progress: 100,
      estimatedHours: 15,
      tags: ['后端', '注册'],
      depth: 2
    });

    // 二级子任务1-1-2
    await createTask({
      key: 'user-login',
      name: '用户登录功能',
      description: '实现用户登录接口，支持多种登录方式',
      project: '电商平台开发',
      publisher: 'admin',
      assignee: 'developer1',
      parent: 'user-auth',
      status: 'in_progress',
      bounty: 300,
      complexity: 2,
      priority: 5,
      progress: 60,
      estimatedHours: 15,
      tags: ['后端', '登录'],
      depth: 2
    });

    // 二级子任务1-1-3
    await createTask({
      key: 'password-reset',
      name: '密码重置功能',
      description: '实现忘记密码和密码重置功能',
      project: '电商平台开发',
      publisher: 'admin',
      assignee: null,
      parent: 'user-auth',
      status: 'available',
      bounty: 200,
      complexity: 2,
      priority: 4,
      progress: 0,
      estimatedHours: 10,
      tags: ['后端', '密码'],
      depth: 2
    });

    // 子任务1-2: 用户权限
    await createTask({
      key: 'user-permission',
      name: '用户权限管理',
      description: '实现基于角色的权限控制系统',
      project: '电商平台开发',
      publisher: 'admin',
      assignee: 'developer2',
      parent: 'user-system',
      status: 'in_progress',
      bounty: 700,
      complexity: 4,
      priority: 5,
      progress: 30,
      estimatedHours: 35,
      tags: ['后端', '权限', 'RBAC'],
      depth: 1
    });

    // 二级子任务1-2-1
    await createTask({
      key: 'role-management',
      name: '角色管理',
      description: '实现角色的增删改查功能',
      project: '电商平台开发',
      publisher: 'admin',
      assignee: 'developer2',
      parent: 'user-permission',
      status: 'in_progress',
      bounty: 250,
      complexity: 2,
      priority: 5,
      progress: 50,
      estimatedHours: 12,
      tags: ['后端', '角色'],
      depth: 2
    });

    // 二级子任务1-2-2
    await createTask({
      key: 'permission-check',
      name: '权限检查中间件',
      description: '实现权限检查中间件和装饰器',
      project: '电商平台开发',
      publisher: 'admin',
      assignee: null,
      parent: 'user-permission',
      status: 'available',
      bounty: 300,
      complexity: 3,
      priority: 5,
      progress: 0,
      estimatedHours: 15,
      tags: ['后端', '中间件'],
      depth: 2
    });

    // 子任务1-3: 用户资料
    await createTask({
      key: 'user-profile',
      name: '用户资料管理',
      description: '实现用户个人信息的查看和编辑功能',
      project: '电商平台开发',
      publisher: 'admin',
      assignee: null,
      parent: 'user-system',
      status: 'available',
      bounty: 500,
      complexity: 2,
      priority: 3,
      progress: 0,
      estimatedHours: 25,
      tags: ['后端', '用户资料'],
      depth: 1
    });

    // 母任务2: 商品管理系统
    await createTask({
      key: 'product-system',
      name: '商品管理系统',
      description: '完整的商品管理功能，包括商品、分类、库存等',
      project: '电商平台开发',
      publisher: 'admin',
      assignee: null,
      status: 'in_progress',
      bounty: 2500,
      complexity: 5,
      priority: 5,
      progress: 25,
      estimatedHours: 120,
      tags: ['后端', '商品管理'],
      isExecutable: false,
      depth: 0
    });

    // 子任务2-1
    await createTask({
      key: 'product-crud',
      name: '商品基础功能',
      description: '实现商品的增删改查功能',
      project: '电商平台开发',
      publisher: 'admin',
      assignee: 'developer2',
      parent: 'product-system',
      status: 'in_progress',
      bounty: 600,
      complexity: 3,
      priority: 5,
      progress: 60,
      estimatedHours: 30,
      tags: ['后端', 'CRUD'],
      depth: 1
    });

    // 子任务2-2
    await createTask({
      key: 'category-management',
      name: '分类管理',
      description: '实现商品分类的树形结构管理',
      project: '电商平台开发',
      publisher: 'admin',
      assignee: 'developer1',
      parent: 'product-system',
      status: 'in_progress',
      bounty: 500,
      complexity: 3,
      priority: 4,
      progress: 40,
      estimatedHours: 25,
      tags: ['后端', '分类'],
      depth: 1
    });

    // 二级子任务2-2-1
    await createTask({
      key: 'category-tree',
      name: '分类树形结构',
      description: '实现分类的树形数据结构和查询',
      project: '电商平台开发',
      publisher: 'admin',
      assignee: 'developer1',
      parent: 'category-management',
      status: 'completed',
      bounty: 250,
      complexity: 3,
      priority: 4,
      progress: 100,
      estimatedHours: 12,
      tags: ['后端', '树形结构'],
      depth: 2
    });

    // 二级子任务2-2-2
    await createTask({
      key: 'category-ui',
      name: '分类管理界面',
      description: '实现分类管理的前端界面',
      project: '电商平台开发',
      publisher: 'admin',
      assignee: null,
      parent: 'category-management',
      status: 'available',
      bounty: 250,
      complexity: 2,
      priority: 3,
      progress: 0,
      estimatedHours: 13,
      tags: ['前端', 'UI'],
      depth: 2
    });

    // 子任务2-3
    await createTask({
      key: 'inventory-management',
      name: '库存管理',
      description: '实现库存的增减、预警等功能',
      project: '电商平台开发',
      publisher: 'admin',
      assignee: null,
      parent: 'product-system',
      status: 'available',
      bounty: 700,
      complexity: 4,
      priority: 4,
      progress: 0,
      estimatedHours: 35,
      tags: ['后端', '库存'],
      depth: 1
    });

    // 子任务2-4
    await createTask({
      key: 'product-search',
      name: '商品搜索功能',
      description: '实现商品的全文搜索和筛选功能',
      project: '电商平台开发',
      publisher: 'admin',
      assignee: null,
      parent: 'product-system',
      status: 'not_started',
      bounty: 700,
      complexity: 4,
      priority: 3,
      progress: 0,
      estimatedHours: 30,
      tags: ['后端', '搜索', 'Elasticsearch'],
      depth: 1
    });

    // 组群任务示例
    console.log('\n  👥 组群任务:');
    
    await createTask({
      key: 'frontend-redesign',
      name: '前端界面重构',
      description: '重构整个前端界面，提升用户体验',
      project: '电商平台开发',
      publisher: 'admin',
      group: '前端开发组',
      assignee: 'developer1', // 分配给群组中的一个成员
      status: 'in_progress',
      bounty: 3000,
      complexity: 5,
      priority: 4,
      progress: 35,
      estimatedHours: 150,
      tags: ['前端', '重构', 'React'],
      depth: 0
    });

    await createTask({
      key: 'api-optimization',
      name: 'API 性能优化',
      description: '优化后端 API 性能，提升响应速度',
      project: '电商平台开发',
      publisher: 'manager1',
      group: '后端开发组',
      assignee: 'developer2', // 分配给群组中的一个成员
      status: 'in_progress',
      bounty: 2000,
      complexity: 4,
      priority: 5,
      progress: 50,
      estimatedHours: 80,
      tags: ['后端', '性能优化'],
      depth: 0
    });

    // 企业管理系统项目
    console.log('\n  🏢 企业管理系统项目:');
    
    await createTask({
      key: 'hr-system',
      name: '人力资源管理系统',
      description: '完整的HR管理功能',
      project: '企业管理系统',
      publisher: 'admin',
      assignee: null,
      status: 'in_progress',
      bounty: 1800,
      complexity: 4,
      priority: 4,
      progress: 30,
      estimatedHours: 90,
      tags: ['后端', 'HR'],
      isExecutable: false,
      depth: 0
    });

    await createTask({
      key: 'employee-management',
      name: '员工信息管理',
      description: '员工档案、入职离职流程管理',
      project: '企业管理系统',
      publisher: 'admin',
      assignee: 'developer1',
      parent: 'hr-system',
      status: 'in_progress',
      bounty: 700,
      complexity: 3,
      priority: 4,
      progress: 55,
      estimatedHours: 35,
      tags: ['后端', '员工管理'],
      depth: 1
    });

    await createTask({
      key: 'attendance-system',
      name: '考勤管理系统',
      description: '实现考勤打卡、请假、加班管理',
      project: '企业管理系统',
      publisher: 'admin',
      assignee: null,
      parent: 'hr-system',
      status: 'available',
      bounty: 600,
      complexity: 3,
      priority: 3,
      progress: 0,
      estimatedHours: 30,
      tags: ['后端', '考勤'],
      depth: 1
    });

    await createTask({
      key: 'salary-management',
      name: '薪资管理',
      description: '实现薪资计算、发放、报表功能',
      project: '企业管理系统',
      publisher: 'admin',
      assignee: null,
      parent: 'hr-system',
      status: 'not_started',
      bounty: 500,
      complexity: 4,
      priority: 3,
      progress: 0,
      estimatedHours: 25,
      tags: ['后端', '薪资'],
      depth: 1
    });

    // AI 智能助手项目
    console.log('\n  🤖 AI 智能助手项目:');
    
    await createTask({
      key: 'ai-core',
      name: 'AI 核心功能开发',
      description: 'AI 助手的核心功能实现',
      project: 'AI 智能助手',
      publisher: 'admin',
      assignee: null,
      status: 'in_progress',
      bounty: 2200,
      complexity: 5,
      priority: 5,
      progress: 60,
      estimatedHours: 110,
      tags: ['AI', '核心功能'],
      isExecutable: false,
      depth: 0
    });

    await createTask({
      key: 'llm-integration',
      name: 'LLM 接口集成',
      description: '集成多个大语言模型 API',
      project: 'AI 智能助手',
      publisher: 'admin',
      assignee: 'developer1',
      parent: 'ai-core',
      status: 'completed',
      bounty: 800,
      complexity: 3,
      priority: 5,
      progress: 100,
      estimatedHours: 35,
      tags: ['AI', 'API集成'],
      depth: 1
    });

    await createTask({
      key: 'conversation-history',
      name: '对话历史管理',
      description: '实现对话历史的存储和检索',
      project: 'AI 智能助手',
      publisher: 'admin',
      assignee: 'developer2',
      parent: 'ai-core',
      status: 'in_progress',
      bounty: 600,
      complexity: 2,
      priority: 4,
      progress: 75,
      estimatedHours: 30,
      tags: ['后端', '数据库'],
      depth: 1
    });

    await createTask({
      key: 'prompt-optimization',
      name: '提示词优化',
      description: '优化提示词工程，提升回答质量',
      project: 'AI 智能助手',
      publisher: 'admin',
      assignee: null,
      parent: 'ai-core',
      status: 'in_progress',
      bounty: 800,
      complexity: 4,
      priority: 4,
      progress: 40,
      estimatedHours: 45,
      tags: ['AI', 'Prompt Engineering'],
      depth: 1
    });

    // 无项目组的任务
    console.log('\n  📋 独立任务:');
    
    await createTask({
      key: 'performance-optimization',
      name: '系统性能优化',
      description: '全面优化系统性能',
      project: null,
      publisher: 'admin',
      assignee: null,
      status: 'in_progress',
      bounty: 1500,
      complexity: 4,
      priority: 4,
      progress: 30,
      estimatedHours: 75,
      tags: ['性能优化'],
      isExecutable: false,
      depth: 0
    });

    await createTask({
      key: 'frontend-performance',
      name: '前端性能优化',
      description: '优化前端加载速度和渲染性能',
      project: null,
      publisher: 'admin',
      assignee: 'developer1',
      parent: 'performance-optimization',
      status: 'in_progress',
      bounty: 600,
      complexity: 3,
      priority: 4,
      progress: 45,
      estimatedHours: 30,
      tags: ['前端', '性能'],
      depth: 1
    });

    await createTask({
      key: 'backend-performance',
      name: '后端性能优化',
      description: '优化数据库查询和API响应速度',
      project: null,
      publisher: 'admin',
      assignee: 'developer2',
      parent: 'performance-optimization',
      status: 'in_progress',
      bounty: 600,
      complexity: 4,
      priority: 4,
      progress: 20,
      estimatedHours: 30,
      tags: ['后端', '性能'],
      depth: 1
    });

    await createTask({
      key: 'cache-optimization',
      name: '缓存策略优化',
      description: '实现多级缓存策略',
      project: null,
      publisher: 'admin',
      assignee: null,
      parent: 'performance-optimization',
      status: 'available',
      bounty: 300,
      complexity: 3,
      priority: 3,
      progress: 0,
      estimatedHours: 15,
      tags: ['缓存', 'Redis'],
      depth: 1
    });

    // 6. 添加群组成员关系
    console.log('\n  👥 添加群组成员关系:');
    
    const memberships = [
      // 前端开发组
      { group: '前端开发组', user: 'admin' },
      { group: '前端开发组', user: 'developer1' },
      { group: '前端开发组', user: 'developer2' },
      { group: '前端开发组', user: 'designer1' },
      
      // 后端开发组
      { group: '后端开发组', user: 'admin' },
      { group: '后端开发组', user: 'developer1' },
      { group: '后端开发组', user: 'developer2' },
      
      // 设计团队
      { group: '设计团队', user: 'admin' },
      { group: '设计团队', user: 'designer1' },
      
      // 测试团队
      { group: '测试团队', user: 'admin' },
      { group: '测试团队', user: 'developer1' },
      { group: '测试团队', user: 'developer2' },
      { group: '测试团队', user: 'manager1' }
    ];

    let memberCount = 0;
    for (const membership of memberships) {
      const groupId = groups[membership.group];
      const userId = users[membership.user];
      
      if (groupId && userId) {
        // 检查是否已存在
        const existingResult = await client.query(
          'SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2',
          [groupId, userId]
        );
        
        if (existingResult.rows.length === 0) {
          await client.query(
            'INSERT INTO group_members (group_id, user_id) VALUES ($1, $2)',
            [groupId, userId]
          );
          memberCount++;
        }
      }
    }
    console.log(`  ✓ 添加了 ${memberCount} 个群组成员关系`);

    await client.query('COMMIT');
    
    console.log('\n✅ 增强测试数据注入完成！\n');
    console.log('📊 数据统计:');
    console.log(`  - 项目组: ${projectGroups.length} 个`);
    console.log(`  - 任务总数: ${taskCount} 个`);
    console.log(`  - 群组成员关系: ${memberCount} 个`);
    console.log(`  - 包含多级子任务的母任务`);
    console.log(`  - 包含组群任务`);
    console.log('');
    console.log('🎯 测试账号:');
    console.log('  - admin / Password123');
    console.log('  - developer1 / Password123');
    console.log('  - developer2 / Password123');
    console.log('  - designer1 / Password123');
    console.log('  - manager1 / Password123');
    console.log('');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 错误:', error.message);
    console.error(error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedEnhancedTestData().catch(console.error);
