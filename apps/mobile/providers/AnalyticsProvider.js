import { useEffect, useMemo, useRef } from 'react';
import { AppState } from 'react-native';
import { PostHogProvider } from 'posthog-react-native';
import { useAuth } from './AuthProvider';
import { createIdentifiedClient } from '../utils/analytics';

// Entspricht PostHogs eigenem Session-Fenster (sessionExpirationTimeSeconds). Wer die App
// aus dem Hintergrund zurueckholt, ohne dass so viel Zeit vergangen ist, hat sie nicht
// neu "geoeffnet".
const REOPEN_THRESHOLD_MS = 30 * 60 * 1000;

export function AnalyticsProvider({ children }) {
  const { user } = useAuth();

  const client = useMemo(
    () => (user?.id ? createIdentifiedClient(user.id) : null),
    [user?.id],
  );

  // Der abgeloeste Client haelt einen Flush-Timer offen.
  useEffect(() => {
    if (!client) return undefined;
    return () => {
      client.shutdown(2000).catch(() => {});
    };
  }, [client]);

  const lastOpenedAtRef = useRef(0);
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    if (!client) return undefined;

    lastOpenedAtRef.current = Date.now();
    client.capture('app_opened');

    const subscription = AppState.addEventListener('change', (nextState) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextState;

      // iOS meldet 'inactive' schon beim Aufziehen des Kontrollzentrums - nur die echte
      // Rueckkehr aus dem Hintergrund zaehlt als Oeffnen.
      if (nextState === 'active' && previousState === 'background') {
        if (Date.now() - lastOpenedAtRef.current >= REOPEN_THRESHOLD_MS) {
          lastOpenedAtRef.current = Date.now();
          client.capture('app_opened');
        }
      } else if (nextState === 'background') {
        client.flush().catch(() => {});
      }
    });

    return () => subscription.remove();
  }, [client]);

  // Ohne Session gibt es keinen Client - LoginScreen sendet seine Signup-Events deshalb
  // nicht ueber usePostHog(), sondern direkt ueber utils/analytics.
  if (!client) return children;

  return (
    <PostHogProvider client={client} autocapture={false}>
      {children}
    </PostHogProvider>
  );
}
