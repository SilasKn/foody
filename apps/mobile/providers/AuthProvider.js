import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../utils/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    supabase.auth
      .getSession()
      .then(({ data: { session: nextSession } }) => {
        if (!isMounted) return;
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
        setIsLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setSession(null);
        setUser(null);
        setIsLoading(false);
      });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const value = useMemo(() => {
    return {
      session,
      user,
      isLoading,
      signIn: async ({ email, password }) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        return { data, error };
      },
      signUp: async ({ email, password }) => {
        const { data, error } = await supabase.auth.signUp({ email, password });
        return { data, error };
      },
      signOut: async () => {
        const { error } = await supabase.auth.signOut();
        return { error };
      },
    };
  }, [session, user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

