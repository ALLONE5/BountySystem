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

async function seedRichTestData() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🚀 开始注入丰富的测试数据...\n');

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

    // 2. 清理现有的项目组和任务
    console.log('🧹 清理现有数据...');
    await client.query('DELETE FROM tasks WHERE TRUE');
    await client.query('DELETE FROM project_groups WHERE TRUE');
    console.log('✓ 清理完成\n');

    // 3. 创建项目组
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
      },
      {
        name: '数据分析平台',
        description: '大数据分析和可视化平台建设'
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

    // 4. 创建丰富的任务数据
    console.log('📝 创建任务...');
    
    const tasks = [
      // 电商平台开发项目
      {
        name: '用户认证系统开发',
        description: '实现用户注册、登录、密码重置等功能，支持多种登录方式',
        project: '电商平台开发',
        publisher: 'admin',
        assignee: 'developer1',
        status: 'in_progress',
        bounty: 800,
        complexity: 3,
        priority: 5,
        progress: 60,
        estimatedHours: 40,
        tags: ['后端', '认证', 'JWT']
      },
      {
        name: '商品管理模块',
        description: '开发商品的增删改查、分类管理、库存管理等功能',
        project: '电商平台开发',
        publisher: 'admin',
        assignee: 'developer2',
        status: 'in_progress',
        bounty: 1200,
        complexity: 4,
        priority: 5,
        progress: 35,
        estimatedHours: 60,
        tags: ['后端', '数据库', 'CRUD']
      },
      {
        name: '购物车功能实现',
        description: '实现购物车的添加、删除、修改数量、结算等功能',
        project: '电商平台开发',
        publisher: 'admin',
        assignee: null,
        status: 'available',
        bounty: 600,
        complexity: 2,
        priority: 4,
        progress: 0,
        estimatedHours: 30,
        tags: ['前端', 'React', '状态管理']
      },
      {
        name: '订单管理系统',
        description: '开发订单创建、支付、发货、退款等完整流程',
        project: '电商平台开发',
        publisher: 'manager1',
        assignee: null,
        status: 'available',
        bounty: 1500,
        complexity: 5,
        priority: 5,
        progress: 0,
        estimatedHours: 80,
        tags: ['后端', '支付', '订单流程']
      },
      {
        name: '商品详情页设计',
        description: '设计美观的商品详情页面，包括图片展示、规格选择、评价展示等',
        project: '电商平台开发',
        publisher: 'admin',
        assignee: 'designer1',
        status: 'completed',
        bounty: 500,
        complexity: 2,
        priority: 3,
        progress: 100,
        estimatedHours: 20,
        tags: ['UI设计', 'Figma']
      },
      {
        name: '支付接口集成',
        description: '集成支付宝、微信支付等第三方支付接口',
        project: '电商平台开发',
        publisher: 'manager1',
        assignee: null,
        status: 'not_started',
        bounty: 1000,
        complexity: 4,
        priority: 4,
        progress: 0,
        estimatedHours: 50,
        tags: ['后端', '第三方集成', '支付']
      },

      // 企业管理系统项目
      {
        name: '员工信息管理',
        description: '开发员工档案管理、入职离职流程、考勤管理等功能',
        project: '企业管理系统',
        publisher: 'admin',
        assignee: 'developer1',
        status: 'in_progress',
        bounty: 900,
        complexity: 3,
        priority: 4,
        progress: 45,
        estimatedHours: 45,
        tags: ['后端', 'HR', '管理系统']
      },
      {
        name: '财务报表模块',
        description: '实现财务数据录入、报表生成、数据导出等功能',
        project: '企业管理系统',
        publisher: 'manager1',
        assignee: 'developer2',
        status: 'in_progress',
        bounty: 1100,
        complexity: 4,
        priority: 5,
        progress: 20,
        estimatedHours: 55,
        tags: ['后端', '财务', '报表']
      },
      {
        name: '项目进度跟踪',
        description: '开发项目管理、任务分配、进度跟踪、甘特图展示等功能',
        project: '企业管理系统',
        publisher: 'admin',
        assignee: null,
        status: 'available',
        bounty: 1300,
        complexity: 5,
        priority: 4,
        progress: 0,
        estimatedHours: 70,
        tags: ['前端', '项目管理', '可视化']
      },
      {
        name: '权限管理系统',
        description: '实现基于角色的权限控制（RBAC），支持细粒度权限配置',
        project: '企业管理系统',
        publisher: 'manager1',
        assignee: null,
        status: 'available',
        bounty: 800,
        complexity: 4,
        priority: 5,
        progress: 0,
        estimatedHours: 40,
        tags: ['后端', '权限', 'RBAC']
      },
      {
        name: '系统仪表板设计',
        description: '设计企业管理系统的主仪表板，展示关键指标和数据',
        project: '企业管理系统',
        publisher: 'admin',
        assignee: 'designer1',
        status: 'completed',
        bounty: 600,
        complexity: 3,
        priority: 3,
        progress: 100,
        estimatedHours: 25,
        tags: ['UI设计', '仪表板', '数据可视化']
      },

      // AI 智能助手项目
      {
        name: 'LLM 接口集成',
        description: '集成 OpenAI、Claude 等大语言模型 API',
        project: 'AI 智能助手',
        publisher: 'admin',
        assignee: 'developer1',
        status: 'completed',
        bounty: 1000,
        complexity: 3,
        priority: 5,
        progress: 100,
        estimatedHours: 35,
        tags: ['AI', 'API集成', 'LLM']
      },
      {
        name: '对话历史管理',
        description: '实现对话历史的存储、检索、导出等功能',
        project: 'AI 智能助手',
        publisher: 'admin',
        assignee: 'developer2',
        status: 'in_progress',
        bounty: 700,
        complexity: 2,
        priority: 4,
        progress: 70,
        estimatedHours: 30,
        tags: ['后端', '数据库', '对话管理']
      },
      {
        name: '智能提示词优化',
        description: '研究和优化提示词工程，提升 AI 回答质量',
        project: 'AI 智能助手',
        publisher: 'manager1',
        assignee: null,
        status: 'available',
        bounty: 900,
        complexity: 4,
        priority: 3,
        progress: 0,
        estimatedHours: 40,
        tags: ['AI', 'Prompt Engineering', '优化']
      },
      {
        name: '语音交互功能',
        description: '实现语音输入和语音输出功能，支持多语言',
        project: 'AI 智能助手',
        publisher: 'admin',
        assignee: null,
        status: 'not_started',
        bounty: 1200,
        complexity: 5,
        priority: 2,
        progress: 0,
        estimatedHours: 60,
        tags: ['AI', '语音识别', 'TTS']
      },
      {
        name: '聊天界面设计',
        description: '设计现代化的聊天界面，支持 Markdown 渲染、代码高亮等',
        project: 'AI 智能助手',
        publisher: 'admin',
        assignee: 'designer1',
        status: 'in_progress',
        bounty: 550,
        complexity: 2,
        priority: 4,
        progress: 80,
        estimatedHours: 22,
        tags: ['UI设计', '聊天界面', 'Markdown']
      },

      // 数据分析平台项目
      {
        name: '数据采集模块',
        description: '开发多数据源接入、数据清洗、数据转换等功能',
        project: '数据分析平台',
        publisher: 'manager1',
        assignee: 'developer2',
        status: 'in_progress',
        bounty: 1100,
        complexity: 4,
        priority: 5,
        progress: 50,
        estimatedHours: 55,
        tags: ['后端', '数据采集', 'ETL']
      },
      {
        name: '数据可视化组件库',
        description: '开发图表组件库，支持折线图、柱状图、饼图等多种图表类型',
        project: '数据分析平台',
        publisher: 'admin',
        assignee: null,
        status: 'available',
        bounty: 1000,
        complexity: 4,
        priority: 4,
        progress: 0,
        estimatedHours: 50,
        tags: ['前端', '可视化', 'ECharts']
      },
      {
        name: '实时数据流处理',
        description: '实现实时数据流的接入、处理和展示',
        project: '数据分析平台',
        publisher: 'manager1',
        assignee: null,
        status: 'available',
        bounty: 1500,
        complexity: 5,
        priority: 3,
        progress: 0,
        estimatedHours: 75,
        tags: ['后端', '实时处理', 'WebSocket']
      },
      {
        name: '数据报告生成',
        description: '开发自动化数据报告生成功能，支持 PDF、Excel 导出',
        project: '数据分析平台',
        publisher: 'admin',
        assignee: null,
        status: 'not_started',
        bounty: 800,
        complexity: 3,
        priority: 3,
        progress: 0,
        estimatedHours: 40,
        tags: ['后端', '报告', '导出']
      },
      {
        name: '仪表板模板设计',
        description: '设计多套数据分析仪表板模板，适用于不同业务场景',
        project: '数据分析平台',
        publisher: 'admin',
        assignee: 'designer1',
        status: 'completed',
        bounty: 700,
        complexity: 3,
        priority: 3,
        progress: 100,
        estimatedHours: 30,
        tags: ['UI设计', '仪表板', '模板']
      },

      // 无项目组的任务
      {
        name: '网站性能优化',
        description: '优化网站加载速度，提升用户体验',
        project: null,
        publisher: 'admin',
        assignee: 'developer1',
        status: 'in_progress',
        bounty: 600,
        complexity: 3,
        priority: 3,
        progress: 40,
        estimatedHours: 30,
        tags: ['性能优化', '前端']
      },
      {
        name: '数据库索引优化',
        description: '分析慢查询，优化数据库索引，提升查询性能',
        project: null,
        publisher: 'manager1',
        assignee: null,
        status: 'available',
        bounty: 500,
        complexity: 3,
        priority: 4,
        progress: 0,
        estimatedHours: 25,
        tags: ['数据库', '性能优化']
      },
      {
        name: 'API 文档编写',
        description: '编写完整的 API 文档，包括接口说明、参数说明、示例代码等',
        project: null,
        publisher: 'admin',
        assignee: null,
        status: 'not_started',
        bounty: 400,
        complexity: 2,
        priority: 2,
        progress: 0,
        estimatedHours: 20,
        tags: ['文档', 'API']
      },
      {
        name: '单元测试覆盖率提升',
        description: '为核心模块编写单元测试，提升测试覆盖率到 80% 以上',
        project: null,
        publisher: 'manager1',
        assignee: 'developer2',
        status: 'in_progress',
        bounty: 700,
        complexity: 3,
        priority: 3,
        progress: 55,
        estimatedHours: 35,
        tags: ['测试', '质量保证']
      },
      {
        name: '移动端适配',
        description: '优化网站在移动设备上的显示效果，实现响应式设计',
        project: null,
        publisher: 'admin',
        assignee: null,
        status: 'available',
        bounty: 650,
        complexity: 2,
        priority: 3,
        progress: 0,
        estimatedHours: 28,
        tags: ['前端', '响应式', '移动端']
      }
    ];

    let taskCount = 0;
    for (const task of tasks) {
      const projectGroupId = task.project ? projectGroupIds[task.project] : null;
      const publisherId = users[task.publisher];
      const assigneeId = task.assignee ? users[task.assignee] : null;
      
      const plannedStartDate = new Date();
      plannedStartDate.setDate(plannedStartDate.getDate() - Math.floor(Math.random() * 30));
      
      const plannedEndDate = new Date(plannedStartDate);
      plannedEndDate.setDate(plannedEndDate.getDate() + task.estimatedHours / 8 * 7);

      await client.query(`
        INSERT INTO tasks (
          name, description, project_group_id, publisher_id, assignee_id,
          status, bounty_amount, complexity, priority, progress,
          estimated_hours, tags, planned_start_date, planned_end_date,
          visibility, is_executable, depth
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      `, [
        task.name,
        task.description,
        projectGroupId,
        publisherId,
        assigneeId,
        task.status,
        task.bounty,
        task.complexity,
        task.priority,
        task.progress,
        task.estimatedHours,
        task.tags,
        plannedStartDate,
        plannedEndDate,
        'public',
        true,
        0
      ]);
      
      taskCount++;
      console.log(`  ✓ 创建任务 ${taskCount}/${tasks.length}: ${task.name}`);
    }

    await client.query('COMMIT');
    
    console.log('\n✅ 测试数据注入完成！\n');
    console.log('📊 数据统计:');
    console.log(`  - 项目组: ${projectGroups.length} 个`);
    console.log(`  - 任务总数: ${tasks.length} 个`);
    console.log(`  - 进行中: ${tasks.filter(t => t.status === 'in_progress').length} 个`);
    console.log(`  - 可承接: ${tasks.filter(t => t.status === 'available').length} 个`);
    console.log(`  - 已完成: ${tasks.filter(t => t.status === 'completed').length} 个`);
    console.log(`  - 未开始: ${tasks.filter(t => t.status === 'not_started').length} 个`);
    console.log(`  - 有项目组: ${tasks.filter(t => t.project).length} 个`);
    console.log(`  - 无项目组: ${tasks.filter(t => !t.project).length} 个`);
    console.log('');
    console.log('🎯 测试账号:');
    console.log('  - admin / Password123 (发布了多个任务)');
    console.log('  - developer1 / Password123 (接受了多个任务)');
    console.log('  - developer2 / Password123 (接受了多个任务)');
    console.log('  - designer1 / Password123 (接受了设计任务)');
    console.log('  - manager1 / Password123 (发布了多个任务)');
    console.log('');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 错误:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedRichTestData().catch(console.error);
