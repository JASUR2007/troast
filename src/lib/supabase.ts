// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const env = import.meta.env;
const supabaseUrl =
  (env.VITE_SUPABASE_URL as string) ||
  (env.NEXT_PUBLIC_SUPABASE_URL as string) ||
  (env.SUPABASE_URL as string) ||
  '';

const supabaseAnonKey =
  (env.VITE_SUPABASE_ANON_KEY as string) ||
  (env.SUPABASE_ANON_KEY as string) ||
  (env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string) ||
  (env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string) ||
  '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://your-project.supabase.co'
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
