-- 种子数据脚本
-- 用于填充测试数据

-- 清理现有数据（可选，谨慎使用）
-- TRUNCATE TABLE users, positions, tasks, task_dependencies, task_assistants, 
-- task_groups, position_applications, notifications, rankings, avatars, 
-- bounty_algorithms, admin_budgets, task_reviews, bounty_transactions CASCADE;

-- 1. 创建赏金算法 (Moved down)
-- INSERT INTO bounty_algorithms ...

-- 2. 创建用户（密码都是: Password123）
-- 密码哈希是 bcrypt('Password123', 10) 的结果
INSERT INTO users (username, email, password_hash, role)
VALUES 
  ('admin', 'admin@example.com', '$2b$10$rKZLvXz5JQZ5Z5Z5Z5Z5ZeqKZLvXz5JQZ5Z5Z5Z5Z5ZeqKZLvXz5J', 'super_admin'),
  ('manager1', 'manager1@example.com', '$2b$10$rKZLvXz5JQZ5Z5Z5Z5Z5ZeqKZLvXz5JQZ5Z5Z5Z5Z5ZeqKZLvXz5J', 'position_admin'),
  ('user1', 'user1@example.com', '$2b$10$rKZLvXz5JQZ5Z5Z5Z5Z5ZeqKZLvXz5JQZ5Z5Z5Z5Z5ZeqKZLvXz5J', 'user'),
  ('user2', 'user2@example.com', '$2b$10$rKZLvXz5JQZ5Z5Z5Z5Z5ZeqKZLvXz5JQZ5Z5Z5Z5Z5ZeqKZLvXz5J', 'user'),
  ('user3', 'user3@example.com', '$2b$10$rKZLvXz5JQZ5Z5Z5Z5Z5ZeqKZLvXz5JQZ5Z5Z5Z5Z5ZeqKZLvXz5J', 'user'),
  ('developer1', 'dev1@example.com', '$2b$10$rKZLvXz5JQZ5Z5Z5Z5Z5ZeqKZLvXz5JQZ5Z5Z5Z5Z5ZeqKZLvXz5J', 'user'),
  ('developer2', 'dev2@example.com', '$2b$10$rKZLvXz5JQZ5Z5Z5Z5Z5ZeqKZLvXz5JQZ5Z5Z5Z5Z5ZeqKZLvXz5J', 'user'),
  ('designer1', 'designer1@example.com', '$2b$10$rKZLvXz5JQZ5Z5Z5Z5Z5ZeqKZLvXz5JQZ5Z5Z5Z5Z5ZeqKZLvXz5J', 'user')
ON CONFLICT (email) DO NOTHING;

-- 1. 创建赏金算法 (Moved here)
INSERT INTO bounty_algorithms (version, base_amount, urgency_weight, importance_weight, duration_weight, formula, effective_from, created_by)
SELECT 
  'v1.0', 100, 50, 30, 10, 'baseAmount + (urgency * urgencyWeight) + (importance * importanceWeight) + (duration * durationWeight)', NOW() - INTERVAL '1 month', id
FROM users WHERE username = 'admin'
ON CONFLICT (version) DO NOTHING;

-- 3. 创建岗位
INSERT INTO positions (name, description)
VALUES ('Frontend Developer', '负责前端开发工作')
ON CONFLICT DO NOTHING;

INSERT INTO positions (name, description)
VALUES ('Backend Developer', '负责后端开发工作')
ON CONFLICT DO NOTHING;

INSERT INTO positions (name, description)
VALUES ('UI/UX Designer', '负责界面设计工作')
ON CONFLICT DO NOTHING;

-- 4. 分配用户岗位
INSERT INTO user_positions (user_id, position_id)
SELECT u.id, p.id
FROM users u, positions p
WHERE u.username = 'developer1' AND p.name = 'Frontend Developer'
ON CONFLICT DO NOTHING;

INSERT INTO user_positions (user_id, position_id)
SELECT u.id, p.id
FROM users u, positions p
WHERE u.username = 'developer2' AND p.name = 'Backend Developer'
ON CONFLICT DO NOTHING;

INSERT INTO user_positions (user_id, position_id)
SELECT u.id, p.id
FROM users u, positions p
WHERE u.username = 'designer1' AND p.name = 'UI/UX Designer'
ON CONFLICT DO NOTHING;

-- 5. 创建任务
-- 主任务1: 开发新功能
INSERT INTO tasks (name, description, publisher_id, depth, is_executable, estimated_hours, complexity, priority, status, visibility, bounty_amount, bounty_algorithm_version)
SELECT 
  '开发用户管理模块',
  '实现完整的用户管理功能，包括增删改查',
  id,
  0,
  false,
  40,
  4,
  5,
  'not_started',
  'public',
  500,
  'v1.0'
FROM users WHERE username = 'admin'
LIMIT 1;

-- 子任务1.1
INSERT INTO tasks (name, description, publisher_id, parent_id, depth, is_executable, estimated_hours, complexity, priority, status, visibility, bounty_amount, bounty_algorithm_version, planned_start_date, planned_end_date)
SELECT 
  '设计用户界面',
  '设计用户管理界面的UI/UX',
  u.id,
  t.id,
  1,
  true,
  8,
  3,
  4,
  'available',
  'public',
  150,
  'v1.0',
  NOW(),
  NOW() + INTERVAL '3 days'
FROM users u, tasks t
WHERE u.username = 'admin' AND t.name = '开发用户管理模块'
LIMIT 1;

