/*
  # Initialize User Data Function

  1. Function
    - `initialize_user_data` - Creates default categories and settings for new users
  
  2. Purpose
    - Called automatically when new users sign up
    - Creates default task categories
    - Creates default activity log categories
    - Sets up user preferences
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

  -- Create user settings
  INSERT INTO user_settings (user_id, theme, notifications) VALUES
    (user_id, 'default', true)
  ON CONFLICT (user_id) DO NOTHING;

EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the signup process
    RAISE WARNING 'Failed to initialize user data for user %: %', user_id, SQLERRM;
END;
$$;