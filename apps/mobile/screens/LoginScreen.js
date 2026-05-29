import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors } from '../theme';
import shared from '../sharedStyles';
import { useAuth } from '../providers/AuthProvider';

export default function LoginScreen() {
  const { signIn, signUp, sendPasswordReset } = useAuth();

  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const onModeChange = (nextMode) => {
    setMode(nextMode);
    setErrorMessage('');
    setInfoMessage('');
  };

  const onSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage('');
    setInfoMessage('');

    try {
      const result =
        mode === 'signin'
          ? await signIn({ email: email.trim(), password })
          : await signUp({
              email: email.trim(),
              password,
              displayName: username.trim(),
            });

      if (result?.error) {
        setErrorMessage(result.error.message);
      } else if (mode === 'signup') {
        if (result?.data?.session) {
          setInfoMessage('Account created. You are now signed in.');
        } else {
          setInfoMessage('Account created. Please confirm your email, then sign in.');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const onForgotPassword = async () => {
    if (isSubmitting || isSendingReset) return;
    setErrorMessage('');
    setInfoMessage('');
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Enter your email above first');
      return;
    }
    setIsSendingReset(true);
    const { error } = await sendPasswordReset({ email: trimmedEmail });
    setIsSendingReset(false);
    if (error) {
      setErrorMessage(error.message ?? 'Failed to send reset email');
      return;
    }
    setInfoMessage('Reset email sent. Check your inbox.');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.safe} behavior="padding">
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.header}>
            <Text style={[shared.typography.h1, styles.logo]}>
              foody
              <Text style={styles.logoDot}>.</Text>
            </Text>
          </View>

          <View style={styles.modeRow}>
            <Pressable
              accessibilityRole="button"
              onPress={() => onModeChange('signin')}
              style={({ pressed }) => [styles.modePill, mode === 'signin' && styles.modePillActive, pressed && styles.pressed]}
            >
              <Text style={[shared.typography.sub2, styles.modePillText]}>Sign in</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => onModeChange('signup')}
              style={({ pressed }) => [styles.modePill, mode === 'signup' && styles.modePillActive, pressed && styles.pressed]}
            >
              <Text style={[shared.typography.sub2, styles.modePillText]}>Sign up</Text>
            </Pressable>
          </View>

          <View style={styles.form}>
            {mode === 'signup' && (
              <>
                <Text style={[shared.typography.sub2, styles.label]}>Username</Text>
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Your display name"
                  placeholderTextColor="#666"
                  autoCapitalize="words"
                  autoCorrect={false}
                  style={styles.input}
                />
              </>
            )}

            <Text style={[shared.typography.sub2, styles.label]}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor="#666"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />

            <Text style={[shared.typography.sub2, styles.label]}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#666"
              secureTextEntry
              style={styles.input}
            />

            {!!errorMessage && <Text style={[shared.typography.body, styles.error]}>{errorMessage}</Text>}
            {!!infoMessage && <Text style={[shared.typography.body, styles.info]}>{infoMessage}</Text>}

            <Pressable
              accessibilityRole="button"
              onPress={onSubmit}
              disabled={
                isSubmitting ||
                !email ||
                !password ||
                (mode === 'signup' && username.trim().length === 0)
              }
              style={({ pressed }) => [
                styles.primaryButton,
                isSubmitting && styles.primaryButtonDisabled,
                pressed && !isSubmitting && styles.primaryButtonPressed,
              ]}
            >
              <Text style={[shared.typography.sub1, styles.primaryButtonText]}>
                {isSubmitting ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
              </Text>
            </Pressable>

            {mode === 'signin' && (
              <Pressable
                accessibilityRole="button"
                onPress={onForgotPassword}
                disabled={isSubmitting || isSendingReset}
                style={({ pressed }) => [
                  styles.forgotWrap,
                  pressed && !isSubmitting && !isSendingReset && styles.pressed,
                ]}
              >
                <Text style={[shared.typography.bodySmall, styles.forgotText]}>
                  {isSendingReset ? 'Sending…' : 'Forgot password'}
                </Text>
              </Pressable>
            )}

            {mode === 'signup' && (
              <Text style={[shared.typography.bodySmall, styles.hint]}>
                If email confirmations are enabled, you may need to confirm your email before logging in.
              </Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.headerBg,
  },
  container: {
    flexGrow: 1,
    backgroundColor: colors.cream,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: colors.headerBg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  logo: {
    color: colors.text,
    fontFamily: 'Poppins-Bold',
  },
  logoDot: {
    color: colors.accent,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  modePill: {
    flex: 1,
    backgroundColor: colors.pillInactive,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9999,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modePillActive: {
    backgroundColor: colors.pillActive,
    borderWidth: 2,
    borderColor: colors.border,
  },
  modePillText: {
    color: colors.text,
  },
  pressed: {
    opacity: 0.85,
  },
  form: {
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  label: {
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 14,
  },
  error: {
    color: '#B00020',
    marginBottom: 14,
  },
  info: {
    color: '#1B5E20',
    marginBottom: 14,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonPressed: {
    opacity: 0.85,
  },
  primaryButtonText: {
    color: '#fff',
  },
  hint: {
    marginTop: 12,
    color: '#444',
  },
  forgotWrap: {
    alignSelf: 'center',
    marginTop: 14,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  forgotText: {
    color: colors.text,
    textDecorationLine: 'underline',
  },
});

