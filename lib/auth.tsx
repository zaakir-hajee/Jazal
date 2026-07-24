import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import type { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, name: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signIn: async () => null,
  signUp: async () => null,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
      })
      .catch(() => {
        // Network hiccup on cold boot — proceed as signed out rather than hang.
      })
      .finally(() => {
        setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);
        if (event === 'SIGNED_IN' && session?.user) {
          await ensureProfile(session.user.id, session.user.user_metadata?.display_name);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  async function ensureProfile(userId: string, name?: string) {
    await supabase.from('profiles').upsert({
      id: userId,
      display_name: name || '',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id', ignoreDuplicates: true });
  }

  async function signIn(email: string, password: string): Promise<string | null> {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error?.message ?? null;
    } catch (e: any) {
      return e?.message ?? 'Network request failed. Please check your connection and try again.';
    }
  }

  async function signUp(email: string, password: string, name: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: name } },
      });
      if (error) return error.message;
      // With email confirmation disabled, Supabase returns an obfuscated response
      // for already-registered emails: a user object with empty identities.
      if (data?.user && (data.user.identities?.length ?? 0) === 0) {
        return 'This email is already registered';
      }
      return null;
    } catch (e: any) {
      return e?.message ?? 'Network request failed. Please check your connection and try again.';
    }
  }

  async function signOut() {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore — the local session will still be cleared by the auth state listener.
    }
  }

  return (
    <AuthContext.Provider value={{ session, user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
