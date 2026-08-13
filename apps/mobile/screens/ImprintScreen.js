import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import useBottomSheet from '../hooks/useBottomSheet';
import shared from '../sharedStyles';
import { colors } from '../theme';

export default function ImprintScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { backdropAnim, closeWithAnimation, panHandlers, sheetTransform, screenHeight } =
    useBottomSheet(navigation);
  const MAX_SHEET_H = Math.round(screenHeight * 0.85);

  return (
    <View style={styles.container}>
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: colors.backdrop, opacity: backdropAnim },
        ]}
      />
      <Pressable style={StyleSheet.absoluteFillObject} onPress={closeWithAnimation} />

      <Animated.View
        style={[
          shared.sheetAnchor,
          shared.sheetSurface,
          styles.sheetPadding,
          {
            maxHeight: MAX_SHEET_H,
            paddingBottom: insets.bottom + 16,
            transform: sheetTransform,
          },
        ]}
      >
        <View {...panHandlers} style={shared.dragHandleArea}>
          <View style={shared.dragHandle} />
        </View>

        <Text style={[shared.typography.h2, styles.title]}>Legal Notice</Text>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          alwaysBounceVertical={false}
          overScrollMode="never"
        >
          <Text style={[shared.typography.bodySmall, styles.intro]}>
            Information pursuant to § 5 DDG (German Digital Services Act)
          </Text>

          <View style={styles.block}>
            <Text style={[shared.typography.body, styles.line]}>Silas Knapp</Text>
            <Text style={[shared.typography.body, styles.line]}>Rosenweg 6/2</Text>
            <Text style={[shared.typography.body, styles.line]}>72581 Dettingen</Text>
            <Text style={[shared.typography.body, styles.line]}>Germany</Text>
          </View>

          <Text style={[shared.typography.sub1, styles.sectionHeading]}>Contact</Text>
          <Text style={[shared.typography.body, styles.line]}>Email: service@foodytheapp.com</Text>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sheetPadding: { paddingHorizontal: 18 },
  title: {
    color: colors.text,
    marginBottom: 14,
  },
  // shrink-only, so the sheet sizes to its content until maxHeight is hit
  scroll: { flexShrink: 1 },
  scrollContent: { paddingBottom: 8 },
  intro: {
    color: colors.textMuted,
    marginBottom: 16,
  },
  block: { marginBottom: 20 },
  line: { color: colors.text },
  sectionHeading: {
    color: colors.text,
    marginBottom: 2,
  },
});
