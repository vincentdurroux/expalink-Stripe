import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rnmynwkdcoammxnrzmik.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJubXlud2tkY29hbW14bnJ6bWlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyODc3ODcsImV4cCI6MjA4Mzg2Mzc4N30.K0XqIUNfUrT_0xY1kPeMY39ckolw4ipOSU3qlKY7HTs';

// Use a more robust initialization pattern for sandbox environments
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});