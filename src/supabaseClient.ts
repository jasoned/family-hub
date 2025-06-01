import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Ensure your .env file has these variables correctly defined
const supabaseUrl: string = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey: string = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key are required.");
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);