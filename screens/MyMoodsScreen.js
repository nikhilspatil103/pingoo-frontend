import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, Alert, Image, SafeAreaView, StatusBar, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { API_URL } from '../config/urlConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

export default function MyMoodsScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const [moods, setMoods] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchMyMoods();
    }, [])
  );

  const fetchMyMoods = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/my-moods`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMoods(data.moods);
      }
    } catch (e) {
      console.error('Error fetching my moods:', e);
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = async (moodId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/mood/${moodId}/toggle`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMoods(prev => prev.map(m => m.id === moodId ? { ...m, isActive: data.isActive } : m));
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to update');
    }
  };

  const deleteMood = async (moodId) => {
    Alert.alert('Delete Mood', 'This cannot be undone. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('token');
            const res = await fetch(`${API_URL}/mood/${moodId}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
              setMoods(prev => prev.filter(m => m.id !== moodId));
            }
          } catch (e) {
            Alert.alert('Error', 'Failed to delete');
          }
        }
      }
    ]);
  };

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000 / 60);
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return d.toLocaleDateString();
  };

  const renderMood = ({ item }) => (
    <View style={[styles.moodCard, { backgroundColor: isDark ? '#1e1e2e' : '#fff', opacity: item.isActive ? 1 : 0.6 }]}>
      <Image source={{ uri: item.videoUrl }} style={styles.thumbnail} />
      <View style={styles.moodInfo}>
        <Text style={[styles.caption, { color: theme.text }]} numberOfLines={1}>
          {item.caption || 'No caption'}
        </Text>
        <Text style={[styles.meta, { color: theme.textSecondary }]}>
          {item.mood} • {formatTime(item.createdAt)}
        </Text>
        <View style={styles.stats}>
          <Text style={[styles.stat, { color: theme.textSecondary }]}>❤️ {item.likesCount}</Text>
          <Text style={[styles.stat, { color: theme.textSecondary }]}>💬 {item.commentsCount}</Text>
          <Text style={[styles.stat, { color: theme.textSecondary }]}>👁 {item.views}</Text>
        </View>
        {!item.isActive && <Text style={styles.hiddenBadge}>HIDDEN</Text>}
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: item.isActive ? 'rgba(255,107,157,0.15)' : 'rgba(0,200,100,0.15)' }]} onPress={() => toggleVisibility(item.id)}>
          <Text style={styles.actionText}>{item.isActive ? '👁‍🗨' : '👁'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(255,59,48,0.15)' }]} onPress={() => deleteMood(item.id)}>
          <Text style={styles.actionText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const styles = getStyles(theme, isDark);

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <LinearGradient colors={isDark ? ['#1a0a2e', '#16213e', '#0f3460'] : ['#ffeef8', '#e8d5f2', '#d4e4f7']} style={styles.gradient}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={[styles.backBtn, { color: theme.text }]}>←</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.text }]}>My Moods</Text>
            <View style={{ width: 30 }} />
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#FF6B9D" />
            </View>
          ) : moods.length === 0 ? (
            <View style={styles.center}>
              <Text style={{ fontSize: 50 }}>🎬</Text>
              <Text style={[styles.emptyText, { color: theme.text }]}>No moods posted yet</Text>
              <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>Your posted moods will appear here</Text>
            </View>
          ) : (
            <FlatList
              data={moods}
              renderItem={renderMood}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
            />
          )}
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const getStyles = (theme, isDark) => StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  backBtn: { fontSize: 24, fontWeight: 'bold' },
  title: { fontSize: 20, fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 18, fontWeight: '600', marginTop: 16 },
  emptySubtext: { fontSize: 14, marginTop: 6 },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  moodCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  thumbnail: { width: 70, height: 70, borderRadius: 12, backgroundColor: '#333' },
  moodInfo: { flex: 1, marginLeft: 12 },
  caption: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  meta: { fontSize: 12, marginBottom: 4 },
  stats: { flexDirection: 'row', gap: 12 },
  stat: { fontSize: 12 },
  hiddenBadge: { fontSize: 10, color: '#FF3B30', fontWeight: 'bold', marginTop: 4 },
  actions: { gap: 8 },
  actionBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  actionText: { fontSize: 16 },
});
