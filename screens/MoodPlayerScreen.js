import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, useWindowDimensions, FlatList, Image, TextInput, Modal, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/urlConfig';
import { MoodEmojiOverlay } from '../components/MoodEmoji';

export default function MoodPlayerScreen({ route, navigation }) {
  const { mood, moods: initialMoods, startIndex } = route.params;
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  
  // Support single mood or array of moods
  const [moods, setMoods] = useState(initialMoods || (mood ? [mood] : []));
  const [currentIndex, setCurrentIndex] = useState(startIndex || 0);
  const [paused, setPaused] = useState(false);
  const [commentModal, setCommentModal] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [chatModal, setChatModal] = useState(false);
  const [chatTargetUser, setChatTargetUser] = useState(null);
  const [userCoins, setUserCoins] = useState(0);
  const videoRefs = useRef({});
  const flatListRef = useRef(null);

  const currentMood = moods[currentIndex];

  const viewableChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
      setPaused(false);
    }
  }).current;
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  // Track view
  useEffect(() => {
    if (currentMood?.id) trackView(currentMood.id);
  }, [currentIndex]);

  const trackView = async (moodId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await fetch(`${API_URL}/mood/${moodId}/view`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) {}
  };

  const toggleLike = async (moodId) => {
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
    } catch (e) {}
  };

  const openComments = async (moodId) => {
    setCommentModal(true);
    setLoadingComments(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/moods?page=1`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const found = data.moods?.find(m => m.id === moodId);
        setComments(found?.comments || []);
      }
    } catch (e) {}
    setLoadingComments(false);
  };

  const postComment = async () => {
    if (!commentText.trim()) return;
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/mood/${currentMood.id}/comment`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: commentText.trim() })
      });
      if (res.ok) {
        const data = await res.json();
        setComments(prev => [...prev, data.comment]);
        setCommentText('');
      }
    } catch (e) {}
  };

  const startChat = async (user) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const checkRes = await fetch(`${API_URL}/chat-access/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const checkData = await checkRes.json();

      if (checkData.hasAccess) {
        navigation.navigate('Chat', { profile: user });
        return;
      }

      const coinsRes = await fetch(`${API_URL}/coins`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const coinsData = await coinsRes.json();
      setUserCoins(coinsData.coins || 0);
      setChatTargetUser(user);
      setChatModal(true);
    } catch (e) {
      Alert.alert('Error', 'Something went wrong');
    }
  };

  const handlePayForChat = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/mood-chat/${chatTargetUser.id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setChatModal(false);
      if (res.ok) {
        navigation.navigate('Chat', { profile: chatTargetUser });
      } else {
        Alert.alert('\u274C Error', data.error || 'Failed to purchase chat');
      }
    } catch (e) {
      setChatModal(false);
      Alert.alert('Error', 'Something went wrong');
    }
  };

  const renderMood = ({ item, index }) => (
    <View style={[styles.moodContainer, { width: screenWidth, height: screenHeight }]}>
      <Video
        ref={ref => { videoRefs.current[item.id] = ref; }}
        source={{ uri: item.videoUrl }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
        resizeMode="cover"
        shouldPlay={index === currentIndex && !paused}
        isLooping
        isMuted={false}
        videoStyle={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />

      {/* Tap to pause/play */}
      <TouchableOpacity
        style={styles.tapArea}
        activeOpacity={1}
        onPress={() => {
          const ref = videoRefs.current[item.id];
          if (paused) { ref?.playAsync(); setPaused(false); }
          else { ref?.pauseAsync(); setPaused(true); }
        }}
      >
        {paused && index === currentIndex && (
          <View style={styles.pauseIcon}>
            <Ionicons name="play" size={40} color="#fff" />
          </View>
        )}
      </TouchableOpacity>

      {/* Mood emoji overlay */}
      {item.mood && <MoodEmojiOverlay mood={item.mood} />}

      {/* Bottom info */}
      <View style={styles.bottomInfo}>
        <TouchableOpacity style={styles.userRow} onPress={() => { if (item.user) navigation.navigate('ProfileView', { profile: item.user }); }}>
          {item.user?.profilePhoto ? (
            <Image source={{ uri: item.user.profilePhoto }} style={styles.userAvatar} />
          ) : (
            <View style={[styles.userAvatar, styles.userAvatarPlaceholder]}>
              <Text style={styles.userAvatarText}>{item.user?.name?.[0] || '?'}</Text>
            </View>
          )}
          <View>
            <Text style={styles.userName}>{item.user?.name || 'User'}{item.user?.age ? `, ${item.user.age}` : ''}</Text>
            {item.mood && <Text style={styles.moodText}>Mood: {item.mood}</Text>}
          </View>
        </TouchableOpacity>
        {item.caption ? <Text style={styles.caption}>{item.caption}</Text> : null}
        <Text style={styles.views}>👁 {item.views || 0} views</Text>
      </View>

      {/* Right actions */}
      <View style={styles.rightActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => toggleLike(item.id)}>
          <Ionicons name={item.isLiked ? 'heart' : 'heart-outline'} size={28} color={item.isLiked ? '#FF3B30' : '#fff'} />
          <Text style={styles.actionText}>{item.likesCount || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => openComments(item.id)}>
          <Ionicons name="chatbubble-outline" size={26} color="#fff" />
          <Text style={styles.actionText}>{item.commentsCount || 0}</Text>
        </TouchableOpacity>
        {item.user && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => startChat(item.user)}>
            <Ionicons name="paper-plane-outline" size={26} color="#fff" />
            <Text style={styles.actionText}>Chat</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Moods</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        ref={flatListRef}
        data={moods}
        renderItem={renderMood}
        keyExtractor={item => item.id?.toString()}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        initialScrollIndex={startIndex || 0}
        getItemLayout={(_, index) => ({ length: screenHeight, offset: screenHeight * index, index })}
        onViewableItemsChanged={viewableChanged}
        viewabilityConfig={viewabilityConfig}
      />

      {/* Comments Modal */}
      <Modal visible={commentModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.commentOverlay}>
          <TouchableOpacity style={styles.commentBackdrop} onPress={() => setCommentModal(false)} />
          <View style={styles.commentSheet}>
            <View style={styles.commentHeader}>
              <Text style={styles.commentTitle}>Comments</Text>
              <TouchableOpacity onPress={() => setCommentModal(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={comments}
              keyExtractor={(item, i) => item.id?.toString() || i.toString()}
              style={styles.commentList}
              renderItem={({ item }) => (
                <View style={styles.commentItem}>
                  {item.user?.profilePhoto ? (
                    <Image source={{ uri: item.user.profilePhoto }} style={styles.commentAvatar} />
                  ) : (
                    <View style={[styles.commentAvatar, { backgroundColor: '#FF6B9D', justifyContent: 'center', alignItems: 'center' }]}>
                      <Text style={{ color: '#fff', fontWeight: 'bold' }}>{item.user?.name?.[0]}</Text>
                    </View>
                  )}
                  <View style={styles.commentContent}>
                    <Text style={styles.commentUser}>{item.user?.name}</Text>
                    <Text style={styles.commentText}>{item.text}</Text>
                  </View>
                </View>
              )}
              ListEmptyComponent={<Text style={styles.noComments}>{loadingComments ? 'Loading...' : 'No comments yet'}</Text>}
            />
            <View style={styles.commentInput}>
              <TextInput
                style={styles.commentTextInput}
                placeholder="Add a comment..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={commentText}
                onChangeText={setCommentText}
              />
              <TouchableOpacity onPress={postComment}>
                <Ionicons name="send" size={22} color="#FF6B9D" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      {/* Chat Coin Modal */}
      <Modal visible={chatModal} transparent animationType="fade">
        <View style={styles.chatModalOverlay}>
          <View style={styles.chatModalContent}>
            <View style={styles.chatModalHeader}>
              <Text style={styles.chatModalEmoji}>💬</Text>
              <Text style={styles.chatModalTitle}>Start Chat</Text>
            </View>
            <Text style={styles.chatModalDesc}>
              Send a message to {chatTargetUser?.name}?{"\n"}This costs 30 coins for 6 hours of chat access.
            </Text>
            <View style={styles.chatModalBalance}>
              <Text style={styles.chatModalCoinIcon}>🪙</Text>
              <Text style={styles.chatModalBalanceText}>Your Balance: </Text>
              <Text style={[styles.chatModalBalanceAmount, { color: userCoins >= 30 ? '#4CAF50' : '#FF5252' }]}>{userCoins} coins</Text>
            </View>
            <View style={styles.chatModalActions}>
              <TouchableOpacity style={styles.chatModalCancelBtn} onPress={() => setChatModal(false)}>
                <Text style={styles.chatModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.chatModalPayBtn, userCoins < 30 && { opacity: 0.5 }]} onPress={handlePayForChat} disabled={userCoins < 30}>
                <Text style={styles.chatModalPayText}>🪙 Pay 30 Coins</Text>
              </TouchableOpacity>
            </View>
            {userCoins < 30 && (
              <TouchableOpacity onPress={() => { setChatModal(false); navigation.navigate('MyCoins'); }}>
                <Text style={styles.chatModalGetCoins}>Not enough coins? Get more →</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { position: 'absolute', top: 50, left: 0, right: 0, zIndex: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  moodContainer: { position: 'relative', backgroundColor: '#000' },
  tapArea: { position: 'absolute', top: 0, left: 0, right: 60, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  pauseIcon: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  bottomInfo: { position: 'absolute', bottom: 80, left: 16, right: 70 },
  userRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  userAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10, borderWidth: 2, borderColor: '#FF6B9D' },
  userAvatarPlaceholder: { backgroundColor: '#FF6B9D', justifyContent: 'center', alignItems: 'center' },
  userAvatarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  userName: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  moodText: { color: '#FFD93D', fontSize: 12, marginTop: 2 },
  caption: { color: '#fff', fontSize: 14, marginTop: 4 },
  views: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 8 },
  rightActions: { position: 'absolute', right: 12, bottom: 80, alignItems: 'center', gap: 20 },
  actionBtn: { alignItems: 'center' },
  actionText: { color: '#fff', fontSize: 12, marginTop: 4 },
  commentOverlay: { flex: 1, justifyContent: 'flex-end' },
  commentBackdrop: { flex: 1 },
  commentSheet: { backgroundColor: '#1a0a2e', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '60%', padding: 16 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  commentTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  commentList: { maxHeight: '70%' },
  commentItem: { flexDirection: 'row', marginBottom: 12 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 10 },
  commentContent: { flex: 1 },
  commentUser: { color: '#FF6B9D', fontSize: 13, fontWeight: '600' },
  commentText: { color: '#fff', fontSize: 14, marginTop: 2 },
  noComments: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', paddingVertical: 30 },
  commentInput: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 12, marginTop: 8 },
  commentTextInput: { flex: 1, color: '#fff', fontSize: 15, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20, marginRight: 10 },
  chatModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  chatModalContent: { backgroundColor: '#1a0a2e', borderRadius: 24, padding: 24, width: '100%', alignItems: 'center' },
  chatModalHeader: { alignItems: 'center', marginBottom: 12 },
  chatModalEmoji: { fontSize: 40, marginBottom: 8 },
  chatModalTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  chatModalDesc: { fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  chatModalBalance: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, marginBottom: 20 },
  chatModalCoinIcon: { fontSize: 18, marginRight: 6 },
  chatModalBalanceText: { fontSize: 14, color: '#fff' },
  chatModalBalanceAmount: { fontSize: 14, fontWeight: 'bold' },
  chatModalActions: { flexDirection: 'row', gap: 12, width: '100%' },
  chatModalCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center' },
  chatModalCancelText: { color: 'rgba(255,255,255,0.6)', fontSize: 15, fontWeight: '600' },
  chatModalPayBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#FF6B9D', alignItems: 'center' },
  chatModalPayText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  chatModalGetCoins: { color: '#FF6B9D', fontSize: 13, marginTop: 14, fontWeight: '600' },
});
