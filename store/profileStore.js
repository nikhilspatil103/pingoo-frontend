import create from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/urlConfig';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const useProfileStore = create((set, get) => ({
  profiles: [],
  page: 1,
  hasMore: true,
  initialLoading: true,
  loadingMore: false,
  refreshing: false,
  lastFetch: null,

  setProfiles: (profiles) => set({ profiles }),
  setPage: (page) => set({ page }),
  setHasMore: (hasMore) => set({ hasMore }),
  setInitialLoading: (initialLoading) => set({ initialLoading }),
  setLoadingMore: (loadingMore) => set({ loadingMore }),
  setRefreshing: (refreshing) => set({ refreshing }),

  fetchProfiles: async (pageNum = 1, isRefresh = false) => {
    const state = get();
    const now = Date.now();
    
    if (pageNum === 1 && !isRefresh && state.lastFetch && (now - state.lastFetch) < CACHE_DURATION && state.profiles.length > 0) {
      return;
    }

    if (state.loadingMore || (!state.hasMore && !isRefresh)) return;

    if (isRefresh) {
      set({ refreshing: true });
    } else if (pageNum === 1) {
      set({ initialLoading: true });
    } else {
      set({ loadingMore: true });
    }

    const abortController = new AbortController();

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_URL}/users?page=${pageNum}&limit=20`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        signal: abortController.signal,
      });

      if (response.ok) {
        const data = await response.json();
        const newUsers = data.users || [];

        if (isRefresh) {
          set({ profiles: newUsers, page: 1, hasMore: newUsers.length === 20, lastFetch: now });
        } else {
          set({ profiles: [...state.profiles, ...newUsers], page: pageNum, hasMore: newUsers.length === 20, lastFetch: now });
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted');
      } else {
        console.error('Error fetching profiles:', error);
      }
    } finally {
      set({ initialLoading: false, loadingMore: false, refreshing: false });
    }

    return abortController;
  },

  updateUserOnlineStatus: (userId, isOnline) => set((state) => ({
    profiles: state.profiles.map(p => 
      p.id === userId ? { ...p, isOnline, lastSeen: new Date() } : p
    )
  })),

  clearCache: () => set({ profiles: [], page: 1, hasMore: true, lastFetch: null }),

  updateProfile: (profileId, updates) => set((state) => ({
    profiles: state.profiles.map(p => p.id === profileId ? { ...p, ...updates } : p)
  })),
}));

export default useProfileStore;
