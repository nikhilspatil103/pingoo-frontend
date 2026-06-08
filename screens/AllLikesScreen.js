import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, StatusBar, FlatList, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { API_URL } from '../config/urlConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PingooLoader from '../assets/brand/PingooLoader';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 60) / 3;

export default function AllLikesScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllLikes();
  }, []);

  const fetchAllLikes = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      const response = await fetch(`${API_URL}/all-likes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLikes(data.likes || []);
      }
    } catch (error) {
      console.error('Error fetching likes:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ProfileView', { profile: item })}
      activeOpacity={0.7}
    >
      {item.profilePhoto ? (
        <Image source={{ uri: item.profilePhoto }} style={styles.cardImage} />
      ) : (
        <LinearGradient colors={['#FF6B9D', '#FF3B7F']} style={styles.cardImage}>
          <Text style={styles.cardAvatarText}>{item.name?.[0]}</Text>
        </LinearGradient>
      )}
      <View style={styles.cardOverlay}>
        <Text style={styles.cardName} numberOfLines={1}>{item.name?.split(' ')[0]}, {item.age}</Text>
      </View>
    </TouchableOpacity>
  );

  const styles = getStyles(theme, isDark);

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <LinearGradient
        colors={isDark ? ['#1a0a2e', '#16213e', '#0f3460'] : ['#ffeef8', '#e8d5f2', '#d4e4f7']}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={theme.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Liked You ({likes.length})</Text>
            <View style={{ width: 40 }} />
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <PingooLoader />
            </View>
          ) : likes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="heart-outline" size={60} color={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'} />
              <Text style={styles.emptyText}>No likes yet</Text>
            </View>
          ) : (
            <FlatList
              data={likes}
              renderItem={renderItem}
              keyExtractor={(item) => (item.id || item._id).toString()}
              numColumns={3}
              contentContainerStyle={styles.grid}
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: theme.text },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 16, color: theme.textSecondary },
  grid: { paddingHorizontal: 15, paddingTop: 10 },
  card: { width: CARD_SIZE, height: CARD_SIZE * 1.3, margin: 5, borderRadius: 16, overflow: 'hidden' },
  cardImage: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  cardAvatarText: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  cardOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', paddingVertical: 6, paddingHorizontal: 8 },
  cardName: { color: '#fff', fontSize: 12, fontWeight: '600', textAlign: 'center' },
});
