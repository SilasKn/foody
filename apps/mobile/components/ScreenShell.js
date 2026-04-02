import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

export default function ScreenShell({ navigation, title, activeTab }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.navigate('Start')}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go to home"
        >
          <Text style={styles.logo}>foody.</Text>
        </Pressable>
        <Pressable hitSlop={12} accessibilityRole="button">
          <Ionicons name="person-outline" size={26} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.tabBar}>
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
  body: {
    flex: 1,
    backgroundColor: colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: colors.headerBg,
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
});
