import { createClient } from '@supabase/supabase-js'

// Pull credentials using Vite's import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Safety Check: Warn in the console if they are missing
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase Credentials missing. Check your .env file and ensure variables start with VITE_")
}

// Export the singleton client
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co", 
  supabaseAnonKey || "placeholder-key"
)
