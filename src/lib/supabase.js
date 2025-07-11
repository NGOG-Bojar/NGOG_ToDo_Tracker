import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://vnvcerwnoenyefoomzvy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZudmNlcndub2VueWVmb29tenZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMTI3ODQsImV4cCI6MjA2Nzc4ODc4NH0.bNGoZr7ILmZhyIGlCRr6mLhMY6F4-eQEFK8DKK5k0WM'

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
})

export default supabase