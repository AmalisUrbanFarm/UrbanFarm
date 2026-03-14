import { createClient } from '@supabase/supabase-js'

let instance: ReturnType<typeof createClient> | null = null

function getSupabase() {
  if (!instance) {
    instance = createClient(
      import.meta.env.VITE_SUPABASE_URL as string,
      import.meta.env.VITE_SUPABASE_ANON_KEY as string,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: true,
          detectSessionInUrl: false
        }
      }
    )
  }
  return instance
}

export const supabase = getSupabase()