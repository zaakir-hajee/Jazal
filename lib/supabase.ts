import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

<<<<<<< HEAD
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
=======
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://ixbgxwnslpdnpkskersb.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4Ymd4d25zbHBkbnBrc2tlcnNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMTgzNzYsImV4cCI6MjA5Mjc5NDM3Nn0.kOtIak_bDpWxdCL1HMokH_sSpXhRmGi6xqbcq46y2NM';
>>>>>>> 62f3a7c220c9c110faf5d0256edebbe3db4a6d93

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