-- 子任务1.2
INSERT INTO tasks (name, description, publisher_id, parent_id, depth, is_executable, estimated_hours, complexity, priority, status, visibility, bounty_amount, bounty_algorithm_version, planned_start_date, planned_end_date)
SELECT 
  '实现后端API',
  '开发用户管理的RESTful API',
  u.id,
  t.id,
  1,
  true,
  16,
  4,
  5,
  'available',
  'position_only',
  250,
  'v1.0',
  NOW(),
  NOW() + INTERVAL '5 days'
FROM users u, tasks t, positions p
WHERE u.username = 'admin' AND t.name = '开发用户管理模块' AND p.name = 'Backend Developer'
LIMIT 1;

-- 主任务2: 修复Bug
INSERT INTO tasks (name, description, publisher_id, depth, is_executable, estimated_hours, complexity, priority, status, visibility, bounty_amount, bounty_algorithm_version, planned_start_date, planned_end_date)
SELECT 
  '修复登录页面Bug',
  '修复登录页面在移动端显示异常的问题',
  id,
  0,
  true,
  4,
  2,
  5,
  'available',
  'public',
  120,
  'v1.0',
  NOW(),
  NOW() + INTERVAL '1 day'
FROM users WHERE username = 'manager1'
LIMIT 1;

-- 主任务3: 优化性能
INSERT INTO tasks (name, description, publisher_id, depth, is_executable, estimated_hours, complexity, priority, status, visibility, bounty_amount, bounty_algorithm_version, planned_start_date, planned_end_date)
SELECT 
  '优化数据库查询性能',
  '优化慢查询，添加必要的索引',
  id,
  0,
  true,
  8,
  4,
  3,
  'available',
  'public',
  200,
  'v1.0',
  NOW() + INTERVAL '1 day',
  NOW() + INTERVAL '7 days'
FROM users WHERE username = 'manager1'
LIMIT 1;

-- 已分配的任务
INSERT INTO tasks (name, description, publisher_id, assignee_id, depth, is_executable, estimated_hours, complexity, priority, status, visibility, bounty_amount, bounty_algorithm_version, progress, planned_start_date, planned_end_date, actual_start_date)
SELECT 
  '实现用户头像上传功能',
  '允许用户上传和更换头像',
  u1.id,
  u2.id,
  0,
  true,
  6,
  3,
  4,
  'in_progress',
  'public',
  180,
  'v1.0',
  45,
  NOW() - INTERVAL '2 days',
  NOW() + INTERVAL '2 days',
  NOW() - INTERVAL '2 days'
FROM users u1, users u2
WHERE u1.username = 'admin' AND u2.username = 'developer1'
LIMIT 1;

-- 已完成的任务
INSERT INTO tasks (name, description, publisher_id, assignee_id, depth, is_executable, estimated_hours, complexity, priority, status, visibility, bounty_amount, bounty_algorithm_version, progress, progress_locked, planned_start_date, planned_end_date, actual_start_date, actual_end_date, is_bounty_settled)
SELECT 
  '修复注册表单验证',
  '修复注册表单的邮箱验证问题',
  u1.id,
  u2.id,
  0,
  true,
  2,
  1,
  5,
  'completed',
  'public',
  80,
  'v1.0',
  100,
  true,
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '3 days',
  true
FROM users u1, users u2
WHERE u1.username = 'manager1' AND u2.username = 'developer2'
LIMIT 1;

-- 6. 创建通知
INSERT INTO notifications (user_id, type, title, message, is_read)
SELECT 
  id,
  'task_assigned',
  '新任务分配',
  '您有一个新的任务：实现用户头像上传功能',
  false
FROM users WHERE username = 'developer1';

INSERT INTO notifications (user_id, type, title, message, is_read)
SELECT 
  id,
  'deadline_reminder',
  '任务截止提醒',
  '任务"实现用户头像上传功能"将在2天后到期',
  false
FROM users WHERE username = 'developer1';

-- 7. 创建头像数据
INSERT INTO avatars (name, image_url, required_rank)
VALUES 
  ('新手徽章', '/avatars/newbie.png', 100),
  ('青铜猎人', '/avatars/bronze.png', 10),
  ('白银猎人', '/avatars/silver.png', 5),
  ('黄金猎人', '/avatars/gold.png', 3),
  ('钻石猎人', '/avatars/diamond.png', 1)
ON CONFLICT DO NOTHING;

-- 8. 创建排名数据
INSERT INTO rankings (user_id, period, year, month, quarter, total_bounty, rank)
SELECT 
  id,
  'monthly',
  EXTRACT(YEAR FROM NOW()),
  EXTRACT(MONTH FROM NOW()),
  NULL,
  500,
  1
FROM users WHERE username = 'developer2';

INSERT INTO rankings (user_id, period, year, month, quarter, total_bounty, rank)
SELECT 
  id,
  'monthly',
  EXTRACT(YEAR FROM NOW()),
  EXTRACT(MONTH FROM NOW()),
  NULL,
  350,
  2
FROM users WHERE username = 'developer1';

-- 9. 创建管理员预算
INSERT INTO admin_budgets (admin_id, year, month, total_budget, used_budget)
SELECT 
  id,
  EXTRACT(YEAR FROM NOW()),
  EXTRACT(MONTH FROM NOW()),
  10000,
  500
FROM users WHERE role = 'super_admin'
LIMIT 1;

-- 完成
SELECT 'Seed data inserted successfully!' as message;
