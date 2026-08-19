import { render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import { AuthProvider, useAuth } from '../AuthProvider';

// ─── Module mocks ─────────────────────────────────────────────────────────────

jest.mock('../../utils/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signUp: jest.fn(),
    },
    rpc: jest.fn(),
    from: jest.fn(),
  },
}));

const { supabase } = require('../../utils/supabase');

// ─── Harness ──────────────────────────────────────────────────────────────────

// Hands the live context back to the test so signUp can be driven directly;
// the duplicate-email branches are otherwise only reachable through a real
// Supabase round trip.
async function mountAuth() {
  const captured = {};
  const Probe = () => {
    Object.assign(captured, useAuth());
    return <Text>ready</Text>;
  };

  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );

  await waitFor(() => expect(captured.signUp).toBeInstanceOf(Function));
  return captured;
}

const SIGNUP_ARGS = { email: 'taken@example.com', password: 'pw123456', displayName: 'Silas' };

beforeEach(() => {
  jest.clearAllMocks();
  supabase.auth.getSession.mockResolvedValue({ data: { session: null } });
  supabase.auth.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: jest.fn() } },
  });
  supabase.rpc.mockResolvedValue({ data: true, error: null });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('signUp with an address that already has an account', () => {
  it('reports the obfuscated 200 (empty identities, no session) as email_already_registered', async () => {
    supabase.auth.signUp.mockResolvedValue({
      data: { user: { id: 'throwaway', identities: [] }, session: null },
      error: null,
    });

    const auth = await mountAuth();
    const result = await auth.signUp(SIGNUP_ARGS);

    expect(result.error.code).toBe('email_already_registered');
    expect(result.error.message).toMatch(/already registered/i);
    expect(result.data).toBeNull();
  });

  it('normalises the explicit error raised when email confirmation is off', async () => {
    supabase.auth.signUp.mockResolvedValue({
      data: null,
      error: { code: 'user_already_exists', message: 'User already registered' },
    });

    const auth = await mountAuth();
    const result = await auth.signUp(SIGNUP_ARGS);

    expect(result.error.code).toBe('email_already_registered');
    // The username RPC is pointless here: a rejected signup never ran the trigger.
    expect(supabase.rpc).not.toHaveBeenCalled();
  });
});

describe('signUp on addresses that are actually free', () => {
  it('passes a normal signup through untouched', async () => {
    const data = { user: { id: 'new-user', identities: [{ id: 'identity-1' }] }, session: null };
    supabase.auth.signUp.mockResolvedValue({ data, error: null });

    const auth = await mountAuth();
    const result = await auth.signUp(SIGNUP_ARGS);

    expect(result.error).toBeNull();
    expect(result.data).toBe(data);
  });

  it('does not claim a duplicate when identities is missing from the response', async () => {
    supabase.auth.signUp.mockResolvedValue({
      data: { user: { id: 'new-user' }, session: null },
      error: null,
    });

    const auth = await mountAuth();
    const result = await auth.signUp(SIGNUP_ARGS);

    expect(result.error).toBeNull();
  });

  it('still reports a taken username', async () => {
    supabase.auth.signUp.mockResolvedValue({
      data: null,
      error: { message: 'Database error saving new user' },
    });
    supabase.rpc.mockResolvedValue({ data: false, error: null });

    const auth = await mountAuth();
    const result = await auth.signUp(SIGNUP_ARGS);

    expect(result.error.message).toMatch(/username is already taken/i);
    expect(result.error.code).toBeUndefined();
  });
});
