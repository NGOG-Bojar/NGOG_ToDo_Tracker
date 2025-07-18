import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Complete database schema SQL
    const schemaSql = `
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create categories table
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

-- Create tasks table
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

-- Create projects table
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

-- Create project_activity_logs table
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

-- Create activity_log_categories table
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

-- Create events table
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

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  theme TEXT DEFAULT 'default',
  notifications BOOLEAN DEFAULT true,
  password_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_deleted ON categories(user_id, deleted);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(user_id, priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(user_id, status);
CREATE INDEX IF NOT EXISTS idx_projects_archived ON projects(user_id, archived);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_dates ON events(user_id, start_date, end_date);

-- Create updated_at trigger function
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
  FOR EACH ROW EXECUTE FUNCTION update_user_settings_updated_at_column();

-- Create initialize_user_data function
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
`;

    // Execute the schema creation
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql: schemaSql })
    
    if (error) {
      console.error('Database setup error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to setup database', details: error }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Database schema created successfully!',
        tables_created: [
          'categories', 'tasks', 'projects', 'project_activity_logs', 
          'activity_log_categories', 'events', 'user_settings'
        ]
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Setup error:', error)
    return new Response(
      JSON.stringify({ error: 'Setup failed', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})