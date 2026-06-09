import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Expanded mood emoji sets — multiple emojis per mood for variety
const MOOD_EMOJIS = {
  happy: ['😊', '😄', '🌟', '✨', '💫'],
  vibing: ['😎', '🎶', '🎧', '💜', '🪩'],
  romantic: ['🥰', '💕', '💗', '🌹', '💋'],
  sad: ['😢', '🥺', '💧', '🌧️', '💔'],
  crazy: ['🤪', '🤯', '⚡', '🫨', '🎪'],
  bored: ['😴', '🥱', '💤', '😑', '🫠'],
  excited: ['🔥', '🚀', '⚡', '🤩', '💥'],
  chill: ['🧘', '☁️', '🍃', '🌊', '😌'],
  motivated: ['💪', '🏆', '👑', '⭐', '🎯'],
  party: ['🎉', '🥳', '🪅', '🍾', '🎊'],
};

// Single floating emoji with animation
const FloatingEmoji = ({ emoji, delay, startX, duration, size }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.3)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      translateY.setValue(0);
      opacity.setValue(0);
      scale.setValue(0.3);
      rotate.setValue(0);

      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(translateY, { toValue: -120, duration, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
          Animated.sequence([
            Animated.timing(opacity, { toValue: 1, duration: duration * 0.2, useNativeDriver: true }),
            Animated.delay(duration * 0.5),
            Animated.timing(opacity, { toValue: 0, duration: duration * 0.3, useNativeDriver: true }),
          ]),
          Animated.timing(scale, { toValue: 1, duration: duration * 0.4, useNativeDriver: true, easing: Easing.out(Easing.back(2)) }),
          Animated.timing(rotate, { toValue: 1, duration, useNativeDriver: true }),
        ]),
      ]).start(() => animate());
    };
    animate();
  }, []);

  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['-15deg', '15deg'] });

  return (
    <Animated.View style={[styles.floatingEmoji, {
      left: startX,
      transform: [{ translateY }, { scale }, { rotate: spin }],
      opacity,
    }]}>
      <Text style={{ fontSize: size }}>{emoji}</Text>
    </Animated.View>
  );
};

// Pulsing main emoji badge
const PulsingBadge = ({ emoji }) => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.2, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(scale, { toValue: 1, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.badge, { transform: [{ scale }] }]}>
      <Text style={styles.badgeEmoji}>{emoji}</Text>
    </Animated.View>
  );
};

// Main overlay component
export function MoodEmojiOverlay({ mood, size = 36 }) {
  const emojis = MOOD_EMOJIS[mood] || MOOD_EMOJIS.happy;
  const mainEmoji = emojis[0];

  return (
    <View style={styles.overlayContainer}>
      <PulsingBadge emoji={mainEmoji} />
      {emojis.slice(1, 4).map((emoji, i) => (
        <FloatingEmoji
          key={`${mood}-${i}`}
          emoji={emoji}
          delay={i * 1200}
          startX={10 + i * 16}
          duration={2500 + i * 400}
          size={18 + Math.random() * 6}
        />
      ))}
    </View>
  );
}

// Simple static emoji (for mood picker / labels)
export function MoodEmoji({ mood, size = 24 }) {
  const emojis = MOOD_EMOJIS[mood] || MOOD_EMOJIS.happy;
  return <Text style={{ fontSize: size }}>{emojis[0]}</Text>;
}

// Mood label with emoji
export function MoodLabel({ mood, style }) {
  const emojis = MOOD_EMOJIS[mood] || MOOD_EMOJIS.happy;
  return (
    <View style={[styles.labelContainer, style]}>
      <Text style={styles.labelEmoji}>{emojis[0]}</Text>
      <Text style={styles.labelText}>{mood}</Text>
    </View>
  );
}

export { MOOD_EMOJIS };

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    top: 80,
    left: 16,
    zIndex: 5,
    width: 80,
    height: 160,
  },
  badge: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 22,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  badgeEmoji: {
    fontSize: 24,
  },
  floatingEmoji: {
    position: 'absolute',
    top: 50,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  labelEmoji: {
    fontSize: 14,
  },
  labelText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
