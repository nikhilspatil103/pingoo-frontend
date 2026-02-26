import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/urlConfig';

const LikesContext = createContext();

export const useLikes = () => useContext(LikesContext);

export const LikesProvider = ({ children }) => {
  const [newLikes, setNewLikes] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNewLikes = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_URL}/new-likes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setNewLikes(data.likes || []);
        setUnreadCount(data.likes?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching new likes:', error);
    }
  };

  const markLikesAsRead = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      await fetch(`${API_URL}/mark-likes-read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking likes as read:', error);
    }
  };

  const addNewLike = (like) => {
    setNewLikes(prev => [like, ...prev]);
    setUnreadCount(prev => prev + 1);
    // Also trigger a fetch to get the full like details
    fetchNewLikes();
  };

  return (
    <LikesContext.Provider value={{ newLikes, unreadCount, fetchNewLikes, markLikesAsRead, addNewLike }}>
      {children}
    </LikesContext.Provider>
  );
};
