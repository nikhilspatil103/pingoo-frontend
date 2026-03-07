import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/urlConfig';

export const requestLocationPermission = async () => {
  try {
    console.log('Requesting location permission...');
    const { status } = await Location.requestForegroundPermissionsAsync();
    console.log('Location permission status:', status);
    
    // Check if permission was granted or already granted
    if (status === 'granted') {
      return true;
    }
    
    // If denied, check current status one more time
    const { status: currentStatus } = await Location.getForegroundPermissionsAsync();
    console.log('Current location permission status:', currentStatus);
    return currentStatus === 'granted';
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
};

export const getCurrentLocation = async () => {
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      timeout: 10000,
    });

    const coords = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };

    await AsyncStorage.setItem('userLocation', JSON.stringify(coords));
    return coords;
  } catch (error) {
    console.error('Error getting location:', error);
    return null;
  }
};

export const syncLocationWithBackend = async (token) => {
  try {
    const location = await getCurrentLocation();
    if (!location) {
      console.log('⚠️ Location permission denied or unavailable');
      return false;
    }

    const response = await fetch(`${API_URL}/location`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        latitude: location.latitude,
        longitude: location.longitude,
        location: 'Current Location',
      }),
    });

    if (response.ok) {
      console.log('✅ Location synced with backend successfully');
      return true;
    } else {
      const error = await response.json();
      console.log('❌ Location sync failed:', error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error syncing location:', error);
    return false;
  }
};

export const getStoredLocation = async () => {
  const stored = await AsyncStorage.getItem('userLocation');
  return stored ? JSON.parse(stored) : null;
};

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const formatDistance = (km) => {
  if (km < 1) return `${(km).toFixed(1)}km away`;
  if (km < 10) return `${km.toFixed(1)}km away`;
  return `${Math.round(km)}km away`;
};