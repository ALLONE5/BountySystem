-- Migration: Create Auxiliary Tables
-- Description: Creates TaskAssistant, TaskGroup, PositionApplication, Notification, Ranking, Avatar, BountyAlgorithm, AdminBudget, and TaskReview tables
-- Date: 2024-12-10

BEGIN;

-- ============================================================================
-- Task Group Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS task_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index for task_groups table
CREATE INDEX idx_task_groups_creator_id ON task_groups(creator_id);

-- ============================================================================
-- Group Members Table (Many-to-Many)
-- ============================================================================
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES task_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Create indexes for group_members table
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);

-- Add foreign key constraint to tasks table for group_id
ALTER TABLE tasks 
  ADD CONSTRAINT fk_tasks_group_id 
  FOREIGN KEY (group_id) REFERENCES task_groups(id) ON DELETE SET NULL;

-- ============================================================================
-- Task Assistant Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS task_assistants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  allocation_type allocation_type NOT NULL,
  allocation_value DECIMAL(10, 2) NOT NULL CHECK (allocation_value > 0),
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(task_id, user_id)
);

-- Create indexes for task_assistants table
CREATE INDEX idx_task_assistants_task_id ON task_assistants(task_id);
CREATE INDEX idx_task_assistants_user_id ON task_assistants(user_id);

-- Validate allocation value doesn't exceed task bounty for fixed type
CREATE OR REPLACE FUNCTION validate_assistant_allocation()
RETURNS TRIGGER AS $$
DECLARE
  task_bounty DECIMAL(10, 2);
  total_fixed_allocation DECIMAL(10, 2);
BEGIN
  SELECT bounty_amount INTO task_bounty FROM tasks WHERE id = NEW.task_id;
  
  IF NEW.allocation_type = 'fixed' THEN
    -- Calculate total fixed allocations including this new one
    SELECT COALESCE(SUM(allocation_value), 0) INTO total_fixed_allocation
    FROM task_assistants 
    WHERE task_id = NEW.task_id 
      AND allocation_type = 'fixed'
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID);
    
    IF (total_fixed_allocation + NEW.allocation_value) > task_bounty THEN
      RAISE EXCEPTION 'Total fixed allocation cannot exceed task bounty';
    END IF;
  ELSIF NEW.allocation_type = 'percentage' THEN
    IF NEW.allocation_value > 100 THEN
      RAISE EXCEPTION 'Percentage allocation cannot exceed 100';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_task_assistant_allocation
  BEFORE INSERT OR UPDATE ON task_assistants
  FOR EACH ROW
  EXECUTE FUNCTION validate_assistant_allocation();

-- ============================================================================
-- Position Application Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS position_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  position_id UUID NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
  reason TEXT,
  status application_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  review_comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for position_applications table
CREATE INDEX idx_position_applications_user_id ON position_applications(user_id);
CREATE INDEX idx_position_applications_position_id ON position_applications(position_id);
CREATE INDEX idx_position_applications_status ON position_applications(status);
CREATE INDEX idx_position_applications_reviewed_by ON position_applications(reviewed_by);

-- ============================================================================
-- Notification Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title VARCHAR(500) NOT NULL,
  message TEXT NOT NULL,
  related_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for notifications table (as specified in design document)
CREATE INDEX idx_notifications_user_id_read_created ON notifications(user_id, is_read, created_at);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_type ON notifications(type);

-- ============================================================================
-- Avatar Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS avatars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  required_rank INTEGER NOT NULL CHECK (required_rank > 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index for avatars table
CREATE INDEX idx_avatars_required_rank ON avatars(required_rank);

-- Add foreign key constraint to users table for avatar_id
ALTER TABLE users 
  ADD CONSTRAINT fk_users_avatar_id 
  FOREIGN KEY (avatar_id) REFERENCES avatars(id) ON DELETE SET NULL;

-- ============================================================================
-- Ranking Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS rankings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period ranking_period NOT NULL,
  year INTEGER NOT NULL CHECK (year > 2000),
  month INTEGER CHECK (month >= 1 AND month <= 12),
  quarter INTEGER CHECK (quarter >= 1 AND quarter <= 4),
  total_bounty DECIMAL(10, 2) NOT NULL DEFAULT 0,
  rank INTEGER NOT NULL CHECK (rank > 0),
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, period, year, month, quarter)
);

