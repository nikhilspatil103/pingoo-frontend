import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';

export default function LocationPicker({ onLocationSelect, theme, isDark }) {
  const [searchText, setSearchText] = useState('');

  const searchLocation = async () => {
    if (!searchText.trim()) {
      Alert.alert('Error', 'Please enter a location to search');
      return;
    }

    // Simple manual location selection
    onLocationSelect({
      location: searchText.trim(),
      latitude: null,
      longitude: null
    });
  };

  const styles = getStyles(theme, isDark);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Your Location</Text>
      
      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Enter your city name (e.g., Mumbai, Delhi, Pune)"
          placeholderTextColor={theme.textSecondary}
          autoFocus
        />
        <TouchableOpacity 
          style={styles.searchBtn} 
          onPress={searchLocation}
        >
          <Text style={styles.searchBtnText}>Save Location</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getStyles = (theme, isDark) => StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  searchSection: {
    marginBottom: 20,
  },
  searchInput: {
    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#f8f8f8',
    color: theme.text,
    padding: 16,
    borderRadius: 14,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
  },
  searchBtn: {
    backgroundColor: '#FF6B9D',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  searchBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});