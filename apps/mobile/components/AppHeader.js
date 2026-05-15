import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image as SvgIcon } from 'expo-image';
import { useAuth } from '../providers/AuthProvider';
import shared from '../sharedStyles';
import { colors } from '../theme';

export default function AppHeader({ navigation }) {
  const { session, signOut } = useAuth();
  const [logoutVisible, setLogoutVisible] = useState(false);

  const onUserPress = () => {
    if (session) return setLogoutVisible(true);
    navigation.navigate('Login');
  };

  return (
    <>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.navigate('Start')}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go to home"
        >
          <Text style={styles.logo}>
            foody<Text style={styles.logoDot}>.</Text>
          </Text>
        </Pressable>
        <Pressable hitSlop={12} accessibilityRole="button" accessibilityLabel="User menu" onPress={onUserPress}>
          <SvgIcon source={require('../assets/person_icon.svg')} style={{ width: 26, height: 26 }} contentFit="contain" />
        </Pressable>
      </View>

      <Modal
        transparent
        visible={logoutVisible}
        animationType="fade"
        onRequestClose={() => setLogoutVisible(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setLogoutVisible(false)}>
          <Pressable style={styles.dialogCard} onPress={() => {}}>
            <Text style={[shared.typography.h2, styles.dialogTitle]}>Log out?</Text>
            <Text style={[shared.typography.body, styles.dialogMessage]}>Do you really want to log out?</Text>
            <View style={styles.dialogButtons}>
              <Pressable
                style={({ pressed }) => [styles.dialogBtn, styles.dialogBtnCancel, pressed && styles.dialogBtnPressed]}
                onPress={() => setLogoutVisible(false)}
              >
                <Text style={[shared.typography.sub2, styles.dialogBtnLabel]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.dialogBtn, styles.dialogBtnConfirm, pressed && styles.dialogBtnPressed]}
                onPress={() => { setLogoutVisible(false); signOut(); }}
              >
                <Text style={[shared.typography.sub2, styles.dialogBtnLabel, styles.dialogBtnLabelConfirm]}>Log out</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: colors.cream,
  },
  logo: {
    color: colors.text,
    fontSize: 24,
    fontWeight: 700,
  },
  logoDot: {
    color: colors.accent,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogCard: {
    width: '85%',
    backgroundColor: '#fff',
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
    backgroundColor: colors.accent,
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
    color: colors.text,
  },
});
