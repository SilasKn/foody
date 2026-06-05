import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../utils/supabase';

const SITE_URL = process.env.EXPO_PUBLIC_SITE_URL ?? 'https://foodytheapp.com';

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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe?.();
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
      signUp: async ({ email, password, displayName }) => {
        const normalizedDisplayName = displayName?.trim();
        const options = {
          emailRedirectTo: `${SITE_URL}/verify-email`,
          ...(normalizedDisplayName ? { data: { display_name: normalizedDisplayName } } : {}),
        };
        const { data, error } = await supabase.auth.signUp({ email, password, options });
        return { data, error };
      },
      signOut: async () => {
        const { error } = await supabase.auth.signOut();
        return { error };
      },
      deleteAccount: async () => {
        const { error } = await supabase.functions.invoke('delete-account');
        if (error) return { error };
        await supabase.auth.signOut();
        return { error: null };
      },
      updatePassword: async ({ currentPassword, newPassword }) => {
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
          current_password: currentPassword,
        });
        if (error) return { error };
        return { error: null };
      },
      sendPasswordReset: async ({ email }) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${SITE_URL}/reset-password`,
        });
        if (error) return { error };
        return { error: null };
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

