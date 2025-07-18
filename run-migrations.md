# How to Apply Supabase Migrations

## Option 1: Using Supabase Dashboard (Recommended for now)

Since the Supabase CLI isn't available in this environment, you'll need to run the migrations manually through the Supabase dashboard:

### Steps:
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Copy and paste each migration file content in order:

#### Run these files in this exact order:
1. `supabase/migrations/create_initial_schema.sql`
2. `supabase/migrations/create_default_event_checklist.sql` 
3. `supabase/migrations/create_helper_functions.sql`
4. `supabase/migrations/initialize_user_data_function.sql`
5. `supabase/migrations/create_rls_policies.sql`
6. `supabase/migrations/create_indexes_and_constraints.sql`
7. `supabase/migrations/create_database_functions.sql`

### For each file:
1. Open the file in your code editor
2. Copy the entire SQL content
3. Paste it into the Supabase SQL Editor
4. Click **Run** button
5. Verify no errors occurred
6. Move to the next file

## Option 2: Single Combined Migration (Easier)

I can create a single file with all migrations combined for easier execution.

## After Running Migrations

You should see these tables in your Supabase dashboard:
- `categories`
- `tasks` 
- `projects`
- `project_activity_logs`
- `activity_log_categories`
- `events`
- `user_settings`

Plus all the functions, policies, and indexes will be created.

## Verification

After running all migrations, you can verify by:
1. Going to **Table Editor** in Supabase dashboard
2. You should see all 7 tables listed
3. Check **Database** > **Functions** to see the helper functions
4. Check **Authentication** > **Policies** to see RLS policies