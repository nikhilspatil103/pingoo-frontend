import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SocketService from '../services/SocketService';
import { API_URL } from '../config/urlConfig';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userData = await AsyncStorage.getItem('user');
      const savedApiUrl = await AsyncStorage.getItem('apiUrl');
      
      // Auto-logout if API URL changed
      if (savedApiUrl && savedApiUrl !== API_URL) {
        console.log('API URL changed, logging out...');
        await logout();
        return;
      }
      
      if (token && userData) {
        setUser(JSON.parse(userData));
        await AsyncStorage.setItem('apiUrl', API_URL);
      }
    } catch (error) {
      console.error('Error checking login status:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (userData, token) => {
    try {
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.setItem('userName', userData.name);
      await AsyncStorage.setItem('userEmail', userData.email);
      await AsyncStorage.setItem('apiUrl', API_URL);
      setUser(userData);
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };

  const logout = async () => {
    try {
      console.log('AuthContext - Logging out...');
      
      // Disconnect socket first to trigger offline status
      SocketService.disconnect();
      
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('userName');
      await AsyncStorage.removeItem('userEmail');
      await AsyncStorage.removeItem('userProfilePhoto');
      await AsyncStorage.removeItem('userCoins');
      console.log('AuthContext - Storage cleared');
      setUser(null);
      console.log('AuthContext - User set to null');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
