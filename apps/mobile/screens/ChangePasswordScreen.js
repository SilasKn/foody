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
import { useAuth } from '../providers/AuthProvider';
import shared from '../sharedStyles';
import { colors } from '../theme';

export default function ChangePasswordScreen({ navigation }) {
  const { updatePassword, sendPasswordReset, user } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  const onCancel = () => {
    if (isSaving) return;
    navigation.goBack();
  };

  const onSave = async () => {
    setError('');
    if (!oldPassword || !newPassword || !repeatPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (newPassword !== repeatPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (newPassword === oldPassword) {
      setError('New password must differ from old password');
      return;
    }

    setIsSaving(true);
    const { error: updateError } = await updatePassword({
      currentPassword: oldPassword,
      newPassword,
    });
    setIsSaving(false);

    if (updateError) {
      setError(updateError.message ?? 'Failed to update password');
      return;
    }

    Alert.alert('Password updated', 'Your password has been changed.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  const onForgotPassword = () => {
    if (isSaving || isSendingReset) return;
    const email = user?.email;
    if (!email) {
      setError('No email on file for this account');
      return;
    }
    Alert.alert(
      'Send reset email?',
      `We'll email a password reset link to ${email}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            setError('');
            setIsSendingReset(true);
            const { error: resetError } = await sendPasswordReset({ email });
            setIsSendingReset(false);
            if (resetError) {
              setError(resetError.message ?? 'Failed to send reset email');
              return;
            }
            Alert.alert('Email sent', 'Check your inbox for a reset link.', [
              { text: 'OK', onPress: () => navigation.goBack() },
            ]);
          },
        },
      ],
    );
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
              <Text style={[shared.typography.h2, styles.title]}>Change Password</Text>

              <Text style={[shared.typography.sub2, styles.label]}>Old Password</Text>
              <TextInput
                value={oldPassword}
                onChangeText={setOldPassword}
                placeholder=""
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSaving}
              />

              <Text style={[shared.typography.sub2, styles.label]}>New Password</Text>
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder=""
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSaving}
              />

              <Text style={[shared.typography.sub2, styles.label]}>Repeat New Password</Text>
              <TextInput
                value={repeatPassword}
                onChangeText={setRepeatPassword}
                placeholder=""
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSaving}
              />

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

              <Pressable
                style={({ pressed }) => [
                  styles.forgotWrap,
                  pressed && !isSaving && !isSendingReset && shared.pressed,
                ]}
                onPress={onForgotPassword}
                disabled={isSaving || isSendingReset}
              >
                {isSendingReset ? (
                  <ActivityIndicator color={colors.text} size="small" />
                ) : (
                  <Text style={[shared.typography.bodySmall, styles.forgotText]}>
                    Forgot password
                  </Text>
                )}
              </Pressable>
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
    backgroundColor: 'rgba(0,0,0,0.45)',
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
  forgotWrap: {
    alignSelf: 'center',
    marginTop: 18,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  forgotText: {
    color: colors.text,
    textDecorationLine: 'underline',
  },
});
