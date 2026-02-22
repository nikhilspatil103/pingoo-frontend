import React, { useState } from 'react';
import { View, Text, StyleSheet, PanResponder, Animated } from 'react-native';

export default function RangeSlider({ min, max, low, high, onValueChanged, theme, isDark }) {
  const [minValue, setMinValue] = useState(low);
  const [maxValue, setMaxValue] = useState(high);
  const [sliderWidth, setSliderWidth] = useState(0);

  const minPan = new Animated.Value(0);
  const maxPan = new Animated.Value(0);

  const minPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gesture) => {
      const newValue = Math.round(min + (gesture.moveX / sliderWidth) * (max - min));
      if (newValue >= min && newValue < maxValue - 1) {
        setMinValue(newValue);
        onValueChanged(newValue, maxValue);
      }
    },
  });

  const maxPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gesture) => {
      const newValue = Math.round(min + (gesture.moveX / sliderWidth) * (max - min));
      if (newValue <= max && newValue > minValue + 1) {
        setMaxValue(newValue);
        onValueChanged(minValue, newValue);
      }
    },
  });

  const minPosition = ((minValue - min) / (max - min)) * 100;
  const maxPosition = ((maxValue - min) / (max - min)) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={[styles.label, { color: theme.text }]}>{minValue}</Text>
        <Text style={[styles.label, { color: theme.text }]}>{maxValue}</Text>
      </View>
      <View 
        style={styles.sliderContainer}
        onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
      >
        <View style={[styles.rail, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }]} />
        <View 
          style={[
            styles.railSelected, 
            { left: `${minPosition}%`, width: `${maxPosition - minPosition}%` }
          ]} 
        />
        <Animated.View
          {...minPanResponder.panHandlers}
          style={[styles.thumb, { left: `${minPosition}%` }]}
        />
        <Animated.View
          {...maxPanResponder.panHandlers}
          style={[styles.thumb, { left: `${maxPosition}%` }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 20 },
  labelContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, paddingHorizontal: 10 },
  label: { fontSize: 16, fontWeight: '600' },
  sliderContainer: { height: 40, justifyContent: 'center', position: 'relative' },
  rail: { height: 4, borderRadius: 2, width: '100%' },
  railSelected: { position: 'absolute', height: 4, backgroundColor: '#FF6B9D', borderRadius: 2 },
  thumb: { position: 'absolute', width: 24, height: 24, borderRadius: 12, backgroundColor: '#FF6B9D', borderWidth: 3, borderColor: '#fff', marginLeft: -12, marginTop: -10 },
});
