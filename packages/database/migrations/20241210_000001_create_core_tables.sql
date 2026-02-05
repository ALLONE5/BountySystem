-- Migration: Create Core Tables
-- Description: Creates User, Position, Task, and TaskDependency tables
-- Date: 2024-12-10

BEGIN;

-- ============================================================================
-- User Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  avatar_id UUID,
  role user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for users table
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================================
-- Position Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  required_skills TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index for positions table
CREATE INDEX idx_positions_name ON positions(name);

-- ============================================================================
-- User-Position Relationship Table (Many-to-Many)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  position_id UUID NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, position_id)
);

-- Create indexes for user_positions table
CREATE INDEX idx_user_positions_user_id ON user_positions(user_id);
CREATE INDEX idx_user_positions_position_id ON user_positions(position_id);

-- Add constraint to limit user to maximum 3 positions
CREATE OR REPLACE FUNCTION check_user_position_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM user_positions WHERE user_id = NEW.user_id) >= 3 THEN
    RAISE EXCEPTION 'User cannot have more than 3 positions';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_user_position_limit
  BEFORE INSERT ON user_positions
  FOR EACH ROW
  EXECUTE FUNCTION check_user_position_limit();

-- ============================================================================
-- Position Administrators Table (Many-to-Many)
-- ============================================================================
CREATE TABLE IF NOT EXISTS position_admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  position_id UUID NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(position_id, admin_id)
);

-- Create indexes for position_admins table
CREATE INDEX idx_position_admins_position_id ON position_admins(position_id);
CREATE INDEX idx_position_admins_admin_id ON position_admins(admin_id);

-- ============================================================================
-- Task Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(500) NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  depth INTEGER NOT NULL DEFAULT 0 CHECK (depth >= 0 AND depth <= 2),
  is_executable BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Task attributes
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  planned_start_date TIMESTAMP WITH TIME ZONE,
  planned_end_date TIMESTAMP WITH TIME ZONE,
  actual_start_date TIMESTAMP WITH TIME ZONE,
  actual_end_date TIMESTAMP WITH TIME ZONE,
  estimated_hours DECIMAL(10, 2),
  complexity INTEGER CHECK (complexity >= 1 AND complexity <= 5),
  priority INTEGER CHECK (priority >= 1 AND priority <= 5),
  status task_status NOT NULL DEFAULT 'not_started',
  position_id UUID REFERENCES positions(id) ON DELETE SET NULL,
  visibility visibility NOT NULL DEFAULT 'public',
  
  -- Bounty information
  bounty_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  bounty_algorithm_version VARCHAR(50),
  is_bounty_settled BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Relationships
  publisher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  group_id UUID,
  
  -- Progress tracking
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  progress_locked BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Aggregated statistics (for parent tasks)
  aggregated_estimated_hours DECIMAL(10, 2),
  aggregated_complexity DECIMAL(5, 2),
  
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for tasks table (as specified in design document)
CREATE INDEX idx_tasks_publisher_id ON tasks(publisher_id);
CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_position_id ON tasks(position_id);
CREATE INDEX idx_tasks_parent_id ON tasks(parent_id);
CREATE INDEX idx_tasks_group_id ON tasks(group_id);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
CREATE INDEX idx_tasks_planned_end_date ON tasks(planned_end_date);

-- Add constraint to ensure leaf nodes are executable
CREATE OR REPLACE FUNCTION check_task_executable()
RETURNS TRIGGER AS $$
DECLARE
  child_count INTEGER;
BEGIN
  -- Check if task has children
  SELECT COUNT(*) INTO child_count FROM tasks WHERE parent_id = NEW.id;
  
  IF child_count > 0 THEN
    NEW.is_executable := FALSE;
  ELSE
    NEW.is_executable := TRUE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_task_executable
  BEFORE INSERT OR UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION check_task_executable();

-- Update parent task when child is added
CREATE OR REPLACE FUNCTION update_parent_executable()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    UPDATE tasks SET is_executable = FALSE WHERE id = NEW.parent_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_parent_on_child_insert
  AFTER INSERT ON tasks
  FOR EACH ROW
  WHEN (NEW.parent_id IS NOT NULL)
  EXECUTE FUNCTION update_parent_executable();

-- ============================================================================
-- Task Dependency Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS task_dependencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  depends_on_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(task_id, depends_on_task_id),
  CHECK (task_id != depends_on_task_id)
);

-- Create indexes for task_dependencies table (as specified in design document)
CREATE INDEX idx_task_dependencies_task_id ON task_dependencies(task_id);
CREATE INDEX idx_task_dependencies_depends_on_task_id ON task_dependencies(depends_on_task_id);

-- Function to detect circular dependencies
CREATE OR REPLACE FUNCTION check_circular_dependency()
RETURNS TRIGGER AS $$
DECLARE
  has_cycle BOOLEAN;
BEGIN
  -- Use recursive CTE to detect cycles
  WITH RECURSIVE dependency_chain AS (
    -- Start with the new dependency
    SELECT NEW.task_id as current_task, NEW.depends_on_task_id as depends_on, 1 as depth
    UNION ALL
    -- Follow the chain
    SELECT dc.current_task, td.depends_on_task_id, dc.depth + 1
    FROM dependency_chain dc
    JOIN task_dependencies td ON td.task_id = dc.depends_on
    WHERE dc.depth < 100  -- Prevent infinite loops
  )
  SELECT EXISTS(
    SELECT 1 FROM dependency_chain 
    WHERE current_task = depends_on
  ) INTO has_cycle;
  
  IF has_cycle THEN
    RAISE EXCEPTION 'Circular dependency detected';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_circular_dependency
  BEFORE INSERT ON task_dependencies
  FOR EACH ROW
  EXECUTE FUNCTION check_circular_dependency();

COMMIT;
