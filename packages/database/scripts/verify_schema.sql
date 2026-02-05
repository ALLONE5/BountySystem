-- Verification script to check database schema
-- This script lists all tables, indexes, and constraints

\echo '========================================='
\echo 'Database Schema Verification'
\echo '========================================='
\echo ''

\echo 'Enum Types:'
\echo '-----------------------------------------'
SELECT n.nspname as schema, t.typname as name
FROM pg_type t 
LEFT JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace 
WHERE (t.typrelid = 0 OR (SELECT c.relkind = 'c' FROM pg_catalog.pg_class c WHERE c.oid = t.typrelid)) 
AND NOT EXISTS(SELECT 1 FROM pg_catalog.pg_type el WHERE el.oid = t.typelem AND el.typarray = t.oid)
AND n.nspname NOT IN ('pg_catalog', 'information_schema')
AND t.typname IN ('user_role', 'task_status', 'visibility', 'notification_type', 'application_status', 'allocation_type', 'ranking_period')
ORDER BY t.typname;

\echo ''
\echo 'Tables:'
\echo '-----------------------------------------'
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

\echo ''
\echo 'Table Row Counts:'
\echo '-----------------------------------------'
SELECT 
  schemaname,
  tablename,
  n_live_tup as row_count
FROM pg_stat_user_tables
ORDER BY tablename;

\echo ''
\echo 'Indexes:'
\echo '-----------------------------------------'
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

\echo ''
\echo 'Foreign Key Constraints:'
\echo '-----------------------------------------'
SELECT
  tc.table_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

\echo ''
\echo 'Check Constraints:'
\echo '-----------------------------------------'
SELECT
  tc.table_name,
  tc.constraint_name,
  cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc
  ON tc.constraint_name = cc.constraint_name
WHERE tc.constraint_type = 'CHECK'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

\echo ''
\echo 'Triggers:'
\echo '-----------------------------------------'
SELECT 
  event_object_table AS table_name,
  trigger_name,
  event_manipulation AS event,
  action_timing AS timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

\echo ''
\echo '========================================='
\echo 'Verification Complete'
\echo '========================================='
