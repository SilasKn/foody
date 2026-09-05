import { useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image as SvgIcon } from 'expo-image';
import { useAuth } from '../providers/AuthProvider';
import shared from '../sharedStyles';
import { colors } from '../theme';

export default function AppHeader({ navigation }) {
  const { session, signOut } = useAuth();
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [iconRect, setIconRect] = useState(null);
  const iconRef = useRef(null);

  const onUserPress = () => {
    if (dropdownVisible) {
      setDropdownVisible(false);
      return;
    }
    iconRef.current?.measureInWindow((x, y, width, height) => {
      setIconRect({ x, y, width, height });
      setDropdownVisible(true);
    });
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
        <Pressable ref={iconRef} hitSlop={12} accessibilityRole="button" accessibilityLabel="User menu" onPress={onUserPress}>
          <SvgIcon source={require('../assets/person_icon.svg')} style={{ width: 26, height: 26 }} contentFit="contain" />
        </Pressable>
      </View>

      {dropdownVisible && (
        <Modal
          transparent
          visible
          animationType="none"
          onRequestClose={() => setDropdownVisible(false)}
        >
          <Pressable style={styles.backdrop} onPress={() => setDropdownVisible(false)}>
            <View
              style={[
                styles.dropdown,
                iconRect && { top: iconRect.y + iconRect.height + 6 },
              ]}
            >
              {session ? (
                <>
                  <Pressable
                    style={({ pressed }) => [styles.dropdownRow, pressed && styles.pressed]}
                    onPress={() => { setDropdownVisible(false); navigation.navigate('Settings'); }}
                  >
                    <SvgIcon source={require('../assets/settings_icon.svg')} style={styles.dropdownIcon} contentFit="contain" />
                    <Text style={[shared.typography.body, styles.dropdownLabel]}>Settings</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.dropdownRow, pressed && styles.pressed]}
                    onPress={() => { setDropdownVisible(false); signOut(); }}
                  >
                    <SvgIcon source={require('../assets/logout_icon.svg')} style={styles.dropdownIcon} contentFit="contain" />
                    <Text style={[shared.typography.body, styles.dropdownLabel]}>Logout</Text>
                  </Pressable>
                </>
              ) : (
                <Pressable
                  style={({ pressed }) => [styles.dropdownRow, pressed && styles.pressed]}
                  onPress={() => { setDropdownVisible(false); navigation.navigate('Login'); }}
                >
                  <SvgIcon source={require('../assets/login_icon.svg')} style={styles.dropdownIcon} contentFit="contain" />
                  <Text style={[shared.typography.body, styles.dropdownLabel]}>Login</Text>
                </Pressable>
              )}
            </View>
          </Pressable>
        </Modal>
      )}
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
    fontFamily: 'Poppins-Bold',
  },
  logoDot: {
    color: colors.accent,
  },
  backdrop: {
    flex: 1,
  },
  dropdown: {
    position: 'absolute',
    top: 80,
    right: 18,
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingVertical: 4,
    minWidth: 150,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  dropdownIcon: {
    width: 20,
    height: 20,
  },
  dropdownLabel: {
    color: colors.text,
  },
  pressed: {
    opacity: 0.85,
  },
});
