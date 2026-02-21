import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { API_URL } from '../config/urlConfig';
import SocketService from '../services/SocketService';
import { useAuth } from './AuthContext';

const UnreadContext = createContext();

export const useUnread = () => {
  const context = useContext(UnreadContext);
  if (!context) {
    throw new Error('useUnread must be used within UnreadProvider');
  }
  return context;
};

export const UnreadProvider = ({ children }) => {
  const [totalUnread, setTotalUnread] = useState(0);
  const [activeChatUserId, setActiveChatUserId] = useState(null);
  const [isOnChatListScreen, setIsOnChatListScreen] = useState(false);
  const [isOnChatScreen, setIsOnChatScreen] = useState(false);
  const { user } = useAuth();

  const fetchUnreadCount = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_URL}/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const total = data.conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
        setTotalUnread(total);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const refreshUnreadCount = () => {
    fetchUnreadCount();
  };

  const incrementUnread = () => {
    setTotalUnread(prev => prev + 1);
  };

  const setActiveChat = (userId) => {
    setActiveChatUserId(userId);
  };

  const clearActiveChat = () => {
    setActiveChatUserId(null);
  };

  const setChatListActive = (isActive) => {
    setIsOnChatListScreen(isActive);
  };

  const setChatScreenActive = (isActive) => {
    setIsOnChatScreen(isActive);
  };

  const markAsRead = async (userId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      await fetch(`${API_URL}/conversations/${userId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  useEffect(() => {
    if (user?.userId) {
      SocketService.connect(user.userId);
      fetchUnreadCount();
      
      const handleGlobalMessage = (data) => {
        console.log('Global message received:', data);
        console.log('Active chat user ID:', activeChatUserId);
        console.log('Is on chat list screen:', isOnChatListScreen);
        
        if (data.senderId !== activeChatUserId && !isOnChatListScreen && !isOnChatScreen) {
          incrementUnread();
        }
      };
      
      SocketService.onReceiveMessage(handleGlobalMessage);
      
      const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
        if (nextAppState === 'active') {
          fetchUnreadCount();
        }
      });
      
      return () => {
        SocketService.offReceiveMessage(handleGlobalMessage);
        appStateSubscription?.remove();
      };
    }
  }, [user?.userId, activeChatUserId, isOnChatListScreen, isOnChatScreen]);

  return (
    <UnreadContext.Provider value={{ totalUnread, refreshUnreadCount, incrementUnread, setActiveChat, clearActiveChat, setChatListActive, setChatScreenActive, markAsRead }}>
      {children}
    </UnreadContext.Provider>
  );
};