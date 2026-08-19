import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../providers/AuthProvider';

export const USERNAME_STATUS_TEXT = {
  checking: 'Checking availability…',
  available: 'Username is available.',
  taken: 'This username is already taken.',
  error: 'Could not check the username right now.',
};

// Debounced "is this name free?" check, shared by the signup form and the
// rename form. Returns 'idle' | 'checking' | 'available' | 'taken' | 'error'.
//
// currentUsername is for renaming: is_username_available has no "excluding
// user X" argument, so it reports the caller's own name as taken. Keeping that
// name is not an error, it is a no-op - so it stays 'idle'.
export default function useUsernameAvailability({ value, enabled = true, currentUsername = null }) {
  const { checkUsernameAvailable } = useAuth();
  const [status, setStatus] = useState('idle');
  const checkSeq = useRef(0);

  useEffect(() => {
    const trimmed = value?.trim() ?? '';
    const isCurrent =
      !!currentUsername && trimmed.toLowerCase() === currentUsername.trim().toLowerCase();

    if (!enabled || !trimmed || isCurrent) {
      setStatus('idle');
      return;
    }

    // A slow early response must not overwrite the answer for a newer input.
    const seq = ++checkSeq.current;
    setStatus('checking');

    const timer = setTimeout(async () => {
      const { available } = await checkUsernameAvailable({ username: trimmed });
      if (seq !== checkSeq.current) return;
      setStatus(available === null ? 'error' : available ? 'available' : 'taken');
    }, 400);

    return () => clearTimeout(timer);
  }, [value, enabled, currentUsername, checkUsernameAvailable]);

  return status;
}
