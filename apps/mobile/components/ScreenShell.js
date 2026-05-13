import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import shared from '../sharedStyles';

const TABS = [
  {
    label: 'Home',
    key: 'home',
    route: 'Start',
    iconActive:   require('../assets/navbar/home_icon_green.svg'),
    iconInactive: require('../assets/navbar/home_icon_black.svg'),
  },
  {
    label: 'Recipes',
    key: 'recipes',
    route: 'Recipes',
    iconActive:   require('../assets/navbar/recipe_icon_green.svg'),
    iconInactive: require('../assets/navbar/recipe_icon_black.svg'),
  },
  {
    label: 'Calendar',
    key: 'calendar',
    route: 'Calendar',
    iconActive:   require('../assets/navbar/calendar_icon_green.svg'),
    iconInactive: require('../assets/navbar/calendar_icon_black.svg'),
  },
];

export default function ScreenShell({ navigation, activeTab, hideTabBar, children }) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
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
                    contentFit="contain"
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

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.cream,
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
});
