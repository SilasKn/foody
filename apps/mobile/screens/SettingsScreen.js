import { useState } from 'react';
import { ActivityIndicator, Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image as SvgIcon } from 'expo-image';
import { useAuth } from '../providers/AuthProvider';
import shared from '../sharedStyles';
import { colors } from '../theme';

// Die Rechtstexte leben auf der Website, damit App und Website nicht auseinanderlaufen.
// Reihenfolge wie im Footer von foodytheapp.com.
const LEGAL_LINKS = [
  { label: 'Legal Notice', url: 'https://foodytheapp.com/legal-notice' },
  { label: 'Privacy Policy', url: 'https://foodytheapp.com/privacy-policy' },
  { label: 'Terms of Use', url: 'https://foodytheapp.com/terms' },
];

// openURL lehnt ab, wenn kein Browser bereitsteht. Das darf den Screen nicht
// abstuerzen lassen, deshalb wird die Rejection geschluckt.
const openLegalLink = (url) => {
  Linking.openURL(url).catch(() => {});
};

export default function SettingsScreen({ navigation }) {
  const { deleteAccount } = useAuth();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const closeDeleteModal = () => {
    setDeleteModalVisible(false);
    setDeleteError('');
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError('');
    const { error } = await deleteAccount();
    setIsDeleting(false);
    // Bei einem Fehler bleibt das Konto bestehen: Dialog offen lassen, damit
    // der Nutzer es erneut versuchen kann. error.message waere hier immer der
    // generische FunctionsHttpError-Text, deshalb eine eigene Meldung.
    if (error) {
      setDeleteError('Could not delete your account. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        <Text style={styles.logo}>
          foody<Text style={styles.logoDot}>.</Text>
        </Text>

        <View style={styles.titleRow}>
          <Pressable
            style={({ pressed }) => [styles.backButton, pressed && shared.pressed]}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <SvgIcon
              source={require('../assets/arrow_back_icon.svg')}
              style={[styles.backIcon, shared.iconOnAccent]}
              contentFit="contain"
            />
          </Pressable>
          <Text style={[shared.typography.h2, styles.title]}>Settings</Text>
        </View>

        <View style={styles.menuList}>
          <Pressable
            style={({ pressed }) => [styles.menuItem, pressed && shared.pressed]}
            onPress={() => navigation.navigate('ChangePassword')}
          >
            <Text style={[shared.typography.body, styles.menuLabel]}>change Password</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.menuItem, pressed && shared.pressed]}
            onPress={() => navigation.navigate('ChangeUsername')}
          >
            <Text style={[shared.typography.body, styles.menuLabel]}>change Username</Text>
          </Pressable>
          <View style={styles.separator} />
          <Pressable
            style={({ pressed }) => [styles.menuItem, pressed && shared.pressed]}
            onPress={() => setDeleteModalVisible(true)}
          >
            <Text style={[shared.typography.body, styles.menuLabelDanger]}>Delete Account</Text>
          </Pressable>
          {LEGAL_LINKS.map(({ label, url }) => (
            <Pressable
              key={url}
              style={({ pressed }) => [styles.menuItem, styles.legalItem, pressed && shared.pressed]}
              onPress={() => openLegalLink(url)}
              accessibilityRole="link"
              accessibilityLabel={label}
              accessibilityHint="Opens in your browser"
            >
              <SvgIcon
                source={require('../assets/info_icon.svg')}
                style={styles.legalIcon}
                contentFit="contain"
              />
              <Text style={[shared.typography.body, styles.legalLabel]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Modal
        transparent
        visible={deleteModalVisible}
        animationType="fade"
        onRequestClose={() => !isDeleting && closeDeleteModal()}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => !isDeleting && closeDeleteModal()}
        >
          <Pressable style={styles.dialogCard} onPress={() => {}}>
            <Text style={[shared.typography.h2, styles.dialogTitle]}>Delete Account?</Text>
            <Text style={[shared.typography.body, styles.dialogMessage]}>
              This action is permanent and cannot be undone. All your recipes and data will be deleted.
            </Text>
            {deleteError ? (
              <Text style={[shared.typography.bodySmall, styles.dialogError]}>{deleteError}</Text>
            ) : null}
            <View style={styles.dialogButtons}>
              <Pressable
                style={({ pressed }) => [styles.dialogBtn, styles.dialogBtnCancel, pressed && styles.dialogBtnPressed]}
                onPress={closeDeleteModal}
                disabled={isDeleting}
              >
                <Text style={[shared.typography.sub2, styles.dialogBtnLabel]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.dialogBtn, styles.dialogBtnConfirm, pressed && styles.dialogBtnPressed]}
                onPress={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={[shared.typography.sub2, styles.dialogBtnLabel, styles.dialogBtnLabelConfirm]}>Delete</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  container: {
    flex: 1,
    paddingHorizontal: 18,
  },
  logo: {
    color: colors.text,
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    marginTop: 14,
    marginBottom: 20,
  },
  logoDot: {
    color: colors.accent,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 28,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    width: 22,
    height: 22,
  },
  title: {
    color: colors.text,
  },
  menuList: {
    marginTop: 4,
  },
  menuItem: {
    paddingVertical: 12,
  },
  menuLabel: {
    color: colors.text,
  },
  menuLabelDanger: {
    color: colors.danger,
  },
  legalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legalIcon: {
    width: 20,
    height: 20,
  },
  legalLabel: {
    color: colors.textMuted,
  },
  separator: {
    height: 1,
    backgroundColor: colors.textMuted,
    opacity: 0.3,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogCard: {
    width: '85%',
    backgroundColor: colors.white,
    borderRadius: 28,
    padding: 28,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  dialogTitle: {
    color: colors.text,
    marginBottom: 8,
  },
  dialogMessage: {
    color: colors.text,
    opacity: 0.7,
  },
  dialogError: {
    color: colors.danger,
    marginTop: 10,
  },
  dialogButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  dialogBtn: {
    flex: 1,
    borderRadius: 9999,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogBtnCancel: {
    backgroundColor: colors.pillInactive,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dialogBtnConfirm: {
    backgroundColor: colors.danger,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dialogBtnPressed: {
    opacity: 0.85,
  },
  dialogBtnLabel: {
    color: colors.text,
  },
  dialogBtnLabelConfirm: {
    color: colors.white,
  },
});
