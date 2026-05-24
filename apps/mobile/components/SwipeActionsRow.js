import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeOut,
  LinearTransition,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme';

const SWIPE_COMMIT_RATIO = 0.6;
const SWIPE_HINT_RATIO = 0.3;
const ICON_SCALE_SMALL = 0.8;
const ICON_SCALE_LARGE = 1.15;
const trashIcon = require('../assets/trashcan_icon_white.svg');
const rescheduleIcon = require('../assets/reschedule_icon_white.svg');

function triggerHaptic() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export default function SwipeActionsRow({ children, onDelete, onReschedule, enabled = true, headerContent }) {
  const translateX = useSharedValue(0);
  const width = useSharedValue(0);
  const crossedThreshold = useSharedValue(0);

  const gesture = Gesture.Pan()
    .enabled(enabled)
    .activeOffsetX([-10, 10])
    .failOffsetY([-12, 12])
    .onUpdate(e => {
      translateX.value = e.translationX;
      const hintThreshold = width.value * SWIPE_HINT_RATIO;
      const absTx = Math.abs(e.translationX);
      if (absTx > hintThreshold && crossedThreshold.value === 0) {
        crossedThreshold.value = 1;
        runOnJS(triggerHaptic)();
      } else if (absTx < hintThreshold && crossedThreshold.value === 1) {
        crossedThreshold.value = 0;
      }
    })
    .onEnd(() => {
      crossedThreshold.value = 0;
      const threshold = width.value * SWIPE_COMMIT_RATIO;
      if (translateX.value > threshold && onDelete) {
        translateX.value = withTiming(width.value, { duration: 200 }, finished => {
          if (finished) runOnJS(onDelete)();
        });
      } else if (translateX.value < -threshold && onReschedule) {
        runOnJS(onReschedule)();
        translateX.value = withSpring(0, { damping: 18, stiffness: 180, overshootClamping: true });
      } else {
        translateX.value = withSpring(0, { damping: 18, stiffness: 180, overshootClamping: true });
      }
    });

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const redBarStyle = useAnimatedStyle(() => ({
    opacity: translateX.value > 0 ? 1 : 0,
  }));

  const greenBarStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < 0 ? 1 : 0,
  }));

  const trashIconStyle = useAnimatedStyle(() => {
    const hintThreshold = width.value * SWIPE_HINT_RATIO;
    const crossed = translateX.value > hintThreshold;
    const scale = crossed
      ? ICON_SCALE_LARGE
      : withSpring(ICON_SCALE_SMALL, { damping: 12, stiffness: 200 });
    return { transform: [{ scale }] };
  });

  const rescheduleIconStyle = useAnimatedStyle(() => {
    const hintThreshold = width.value * SWIPE_HINT_RATIO;
    const crossed = -translateX.value > hintThreshold;
    const scale = crossed
      ? ICON_SCALE_LARGE
      : withSpring(ICON_SCALE_SMALL, { damping: 12, stiffness: 200 });
    return { transform: [{ scale }] };
  });

  return (
    <Animated.View
      style={styles.container}
      onLayout={e => { width.value = e.nativeEvent.layout.width; }}
      exiting={FadeOut.duration(180)}
      layout={LinearTransition.duration(220)}
    >
      {headerContent}
      <View style={styles.entryWrapper}>
        <Animated.View style={[styles.redBar, redBarStyle]} pointerEvents="none">
          <Animated.View style={trashIconStyle}>
            <Image source={trashIcon} style={styles.icon} contentFit="contain" />
          </Animated.View>
        </Animated.View>
        <Animated.View style={[styles.greenBar, greenBarStyle]} pointerEvents="none">
          <Animated.View style={rescheduleIconStyle}>
            <Image source={rescheduleIcon} style={styles.icon} contentFit="contain" />
          </Animated.View>
        </Animated.View>
        <GestureDetector gesture={gesture}>
          <Animated.View style={rowStyle}>{children}</Animated.View>
        </GestureDetector>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  entryWrapper: {
    position: 'relative',
  },
  redBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 10,
    backgroundColor: colors.danger,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 24,
  },
  greenBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 10,
    backgroundColor: colors.accent,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 24,
  },
  icon: {
    width: 28,
    height: 28,
  },
});
