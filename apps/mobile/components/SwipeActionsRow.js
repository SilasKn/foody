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
import { colors } from '../theme';

const SWIPE_COMMIT_RATIO = 0.6;
const trashIcon = require('../assets/trashcan_icon_white.svg');
const rescheduleIcon = require('../assets/reschedule_icon_white.svg');

export default function SwipeActionsRow({ children, onDelete, onReschedule, enabled = true, headerContent }) {
  const translateX = useSharedValue(0);
  const width = useSharedValue(0);

  const gesture = Gesture.Pan()
    .enabled(enabled)
    .activeOffsetX([-10, 10])
    .failOffsetY([-12, 12])
    .onUpdate(e => {
      translateX.value = e.translationX;
    })
    .onEnd(() => {
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
          <Image source={trashIcon} style={styles.icon} contentFit="contain" />
        </Animated.View>
        <Animated.View style={[styles.greenBar, greenBarStyle]} pointerEvents="none">
          <Image source={rescheduleIcon} style={styles.icon} contentFit="contain" />
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
