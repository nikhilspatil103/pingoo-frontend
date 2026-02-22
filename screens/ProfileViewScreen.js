import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, Modal, Dimensions, Platform } from 'react-native';
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
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);
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
    if (initialProfile?.id) {
      fetchProfileDetails();
    }
  }, [initialProfile?.id]);

  // Refresh profile when screen comes into focus
  useEffect(() => {
    if (navigation?.addListener) {
      const unsubscribe = navigation.addListener('focus', () => {
        if (initialProfile?.id) {
          fetchProfileDetails();
        }
      });
      return unsubscribe;
    }
  }, [navigation, initialProfile?.id]);

  const fetchProfileDetails = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      // Fetch profile details
      const response = await fetch(`${API_URL}/user/${initialProfile.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfile(data.user);
        setLikeCount(data.user.likes ? data.user.likes.length : 0);
        
        // Fetch like status
        const likeStatusResponse = await fetch(`${API_URL}/like-status/${initialProfile.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (likeStatusResponse.ok) {
          const likeData = await likeStatusResponse.json();
          setIsLiked(likeData.isLiked);
          setLikeCount(likeData.likeCount);
        }
      }
    } catch (error) {
      console.error('Failed to fetch profile details:', error);
    } finally {
      setLoading(false);
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
      console.log('Toggling like for profile:', profile.id);
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/like/${profile.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Like API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Like API response data:', data);
        setIsLiked(data.isLiked);
        setLikeCount(data.likeCount);
      } else {
        console.error('Like API failed:', response.status);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const styles = getStyles(theme, isDark);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark ? ['#1a0a2e', '#16213e', '#0f3460'] : ['#ffeef8', '#e8d5f2', '#d4e4f7']}
        style={styles.gradientBackground}
      >
        <SafeAreaView style={styles.safeArea}>
          <BlurView intensity={10} tint="dark" style={styles.backButton}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
          </View>

          {!isMyProfile && (
            <TouchableOpacity style={styles.menuButton} onPress={() => setShowMenu(true)} activeOpacity={1}>
              <BlurView intensity={10} tint="dark" style={styles.menuButtonInner}>
                <Text style={styles.menuIcon}>⋮</Text>
              </View>
            </TouchableOpacity>
          )}

          <Text style={styles.headerTitle}>{profile.name}, {profile.age}</Text>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {allImages.length > 0 ? (
              <View style={styles.imageContainer}>
                <ScrollView 
                  horizontal 
                  pagingEnabled 
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={(event) => {
                    const index = Math.round(event.nativeEvent.contentOffset.x / width);
                    setCurrentImageIndex(index);
                  }}
                >
                  {allImages.map((imageUri, index) => (
                    <TouchableOpacity key={index} onPress={() => setShowFullImage(true)}>
                      <OptimizedImage
                        uri={imageUri}
                        style={[styles.profileImage, { width: width - 40 }]}
                        userId={profile.id}
                        userName={profile.name}
                        priority={Platform.OS !== 'web' ? (index === 0 ? FastImage?.priority?.high : FastImage?.priority?.normal) : undefined}
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {allImages.length > 1 && (
                  <View style={styles.imageIndicators}>
                    {allImages.map((_, index) => (
                      <View 
                        key={index} 
                        style={[
                          styles.indicator, 
                          { backgroundColor: index === currentImageIndex ? '#fff' : 'rgba(255,255,255,0.5)' }
                        ]} 
                      />
                    ))}
                  </View>
                )}
              </View>
            ) : (
              <TouchableOpacity onPress={() => setShowFullImage(true)}>
                <LinearGradient colors={profile.borderColor || ['#F70776', '#FF88C5']} style={styles.profileImage}>
                  <Text style={styles.avatarLetter}>{profile.name.charAt(0)}</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            <BlurView intensity={isDark ? 20 : 15} tint={isDark ? 'dark' : 'light'} style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Age:</Text>
                <Text style={styles.infoValue}>{profile.age}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Gender:</Text>
                <Text style={[styles.genderIcon, { color: profile.gender === 'female' ? '#F70776' : '#03C8F0' }]}>
                  {profile.gender === 'female' ? '♀ Female' : '♂ Male'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Looking for:</Text>
                <Text style={[styles.infoValue, profile.lookingFor === 'Not added' ? styles.notAddedText : {}]}>{profile.lookingFor}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Distance:</Text>
                <Text style={styles.infoValue}>📍 {profile.distance || '2.5 km away'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Location:</Text>
                <Text style={[styles.infoValue, profile.currentCity === 'Not added' ? styles.notAddedText : {}]}>📍 {profile.currentCity}</Text>
              </View>
              
              <View style={styles.divider} />
              
              <Text style={styles.aboutTitle}>About me:</Text>
              <Text style={[styles.aboutText, profile.bio === 'Not added' ? styles.notAddedText : {}]}>{profile.bio}</Text>
              
              <View style={styles.divider} />
              
              <Text style={styles.aboutTitle}>Interests:</Text>
              <View style={styles.tagsContainer}>
                {profile.interests && profile.interests.length > 0 ? (
                  profile.interests.map((interest, index) => (
                    <BlurView key={index} intensity={10} tint={isDark ? 'dark' : 'light'} style={styles.tag}>
                      <Text style={styles.tagText}>{interest}</Text>
                    </View>
                  ))
                ) : (
                  <>
                    <BlurView intensity={10} tint={isDark ? 'dark' : 'light'} style={styles.tag}>
                      <Text style={styles.tagText}>{profile.tag}</Text>
                    </View>
                    <BlurView intensity={10} tint={isDark ? 'dark' : 'light'} style={styles.tag}>
                      <Text style={styles.tagText}>Art & Culture</Text>
                    </View>
                  </>
                )}
              </View>
              
              <View style={styles.divider} />
              
              <Text style={styles.aboutTitle}>Lifestyle:</Text>
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailIcon}>📏</Text>
                  <View>
                    <Text style={styles.detailLabel}>Height</Text>
                    <Text style={[styles.detailValue, profile.height ? {} : styles.notAddedText]}>{profile.height ? `${profile.height} cm` : 'Not added'}</Text>
                  </View>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailIcon}>💪</Text>
                  <View>
                    <Text style={styles.detailLabel}>Body Type</Text>
                    <Text style={[styles.detailValue, profile.bodyType === 'Not added' ? styles.notAddedText : {}]}>{profile.bodyType}</Text>
                  </View>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailIcon}>🚬</Text>
                  <View>
                    <Text style={styles.detailLabel}>Smoking</Text>
                    <Text style={[styles.detailValue, profile.smoking === 'Not added' ? styles.notAddedText : {}]}>{profile.smoking}</Text>
                  </View>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailIcon}>🍷</Text>
                  <View>
                    <Text style={styles.detailLabel}>Drinking</Text>
                    <Text style={[styles.detailValue, profile.drinking === 'Not added' ? styles.notAddedText : {}]}>{profile.drinking}</Text>
                  </View>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailIcon}>🏃</Text>
                  <View>
                    <Text style={styles.detailLabel}>Exercise</Text>
                    <Text style={[styles.detailValue, profile.exercise === 'Not added' ? styles.notAddedText : {}]}>{profile.exercise}</Text>
                  </View>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailIcon}>🥗</Text>
                  <View>
                    <Text style={styles.detailLabel}>Diet</Text>
                    <Text style={[styles.detailValue, profile.diet === 'Not added' ? styles.notAddedText : {}]}>{profile.diet}</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.divider} />
              
              <Text style={styles.aboutTitle}>Relationship:</Text>
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailIcon}>💑</Text>
                  <View>
                    <Text style={styles.detailLabel}>Status</Text>
                    <Text style={[styles.detailValue, profile.relationshipStatus === 'Not added' ? styles.notAddedText : {}]}>{profile.relationshipStatus}</Text>
                  </View>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailIcon}>👶</Text>
                  <View>
                    <Text style={styles.detailLabel}>Kids</Text>
                    <Text style={[styles.detailValue, profile.kids === 'Not added' ? styles.notAddedText : {}]}>{profile.kids}</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.divider} />
              
              <Text style={styles.aboutTitle}>Work & Education:</Text>
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailIcon}>💼</Text>
                  <View>
                    <Text style={styles.detailLabel}>Occupation</Text>
                    <Text style={[styles.detailValue, profile.occupation === 'Not added' ? styles.notAddedText : {}]}>{profile.occupation}</Text>
                  </View>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailIcon}>🏢</Text>
                  <View>
                    <Text style={styles.detailLabel}>Company</Text>
                    <Text style={[styles.detailValue, profile.company === 'Not added' ? styles.notAddedText : {}]}>{profile.company}</Text>
                  </View>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailIcon}>🎓</Text>
                  <View>
                    <Text style={styles.detailLabel}>Education</Text>
                    <Text style={[styles.detailValue, profile.graduation === 'Not added' ? styles.notAddedText : {}]}>{profile.graduation}</Text>
                  </View>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailIcon}>🏫</Text>
                  <View>
                    <Text style={styles.detailLabel}>School</Text>
                    <Text style={[styles.detailValue, profile.school === 'Not added' ? styles.notAddedText : {}]}>{profile.school}</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.divider} />
              
              <Text style={styles.aboutTitle}>Location:</Text>
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailIcon}>🏠</Text>
                  <View>
                    <Text style={styles.detailLabel}>Hometown</Text>
                    <Text style={[styles.detailValue, profile.hometown === 'Not added' ? styles.notAddedText : {}]}>{profile.hometown}</Text>
                  </View>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailIcon}>📍</Text>
                  <View>
                    <Text style={styles.detailLabel}>Lives in</Text>
                    <Text style={[styles.detailValue, profile.currentCity === 'Not added' ? styles.notAddedText : {}]}>{profile.currentCity}</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.divider} />
              
              <Text style={styles.aboutTitle}>Languages:</Text>
              <View style={styles.tagsContainer}>
                {profile.languages && profile.languages.length > 0 ? (
                  profile.languages.map((lang, index) => (
                    <BlurView key={index} intensity={10} tint={isDark ? 'dark' : 'light'} style={styles.tagOutline}>
                      <Text style={styles.tagOutlineText}>{lang}</Text>
                    </View>
                  ))
                ) : (
                  <>
                    <BlurView intensity={10} tint={isDark ? 'dark' : 'light'} style={styles.tagOutline}>
                      <Text style={styles.tagOutlineText}>English</Text>
                    </View>
                    <BlurView intensity={10} tint={isDark ? 'dark' : 'light'} style={styles.tagOutline}>
                      <Text style={styles.tagOutlineText}>Spanish</Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          </ScrollView>

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
        </SafeAreaView>
        
        <Modal visible={showFullImage} transparent={true} animationType="fade">
          <View style={styles.fullScreenModal}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowFullImage(false)}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
            {Platform.OS === 'web' ? (
              <OptimizedImage uri={allImages[currentImageIndex]} style={styles.fullScreenImage} />
            ) : (
              <FastImage 
                source={{ uri: allImages[currentImageIndex], priority: FastImage.priority.high }} 
                style={styles.fullScreenImage} 
                resizeMode={FastImage.resizeMode.contain} 
              />
            )}
          </View>
        </Modal>

        <Modal visible={showMenu} transparent={true} animationType="slide">
          <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setShowMenu(false)}>
            <View style={styles.menuModal}>
              <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); }}>
                <Text style={styles.menuItemIcon}>🙅</Text>
                <Text style={styles.menuItemText}>Block User</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); }}>
                <Text style={styles.menuItemIcon}>🚩</Text>
                <Text style={styles.menuItemText}>Report User</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={() => { setShowMenu(false); }}>
                <Text style={styles.menuItemIcon}>🔗</Text>
                <Text style={styles.menuItemText}>Share Profile</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </LinearGradient>
    </View>
  );
}

