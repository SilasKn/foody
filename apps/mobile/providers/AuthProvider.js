import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../utils/supabase';

const SITE_URL = process.env.EXPO_PUBLIC_SITE_URL ?? 'https://foodytheapp.com';

const AuthContext = createContext(null);

// Shared by both duplicate-email paths so the screen only has one code to match on.
const EMAIL_TAKEN_RESULT = {
  data: null,
  error: {
    code: 'email_already_registered',
    message: 'This email is already registered. Please sign in instead.',
  },
};

function isEmailTakenError(error) {
  if (error?.code === 'user_already_exists' || error?.code === 'email_exists') return true;
  return /already\s+registered/i.test(error?.message ?? '');
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState(null);

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

  // profiles.username ist die einzige Anzeigequelle fuer den Namen. Die Kopie in
  // raw_user_meta_data.display_name ist nur der Transportkanal beim Signup und
  // wird bewusst nicht gelesen - sie ist client-beschreibbar und unvalidiert.
  useEffect(() => {
    const userId = user?.id ?? null;
    if (!userId) {
      setUsername(null);
      return;
    }

    let isMounted = true;

    supabase
      .from('profiles')
      .select('username')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (isMounted) setUsername(data?.username ?? null);
      });

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const value = useMemo(() => {
    return {
      session,
      user,
      username,
      isLoading,
      signIn: async ({ email, password }) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        return { data, error };
      },
      checkUsernameAvailable: async ({ username }) => {
        const normalized = username?.trim();
        if (!normalized) return { available: false, error: null };
        const { data, error } = await supabase.rpc('is_username_available', {
          p_username: normalized,
        });
        // null means "could not determine" - callers must not read it as taken.
        if (error) return { available: null, error };
        return { available: data === true, error: null };
      },
      signUp: async ({ email, password, displayName }) => {
        const normalizedDisplayName = displayName?.trim();
        if (!normalizedDisplayName) {
          return { data: null, error: { message: 'Please enter a username.' } };
        }
        const options = {
          emailRedirectTo: `${SITE_URL}/verify-email`,
          data: { display_name: normalizedDisplayName },
        };
        const { data, error } = await supabase.auth.signUp({ email, password, options });
        if (error) {
          // Only reachable with email confirmation switched off; with it on,
          // GoTrue hides a duplicate address behind a fake success (see below).
          if (isEmailTakenError(error)) return EMAIL_TAKEN_RESULT;

          // GoTrue reports any trigger failure as a generic 500, so ask the DB
          // what actually went wrong instead of guessing from the message. This
          // is what catches two people claiming the same name at once.
          const { data: stillFree } = await supabase.rpc('is_username_available', {
            p_username: normalizedDisplayName,
          });
          if (stillFree === false) {
            return {
              data: null,
              error: { message: 'This username is already taken. Please choose another one.' },
            };
          }
          return { data, error };
        }

        // A signup on an address that already has an account answers 200 with a
        // throwaway user, no session and no mail sent - GoTrue obfuscates it on
        // purpose so signup cannot be used to enumerate accounts. The empty
        // identities array is the only tell. Anything other than a present but
        // empty array is left alone: a shape we do not recognise must not be
        // reported as a duplicate.
        const identities = data?.user?.identities;
        if (!data?.session && Array.isArray(identities) && identities.length === 0) {
          return EMAIL_TAKEN_RESULT;
        }

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
      updateUsername: async ({ username: nextUsername }) => {
        const trimmed = nextUsername?.trim();
        if (!trimmed) return { error: { message: 'Please enter a username.' } };
        if (!user?.id) return { error: { message: 'You are not signed in.' } };

        const { error } = await supabase
          .from('profiles')
          .update({ username: trimmed })
          .eq('user_id', user.id);

        // Der CI-Unique-Index ist bei einer Umbenennung die einzige
        // serverseitige Pruefung - der Signup-Trigger laeuft hier nicht.
        // Gleiche Formulierung wie beim Signup, damit der Nutzer denselben
        // Text sieht.
        if (error?.code === '23505') {
          return {
            error: { message: 'This username is already taken. Please choose another one.' },
          };
        }
        if (error) return { error };

        // Der Lade-Effekt oben haengt nur an user?.id und laeuft nach einem
        // Update nicht erneut - der neue Name muss von Hand gesetzt werden.
        setUsername(trimmed);
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
  }, [session, user, username, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

