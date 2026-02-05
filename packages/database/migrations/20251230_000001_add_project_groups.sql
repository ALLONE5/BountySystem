-- Migration: Add Project Groups
-- Description: Creates project_groups table and adds project_group_id to tasks
-- Date: 2025-12-30

BEGIN;

-- Create project_groups table
CREATE TABLE IF NOT EXISTS project_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add project_group_id to tasks
ALTER TABLE tasks 
  ADD COLUMN IF NOT EXISTS project_group_id UUID REFERENCES project_groups(id) ON DELETE SET NULL;

-- Create index for project_group_id
CREATE INDEX IF NOT EXISTS idx_tasks_project_group_id ON tasks(project_group_id);

COMMIT;
