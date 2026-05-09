import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../providers/AuthProvider';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';

const TAB_INDEX = { home: 0, recipes: 1, calendar: 2 };
const TABS = [
  { label: 'Home',     key: 'home',     route: 'Start'    },
  { label: 'Recipes',  key: 'recipes',  route: 'Recipes'  },
  { label: 'Calendar', key: 'calendar', route: 'Calendar' },
];

export default function ScreenShell({ navigation, activeTab, hideTabBar, children }) {
  const insets = useSafeAreaInsets();
  const { session, signOut } = useAuth();
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [tabContainerWidth, setTabContainerWidth] = useState(0);
  const slideAnim = useRef(new Animated.Value(TAB_INDEX[activeTab] ?? 0)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: TAB_INDEX[activeTab] ?? 0,
      useNativeDriver: true,
      damping: 20,
      stiffness: 200,
    }).start();
  }, [activeTab]);

  const innerWidth = Math.max(tabContainerWidth - 6, 0);
  const tabWidth = innerWidth / 3;
  const indicatorTranslateX = slideAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0, tabWidth, 2 * tabWidth],
  });

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

      {!hideTabBar && (
        <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          <View
            style={styles.tabContainer}
            onLayout={(e) => setTabContainerWidth(e.nativeEvent.layout.width)}
          >
            <Animated.View
              style={[
                styles.activeIndicator,
                {
                  width: tabWidth,
                  transform: [{ translateX: indicatorTranslateX }],
                },
              ]}
            />
            {TABS.map(({ label, key, route }) => (
              <Pressable
                key={key}
                style={styles.tab}
                onPress={() => navigation.navigate(route)}
                accessibilityRole="button"
                accessibilityLabel={label}
              >
                <Text style={[styles.tabLabel, activeTab === key && styles.tabLabelActive]}>
                  {label}
                </Text>
              </Pressable>
            ))}
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
    paddingHorizontal: 18,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colors.cream,
  },
  tabContainer: {
    flex: 1,
    height: 50,
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 9999,
    padding: 3,
  },
  activeIndicator: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    left: 3,
    borderRadius: 9999,
    backgroundColor: colors.accent,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  tabLabelActive: {
    color: colors.white,
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
