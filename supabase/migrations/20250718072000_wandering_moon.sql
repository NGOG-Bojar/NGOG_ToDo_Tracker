/*
  # Performance Indexes and Additional Constraints

  1. Performance Indexes
    - Optimize common query patterns
    - Speed up filtering and sorting operations
    - Improve real-time subscription performance

  2. Additional Constraints
    - Data validation rules
    - Referential integrity
    - Business logic enforcement

  3. Full-Text Search
    - Enable search across task titles and descriptions
    - Project title and description search
    - Event title and location search
*/

-- Performance Indexes for Tasks
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_updated_at ON tasks(updated_at);
CREATE INDEX IF NOT EXISTS idx_tasks_linked_project ON tasks(linked_project);
CREATE INDEX IF NOT EXISTS idx_tasks_categories ON tasks USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_tasks_deleted_at ON tasks(deleted_at) WHERE deleted_at IS NOT NULL;

-- Full-text search index for tasks
CREATE INDEX IF NOT EXISTS idx_tasks_search ON tasks USING GIN(
  to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || COALESCE(notes, ''))
);

-- Performance Indexes for Projects
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_archived ON projects(archived);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at);
CREATE INDEX IF NOT EXISTS idx_projects_linked_tasks ON projects USING GIN(linked_tasks);

-- Full-text search index for projects
CREATE INDEX IF NOT EXISTS idx_projects_search ON projects USING GIN(
  to_tsvector('english', title || ' ' || COALESCE(description, ''))
);

-- Performance Indexes for Categories
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_deleted ON categories(deleted);
CREATE INDEX IF NOT EXISTS idx_categories_predefined ON categories(predefined);

-- Performance Indexes for Activity Log Categories
CREATE INDEX IF NOT EXISTS idx_activity_log_categories_user_id ON activity_log_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_categories_deleted ON activity_log_categories(deleted);
CREATE INDEX IF NOT EXISTS idx_activity_log_categories_predefined ON activity_log_categories(predefined);

-- Performance Indexes for Project Activity Logs
CREATE INDEX IF NOT EXISTS idx_project_activity_logs_project_id ON project_activity_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_project_activity_logs_timestamp ON project_activity_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_project_activity_logs_type ON project_activity_logs(type);
CREATE INDEX IF NOT EXISTS idx_project_activity_logs_category ON project_activity_logs(category);

-- Performance Indexes for Events
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_end_date ON events(end_date);
CREATE INDEX IF NOT EXISTS idx_events_participation_type ON events(participation_type);
CREATE INDEX IF NOT EXISTS idx_events_talk_date ON events(talk_date);

-- Full-text search index for events
CREATE INDEX IF NOT EXISTS idx_events_search ON events USING GIN(
  to_tsvector('english', title || ' ' || COALESCE(location, '') || ' ' || COALESCE(talk_title, ''))
);

-- Performance Indexes for User Settings
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Additional Constraints

-- Ensure task priorities are valid
ALTER TABLE tasks ADD CONSTRAINT check_task_priority 
  CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- Ensure task status is valid
ALTER TABLE tasks ADD CONSTRAINT check_task_status 
  CHECK (status IN ('open', 'completed'));

-- Ensure project status is valid
ALTER TABLE projects ADD CONSTRAINT check_project_status 
  CHECK (status IN ('idea', 'preparation', 'active', 'waiting', 'completed', 'on_hold'));

-- Ensure event participation type is valid
ALTER TABLE events ADD CONSTRAINT check_event_participation_type 
  CHECK (participation_type IN ('exhibitor', 'speaker', 'exhibitor_speaker'));

-- Ensure event dates are logical
ALTER TABLE events ADD CONSTRAINT check_event_dates 
  CHECK (end_date >= start_date);

-- Ensure talk date is within event dates (if specified)
ALTER TABLE events ADD CONSTRAINT check_talk_date_within_event 
  CHECK (
    talk_date IS NULL OR 
    (talk_date >= start_date AND talk_date <= end_date)
  );

-- Ensure category names are not empty
ALTER TABLE categories ADD CONSTRAINT check_category_name_not_empty 
  CHECK (trim(name) != '');

-- Ensure activity log category names are not empty
ALTER TABLE activity_log_categories ADD CONSTRAINT check_activity_category_name_not_empty 
  CHECK (trim(name) != '');

-- Ensure task titles are not empty
ALTER TABLE tasks ADD CONSTRAINT check_task_title_not_empty 
  CHECK (trim(title) != '');

-- Ensure project titles are not empty
ALTER TABLE projects ADD CONSTRAINT check_project_title_not_empty 
  CHECK (trim(title) != '');

-- Ensure event titles are not empty
ALTER TABLE events ADD CONSTRAINT check_event_title_not_empty 
  CHECK (trim(title) != '');

-- Ensure color values are valid hex colors
ALTER TABLE categories ADD CONSTRAINT check_category_color_format 
  CHECK (color ~ '^#[0-9A-Fa-f]{6}$');

ALTER TABLE activity_log_categories ADD CONSTRAINT check_activity_category_color_format 
  CHECK (color ~ '^#[0-9A-Fa-f]{6}$');

ALTER TABLE projects ADD CONSTRAINT check_project_color_format 
  CHECK (color ~ '^#[0-9A-Fa-f]{6}$');

-- Ensure user settings theme is valid
ALTER TABLE user_settings ADD CONSTRAINT check_theme_valid 
  CHECK (theme IN ('default', 'dark', 'light'));

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_tasks_user_status_priority ON tasks(user_id, status, priority);
CREATE INDEX IF NOT EXISTS idx_tasks_user_due_date ON tasks(user_id, due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_projects_user_status_archived ON projects(user_id, status, archived);
CREATE INDEX IF NOT EXISTS idx_events_user_date_range ON events(user_id, start_date, end_date);

-- Partial indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_open_with_due_date ON tasks(user_id, due_date) 
  WHERE status = 'open' AND due_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_urgent_open ON tasks(user_id, created_at) 
  WHERE status = 'open' AND priority = 'urgent';

CREATE INDEX IF NOT EXISTS idx_projects_active ON projects(user_id, updated_at) 
  WHERE archived = false;

CREATE INDEX IF NOT EXISTS idx_events_upcoming ON events(user_id, start_date) 
  WHERE start_date > CURRENT_DATE;