import { Ionicons } from '@expo/vector-icons';
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
import { useAuth } from '../providers/AuthProvider';

export default function LoginScreen() {
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const onSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const result =
        mode === 'signin'
          ? await signIn({ email: email.trim(), password })
          : await signUp({ email: email.trim(), password });

      if (result?.error) {
        setErrorMessage(result.error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.safe} behavior="padding">
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.header}>
            <Text style={styles.logo}>
              foody
              <Text style={styles.logoDot}>.</Text>
            </Text>
            <View style={styles.headerRight} aria-hidden>
              <Ionicons name="person-circle-outline" size={26} color={colors.text} />
            </View>
          </View>

          <View style={styles.modeRow}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setMode('signin')}
              style={({ pressed }) => [styles.modePill, mode === 'signin' && styles.modePillActive, pressed && styles.pressed]}
            >
              <Text style={styles.modePillText}>Sign in</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => setMode('signup')}
              style={({ pressed }) => [styles.modePill, mode === 'signup' && styles.modePillActive, pressed && styles.pressed]}
            >
              <Text style={styles.modePillText}>Sign up</Text>
            </Pressable>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Email</Text>
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

            <Text style={styles.label}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#666"
              secureTextEntry
              style={styles.input}
            />

            {!!errorMessage && <Text style={styles.error}>{errorMessage}</Text>}

            <Pressable
              accessibilityRole="button"
              onPress={onSubmit}
              disabled={isSubmitting || !email || !password}
              style={({ pressed }) => [
                styles.primaryButton,
                isSubmitting && styles.primaryButtonDisabled,
                pressed && !isSubmitting && styles.primaryButtonPressed,
              ]}
            >
              <Text style={styles.primaryButtonText}>
                {isSubmitting ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
              </Text>
            </Pressable>

            {mode === 'signup' && (
              <Text style={styles.hint}>
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
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  logo: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
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
    fontSize: 13,
    fontWeight: '700',
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
    fontSize: 13,
    fontWeight: '700',
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
    fontWeight: '600',
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
    fontSize: 15,
    fontWeight: '700',
  },
  hint: {
    marginTop: 12,
    color: '#444',
    fontSize: 12,
    lineHeight: 16,
  },
});

