import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, Modal, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/urlConfig';
import ProfileViewScreen from './ProfileViewScreen';

export default function MyProfileScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const { logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [showFullProfile, setShowFullProfile] = useState(false);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [likesCount, setLikesCount] = useState(0);
  const [coins, setCoins] = useState(100);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const userName = await AsyncStorage.getItem('userName');
      const userEmail = await AsyncStorage.getItem('userEmail');
      const userPhoto = await AsyncStorage.getItem('userProfilePhoto');
      const userCoins = await AsyncStorage.getItem('userCoins');
      
      if (userCoins) setCoins(parseInt(userCoins));
      
      const profileData = {
        name: userName || 'User',
        age: 25,
        gender: 'female',
        email: userEmail,
        photo: userPhoto,
        bio: 'Looking for people interested in art and culture.',
        height: 165,
        bodyType: 'Athletic',
        smoking: 'Never',
        drinking: 'Socially',
        exercise: 'Regularly',
        diet: 'Vegetarian',
        lookingFor: 'Friendship',
        relationshipStatus: 'Single',
        kids: 'No',
        occupation: 'Designer',
        company: 'Tech Corp',
        graduation: "Bachelor's",
        school: 'State University',
        hometown: 'Mumbai',
        currentCity: 'New York',
        interests: ['Art & Culture', 'Photography', 'Travel'],
        languages: ['English', 'Spanish', 'Hindi'],
        tag: 'Art & Culture',
        borderColor: ['#F70776', '#FF88C5'],
      };
      
      setProfile(profileData);
      
      // Calculate completion
      const fields = [userName, userEmail, userPhoto, profileData.bio, profileData.height, profileData.bodyType];
      const filled = fields.filter(f => f && f !== '').length;
      setProfileCompletion(Math.round((filled / fields.length) * 100));
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const handleLogout = async () => {
    console.log('handleLogout called');
    console.log('Logout confirmed');
    try {
      const token = await AsyncStorage.getItem('token');
      console.log('Logout - Token:', token);
      
      if (token) {
        const response = await fetch(`${API_URL}/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        console.log('Logout API Response:', response.status);
        const data = await response.json();
        console.log('Logout API Data:', data);
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      console.log('Calling logout function');
      await logout();
      console.log('Logout function completed');
    }
  };

  const styles = getStyles(theme, isDark);

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={[styles.loading, { color: theme.text }]}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity>
          <Text style={styles.menuIcon}>⋮</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {profile.photo ? (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{profile.name.charAt(0)}</Text>
              </View>
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{profile.name.charAt(0)}</Text>
              </View>
            )}
            <View style={styles.editBadge}>
              <Text style={styles.editIcon}>✏️</Text>
            </View>
          </View>
          <Text style={styles.profileName}>{profile.name}</Text>
          <Text style={styles.profileEmail}>{profile.email}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${profileCompletion}%` }]} />
          </View>
          <Text style={styles.progressText}>{profileCompletion}% Profile Completed</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>◎</Text>
            <Text style={styles.statValue}>{coins}</Text>
            <Text style={styles.statLabel}>Coins</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>♥</Text>
            <Text style={styles.statValue}>{likesCount}</Text>
            <Text style={styles.statLabel}>Likes</Text>
          </View>
          <TouchableOpacity style={styles.statCard} onPress={() => setShowFullProfile(true)}>
            <Text style={styles.statIcon}>○</Text>
            <Text style={styles.statValue}>View</Text>
            <Text style={styles.statLabel}>My Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('EditProfile')}>
            <View style={styles.actionIconContainer}>
              <Text style={styles.actionIcon}>✎</Text>
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Edit Profile</Text>
              <Text style={styles.actionDesc}>Update your information</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <View style={styles.actionIconContainer}>
              <Text style={styles.actionIcon}>◎</Text>
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>My Coins</Text>
              <Text style={styles.actionDesc}>{coins} coins available</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <View style={styles.actionIconContainer}>
              <Text style={styles.actionIcon}>⊕</Text>
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Buy Coins</Text>
              <Text style={styles.actionDesc}>Get more coins to chat</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={handleLogout}>
            <View style={styles.actionIconContainer}>
              <Text style={styles.actionIcon}>⎋</Text>
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Logout</Text>
              <Text style={styles.actionDesc}>Sign out of your account</Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal visible={showFullProfile} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setShowFullProfile(false)}>
        <ProfileViewScreen route={{ params: { profile } }} navigation={{ goBack: () => setShowFullProfile(false) }} />
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (theme, isDark) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDark ? '#130B1A' : '#F3E9EC' },
  loading: { flex: 1, textAlign: 'center', marginTop: 100, fontSize: 18 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: isDark ? '#130B1A' : '#F3E9EC' },
  backIcon: { fontSize: 24, color: isDark ? '#fff' : '#333' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: isDark ? '#fff' : '#333' },
  menuIcon: { fontSize: 24, color: isDark ? '#fff' : '#333' },
  profileCard: { margin: 20, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', borderRadius: 24, padding: 30, alignItems: 'center' },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#FFB6C1', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 48, fontWeight: 'bold', color: '#fff' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, width: 36, height: 36, borderRadius: 18, backgroundColor: '#F70776', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' },
  editIcon: { fontSize: 16 },
  profileName: { fontSize: 24, fontWeight: 'bold', color: theme.text, marginBottom: 4 },
  profileEmail: { fontSize: 14, color: theme.textSecondary, marginBottom: 16 },
  progressBar: { width: '100%', height: 8, backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', backgroundColor: '#F70776' },
  progressText: { fontSize: 12, color: theme.textSecondary },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 20 },
  statCard: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center', gap: 6, backgroundColor: 'transparent', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' },
  statIcon: { fontSize: 28, color: theme.text },
  statValue: { fontSize: 20, fontWeight: 'bold', color: theme.text },
  statLabel: { fontSize: 12, color: theme.textSecondary },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 16 },
  actionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', borderRadius: 16, padding: 16, marginBottom: 12 },
  actionIconContainer: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12, backgroundColor: 'transparent', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' },
  actionIcon: { fontSize: 24, color: theme.text, fontWeight: '300' },
  actionInfo: { flex: 1 },
  actionTitle: { fontSize: 15, fontWeight: 'bold', color: theme.text, marginBottom: 4 },
  actionDesc: { fontSize: 12, color: theme.textSecondary },
  actionArrow: { fontSize: 24, color: theme.textSecondary },
});
