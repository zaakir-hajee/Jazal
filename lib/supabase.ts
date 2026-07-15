import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://dsngvlbkbzpfadmsclcp.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzbmd2bGJrYnpwZmFkbXNjbGNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODA3NDYsImV4cCI6MjA5MzY1Njc0Nn0.Bmp7lKCmo06rkZ854gnEmN2Q8xllANxEG2nQaz_bdG8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
