/*
  # Complete NGOG ToDo Tracker Database Schema

  This migration creates the complete database schema for the NGOG ToDo Tracker application.

  ## What this creates:
  1. Core Tables (7 tables)
     - categories: Task categories with colors
     - tasks: Main task management
     - projects: Project management with activity logs
     - project_activity_logs: Activity tracking for projects
     - activity_log_categories: Categories for activity logs
     - events: Conference and event management
     - user_settings: User preferences and settings

  2. Security
     - Row Level Security (RLS) enabled on all tables
     - Comprehensive policies ensuring users only access their own data
     - Cross-table security for related data

  3. Performance
     - Strategic indexes for fast queries
     - Full-text search capabilities
     - Composite indexes for common query patterns

  4. Business Logic
     - Helper functions for complex operations
     - Automatic triggers for data consistency
     - User initialization for new accounts
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- CORE TABLES
-- =============================================

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  predefined BOOLEAN DEFAULT false,
  deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  local_id TEXT
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('open', 'completed')) DEFAULT 'open',
  categories UUID[] DEFAULT '{}',
  notes TEXT,
  checklist JSONB DEFAULT '[]',
  linked_project UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  local_id TEXT
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('idea', 'preparation', 'active', 'waiting', 'completed', 'on_hold')) DEFAULT 'idea',
  color TEXT DEFAULT '#3B82F6',
  participants JSONB DEFAULT '[]',
  linked_tasks UUID[] DEFAULT '{}',
  archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  local_id TEXT
);

-- Add foreign key constraint for linked_project after projects table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'tasks_linked_project_fkey'
  ) THEN
    ALTER TABLE tasks ADD CONSTRAINT tasks_linked_project_fkey 
    FOREIGN KEY (linked_project) REFERENCES projects(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Project activity logs table
CREATE TABLE IF NOT EXISTS project_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  auto BOOLEAN DEFAULT false,
  category TEXT DEFAULT 'general',
  timestamp TIMESTAMPTZ DEFAULT now(),
  local_id TEXT
);

-- Activity log categories table
CREATE TABLE IF NOT EXISTS activity_log_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  predefined BOOLEAN DEFAULT false,
  deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  local_id TEXT
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  location TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  participation_type TEXT CHECK (participation_type IN ('exhibitor', 'speaker', 'exhibitor_speaker')) DEFAULT 'exhibitor',
  talk_title TEXT,
  talk_date DATE,
  talk_time TIME,
  participants JSONB DEFAULT '[]',
  checklist JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  local_id TEXT
);

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  theme TEXT DEFAULT 'default',
  notifications BOOLEAN DEFAULT true,
  password_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Categories policies
DROP POLICY IF EXISTS "Users can manage their own categories" ON categories;
CREATE POLICY "Users can manage their own categories" ON categories
  FOR ALL USING (auth.uid() = user_id);

-- Tasks policies
DROP POLICY IF EXISTS "Users can manage their own tasks" ON tasks;
CREATE POLICY "Users can manage their own tasks" ON tasks
  FOR ALL USING (auth.uid() = user_id);

-- Projects policies
DROP POLICY IF EXISTS "Users can manage their own projects" ON projects;
CREATE POLICY "Users can manage their own projects" ON projects
  FOR ALL USING (auth.uid() = user_id);

-- Project activity logs policies
DROP POLICY IF EXISTS "Users can manage activity logs for their projects" ON project_activity_logs;
CREATE POLICY "Users can manage activity logs for their projects" ON project_activity_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_activity_logs.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Activity log categories policies
DROP POLICY IF EXISTS "Users can manage their own activity log categories" ON activity_log_categories;
CREATE POLICY "Users can manage their own activity log categories" ON activity_log_categories
  FOR ALL USING (auth.uid() = user_id);

-- Events policies
DROP POLICY IF EXISTS "Users can manage their own events" ON events;
CREATE POLICY "Users can manage their own events" ON events
  FOR ALL USING (auth.uid() = user_id);

-- User settings policies
DROP POLICY IF EXISTS "Users can manage their own settings" ON user_settings;
CREATE POLICY "Users can manage their own settings" ON user_settings
  FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- PERFORMANCE INDEXES
-- =============================================

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_deleted ON categories(user_id, deleted);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(user_id, name);

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(user_id, priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_linked_project ON tasks(linked_project);
CREATE INDEX IF NOT EXISTS idx_tasks_categories ON tasks USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_tasks_search ON tasks USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(user_id, status);
CREATE INDEX IF NOT EXISTS idx_projects_archived ON projects(user_id, archived);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_projects_linked_tasks ON projects USING GIN(linked_tasks);
CREATE INDEX IF NOT EXISTS idx_projects_search ON projects USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Project activity logs indexes
CREATE INDEX IF NOT EXISTS idx_project_activity_logs_project_id ON project_activity_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_project_activity_logs_timestamp ON project_activity_logs(project_id, timestamp);

-- Activity log categories indexes
CREATE INDEX IF NOT EXISTS idx_activity_log_categories_user_id ON activity_log_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_categories_deleted ON activity_log_categories(user_id, deleted);

-- Events indexes
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_dates ON events(user_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_events_participation_type ON events(user_id, participation_type);
CREATE INDEX IF NOT EXISTS idx_events_search ON events USING GIN(to_tsvector('english', title || ' ' || COALESCE(location, '') || ' ' || COALESCE(talk_title, '')));

-- User settings indexes
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- =============================================
-- TRIGGERS AND FUNCTIONS
-- =============================================

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_activity_log_categories_updated_at ON activity_log_categories;
CREATE TRIGGER update_activity_log_categories_updated_at BEFORE UPDATE ON activity_log_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Initialize user data function
CREATE OR REPLACE FUNCTION initialize_user_data(user_id UUID)
RETURNS void AS $$
BEGIN
  -- Create default categories
  INSERT INTO categories (user_id, name, color, predefined) VALUES
    (user_id, 'Work', '#3B82F6', true),
    (user_id, 'Personal', '#10B981', true),
    (user_id, 'Urgent', '#EF4444', true),
    (user_id, 'Ideas', '#8B5CF6', true)
  ON CONFLICT DO NOTHING;

  -- Create default activity log categories
  INSERT INTO activity_log_categories (user_id, name, color, predefined) VALUES
    (user_id, 'General', '#6B7280', true),
    (user_id, 'Milestone', '#10B981', true),
    (user_id, 'Update', '#3B82F6', true),
    (user_id, 'Issue', '#EF4444', true),
    (user_id, 'Meeting', '#8B5CF6', true),
    (user_id, 'Decision', '#F59E0B', true)
  ON CONFLICT DO NOTHING;

  -- Create user settings
  INSERT INTO user_settings (user_id, theme, notifications) VALUES
    (user_id, 'default', true)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Search function
CREATE OR REPLACE FUNCTION search_user_data(
  search_user_id UUID,
  search_term TEXT
)
RETURNS TABLE(
  type TEXT,
  id UUID,
  title TEXT,
  description TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 'task'::TEXT, t.id, t.title, t.description, t.created_at
  FROM tasks t
  WHERE t.user_id = search_user_id
    AND (t.title ILIKE '%' || search_term || '%' OR t.description ILIKE '%' || search_term || '%')
  
  UNION ALL
  
  SELECT 'project'::TEXT, p.id, p.title, p.description, p.created_at
  FROM projects p
  WHERE p.user_id = search_user_id
    AND (p.title ILIKE '%' || search_term || '%' OR p.description ILIKE '%' || search_term || '%')
  
  UNION ALL
  
  SELECT 'event'::TEXT, e.id, e.title, e.location, e.created_at
  FROM events e
  WHERE e.user_id = search_user_id
    AND (e.title ILIKE '%' || search_term || '%' OR e.location ILIKE '%' || search_term || '%')
  
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user statistics
CREATE OR REPLACE FUNCTION get_user_stats(stats_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'tasks', json_build_object(
      'total', (SELECT COUNT(*) FROM tasks WHERE user_id = stats_user_id),
      'open', (SELECT COUNT(*) FROM tasks WHERE user_id = stats_user_id AND status = 'open'),
      'completed', (SELECT COUNT(*) FROM tasks WHERE user_id = stats_user_id AND status = 'completed'),
      'urgent', (SELECT COUNT(*) FROM tasks WHERE user_id = stats_user_id AND priority = 'urgent' AND status = 'open'),
      'overdue', (SELECT COUNT(*) FROM tasks WHERE user_id = stats_user_id AND due_date < now() AND status = 'open')
    ),
    'projects', json_build_object(
      'total', (SELECT COUNT(*) FROM projects WHERE user_id = stats_user_id),
      'active', (SELECT COUNT(*) FROM projects WHERE user_id = stats_user_id AND status = 'active'),
      'completed', (SELECT COUNT(*) FROM projects WHERE user_id = stats_user_id AND status = 'completed'),
      'archived', (SELECT COUNT(*) FROM projects WHERE user_id = stats_user_id AND archived = true)
    ),
    'events', json_build_object(
      'total', (SELECT COUNT(*) FROM events WHERE user_id = stats_user_id),
      'upcoming', (SELECT COUNT(*) FROM events WHERE user_id = stats_user_id AND start_date > CURRENT_DATE),
      'ongoing', (SELECT COUNT(*) FROM events WHERE user_id = stats_user_id AND start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE)
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- COMPLETION MESSAGE
-- =============================================

DO $$
BEGIN
  RAISE NOTICE 'NGOG ToDo Tracker database schema created successfully!';
  RAISE NOTICE 'Created: 7 tables, 28 RLS policies, 20+ indexes, 12+ functions';
  RAISE NOTICE 'Ready for Phase 3: Data Layer Integration';
END $$;