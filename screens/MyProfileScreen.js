import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, Modal, Alert, StatusBar, ActivityIndicator, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/urlConfig';
import ProfileViewScreen from './ProfileViewScreen';
import PingooLogo from '../components/PingooLogo';
import OptimizedImage from '../components/OptimizedImage';

let FastImage;
if (Platform.OS !== 'web') {
  FastImage = require('react-native-fast-image');
}

export default function MyProfileScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const { logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [showFullProfile, setShowFullProfile] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [likesCount, setLikesCount] = useState(0);
  const [coins, setCoins] = useState(100);
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadProfile(); // Refresh profile when screen comes into focus
    });
    return unsubscribe;
  }, [navigation]);

  const loadProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const profileData = {
          ...data.user,
          image: data.user.profilePhoto,
          bio: data.user.bio || 'Not added',
          height: data.user.height || null,
          bodyType: data.user.bodyType || 'Not added',
          smoking: data.user.smoking || 'Not added',
          drinking: data.user.drinking || 'Not added',
          exercise: data.user.exercise || 'Not added',
          diet: data.user.diet || 'Not added',
          lookingFor: data.user.lookingFor || 'Not added',
          relationshipStatus: data.user.relationshipStatus || 'Not added',
          kids: data.user.kids || 'Not added',
          occupation: data.user.occupation || 'Not added',
          company: data.user.company || 'Not added',
          graduation: data.user.graduation || 'Not added',
          school: data.user.school || 'Not added',
          hometown: data.user.hometown || 'Not added',
          currentCity: data.user.currentCity || data.user.location || 'Not added',
          languages: data.user.languages?.length ? data.user.languages : ['Not added'],
          tag: data.user.interests?.[0] || 'Not added',
          borderColor: ['#F70776', '#FF88C5'],
        };
        
        setProfile(profileData);
        
        // Set likes count from backend
        setLikesCount(data.user.likes?.length || 0);
        
        // Calculate profile completion
        const fields = [profileData.name, profileData.email, profileData.profilePhoto, profileData.bio, profileData.age, profileData.gender];
        const filled = fields.filter(f => f && f !== '').length;
        setProfileCompletion(Math.round((filled / fields.length) * 100));
      } else {
        console.error('Failed to load profile');
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const handleLogout = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        await fetch(`${API_URL}/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      await logout();
    }
  };

  const styles = getStyles(theme, isDark);

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <PingooLogo size={100} animated={true} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? '#1a0a2e' : '#ffeef8'} />
      <LinearGradient
        colors={isDark ? ['#1a0a2e', '#16213e', '#0f3460'] : ['#ffeef8', '#e8d5f2', '#d4e4f7']}
        style={styles.gradientBackground}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>My Profile</Text>
            <TouchableOpacity style={styles.menuButton} onPress={() => setShowMenu(true)} activeOpacity={1}>
              <View style={styles.menuButtonInner}>
                <Text style={styles.menuIcon}>⋮</Text>
              </View>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.profileCard}>
              <TouchableOpacity style={styles.avatarContainer} onPress={() => navigation.navigate('EditProfile')}>
                <OptimizedImage
                  uri={profile.profilePhoto}
                  style={styles.avatar}
                  userId={profile.email}
                  userName={profile.name}
                  priority={Platform.OS !== 'web' ? FastImage?.priority?.high : undefined}
                />
                <View style={styles.editBadge}>
                  <Text style={styles.editIcon}>✏️</Text>
                </View>
              </TouchableOpacity>
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
              <TouchableOpacity onPress={async () => {
                await loadProfile();
                setShowFullProfile(true);
              }} activeOpacity={1}>
                <View style={styles.statCard}>
                  <Text style={styles.statIcon}>○</Text>
                  <Text style={styles.statValue}>View</Text>
                  <Text style={styles.statLabel}>My Profile</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <TouchableOpacity onPress={() => navigation.navigate('EditProfile')} activeOpacity={1}>
                <View style={styles.actionCard}>
                  <View style={styles.actionIconContainer}>
                    <Text style={styles.actionIcon}>✎</Text>
                  </View>
                  <View style={styles.actionInfo}>
                    <Text style={styles.actionTitle}>Edit Profile</Text>
                    <Text style={styles.actionDesc}>Update your information</Text>
                  </View>
                  <Text style={styles.actionArrow}>›</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('MyCoins')} activeOpacity={1}>
                <View style={styles.actionCard}>
                  <View style={styles.actionIconContainer}>
                    <Text style={styles.actionIcon}>◎</Text>
                  </View>
                  <View style={styles.actionInfo}>
                    <Text style={styles.actionTitle}>My Coins</Text>
                    <Text style={styles.actionDesc}>{coins} coins available</Text>
                  </View>
                  <Text style={styles.actionArrow}>›</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={1}>
                <View style={styles.actionCard}>
                  <View style={styles.actionIconContainer}>
                    <Text style={styles.actionIcon}>⊕</Text>
                  </View>
                  <View style={styles.actionInfo}>
                    <Text style={styles.actionTitle}>Buy Coins</Text>
                    <Text style={styles.actionDesc}>Get more coins to chat</Text>
                  </View>
                  <Text style={styles.actionArrow}>›</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleLogout} activeOpacity={1}>
                <View style={styles.actionCard}>
                  <View style={styles.actionIconContainer}>
                    <Text style={styles.actionIcon}>⎋</Text>
                  </View>
                  <View style={styles.actionInfo}>
                    <Text style={styles.actionTitle}>Logout</Text>
                    <Text style={styles.actionDesc}>Sign out of your account</Text>
                  </View>
                  <Text style={styles.actionArrow}>›</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>

          <Modal visible={showFullProfile} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setShowFullProfile(false)}>
            <ProfileViewScreen 
              route={{ params: { profile, isMyProfile: true } }} 
              navigation={{ goBack: () => setShowFullProfile(false) }} 
            />
          </Modal>

          <Modal visible={showMenu} animationType="slide" transparent onRequestClose={() => setShowMenu(false)}>
            <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setShowMenu(false)}>
              <View style={styles.menuModal}>
                <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); navigation.navigate('Terms'); }} activeOpacity={1}>
                  <Text style={styles.menuItemIcon}>📜</Text>
                  <Text style={styles.menuItemText}>Terms & Conditions</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); navigation.navigate('About'); }} activeOpacity={1}>
                  <Text style={styles.menuItemIcon}>ℹ️</Text>
                  <Text style={styles.menuItemText}>About Pingoo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); navigation.navigate('BlockList'); }} activeOpacity={1}>
                  <Text style={styles.menuItemIcon}>🚫</Text>
                  <Text style={styles.menuItemText}>Blocked Users</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); navigation.navigate('DeleteAccount'); }} activeOpacity={1}>
                  <Text style={styles.menuItemIcon}>🗑️</Text>
                  <Text style={styles.menuItemText}>Delete Account</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const getStyles = (theme, isDark) => StyleSheet.create({
  container: { flex: 1 },
  gradientBackground: { flex: 1 },
  safeArea: { flex: 1 },
  loading: { flex: 1, textAlign: 'center', marginTop: 100, fontSize: 18 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, overflow: 'hidden', borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)' },
  headerTitle: { fontSize: 24, fontWeight: '600', color: theme.text, textAlign: 'center' },
  menuButton: { 
    width: 44, 
    height: 44, 
  },
  menuButtonInner: {
    width: 44, 
    height: 44, 
    borderRadius: 22,
    justifyContent: 'center', 
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  menuIcon: { fontSize: 16, color: '#fff', fontWeight: '500' },
  profileCard: { margin: 20, borderRadius: 24, padding: 30, alignItems: 'center', backgroundColor: isDark ? 'rgba(26,26,26,0.9)' : 'rgba(255,255,255,0.9)', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(147,147,147,0.5)' },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
  avatarText: { fontSize: 48, fontWeight: 'bold', color: '#fff' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, width: 36, height: 36, borderRadius: 18, backgroundColor: '#F70776', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' },
  editIcon: { fontSize: 16 },
  profileName: { fontSize: 24, fontWeight: 'bold', color: theme.text, marginBottom: 4 },
  profileEmail: { fontSize: 14, color: theme.textSecondary, marginBottom: 16 },
  progressBar: { width: '100%', height: 8, backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', backgroundColor: '#F70776' },
  progressText: { fontSize: 12, color: theme.textSecondary },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 20 },
  statCard: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center', gap: 6, backgroundColor: isDark ? 'rgba(26,26,26,0.9)' : 'rgba(255,255,255,0.9)', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(147,147,147,0.5)' },
  statIcon: { fontSize: 28, color: theme.text },
  statValue: { fontSize: 20, fontWeight: 'bold', color: theme.text },
  statLabel: { fontSize: 12, color: theme.textSecondary },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 16 },
  actionCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 16, marginBottom: 12, backgroundColor: isDark ? 'rgba(26,26,26,0.9)' : 'rgba(255,255,255,0.9)', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(147,147,147,0.5)' },
  actionIconContainer: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12, backgroundColor: 'transparent', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' },
  actionIcon: { fontSize: 24, color: theme.text, fontWeight: '300' },
  actionInfo: { flex: 1 },
  actionTitle: { fontSize: 15, fontWeight: 'bold', color: theme.text, marginBottom: 4 },
  actionDesc: { fontSize: 12, color: theme.textSecondary },
  actionArrow: { fontSize: 24, color: theme.textSecondary },
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  menuModal: { backgroundColor: 'rgba(0,0,0,0.9)', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingVertical: 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  menuItemIcon: { fontSize: 24, marginRight: 16 },
  menuItemText: { fontSize: 16, color: '#fff', fontWeight: '500' },
});
