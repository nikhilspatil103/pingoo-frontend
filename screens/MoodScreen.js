import React, { useState, useRef, useCallback, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, Dimensions, TextInput, Modal, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform, useWindowDimensions, RefreshControl } from 'react-native';
import { Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import { API_URL } from '../config/urlConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { FEATURES } from '../config/featureFlags';
import PingooLogo from '../components/PingooLogo';
import PingooLoader from '../assets/brand/PingooLoader';
import PingooLogoStatic from '../components/PingooLogoStatic';

const { width } = Dimensions.get('window');

const TAB_BAR_HEIGHT = 85; // 65px height + 20px bottom offset

export default function MoodScreen({ navigation, route }) {
  const { theme, isDark } = useTheme();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [moods, setMoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [commentModal, setCommentModal] = useState(false);
  const [selectedMood, setSelectedMood] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [postModal, setPostModal] = useState(false);
  const [pendingVideoUri, setPendingVideoUri] = useState(null);
  const [captionInput, setCaptionInput] = useState('');
  const [selectedMoodEmoji, setSelectedMoodEmoji] = useState('vibing');
  const [thumbnailUri, setThumbnailUri] = useState(null);
  const [paused, setPaused] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const flatListRef = useRef(null);
  const videoRefs = useRef({});

  const MOOD_OPTIONS = [
    { label: '😊 Happy', value: 'happy' },
    { label: '😎 Vibing', value: 'vibing' },
    { label: '🥰 Romantic', value: 'romantic' },
    { label: '😢 Sad', value: 'sad' },
    { label: '🤪 Crazy', value: 'crazy' },
    { label: '😴 Bored', value: 'bored' },
    { label: '🔥 Excited', value: 'excited' },
    { label: '🧘 Chill', value: 'chill' },
    { label: '💪 Motivated', value: 'motivated' },
    { label: '🎉 Party', value: 'party' },
  ];

  // Handle deep link from push notification
  useEffect(() => {
    if (route?.params?.moodId && moods.length > 0) {
      const targetIndex = moods.findIndex(m => m.id === route.params.moodId);
      if (targetIndex !== -1) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({ index: targetIndex, animated: true });
          if (route.params.openComments) {
            setSelectedMood(moods[targetIndex]);
            setCommentModal(true);
          }
        }, 500);
      }
      navigation.setParams({ moodId: undefined, openComments: undefined });
    }
  }, [route?.params?.moodId, moods]);

  const [isScreenActive, setIsScreenActive] = useState(true);

  // Pause videos when navigating to another screen (e.g. ProfileView)
  useEffect(() => {
    const unsubBlur = navigation.addListener('blur', () => {
      setIsScreenActive(false);
      Object.values(videoRefs.current).forEach(ref => ref?.pauseAsync?.());
    });
    const unsubFocus = navigation.addListener('focus', () => {
      setIsScreenActive(true);
      const currentMood = moods[currentIndex];
      if (currentMood && videoRefs.current[currentMood.id] && !paused) {
        videoRefs.current[currentMood.id].playAsync?.();
      }
    });
    return () => { unsubBlur(); unsubFocus(); };
  }, [navigation, currentIndex, moods, paused]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setHasMore(true);
    await fetchMoods(1);
    setRefreshing(false);
  }, []);

  const hasFetched = useRef(false);

  // Check if user has seen moods onboarding
  useEffect(() => {
    const checkOnboarding = async () => {
      const seen = await AsyncStorage.getItem('moodOnboardingSeen');
      if (seen) setShowOnboarding(true);
    };
    checkOnboarding();
  }, []);

  const dismissOnboarding = async () => {
    await AsyncStorage.setItem('moodOnboardingSeen', 'true');
    setShowOnboarding(false);
  };

  useFocusEffect(
    useCallback(() => {
      if (!hasFetched.current) {
        fetchMoods(1);
        hasFetched.current = true;
      }
    }, [])
  );

  const fetchMoods = async (p = 1) => {
    if (p > 1 && (loadingMore || !hasMore)) return;
    if (p > 1) setLoadingMore(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/moods?page=${p}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.moods.length === 0) {
          setHasMore(false);
        } else {
          if (p === 1) {
            setMoods(data.moods);
            setHasMore(true);
          } else {
            setMoods(prev => {
              const existingIds = new Set(prev.map(m => m.id));
              const newMoods = data.moods.filter(m => !existingIds.has(m.id));
              return [...prev, ...newMoods];
            });
          }
          setPage(p);
        }
      }
    } catch (e) {
      console.error('Error fetching moods:', e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const recordMood = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required to record mood');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      videoMaxDuration: 15,
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      const duration = result.assets[0].duration;
      if (duration && duration > 15000) {
        Alert.alert('Too Long', 'Video must be 15 seconds or less. Please record a shorter video.');
        return;
      }
      setPendingVideoUri(result.assets[0].uri);
      setCaptionInput('');
      setSelectedMoodEmoji('vibing');
      setPostModal(true);
    }
  };

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      videoMaxDuration: 15,
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      const duration = result.assets[0].duration;
      if (duration && duration > 15000) {
        Alert.alert('Too Long', 'Video must be 15 seconds or less. Please pick a shorter video.');
        return;
      }
      setPendingVideoUri(result.assets[0].uri);
      setCaptionInput('');
      setSelectedMoodEmoji('vibing');
      setPostModal(true);
    }
  };

  const pickThumbnail = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setThumbnailUri(result.assets[0].uri);
    }
  };

  const uploadMood = async () => {
    if (!pendingVideoUri) return;
    setPostModal(false);
    setUploading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const base64 = await fetch(pendingVideoUri).then(r => r.blob()).then(blob => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      });

      let thumbnailBase64 = null;
      if (thumbnailUri) {
        thumbnailBase64 = await fetch(thumbnailUri).then(r => r.blob()).then(blob => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
        });
      }

      const res = await fetch(`${API_URL}/mood`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ video: base64, thumbnail: thumbnailBase64, caption: captionInput.trim(), mood: selectedMoodEmoji })
      });

      if (res.ok) {
        const data = await res.json();
        // Get current user info from AsyncStorage
        const userData = await AsyncStorage.getItem('user');
        const parsed = userData ? JSON.parse(userData) : {};
        
        // Prepend the new mood to feed so user sees it once at top
        const newMoodItem = {
          id: data.mood._id,
          user: {
            id: parsed.userId || '',
            name: parsed.name || 'You',
            age: parsed.age || '',
            profilePhoto: parsed.profilePhoto || null,
            gender: parsed.gender || '',
            isOnline: true
          },
          videoUrl: data.mood.videoUrl,
          thumbnailUrl: data.mood.thumbnailUrl || null,
          caption: captionInput.trim(),
          mood: selectedMoodEmoji,
          likesCount: 0,
          isLiked: false,
          comments: [],
          commentsCount: 0,
          views: 0,
          createdAt: new Date().toISOString()
        };
        setMoods(prev => [newMoodItem, ...prev]);
        Alert.alert('🎉 Mood Posted!', 'Your mood is now live');
      } else {
        const err = await res.json();
        Alert.alert('Error', err.error || 'Failed to upload');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to upload mood video');
    } finally {
      setUploading(false);
      setPendingVideoUri(null);
      setThumbnailUri(null);
    }
  };

  const likeMood = async (moodId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/mood/${moodId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMoods(prev => prev.map(m => m.id === moodId ? { ...m, isLiked: data.isLiked, likesCount: data.likesCount } : m));
      }
    } catch (e) {
      console.error('Error liking mood:', e);
    }
  };

  const postComment = async () => {
    if (!commentText.trim() || !selectedMood) return;
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/mood/${selectedMood.id}/comment`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: commentText.trim() })
      });
      if (res.ok) {
        const data = await res.json();
        setMoods(prev => prev.map(m => m.id === selectedMood.id
          ? { ...m, comments: [...m.comments, data.comment], commentsCount: m.commentsCount + 1 }
          : m
        ));
        setSelectedMood(prev => ({ ...prev, comments: [...prev.comments, data.comment] }));
        setCommentText('');
      }
    } catch (e) {
      console.error('Error posting comment:', e);
    }
  };

  const viewedMoods = useRef(new Set()).current;

  const trackView = async (moodId) => {
    if (!FEATURES.MOOD_VIEWS_TRACKING) return;
    if (viewedMoods.has(moodId)) return;
    viewedMoods.add(moodId);
    try {
      const token = await AsyncStorage.getItem('token');
      await fetch(`${API_URL}/mood/${moodId}/view`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setMoods(prev => prev.map(m => m.id === moodId ? { ...m, views: (m.views || 0) + 1 } : m));
    } catch (e) {
      // Silent fail for view tracking
    }
  };

  const initiateMoodChat = async (targetUser) => {
    try {
      const token = await AsyncStorage.getItem('token');
      // Check if already has access
      const checkRes = await fetch(`${API_URL}/chat-access/${targetUser.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const checkData = await checkRes.json();

      if (checkData.hasAccess) {
        // Already has access, go directly to chat
        navigation.navigate('Chat', { profile: targetUser });
        return;
      }

      Alert.alert(
        '💬 Start Chat',
        `Send a message to ${targetUser.name}? This costs 30 coins for 6 hours of chat access.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Pay 30 Coins', onPress: async () => {
              try {
                const res = await fetch(`${API_URL}/mood-chat/${targetUser.id}`, {
                  method: 'POST',
                  headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (res.ok) {
                  navigation.navigate('Chat', { profile: targetUser });
                } else {
                  Alert.alert('❌ Error', data.error || 'Failed to purchase chat');
                }
              } catch (e) {
                Alert.alert('Error', 'Something went wrong');
              }
            }
          }
        ]
      );
    } catch (e) {
      Alert.alert('Error', 'Something went wrong');
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index;
      setCurrentIndex(newIndex);
      setPaused(false);
    }
  }).current;

  // Only play/pause the current video — don't iterate all refs
  useEffect(() => {
    if (!isScreenActive) return;
    const prevMood = moods[currentIndex - 1];
    const nextMood = moods[currentIndex + 1];
    const currentMood = moods[currentIndex];

    // Pause adjacent videos
    if (prevMood && videoRefs.current[prevMood.id]) videoRefs.current[prevMood.id].pauseAsync?.();
    if (nextMood && videoRefs.current[nextMood.id]) videoRefs.current[nextMood.id].pauseAsync?.();

    // Play current
    if (currentMood && videoRefs.current[currentMood.id] && !paused) {
      videoRefs.current[currentMood.id].playAsync?.();
    }

    // Track view
    if (currentMood) trackView(currentMood.id);
  }, [currentIndex, isScreenActive]);

  // Pause/play on tab focus
  useFocusEffect(
    useCallback(() => {
      // Resume current video on tab focus
      if (!paused) {
        const currentMood = moods[currentIndex];
        if (currentMood && videoRefs.current[currentMood.id]) {
          videoRefs.current[currentMood.id].playAsync?.();
        }
      }
      return () => {
        // Pause all videos on tab blur
        Object.values(videoRefs.current).forEach(ref => ref?.pauseAsync?.());
      };
    }, [currentIndex, moods])
  );

  const [reportModal, setReportModal] = useState(false);
  const [reportMoodId, setReportMoodId] = useState(null);

  const reportMood = (moodId) => {
    setReportMoodId(moodId);
    setReportModal(true);
  };

  const submitReport = async (reason) => {
    if (!reportMoodId) return;
    setReportModal(false);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/mood/${reportMoodId}/report`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert('✅ Reported', 'Thanks for keeping the community safe.');
        if (data.hidden) {
          setMoods(prev => prev.filter(m => m.id !== reportMoodId));
        }
      } else {
        Alert.alert('Error', data.error || 'Failed to report');
      }
    } catch (e) {
      Alert.alert('Error', 'Something went wrong');
    }
    setReportMoodId(null);
  };

  const togglePlayPause = () => {
    const currentMood = moods[currentIndex];
    if (!currentMood) return;
    const ref = videoRefs.current[currentMood.id];
    if (!ref) return;
    if (paused) {
      ref.playAsync();
      setPaused(false);
    } else {
      ref.pauseAsync();
      setPaused(true);
    }
  };

  // Cleanup stale video refs to prevent memory leaks
  useEffect(() => {
    const activeIds = new Set(moods.map(m => m.id));
    Object.keys(videoRefs.current).forEach(id => {
      if (!activeIds.has(id)) {
        videoRefs.current[id]?.unloadAsync?.();
        delete videoRefs.current[id];
      }
    });
  }, [moods]);

  const renderMoodItem = useCallback(({ item, index }) => (
    <View style={[styles.moodItem, { height: screenHeight, width: screenWidth }]}>
      <Video
        ref={ref => { videoRefs.current[item.id] = ref; }}
        source={{ uri: item.videoUrl }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
        resizeMode="cover"
        shouldPlay={index === currentIndex && !paused && isScreenActive}
        isLooping
        isMuted={false}
        progressUpdateIntervalMillis={0}
        videoStyle={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />

      {/* Invisible tap to play/pause */}
      <TouchableOpacity style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }} activeOpacity={1} onPress={togglePlayPause}>
        {paused && index === currentIndex && (
          <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="play" size={30} color="#fff" />
          </View>
        )}
      </TouchableOpacity>

      {/* User info at bottom */}
      <View style={styles.bottomInfo}>
        <TouchableOpacity style={styles.userRow} onPress={() => navigation.navigate('ProfileView', { profile: item.user })}>
          {item.user.profilePhoto ? (
            <Image source={{ uri: item.user.profilePhoto }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>{item.user.name?.[0]}</Text>
            </View>
          )}
          <View>
            <Text style={styles.userName}>{item.user.name}, {item.user.age}</Text>
            {item.mood && <Text style={styles.moodTag}>Mood: {item.mood}</Text>}
          </View>
          {item.user.isOnline && <View style={styles.onlineDot} />}
        </TouchableOpacity>
        {item.caption ? <Text style={styles.caption}>{item.caption}</Text> : null}
        <View style={styles.viewsRow}>
          <Text style={styles.viewsText}>👁 {item.views} views</Text>
        </View>
      </View>

      {/* Right side actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => likeMood(item.id)}>
          <Ionicons name={item.isLiked ? 'heart' : 'heart-outline'} size={28} color={item.isLiked ? '#FF3B30' : '#fff'} />
          <Text style={styles.actionCount}>{item.likesCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={() => { setSelectedMood(item); setCommentModal(true); }}>
          <Ionicons name="chatbubble-outline" size={26} color="#fff" />
          <Text style={styles.actionCount}>{item.commentsCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={() => initiateMoodChat(item.user)}>
          <Ionicons name="paper-plane-outline" size={26} color="#fff" />
          <Text style={styles.actionCount}>Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('ProfileView', { profile: item.user })}>
          <Ionicons name="person-circle-outline" size={28} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={() => reportMood(item.id)}>
          <Ionicons name="flag-outline" size={22} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>
      </View>
    </View>
  ), [currentIndex, paused, isScreenActive, screenHeight, screenWidth]);

  const styles = getStyles(theme, isDark);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <PingooLoader />
        <Text style={styles.loadingText}>Loading moods...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <PingooLogoStatic size={28} />
          <Text style={styles.headerTitle}>Moods</Text>
        </View>
        <TouchableOpacity
          style={styles.recordBtn}
          onPress={() => Alert.alert('Post Mood', 'Choose option', [
            { text: 'Record Video 🎥', onPress: recordMood },
            { text: 'Pick from Gallery 📁', onPress: pickVideo },
            { text: 'Cancel', style: 'cancel' }
          ])}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="add-circle-outline" size={18} color="#fff" />
              <Text style={styles.recordBtnText}>Post Mood</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {moods.length === 0 ? (
        <View style={styles.onboarding}>
          <View style={styles.onboardingContent}>
            <Text style={styles.onboardingEmoji}>🫧</Text>
            <Text style={styles.onboardingTitle}>Welcome to Moods!</Text>
            <Text style={styles.onboardingDesc}>Share what you’re feeling right now! Record a quick video, show your vibe, and let people ping you. It’s like Snaps but for dating — Your mood stays live for 7 days — keep posting to build streaks! 🔥</Text>
            
            <View style={styles.onboardingSteps}>
              <View style={styles.stepRow}>
                <View style={styles.stepIcon}><Text style={styles.stepNum}>1</Text></View>
                <Text style={styles.stepText}>Record or pick a 15s video</Text>
              </View>
              <View style={styles.stepRow}>
                <View style={styles.stepIcon}><Text style={styles.stepNum}>2</Text></View>
                <Text style={styles.stepText}>Add a caption & mood emoji</Text>
              </View>
              <View style={styles.stepRow}>
                <View style={styles.stepIcon}><Text style={styles.stepNum}>3</Text></View>
                <Text style={styles.stepText}>Get likes, comments & new matches!</Text>
              </View>
              <View style={styles.stepRow}>
                <View style={styles.stepIcon}><Text style={styles.stepNum}>4</Text></View>
                <Text style={styles.stepText}>Ping someone via their mood — start a convo!</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.onboardingBtn} 
              onPress={() => Alert.alert('Post Mood', 'Choose option', [
                { text: 'Record Video 🎥', onPress: recordMood },
                { text: 'Pick from Gallery 📁', onPress: pickVideo },
                { text: 'Cancel', style: 'cancel' }
              ])}
            >
              <Text style={styles.onboardingBtnText}>🚀 Post Your First Mood</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          {showOnboarding && (
            <View style={styles.onboardingOverlay}>
              <View style={styles.onboardingOverlayContent}>
                <Text style={styles.onboardingEmoji}>🫧</Text>
                <Text style={styles.onboardingTitle}>Welcome to Moods!</Text>
                <Text style={styles.onboardingDesc}>Share what you’re feeling right now! Moods are like video statuses — show your vibe, get pinged by people who feel the same. Each mood stays live for 7 days. Think Snaps meets dating 🔥</Text>
            
            <View style={styles.onboardingSteps}>
              <View style={styles.stepRow}>
                <View style={styles.stepIcon}><Text style={styles.stepNum}>↑</Text></View>
                <Text style={styles.stepText}>Swipe up to watch people’s moods</Text>
              </View>
              <View style={styles.stepRow}>
                <View style={styles.stepIcon}><Text style={styles.stepNum}>❤️</Text></View>
                <Text style={styles.stepText}>Like & comment on vibes you connect with</Text>
              </View>
              <View style={styles.stepRow}>
                <View style={styles.stepIcon}><Text style={styles.stepNum}>📨</Text></View>
                <Text style={styles.stepText}>Ping someone via their mood to start a chat</Text>
              </View>
              <View style={styles.stepRow}>
                <View style={styles.stepIcon}><Text style={styles.stepNum}>+</Text></View>
                <Text style={styles.stepText}>Post your mood — keep the streak going! 🔥</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.onboardingBtn} onPress={dismissOnboarding}>
              <Text style={styles.onboardingBtnText}>Got it! Let’s Go 🙌</Text>
            </TouchableOpacity>
              </View>
            </View>
          )}
          <FlatList
          ref={flatListRef}
          data={moods}
          renderItem={renderMoodItem}
          keyExtractor={item => item.id}
          pagingEnabled
          snapToAlignment="start"
          getItemLayout={(data, index) => ({ length: screenHeight, offset: screenHeight * index, index })}
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B9D" />}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
          onEndReached={() => { if (isScreenActive && hasMore && !loadingMore) fetchMoods(page + 1); }}
          onEndReachedThreshold={2}
          style={{ flex: 1, width: screenWidth }}
          removeClippedSubviews={true}
          maxToRenderPerBatch={3}
          windowSize={5}
          initialNumToRender={2}
          updateCellsBatchingPeriod={100}
        />
        </>
      )}

      {/* Post Mood Modal — Caption + Mood Picker */}
      <Modal visible={postModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.commentModalOverlay}>
          <TouchableOpacity style={styles.commentModalDismiss} onPress={() => { setPostModal(false); setPendingVideoUri(null); }} />
          <View style={[styles.postModalContent, { backgroundColor: isDark ? '#1a0a2e' : '#fff' }]}>
            <View style={styles.commentHeader}>
              <Text style={[styles.commentTitle, { color: theme.text }]}>Post Your Mood 🫧</Text>
              <TouchableOpacity onPress={() => { setPostModal(false); setPendingVideoUri(null); }}>
                <Text style={{ fontSize: 24, color: theme.text }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Caption Input */}
            <TextInput
              style={[styles.captionInput, { color: theme.text, borderColor: isDark ? '#333' : '#ddd' }]}
              placeholder="What's your mood? Write a caption..."
              placeholderTextColor={theme.textSecondary}
              value={captionInput}
              onChangeText={setCaptionInput}
              maxLength={150}
              multiline
            />
            <Text style={[styles.charCount, { color: theme.textSecondary }]}>{captionInput.length}/150</Text>

            {/* Thumbnail Picker */}
            <Text style={[styles.moodPickerLabel, { color: theme.text }]}>Thumbnail:</Text>
            <TouchableOpacity style={styles.thumbnailPicker} onPress={pickThumbnail}>
              {thumbnailUri ? (
                <Image source={{ uri: thumbnailUri }} style={styles.thumbnailPreview} />
              ) : (
                <View style={styles.thumbnailPlaceholder}>
                  <Ionicons name="image-outline" size={32} color={theme.textSecondary} />
                  <Text style={[styles.thumbnailText, { color: theme.textSecondary }]}>Pick thumbnail from gallery</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Mood Emoji Picker */}
            <Text style={[styles.moodPickerLabel, { color: theme.text }]}>Select your mood:</Text>
            <View style={styles.moodGrid}>
              {MOOD_OPTIONS.map(m => (
                <TouchableOpacity
                  key={m.value}
                  style={[styles.moodChip, selectedMoodEmoji === m.value && styles.moodChipActive]}
                  onPress={() => setSelectedMoodEmoji(m.value)}
                >
                  <Text style={[styles.moodChipText, selectedMoodEmoji === m.value && styles.moodChipTextActive]}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Post Button */}
            <TouchableOpacity style={styles.postBtn} onPress={uploadMood}>
              <Text style={styles.postBtnText}>🚀 Post Mood</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Report Modal */}
      <Modal visible={reportModal} transparent animationType="fade">
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }} activeOpacity={1} onPress={() => setReportModal(false)}>
          <View style={{ width: '80%', borderRadius: 16, padding: 20, backgroundColor: isDark ? '#1a0a2e' : '#fff' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 16 }}>🚩 Report Mood</Text>
            <Text style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 16 }}>Why are you reporting this?</Text>
            {['Nudity/Sexual content', 'Violence/Abuse', 'Spam/Fake content', 'Harassment'].map(reason => (
              <TouchableOpacity key={reason} style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }} onPress={() => submitReport(reason)}>
                <Text style={{ fontSize: 15, color: theme.text }}>{reason}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={{ paddingVertical: 12, marginTop: 8 }} onPress={() => setReportModal(false)}>
              <Text style={{ fontSize: 15, color: '#FF6B9D', textAlign: 'center', fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Comments Modal */}
      <Modal visible={commentModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20} style={styles.commentModalOverlay}>
          <TouchableOpacity style={styles.commentModalDismiss} onPress={() => setCommentModal(false)} />
          <View style={[styles.commentModalContent, { backgroundColor: isDark ? '#1a0a2e' : '#fff' }]}>
            <View style={styles.commentHeader}>
              <Text style={[styles.commentTitle, { color: theme.text }]}>Comments ({selectedMood?.commentsCount || 0})</Text>
              <TouchableOpacity onPress={() => setCommentModal(false)}>
                <Text style={{ fontSize: 24, color: theme.text }}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={selectedMood?.comments || []}
              keyExtractor={(item, i) => item.id || i.toString()}
              renderItem={({ item }) => (
                <View style={styles.commentItem}>
                  {item.user.profilePhoto ? (
                    <Image source={{ uri: item.user.profilePhoto }} style={styles.commentAvatar} />
                  ) : (
                    <View style={[styles.commentAvatar, styles.avatarPlaceholder]}>
                      <Text style={styles.avatarText}>{item.user.name?.[0]}</Text>
                    </View>
                  )}
                  <View style={styles.commentBody}>
                    <Text style={[styles.commentUser, { color: theme.text }]}>{item.user.name}</Text>
                    <Text style={[styles.commentText, { color: theme.textSecondary }]}>{item.text}</Text>
                  </View>
                </View>
              )}
              ListEmptyComponent={<Text style={[styles.emptySubtext, { textAlign: 'center', marginTop: 40 }]}>No comments yet</Text>}
            />

            <View style={styles.commentInputRow}>
              <TextInput
                style={[styles.commentInput, { color: theme.text, borderColor: isDark ? '#333' : '#ddd' }]}
                placeholder="Add a comment..."
                placeholderTextColor={theme.textSecondary}
                value={commentText}
                onChangeText={setCommentText}
                maxLength={200}
              />
              <TouchableOpacity style={styles.sendBtn} onPress={postComment}>
                <Text style={styles.sendBtnText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const getStyles = (theme, isDark) => StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  onboarding: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  onboardingContent: { alignItems: 'center', width: '100%' },
  onboardingEmoji: { fontSize: 70, marginBottom: 16 },
  onboardingTitle: { fontSize: 26, fontWeight: 'bold', color: '#fff', marginBottom: 12 },
  onboardingDesc: { fontSize: 15, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 22, marginBottom: 30 },
  onboardingSteps: { width: '100%', marginBottom: 30 },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  stepIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FF6B9D', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  stepNum: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  stepText: { fontSize: 15, color: 'rgba(255,255,255,0.85)', flex: 1 },
  onboardingBtn: { backgroundColor: '#FF6B9D', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 30, width: '100%', alignItems: 'center' },
  onboardingBtnText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  onboardingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 100, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  onboardingOverlayContent: { alignItems: 'center', width: '100%' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 8, paddingTop: 10,
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginLeft: 8 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center' },
  recordBtn: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, alignItems: 'center' },
  recordBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  loadingText: { color: '#fff', marginTop: 12 },
  emptyText: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 16 },
  emptySubtext: { color: '#aaa', fontSize: 14, marginTop: 8 },
  moodItem: { position: 'relative', overflow: 'hidden', backgroundColor: '#000' },
  bottomInfo: { position: 'absolute', bottom: 100, left: 16, right: 70 },
  userRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10, borderWidth: 2, borderColor: '#FF6B9D' },
  avatarPlaceholder: { backgroundColor: '#FF6B9D', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  userName: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  moodTag: { color: '#FFD93D', fontSize: 12, marginTop: 2 },
  onlineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4ECDC4', marginLeft: 8 },
  caption: { color: '#fff', fontSize: 14, marginTop: 4 },
  actions: { position: 'absolute', right: 12, bottom: 100, alignItems: 'center', gap: 20 },
  actionBtn: { alignItems: 'center' },
  actionIcon: { fontSize: 28 },
  actionCount: { color: '#fff', fontSize: 12, marginTop: 4, fontWeight: '600' },
  viewsRow: { flexDirection: 'row', marginTop: 8 },
  viewsText: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  // Post modal
  postModalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  captionInput: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15, minHeight: 60, textAlignVertical: 'top', marginBottom: 4 },
  charCount: { fontSize: 12, textAlign: 'right', marginBottom: 16 },
  moodPickerLabel: { fontSize: 15, fontWeight: '600', marginBottom: 10 },
  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  moodChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#FF6B9D' },
  moodChipActive: { backgroundColor: '#FF6B9D' },
  moodChipText: { fontSize: 13, color: '#FF6B9D' },
  moodChipTextActive: { color: '#fff', fontWeight: 'bold' },
  postBtn: { backgroundColor: '#FF6B9D', paddingVertical: 14, borderRadius: 25, alignItems: 'center' },
  postBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  thumbnailPicker: { marginBottom: 16, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#FF6B9D', borderStyle: 'dashed' },
  thumbnailPreview: { width: '100%', height: 120, borderRadius: 12 },
  thumbnailPlaceholder: { height: 80, justifyContent: 'center', alignItems: 'center', gap: 6 },
  thumbnailText: { fontSize: 13 },
  // Comment modal
  commentModalOverlay: { flex: 1, justifyContent: 'flex-end' },
  commentModalDismiss: { flex: 1 },
  commentModalContent: { maxHeight: '55%', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: Platform.OS === 'android' ? 20 : 16 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  commentTitle: { fontSize: 18, fontWeight: 'bold' },
  commentItem: { flexDirection: 'row', marginBottom: 16 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 10 },
  commentBody: { flex: 1 },
  commentUser: { fontWeight: 'bold', fontSize: 13, marginBottom: 2 },
  commentText: { fontSize: 14 },
  commentInputRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  commentInput: { flex: 1, height: 40, borderWidth: 1, borderRadius: 20, paddingHorizontal: 16, fontSize: 14 },
  sendBtn: { marginLeft: 10, backgroundColor: '#FF6B9D', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  sendBtnText: { color: '#fff', fontWeight: 'bold' },
});
