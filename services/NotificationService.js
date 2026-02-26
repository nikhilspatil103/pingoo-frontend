import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/urlConfig';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  async registerForPushNotifications() {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (!Device.isDevice) {
      const error = 'Must use physical device for Push Notifications';
      console.log(error);
      throw new Error(error);
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      const error = 'Permission not granted for push notifications';
      console.log(error);
      throw new Error(error);
    }
    
    try {
      // Use Expo's push token (not Firebase)
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: '6d2cee09-c9c3-4f0b-91ea-59e0aa10c5ec'
      })).data;
      console.log('✅ Push token obtained:', token);
      
      // Register token with backend
      await this.registerTokenWithBackend(token);
      return token;
    } catch (error) {
      console.error('❌ Error getting push token:', error);
      throw error;
    }
  }

  async registerTokenWithBackend(pushToken) {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.log('No auth token found for push notification registration');
        return;
      }
      
      const response = await fetch(`${API_URL}/register-push-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ pushToken }),
      });
      
      if (response.ok) {
        console.log('✅ Push token registered successfully');
      } else {
        const error = await response.text();
        console.log(`❌ Push token registration failed: ${response.status} - ${error}`);
      }
    } catch (error) {
      console.log('❌ Push token registration error:', error.message);
    }
  }

  addNotificationReceivedListener(callback) {
    return Notifications.addNotificationReceivedListener(callback);
  }

  addNotificationResponseReceivedListener(callback) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }
}

export default new NotificationService();
