import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rnmynwkdcoammxnrzmik.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Use a more robust initialization pattern for sandbox environments
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