const getStyles = (theme, isDark) => StyleSheet.create({
  container: { flex: 1 },
  gradientBackground: { flex: 1 },
  safeArea: { flex: 1 },
  backButton: { 
    position: 'absolute', 
    top: 50, 
    left: 20, 
    zIndex: 10, 
    width: 44, 
    height: 44, 
    borderRadius: 22,
    justifyContent: 'center', 
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  backIcon: { fontSize: 16, color: '#fff', fontWeight: '500' },
  menuButton: { 
    position: 'absolute', 
    top: 50, 
    right: 20, 
    zIndex: 10, 
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
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: theme.text, textAlign: 'center', marginTop: 50, marginBottom: 20 },
  content: { flex: 1, paddingHorizontal: 20, paddingBottom: 100 },
  imageContainer: { position: 'relative', marginBottom: 20 },
  imageIndicators: { position: 'absolute', bottom: 15, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  indicator: { width: 8, height: 8, borderRadius: 4 },
  profileImage: { width: '100%', height: 450, borderRadius: 24, marginBottom: 20, justifyContent: 'center', alignItems: 'center' },
  imageStyle: { borderRadius: 24 },
  avatarLetter: { fontSize: 120, fontWeight: 'bold', color: '#fff' },
  infoCard: { borderRadius: 24, padding: 20, marginBottom: 20, overflow: 'hidden', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  infoLabel: { fontSize: 15, fontWeight: '600', color: theme.textSecondary },
  infoValue: { fontSize: 15, color: theme.text, fontWeight: '500' },
  genderIcon: { fontSize: 15, fontWeight: '600' },
  divider: { height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', marginVertical: 15 },
  detailRow: { gap: 16 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  detailIcon: { fontSize: 24 },
  detailLabel: { fontSize: 13, fontWeight: '600', color: theme.textSecondary },
  detailValue: { fontSize: 15, color: theme.text, fontWeight: '500' },
  aboutTitle: { fontSize: 16, fontWeight: '600', color: theme.text, marginBottom: 8 },
  aboutText: { fontSize: 15, color: theme.text, marginBottom: 20 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tag: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)' },
  tagText: { color: theme.text, fontSize: 14, fontWeight: '500' },
  tagOutline: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)' },
  tagOutlineText: { color: theme.text, fontSize: 14, fontWeight: '500' },
  actionButtons: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: 'transparent' },
  actionButton: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? '#1a1a1a' : '#2a2a2a', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)' },
  actionIcon: { fontSize: 24, color: '#fff' },
  likeCount: { fontSize: 10, color: '#fff', marginTop: 2 },
  chatButton: { paddingVertical: 14, borderRadius: 28, alignItems: 'center', backgroundColor: isDark ? '#1a1a1a' : '#2a2a2a', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)' },
  chatButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  fullScreenModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  fullScreenImage: { width: '100%', height: '100%' },
  closeButton: { position: 'absolute', top: 50, right: 20, zIndex: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  closeIcon: { fontSize: 20, color: '#fff', fontWeight: 'bold' },
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  menuModal: { backgroundColor: 'rgba(0,0,0,0.9)', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingVertical: 20 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  menuItemIcon: { fontSize: 24, marginRight: 16 },
  menuItemText: { fontSize: 16, color: '#fff', fontWeight: '500' },
  notAddedText: { color: '#999', fontStyle: 'italic' },
});
