import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, StatusBar, Animated, Easing, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { API_URL } from '../config/urlConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Circle, G, Text as SvgText } from 'react-native-svg';

export default function SpinWheelScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const [spinning, setSpinning] = useState(false);
  const [coins, setCoins] = useState(0);
  const [canSpin, setCanSpin] = useState(true);
  const [timeLeft, setTimeLeft] = useState('');
  const [nextSpinTime, setNextSpinTime] = useState(null);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const styles = getStyles(theme, isDark);

  const segments = [10, 20, 10, 30, 10, 20, 10, 50];
  const segmentAngle = 360 / segments.length;

  useEffect(() => {
    fetchCoins();
    checkSpinAvailability();
  }, []);

  useEffect(() => {
    if (!canSpin && nextSpinTime) {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const distance = nextSpinTime - now;

        if (distance < 0) {
          setCanSpin(true);
          setTimeLeft('');
          clearInterval(interval);
        } else {
          const hours = Math.floor(distance / (1000 * 60 * 60));
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((distance % (1000 * 60)) / 1000);
          setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [canSpin, nextSpinTime]);

  const fetchCoins = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/coins`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCoins(data.coins);
      }
    } catch (error) {
      console.error('Error fetching coins:', error);
    }
  };

  const checkSpinAvailability = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/spin-availability`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCanSpin(data.canSpin);
        if (!data.canSpin && data.nextSpinTime) {
          setNextSpinTime(new Date(data.nextSpinTime).getTime());
        }
      }
    } catch (error) {
      console.error('Error checking spin availability:', error);
    }
  };

  const spinWheel = async () => {
    if (spinning || !canSpin) return;

    setSpinning(true);

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/spin-wheel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const wonCoins = data.coins;
        const winningIndex = data.segmentIndex;
        
        const extraSpins = 5;
        const targetAngle = (360 * extraSpins) - (winningIndex * segmentAngle) - (segmentAngle / 2);
        
        rotateAnim.setValue(0);
        
        Animated.timing(rotateAnim, {
          toValue: targetAngle,
          duration: 4000,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true
        }).start(() => {
          setSpinning(false);
          setCoins(data.totalCoins);
          setCanSpin(false);
          setNextSpinTime(new Date(data.nextSpinTime).getTime());
          Alert.alert('🎉 Congratulations!', `You won ${wonCoins} coins!`);
        });
      } else {
        const error = await response.json();
        Alert.alert('Error', error.error || 'Failed to spin');
        setSpinning(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to spin wheel');
      setSpinning(false);
    }
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg']
  });

  const getSegmentColor = (index) => {
    const colors = ['#FF6B9D', '#FFD93D', '#6BCF7F', '#4ECDC4', '#FF6B9D', '#FFD93D', '#6BCF7F', '#9B59B6'];
    return colors[index];
  };

  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = (angleInDegrees) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  const describeArc = (x, y, radius, startAngle, endAngle) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
      "M", x, y,
      "L", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      "Z"
    ].join(" ");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <LinearGradient
        colors={isDark ? ['#1a0a2e', '#16213e', '#0f3460'] : ['#ffeef8', '#e8d5f2', '#d4e4f7']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Spin & Win</Text>
          <View style={styles.coinBadge}>
            <Text style={styles.coinText}>💰 {coins}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Spin the Wheel!</Text>
          <Text style={styles.subtitle}>Win up to 50 coins</Text>

          <View style={styles.wheelContainer}>
            <View style={styles.pointer}>
              <View style={styles.pointerTriangle} />
            </View>

            <Animated.View style={[styles.wheel, { transform: [{ rotate }] }]}>
              <Svg width={300} height={300} viewBox="0 0 300 300">
                <G>
                  {segments.map((value, index) => {
                    const startAngle = index * segmentAngle - 90;
                    const endAngle = startAngle + segmentAngle;
                    const path = describeArc(150, 150, 140, startAngle, endAngle);
                    const textAngle = startAngle + segmentAngle / 2;
                    const textPos = polarToCartesian(150, 150, 90, textAngle);

                    return (
                      <G key={index}>
                        <Path d={path} fill={getSegmentColor(index)} stroke="#fff" strokeWidth="2" />
                        <SvgText
                          x={textPos.x}
                          y={textPos.y}
                          fill="#fff"
                          fontSize="24"
                          fontWeight="bold"
                          textAnchor="middle"
                          alignmentBaseline="middle"
                          rotation={textAngle + 90}
                          origin={`${textPos.x}, ${textPos.y}`}
                        >
                          {value}
                        </SvgText>
                      </G>
                    );
                  })}
                  <Circle cx="150" cy="150" r="30" fill="#fff" />
                  <Circle cx="150" cy="150" r="20" fill={isDark ? '#1a0a2e' : '#FF6B9D'} />
                </G>
              </Svg>
            </Animated.View>
          </View>

          <TouchableOpacity
            onPress={spinWheel}
            disabled={spinning || !canSpin}
            style={[styles.spinButton, (spinning || !canSpin) && styles.spinButtonDisabled]}
          >
            <LinearGradient
              colors={spinning || !canSpin ? ['#999', '#666'] : ['#FF6B9D', '#F70776']}
              style={styles.spinButtonGradient}
            >
              <Text style={styles.spinButtonText}>
                {spinning ? 'SPINNING...' : !canSpin ? '⏰ LOCKED' : 'SPIN NOW'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {!canSpin && timeLeft ? (
            <View style={styles.countdownContainer}>
              <Text style={styles.countdownTitle}>Next Spin Available In</Text>
              <View style={styles.countdownBox}>
                <Text style={styles.countdownTime}>{timeLeft}</Text>
              </View>
              <Text style={styles.countdownSubtext}>Come back to win more coins!</Text>
            </View>
          ) : (
            <Text style={styles.infoText}>
              {canSpin ? '🎁 Free spin available!' : '⏰ Check back soon'}
            </Text>
          )}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const getStyles = (theme, isDark) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDark ? '#1a0a2e' : '#ffeef8' },
  gradient: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
  },
  backIcon: { fontSize: 24, color: theme.text },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: theme.text },
  coinBadge: {
    backgroundColor: '#FFD93D',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20
  },
  coinText: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: theme.text, marginBottom: 8 },
  subtitle: { fontSize: 18, color: theme.textSecondary, marginBottom: 40 },
  wheelContainer: {
    width: 320,
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40
  },
  pointer: {
    position: 'absolute',
    top: -10,
    zIndex: 10,
    alignItems: 'center'
  },
  pointerTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 15,
    borderRightWidth: 15,
    borderTopWidth: 30,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FF6B9D'
  },
  wheel: {
    width: 300,
    height: 300,
    borderRadius: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  spinButton: {
    width: 200,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 20
  },
  spinButtonDisabled: { opacity: 0.6 },
  spinButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  spinButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff'
  },
  infoText: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center'
  },
  countdownContainer: {
    alignItems: 'center',
    marginTop: 10,
    padding: 20,
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    borderRadius: 20,
    width: '100%'
  },
  countdownTitle: {
    fontSize: 16,
    color: theme.textSecondary,
    marginBottom: 12,
    fontWeight: '600'
  },
  countdownBox: {
    backgroundColor: isDark ? '#2a2440' : '#fff',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 15,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#FF6B9D',
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5
  },
  countdownTime: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF6B9D',
    letterSpacing: 2
  },
  countdownSubtext: {
    fontSize: 13,
    color: theme.textSecondary,
    fontStyle: 'italic'
  }
});
