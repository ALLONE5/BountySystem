/**
 * Script to investigate browse tasks visibility issue
 * Analyzes task filtering conditions to understand why many published tasks are not showing
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
  database: process.env.DB_NAME || 'bounty_hunter',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function analyzeTaskVisibility() {
  try {
    console.log('=== Browse Tasks Visibility Analysis ===\n');

    // 1. Total tasks
    const totalResult = await pool.query('SELECT COUNT(*) as count FROM tasks');
    console.log(`1. Total tasks in database: ${totalResult.rows[0].count}`);

    // 2. Tasks by is_executable
    const executableResult = await pool.query(`
      SELECT 
        is_executable,
        COUNT(*) as count
      FROM tasks
      GROUP BY is_executable
      ORDER BY is_executable DESC
    `);
    console.log('\n2. Tasks by is_executable:');
    executableResult.rows.forEach(row => {
      console.log(`   - is_executable = ${row.is_executable}: ${row.count} tasks`);
    });

    // 3. Tasks by assignee_id (assigned vs unassigned)
    const assigneeResult = await pool.query(`
      SELECT 
        CASE 
          WHEN assignee_id IS NULL THEN 'Unassigned'
          ELSE 'Assigned'
        END as assignment_status,
        COUNT(*) as count
      FROM tasks
      GROUP BY assignment_status
      ORDER BY assignment_status
    `);
    console.log('\n3. Tasks by assignment status:');
    assigneeResult.rows.forEach(row => {
      console.log(`   - ${row.assignment_status}: ${row.count} tasks`);
    });

    // 4. Tasks that meet BOTH conditions (is_executable = true AND assignee_id IS NULL)
    const availableResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM tasks
      WHERE is_executable = true AND assignee_id IS NULL
    `);
    console.log(`\n4. Tasks meeting BOTH conditions (is_executable = true AND assignee_id IS NULL): ${availableResult.rows[0].count}`);

    // 5. Tasks by depth
    const depthResult = await pool.query(`
      SELECT 
        depth,
        COUNT(*) as count
      FROM tasks
      GROUP BY depth
      ORDER BY depth
    `);
    console.log('\n5. Tasks by depth (hierarchy level):');
    depthResult.rows.forEach(row => {
      console.log(`   - Depth ${row.depth}: ${row.count} tasks`);
    });

    // 6. Tasks by status
    const statusResult = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM tasks
      GROUP BY status
      ORDER BY count DESC
    `);
    console.log('\n6. Tasks by status:');
    statusResult.rows.forEach(row => {
      console.log(`   - ${row.status}: ${row.count} tasks`);
    });

    // 7. Tasks by visibility
    const visibilityResult = await pool.query(`
      SELECT 
        visibility,
        COUNT(*) as count
      FROM tasks
      GROUP BY visibility
      ORDER BY count DESC
    `);
    console.log('\n7. Tasks by visibility:');
    visibilityResult.rows.forEach(row => {
      console.log(`   - ${row.visibility}: ${row.count} tasks`);
    });

    // 8. Tasks by is_published
    const publishedResult = await pool.query(`
      SELECT 
        is_published,
        COUNT(*) as count
      FROM tasks
      GROUP BY is_published
      ORDER BY is_published DESC
    `);
    console.log('\n8. Tasks by is_published:');
    publishedResult.rows.forEach(row => {
      console.log(`   - is_published = ${row.is_published}: ${row.count} tasks`);
    });

    // 9. Detailed breakdown: parent tasks vs subtasks
    const hierarchyResult = await pool.query(`
      SELECT 
        CASE 
          WHEN parent_id IS NULL THEN 'Parent Task'
          ELSE 'Subtask'
        END as task_type,
        is_executable,
        assignee_id IS NULL as unassigned,
        COUNT(*) as count
      FROM tasks
      GROUP BY task_type, is_executable, unassigned
      ORDER BY task_type, is_executable DESC, unassigned DESC
    `);
    console.log('\n9. Detailed breakdown (Parent vs Subtask):');
    hierarchyResult.rows.forEach(row => {
      console.log(`   - ${row.task_type}, is_executable=${row.is_executable}, unassigned=${row.unassigned}: ${row.count} tasks`);
    });

    // 10. Sample of tasks that are NOT showing (is_executable = false OR assignee_id IS NOT NULL)
    const hiddenTasksResult = await pool.query(`
      SELECT 
        id,
        name,
        depth,
        is_executable,
        assignee_id IS NOT NULL as has_assignee,
        parent_id IS NOT NULL as is_subtask,
        status,
        visibility,
        is_published
      FROM tasks
      WHERE is_executable = false OR assignee_id IS NOT NULL
      LIMIT 10
    `);
    console.log('\n10. Sample of tasks NOT showing in browse (first 10):');
    hiddenTasksResult.rows.forEach(row => {
      console.log(`   - ${row.name}`);
      console.log(`     ID: ${row.id}`);
      console.log(`     Depth: ${row.depth}, is_executable: ${row.is_executable}, has_assignee: ${row.has_assignee}`);
      console.log(`     is_subtask: ${row.is_subtask}, status: ${row.status}, visibility: ${row.visibility}`);
      console.log(`     is_published: ${row.is_published}`);
      console.log('');
    });

    // 11. Check if there are parent tasks with children
    const parentTasksResult = await pool.query(`
      SELECT 
        t.id,
        t.name,
        t.is_executable,
        t.assignee_id IS NOT NULL as has_assignee,
        COUNT(st.id) as subtask_count
      FROM tasks t
      LEFT JOIN tasks st ON st.parent_id = t.id
      WHERE t.parent_id IS NULL
      GROUP BY t.id, t.name, t.is_executable, has_assignee
      HAVING COUNT(st.id) > 0
      LIMIT 10
    `);
    console.log('\n11. Parent tasks with subtasks (first 10):');
    parentTasksResult.rows.forEach(row => {
      console.log(`   - ${row.name}`);
      console.log(`     ID: ${row.id}, is_executable: ${row.is_executable}, has_assignee: ${row.has_assignee}`);
      console.log(`     Subtask count: ${row.subtask_count}`);
      console.log('');
    });

    console.log('\n=== Analysis Complete ===');
    console.log('\nKey Findings:');
    console.log('- The browse tasks page filters for: is_executable = true AND assignee_id IS NULL');
    console.log('- Parent tasks typically have is_executable = false (they are not leaf nodes)');
    console.log('- Tasks with assignees are filtered out (already assigned)');
    console.log('\nPossible Issues:');
    console.log('1. Many tasks are parent tasks (is_executable = false) and won\'t show');
    console.log('2. Tasks that have been assigned (assignee_id IS NOT NULL) won\'t show');
    console.log('3. Subtasks that are not published (is_published = false) won\'t show');

  } catch (error) {
    console.error('Error analyzing task visibility:', error);
  } finally {
    await pool.end();
  }
}

analyzeTaskVisibility();
