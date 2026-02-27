import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncLocationWithBackend } from '../utils/locationService';

export default function LocationSyncButton() {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Not logged in');
        return;
      }

      const success = await syncLocationWithBackend(token);
      if (success) {
        Alert.alert('Success', 'Location synced successfully!');
      } else {
        Alert.alert('Failed', 'Could not sync location. Check permissions.');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <TouchableOpacity 
      style={styles.button} 
      onPress={handleSync}
      disabled={syncing}
    >
      <Text style={styles.text}>
        {syncing ? 'Syncing...' : '📍 Update Location'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#F70776',
    padding: 12,
    borderRadius: 8,
    margin: 10,
  },
  text: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
