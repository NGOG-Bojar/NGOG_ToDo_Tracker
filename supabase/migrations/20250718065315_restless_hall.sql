/*
  # Helper Functions for NGOG ToDo Tracker

  1. Data Query Functions
    - Functions to get filtered and sorted data
    - Helper functions for common queries
    - Performance optimized queries

  2. Business Logic Functions
    - Task management functions
    - Project management functions
    - Event management functions

  3. Utility Functions
    - Data validation functions
    - Migration helper functions
*/

-- Function to get user's active categories (non-deleted)
CREATE OR REPLACE FUNCTION get_active_categories(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE (
  id UUID,
  name TEXT,
  color TEXT,
  predefined BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.name, c.color, c.predefined, c.created_at, c.updated_at
  FROM categories c
  WHERE c.user_id = user_uuid AND c.deleted = false
  ORDER BY c.predefined DESC, c.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's active activity log categories
CREATE OR REPLACE FUNCTION get_active_activity_log_categories(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE (
  id UUID,
  name TEXT,
  color TEXT,
  predefined BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT alc.id, alc.name, alc.color, alc.predefined, alc.created_at, alc.updated_at
  FROM activity_log_categories alc
  WHERE alc.user_id = user_uuid AND alc.deleted = false
  ORDER BY alc.predefined DESC, alc.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get tasks with filters
CREATE OR REPLACE FUNCTION get_filtered_tasks(
  user_uuid UUID DEFAULT auth.uid(),
  status_filter TEXT DEFAULT 'all',
  priority_filter TEXT DEFAULT 'all',
  category_filter UUID DEFAULT NULL,
  search_term TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT NULL,
  offset_count INTEGER DEFAULT 0
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
         t.categories, t.notes, t.checklist, t.linked_project, t.created_at, t.updated_at
  FROM tasks t
  WHERE t.user_id = user_uuid
    AND (status_filter = 'all' OR t.status = status_filter)
    AND (priority_filter = 'all' OR t.priority = priority_filter)
    AND (category_filter IS NULL OR category_filter = ANY(t.categories))
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
    t.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get overdue tasks
CREATE OR REPLACE FUNCTION get_overdue_tasks(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE (
  id UUID,
  title TEXT,
  due_date TIMESTAMPTZ,
  priority TEXT,
  linked_project UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.title, t.due_date, t.priority, t.linked_project
  FROM tasks t
  WHERE t.user_id = user_uuid 
    AND t.status = 'open'
    AND t.due_date < CURRENT_DATE
  ORDER BY t.due_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get tasks due today
CREATE OR REPLACE FUNCTION get_tasks_due_today(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE (
  id UUID,
  title TEXT,
  due_date TIMESTAMPTZ,
  priority TEXT,
  linked_project UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.title, t.due_date, t.priority, t.linked_project
  FROM tasks t
  WHERE t.user_id = user_uuid 
    AND t.status = 'open'
    AND DATE(t.due_date) = CURRENT_DATE
  ORDER BY t.due_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get urgent tasks
CREATE OR REPLACE FUNCTION get_urgent_tasks(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE (
  id UUID,
  title TEXT,
  due_date TIMESTAMPTZ,
  linked_project UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.title, t.due_date, t.linked_project
  FROM tasks t
  WHERE t.user_id = user_uuid 
    AND t.status = 'open'
    AND t.priority = 'urgent'
  ORDER BY t.due_date ASC NULLS LAST, t.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active projects (non-archived)
CREATE OR REPLACE FUNCTION get_active_projects(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  status TEXT,
  color TEXT,
  participants JSONB,
  linked_tasks UUID[],
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.title, p.description, p.status, p.color,
         p.participants, p.linked_tasks, p.created_at, p.updated_at
  FROM projects p
  WHERE p.user_id = user_uuid AND p.archived = false
  ORDER BY p.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get archived projects
CREATE OR REPLACE FUNCTION get_archived_projects(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  status TEXT,
  color TEXT,
  participants JSONB,
  linked_tasks UUID[],
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.title, p.description, p.status, p.color,
         p.participants, p.linked_tasks, p.archived_at, p.created_at, p.updated_at
  FROM projects p
  WHERE p.user_id = user_uuid AND p.archived = true
  ORDER BY p.archived_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get upcoming events
CREATE OR REPLACE FUNCTION get_upcoming_events(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE (
  id UUID,
  title TEXT,
  location TEXT,
  start_date DATE,
  end_date DATE,
  participation_type TEXT,
  checklist JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT e.id, e.title, e.location, e.start_date, e.end_date, 
         e.participation_type, e.checklist
  FROM events e
  WHERE e.user_id = user_uuid AND e.start_date > CURRENT_DATE
  ORDER BY e.start_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get ongoing events
CREATE OR REPLACE FUNCTION get_ongoing_events(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE (
  id UUID,
  title TEXT,
  location TEXT,
  start_date DATE,
  end_date DATE,
  participation_type TEXT,
  checklist JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT e.id, e.title, e.location, e.start_date, e.end_date, 
         e.participation_type, e.checklist
  FROM events e
  WHERE e.user_id = user_uuid 
    AND e.start_date <= CURRENT_DATE 
    AND e.end_date >= CURRENT_DATE
  ORDER BY e.start_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to link task to project
CREATE OR REPLACE FUNCTION link_task_to_project(
  project_uuid UUID,
  task_uuid UUID,
  task_title TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  current_linked_tasks UUID[];
  actual_task_title TEXT;
BEGIN
  -- Verify both project and task belong to the user
  IF NOT EXISTS (
    SELECT 1 FROM projects WHERE id = project_uuid AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Project not found or access denied';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM tasks WHERE id = task_uuid AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Task not found or access denied';
  END IF;
  
  -- Get task title if not provided
  IF task_title IS NULL THEN
    SELECT title INTO actual_task_title FROM tasks WHERE id = task_uuid;
  ELSE
    actual_task_title := task_title;
  END IF;
  
  -- Get current linked tasks
  SELECT linked_tasks INTO current_linked_tasks 
  FROM projects WHERE id = project_uuid;
  
  -- Add task to project's linked_tasks if not already linked
  IF NOT (task_uuid = ANY(current_linked_tasks)) THEN
    UPDATE projects 
    SET linked_tasks = array_append(linked_tasks, task_uuid)
    WHERE id = project_uuid;
    
    -- Update task's linked_project
    UPDATE tasks 
    SET linked_project = project_uuid
    WHERE id = task_uuid;
    
    -- Add activity log entry
    INSERT INTO project_activity_logs (project_id, type, message, auto, category)
    VALUES (project_uuid, 'task_linked', 'Task "' || actual_task_title || '" linked to project', true, 'update');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to unlink task from project
CREATE OR REPLACE FUNCTION unlink_task_from_project(
  project_uuid UUID,
  task_uuid UUID,
  task_title TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  actual_task_title TEXT;
BEGIN
  -- Verify project belongs to the user
  IF NOT EXISTS (
    SELECT 1 FROM projects WHERE id = project_uuid AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Project not found or access denied';
  END IF;
  
  -- Get task title if not provided
  IF task_title IS NULL THEN
    SELECT title INTO actual_task_title FROM tasks WHERE id = task_uuid;
  ELSE
    actual_task_title := task_title;
  END IF;
  
  -- Remove task from project's linked_tasks
  UPDATE projects 
  SET linked_tasks = array_remove(linked_tasks, task_uuid)
  WHERE id = project_uuid;
  
  -- Remove project link from task
  UPDATE tasks 
  SET linked_project = NULL
  WHERE id = task_uuid AND user_id = auth.uid();
  
  -- Add activity log entry
  INSERT INTO project_activity_logs (project_id, type, message, auto, category)
  VALUES (project_uuid, 'task_unlinked', 'Task "' || actual_task_title || '" unlinked from project', true, 'update');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate event progress
CREATE OR REPLACE FUNCTION calculate_event_progress(event_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  total_items INTEGER;
  completed_items INTEGER;
  progress INTEGER;
BEGIN
  -- Get checklist from event
  SELECT 
    jsonb_array_length(checklist),
    (SELECT COUNT(*) FROM jsonb_array_elements(checklist) AS item WHERE (item->>'completed')::boolean = true)
  INTO total_items, completed_items
  FROM events 
  WHERE id = event_uuid AND user_id = auth.uid();
  
  -- Calculate progress percentage
  IF total_items > 0 THEN
    progress := ROUND((completed_items::DECIMAL / total_items::DECIMAL) * 100);
  ELSE
    progress := 0;
  END IF;
  
  RETURN progress;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get task statistics
CREATE OR REPLACE FUNCTION get_task_statistics(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE (
  total_tasks BIGINT,
  open_tasks BIGINT,
  completed_tasks BIGINT,
  overdue_tasks BIGINT,
  due_today_tasks BIGINT,
  urgent_tasks BIGINT,
  high_priority_tasks BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_tasks,
    COUNT(*) FILTER (WHERE status = 'open') as open_tasks,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_tasks,
    COUNT(*) FILTER (WHERE status = 'open' AND due_date < CURRENT_DATE) as overdue_tasks,
    COUNT(*) FILTER (WHERE status = 'open' AND DATE(due_date) = CURRENT_DATE) as due_today_tasks,
    COUNT(*) FILTER (WHERE status = 'open' AND priority = 'urgent') as urgent_tasks,
    COUNT(*) FILTER (WHERE status = 'open' AND priority = 'high') as high_priority_tasks
  FROM tasks
  WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;