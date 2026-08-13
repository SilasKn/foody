import { useEffect, useRef } from 'react';
import { Animated, Dimensions, PanResponder } from 'react-native';

// Shared open/close/drag behaviour for the app's bottom sheets.
// Compose the returned values with shared.sheetAnchor / shared.sheetSurface.
export default function useBottomSheet(navigation) {
  const SCREEN_H = Dimensions.get('screen').height;

  const backdropAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const translateY = useRef(Animated.add(slideAnim, dragY)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(backdropAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 25, stiffness: 200 }),
    ]).start();
  }, []);

  const closeWithAnimation = () => {
    Animated.parallel([
      Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: SCREEN_H, duration: 220, useNativeDriver: true }),
    ]).start(() => {
      navigation.goBack();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 6 && gs.dy > Math.abs(gs.dx),
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) dragY.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 120 || gs.vy > 0.6) {
          Animated.parallel([
            Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
            Animated.timing(dragY, { toValue: SCREEN_H, duration: 220, useNativeDriver: true }),
          ]).start(() => navigation.goBack());
        } else {
          Animated.spring(dragY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 20,
            stiffness: 200,
          }).start();
        }
      },
    })
  ).current;

  return {
    backdropAnim,
    closeWithAnimation,
    panHandlers: panResponder.panHandlers,
    sheetTransform: [{ translateY }],
    screenHeight: SCREEN_H,
  };
}
