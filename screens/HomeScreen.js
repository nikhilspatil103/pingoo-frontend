import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, ImageBackground, Animated, StatusBar, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/urlConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAvatarColor } from '../utils/avatarColors';
import { useFocusEffect } from '@react-navigation/native';
import PingooLogo from '../components/PingooLogo';

export default function HomeScreen({ navigation }) {
  const { theme, isDark, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const [isListView, setIsListView] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [slideAnim] = useState(new Animated.Value(0));
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      fetchUsers();
      // Set up interval to refresh users every 30 seconds while on screen
      const interval = setInterval(() => {
        fetchUsers();
      }, 30000);
      
      return () => clearInterval(interval);
    }, [])
  );

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [isDark]);

  const fetchUsers = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      console.log('Token from storage:', token);
      
      if (!token) {
        console.error('No token found in storage');
        logout(); // Auto logout if no token
        return;
      }
      
      const response = await fetch(`${API_URL}/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log('Response status:', response.status);
      
      if (response.status === 401) {
        // Token is invalid, clear it and logout
        await AsyncStorage.removeItem('token');
        logout();
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        console.log('Users data:', data);
        setProfiles(data.users || []);
      } else {
        const errorData = await response.json();
        console.error('Failed to fetch users:', errorData);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const styles = getStyles(theme, isDark);

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? '#1a0a2e' : '#ffeef8'} />
      <LinearGradient
        colors={isDark ? ['#1a0a2e', '#16213e', '#0f3460'] : ['#ffeef8', '#e8d5f2', '#d4e4f7']}
        style={styles.gradientBackground}
      >
        <SafeAreaView style={styles.safeArea}>
          <BlurView intensity={isDark ? 30 : 20} tint={isDark ? 'dark' : 'light'} style={styles.header}>
            <Text style={styles.headerTitle}>Pingoo</Text>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.viewToggle} onPress={() => setIsListView(!isListView)} activeOpacity={1}>
                <Text style={styles.viewToggleIcon}>{isListView ? '⊞' : '☰'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.themeButton} onPress={toggleTheme} activeOpacity={1}>
                <Text style={styles.themeIcon}>{isDark ? '☀️' : '🌙'}</Text>
              </TouchableOpacity>
            </View>
          </BlurView>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <PingooLogo size={100} animated={true} />
                <Text style={styles.loadingText}>Loading users...</Text>
              </View>
            ) : profiles.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No users found</Text>
              </View>
            ) : (
              <Animated.View style={[isListView ? styles.listContainer : styles.gridContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                {profiles.map((profile) => (
                  <TouchableOpacity key={profile.id} style={isListView ? styles.listCard : styles.profileCardWrapper} onPress={() => navigation.navigate('ProfileView', { profile })} activeOpacity={1}>
                    {isListView ? (
                      <View style={styles.listCardContent}>
                        <View style={styles.listImageContainer}>
                          {profile.profilePhoto ? (
                            <ImageBackground source={{ uri: profile.profilePhoto }} style={styles.listImage} imageStyle={styles.listImageStyle} />
                          ) : (
                            <View style={[styles.listImage, { backgroundColor: getAvatarColor(profile.id, profile.name)[0] }]}>
                              <Text style={styles.listAvatarLetter}>{profile.name.charAt(0)}</Text>
                            </View>
                          )}
                          {profile.isOnline && (
                            <View style={styles.listOnlineBadge}>
                              <Text style={styles.listOnlineBadgeText}>🟢</Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.listInfo}>
                          <View style={styles.listNameRow}>
                            <Text style={styles.listName}>{profile.name}, {profile.age || 'N/A'}</Text>
                            {profile.likesCount > 0 && (
                              <Text style={styles.listLikes}>❤️ {profile.likesCount}</Text>
                            )}
                          </View>
                          <Text style={styles.listLocation}>📍 {profile.location || 'Unknown'}</Text>
                          <View style={styles.listTagRow}>
                            <Text style={[styles.listGenderIcon, { color: profile.gender === 'female' ? '#F70776' : '#03C8F0' }]}>
                              {profile.gender === 'female' ? '♀' : '♂'}
                            </Text>
                            <Text style={styles.listTag} numberOfLines={2} ellipsizeMode="tail">{profile?.lookingFor || 'Looking for friends'}</Text>
                          </View>
                        </View>
                      </View>
                    ) : (
                      <BlurView intensity={isDark ? 20 : 15} tint={isDark ? 'dark' : 'light'} style={styles.glassCard}>
                        {profile.profilePhoto ? (
                          <ImageBackground source={{ uri: profile.profilePhoto }} style={styles.cardImage} imageStyle={styles.cardImageStyle}>
                            {profile.isOnline && (
                              <View style={styles.onlineBadge}>
                                <Text style={styles.onlineBadgeText}>🟢</Text>
                              </View>
                            )}
                            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.cardGradient}>
                              <BlurView intensity={15} tint="dark" style={styles.cardOverlay}>
                                <View style={styles.cardInfo}>
                                  <View style={styles.nameRow}>
                                    <Text style={styles.profileName}>{profile.name}, {profile.age || 'N/A'}</Text>
                                    {profile.likesCount > 0 && (
                                      <View style={styles.likesBadge}>
                                        <Text style={styles.likesText}>❤️ {profile.likesCount}</Text>
                                      </View>
                                    )}
                                  </View>
                                  <Text style={styles.profileLocation}>📍 {profile.location || 'Unknown'}</Text>
                                  <BlurView intensity={10} tint="dark" style={styles.tagBadge}>
                                    <Text style={[styles.genderIcon, { color: profile.gender === 'female' ? '#F70776' : '#03C8F0' }]}>{profile.gender === 'female' ? '♀' : '♂'}</Text>
                                    <Text style={styles.tagText} numberOfLines={2} ellipsizeMode="tail">{profile.lookingFor || 'Looking for friends'}</Text>
                                  </BlurView>
                                </View>
                              </BlurView>
                            </LinearGradient>
                          </ImageBackground>
                        ) : (
                          <LinearGradient colors={getAvatarColor(profile.id, profile.name)} style={styles.cardImage}>
                            <View style={styles.avatarContainer}>
                              <View style={styles.avatarCircle}>
                                <Text style={styles.avatarLetter}>{profile.name.charAt(0)}</Text>
                              </View>
                              {profile.isOnline && (
                                <View style={styles.onlineBadge}>
                                  <Text style={styles.onlineBadgeText}>🟢</Text>
                                </View>
                              )}
                            </View>
                            <BlurView intensity={15} tint="dark" style={styles.cardOverlay}>
                              <View style={styles.cardInfo}>
                                <View style={styles.nameRow}>
                                  <Text style={styles.profileName}>{profile.name}, {profile.age || 'N/A'}</Text>
                                  {profile.likesCount > 0 && (
                                    <View style={styles.likesBadge}>
                                      <Text style={styles.likesText}>❤️ {profile.likesCount}</Text>
                                    </View>
                                  )}
                                </View>
                                <Text style={styles.profileLocation}>📍 {profile.location || 'Unknown'}</Text>
                                <BlurView intensity={10} tint="dark" style={styles.tagBadge}>
                                  <Text style={[styles.genderIcon, { color: profile.gender === 'female' ? '#F70776' : '#03C8F0' }]}>{profile.gender === 'female' ? '♀' : '♂'}</Text>
                                  <Text style={styles.tagText} numberOfLines={2} ellipsizeMode="tail">{profile.lookingFor || 'Looking for friends'}</Text>
                                </BlurView>
                              </View>
                            </BlurView>
                          </LinearGradient>
                        )}
                      </BlurView>
                    )}
                  </TouchableOpacity>
                ))}
              </Animated.View>
            )}

            <View style={styles.sortContainer}>
              <TouchableOpacity activeOpacity={1}>
                <BlurView intensity={isDark ? 20 : 15} tint={isDark ? 'dark' : 'light'} style={styles.sortButton}>
                  <Text style={styles.sortButtonText}>Sort by location</Text>
                </BlurView>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={1}>
                <BlurView intensity={isDark ? 20 : 15} tint={isDark ? 'dark' : 'light'} style={styles.sortButtonOutline}>
                  <Text style={styles.sortButtonTextOutline}>Sort by tags</Text>
                </BlurView>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const getStyles = (theme, isDark) => StyleSheet.create({
  container: { flex: 1 },
  gradientBackground: { flex: 1 },
  safeArea: { flex: 1, paddingTop: StatusBar.currentHeight || 0 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 15,
    borderRadius: 0,
    overflow: 'hidden',
  },
  headerRight: { flexDirection: 'row', gap: 10 },
  viewToggle: { width: 40, height: 40, borderRadius: 20, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', justifyContent: 'center', alignItems: 'center' },
  viewToggleIcon: { fontSize: 20, color: theme.text },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: theme.text },
  themeButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  themeIcon: { fontSize: 20 },
  content: { flex: 1 },
  gridContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    padding: 15,
    gap: 15,
  },
  listContainer: { padding: 15, gap: 15 },
  listCard: { width: '100%', backgroundColor: isDark ? '#1a1a1a' : '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  listCardContent: { flexDirection: 'row', padding: 12 },
  listImage: { width: 80, height: 80, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  listImageContainer: { position: 'relative' },
  listOnlineBadge: { position: 'absolute', top: 2, right: 2, width: 10, height: 10, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  listOnlineBadgeText: { fontSize: 8 },
  listImageStyle: { borderRadius: 12 },
  listAvatarLetter: { fontSize: 36, fontWeight: 'bold', color: '#fff' },
  listInfo: { flex: 1, marginLeft: 15, justifyContent: 'center' },
  listNameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  listName: { fontSize: 18, fontWeight: 'bold', color: theme.text },
  listLikes: { fontSize: 12, color: theme.text, fontWeight: 'bold' },
  listLocation: { fontSize: 12, color: theme.textSecondary, marginBottom: 6 },
  listTagRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  listGenderIcon: { fontSize: 16, fontWeight: 'bold' },
  listTag: { fontSize: 14, color: theme.textSecondary },
  profileCardWrapper: { 
    width: '47%',
  },
  glassCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isDark ? 0.4 : 0.2,
    shadowRadius: 12,
    elevation: 8,
    shadowColor: isDark ? '#000' : '#999',
  },
  cardImage: {
    width: '100%',
    height: 240,
    justifyContent: 'flex-end',
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardImageStyle: {
    borderRadius: 20,
  },
  cardGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  cardInfo: {
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  likesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likesText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  profileName: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#fff',
  },
  profileLocation: {
    fontSize: 11,
    color: '#fff',
  },
  tagBadge: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  genderIcon: { fontSize: 12, fontWeight: 'bold' },
  tagText: { fontSize: 11, color: '#fff', fontWeight: '500' },
  sortContainer: {
    padding: 20,
    gap: 12,
  },
  sortButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)',
  },
  sortButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  sortButtonOutline: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)',
  },
  sortButtonTextOutline: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  avatarContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  avatarLetter: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    fontSize: 16,
    color: theme.textSecondary,
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 18,
    color: theme.textSecondary,
  },
  onlineIndicator: {
    fontSize: 12,
    marginLeft: 8,
  },
  onlineBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineBadgeText: {
    fontSize: 8,
  },
});
