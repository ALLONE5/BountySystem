
import { pool } from '../src/config/database';
import { config } from '../src/config/env';

async function assignDataToAdmin() {
  console.log('Assigning data to admin user...');
  
  try {
    // 1. Get Admin User ID
    const userResult = await pool.query(`
      SELECT id FROM users WHERE username = 'admin'
    `);

    if (userResult.rows.length === 0) {
      console.log('❌ User "admin" not found!');
      return;
    }

    const adminId = userResult.rows[0].id;
    console.log(`✅ Found admin user ID: ${adminId}`);

    // 2. Assign Tasks (My Tasks)
    const tasksToAssign = await pool.query(`
      SELECT id FROM tasks 
      WHERE assignee_id != $1 OR assignee_id IS NULL
      LIMIT 5
    `, [adminId]);

    if (tasksToAssign.rows.length > 0) {
        for (const task of tasksToAssign.rows) {
            await pool.query(`
                UPDATE tasks SET assignee_id = $1, status = 'in_progress' WHERE id = $2
            `, [adminId, task.id]);
        }
        console.log(`✅ Assigned ${tasksToAssign.rows.length} tasks to admin.`);
    }

    // 3. Publish Tasks (My Bounties)
    const tasksToPublish = await pool.query(`
      SELECT id FROM tasks 
      WHERE publisher_id != $1
      LIMIT 5
    `, [adminId]);

    if (tasksToPublish.rows.length > 0) {
        for (const task of tasksToPublish.rows) {
            await pool.query(`
                UPDATE tasks SET publisher_id = $1 WHERE id = $2
            `, [adminId, task.id]);
        }
        console.log(`✅ Set admin as publisher for ${tasksToPublish.rows.length} tasks.`);
    }

    // 4. Handle Groups (task_groups)
    // Check if task_groups has data
    let groups = await pool.query('SELECT id, name FROM task_groups');
    
    if (groups.rows.length === 0) {
        console.log('ℹ️ No task_groups found. Creating sample groups...');
        const sampleGroups = ['Alpha Team', 'Beta Squad', 'Omega Force'];
        for (const name of sampleGroups) {
            await pool.query(`
                INSERT INTO task_groups (name, creator_id) VALUES ($1, $2)
            `, [name, adminId]);
        }
        groups = await pool.query('SELECT id, name FROM task_groups');
        console.log(`✅ Created ${groups.rows.length} task groups.`);
    }

    // Add admin to all task groups
    for (const group of groups.rows) {
        const memberCheck = await pool.query(`
            SELECT 1 FROM group_members WHERE group_id = $1 AND user_id = $2
        `, [group.id, adminId]);

        if (memberCheck.rows.length === 0) {
            await pool.query(`
                INSERT INTO group_members (group_id, user_id, joined_at)
                VALUES ($1, $2, NOW())
            `, [group.id, adminId]);
            console.log(`✅ Added admin to group: ${group.name}`);
        } else {
            console.log(`ℹ️ Admin already in group: ${group.name}`);
        }
    }

  } catch (error) {
    console.error('Error assigning data:', error);
  } finally {
    await pool.end();
  }
}

assignDataToAdmin();
