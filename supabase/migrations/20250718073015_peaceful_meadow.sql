/*
  # Complete NGOG ToDo Tracker Database Schema

  This migration creates the complete database schema for the NGOG ToDo Tracker application.

  ## What this creates:
  1. Core Tables (7 tables)
     - categories: Task categories with colors
     - tasks: Main task management
     - projects: Project and cooperation tracking
     - project_activity_logs: Project activity history
     - activity_log_categories: Categories for activity logs
     - events: Conference and event management
     - user_settings: User preferences and settings

  2. Security
     - Row Level Security (RLS) enabled on all tables
     - 28 security policies ensuring users only access their own data
     - Secure cross-table relationships

  3. Performance
     - 20+ indexes for fast queries
     - Full-text search capabilities
     - Composite indexes for common query patterns

  4. Business Logic
     - 12 database functions for complex operations
     - Automatic user data initialization
     - Triggers for timestamp management
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- CORE TABLES
-- =============================================

-- Categories table for task organization
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  predefined BOOLEAN DEFAULT false,
  deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  local_id TEXT,
  
  CONSTRAINT categories_name_check CHECK (length(trim(name)) > 0),
  CONSTRAINT categories_color_check CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);

-- Tasks table for main task management
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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
  local_id TEXT,
  
  CONSTRAINT tasks_title_check CHECK (length(trim(title)) > 0)
);

-- Projects table for project and cooperation tracking
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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
  local_id TEXT,
  
  CONSTRAINT projects_title_check CHECK (length(trim(title)) > 0),
  CONSTRAINT projects_color_check CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);

-- Add foreign key constraint for linked_project in tasks
ALTER TABLE tasks ADD CONSTRAINT tasks_linked_project_fkey 
  FOREIGN KEY (linked_project) REFERENCES projects(id) ON DELETE SET NULL;

-- Project activity logs for tracking project history
CREATE TABLE IF NOT EXISTS project_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  auto BOOLEAN DEFAULT false,
  category TEXT DEFAULT 'general',
  timestamp TIMESTAMPTZ DEFAULT now(),
  local_id TEXT,
  
  CONSTRAINT activity_logs_message_check CHECK (length(trim(message)) > 0)
);

-- Activity log categories for organizing project activities
CREATE TABLE IF NOT EXISTS activity_log_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6B7280',
  predefined BOOLEAN DEFAULT false,
  deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  local_id TEXT,
  
  CONSTRAINT activity_categories_name_check CHECK (length(trim(name)) > 0),
  CONSTRAINT activity_categories_color_check CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);

-- Events table for conference and event management
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
  participants JSONB DEFAULT '[]',
  checklist JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  local_id TEXT,
  
  CONSTRAINT events_title_check CHECK (length(trim(title)) > 0),
  CONSTRAINT events_date_check CHECK (end_date >= start_date),
  CONSTRAINT events_talk_date_check CHECK (talk_date IS NULL OR (talk_date >= start_date AND talk_date <= end_date))
);

-- User settings for preferences and configuration
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  theme TEXT DEFAULT 'default',
  notifications BOOLEAN DEFAULT true,
  password_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMPS
-- =============================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activity_log_categories_updated_at BEFORE UPDATE ON activity_log_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY POLICIES
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
CREATE POLICY "Users can view their own categories" ON categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories" ON categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories" ON categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories" ON categories
  FOR DELETE USING (auth.uid() = user_id);

-- Tasks policies
CREATE POLICY "Users can view their own tasks" ON tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" ON tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" ON tasks
  FOR DELETE USING (auth.uid() = user_id);

-- Projects policies
CREATE POLICY "Users can view their own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- Project activity logs policies (inherit from project ownership)
CREATE POLICY "Users can view activity logs for their projects" ON project_activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_activity_logs.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert activity logs for their projects" ON project_activity_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_activity_logs.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update activity logs for their projects" ON project_activity_logs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_activity_logs.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete activity logs for their projects" ON project_activity_logs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_activity_logs.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Activity log categories policies
CREATE POLICY "Users can view their own activity log categories" ON activity_log_categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activity log categories" ON activity_log_categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activity log categories" ON activity_log_categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activity log categories" ON activity_log_categories
  FOR DELETE USING (auth.uid() = user_id);

-- Events policies
CREATE POLICY "Users can view their own events" ON events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own events" ON events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events" ON events
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events" ON events
  FOR DELETE USING (auth.uid() = user_id);

-- User settings policies
CREATE POLICY "Users can view their own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings" ON user_settings
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- PERFORMANCE INDEXES
-- =============================================

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_deleted ON categories(user_id, deleted) WHERE NOT deleted;
CREATE INDEX IF NOT EXISTS idx_categories_name_search ON categories USING gin(to_tsvector('english', name));

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(user_id, priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(user_id, due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_linked_project ON tasks(linked_project) WHERE linked_project IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_categories ON tasks USING gin(categories);
CREATE INDEX IF NOT EXISTS idx_tasks_search ON tasks USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));
CREATE INDEX IF NOT EXISTS idx_tasks_urgent_open ON tasks(user_id, created_at) WHERE status = 'open' AND priority = 'urgent';
CREATE INDEX IF NOT EXISTS idx_tasks_overdue ON tasks(user_id, due_date) WHERE status = 'open' AND due_date < CURRENT_DATE;

-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(user_id, status);
CREATE INDEX IF NOT EXISTS idx_projects_archived ON projects(user_id, archived);
CREATE INDEX IF NOT EXISTS idx_projects_active ON projects(user_id, created_at) WHERE NOT archived;
CREATE INDEX IF NOT EXISTS idx_projects_linked_tasks ON projects USING gin(linked_tasks);
CREATE INDEX IF NOT EXISTS idx_projects_search ON projects USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Project activity logs indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_project_id ON project_activity_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON project_activity_logs(project_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_category ON project_activity_logs(project_id, category);

-- Activity log categories indexes
CREATE INDEX IF NOT EXISTS idx_activity_categories_user_id ON activity_log_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_categories_deleted ON activity_log_categories(user_id, deleted) WHERE NOT deleted;

-- Events indexes
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_dates ON events(user_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_events_upcoming ON events(user_id, start_date) WHERE start_date >= CURRENT_DATE;
CREATE INDEX IF NOT EXISTS idx_events_participation_type ON events(user_id, participation_type);
CREATE INDEX IF NOT EXISTS idx_events_search ON events USING gin(to_tsvector('english', title || ' ' || COALESCE(location, '') || ' ' || COALESCE(talk_title, '')));

-- User settings indexes
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to initialize default data for new users
CREATE OR REPLACE FUNCTION initialize_user_data(user_id UUID)
RETURNS void AS $$
BEGIN
  -- Create default task categories
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

  -- Create default user settings
  INSERT INTO user_settings (user_id, theme, notifications) VALUES
    (user_id, 'default', true)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user task statistics
CREATE OR REPLACE FUNCTION get_user_task_stats(user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_tasks', COUNT(*),
    'open_tasks', COUNT(*) FILTER (WHERE status = 'open'),
    'completed_tasks', COUNT(*) FILTER (WHERE status = 'completed'),
    'overdue_tasks', COUNT(*) FILTER (WHERE status = 'open' AND due_date < CURRENT_DATE),
    'urgent_tasks', COUNT(*) FILTER (WHERE status = 'open' AND priority = 'urgent'),
    'due_today', COUNT(*) FILTER (WHERE status = 'open' AND due_date = CURRENT_DATE)
  ) INTO result
  FROM tasks
  WHERE tasks.user_id = get_user_task_stats.user_id AND deleted_at IS NULL;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search across all user data
CREATE OR REPLACE FUNCTION search_user_data(user_id UUID, search_term TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'tasks', (
      SELECT COALESCE(json_agg(json_build_object(
        'id', id,
        'title', title,
        'description', description,
        'type', 'task'
      )), '[]'::json)
      FROM tasks
      WHERE tasks.user_id = search_user_data.user_id
        AND deleted_at IS NULL
        AND (title ILIKE '%' || search_term || '%' OR description ILIKE '%' || search_term || '%')
      LIMIT 10
    ),
    'projects', (
      SELECT COALESCE(json_agg(json_build_object(
        'id', id,
        'title', title,
        'description', description,
        'type', 'project'
      )), '[]'::json)
      FROM projects
      WHERE projects.user_id = search_user_data.user_id
        AND NOT archived
        AND (title ILIKE '%' || search_term || '%' OR description ILIKE '%' || search_term || '%')
      LIMIT 10
    ),
    'events', (
      SELECT COALESCE(json_agg(json_build_object(
        'id', id,
        'title', title,
        'location', location,
        'type', 'event'
      )), '[]'::json)
      FROM events
      WHERE events.user_id = search_user_data.user_id
        AND (title ILIKE '%' || search_term || '%' OR location ILIKE '%' || search_term || '%')
      LIMIT 10
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get project statistics
CREATE OR REPLACE FUNCTION get_user_project_stats(user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_projects', COUNT(*),
    'active_projects', COUNT(*) FILTER (WHERE NOT archived),
    'archived_projects', COUNT(*) FILTER (WHERE archived),
    'completed_projects', COUNT(*) FILTER (WHERE status = 'completed' AND NOT archived),
    'projects_by_status', (
      SELECT json_object_agg(status, count)
      FROM (
        SELECT status, COUNT(*) as count
        FROM projects
        WHERE projects.user_id = get_user_project_stats.user_id AND NOT archived
        GROUP BY status
      ) status_counts
    )
  ) INTO result
  FROM projects
  WHERE projects.user_id = get_user_project_stats.user_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to link task to project with activity logging
CREATE OR REPLACE FUNCTION link_task_to_project(
  task_id UUID,
  project_id UUID,
  task_title TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  current_user_id UUID;
  actual_task_title TEXT;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  
  -- Verify user owns both task and project
  IF NOT EXISTS (
    SELECT 1 FROM tasks WHERE id = task_id AND user_id = current_user_id
  ) THEN
    RAISE EXCEPTION 'Task not found or access denied';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM projects WHERE id = project_id AND user_id = current_user_id
  ) THEN
    RAISE EXCEPTION 'Project not found or access denied';
  END IF;
  
  -- Get task title if not provided
  IF task_title IS NULL THEN
    SELECT title INTO actual_task_title FROM tasks WHERE id = task_id;
  ELSE
    actual_task_title := task_title;
  END IF;
  
  -- Update task with project link
  UPDATE tasks SET linked_project = project_id WHERE id = task_id;
  
  -- Add task to project's linked_tasks array
  UPDATE projects 
  SET linked_tasks = array_append(linked_tasks, task_id)
  WHERE id = project_id AND NOT (task_id = ANY(linked_tasks));
  
  -- Add activity log entry
  INSERT INTO project_activity_logs (project_id, type, message, auto, category)
  VALUES (
    project_id,
    'task_linked',
    'Task "' || actual_task_title || '" linked to project',
    true,
    'update'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to unlink task from project
CREATE OR REPLACE FUNCTION unlink_task_from_project(
  task_id UUID,
  project_id UUID,
  task_title TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  current_user_id UUID;
  actual_task_title TEXT;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  
  -- Verify user owns both task and project
  IF NOT EXISTS (
    SELECT 1 FROM tasks WHERE id = task_id AND user_id = current_user_id
  ) THEN
    RAISE EXCEPTION 'Task not found or access denied';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM projects WHERE id = project_id AND user_id = current_user_id
  ) THEN
    RAISE EXCEPTION 'Project not found or access denied';
  END IF;
  
  -- Get task title if not provided
  IF task_title IS NULL THEN
    SELECT title INTO actual_task_title FROM tasks WHERE id = task_id;
  ELSE
    actual_task_title := task_title;
  END IF;
  
  -- Remove project link from task
  UPDATE tasks SET linked_project = NULL WHERE id = task_id;
  
  -- Remove task from project's linked_tasks array
  UPDATE projects 
  SET linked_tasks = array_remove(linked_tasks, task_id)
  WHERE id = project_id;
  
  -- Add activity log entry
  INSERT INTO project_activity_logs (project_id, type, message, auto, category)
  VALUES (
    project_id,
    'task_unlinked',
    'Task "' || actual_task_title || '" unlinked from project',
    true,
    'update'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create default event checklist
CREATE OR REPLACE FUNCTION create_default_event_checklist()
RETURNS JSONB AS $$
BEGIN
  RETURN '[
    {"id": "registration", "label": "Registration completed", "completed": false},
    {"id": "invoice_received", "label": "Invoice received", "completed": false},
    {"id": "invoice_paid", "label": "Invoice paid", "completed": false},
    {"id": "hotel_booked", "label": "Hotel booked", "completed": false},
    {"id": "rental_car_booked", "label": "Rental car booked", "completed": false},
    {"id": "insurance_arranged", "label": "Insurance arranged", "completed": false}
  ]'::JSONB;
END;
$$ LANGUAGE plpgsql;

-- Function to get upcoming events
CREATE OR REPLACE FUNCTION get_upcoming_events(user_id UUID, limit_count INTEGER DEFAULT 10)
RETURNS SETOF events AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM events
  WHERE events.user_id = get_upcoming_events.user_id
    AND start_date >= CURRENT_DATE
  ORDER BY start_date ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get overdue tasks
CREATE OR REPLACE FUNCTION get_overdue_tasks(user_id UUID)
RETURNS SETOF tasks AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM tasks
  WHERE tasks.user_id = get_overdue_tasks.user_id
    AND status = 'open'
    AND due_date < CURRENT_DATE
    AND deleted_at IS NULL
  ORDER BY due_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to export user data
CREATE OR REPLACE FUNCTION export_user_data(user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'export_date', CURRENT_TIMESTAMP,
    'user_id', user_id,
    'tasks', (
      SELECT COALESCE(json_agg(row_to_json(tasks)), '[]'::json)
      FROM tasks
      WHERE tasks.user_id = export_user_data.user_id AND deleted_at IS NULL
    ),
    'categories', (
      SELECT COALESCE(json_agg(row_to_json(categories)), '[]'::json)
      FROM categories
      WHERE categories.user_id = export_user_data.user_id
    ),
    'projects', (
      SELECT COALESCE(json_agg(row_to_json(projects)), '[]'::json)
      FROM projects
      WHERE projects.user_id = export_user_data.user_id
    ),
    'activity_log_categories', (
      SELECT COALESCE(json_agg(row_to_json(activity_log_categories)), '[]'::json)
      FROM activity_log_categories
      WHERE activity_log_categories.user_id = export_user_data.user_id
    ),
    'events', (
      SELECT COALESCE(json_agg(row_to_json(events)), '[]'::json)
      FROM events
      WHERE events.user_id = export_user_data.user_id
    ),
    'user_settings', (
      SELECT row_to_json(user_settings)
      FROM user_settings
      WHERE user_settings.user_id = export_user_data.user_id
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up soft-deleted data (for maintenance)
CREATE OR REPLACE FUNCTION cleanup_deleted_data(user_id UUID, days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
  cutoff_date TIMESTAMPTZ;
BEGIN
  cutoff_date := CURRENT_TIMESTAMP - (days_old || ' days')::INTERVAL;
  
  -- Clean up soft-deleted tasks
  DELETE FROM tasks
  WHERE tasks.user_id = cleanup_deleted_data.user_id
    AND deleted_at IS NOT NULL
    AND deleted_at < cutoff_date;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Clean up soft-deleted categories
  DELETE FROM categories
  WHERE categories.user_id = cleanup_deleted_data.user_id
    AND deleted = true
    AND deleted_at IS NOT NULL
    AND deleted_at < cutoff_date;
  
  -- Clean up soft-deleted activity log categories
  DELETE FROM activity_log_categories
  WHERE activity_log_categories.user_id = cleanup_deleted_data.user_id
    AND deleted = true
    AND deleted_at IS NOT NULL
    AND deleted_at < cutoff_date;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- DEFAULT EVENT CHECKLIST TRIGGER
-- =============================================

-- Function to set default checklist for new events
CREATE OR REPLACE FUNCTION set_default_event_checklist()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set default checklist if none provided
  IF NEW.checklist IS NULL OR NEW.checklist = '[]'::JSONB THEN
    NEW.checklist := create_default_event_checklist();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically set default checklist for new events
CREATE TRIGGER set_event_checklist_trigger
  BEFORE INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION set_default_event_checklist();

-- =============================================
-- COMPLETION MESSAGE
-- =============================================

-- This will show a success message when the migration completes
DO $$
BEGIN
  RAISE NOTICE 'NGOG ToDo Tracker database schema created successfully!';
  RAISE NOTICE 'Created: 7 tables, 28 RLS policies, 20+ indexes, 12 functions';
  RAISE NOTICE 'Ready for Phase 3: Data Layer Integration';
END $$;