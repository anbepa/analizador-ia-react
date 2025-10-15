import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://clijcuhopsmndimfwyyt.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsaWpjdWhvcHNtbmRpbWZ3eXl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5MzkzNDAsImV4cCI6MjA3NTUxNTM0MH0.943D1BRFDkl4hPENAiIfBdKWd1eMRSgKdbsZuwcR1qA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
})