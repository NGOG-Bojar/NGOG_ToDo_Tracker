/*
  # Database Functions for Business Logic

  1. User Management
    - Initialize new user data
    - Clean up user data on deletion

  2. Task Management
    - Advanced task filtering
    - Task statistics
    - Due date calculations

  3. Project Management
    - Project linking/unlinking
    - Activity log management
    - Project statistics

  4. Event Management
    - Event checklist management
    - Event status calculations

  5. Search and Analytics
    - Full-text search across entities
    - Usage statistics
    - Data export helpers
*/

-- Function to initialize default data for new users
CREATE OR REPLACE FUNCTION initialize_user_data(user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create default task categories
  INSERT INTO categories (user_id, name, color, predefined) VALUES
    (user_id, 'Work', '#3B82F6', true),
    (user_id, 'Personal', '#10B981', true),
    (user_id, 'Shopping', '#F59E0B', true),
    (user_id, 'Health', '#EF4444', true),
    (user_id, 'Learning', '#8B5CF6', true)
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
$$;

-- Function to get task statistics for a user
CREATE OR REPLACE FUNCTION get_task_statistics(user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Verify user access
  IF auth.uid() != user_id THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT json_build_object(
    'total_tasks', COUNT(*),
    'open_tasks', COUNT(*) FILTER (WHERE status = 'open'),
    'completed_tasks', COUNT(*) FILTER (WHERE status = 'completed'),
    'overdue_tasks', COUNT(*) FILTER (WHERE status = 'open' AND due_date < CURRENT_DATE),
    'due_today', COUNT(*) FILTER (WHERE status = 'open' AND due_date = CURRENT_DATE),
    'urgent_tasks', COUNT(*) FILTER (WHERE status = 'open' AND priority = 'urgent'),
    'high_priority_tasks', COUNT(*) FILTER (WHERE status = 'open' AND priority = 'high'),
    'tasks_with_projects', COUNT(*) FILTER (WHERE linked_project IS NOT NULL),
    'categorized_tasks', COUNT(*) FILTER (WHERE array_length(categories, 1) > 0)
  ) INTO result
  FROM tasks
  WHERE tasks.user_id = get_task_statistics.user_id
    AND deleted_at IS NULL;

  RETURN result;
END;
$$;

-- Function to get project statistics for a user
CREATE OR REPLACE FUNCTION get_project_statistics(user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Verify user access
  IF auth.uid() != user_id THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT json_build_object(
    'total_projects', COUNT(*),
    'active_projects', COUNT(*) FILTER (WHERE archived = false),
    'archived_projects', COUNT(*) FILTER (WHERE archived = true),
    'completed_projects', COUNT(*) FILTER (WHERE status = 'completed'),
    'projects_with_tasks', COUNT(*) FILTER (WHERE array_length(linked_tasks, 1) > 0),
    'projects_with_participants', COUNT(*) FILTER (WHERE jsonb_array_length(participants) > 0),
    'projects_by_status', json_object_agg(status, status_count)
  ) INTO result
  FROM (
    SELECT 
      *,
      COUNT(*) OVER (PARTITION BY status) as status_count
    FROM projects
    WHERE projects.user_id = get_project_statistics.user_id
  ) p;

  RETURN result;
END;
$$;

-- Function to search across all user data
CREATE OR REPLACE FUNCTION search_user_data(
  user_id UUID,
  search_term TEXT,
  entity_types TEXT[] DEFAULT ARRAY['tasks', 'projects', 'events']
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  task_results JSON;
  project_results JSON;
  event_results JSON;
BEGIN
  -- Verify user access
  IF auth.uid() != user_id THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Initialize results
  task_results := '[]'::json;
  project_results := '[]'::json;
  event_results := '[]'::json;

  -- Search tasks if requested
  IF 'tasks' = ANY(entity_types) THEN
    SELECT json_agg(
      json_build_object(
        'id', id,
        'title', title,
        'description', description,
        'type', 'task',
        'priority', priority,
        'status', status,
        'due_date', due_date
      )
    ) INTO task_results
    FROM tasks
    WHERE tasks.user_id = search_user_data.user_id
      AND deleted_at IS NULL
      AND (
        title ILIKE '%' || search_term || '%' OR
        description ILIKE '%' || search_term || '%' OR
        notes ILIKE '%' || search_term || '%'
      );
  END IF;

  -- Search projects if requested
  IF 'projects' = ANY(entity_types) THEN
    SELECT json_agg(
      json_build_object(
        'id', id,
        'title', title,
        'description', description,
        'type', 'project',
        'status', status,
        'archived', archived
      )
    ) INTO project_results
    FROM projects
    WHERE projects.user_id = search_user_data.user_id
      AND (
        title ILIKE '%' || search_term || '%' OR
        description ILIKE '%' || search_term || '%'
      );
  END IF;

  -- Search events if requested
  IF 'events' = ANY(entity_types) THEN
    SELECT json_agg(
      json_build_object(
        'id', id,
        'title', title,
        'location', location,
        'type', 'event',
        'start_date', start_date,
        'end_date', end_date,
        'participation_type', participation_type
      )
    ) INTO event_results
    FROM events
    WHERE events.user_id = search_user_data.user_id
      AND (
        title ILIKE '%' || search_term || '%' OR
        location ILIKE '%' || search_term || '%' OR
        talk_title ILIKE '%' || search_term || '%'
      );
  END IF;

  -- Combine results
  SELECT json_build_object(
    'tasks', COALESCE(task_results, '[]'::json),
    'projects', COALESCE(project_results, '[]'::json),
    'events', COALESCE(event_results, '[]'::json),
    'search_term', search_term,
    'total_results', 
      COALESCE(json_array_length(task_results), 0) +
      COALESCE(json_array_length(project_results), 0) +
      COALESCE(json_array_length(event_results), 0)
  ) INTO result;

  RETURN result;
END;
$$;

-- Function to link a task to a project
CREATE OR REPLACE FUNCTION link_task_to_project(
  task_id UUID,
  project_id UUID
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  task_user_id UUID;
  project_user_id UUID;
  task_title TEXT;
BEGIN
  -- Get task details and verify ownership
  SELECT user_id, title INTO task_user_id, task_title
  FROM tasks
  WHERE id = task_id AND deleted_at IS NULL;

  -- Get project user and verify ownership
  SELECT user_id INTO project_user_id
  FROM projects
  WHERE id = project_id;

  -- Verify both exist and belong to the same user
  IF task_user_id IS NULL OR project_user_id IS NULL THEN
    RETURN false;
  END IF;

  IF task_user_id != project_user_id OR auth.uid() != task_user_id THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Update task with project link
  UPDATE tasks
  SET linked_project = project_id, updated_at = now()
  WHERE id = task_id;

  -- Add task to project's linked_tasks array if not already there
  UPDATE projects
  SET 
    linked_tasks = array_append(linked_tasks, task_id),
    updated_at = now()
  WHERE id = project_id
    AND NOT (task_id = ANY(linked_tasks));

  -- Add activity log entry
  INSERT INTO project_activity_logs (project_id, type, message, auto, category)
  VALUES (
    project_id,
    'task_linked',
    'Task "' || task_title || '" linked to project',
    true,
    'update'
  );

  RETURN true;
END;
$$;

-- Function to unlink a task from a project
CREATE OR REPLACE FUNCTION unlink_task_from_project(
  task_id UUID,
  project_id UUID
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  task_user_id UUID;
  project_user_id UUID;
  task_title TEXT;
BEGIN
  -- Get task details and verify ownership
  SELECT user_id, title INTO task_user_id, task_title
  FROM tasks
  WHERE id = task_id;

  -- Get project user and verify ownership
  SELECT user_id INTO project_user_id
  FROM projects
  WHERE id = project_id;

  -- Verify both exist and belong to the same user
  IF task_user_id IS NULL OR project_user_id IS NULL THEN
    RETURN false;
  END IF;

  IF task_user_id != project_user_id OR auth.uid() != task_user_id THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Update task to remove project link
  UPDATE tasks
  SET linked_project = NULL, updated_at = now()
  WHERE id = task_id;

  -- Remove task from project's linked_tasks array
  UPDATE projects
  SET 
    linked_tasks = array_remove(linked_tasks, task_id),
    updated_at = now()
  WHERE id = project_id;

  -- Add activity log entry
  INSERT INTO project_activity_logs (project_id, type, message, auto, category)
  VALUES (
    project_id,
    'task_unlinked',
    'Task "' || task_title || '" unlinked from project',
    true,
    'update'
  );

  RETURN true;
END;
$$;

-- Function to toggle event checklist item
CREATE OR REPLACE FUNCTION toggle_event_checklist_item(
  event_id UUID,
  item_id TEXT
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  event_user_id UUID;
  updated_checklist JSONB;
BEGIN
  -- Verify event ownership
  SELECT user_id INTO event_user_id
  FROM events
  WHERE id = event_id;

  IF event_user_id IS NULL OR auth.uid() != event_user_id THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Update the checklist item
  UPDATE events
  SET 
    checklist = (
      SELECT jsonb_agg(
        CASE 
          WHEN item->>'id' = item_id THEN
            jsonb_set(item, '{completed}', (NOT (item->>'completed')::boolean)::text::jsonb)
          ELSE item
        END
      )
      FROM jsonb_array_elements(checklist) AS item
    ),
    updated_at = now()
  WHERE id = event_id;

  RETURN true;
END;
$$;

-- Function to calculate event progress
CREATE OR REPLACE FUNCTION get_event_progress(event_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  event_user_id UUID;
  total_items INTEGER;
  completed_items INTEGER;
  progress INTEGER;
BEGIN
  -- Verify event ownership
  SELECT user_id INTO event_user_id
  FROM events
  WHERE id = event_id;

  IF event_user_id IS NULL OR auth.uid() != event_user_id THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Calculate progress
  SELECT 
    jsonb_array_length(checklist),
    (
      SELECT COUNT(*)
      FROM jsonb_array_elements(checklist) AS item
      WHERE (item->>'completed')::boolean = true
    )
  INTO total_items, completed_items
  FROM events
  WHERE id = event_id;

  IF total_items = 0 THEN
    RETURN 0;
  END IF;

  progress := ROUND((completed_items::DECIMAL / total_items::DECIMAL) * 100);
  RETURN progress;
END;
$$;

-- Function to get user's upcoming events
CREATE OR REPLACE FUNCTION get_upcoming_events(user_id UUID, days_ahead INTEGER DEFAULT 30)
RETURNS SETOF events
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify user access
  IF auth.uid() != user_id THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT *
  FROM events
  WHERE events.user_id = get_upcoming_events.user_id
    AND start_date > CURRENT_DATE
    AND start_date <= CURRENT_DATE + days_ahead
  ORDER BY start_date ASC;
END;
$$;

-- Function to get overdue tasks
CREATE OR REPLACE FUNCTION get_overdue_tasks(user_id UUID)
RETURNS SETOF tasks
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify user access
  IF auth.uid() != user_id THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN QUERY
  SELECT *
  FROM tasks
  WHERE tasks.user_id = get_overdue_tasks.user_id
    AND status = 'open'
    AND due_date < CURRENT_DATE
    AND deleted_at IS NULL
  ORDER BY due_date ASC;
END;
$$;

-- Function to clean up deleted data (soft delete cleanup)
CREATE OR REPLACE FUNCTION cleanup_deleted_data(user_id UUID, days_old INTEGER DEFAULT 30)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  -- Verify user access
  IF auth.uid() != user_id THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Clean up old soft-deleted categories
  DELETE FROM categories
  WHERE categories.user_id = cleanup_deleted_data.user_id
    AND deleted = true
    AND deleted_at < (CURRENT_TIMESTAMP - (days_old || ' days')::INTERVAL);

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- Clean up old soft-deleted activity log categories
  DELETE FROM activity_log_categories
  WHERE activity_log_categories.user_id = cleanup_deleted_data.user_id
    AND deleted = true
    AND deleted_at < (CURRENT_TIMESTAMP - (days_old || ' days')::INTERVAL);

  GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;

  -- Clean up old soft-deleted tasks
  DELETE FROM tasks
  WHERE tasks.user_id = cleanup_deleted_data.user_id
    AND deleted_at IS NOT NULL
    AND deleted_at < (CURRENT_TIMESTAMP - (days_old || ' days')::INTERVAL);

  GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;

  RETURN deleted_count;
END;
$$;

-- Function to export user data
CREATE OR REPLACE FUNCTION export_user_data(user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Verify user access
  IF auth.uid() != user_id THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT json_build_object(
    'export_date', CURRENT_TIMESTAMP,
    'user_id', user_id,
    'tasks', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT * FROM tasks 
        WHERE tasks.user_id = export_user_data.user_id 
          AND deleted_at IS NULL
        ORDER BY created_at
      ) t
    ),
    'categories', (
      SELECT COALESCE(json_agg(row_to_json(c)), '[]'::json)
      FROM (
        SELECT * FROM categories 
        WHERE categories.user_id = export_user_data.user_id
        ORDER BY created_at
      ) c
    ),
    'projects', (
      SELECT COALESCE(json_agg(row_to_json(p)), '[]'::json)
      FROM (
        SELECT * FROM projects 
        WHERE projects.user_id = export_user_data.user_id
        ORDER BY created_at
      ) p
    ),
    'activity_log_categories', (
      SELECT COALESCE(json_agg(row_to_json(alc)), '[]'::json)
      FROM (
        SELECT * FROM activity_log_categories 
        WHERE activity_log_categories.user_id = export_user_data.user_id
        ORDER BY created_at
      ) alc
    ),
    'events', (
      SELECT COALESCE(json_agg(row_to_json(e)), '[]'::json)
      FROM (
        SELECT * FROM events 
        WHERE events.user_id = export_user_data.user_id
        ORDER BY start_date
      ) e
    ),
    'user_settings', (
      SELECT row_to_json(us)
      FROM user_settings us
      WHERE us.user_id = export_user_data.user_id
    )
  ) INTO result;

  RETURN result;
END;
$$;