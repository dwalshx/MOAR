import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isCloudEnabled } from './supabase';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  /**
   * Send a 6-digit OTP code to the user's email.
   * Throws on error.
   */
  sendOTP: (email: string) => Promise<void>;
  /**
   * Verify the code the user received and complete sign-in.
   */
  verifyOTP: (email: string, token: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** True if a Supabase client exists (env vars configured) */
  cloudEnabled: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    // Subscribe to auth changes
    const { data: authSub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    return () => {
      authSub.subscription.unsubscribe();
    };
  }, []);

  const sendOTP = async (email: string) => {
    if (!supabase) throw new Error('Cloud sync not configured');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true, // auto-create account on first sign-in
      },
    });
    if (error) throw error;
  };

  const verifyOTP = async (email: string, token: string) => {
    if (!supabase) throw new Error('Cloud sync not configured');
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    if (error) throw error;
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, sendOTP, verifyOTP, signOut, cloudEnabled: isCloudEnabled }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
