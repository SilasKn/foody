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

export default function SwipeToDeleteRow({ children, onDelete, enabled = true }) {
  const translateX = useSharedValue(0);
  const width = useSharedValue(0);

  const gesture = Gesture.Pan()
    .enabled(enabled)
    .activeOffsetX([-9999, 10])
    .failOffsetY([-12, 12])
    .onUpdate(e => {
      translateX.value = Math.max(0, e.translationX);
    })
    .onEnd(() => {
      if (translateX.value > width.value * SWIPE_COMMIT_RATIO) {
        translateX.value = withTiming(width.value, { duration: 200 }, finished => {
          if (finished) runOnJS(onDelete)();
        });
      } else {
        translateX.value = withSpring(0, { damping: 18, stiffness: 180 });
      }
    });

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View
      style={styles.container}
      onLayout={e => { width.value = e.nativeEvent.layout.width; }}
      exiting={FadeOut.duration(180)}
      layout={LinearTransition.duration(220)}
    >
      <View style={styles.redBar} pointerEvents="none">
        <Image source={trashIcon} style={styles.icon} contentFit="contain" />
      </View>
      <GestureDetector gesture={gesture}>
        <Animated.View style={rowStyle}>{children}</Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
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
    paddingLeft: 24,
  },
  icon: {
    width: 28,
    height: 28,
  },
});
