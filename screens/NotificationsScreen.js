import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, SafeAreaView, StatusBar, Image, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useLikes } from '../context/LikesContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/urlConfig';

export default function NotificationsScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const { fetchNewLikes, markLikesAsRead } = useLikes();
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
    markLikesAsRead();
  }, []);

  const loadNotifications = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_URL}/all-likes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.likes || []);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    await fetchNewLikes();
    setRefreshing(false);
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now - time;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return time.toLocaleDateString();
  };

  const styles = getStyles(theme, isDark);

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? '#1a0a2e' : '#ffeef8'} translucent={false} />
      <LinearGradient
        colors={isDark ? ['#1a0a2e', '#16213e', '#0f3460'] : ['#ffeef8', '#e8d5f2', '#d4e4f7']}
        style={styles.gradientBackground}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Notifications</Text>
            <View style={{ width: 40 }} />
          </View>

          {notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyText}>No notifications yet</Text>
              <Text style={styles.emptySubtext}>When someone likes your profile, you'll see it here</Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.notificationCard, !item.read && styles.unreadCard]}
                  onPress={() => navigation.navigate('ProfileView', { userId: item.id })}
                >
                  {item.profilePhoto ? (
                    <Image source={{ uri: item.profilePhoto }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, { backgroundColor: '#FF6B9D' }]}>
                      <Text style={styles.avatarText}>{item.name?.[0]?.toUpperCase()}</Text>
                    </View>
                  )}
                  <View style={styles.notificationContent}>
                    <View style={styles.notificationHeader}>
                      <Text style={styles.notificationTitle}>
                        <Text style={styles.userName}>{item.name}</Text>
                        <Text style={styles.notificationText}> liked your profile</Text>
                      </Text>
                      {!item.read && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.notificationTime}>{formatTime(item.timestamp)}</Text>
                  </View>
                  <Text style={styles.arrow}>›</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={theme.text}
                />
              }
            />
          )}
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const getStyles = (theme, isDark) => StyleSheet.create({
  container: { flex: 1 },
  gradientBackground: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
  },
  backIcon: { fontSize: 28, color: theme.text },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: theme.text },
  listContainer: { padding: 20 },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
  },
  unreadCard: {
    backgroundColor: isDark ? 'rgba(247,7,118,0.1)' : 'rgba(247,7,118,0.05)',
    borderColor: isDark ? 'rgba(247,7,118,0.3)' : 'rgba(247,7,118,0.2)',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  notificationContent: { flex: 1 },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notificationTitle: { flex: 1, flexDirection: 'row', flexWrap: 'wrap' },
  userName: { fontSize: 16, fontWeight: 'bold', color: theme.text },
  notificationText: { fontSize: 16, color: theme.text },
  notificationTime: { fontSize: 13, color: theme.textSecondary },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
    marginLeft: 8,
  },
  arrow: { fontSize: 28, color: theme.textSecondary, marginLeft: 8 },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyText: { fontSize: 20, fontWeight: 'bold', color: theme.text, marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: theme.textSecondary, textAlign: 'center' },
});
