import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, Modal, Alert, StatusBar, ActivityIndicator, Platform, Animated, Easing, Image, FlatList, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
// import { BlurView } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import NotificationService from '../services/NotificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/urlConfig';
import ProfileViewScreen from './ProfileViewScreen';
import PingooLogo from '../components/PingooLogo';
import PingooLoader from '../assets/brand/PingooLoader';
import OptimizedImage from '../components/OptimizedImage';
import { useFocusEffect } from '@react-navigation/native';


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
  const [myMoods, setMyMoods] = useState([]);
  const [moodsLoading, setMoodsLoading] = useState(false);
  const [profileTab, setProfileTab] = useState('actions');
  const [moodPlayerVisible, setMoodPlayerVisible] = useState(false);
  const [moodPlayerIndex, setMoodPlayerIndex] = useState(0);
  const [moodPlayerPaused, setMoodPlayerPaused] = useState(false);
  const [moodPlayerCurrentIndex, setMoodPlayerCurrentIndex] = useState(0);
  const [selectedMoodMenu, setSelectedMoodMenu] = useState(null);
  const moodVideoRefs = useRef({});
  const moodPlayerViewableChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setMoodPlayerCurrentIndex(viewableItems[0].index);
      setMoodPlayerPaused(false);
    }
  }).current;
  const moodPlayerViewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  // Animations
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(30)).current;
  const statsOpacity = useRef(new Animated.Value(0)).current;
  const statsTranslateY = useRef(new Animated.Value(20)).current;
  const actionsOpacity = useRef(new Animated.Value(0)).current;
  const actionsTranslateY = useRef(new Animated.Value(20)).current;

  const playEntryAnimation = useCallback(() => {
    cardOpacity.setValue(0);
    cardTranslateY.setValue(30);
    statsOpacity.setValue(0);
    statsTranslateY.setValue(20);
    actionsOpacity.setValue(0);
    actionsTranslateY.setValue(20);

    Animated.stagger(120, [
      Animated.parallel([
        Animated.timing(cardOpacity, { toValue: 1, duration: 400, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        Animated.timing(cardTranslateY, { toValue: 0, duration: 400, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      ]),
      Animated.parallel([
        Animated.timing(statsOpacity, { toValue: 1, duration: 350, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        Animated.timing(statsTranslateY, { toValue: 0, duration: 350, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      ]),
      Animated.parallel([
        Animated.timing(actionsOpacity, { toValue: 1, duration: 350, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        Animated.timing(actionsTranslateY, { toValue: 0, duration: 350, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      ]),
    ]).start();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
      playEntryAnimation();
    }, [])
  );

  const fetchMyMoods = async () => {
    setMoodsLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/my-moods`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMyMoods(data.moods);
      }
    } catch (e) {
      console.error('Error fetching my moods:', e);
    } finally {
      setMoodsLoading(false);
    }
  };

  const toggleMoodVisibility = async (moodId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/mood/${moodId}/toggle`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMyMoods(prev => prev.map(m => m.id === moodId ? { ...m, isActive: data.isActive } : m));
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to update');
    }
  };

  const deleteMood = async (moodId) => {
    Alert.alert('Delete Mood', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          const token = await AsyncStorage.getItem('token');
          const res = await fetch(`${API_URL}/mood/${moodId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) setMyMoods(prev => prev.filter(m => m.id !== moodId));
        } catch (e) {
          Alert.alert('Error', 'Failed to delete');
        }
      }}
    ]);
  };

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
        
        // Set coins and likes count from backend
        setCoins(data.user.coins || 0);
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

  const testPushNotification = async () => {
    try {
      Alert.alert('Starting...', 'Registering push token');
      const result = await NotificationService.registerForPushNotifications();
      if (result) {
        Alert.alert('Done', `Token: ${result.substring(0, 20)}...`);
      } else {
        Alert.alert('Failed', 'Could not get push token');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const styles = getStyles(theme, isDark);

  if (!profile) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={isDark ? ['#1a0a2e', '#16213e', '#0f3460'] : ['#ffeef8', '#e8d5f2', '#d4e4f7']}
          style={styles.gradientBackground}
        >
          <SafeAreaView style={styles.safeArea}>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <PingooLoader />
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
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
            <Text style={styles.headerTitle}>Profile</Text>
            <TouchableOpacity style={styles.menuButton} onPress={() => setShowMenu(true)} activeOpacity={0.8}>
              <View style={styles.menuButtonInner}>
                <Text style={styles.menuIcon}>⋮</Text>
              </View>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Animated.View style={{ opacity: cardOpacity, transform: [{ translateY: cardTranslateY }] }}>
            <View style={styles.profileCard}>
              <TouchableOpacity style={styles.avatarContainer} onPress={() => navigation.navigate('EditProfile')}>
                <OptimizedImage
                  uri={profile.profilePhoto}
                  style={styles.avatar}
                  userId={profile.email}
                  userName={profile.name}
                />
                <View style={styles.editBadge}>
                  <Text style={styles.editIcon}>✏️</Text>
                </View>
              </TouchableOpacity>
              <Text style={styles.profileName}>{profile.name}</Text>
              <Text style={styles.profileUsername}>@{profile.username || 'loading...'}</Text>
              <Text style={styles.profileEmail}>{profile.email}</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${profileCompletion}%` }]} />
              </View>
              <Text style={styles.progressText}>{profileCompletion}% Profile Completed</Text>
            </View>
            </Animated.View>

            <Animated.View style={{ opacity: statsOpacity, transform: [{ translateY: statsTranslateY }] }}>
            <View style={styles.statsRow}>
              <TouchableOpacity onPress={() => navigation.navigate('MyCoins')} activeOpacity={0.8} style={{ flex: 1 }}>
                <View style={styles.coinStatCard}>
                  <Text style={styles.coinStatIcon}>💰</Text>
                  <Text style={styles.coinStatValue}>{coins}</Text>
                  <Text style={styles.coinStatLabel}>COINS</Text>
                </View>
              </TouchableOpacity>
              <View style={styles.statCard}>
                <Text style={styles.statIcon}>♥</Text>
                <Text style={styles.statValue}>{likesCount}</Text>
                <Text style={styles.statLabel}>Likes</Text>
              </View>
              <TouchableOpacity onPress={async () => {
                await loadProfile();
                setShowFullProfile(true);
              }} activeOpacity={1} style={{ flex: 1 }}>
                <View style={styles.statCard}>
                  <Text style={styles.statIcon}>○</Text>
                  <Text style={styles.statValue}>View</Text>
                  <Text style={styles.statLabel}>My Profile</Text>
                </View>
              </TouchableOpacity>
            </View>
            </Animated.View>

            {/* Profile Tabs */}
            <View style={styles.profileTabs}>
              <TouchableOpacity style={[styles.profileTab, profileTab === 'actions' && styles.profileTabActive]} onPress={() => setProfileTab('actions')}>
                <Text style={[styles.profileTabIcon, profileTab === 'actions' && styles.profileTabIconActive]}>☰</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.profileTab, profileTab === 'moods' && styles.profileTabActive]} onPress={() => { setProfileTab('moods'); if (myMoods.length === 0) fetchMyMoods(); }}>
                <Text style={[styles.profileTabIcon, profileTab === 'moods' && styles.profileTabIconActive]}>▶</Text>
              </TouchableOpacity>
            </View>

            {profileTab === 'actions' ? (
            <Animated.View style={{ opacity: actionsOpacity, transform: [{ translateY: actionsTranslateY }] }}>
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
              <TouchableOpacity onPress={() => navigation.navigate('SpinWheel')} activeOpacity={1}>
                <View style={styles.actionCard}>
                  <View style={styles.actionIconContainer}>
                    <Text style={styles.actionIcon}>🎡</Text>
                  </View>
                  <View style={styles.actionInfo}>
                    <Text style={styles.actionTitle}>Spin & Win</Text>
                    <Text style={styles.actionDesc}>Win free coins daily</Text>
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
            </Animated.View>
            ) : (
            <View style={styles.moodsGrid}>
              {moodsLoading ? (
                <ActivityIndicator size="small" color="#FF6B9D" style={{ marginVertical: 40 }} />
              ) : myMoods.length === 0 ? (
                <Text style={[styles.moodsEmpty, { color: theme.textSecondary }]}>No moods posted yet</Text>
              ) : (
                <View style={styles.moodsRow}>
                  {myMoods.map((item, index) => (
                    <TouchableOpacity key={item.id} style={[styles.moodGridItem, { opacity: item.isActive ? 1 : 0.4 }]} onPress={() => { setMoodPlayerIndex(index); setMoodPlayerVisible(true); }} activeOpacity={0.8}>
                      {item.thumbnailUrl ? (
                        <Image source={{ uri: item.thumbnailUrl }} style={styles.moodGridThumb} />
                      ) : (
                        <Video source={{ uri: item.videoUrl }} style={styles.moodGridThumb} resizeMode="cover" shouldPlay={false} positionMillis={500} />
                      )}
                      <View style={styles.moodGridOverlay}>
                        <Text style={styles.moodGridStats}>▶ {item.views}</Text>
                      </View>
                      {!item.isActive && <View style={styles.moodHiddenBadge}><Text style={styles.moodHiddenText}>Hidden</Text></View>}
                      <TouchableOpacity style={styles.moodDotsBtn} onPress={() => setSelectedMoodMenu(item.id)}>
                        <Text style={styles.moodDotsText}>⋮</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            )}

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

          {/* Mood Player Modal */}
          <Modal visible={moodPlayerVisible} animationType="slide" onRequestClose={() => { setMoodPlayerVisible(false); setMoodPlayerPaused(false); }}>
            <View style={{ flex: 1, backgroundColor: '#000' }}>
              {/* Header */}
              <View style={{ position: 'absolute', top: 50, left: 0, right: 0, zIndex: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 }}>
                <TouchableOpacity style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }} onPress={() => { setMoodPlayerVisible(false); setMoodPlayerPaused(false); }}>
                  <Ionicons name="arrow-back" size={22} color="#fff" />
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Image source={require('../assets/Ping.png')} style={{ width: 36, height: 36 }} resizeMode="contain" />
                  <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>My Moods</Text>
                </View>
                <View style={{ width: 40 }} />
              </View>

              {myMoods.length > 0 && (
                <FlatList
                  data={myMoods}
                  initialScrollIndex={moodPlayerIndex}
                  getItemLayout={(data, index) => ({ length: Dimensions.get('window').height, offset: Dimensions.get('window').height * index, index })}
                  pagingEnabled
                  keyExtractor={item => item.id}
                  showsVerticalScrollIndicator={false}
                  onViewableItemsChanged={moodPlayerViewableChanged}
                  viewabilityConfig={moodPlayerViewabilityConfig}
                  renderItem={({ item, index }) => (
                    <View style={{ width: Dimensions.get('window').width, height: Dimensions.get('window').height, position: 'relative', backgroundColor: '#000' }}>
                      <Video
                        ref={ref => { moodVideoRefs.current[item.id] = ref; }}
                        source={{ uri: item.videoUrl }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                        shouldPlay={index === moodPlayerCurrentIndex && !moodPlayerPaused}
                        isLooping
                        isMuted={false}
                      />

                      {/* Tap to play/pause */}
                      <TouchableOpacity
                        style={{ position: 'absolute', top: 0, left: 0, right: 60, bottom: 0, justifyContent: 'center', alignItems: 'center' }}
                        activeOpacity={1}
                        onPress={() => {
                          const ref = moodVideoRefs.current[item.id];
                          if (moodPlayerPaused) { ref?.playAsync(); setMoodPlayerPaused(false); }
                          else { ref?.pauseAsync(); setMoodPlayerPaused(true); }
                        }}
                      >
                        {moodPlayerPaused && index === moodPlayerCurrentIndex && (
                          <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
                            <Ionicons name="play" size={30} color="#fff" />
                          </View>
                        )}
                      </TouchableOpacity>

                      {/* Bottom info */}
                      <View style={{ position: 'absolute', bottom: 40, left: 16, right: 70 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                          {profile?.profilePhoto ? (
                            <Image source={{ uri: profile.profilePhoto }} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10, borderWidth: 2, borderColor: '#FF6B9D' }} />
                          ) : (
                            <View style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10, backgroundColor: '#FF6B9D', justifyContent: 'center', alignItems: 'center' }}>
                              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{profile?.name?.[0]}</Text>
                            </View>
                          )}
                          <View>
                            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{profile?.name}, {profile?.age}</Text>
                            {item.mood && <Text style={{ color: '#FFD93D', fontSize: 12, marginTop: 2 }}>Mood: {item.mood}</Text>}
                          </View>
                        </View>
                        {item.caption ? <Text style={{ color: '#fff', fontSize: 14, marginTop: 4 }}>{item.caption}</Text> : null}
                        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 8 }}>👁 {item.views} views</Text>
                      </View>

                      {/* Right side actions */}
                      <View style={{ position: 'absolute', right: 12, bottom: 40, alignItems: 'center', gap: 20 }}>
                        <View style={{ alignItems: 'center' }}>
                          <Ionicons name="heart" size={28} color="#FF3B30" />
                          <Text style={{ color: '#fff', fontSize: 12, marginTop: 4 }}>{item.likesCount}</Text>
                        </View>
                        <View style={{ alignItems: 'center' }}>
                          <Ionicons name="chatbubble-outline" size={26} color="#fff" />
                          <Text style={{ color: '#fff', fontSize: 12, marginTop: 4 }}>{item.commentsCount}</Text>
                        </View>
                        <TouchableOpacity style={{ alignItems: 'center' }} onPress={() => setSelectedMoodMenu(item.id)}>
                          <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
                          <Text style={{ color: '#fff', fontSize: 10, marginTop: 4 }}>More</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                />
              )}

              {/* 3-dot menu overlay inside player */}
              {selectedMoodMenu && (
                <TouchableOpacity style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', zIndex: 20 }} activeOpacity={1} onPress={() => setSelectedMoodMenu(null)}>
                  <View style={{ width: '70%', borderRadius: 16, paddingVertical: 8, backgroundColor: isDark ? '#1a0a2e' : '#fff' }}>
                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20 }} onPress={() => { toggleMoodVisibility(selectedMoodMenu); setSelectedMoodMenu(null); }}>
                      <Ionicons name={myMoods.find(m => m.id === selectedMoodMenu)?.isActive ? 'eye-off-outline' : 'eye-outline'} size={22} color={theme.text} style={{ marginRight: 12 }} />
                      <Text style={{ fontSize: 16, fontWeight: '500', color: theme.text }}>{myMoods.find(m => m.id === selectedMoodMenu)?.isActive ? 'Hide from others' : 'Make visible'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20 }} onPress={() => { deleteMood(selectedMoodMenu); setSelectedMoodMenu(null); }}>
                      <Ionicons name="trash-outline" size={22} color="#FF3B30" style={{ marginRight: 12 }} />
                      <Text style={{ fontSize: 16, fontWeight: '500', color: '#FF3B30' }}>Delete</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ paddingVertical: 14, paddingHorizontal: 20 }} onPress={() => setSelectedMoodMenu(null)}>
                      <Text style={{ fontSize: 16, color: theme.textSecondary, textAlign: 'center' }}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              )}

            </View>
          </Modal>

          {/* Mood 3-dot menu */}
          <Modal visible={!!selectedMoodMenu} transparent animationType="fade" onRequestClose={() => setSelectedMoodMenu(null)}>
            <TouchableOpacity style={styles.moodMenuOverlay} activeOpacity={1} onPress={() => setSelectedMoodMenu(null)}>
              <View style={[styles.moodMenuBox, { backgroundColor: isDark ? '#1a0a2e' : '#fff' }]}>
                <TouchableOpacity style={styles.moodMenuItem} onPress={() => { toggleMoodVisibility(selectedMoodMenu); setSelectedMoodMenu(null); }}>
                  <Text style={styles.moodMenuIcon}>{myMoods.find(m => m.id === selectedMoodMenu)?.isActive ? '🙈' : '👁'}</Text>
                  <Text style={[styles.moodMenuText, { color: theme.text }]}>{myMoods.find(m => m.id === selectedMoodMenu)?.isActive ? 'Hide from others' : 'Make visible'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.moodMenuItem} onPress={() => { deleteMood(selectedMoodMenu); setSelectedMoodMenu(null); }}>
                  <Text style={styles.moodMenuIcon}>🗑️</Text>
                  <Text style={[styles.moodMenuText, { color: '#FF3B30' }]}>Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.moodMenuItem} onPress={() => setSelectedMoodMenu(null)}>
                  <Text style={[styles.moodMenuText, { color: theme.textSecondary, textAlign: 'center' }]}>Cancel</Text>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 20 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: theme.text },
  menuButton: { width: 44, height: 44 },
  menuButtonInner: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
  menuIcon: { fontSize: 18, color: theme.text, fontWeight: '500' },
  profileCard: { margin: 20, borderRadius: 30, padding: 30, alignItems: 'center', backgroundColor: isDark ? '#2a2440' : '#ffffff', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
  avatarContainer: { position: 'relative', marginBottom: 20 },
  avatar: { width: 140, height: 140, borderRadius: 70, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', borderWidth: 4, borderColor: isDark ? 'rgba(255,107,157,0.3)' : 'rgba(255,107,157,0.2)' },
  avatarText: { fontSize: 56, fontWeight: 'bold', color: '#fff' },
  editBadge: { position: 'absolute', bottom: 5, right: 5, width: 44, height: 44, borderRadius: 22, backgroundColor: '#FF6B9D', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: isDark ? '#1a0a2e' : '#ffeef8', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  editIcon: { fontSize: 18 },
  profileName: { fontSize: 26, fontWeight: 'bold', color: theme.text, marginBottom: 4 },
  profileUsername: { fontSize: 14, color: '#FF6B9D', marginBottom: 4, fontWeight: '600' },
  profileEmail: { fontSize: 14, color: theme.textSecondary, marginBottom: 20 },
  progressBar: { width: '100%', height: 10, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', borderRadius: 5, overflow: 'hidden', marginBottom: 10 },
  progressFill: { height: '100%', backgroundColor: '#FF6B9D', borderRadius: 5 },
  progressText: { fontSize: 13, color: theme.textSecondary, fontWeight: '600' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 24 },
  statCard: { flex: 1, borderRadius: 20, padding: 18, alignItems: 'center', gap: 10, backgroundColor: isDark ? '#2a2440' : '#ffffff', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
  coinStatCard: { flex: 1, borderRadius: 20, padding: 18, alignItems: 'center', gap: 10, backgroundColor: isDark ? '#2a1440' : '#fff9e6', borderWidth: 1.5, borderColor: '#FFD700', elevation: 4, shadowColor: '#FFD700', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 8 },
  coinStatIcon: { fontSize: 32, color: '#FFD700' },
  coinStatValue: { fontSize: 22, fontWeight: 'bold', color: '#FFD700' },
  coinStatLabel: { fontSize: 11, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' },
  statIcon: { fontSize: 32, color: theme.text },
  statValue: { fontSize: 22, fontWeight: 'bold', color: theme.text },
  statLabel: { fontSize: 11, color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.7 },
  actionCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, padding: 18, marginBottom: 10, backgroundColor: isDark ? '#2a2440' : '#ffffff', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
  actionIconContainer: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', marginRight: 14, backgroundColor: isDark ? 'rgba(255,107,157,0.15)' : 'rgba(255,107,157,0.1)' },
  actionIcon: { fontSize: 26, color: '#FF6B9D', fontWeight: '300' },
  actionInfo: { flex: 1 },
  actionTitle: { fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: 4 },
  actionDesc: { fontSize: 13, color: theme.textSecondary },
  actionArrow: { fontSize: 20, color: theme.textSecondary, opacity: 0.5 },
  profileTabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', marginHorizontal: 20, marginBottom: 16 },
  profileTab: { flex: 1, alignItems: 'center', paddingVertical: 14, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  profileTabActive: { borderBottomColor: '#FF6B9D' },
  profileTabIcon: { fontSize: 20, color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' },
  profileTabIconActive: { color: '#FF6B9D' },
  moodsGrid: { paddingHorizontal: 20, paddingVertical: 10 },
  moodsEmpty: { textAlign: 'center', paddingVertical: 40, fontSize: 14 },
  moodsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  moodGridItem: { width: '31%', aspectRatio: 0.65, borderRadius: 8, overflow: 'hidden', position: 'relative', marginBottom: 4 },
  moodGridThumb: { width: '100%', height: '100%', backgroundColor: '#333' },
  moodGridOverlay: { position: 'absolute', bottom: 6, left: 6, flexDirection: 'row', alignItems: 'center' },
  moodGridStats: { color: '#fff', fontSize: 11, fontWeight: '600', textShadowColor: '#000', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  moodHiddenBadge: { position: 'absolute', top: 6, left: 6, backgroundColor: 'rgba(255,59,48,0.8)', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 },
  moodHiddenText: { color: '#fff', fontSize: 8, fontWeight: 'bold' },
  moodDotsBtn: { position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  moodDotsText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  moodMenuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  moodMenuBox: { width: '70%', borderRadius: 16, paddingVertical: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 10 },
  moodMenuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20 },
  moodMenuIcon: { fontSize: 20, marginRight: 12 },
  moodMenuText: { fontSize: 16, fontWeight: '500' },
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  menuModal: { backgroundColor: isDark ? '#1a0a2e' : '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingVertical: 24 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 18 },
  menuItemIcon: { fontSize: 26, marginRight: 16 },
  menuItemText: { fontSize: 16, color: theme.text, fontWeight: '600' },
});
