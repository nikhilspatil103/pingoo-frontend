import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, Modal, Dimensions, Platform, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/urlConfig';
import OptimizedImage from '../components/OptimizedImage';

let FastImage;
if (Platform.OS !== 'web') {
  FastImage = require('react-native-fast-image');
}

const { width } = Dimensions.get('window');

export default function ProfileViewScreen({ route, navigation }) {
  const { theme, isDark } = useTheme();
  const { profile: initialProfile, isMyProfile } = route.params;
  const [profile, setProfile] = useState(initialProfile);
  const [isStarred, setIsStarred] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  
  const getAllImages = () => {
    const images = [];
    if (profile.profilePhoto) images.push(profile.profilePhoto);
    if (profile.additionalPhotos) images.push(...profile.additionalPhotos);
    return images;
  };
  
  const allImages = getAllImages();

  useEffect(() => {
    checkIfStarred();
    if (initialProfile?.id) fetchProfileDetails();
  }, [initialProfile?.id]);

  const fetchProfileDetails = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/user/${initialProfile.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfile(data.user);
        setLikeCount(data.user.likes?.length || 0);
        
        const likeStatusResponse = await fetch(`${API_URL}/like-status/${initialProfile.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (likeStatusResponse.ok) {
          const likeData = await likeStatusResponse.json();
          setIsLiked(likeData.isLiked);
          setLikeCount(likeData.likeCount);
        }
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const checkIfStarred = async () => {
    const contacts = await AsyncStorage.getItem('contacts');
    if (contacts) {
      const list = JSON.parse(contacts);
      setIsStarred(list.some(c => c.id === profile.id));
    }
  };

  const toggleStar = async () => {
    const contacts = await AsyncStorage.getItem('contacts');
    let list = contacts ? JSON.parse(contacts) : [];
    
    if (isStarred) {
      list = list.filter(c => c.id !== profile.id);
    } else {
      list.push(profile);
    }
    
    await AsyncStorage.setItem('contacts', JSON.stringify(list));
    setIsStarred(!isStarred);
  };

  const toggleLike = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/like/${profile.id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.isLiked);
        setLikeCount(data.likeCount);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const InfoCard = ({ icon, label, value }) => (
    <View style={styles.infoCard}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, value === 'Not added' && styles.notAdded]}>{value}</Text>
      </View>
    </View>
  );

  const styles = getStyles(theme, isDark);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient colors={isDark ? ['#1a0a2e', '#16213e', '#0f3460'] : ['#ffeef8', '#e8d5f2', '#d4e4f7']} style={styles.gradient}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <BlurView intensity={20} tint="dark" style={styles.blurBtn}>
            <Text style={styles.backIcon}>←</Text>
          </BlurView>
        </TouchableOpacity>
        
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Hero Image Section */}
          <View style={styles.heroSection}>
            {allImages.length > 0 ? (
              <ScrollView 
                horizontal 
                pagingEnabled 
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => setCurrentImageIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
              >
                {allImages.map((uri, index) => (
                  <TouchableOpacity key={index} onPress={() => setShowFullImage(true)}>
                    <OptimizedImage uri={uri} style={styles.heroImage} userId={profile.id} userName={profile.name} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <LinearGradient colors={profile.borderColor || ['#F70776', '#FF88C5']} style={styles.heroImage}>
                <Text style={styles.avatarLetter}>{profile.name.charAt(0)}</Text>
              </LinearGradient>
            )}
            
            {allImages.length > 1 && (
              <View style={styles.indicators}>
                {allImages.map((_, i) => (
                  <View key={i} style={[styles.indicator, i === currentImageIndex && styles.indicatorActive]} />
                ))}
              </View>
            )}
          </View>

          {/* Profile Info */}
          <View style={styles.content}>
            <View style={styles.header}>
              <View>
                <Text style={styles.name}>{profile.name}, {profile.age}</Text>
                <Text style={styles.location}>📍 {profile.currentCity || 'Unknown'}</Text>
              </View>
              {!isMyProfile && (
                <View style={styles.headerActions}>
                  <TouchableOpacity onPress={toggleLike} style={styles.iconBtn}>
                    <Text style={styles.iconBtnText}>{isLiked ? '❤️' : '🤍'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={toggleStar} style={styles.iconBtn}>
                    <Text style={styles.iconBtnText}>{isStarred ? '⭐' : '☆'}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* About */}
            {profile.bio && profile.bio !== 'Not added' && (
              <BlurView intensity={10} tint={isDark ? 'dark' : 'light'} style={styles.section}>
                <Text style={styles.sectionTitle}>About</Text>
                <Text style={styles.bioText}>{profile.bio}</Text>
              </BlurView>
            )}

            {/* Quick Info */}
            <BlurView intensity={10} tint={isDark ? 'dark' : 'light'} style={styles.section}>
              <Text style={styles.sectionTitle}>Info</Text>
              <View style={styles.infoGrid}>
                <InfoCard icon="♂️" label="Gender" value={profile.gender === 'female' ? 'Female' : 'Male'} />
                <InfoCard icon="📏" label="Height" value={profile.height ? `${profile.height} cm` : 'Not added'} />
                <InfoCard icon="💪" label="Body Type" value={profile.bodyType || 'Not added'} />
              </View>
              <View style={styles.fullWidthInfo}>
                <Text style={styles.fullWidthLabel}>💑 Looking for</Text>
                <Text style={[styles.fullWidthValue, (profile.lookingFor === 'Not added' || !profile.lookingFor) && styles.notAdded]}>{profile.lookingFor || 'Not added'}</Text>
              </View>
            </BlurView>

            {/* Lifestyle */}
            <BlurView intensity={10} tint={isDark ? 'dark' : 'light'} style={styles.section}>
              <Text style={styles.sectionTitle}>Lifestyle</Text>
              <View style={styles.infoGrid}>
                <InfoCard icon="🚬" label="Smoking" value={profile.smoking || 'Not added'} />
                <InfoCard icon="🍷" label="Drinking" value={profile.drinking || 'Not added'} />
                <InfoCard icon="🏃" label="Exercise" value={profile.exercise || 'Not added'} />
                <InfoCard icon="🥗" label="Diet" value={profile.diet || 'Not added'} />
              </View>
            </BlurView>

            {/* Interests */}
            {profile.interests && profile.interests.length > 0 && (
              <BlurView intensity={10} tint={isDark ? 'dark' : 'light'} style={styles.section}>
                <Text style={styles.sectionTitle}>Interests</Text>
                <View style={styles.tags}>
                  {profile.interests.map((interest, i) => (
                    <View key={i} style={styles.tag}>
                      <Text style={styles.tagText}>{interest}</Text>
                    </View>
                  ))}
                </View>
              </BlurView>
            )}

            {/* Relationship */}
            <BlurView intensity={10} tint={isDark ? 'dark' : 'light'} style={styles.section}>
              <Text style={styles.sectionTitle}>Relationship</Text>
              <View style={styles.infoGrid}>
                <InfoCard icon="💑" label="Status" value={profile.relationshipStatus || 'Not added'} />
                <InfoCard icon="👶" label="Kids" value={profile.kids || 'Not added'} />
              </View>
            </BlurView>

            {/* Work & Education */}
            <BlurView intensity={10} tint={isDark ? 'dark' : 'light'} style={styles.section}>
              <Text style={styles.sectionTitle}>Work & Education</Text>
              <View style={styles.infoGrid}>
                <InfoCard icon="💼" label="Occupation" value={profile.occupation || 'Not added'} />
                <InfoCard icon="🏢" label="Company" value={profile.company || 'Not added'} />
                <InfoCard icon="🎓" label="Education" value={profile.graduation || 'Not added'} />
                <InfoCard icon="🏫" label="School" value={profile.school || 'Not added'} />
              </View>
            </BlurView>

            {/* Location */}
            <BlurView intensity={10} tint={isDark ? 'dark' : 'light'} style={styles.section}>
              <Text style={styles.sectionTitle}>Location</Text>
              <View style={styles.infoGrid}>
                <InfoCard icon="🏠" label="Hometown" value={profile.hometown || 'Not added'} />
                <InfoCard icon="📍" label="Lives in" value={profile.currentCity || 'Not added'} />
              </View>
            </BlurView>

            {/* Languages */}
            {profile.languages && profile.languages.length > 0 && profile.languages[0] !== 'Not added' && (
              <BlurView intensity={10} tint={isDark ? 'dark' : 'light'} style={styles.section}>
                <Text style={styles.sectionTitle}>Languages</Text>
                <View style={styles.tags}>
                  {profile.languages.map((lang, i) => (
                    <View key={i} style={styles.tag}>
                      <Text style={styles.tagText}>{lang}</Text>
                    </View>
                  ))}
                </View>
              </BlurView>
            )}

            <View style={{ height: 100 }} />
          </View>
        </ScrollView>

        {/* Action Buttons */}
        {!isMyProfile && (
          <View style={styles.actionButtons}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => navigation.navigate('Chat', { profile })}>
              <View style={styles.chatButton}>
                <Text style={styles.chatButtonText}>💬 Start Chat</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleLike}>
              <View style={styles.actionButton}>
                <Text style={styles.actionIcon}>{isLiked ? '❤️' : '🤍'}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleStar}>
              <View style={styles.actionButton}>
                <Text style={styles.actionIcon}>{isStarred ? '⭐' : '☆'}</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Full Image Modal */}
        <Modal visible={showFullImage} transparent animationType="fade">
          <View style={styles.fullModal}>
            <SafeAreaView style={styles.fullModalSafe}>
              <View style={styles.fullModalHeader}>
                <TouchableOpacity style={styles.fullModalCloseBtn} onPress={() => setShowFullImage(false)}>
                  <BlurView intensity={30} tint="dark" style={styles.fullModalCloseBtnInner}>
                    <Text style={styles.fullModalCloseIcon}>✕</Text>
                  </BlurView>
                </TouchableOpacity>
              </View>
              <View style={styles.fullModalImageContainer}>
                {Platform.OS === 'web' ? (
                  <OptimizedImage uri={allImages[currentImageIndex]} style={styles.fullModalImage} resizeMode="contain" />
                ) : (
                  <FastImage source={{ uri: allImages[currentImageIndex] }} style={styles.fullModalImage} resizeMode={FastImage.resizeMode.contain} />
                )}
              </View>
            </SafeAreaView>
          </View>
        </Modal>
      </LinearGradient>
    </View>
  );
}

const getStyles = (theme, isDark) => StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  heroSection: { position: 'relative' },
  heroImage: { width, height: width * 1.2, justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { fontSize: 120, fontWeight: 'bold', color: '#fff' },
  indicators: { position: 'absolute', bottom: 20, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  indicator: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  indicatorActive: { backgroundColor: '#fff', width: 20 },
  backBtn: { position: 'absolute', top: 50, left: 20, width: 40, height: 40, borderRadius: 20, overflow: 'hidden', zIndex: 999 },
  blurBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 20, color: '#fff', fontWeight: 'bold' },
  content: { padding: 20, marginTop: -30, borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: isDark ? '#1a0a2e' : '#ffeef8' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  name: { fontSize: 28, fontWeight: 'bold', color: theme.text },
  location: { fontSize: 14, color: theme.textSecondary, marginTop: 4 },
  headerActions: { flexDirection: 'row', gap: 10 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', justifyContent: 'center', alignItems: 'center' },
  iconBtnText: { fontSize: 20 },
  section: { borderRadius: 20, padding: 20, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 16 },
  bioText: { fontSize: 15, color: theme.text, lineHeight: 22 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  infoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderRadius: 12, padding: 12, width: '48%' },
  infoIcon: { fontSize: 24, marginRight: 10 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 12, color: theme.textSecondary, marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: '600', color: theme.text },
  fullWidthInfo: { marginTop: 12, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', borderRadius: 12, padding: 12 },
  fullWidthLabel: { fontSize: 12, color: theme.textSecondary, marginBottom: 4 },
  fullWidthValue: { fontSize: 14, fontWeight: '600', color: theme.text, lineHeight: 20 },
  notAdded: { color: '#999', fontStyle: 'italic' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: isDark ? 'rgba(255,107,157,0.2)' : 'rgba(255,107,157,0.15)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  tagText: { fontSize: 14, fontWeight: '600', color: '#FF6B9D' },
  actionButtons: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: 'transparent' },
  actionButton: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? '#1a1a1a' : '#2a2a2a', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)' },
  actionIcon: { fontSize: 24, color: '#fff' },
  chatButton: { paddingVertical: 14, borderRadius: 28, alignItems: 'center', backgroundColor: isDark ? '#1a1a1a' : '#2a2a2a', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)' },
  chatButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  fullModal: { flex: 1, backgroundColor: '#000' },
  fullModalSafe: { flex: 1 },
  fullModalHeader: { paddingHorizontal: 20, paddingVertical: 10, alignItems: 'flex-end' },
  fullModalCloseBtn: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
  fullModalCloseBtnInner: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  fullModalCloseIcon: { fontSize: 22, color: '#fff', fontWeight: 'bold' },
  fullModalImageContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 40 },
  fullModalImage: { width: '100%', height: '100%', resizeMode: 'contain' },
});
