import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import shared from '../sharedStyles';

const TABS = [
  {
    label: 'Home',
    key: 'home',
    route: 'Start',
    iconActive:   require('../assets/navbar/home_icon_green.png'),
    iconInactive: require('../assets/navbar/home_icon_black.png'),
  },
  {
    label: 'Recipes',
    key: 'recipes',
    route: 'Recipes',
    iconActive:   require('../assets/navbar/recipe_icon_green.png'),
    iconInactive: require('../assets/navbar/recipe_icon_black.png'),
  },
  {
    label: 'Calendar',
    key: 'calendar',
    route: 'Calendar',
    iconActive:   require('../assets/navbar/calendar-icon_green.png'),
    iconInactive: require('../assets/navbar/calendar-icon_black.png'),
  },
];

export default function ScreenShell({ navigation, activeTab, hideTabBar, children }) {
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
          <Text style={[styles.logo]}>
            foody<Text style={styles.logoDot}>.</Text>
          </Text>
        </Pressable>
        <Pressable hitSlop={12} accessibilityRole="button" accessibilityLabel="User menu" onPress={onUserPress}>
          <Ionicons name="person-outline" size={26} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.body}>{children}</View>

      {!hideTabBar && (
        <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          <View style={styles.tabContainer}>
            {TABS.map(({ label, key, route, iconActive, iconInactive }) => {
              const isActive = activeTab === key;
              return (
                <Pressable
                  key={key}
                  style={styles.tab}
                  onPress={() => navigation.navigate(route)}
                  accessibilityRole="button"
                  accessibilityLabel={label}
                >
                  <Image
                    source={isActive ? iconActive : iconInactive}
                    style={styles.tabIcon}
                    resizeMode="contain"
                  />
                  <Text
                    style={[
                      shared.typography.sub2,
                      styles.tabLabel,
                      isActive && styles.tabLabelActive,
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: colors.cream,
  },
  logo: {
    color: colors.text,
    fontSize: 24,
    fontWeight: 700
  },
  logoDot: {
    color: colors.accent,
  },
  body: {
    flex: 1,
    backgroundColor: colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: colors.cream,
  },
  tabContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabIcon: {
    width: 22,
    height: 22,
  },
  tabLabel: {
    color: colors.text,
    fontSize: 12,
    lineHeight: 16,
  },
  tabLabelActive: {
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
