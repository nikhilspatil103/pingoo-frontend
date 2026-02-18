import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, ImageBackground, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function HomeScreen({ navigation }) {
  const { theme, isDark, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const [isListView, setIsListView] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [slideAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [isDark]);

  const profiles = [
    { id: 1, name: 'Anastasia', age: 30, gender: 'female', tag: 'Communication', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400', borderColor: ['#FF6B9D', '#C471ED'], distance: '2 km away', location: 'Manhattan, NY' },
    { id: 2, name: 'Liza', age: 24, gender: 'female', tag: 'Communication', image: null, borderColor: ['#4ECDC4', '#556270'], distance: '5 km away', location: 'Brooklyn, NY' },
    { id: 3, name: 'Eva', age: 22, gender: 'female', tag: 'Friendship', image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400', borderColor: ['#FFB6C1', '#FFA07A'], distance: '1 km away', location: 'Queens, NY' },
    { id: 4, name: 'Lana', age: 28, gender: 'female', tag: 'Language Practice', image: null, borderColor: ['#E0BBE4', '#957DAD'], distance: '3 km away', location: 'Bronx, NY' },
    { id: 5, name: 'Sofia', age: 26, gender: 'female', tag: 'Travel Buddy', image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400', borderColor: ['#FF6B9D', '#C471ED'], distance: '4 km away', location: 'Staten Island, NY' },
    { id: 6, name: 'Maria', age: 29, gender: 'female', tag: 'Coffee Dates', image: null, borderColor: ['#4ECDC4', '#556270'], distance: '6 km away', location: 'Manhattan, NY' },
    { id: 7, name: 'Alex', age: 27, gender: 'male', tag: 'Sports', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400', borderColor: ['#FFB6C1', '#FFA07A'], distance: '2 km away', location: 'Brooklyn, NY' },
    { id: 8, name: 'David', age: 31, gender: 'male', tag: 'Music Lover', image: null, borderColor: ['#E0BBE4', '#957DAD'], distance: '7 km away', location: 'Queens, NY' },
    { id: 9, name: 'Nina', age: 25, gender: 'female', tag: 'Art & Culture', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400', borderColor: ['#FF6B9D', '#C471ED'], distance: '3 km away', location: 'Manhattan, NY' },
    { id: 10, name: 'Kate', age: 23, gender: 'female', tag: 'Foodie', image: null, borderColor: ['#4ECDC4', '#556270'], distance: '5 km away', location: 'Brooklyn, NY' },
  ];

  const styles = getStyles(theme, isDark);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark ? ['#1a0a2e', '#16213e', '#0f3460'] : ['#ffeef8', '#e8d5f2', '#d4e4f7']}
        style={styles.gradientBackground}
      >
        <SafeAreaView style={styles.safeArea}>
          <BlurView intensity={isDark ? 30 : 20} tint={isDark ? 'dark' : 'light'} style={styles.header}>
            <Text style={styles.headerTitle}>Pingoo</Text>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.viewToggle} onPress={() => setIsListView(!isListView)}>
                <Text style={styles.viewToggleIcon}>{isListView ? '⊞' : '☰'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.themeButton} onPress={toggleTheme}>
                <Text style={styles.themeIcon}>{isDark ? '☀️' : '🌙'}</Text>
              </TouchableOpacity>
            </View>
          </BlurView>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Animated.View style={[isListView ? styles.listContainer : styles.gridContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              {profiles.map((profile) => (
                <TouchableOpacity key={profile.id} style={isListView ? styles.listCard : styles.profileCardWrapper} onPress={() => navigation.navigate('ProfileView', { profile })}>
                  {isListView ? (
                    <View style={styles.listCardContent}>
                      {profile.image ? (
                        <ImageBackground source={{ uri: profile.image }} style={styles.listImage} imageStyle={styles.listImageStyle} />
                      ) : (
                        <View style={[styles.listImage, { backgroundColor: profile.borderColor[0] }]}>
                          <Text style={styles.listAvatarLetter}>{profile.name.charAt(0)}</Text>
                        </View>
                      )}
                      <View style={styles.listInfo}>
                        <Text style={styles.listName}>{profile.name}, {profile.age}</Text>
                        <Text style={styles.listLocation}>📍 {profile.location}</Text>
                        <View style={styles.listTagRow}>
                          <Text style={[styles.listGenderIcon, { color: profile.gender === 'female' ? '#F70776' : '#03C8F0' }]}>
                            {profile.gender === 'female' ? '♀' : '♂'}
                          </Text>
                          <Text style={styles.listTag}>{profile.tag}</Text>
                        </View>
                      </View>
                    </View>
                  ) : (
                    <BlurView intensity={isDark ? 20 : 15} tint={isDark ? 'dark' : 'light'} style={styles.glassCard}>
                      {profile.image ? (
                        <ImageBackground source={{ uri: profile.image }} style={styles.cardImage} imageStyle={styles.cardImageStyle}>
                          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.cardGradient}>
                            <BlurView intensity={15} tint="dark" style={styles.cardOverlay}>
                              <View style={styles.cardInfo}>
                                <Text style={styles.profileName}>{profile.name}, {profile.age}</Text>
                                <Text style={styles.profileLocation}>📍 {profile.location}</Text>
                                <BlurView intensity={10} tint="dark" style={styles.tagBadge}>
                                  <Text style={[styles.genderIcon, { color: profile.gender === 'female' ? '#F70776' : '#03C8F0' }]}>{profile.gender === 'female' ? '♀' : '♂'}</Text>
                                  <Text style={styles.tagText}>{profile.tag}</Text>
                                </BlurView>
                              </View>
                            </BlurView>
                          </LinearGradient>
                        </ImageBackground>
                      ) : (
                        <LinearGradient colors={profile.borderColor} style={styles.cardImage}>
                          <View style={styles.avatarContainer}>
                            <View style={styles.avatarCircle}>
                              <Text style={styles.avatarLetter}>{profile.name.charAt(0)}</Text>
                            </View>
                          </View>
                          <BlurView intensity={15} tint="dark" style={styles.cardOverlay}>
                            <View style={styles.cardInfo}>
                              <Text style={styles.profileName}>{profile.name}, {profile.age}</Text>
                              <Text style={styles.profileLocation}>📍 {profile.location}</Text>
                              <BlurView intensity={10} tint="dark" style={styles.tagBadge}>
                                <Text style={[styles.genderIcon, { color: profile.gender === 'female' ? '#F70776' : '#03C8F0' }]}>{profile.gender === 'female' ? '♀' : '♂'}</Text>
                                <Text style={styles.tagText}>{profile.tag}</Text>
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

            <View style={styles.sortContainer}>
              <TouchableOpacity>
                <BlurView intensity={isDark ? 20 : 15} tint={isDark ? 'dark' : 'light'} style={styles.sortButton}>
                  <Text style={styles.sortButtonText}>Sort by location</Text>
                </BlurView>
              </TouchableOpacity>
              <TouchableOpacity>
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
  safeArea: { flex: 1 },
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
  listImageStyle: { borderRadius: 12 },
  listAvatarLetter: { fontSize: 36, fontWeight: 'bold', color: '#fff' },
  listInfo: { flex: 1, marginLeft: 15, justifyContent: 'center' },
  listName: { fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 8 },
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
    padding: 10,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  cardInfo: {
    gap: 4,
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
});
