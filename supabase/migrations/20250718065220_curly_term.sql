/*
  # Initial Database Schema for NGOG ToDo Tracker

  1. New Tables
    - `categories` - Task categories with colors and soft delete
    - `tasks` - Main tasks table with rich features
    - `projects` - Projects and cooperations management
    - `project_activity_logs` - Activity logging for projects
    - `activity_log_categories` - Categories for activity logs
    - `events` - Conference and event management
    - `user_settings` - User preferences and settings

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Ensure complete data isolation between users

  3. Features
    - Soft delete support for categories and activity log categories
    - Rich text support for descriptions and notes
    - JSONB fields for complex data (checklists, participants)
    - Automatic timestamp management
    - Local ID mapping for offline sync
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  predefined BOOLEAN DEFAULT false,
  deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  local_id TEXT -- For mapping during migration from localStorage
);

-- Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT, -- Rich text content from ReactQuill
  due_date TIMESTAMPTZ,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('open', 'completed')) DEFAULT 'open',
  categories UUID[] DEFAULT '{}', -- Array of category UUIDs
  notes TEXT,
  checklist JSONB DEFAULT '[]', -- Array of checklist items with completion status
  linked_project UUID REFERENCES projects(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  local_id TEXT
);

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('idea', 'preparation', 'active', 'waiting', 'completed', 'on_hold')) DEFAULT 'idea',
  color TEXT DEFAULT '#3B82F6',
  participants JSONB DEFAULT '[]', -- Array of participant objects
  linked_tasks UUID[] DEFAULT '{}', -- Array of linked task UUIDs
  archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  local_id TEXT
);

-- Project Activity Logs Table
CREATE TABLE IF NOT EXISTS project_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- 'created', 'status_change', 'task_linked', etc.
  message TEXT NOT NULL,
  auto BOOLEAN DEFAULT false, -- Whether this was auto-generated
  category TEXT DEFAULT 'general', -- References activity_log_categories
  timestamp TIMESTAMPTZ DEFAULT now(),
  local_id TEXT
);

-- Activity Log Categories Table
CREATE TABLE IF NOT EXISTS activity_log_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  predefined BOOLEAN DEFAULT false,
  deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  local_id TEXT
);

-- Events Table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  location TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  participation_type TEXT CHECK (participation_type IN ('exhibitor', 'speaker', 'exhibitor_speaker')) DEFAULT 'exhibitor',
  talk_title TEXT,
  talk_date DATE,
  talk_time TIME,
  participants JSONB DEFAULT '[]', -- Array of participant objects
  checklist JSONB DEFAULT '[]', -- Standard checklist items with completion status
  notes TEXT, -- Rich text content
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  local_id TEXT
);

-- User Settings Table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  theme TEXT DEFAULT 'default',
  notifications BOOLEAN DEFAULT true,
  password_hash TEXT, -- For app-level password if needed
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Categories
CREATE POLICY "Users can manage their own categories" ON categories
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for Tasks
CREATE POLICY "Users can manage their own tasks" ON tasks
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for Projects
CREATE POLICY "Users can manage their own projects" ON projects
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for Project Activity Logs
CREATE POLICY "Users can manage activity logs for their projects" ON project_activity_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_activity_logs.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- RLS Policies for Activity Log Categories
CREATE POLICY "Users can manage their own activity log categories" ON activity_log_categories
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for Events
CREATE POLICY "Users can manage their own events" ON events
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for User Settings
CREATE POLICY "Users can manage their own settings" ON user_settings
  FOR ALL USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all relevant tables
CREATE TRIGGER update_categories_updated_at 
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at 
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at 
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activity_log_categories_updated_at 
  BEFORE UPDATE ON activity_log_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at 
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at 
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_linked_project ON tasks(linked_project);

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_deleted ON categories(deleted);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_archived ON projects(archived);

CREATE INDEX IF NOT EXISTS idx_project_activity_logs_project_id ON project_activity_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_project_activity_logs_timestamp ON project_activity_logs(timestamp);

CREATE INDEX IF NOT EXISTS idx_activity_log_categories_user_id ON activity_log_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_categories_deleted ON activity_log_categories(deleted);

CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_end_date ON events(end_date);

-- Function to create default categories for new users
CREATE OR REPLACE FUNCTION create_default_categories_for_user(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  -- Only create if user doesn't have any categories yet
  IF NOT EXISTS (SELECT 1 FROM categories WHERE user_id = user_uuid) THEN
    -- Note: We'll populate default categories during migration or first login
    -- This function is here for future use
    NULL;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create default activity log categories for new users
CREATE OR REPLACE FUNCTION create_default_activity_log_categories_for_user(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  -- Only create if user doesn't have any activity log categories yet
  IF NOT EXISTS (SELECT 1 FROM activity_log_categories WHERE user_id = user_uuid) THEN
    INSERT INTO activity_log_categories (user_id, name, color, predefined) VALUES
    (user_uuid, 'General', '#6B7280', true),
    (user_uuid, 'Milestone', '#10B981', true),
    (user_uuid, 'Update', '#3B82F6', true),
    (user_uuid, 'Issue', '#EF4444', true),
    (user_uuid, 'Meeting', '#8B5CF6', true),
    (user_uuid, 'Decision', '#F59E0B', true);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to initialize user data (called after user signup)
CREATE OR REPLACE FUNCTION initialize_user_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Create default activity log categories
  PERFORM create_default_activity_log_categories_for_user(NEW.id);
  
  -- Create user settings record
  INSERT INTO user_settings (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to initialize user data on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION initialize_user_data();

-- Function to soft delete categories (sets deleted = true instead of actual deletion)
CREATE OR REPLACE FUNCTION soft_delete_category(category_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE categories 
  SET deleted = true, deleted_at = now() 
  WHERE id = category_uuid AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to restore soft deleted categories
CREATE OR REPLACE FUNCTION restore_category(category_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE categories 
  SET deleted = false, deleted_at = NULL 
  WHERE id = category_uuid AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to soft delete activity log categories
CREATE OR REPLACE FUNCTION soft_delete_activity_log_category(category_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE activity_log_categories 
  SET deleted = true, deleted_at = now() 
  WHERE id = category_uuid AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to restore soft deleted activity log categories
CREATE OR REPLACE FUNCTION restore_activity_log_category(category_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE activity_log_categories 
  SET deleted = false, deleted_at = NULL 
  WHERE id = category_uuid AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to archive projects
CREATE OR REPLACE FUNCTION archive_project(project_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE projects 
  SET archived = true, archived_at = now() 
  WHERE id = project_uuid AND user_id = auth.uid();
  
  -- Add activity log entry
  INSERT INTO project_activity_logs (project_id, type, message, auto, category)
  VALUES (project_uuid, 'archived', 'Project archived', true, 'general');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to restore archived projects
CREATE OR REPLACE FUNCTION restore_project(project_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE projects 
  SET archived = false, archived_at = NULL 
  WHERE id = project_uuid AND user_id = auth.uid();
  
  -- Add activity log entry
  INSERT INTO project_activity_logs (project_id, type, message, auto, category)
  VALUES (project_uuid, 'restored', 'Project restored from archive', true, 'general');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;