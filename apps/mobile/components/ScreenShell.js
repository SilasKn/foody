import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';

function TabPill({ label, active, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        active ? styles.pillActive : styles.pillInactive,
        pressed && styles.pillPressed,
      ]}
    >
      <Text style={styles.pillLabel}>{label}</Text>
    </Pressable>
  );
}

export default function ScreenShell({ navigation, activeTab, children }) {
  const insets = useSafeAreaInsets();
  const { session, signOut } = useAuth();
  const [logoutVisible, setLogoutVisible] = useState(false);

  const onUserPress = () => {
    if (session) return setLogoutVisible(true);
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
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
          <Ionicons name="person-outline" size={26} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.body}>{children}</View>

      <View
        style={[
          styles.tabBar,
          { paddingBottom: Math.max(insets.bottom, 8) },
        ]}
      >
        <TabPill
          label="Home"
          active={activeTab === 'home'}
          onPress={() => navigation.navigate('Start')}
        />
        <TabPill
          label="Recipes"
          active={activeTab === 'recipes'}
          onPress={() => navigation.navigate('Recipes')}
        />
        <TabPill
          label="Calendar"
          active={activeTab === 'calendar'}
          onPress={() => navigation.navigate('Calendar')}
        />
      </View>

      <Modal
        transparent
        visible={logoutVisible}
        animationType="fade"
        onRequestClose={() => setLogoutVisible(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setLogoutVisible(false)}>
          <Pressable style={styles.dialogCard} onPress={() => {}}>
            <Text style={styles.dialogTitle}>Log out?</Text>
            <Text style={styles.dialogMessage}>Do you really want to log out?</Text>
            <View style={styles.dialogButtons}>
              <Pressable
                style={({ pressed }) => [styles.dialogBtn, styles.dialogBtnCancel, pressed && styles.dialogBtnPressed]}
                onPress={() => setLogoutVisible(false)}
              >
                <Text style={styles.dialogBtnLabel}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.dialogBtn, styles.dialogBtnConfirm, pressed && styles.dialogBtnPressed]}
                onPress={() => { setLogoutVisible(false); signOut(); }}
              >
                <Text style={[styles.dialogBtnLabel, styles.dialogBtnLabelConfirm]}>Log out</Text>
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
    backgroundColor: colors.headerBg,
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
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  logoDot: {
    color: colors.accent,
  },
  body: {
    flex: 1,
    backgroundColor: colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 12,
    backgroundColor: colors.cream,
    gap: 6,
  },
  pill: {
    flex: 1,
    borderRadius: 9999,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
    minWidth: 0,
  },
  pillInactive: {
    backgroundColor: colors.pillInactive,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: {
    backgroundColor: colors.pillActive,
    borderWidth: 2,
    borderColor: colors.border,
  },
  pillPressed: {
    opacity: 0.85,
  },
  pillLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
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
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  dialogMessage: {
    fontSize: 15,
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
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  dialogBtnLabelConfirm: {
    color: colors.text,
  },
});
