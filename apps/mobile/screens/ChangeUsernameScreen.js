import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import useUsernameAvailability, { USERNAME_STATUS_TEXT } from '../hooks/useUsernameAvailability';
import { useAuth } from '../providers/AuthProvider';
import shared from '../sharedStyles';
import { colors } from '../theme';

export default function ChangeUsernameScreen({ navigation }) {
  const { username, updateUsername } = useAuth();
  const [newUsername, setNewUsername] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const status = useUsernameAvailability({
    value: newUsername,
    currentUsername: username,
  });

  const onCancel = () => {
    if (isSaving) return;
    navigation.goBack();
  };

  const onSave = async () => {
    setError('');
    const trimmed = newUsername.trim();
    if (!trimmed) {
      setError('Please enter a username');
      return;
    }
    if (trimmed.toLowerCase() === (username ?? '').trim().toLowerCase()) {
      setError('This is already your username');
      return;
    }
    if (status === 'taken') {
      setError('This username is already taken. Please choose another one.');
      return;
    }

    setIsSaving(true);
    const { error: updateError } = await updateUsername({ username: trimmed });
    setIsSaving(false);

    if (updateError) {
      setError(updateError.message ?? 'Failed to update username');
      return;
    }

    Alert.alert('Username updated', 'Your username has been changed.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <View style={styles.root}>
      <Pressable style={StyleSheet.absoluteFillObject} onPress={onCancel} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']} pointerEvents="box-none">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.kbAvoider}
          pointerEvents="box-none"
        >
          <Pressable style={styles.card} onPress={Keyboard.dismiss}>
            <View style={styles.body}>
              <Text style={[shared.typography.h2, styles.title]}>Change Username</Text>

              <Text style={[shared.typography.body, styles.currentLine]}>
                Current Username: {username ?? '–'}
              </Text>

              <Text style={[shared.typography.sub2, styles.label]}>New Username</Text>
              <TextInput
                value={newUsername}
                onChangeText={setNewUsername}
                placeholder=""
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                autoCapitalize="words"
                autoCorrect={false}
                editable={!isSaving}
              />

              {status !== 'idle' && (
                <Text
                  style={[
                    shared.typography.bodySmall,
                    styles.fieldStatus,
                    status === 'taken' && styles.fieldStatusTaken,
                    status === 'available' && styles.fieldStatusAvailable,
                  ]}
                >
                  {USERNAME_STATUS_TEXT[status]}
                </Text>
              )}

              {!!error && (
                <Text style={[shared.typography.body, styles.error]}>{error}</Text>
              )}

              <View style={styles.buttonRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.btn,
                    styles.btnCancel,
                    pressed && shared.pressed,
                  ]}
                  onPress={onCancel}
                  disabled={isSaving}
                >
                  <Text style={[shared.typography.sub2, styles.btnLabel]}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.btn,
                    styles.btnSave,
                    isSaving && styles.btnSaveDisabled,
                    pressed && !isSaving && shared.pressed,
                  ]}
                  onPress={onSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <Text style={[shared.typography.sub2, styles.btnLabel, styles.btnLabelSave]}>
                      Save
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.backdrop,
  },
  safe: {
    flex: 1,
  },
  kbAvoider: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 48,
  },
  card: {
    backgroundColor: colors.cream,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 24,
  },
  title: {
    color: colors.text,
    marginBottom: 14,
  },
  currentLine: {
    color: colors.text,
    marginBottom: 4,
  },
  label: {
    color: colors.text,
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 9999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.text,
    fontFamily: 'Poppins-Regular',
    fontSize: 15,
  },
  fieldStatus: {
    color: colors.textMuted,
    marginTop: 8,
  },
  fieldStatusTaken: {
    color: colors.danger,
  },
  fieldStatusAvailable: {
    color: colors.accent,
  },
  error: {
    color: colors.danger,
    marginTop: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 22,
  },
  btn: {
    borderRadius: 9999,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnCancel: {
    backgroundColor: colors.white,
  },
  btnSave: {
    backgroundColor: colors.accent,
  },
  btnSaveDisabled: {
    opacity: 0.6,
  },
  btnLabel: {
    color: colors.text,
  },
  btnLabelSave: {
    color: colors.white,
  },
});
