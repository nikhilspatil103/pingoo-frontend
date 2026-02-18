import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, ImageBackground, Animated } from 'react-native';
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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pingoo</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.viewToggle} onPress={() => setIsListView(!isListView)}>
            <Text style={styles.viewToggleIcon}>{isListView ? '⊞' : '☰'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.themeButton} onPress={toggleTheme}>
            <Text style={styles.themeIcon}>{isDark ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Profiles Grid */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={[isListView ? styles.listContainer : styles.gridContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {profiles.map((profile, index) => (
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
              <View style={[styles.gradientBorder, { 
                borderColor: profile.borderColor[0],
                shadowColor: profile.borderColor[0],
              }]}>
                {profile.image ? (
                  <ImageBackground
                    source={{ uri: profile.image }}
                    style={styles.cardImage}
                    imageStyle={styles.cardImageStyle}
                  >
                    <View style={styles.cardOverlay}>
                      <View style={styles.cardInfo}>
                        <Text style={styles.profileName}>{profile.name}, {profile.age}</Text>
                        <Text style={styles.profileLocation}>📍 {profile.location}</Text>
                        <View style={styles.tagBadge}>
                          <Text style={[styles.genderIcon, { color: profile.gender === 'female' ? '#F70776' : '#03C8F0' }]}>{profile.gender === 'female' ? '♀' : '♂'}</Text>
                          <Text style={styles.tagText}>{profile.tag}</Text>
                        </View>
                      </View>
                    </View>
                  </ImageBackground>
                ) : (
                  <View style={styles.cardImage}>
                    <View style={styles.avatarContainer}>
                      <View style={[styles.avatarCircle, { backgroundColor: profile.borderColor[0] }]}>
                        <Text style={styles.avatarLetter}>{profile.name.charAt(0)}</Text>
                      </View>
                    </View>
                    <View style={styles.cardOverlay}>
                      <View style={styles.cardInfo}>
                        <Text style={styles.profileName}>{profile.name}, {profile.age}</Text>
                        <Text style={styles.profileLocation}>📍 {profile.location}</Text>
                        <View style={styles.tagBadge}>
                          <Text style={[styles.genderIcon, { color: profile.gender === 'female' ? '#F70776' : '#03C8F0' }]}>{profile.gender === 'female' ? '♀' : '♂'}</Text>
                          <Text style={styles.tagText}>{profile.tag}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            )}
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Sort Buttons */}
        <View style={styles.sortContainer}>
          <TouchableOpacity style={styles.sortButton}>
            <Text style={styles.sortButtonText}>Sort by location</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sortButtonOutline}>
            <Text style={styles.sortButtonTextOutline}>Sort by tags</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (theme, isDark) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDark ? '#130B1A' : '#F3E9EC' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 15,
    backgroundColor: isDark ? '#130B1A' : '#F3E9EC',
  },
  headerRight: { flexDirection: 'row', gap: 10 },
  viewToggle: { width: 40, height: 40, borderRadius: 20, backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
  viewToggleIcon: { fontSize: 20, color: theme.text },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: theme.text },
  themeButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5', 
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
  gradientBorder: {
    borderRadius: 24,
    borderWidth: 3,
    padding: 0,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.3 : 0.2,
    shadowRadius: 8,
    elevation: 5,
    backgroundColor: isDark ? 'transparent' : '#fff',
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
  cardOverlay: {
    backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.95)',
    padding: 10,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  cardInfo: {
    gap: 4,
  },
  profileName: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: isDark ? '#fff' : '#1a1a1a',
  },
  profileLocation: {
    fontSize: 11,
    color: isDark ? '#fff' : '#555',
  },
  tagBadge: { 
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
  },
  genderIcon: { fontSize: 12, fontWeight: 'bold' },
  tagText: { fontSize: 11, color: isDark ? '#fff' : '#1a1a1a', fontWeight: '500' },
  sortContainer: {
    padding: 20,
    gap: 12,
  },
  sortButton: {
    backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  sortButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  sortButtonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: isDark ? '#2a2a2a' : '#e0e0e0',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  sortButtonTextOutline: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  bottomNav: { 
    flexDirection: 'row', 
    backgroundColor: isDark ? '#130B1A' : '#F3E9EC',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: isDark ? '#1a1a1a' : '#f0f0f0',
    justifyContent: 'space-around',
  },
  navItem: { 
    alignItems: 'center',
    gap: 4,
  },
  navIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navIconActive: {
    backgroundColor: isDark ? '#2a2a2a' : '#e0e0e0',
  },
  navIcon: { fontSize: 24 },
  navLabel: {
    fontSize: 11,
    color: theme.textSecondary,
    marginTop: 4,
  },
  avatarContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: isDark ? '#1a1a1a' : '#e0e0e0',
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
});
