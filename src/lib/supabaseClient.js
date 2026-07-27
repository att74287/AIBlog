import { createClient } from '@supabase/supabase-js';

const defaultUrl = 'https://iwumijeizbsyiakadwls.supabase.co';
const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3dW1pamVpemJzeWlha2Fkd2xzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwNzgyMDEsImV4cCI6MjEwMDY1NDIwMX0.RJMHaOXfKrQbBY3_uabxfHjEcq3vTa7w2mRduNke0lg';

// Retrieve environment variables or localStorage overrides or defaults
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('seccom_supabase_url') || defaultUrl;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('seccom_supabase_key') || defaultKey;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http'));

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    })
  : null;

/**
 * Save custom Supabase credentials dynamically
 */
export function setSupabaseCredentials(url, key) {
  if (url && key) {
    localStorage.setItem('seccom_supabase_url', url);
    localStorage.setItem('seccom_supabase_key', key);
  } else {
    localStorage.removeItem('seccom_supabase_url');
    localStorage.removeItem('seccom_supabase_key');
  }
  window.location.reload();
}