-- Create indexes for rankings table (as specified in design document)
CREATE INDEX idx_rankings_user_period_year_month ON rankings(user_id, period, year, month);
CREATE INDEX idx_rankings_period_year_month_rank ON rankings(period, year, month, rank);
CREATE INDEX idx_rankings_user_id ON rankings(user_id);

-- ============================================================================
-- Bounty Algorithm Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS bounty_algorithms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version VARCHAR(50) NOT NULL UNIQUE,
  base_amount DECIMAL(10, 2) NOT NULL CHECK (base_amount >= 0),
  urgency_weight DECIMAL(10, 2) NOT NULL CHECK (urgency_weight >= 0),
  importance_weight DECIMAL(10, 2) NOT NULL CHECK (importance_weight >= 0),
  duration_weight DECIMAL(10, 2) NOT NULL CHECK (duration_weight >= 0),
  formula TEXT NOT NULL,
  effective_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for bounty_algorithms table
CREATE INDEX idx_bounty_algorithms_version ON bounty_algorithms(version);
CREATE INDEX idx_bounty_algorithms_effective_from ON bounty_algorithms(effective_from);

-- ============================================================================
-- Admin Budget Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS admin_budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL CHECK (year > 2000),
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  total_budget DECIMAL(10, 2) NOT NULL CHECK (total_budget >= 0),
  used_budget DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (used_budget >= 0),
  remaining_budget DECIMAL(10, 2) GENERATED ALWAYS AS (total_budget - used_budget) STORED,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(admin_id, year, month)
);

-- Create indexes for admin_budgets table
CREATE INDEX idx_admin_budgets_admin_id ON admin_budgets(admin_id);
CREATE INDEX idx_admin_budgets_year_month ON admin_budgets(year, month);

-- Validate budget usage doesn't exceed total
CREATE OR REPLACE FUNCTION validate_admin_budget()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.used_budget > NEW.total_budget THEN
    RAISE EXCEPTION 'Used budget cannot exceed total budget';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_budget_usage
  BEFORE INSERT OR UPDATE ON admin_budgets
  FOR EACH ROW
  EXECUTE FUNCTION validate_admin_budget();

-- ============================================================================
-- Task Review Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS task_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  extra_bounty DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (extra_bounty >= 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(task_id, reviewer_id)
);

-- Create indexes for task_reviews table
CREATE INDEX idx_task_reviews_task_id ON task_reviews(task_id);
CREATE INDEX idx_task_reviews_reviewer_id ON task_reviews(reviewer_id);

-- Deduct extra bounty from admin budget when review is created
CREATE OR REPLACE FUNCTION deduct_extra_bounty_from_budget()
RETURNS TRIGGER AS $$
DECLARE
  current_year INTEGER;
  current_month INTEGER;
  available_budget DECIMAL(10, 2);
BEGIN
  IF NEW.extra_bounty > 0 THEN
    current_year := EXTRACT(YEAR FROM NOW());
    current_month := EXTRACT(MONTH FROM NOW());
    
    -- Check if admin has sufficient budget
    SELECT remaining_budget INTO available_budget
    FROM admin_budgets
    WHERE admin_id = NEW.reviewer_id 
      AND year = current_year 
      AND month = current_month;
    
    IF available_budget IS NULL THEN
      RAISE EXCEPTION 'Admin budget not found for current month';
    END IF;
    
    IF available_budget < NEW.extra_bounty THEN
      RAISE EXCEPTION 'Insufficient admin budget';
    END IF;
    
    -- Deduct from budget
    UPDATE admin_budgets
    SET used_budget = used_budget + NEW.extra_bounty,
        updated_at = NOW()
    WHERE admin_id = NEW.reviewer_id 
      AND year = current_year 
      AND month = current_month;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER deduct_budget_on_review
  BEFORE INSERT ON task_reviews
  FOR EACH ROW
  EXECUTE FUNCTION deduct_extra_bounty_from_budget();

COMMIT;
