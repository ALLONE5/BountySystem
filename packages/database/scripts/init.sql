-- Initialize Bounty Hunter Platform Database
-- This script creates the database and basic setup

-- Create database (run this as postgres superuser)
-- CREATE DATABASE bounty_hunter;

-- Connect to the database
\c bounty_hunter;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('user', 'position_admin', 'super_admin');
CREATE TYPE task_status AS ENUM ('not_started', 'available', 'in_progress', 'completed', 'abandoned');
CREATE TYPE visibility AS ENUM ('public', 'position_only', 'private');
CREATE TYPE notification_type AS ENUM (
  'task_assigned',
  'deadline_reminder',
  'dependency_resolved',
  'status_changed',
  'position_approved',
  'position_rejected',
  'broadcast',
  'review_required'
);
CREATE TYPE application_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE allocation_type AS ENUM ('percentage', 'fixed');
CREATE TYPE ranking_period AS ENUM ('monthly', 'quarterly', 'all_time');

-- Grant permissions (adjust as needed)
-- GRANT ALL PRIVILEGES ON DATABASE bounty_hunter TO your_app_user;
