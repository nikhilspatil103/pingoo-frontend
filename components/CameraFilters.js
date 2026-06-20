import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

export const FILTERS = [
  { id: 'normal', name: 'Normal', matrix: null },
  { id: 'warm', name: 'Warm', overlay: 'rgba(255, 166, 43, 0.15)' },
  { id: 'cool', name: 'Cool', overlay: 'rgba(59, 130, 246, 0.15)' },
  { id: 'vintage', name: 'Vintage', overlay: 'rgba(184, 135, 81, 0.2)' },
  { id: 'fade', name: 'Fade', overlay: 'rgba(255, 255, 255, 0.2)' },
  { id: 'pink', name: 'Pink', overlay: 'rgba(255, 105, 180, 0.12)' },
  { id: 'noir', name: 'Noir', overlay: 'rgba(0, 0, 0, 0.3)' },
  { id: 'golden', name: 'Golden', overlay: 'rgba(255, 215, 0, 0.12)' },
  { id: 'emerald', name: 'Emerald', overlay: 'rgba(16, 185, 129, 0.12)' },
  { id: 'purple', name: 'Purple', overlay: 'rgba(139, 92, 246, 0.15)' },
  { id: 'sunset', name: 'Sunset', overlay: 'rgba(251, 146, 60, 0.18)' },
  { id: 'midnight', name: 'Midnight', overlay: 'rgba(30, 27, 75, 0.25)' },
];

export default function FilterSelector({ selectedFilter, onSelectFilter }) {
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {FILTERS.map(filter => (
          <TouchableOpacity
            key={filter.id}
            style={[styles.filterItem, selectedFilter === filter.id && styles.filterActive]}
            onPress={() => onSelectFilter(filter.id)}
          >
            <View style={[styles.filterPreview, { backgroundColor: filter.overlay || '#333' }]}>
              {!filter.overlay && <Text style={styles.noFilter}>✓</Text>}
            </View>
            <Text style={[styles.filterName, selectedFilter === filter.id && styles.filterNameActive]}>
              {filter.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 12 },
  scroll: { paddingHorizontal: 16, gap: 12 },
  filterItem: { alignItems: 'center', gap: 6 },
  filterActive: { transform: [{ scale: 1.1 }] },
  filterPreview: {
    width: 56, height: 56, borderRadius: 28,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center', alignItems: 'center',
  },
  noFilter: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  filterName: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '500' },
  filterNameActive: { color: '#fff', fontWeight: '700' },
});
