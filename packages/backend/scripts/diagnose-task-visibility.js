/**
 * Diagnostic script to check why a task is not appearing in browse tasks list
 * Usage: node scripts/diagnose-task-visibility.js <taskId>
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'bounty_hunter',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

const taskId = process.argv[2];

if (!taskId) {
  console.error('Usage: node scripts/diagnose-task-visibility.js <taskId>');
  process.exit(1);
}

async function diagnoseTask() {
  try {
    // Get task details
    const taskQuery = `
      SELECT 
        t.id,
        t.name,
        t.status,
        t.visibility,
        t.is_executable,
        t.assignee_id,
        t.parent_id,
        t.depth,
        t.is_published,
        t.bounty_amount,
        t.publisher_id,
        t.group_id,
        t.position_id,
        u.username as publisher_name
      FROM tasks t
      LEFT JOIN users u ON t.publisher_id = u.id
      WHERE t.id = $1
    `;
    
    const result = await pool.query(taskQuery, [taskId]);
    
    if (result.rows.length === 0) {
      console.error(`❌ Task not found: ${taskId}`);
      process.exit(1);
    }
    
    const task = result.rows[0];
    
    console.log('\n=== TASK INFORMATION ===');
    console.log(`ID: ${task.id}`);
    console.log(`Name: ${task.name}`);
    console.log(`Publisher: ${task.publisher_name} (${task.publisher_id})`);
    console.log(`Status: ${task.status}`);
    console.log(`Visibility: ${task.visibility}`);
    console.log(`Bounty: $${task.bounty_amount}`);
    console.log('');
    
    console.log('=== FILTER CONDITIONS ===');
    console.log('Note: As of 2026-02-05, is_executable filter has been removed.');
    console.log('Both parent tasks and subtasks can appear in browse tasks.\n');
    
    // Check 1: assignee_id IS NULL
    const isUnassignedPass = task.assignee_id === null;
    console.log(`1. assignee_id IS NULL: ${isUnassignedPass ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Current value: ${task.assignee_id || 'null'}`);
    if (!isUnassignedPass) {
      console.log(`   ⚠️  Task is already assigned to user: ${task.assignee_id}`);
    }
    console.log('');
    
    // Check 2: visibility
    const visibilityPass = task.visibility === 'public';
    console.log(`2. visibility = 'public': ${visibilityPass ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Current value: ${task.visibility}`);
    if (!visibilityPass) {
      if (task.visibility === 'private') {
        console.log(`   ⚠️  Task is PRIVATE (only visible to publisher)`);
      } else if (task.visibility === 'position_only') {
        console.log(`   ⚠️  Task is POSITION_ONLY (only visible to users with matching position)`);
        if (task.position_id) {
          console.log(`   📋 Required position ID: ${task.position_id}`);
        }
      }
    }
    console.log('');
    
    // Info: is_executable (for reference only)
    console.log(`ℹ️  is_executable: ${task.is_executable} (for tracking only, not used in filtering)`);
    if (task.is_executable === false) {
      // Check for subtasks
      const subtaskQuery = `SELECT COUNT(*) as count FROM tasks WHERE parent_id = $1`;
      const subtaskResult = await pool.query(subtaskQuery, [taskId]);
      const subtaskCount = parseInt(subtaskResult.rows[0].count);
      
      if (subtaskCount > 0) {
        console.log(`   📋 Task has ${subtaskCount} subtask(s)`);
      }
    }
    console.log('');
    
    // Info: is_published (for subtasks)
    if (task.parent_id) {
      console.log(`ℹ️  is_published (subtask only): ${task.is_published ? 'true' : 'false'} (for tracking only, not used in filtering)`);
      console.log('');
    }
    
    // Overall result
    console.log('=== OVERALL RESULT ===');
    const allPass = isUnassignedPass && visibilityPass;
    
    if (allPass) {
      console.log('✅ Task SHOULD appear in browse tasks list');
      console.log('');
      console.log('If it still doesn\'t appear, check:');
      console.log('1. Cache (wait 60 seconds or clear cache with: node scripts/clear-cache.cjs)');
      console.log('2. Backend service restart (if code was recently changed)');
      console.log('3. Frontend filters (check browser console)');
      console.log('4. Database connection');
    } else {
      console.log('❌ Task WILL NOT appear in browse tasks list');
      console.log('');
      console.log('Reasons:');
      if (!isUnassignedPass) {
        console.log('- Task is already assigned');
      }
      if (!visibilityPass) {
        console.log(`- Task visibility is ${task.visibility} (not public)`);
      }
    }
    console.log('');
    
    // Additional info
    if (task.parent_id) {
      console.log('=== PARENT TASK INFO ===');
      const parentQuery = `SELECT id, name, assignee_id FROM tasks WHERE id = $1`;
      const parentResult = await pool.query(parentQuery, [task.parent_id]);
      if (parentResult.rows.length > 0) {
        const parent = parentResult.rows[0];
        console.log(`Parent: ${parent.name} (${parent.id})`);
        console.log(`Parent assignee: ${parent.assignee_id || 'none'}`);
      }
      console.log('');
    }
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

diagnoseTask();
