import { Animated, Easing } from 'react-native';

// Fade in + slide up (for screens/cards)
export const fadeInUp = (animValue, slideValue, delay = 0, duration = 400) => {
  animValue.setValue(0);
  slideValue.setValue(20);
  Animated.parallel([
    Animated.timing(animValue, { toValue: 1, duration, delay, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
    Animated.timing(slideValue, { toValue: 0, duration, delay, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
  ]).start();
};

// Scale bounce on press
export const pressIn = (scaleValue) => {
  Animated.spring(scaleValue, { toValue: 0.95, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
};

export const pressOut = (scaleValue) => {
  Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
};

// Staggered list item animation
export const staggeredFadeIn = (index) => {
  const opacity = new Animated.Value(0);
  const translateY = new Animated.Value(15);
  Animated.parallel([
    Animated.timing(opacity, { toValue: 1, duration: 350, delay: index * 60, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
    Animated.timing(translateY, { toValue: 0, duration: 350, delay: index * 60, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
  ]).start();
  return { opacity, translateY };
};

// Pulse animation (for online indicators, hearts)
export const pulse = (scaleValue, loop = true) => {
  const animation = Animated.loop(
    Animated.sequence([
      Animated.timing(scaleValue, { toValue: 1.2, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      Animated.timing(scaleValue, { toValue: 1, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
    ])
  );
  if (loop) animation.start();
  return animation;
};
