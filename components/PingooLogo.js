import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function PingooLogo({ size = 80, animated = false }) {
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (animated) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [animated]);

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: pulseAnim }] }]}>
      <LinearGradient
        colors={['#F70776', '#FF6B9D', '#FF88C5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.logoCircle, { width: size, height: size, borderRadius: size / 2 }]}
      >
        <View style={styles.pingIcon}>
          <View style={[styles.dot, { width: size * 0.15, height: size * 0.15, borderRadius: size * 0.075 }]} />
          <View style={[styles.wave, { width: size * 0.4, height: size * 0.4, borderRadius: size * 0.2, borderWidth: size * 0.04 }]} />
          <View style={[styles.wave, styles.wave2, { width: size * 0.6, height: size * 0.6, borderRadius: size * 0.3, borderWidth: size * 0.03 }]} />
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F70776',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  pingIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    backgroundColor: '#fff',
    position: 'absolute',
  },
  wave: {
    borderColor: 'rgba(255,255,255,0.4)',
    position: 'absolute',
  },
  wave2: {
    borderColor: 'rgba(255,255,255,0.2)',
  },
});
