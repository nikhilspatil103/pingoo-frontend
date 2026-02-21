import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

let FastImage;
if (Platform.OS !== 'web') {
  FastImage = require('react-native-fast-image');
}

class MemoryManager {
  constructor() {
    this.cacheCleanupInterval = null;
  }

  // Clear image cache
  async clearImageCache() {
    if (Platform.OS !== 'web' && FastImage) {
      try {
        await FastImage.clearMemoryCache();
        await FastImage.clearDiskCache();
        console.log('Image cache cleared');
      } catch (error) {
        console.error('Error clearing image cache:', error);
      }
    }
  }

  // Start periodic cache cleanup (every 30 minutes)
  startPeriodicCleanup() {
    if (this.cacheCleanupInterval) return;

    this.cacheCleanupInterval = setInterval(() => {
      this.clearImageCache();
    }, 30 * 60 * 1000); // 30 minutes
  }

  // Stop periodic cleanup
  stopPeriodicCleanup() {
    if (this.cacheCleanupInterval) {
      clearInterval(this.cacheCleanupInterval);
      this.cacheCleanupInterval = null;
    }
  }

  // Clear old cached data from AsyncStorage
  async clearOldCache() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      
      for (const key of cacheKeys) {
        const item = await AsyncStorage.getItem(key);
        if (item) {
          const { timestamp } = JSON.parse(item);
          const now = Date.now();
          // Remove cache older than 24 hours
          if (now - timestamp > 24 * 60 * 60 * 1000) {
            await AsyncStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.error('Error clearing old cache:', error);
    }
  }

  // Clean up all resources
  async cleanup() {
    this.stopPeriodicCleanup();
    await this.clearImageCache();
    await this.clearOldCache();
  }
}

export default new MemoryManager();
