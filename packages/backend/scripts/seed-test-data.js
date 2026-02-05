/**
 * Seed test data for UI testing
 * This script creates diverse tasks, group memberships, and completed tasks with bounties
 */

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'bounty_db',
  user: process.env.DB_USER || 'bounty_user',
  password: process.env.DB_PASSWORD || 'bounty_password',
});

async function seedTestData() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🌱 Starting data seeding...\n');
    
    // Get existing users and groups
    const usersResult = await client.query('SELECT id, username FROM users ORDER BY created_at');
    const groupsResult = await client.query('SELECT id, name FROM task_groups ORDER BY created_at');
    
    const users = usersResult.rows;
    const groups = groupsResult.rows;
    
    console.log(`📊 Found ${users.length} users and ${groups.length} groups\n`);
    
    // 1. Add members to groups
    console.log('👥 Adding members to groups...');
    
    const groupMemberships = [
      // Frontend Team
      { groupId: groups[0].id, userId: users[6].id }, // developer1
      { groupId: groups[0].id, userId: users[1].id }, // designer1
      { groupId: groups[0].id, userId: users[2].id }, // user1
      
      // Alpha Team
      { groupId: groups[3].id, userId: users[7].id }, // developer2
      { groupId: groups[3].id, userId: users[5].id }, // user3
      { groupId: groups[3].id, userId: users[0].id },  // manager1
      
      // Beta Squad
      { groupId: groups[2].id, userId: users[3].id }, // user2
      { groupId: groups[2].id, userId: users[6].id }, // developer1
      
      // Omega Force
      { groupId: groups[1].id, userId: users[1].id }, // designer1
      { groupId: groups[1].id, userId: users[7].id }, // developer2
      { groupId: groups[1].id, userId: users[0].id }, // manager1
    ];
    
    for (const membership of groupMemberships) {
      await client.query(
        `INSERT INTO group_members (group_id, user_id) 
         VALUES ($1, $2) 
         ON CONFLICT (group_id, user_id) DO NOTHING`,
        [membership.groupId, membership.userId]
      );
    }
    
    console.log(`✅ Added ${groupMemberships.length} group memberships\n`);
    
    // 2. Create project tasks (parent tasks with subtasks)
    console.log('📋 Creating project tasks...');
    
    const projects = [
      {
        name: '电商平台重构项目',
        description: '重构现有电商平台，提升性能和用户体验',
        bounty: 5000,
        groupId: groups[0].id, // Frontend Team
        publisherId: users[4].id, // admin
        subtasks: [
          { name: '设计新的首页UI', description: '设计响应式首页布局', bounty: 800, complexity: 3, assigneeId: users[1].id, status: 'completed', actualEndDate: '2025-12-15' },
          { name: '实现商品列表组件', description: '开发可复用的商品列表组件', bounty: 600, complexity: 4, assigneeId: users[6].id, status: 'completed', actualEndDate: '2025-12-18' },
          { name: '购物车功能开发', description: '实现购物车增删改查功能', bounty: 1000, complexity: 4, assigneeId: users[6].id, status: 'in_progress' },
          { name: '支付接口集成', description: '集成第三方支付接口', bounty: 1200, complexity: 5, assigneeId: users[7].id, status: 'available' },
          { name: '订单管理系统', description: '开发订单管理后台', bounty: 1400, complexity: 5, assigneeId: null, status: 'available' },
        ]
      },
      {
        name: '移动端App开发',
        description: '开发iOS和Android原生应用',
        bounty: 8000,
        groupId: groups[3].id, // Alpha Team
        publisherId: users[0].id, // manager1
        subtasks: [
          { name: 'iOS界面设计', description: '设计iOS应用界面', bounty: 1000, complexity: 3, assigneeId: users[1].id, status: 'completed', actualEndDate: '2025-12-10' },
          { name: 'Android界面设计', description: '设计Android应用界面', bounty: 1000, complexity: 3, assigneeId: users[1].id, status: 'completed', actualEndDate: '2025-12-12' },
          { name: 'iOS核心功能开发', description: '开发iOS核心功能模块', bounty: 2000, complexity: 5, assigneeId: users[7].id, status: 'in_progress' },
          { name: 'Android核心功能开发', description: '开发Android核心功能模块', bounty: 2000, complexity: 5, assigneeId: users[7].id, status: 'in_progress' },
          { name: 'API接口开发', description: '开发移动端API接口', bounty: 1500, complexity: 4, assigneeId: users[7].id, status: 'completed', actualEndDate: '2025-12-20' },
          { name: '性能优化', description: '优化应用性能和加载速度', bounty: 500, complexity: 4, assigneeId: null, status: 'available' },
        ]
      },
      {
        name: '数据分析平台',
        description: '构建实时数据分析和可视化平台',
        bounty: 6000,
        groupId: groups[1].id, // Omega Force
        publisherId: users[4].id, // admin
        subtasks: [
          { name: '数据采集模块', description: '开发数据采集和清洗模块', bounty: 1200, complexity: 4, assigneeId: users[7].id, status: 'completed', actualEndDate: '2025-12-08' },
          { name: '数据存储方案', description: '设计和实现数据存储方案', bounty: 1000, complexity: 5, assigneeId: users[7].id, status: 'completed', actualEndDate: '2025-12-14' },
          { name: '实时计算引擎', description: '开发实时数据计算引擎', bounty: 1500, complexity: 5, assigneeId: users[7].id, status: 'in_progress' },
          { name: '可视化仪表板', description: '开发数据可视化仪表板', bounty: 1300, complexity: 4, assigneeId: users[1].id, status: 'in_progress' },
          { name: '报表生成系统', description: '开发自动化报表生成系统', bounty: 1000, complexity: 4, assigneeId: null, status: 'available' },
        ]
      },
      {
        name: '内容管理系统升级',
        description: '升级现有CMS系统，增加新功能',
        bounty: 3000,
        groupId: groups[2].id, // Beta Squad
        publisherId: users[4].id, // admin
        subtasks: [
          { name: '富文本编辑器集成', description: '集成现代化富文本编辑器', bounty: 500, complexity: 3, assigneeId: users[6].id, status: 'completed', actualEndDate: '2025-12-05' },
          { name: '媒体库管理', description: '开发媒体文件管理功能', bounty: 600, complexity: 3, assigneeId: users[6].id, status: 'completed', actualEndDate: '2025-12-11' },
          { name: '版本控制功能', description: '实现内容版本控制和回滚', bounty: 800, complexity: 4, assigneeId: users[3].id, status: 'in_progress' },
          { name: '多语言支持', description: '添加多语言内容管理', bounty: 700, complexity: 4, assigneeId: null, status: 'available' },
          { name: 'SEO优化工具', description: '开发SEO优化辅助工具', bounty: 400, complexity: 3, assigneeId: null, status: 'available' },
        ]
      }
    ];
    
    let projectCount = 0;
    let taskCount = 0;
    
    for (const project of projects) {
      // Create parent task
      const parentResult = await client.query(
        `INSERT INTO tasks (
          name, description, parent_id, depth, is_executable, 
          status, visibility, bounty_amount, bounty_algorithm_version,
          publisher_id, group_id, complexity, priority,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
        RETURNING id`,
        [
          project.name,
          project.description,
          null, // parent_id
          0, // depth
          false, // is_executable
          'in_progress',
          'public',
          project.bounty,
          'v1.0',
          project.publisherId,
          project.groupId,
          5, // complexity
          5, // priority
        ]
      );
      
      const parentId = parentResult.rows[0].id;
      projectCount++;
      
      // Create subtasks
      for (const subtask of project.subtasks) {
        const actualEndDate = subtask.actualEndDate 
          ? new Date(subtask.actualEndDate).toISOString()
          : null;
        
        await client.query(
          `INSERT INTO tasks (
            name, description, parent_id, depth, is_executable,
            status, visibility, bounty_amount, bounty_algorithm_version,
            publisher_id, assignee_id, group_id, complexity, priority,
            actual_end_date, is_bounty_settled,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())`,
          [
            subtask.name,
            subtask.description,
            parentId,
            1, // depth
            true, // is_executable
            subtask.status,
            'public',
            subtask.bounty,
            'v1.0',
            project.publisherId,
            subtask.assigneeId,
            project.groupId,
            subtask.complexity,
            4, // priority
            actualEndDate,
            subtask.status === 'completed', // is_bounty_settled
          ]
        );
        taskCount++;
      }
    }
    
    console.log(`✅ Created ${projectCount} projects with ${taskCount} subtasks\n`);
    
    // 3. Create standalone tasks
    console.log('📝 Creating standalone tasks...');
    
    const standaloneTasks = [
      { name: '修复登录页面响应式问题', description: '修复移动端登录页面显示问题', bounty: 150, complexity: 2, priority: 5, status: 'completed', assigneeId: users[6].id, groupId: null, actualEndDate: '2025-12-03' },
      { name: '优化数据库查询性能', description: '优化慢查询，添加索引', bounty: 300, complexity: 3, priority: 4, status: 'completed', assigneeId: users[7].id, groupId: null, actualEndDate: '2025-12-07' },
      { name: '编写API文档', description: '编写RESTful API文档', bounty: 200, complexity: 2, priority: 3, status: 'completed', assigneeId: users[2].id, groupId: null, actualEndDate: '2025-12-09' },
      { name: '用户反馈功能', description: '开发用户反馈收集功能', bounty: 400, complexity: 3, priority: 4, status: 'in_progress', assigneeId: users[6].id, groupId: groups[0].id, actualEndDate: null },
      { name: '邮件通知系统', description: '实现邮件通知功能', bounty: 500, complexity: 4, priority: 4, status: 'in_progress', assigneeId: users[7].id, groupId: groups[3].id, actualEndDate: null },
      { name: '数据备份方案', description: '设计和实现数据备份方案', bounty: 600, complexity: 4, priority: 5, status: 'available', assigneeId: null, groupId: null, actualEndDate: null },
      { name: '安全审计', description: '进行系统安全审计', bounty: 800, complexity: 5, priority: 5, status: 'available', assigneeId: null, groupId: groups[1].id, actualEndDate: null },
      { name: '性能监控系统', description: '搭建性能监控和告警系统', bounty: 700, complexity: 4, priority: 4, status: 'available', assigneeId: null, groupId: groups[3].id, actualEndDate: null },
    ];
    
    for (const task of standaloneTasks) {
      const actualEndDate = task.actualEndDate 
        ? new Date(task.actualEndDate).toISOString()
        : null;
      
      await client.query(
        `INSERT INTO tasks (
          name, description, parent_id, depth, is_executable,
          status, visibility, bounty_amount, bounty_algorithm_version,
          publisher_id, assignee_id, group_id, complexity, priority,
          actual_end_date, is_bounty_settled,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())`,
        [
          task.name,
          task.description,
          null, // parent_id
          0, // depth
          true, // is_executable
          task.status,
          'public',
          task.bounty,
          'v1.0',
          users[4].id, // admin as publisher
          task.assigneeId,
          task.groupId,
          task.complexity,
          task.priority,
          actualEndDate,
          task.status === 'completed', // is_bounty_settled
        ]
      );
    }
    
    console.log(`✅ Created ${standaloneTasks.length} standalone tasks\n`);
    
    await client.query('COMMIT');
    
    console.log('✨ Data seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - Group memberships: ${groupMemberships.length}`);
    console.log(`   - Projects: ${projectCount}`);
    console.log(`   - Project subtasks: ${taskCount}`);
    console.log(`   - Standalone tasks: ${standaloneTasks.length}`);
    console.log(`   - Total new tasks: ${taskCount + standaloneTasks.length}\n`);
    
    // Calculate and display bounty statistics
    const completedTasks = [...projects.flatMap(p => p.subtasks), ...standaloneTasks]
      .filter(t => t.status === 'completed');
    
    const totalBounty = completedTasks.reduce((sum, t) => sum + t.bounty, 0);
    
    console.log('💰 Bounty Statistics:');
    console.log(`   - Completed tasks: ${completedTasks.length}`);
    console.log(`   - Total bounty earned: ¥${totalBounty.toFixed(2)}\n`);
    
    console.log('🎯 Next steps:');
    console.log('   1. Recalculate rankings: POST /api/rankings/update-all');
    console.log('   2. Check the UI to see the new data');
    console.log('   3. Test group task displays and project hierarchies\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the seeding
seedTestData()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
