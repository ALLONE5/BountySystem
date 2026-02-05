/**
 * 种子数据生成脚本
 * 用于填充测试数据到数据库
 */

import pg from 'pg';
import bcrypt from 'bcrypt';

const { Pool } = pg;

// 数据库配置
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: '123456',
});

const SALT_ROUNDS = 10;

async function seedData() {
  const client = await pool.connect();
  
  try {
    console.log('开始生成种子数据...\n');
    
    await client.query('BEGIN');
    
    // 1. 创建用户
    console.log('1. 创建用户...');
    const password = 'Password123';
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    
    const users = [
      { username: 'admin', email: 'admin@example.com', role: 'super_admin' },
      { username: 'manager1', email: 'manager1@example.com', role: 'position_admin' },
      { username: 'user1', email: 'user1@example.com', role: 'user' },
      { username: 'user2', email: 'user2@example.com', role: 'user' },
      { username: 'user3', email: 'user3@example.com', role: 'user' },
      { username: 'developer1', email: 'dev1@example.com', role: 'user' },
      { username: 'developer2', email: 'dev2@example.com', role: 'user' },
      { username: 'designer1', email: 'designer1@example.com', role: 'user' },
    ];
    
    for (const user of users) {
      await client.query(`
        INSERT INTO users (username, email, password_hash, role)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (email) DO NOTHING
      `, [user.username, user.email, passwordHash, user.role]);
      console.log(`  - 创建用户: ${user.username} (${user.email})`);
    }
    
    // 获取用户ID
    const adminResult = await client.query(`SELECT id FROM users WHERE username = 'admin'`);
    const manager1Result = await client.query(`SELECT id FROM users WHERE username = 'manager1'`);
  const dev1Result = await client.query(`SELECT id FROM users WHERE username = 'developer1'`);
  const dev2Result = await client.query(`SELECT id FROM users WHERE username = 'developer2'`);
  const designer1Result = await client.query(`SELECT id FROM users WHERE username = 'designer1'`);
  const user1Result = await client.query(`SELECT id FROM users WHERE username = 'user1'`);
  const user2Result = await client.query(`SELECT id FROM users WHERE username = 'user2'`);
  const user3Result = await client.query(`SELECT id FROM users WHERE username = 'user3'`);
    
    const adminId = adminResult.rows[0]?.id;
    const manager1Id = manager1Result.rows[0]?.id;
    const dev1Id = dev1Result.rows[0]?.id;
  const dev2Id = dev2Result.rows[0]?.id;
  const designer1Id = designer1Result.rows[0]?.id;
  const user1Id = user1Result.rows[0]?.id;
  const user2Id = user2Result.rows[0]?.id;
  const user3Id = user3Result.rows[0]?.id;
    
    // 2. 创建赏金算法
    console.log('\n2. 创建赏金算法...');
    await client.query(`
      INSERT INTO bounty_algorithms (version, base_amount, urgency_weight, importance_weight, duration_weight, formula, effective_from, created_by)
      VALUES ('v1.0', 100.00, 5.00, 3.00, 1.00, 'baseAmount + (urgency * urgencyWeight) + (importance * importanceWeight) + (duration * durationWeight)', NOW() - INTERVAL '1 month', $1)
      ON CONFLICT (version) DO NOTHING
    `, [adminId]);
    
    // 3. 创建岗位
    console.log('\n3. 创建岗位...');
    const positions = [
      { name: 'Frontend Developer', description: '负责前端开发工作' },
      { name: 'Backend Developer', description: '负责后端开发工作' },
      { name: 'UI/UX Designer', description: '负责界面设计工作' },
    ];
    
    for (const position of positions) {
      await client.query(`
        INSERT INTO positions (name, description)
        VALUES ($1, $2)
        ON CONFLICT (name) DO NOTHING
      `, [position.name, position.description]);
      console.log(`  - 创建岗位: ${position.name}`);
    }
    
    // 分配岗位管理员
    const frontendPosResult2 = await client.query(`SELECT id FROM positions WHERE name = 'Frontend Developer'`);
    const backendPosResult2 = await client.query(`SELECT id FROM positions WHERE name = 'Backend Developer'`);
    const designerPosResult2 = await client.query(`SELECT id FROM positions WHERE name = 'UI/UX Designer'`);
    
    if (frontendPosResult2.rows[0] && manager1Id) {
      await client.query(`
        INSERT INTO position_admins (position_id, admin_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `, [frontendPosResult2.rows[0].id, manager1Id]);
    }
    
    if (backendPosResult2.rows[0] && manager1Id) {
      await client.query(`
        INSERT INTO position_admins (position_id, admin_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `, [backendPosResult2.rows[0].id, manager1Id]);
    }
    
    if (designerPosResult2.rows[0] && manager1Id) {
      await client.query(`
        INSERT INTO position_admins (position_id, admin_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `, [designerPosResult2.rows[0].id, manager1Id]);
    }
    
    // 获取岗位ID
    const frontendPosResult = await client.query(`SELECT id FROM positions WHERE name = 'Frontend Developer'`);
    const backendPosResult = await client.query(`SELECT id FROM positions WHERE name = 'Backend Developer'`);
    const designerPosResult = await client.query(`SELECT id FROM positions WHERE name = 'UI/UX Designer'`);
    
    const frontendPosId = frontendPosResult.rows[0]?.id;
    const backendPosId = backendPosResult.rows[0]?.id;
    const designerPosId = designerPosResult.rows[0]?.id;
    
    // 4. 分配用户岗位
    console.log('\n4. 分配用户岗位...');
    if (dev1Id && frontendPosId) {
      await client.query(`
        INSERT INTO user_positions (user_id, position_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `, [dev1Id, frontendPosId]);
      console.log('  - developer1 -> Frontend Developer');
    }
    
    if (dev2Id && backendPosId) {
      await client.query(`
        INSERT INTO user_positions (user_id, position_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `, [dev2Id, backendPosId]);
      console.log('  - developer2 -> Backend Developer');
    }
    
    if (designer1Id && designerPosId) {
      await client.query(`
        INSERT INTO user_positions (user_id, position_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `, [designer1Id, designerPosId]);
      console.log('  - designer1 -> UI/UX Designer');
    }
    
    // 5. 创建组群与成员
    console.log('\n5. 创建组群与成员...');
    const groupDefinitions = [
      {
        name: '前端攻坚组',
        creatorId: manager1Id || adminId,
        members: [adminId, manager1Id, dev1Id, designer1Id],
      },
      {
        name: '后端性能组',
        creatorId: manager1Id || adminId,
        members: [manager1Id, dev2Id, user2Id, user3Id],
      },
      {
        name: '体验设计组',
        creatorId: adminId,
        members: [adminId, designer1Id, user1Id],
      },
    ];

    const groupIds = {};

    for (const group of groupDefinitions) {
      if (!group.creatorId) continue;
      const existing = await client.query(`SELECT id FROM task_groups WHERE name = $1`, [group.name]);
      let groupId = existing.rows[0]?.id;
      if (!groupId) {
        const created = await client.query(`
          INSERT INTO task_groups (name, creator_id)
          VALUES ($1, $2)
          RETURNING id
        `, [group.name, group.creatorId]);
        groupId = created.rows[0].id;
        console.log(`  - 创建组群: ${group.name}`);
      } else {
        console.log(`  - 组群已存在: ${group.name}`);
      }

      groupIds[group.name] = groupId;

      const memberIds = [...new Set(group.members.filter(Boolean))];
      for (const memberId of memberIds) {
        await client.query(`
          INSERT INTO group_members (group_id, user_id)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `, [groupId, memberId]);
      }
      console.log(`    成员数: ${memberIds.length}`);
    }

    const frontendGroupId = groupIds['前端攻坚组'];
    const backendGroupId = groupIds['后端性能组'];
    const designGroupId = groupIds['体验设计组'];

    // 6. 创建任务
    console.log('\n6. 创建任务...');
    
    // 主任务1
    const task1Result = await client.query(`
      INSERT INTO tasks (name, description, publisher_id, depth, is_executable, estimated_hours, complexity, priority, status, visibility, bounty_amount, bounty_algorithm_version, group_id)
      VALUES ($1, $2, $3, 0, false, 40, 4, 5, 'not_started', 'public', 500, 'v1.0', $4)
      RETURNING id
    `, ['开发用户管理模块', '实现完整的用户管理功能，包括增删改查', adminId, backendGroupId]);
    const task1Id = task1Result.rows[0].id;
    console.log('  - 创建主任务: 开发用户管理模块');
    
    // 子任务1.1
    await client.query(`
      INSERT INTO tasks (name, description, publisher_id, parent_id, depth, is_executable, estimated_hours, complexity, priority, status, visibility, bounty_amount, bounty_algorithm_version, planned_start_date, planned_end_date, position_id, group_id)
      VALUES ($1, $2, $3, $4, 1, true, 8, 3, 4, 'available', 'position_only', 150, 'v1.0', NOW(), NOW() + INTERVAL '3 days', $5, $6)
    `, ['设计用户界面', '设计用户管理界面的UI/UX', adminId, task1Id, designerPosId, designGroupId]);
    console.log('    - 子任务: 设计用户界面');
    
    // 子任务1.2
    await client.query(`
      INSERT INTO tasks (name, description, publisher_id, parent_id, depth, is_executable, estimated_hours, complexity, priority, status, visibility, bounty_amount, bounty_algorithm_version, planned_start_date, planned_end_date, position_id, group_id)
      VALUES ($1, $2, $3, $4, 1, true, 16, 4, 5, 'available', 'position_only', 250, 'v1.0', NOW(), NOW() + INTERVAL '5 days', $5, $6)
    `, ['实现后端API', '开发用户管理的RESTful API', adminId, task1Id, backendPosId, backendGroupId]);
    console.log('    - 子任务: 实现后端API');
    
    // 其他任务
    await client.query(`
      INSERT INTO tasks (name, description, publisher_id, depth, is_executable, estimated_hours, complexity, priority, status, visibility, bounty_amount, bounty_algorithm_version, planned_start_date, planned_end_date, group_id)
      VALUES ($1, $2, $3, 0, true, 4, 2, 5, 'available', 'public', 120, 'v1.0', NOW(), NOW() + INTERVAL '1 day', $4)
    `, ['修复登录页面Bug', '修复登录页面在移动端显示异常的问题', manager1Id, frontendGroupId]);
    console.log('  - 创建任务: 修复登录页面Bug');
    
    await client.query(`
      INSERT INTO tasks (name, description, publisher_id, depth, is_executable, estimated_hours, complexity, priority, status, visibility, bounty_amount, bounty_algorithm_version, planned_start_date, planned_end_date, group_id)
      VALUES ($1, $2, $3, 0, true, 8, 4, 3, 'available', 'public', 200, 'v1.0', NOW() + INTERVAL '1 day', NOW() + INTERVAL '7 days', $4)
    `, ['优化数据库查询性能', '优化慢查询，添加必要的索引', manager1Id, backendGroupId]);
    console.log('  - 创建任务: 优化数据库查询性能');
    
    // 进行中的任务
    await client.query(`
      INSERT INTO tasks (name, description, publisher_id, assignee_id, depth, is_executable, estimated_hours, complexity, priority, status, visibility, bounty_amount, bounty_algorithm_version, progress, planned_start_date, planned_end_date, actual_start_date, group_id)
      VALUES ($1, $2, $3, $4, 0, true, 6, 3, 4, 'in_progress', 'public', 180, 'v1.0', 45, NOW() - INTERVAL '2 days', NOW() + INTERVAL '2 days', NOW() - INTERVAL '2 days', $5)
    `, ['实现用户头像上传功能', '允许用户上传和更换头像', adminId, dev1Id, frontendGroupId]);
    console.log('  - 创建任务: 实现用户头像上传功能 (进行中)');
    
    // 已完成的任务
    await client.query(`
      INSERT INTO tasks (name, description, publisher_id, assignee_id, depth, is_executable, estimated_hours, complexity, priority, status, visibility, bounty_amount, bounty_algorithm_version, progress, progress_locked, planned_start_date, planned_end_date, actual_start_date, actual_end_date, is_bounty_settled, group_id)
      VALUES ($1, $2, $3, $4, 0, true, 2, 1, 5, 'completed', 'public', 80, 'v1.0', 100, true, NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 days', true, $5)
    `, ['修复注册表单验证', '修复注册表单的邮箱验证问题', manager1Id, dev2Id, backendGroupId]);
    console.log('  - 创建任务: 修复注册表单验证 (已完成)');

    // 为体验设计组增加一个进行中的任务
    await client.query(`
      INSERT INTO tasks (name, description, publisher_id, assignee_id, depth, is_executable, estimated_hours, complexity, priority, status, visibility, bounty_amount, bounty_algorithm_version, progress, planned_start_date, planned_end_date, actual_start_date, group_id)
      VALUES ($1, $2, $3, $4, 0, true, 10, 3, 4, 'in_progress', 'public', 220, 'v1.0', 60, NOW() - INTERVAL '1 day', NOW() + INTERVAL '4 days', NOW() - INTERVAL '1 day', $5)
    `, ['改进任务详情页面体验', '重新设计任务详情信息层级与可读性', adminId, designer1Id, designGroupId]);
    console.log('  - 创建任务: 改进任务详情页面体验 (进行中)');
    
    // 6. 创建通知
    console.log('\n6. 创建通知...');
    await client.query(`
      INSERT INTO notifications (user_id, type, title, message, is_read)
      VALUES ($1, 'task_assigned', '新任务分配', '您有一个新的任务：实现用户头像上传功能', false)
    `, [dev1Id]);
    
    await client.query(`
      INSERT INTO notifications (user_id, type, title, message, is_read)
      VALUES ($1, 'deadline_reminder', '任务截止提醒', '任务"实现用户头像上传功能"将在2天后到期', false)
    `, [dev1Id]);
    console.log('  - 创建了2条通知');
    
    // 7. 创建头像
    console.log('\n7. 创建头像...');
    const avatars = [
      { name: '新手徽章', imageUrl: '/avatars/newbie.png', requiredRank: 100 },
      { name: '青铜猎人', imageUrl: '/avatars/bronze.png', requiredRank: 50 },
      { name: '白银猎人', imageUrl: '/avatars/silver.png', requiredRank: 20 },
      { name: '黄金猎人', imageUrl: '/avatars/gold.png', requiredRank: 10 },
      { name: '钻石猎人', imageUrl: '/avatars/diamond.png', requiredRank: 3 },
    ];
    
    for (const avatar of avatars) {
      await client.query(`
        INSERT INTO avatars (name, image_url, required_rank)
        VALUES ($1, $2, $3)
        ON CONFLICT DO NOTHING
      `, [avatar.name, avatar.imageUrl, avatar.requiredRank]);
      console.log(`  - 创建头像: ${avatar.name}`);
    }
    
    // 8. 创建排名
    console.log('\n8. 创建排名...');
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;
    
    if (dev2Id) {
      await client.query(`
        INSERT INTO rankings (user_id, period, year, month, total_bounty, rank)
        VALUES ($1, 'monthly', $2, $3, 500, 1)
      `, [dev2Id, year, month]);
    }
    
    if (dev1Id) {
      await client.query(`
        INSERT INTO rankings (user_id, period, year, month, total_bounty, rank)
        VALUES ($1, 'monthly', $2, $3, 350, 2)
      `, [dev1Id, year, month]);
    }
    console.log('  - 创建了排名数据');
    
    // 9. 创建管理员预算
    console.log('\n9. 创建管理员预算...');
    if (adminId) {
      await client.query(`
        INSERT INTO admin_budgets (admin_id, year, month, total_budget, used_budget)
        VALUES ($1, $2, $3, 10000, 500)
        ON CONFLICT (admin_id, year, month) DO UPDATE
          SET total_budget = EXCLUDED.total_budget,
              used_budget = LEAST(EXCLUDED.total_budget, EXCLUDED.used_budget)
      `, [adminId, year, month]);
    }
    console.log('  - 创建了管理员预算');
    
    await client.query('COMMIT');
    
    console.log('\n✅ 种子数据生成完成！\n');
    console.log('测试账号信息:');
    console.log('==========================================');
    console.log('超级管理员:');
    console.log('  用户名: admin');
    console.log('  邮箱: admin@example.com');
    console.log('  密码: Password123');
    console.log('');
    console.log('岗位管理员:');
    console.log('  用户名: manager1');
    console.log('  邮箱: manager1@example.com');
    console.log('  密码: Password123');
    console.log('');
    console.log('普通用户:');
    console.log('  用户名: developer1, developer2, designer1, user1-3');
    console.log('  密码: Password123');
    console.log('==========================================\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ 生成种子数据失败:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// 运行脚本
seedData().catch(console.error);
