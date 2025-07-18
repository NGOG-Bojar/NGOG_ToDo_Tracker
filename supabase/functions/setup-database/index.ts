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

    // Get the user from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify the user token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create the initialize_user_data function if it doesn't exist
    const createFunctionSql = `
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

    // Create the function
    const { error: functionError } = await supabaseAdmin.rpc('exec_sql', { sql: createFunctionSql })
    
    if (functionError) {
      console.error('Function creation error:', functionError)
      return new Response(
        JSON.stringify({ error: 'Failed to create initialization function', details: functionError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize user data
    const { error: initError } = await supabaseAdmin.rpc('initialize_user_data', {
      user_id: user.id
    })

    if (initError) {
      console.error('User initialization error:', initError)
      return new Response(
        JSON.stringify({ error: 'Failed to initialize user data', details: initError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User initialization completed successfully!',
        user_id: user.id,
        default_data_created: {
          categories: 4,
          activity_log_categories: 6,
          user_settings: 1
        }
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