/*
  # Complete NGOG ToDo Tracker Database Schema
  
  This migration creates the complete database schema for the NGOG ToDo Tracker application.
  
  ## What this migration creates:
  
  1. **Core Tables**
     - categories: Task categories with soft delete
     - tasks: Main tasks with rich content and project linking
     - projects: Projects with participants and activity tracking
     - project_activity_logs: Activity logs for projects
     - activity_log_categories: Categories for activity logs
     - events: Conference/event management
     - user_settings: User preferences
  
  2. **Security**
     - Row Level Security (RLS) policies for all tables
     - User data isolation
     - Secure helper functions
  
  3. **Performance**
     - Strategic indexes for fast queries
     - Full-text search capabilities
     - Composite indexes for common patterns
  
  4. **Business Logic**
     - Helper functions for common operations
     - Automatic user data initialization
     - Data validation and constraints
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

-- Tasks table - main task management
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
  local_id TEXT,
  
  CONSTRAINT tasks_title_check CHECK (length(trim(title)) > 0)
);

-- Projects table for project management
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

-- Add foreign key constraint for linked_project after projects table is created
ALTER TABLE tasks ADD CONSTRAINT tasks_linked_project_fkey 
  FOREIGN KEY (linked_project) REFERENCES projects(id) ON DELETE SET NULL;

-- Project activity logs
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

-- Activity log categories
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

-- Events table for conference/event management
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

-- User settings table
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

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables
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

-- Project activity logs policies (inherit from project)
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
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(user_id, name) WHERE NOT deleted;

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(user_id, priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(user_id, due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_linked_project ON tasks(linked_project) WHERE linked_project IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_categories ON tasks USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_tasks_urgent_open ON tasks(user_id, created_at) WHERE priority = 'urgent' AND status = 'open';
CREATE INDEX IF NOT EXISTS idx_tasks_overdue ON tasks(user_id, due_date) WHERE status = 'open' AND due_date < CURRENT_DATE;
CREATE INDEX IF NOT EXISTS idx_tasks_search ON tasks USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(user_id, status);
CREATE INDEX IF NOT EXISTS idx_projects_archived ON projects(user_id, archived);
CREATE INDEX IF NOT EXISTS idx_projects_active ON projects(user_id, created_at) WHERE NOT archived;
CREATE INDEX IF NOT EXISTS idx_projects_linked_tasks ON projects USING GIN(linked_tasks);
CREATE INDEX IF NOT EXISTS idx_projects_search ON projects USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Project activity logs indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_project_id ON project_activity_logs(project_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON project_activity_logs(project_id, type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_category ON project_activity_logs(project_id, category);

-- Activity log categories indexes
CREATE INDEX IF NOT EXISTS idx_activity_categories_user_id ON activity_log_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_categories_deleted ON activity_log_categories(user_id, deleted) WHERE NOT deleted;

-- Events indexes
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_dates ON events(user_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_events_participation_type ON events(user_id, participation_type);
CREATE INDEX IF NOT EXISTS idx_events_upcoming ON events(user_id, start_date) WHERE start_date >= CURRENT_DATE;
CREATE INDEX IF NOT EXISTS idx_events_search ON events USING GIN(to_tsvector('english', title || ' ' || COALESCE(location, '') || ' ' || COALESCE(talk_title, '')));

-- User settings indexes
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- =============================================
-- DEFAULT EVENT CHECKLIST FUNCTION
-- =============================================

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

-- Trigger to set default checklist for new events
CREATE OR REPLACE FUNCTION set_default_event_checklist()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.checklist = '[]'::JSONB OR NEW.checklist IS NULL THEN
    NEW.checklist = create_default_event_checklist();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_default_event_checklist
  BEFORE INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION set_default_event_checklist();

-- =============================================
-- USER INITIALIZATION FUNCTION
-- =============================================

-- Function to initialize default data for new users
CREATE OR REPLACE FUNCTION initialize_user_data(user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Create default activity log categories
  INSERT INTO activity_log_categories (user_id, id, name, color, predefined) VALUES
    (user_id, 'general', 'General', '#6B7280', true),
    (user_id, 'milestone', 'Milestone', '#10B981', true),
    (user_id, 'update', 'Update', '#3B82F6', true),
    (user_id, 'issue', 'Issue', '#EF4444', true),
    (user_id, 'meeting', 'Meeting', '#8B5CF6', true),
    (user_id, 'decision', 'Decision', '#F59E0B', true)
  ON CONFLICT (id) DO NOTHING;

  -- Create default user settings
  INSERT INTO user_settings (user_id, theme, notifications)
  VALUES (user_id, 'default', true)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Get user's active categories
CREATE OR REPLACE FUNCTION get_user_categories(user_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  color TEXT,
  predefined BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.name, c.color, c.predefined, c.created_at
  FROM categories c
  WHERE c.user_id = get_user_categories.user_id 
    AND NOT c.deleted
  ORDER BY c.predefined DESC, c.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's tasks with filters
CREATE OR REPLACE FUNCTION get_user_tasks(
  user_id UUID,
  status_filter TEXT DEFAULT NULL,
  priority_filter TEXT DEFAULT NULL,
  search_term TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  due_date TIMESTAMPTZ,
  priority TEXT,
  status TEXT,
  categories UUID[],
  notes TEXT,
  checklist JSONB,
  linked_project UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.title, t.description, t.due_date, t.priority, t.status,
         t.categories, t.notes, t.checklist, t.linked_project,
         t.created_at, t.updated_at
  FROM tasks t
  WHERE t.user_id = get_user_tasks.user_id
    AND (status_filter IS NULL OR t.status = status_filter)
    AND (priority_filter IS NULL OR t.priority = priority_filter)
    AND (search_term IS NULL OR 
         t.title ILIKE '%' || search_term || '%' OR 
         t.description ILIKE '%' || search_term || '%')
  ORDER BY 
    CASE t.priority 
      WHEN 'urgent' THEN 4
      WHEN 'high' THEN 3
      WHEN 'medium' THEN 2
      WHEN 'low' THEN 1
    END DESC,
    t.due_date ASC NULLS LAST,
    t.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's projects
CREATE OR REPLACE FUNCTION get_user_projects(
  user_id UUID,
  include_archived BOOLEAN DEFAULT false
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  status TEXT,
  color TEXT,
  participants JSONB,
  linked_tasks UUID[],
  archived BOOLEAN,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.title, p.description, p.status, p.color,
         p.participants, p.linked_tasks, p.archived, p.archived_at,
         p.created_at, p.updated_at
  FROM projects p
  WHERE p.user_id = get_user_projects.user_id
    AND (include_archived OR NOT p.archived)
  ORDER BY p.archived ASC, p.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Link task to project
CREATE OR REPLACE FUNCTION link_task_to_project(
  task_id UUID,
  project_id UUID,
  task_title TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_id UUID;
  project_user_id UUID;
  task_user_id UUID;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  
  -- Verify ownership
  SELECT user_id INTO project_user_id FROM projects WHERE id = project_id;
  SELECT user_id INTO task_user_id FROM tasks WHERE id = task_id;
  
  IF project_user_id != current_user_id OR task_user_id != current_user_id THEN
    RETURN false;
  END IF;
  
  -- Update task
  UPDATE tasks SET linked_project = project_id WHERE id = task_id;
  
  -- Update project's linked_tasks array
  UPDATE projects 
  SET linked_tasks = array_append(linked_tasks, task_id)
  WHERE id = project_id AND NOT (task_id = ANY(linked_tasks));
  
  -- Add activity log
  INSERT INTO project_activity_logs (project_id, type, message, auto, category)
  VALUES (project_id, 'task_linked', 'Task "' || task_title || '" linked to project', true, 'update');
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user statistics
CREATE OR REPLACE FUNCTION get_user_stats(user_id UUID)
RETURNS TABLE (
  total_tasks BIGINT,
  open_tasks BIGINT,
  completed_tasks BIGINT,
  overdue_tasks BIGINT,
  urgent_tasks BIGINT,
  total_projects BIGINT,
  active_projects BIGINT,
  completed_projects BIGINT,
  total_events BIGINT,
  upcoming_events BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM tasks WHERE tasks.user_id = get_user_stats.user_id),
    (SELECT COUNT(*) FROM tasks WHERE tasks.user_id = get_user_stats.user_id AND status = 'open'),
    (SELECT COUNT(*) FROM tasks WHERE tasks.user_id = get_user_stats.user_id AND status = 'completed'),
    (SELECT COUNT(*) FROM tasks WHERE tasks.user_id = get_user_stats.user_id AND status = 'open' AND due_date < CURRENT_DATE),
    (SELECT COUNT(*) FROM tasks WHERE tasks.user_id = get_user_stats.user_id AND status = 'open' AND priority = 'urgent'),
    (SELECT COUNT(*) FROM projects WHERE projects.user_id = get_user_stats.user_id AND NOT archived),
    (SELECT COUNT(*) FROM projects WHERE projects.user_id = get_user_stats.user_id AND NOT archived AND status = 'active'),
    (SELECT COUNT(*) FROM projects WHERE projects.user_id = get_user_stats.user_id AND NOT archived AND status = 'completed'),
    (SELECT COUNT(*) FROM events WHERE events.user_id = get_user_stats.user_id),
    (SELECT COUNT(*) FROM events WHERE events.user_id = get_user_stats.user_id AND start_date >= CURRENT_DATE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;