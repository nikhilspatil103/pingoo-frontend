import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, TextInput, KeyboardAvoidingView, Platform, StatusBar, Image, Modal, Alert, ActivityIndicator, Clipboard, Vibration, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
// import { View } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useUnread } from '../context/UnreadContext';
import { getAvatarColor } from '../utils/avatarColors';
import SocketService from '../services/SocketService';
import { API_URL } from '../config/urlConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AnimatedMessage = React.memo(({ msg, isLastSentMessage, profile, isDark, handleLongPress, setFullScreenImage, styles, shouldAnimate }) => {
  const slideAnim = useRef(new Animated.Value(shouldAnimate ? (msg.sent ? 50 : -50) : 0)).current;
  const fadeAnim = useRef(new Animated.Value(shouldAnimate ? 0 : 1)).current;
  
  useEffect(() => {
    if (shouldAnimate) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, []);
  
  return (
    <Animated.View 
      style={[
        styles.messageRow,
        {
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }]
        }
      ]}
    >
      {!msg.sent && (
        <View style={styles.messageAvatar}>
          {profile.profilePhoto ? (
            <Image source={{ uri: profile.profilePhoto }} style={styles.smallAvatar} />
          ) : (
            <LinearGradient colors={getAvatarColor(profile.name, profile.email)} style={styles.smallAvatar}>
              <Text style={styles.smallAvatarText}>{profile.name.charAt(0)}</Text>
            </LinearGradient>
          )}
        </View>
      )}
      <View style={[styles.messageContainer, msg.sent ? styles.sentContainer : styles.receivedContainer]}>
        <TouchableOpacity 
          onLongPress={() => handleLongPress(msg)}
          activeOpacity={0.7}
          delayLongPress={500}
        >
          <View 
            tint={msg.sent ? (isDark ? 'dark' : 'light') : 'light'} 
            style={[styles.messageBubble, msg.sent ? styles.sentBubble : styles.receivedBubble]}
          >
          {msg.mediaType === 'image' && msg.mediaUrl ? (
            <TouchableOpacity onPress={() => setFullScreenImage(msg.mediaUrl)}>
              <Image source={{ uri: msg.mediaUrl }} style={styles.mediaImage} />
            </TouchableOpacity>
          ) : msg.mediaType === 'video' && msg.mediaUrl ? (
            <View style={styles.videoContainer}>
              <Text style={styles.videoText}>🎥 Video</Text>
            </View>
          ) : (
            <Text style={[styles.messageText, msg.sent ? styles.sentText : styles.receivedText, msg.isRecalled && styles.recalledText]}>{msg.text}</Text>
          )}
        </View>
        </TouchableOpacity>
        {isLastSentMessage && (
          <View style={styles.sentLabel}>
            <Text style={styles.sentLabelText}>Sent</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
});

export default function ChatScreen({ route, navigation }) {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const { refreshUnreadCount, setActiveChat, clearActiveChat } = useUnread();
  const { profile } = route.params;
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [animatedMessageIds, setAnimatedMessageIds] = useState(new Set());
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showUnblockConfirm, setShowUnblockConfirm] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isBlockedByUser, setIsBlockedByUser] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [selectedReportOption, setSelectedReportOption] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasAccess, setHasAccess] = useState(true);
  const [userCoins, setUserCoins] = useState(0);
  const [showCoinModal, setShowCoinModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showMessageOptions, setShowMessageOptions] = useState(false);
  const scrollViewRef = useRef();
  const profileIdRef = useRef(profile.id);
  const typingTimeoutRef = useRef(null);
  const styles = getStyles(theme, isDark);
  
  const formatTime = (date = new Date()) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes < 10 ? '0' + minutes : minutes;
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };
  
  // Ensure ref is always in sync with current profile
  profileIdRef.current = profile.id;

  useEffect(() => {
    setActiveChat(profile.id);
    loadChatHistory();
    checkIfBlocked();
    checkChatAccess();
  }, [profile.id]);

  useEffect(() => {
    const handleMessage = (data) => {
      if (String(data.senderId) === String(profileIdRef.current)) {
        const newMessage = {
          id: data.messageId || Date.now(),
          text: data.message,
          mediaUrl: data.mediaUrl,
          mediaType: data.mediaType,
          sent: false,
          time: formatTime(),
          timestamp: data.timestamp ? new Date(data.timestamp).getTime() : Date.now()
        };
        setMessages(prev => [...prev, newMessage]);
        setAnimatedMessageIds(prev => new Set([...prev, newMessage.id]));
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
      }
    };
    
    const handleMessageSaved = (data) => {
      // Update temp message ID with database ID
      setMessages(prev => prev.map(m => 
        m.id === data.tempId ? { ...m, id: data.messageId, timestamp: new Date(data.timestamp).getTime() } : m
      ));
    };
    
    const handleTyping = (data) => {
      if (String(data.userId) === String(profileIdRef.current)) {
        setIsTyping(true);
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
      }
    };
    
    const handleStopTyping = (data) => {
      if (String(data.userId) === String(profileIdRef.current)) {
        setIsTyping(false);
      }
    };
    
    const handleRecallMessage = (data) => {
      // Update message to show recalled state for both users
      setMessages(prev => prev.map(m => {
        // Compare both string versions of IDs
        const msgId = String(m.id);
        const dataId = String(data.messageId);
        
        if (msgId === dataId) {
          return { 
            ...m, 
            text: `${data.senderName || 'User'} recalled this message`, 
            isRecalled: true, 
            mediaUrl: null, 
            mediaType: 'text' 
          };
        }
        return m;
      }));
    };
    
    SocketService.onReceiveMessage(handleMessage);
    SocketService.onTyping(handleTyping);
    SocketService.onStopTyping(handleStopTyping);
    SocketService.onDeleteMessage(handleRecallMessage);
    SocketService.on('messageSaved', handleMessageSaved);

    return () => {
      clearActiveChat();
      SocketService.offReceiveMessage(handleMessage);
      SocketService.offTyping(handleTyping);
      SocketService.offStopTyping(handleStopTyping);
      SocketService.offDeleteMessage(handleRecallMessage);
      SocketService.off('messageSaved', handleMessageSaved);
    };
  }, []);

  const loadChatHistory = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_URL}/messages/${profile.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        
        // Mark messages as read
        await fetch(`${API_URL}/messages/read/${profile.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        refreshUnreadCount();
        
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkIfBlocked = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/blocked-users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const blocked = data.blockedUsers.some(u => u._id === profile.id);
        setIsBlocked(blocked);
      }
      
      const blockedByResponse = await fetch(`${API_URL}/blocked-by/${profile.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (blockedByResponse.ok) {
        const data = await blockedByResponse.json();
        setIsBlockedByUser(data.isBlockedByUser);
      }
    } catch (error) {
      console.error('Error checking block status:', error);
    }
  };

  const checkChatAccess = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/chat-access/${profile.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setHasAccess(data.hasAccess);
        setUserCoins(data.coins);
      }
    } catch (error) {
      console.error('Error checking chat access:', error);
    }
  };

  const purchaseChatAccess = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/purchase-chat/${profile.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setHasAccess(true);
        setUserCoins(data.coins);
        setShowCoinModal(false);
        Alert.alert('Success', 'Chat access purchased for 6 hours!');
      } else {
        const error = await response.json();
        Alert.alert('Error', error.error || 'Failed to purchase chat access');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to purchase chat access');
    }
  };

  const purchaseChatAccessSilently = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/purchase-chat/${profile.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setHasAccess(true);
        setUserCoins(data.coins);
      }
    } catch (error) {
      console.error('Error purchasing chat access:', error);
    }
  };

  const handleTyping = (text) => {
    setMessage(text);
    
    if (text.trim()) {
      SocketService.emitTyping(profile.id, user.userId);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        SocketService.emitStopTyping(profile.id, user.userId);
      }, 1000);
    } else {
      SocketService.emitStopTyping(profile.id, user.userId);
    }
  };

  const pickMedia = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your gallery');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        await uploadAndSendMedia(asset);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick media');
    }
  };

  const uploadAndSendMedia = async (asset) => {
    try {
      setUploading(true);
      const token = await AsyncStorage.getItem('token');
      
      // Convert to base64
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        const base64data = reader.result;
        
        // Upload to Cloudinary
        const uploadResponse = await fetch(`${API_URL}/upload-image-base64`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ image: base64data })
        });
        
        if (uploadResponse.ok) {
          const data = await uploadResponse.json();
          const mediaUrl = data.imageUrl;
          const mediaType = asset.type === 'video' ? 'video' : 'image';
          
          // Send message with media
          const newMessage = {
            id: Date.now(),
            mediaUrl,
            mediaType,
            sent: true,
            time: formatTime()
          };
          
          setMessages(prev => [...prev, newMessage]);
          SocketService.sendMessage(profile.id, '', user.userId, mediaUrl, mediaType);
          setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
        } else {
          Alert.alert('Error', 'Failed to upload media');
        }
        setUploading(false);
      };
      
      reader.readAsDataURL(blob);
    } catch (error) {
      setUploading(false);
      Alert.alert('Error', 'Failed to send media');
    }
  };

  const sendMessage = () => {
    if (isBlocked) {
      setShowUnblockConfirm(true);
      return;
    }
    
    if (isBlockedByUser) {
      Alert.alert('Cannot Send Message', `${profile.name} has blocked you. You cannot send messages.`);
      return;
    }
    
    if (message.trim()) {
      // Check if we need to purchase access silently
      if (!hasAccess) {
        if (userCoins < 10) {
          setShowCoinModal(true);
          return;
        }
        // Silently purchase access in background
        purchaseChatAccessSilently();
      }
      
      const tempId = Date.now();
      const newMessage = {
        id: tempId,
        text: message.trim(),
        sent: true,
        time: formatTime(),
        timestamp: tempId
      };
      
      setMessages(prev => [...prev, newMessage]);
      setAnimatedMessageIds(prev => new Set([...prev, tempId]));
      SocketService.sendMessage(profile.id, message.trim(), user.userId, null, 'text', tempId);
      SocketService.emitStopTyping(profile.id, user.userId);
      setMessage('');
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const handleBlock = async () => {
    setShowBlockConfirm(false);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/block/${profile.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setIsBlocked(true);
        Alert.alert('Blocked', 'User has been blocked');
      } else {
        Alert.alert('Error', 'Failed to block user');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to block user');
    }
  };

  const handleUnblock = async () => {
    setShowUnblockConfirm(false);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/unblock/${profile.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        setIsBlocked(false);
        Alert.alert('Unblocked', 'User has been unblocked');
      } else {
        Alert.alert('Error', 'Failed to unblock user');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to unblock user');
    }
  };

  const handleReport = async () => {
    const reason = selectedReportOption === 'Other' ? reportReason : selectedReportOption;
    
    if (!reason || !reason.trim()) {
      Alert.alert('Error', 'Please select or enter a reason');
      return;
    }
    
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/report/${profile.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });
      
      if (response.ok) {
        setShowReportModal(false);
        setReportReason('');
        setSelectedReportOption('');
        Alert.alert('Reported', 'User has been reported');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to report user');
    }
  };

  const handleLongPress = (msg) => {
    Vibration.vibrate(50);
    setSelectedMessage(msg);
    setShowMessageOptions(true);
  };

  const canRecallMessage = (msg) => {
    if (!msg.sent || !msg.timestamp) return false;
    const messageTime = msg.timestamp;
    const currentTime = Date.now();
    const timeDiff = (currentTime - messageTime) / 1000; // in seconds
    return timeDiff <= 60; // 1 minute
  };

  const handleCopyMessage = () => {
    if (selectedMessage?.text) {
      Clipboard.setString(selectedMessage.text);
      Alert.alert('Copied', 'Message copied to clipboard');
    }
    setShowMessageOptions(false);
    setSelectedMessage(null);
  };

  const handleDeleteMessage = async () => {
    if (!selectedMessage) return;
    
    setShowMessageOptions(false);
    
    try {
      // Update message to recalled state locally
      setMessages(prev => prev.map(m => 
        m.id === selectedMessage.id 
          ? { ...m, text: 'You recalled this message', isRecalled: true, mediaUrl: null, mediaType: 'text' }
          : m
      ));
      
      // Emit recall event via socket
      SocketService.emit('recallMessage', {
        messageId: selectedMessage.id,
        receiverId: profile.id,
        senderId: user.userId
      });
      
      Alert.alert('Recalled', 'Message recalled');
    } catch (error) {
      Alert.alert('Error', 'Failed to recall message');
    }
    
    setSelectedMessage(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? '#1a0a2e' : '#ffeef8'} translucent={false} />
      <LinearGradient
        colors={isDark ? ['#1a0a2e', '#16213e', '#0f3460'] : ['#ffeef8', '#e8d5f2', '#d4e4f7']}
        style={styles.gradientBackground}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            <View tint={isDark ? 'dark' : 'light'} style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Text style={styles.backIcon}>←</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('ProfileView', { profile })} activeOpacity={1}>
                <Text style={styles.headerTitle}>{profile.name}, {profile.age}</Text>
              </TouchableOpacity>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity onPress={() => navigation.navigate('ProfileView', { profile })} activeOpacity={1}>
                  {profile.profilePhoto ? (
                    <Image source={{ uri: profile.profilePhoto }} style={styles.avatar} />
                  ) : (
                    <LinearGradient colors={getAvatarColor(profile.name, profile.email)} style={styles.avatar}>
                      <Text style={styles.avatarText}>{profile.name.charAt(0)}</Text>
                    </LinearGradient>
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowMenu(!showMenu)}>
                  <View style={styles.menuButton}>
                    <Text style={styles.menuIcon}>⋮</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {isTyping && (
              <View style={styles.typingIndicator}>
                <Text style={styles.typingIndicatorText}>{profile.name} is typing...</Text>
              </View>
            )}

            <ScrollView 
              ref={scrollViewRef}
              style={styles.messagesContainer} 
              contentContainerStyle={styles.messagesContent}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#FF6B9D" />
                </View>
              ) : messages.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>Start the conversation</Text>
                </View>
              ) : (
                messages.map((msg, index) => {
                  const isLastSentMessage = msg.sent && index === messages.length - 1;
                  const shouldAnimate = animatedMessageIds.has(msg.id);
                  return (
                    <AnimatedMessage
                      key={msg.id}
                      msg={msg}
                      isLastSentMessage={isLastSentMessage}
                      profile={profile}
                      isDark={isDark}
                      handleLongPress={handleLongPress}
                      setFullScreenImage={setFullScreenImage}
                      styles={styles}
                      shouldAnimate={shouldAnimate}
                    />
                  );
                })
              )}
            </ScrollView>

            {isBlockedByUser && (
              <View style={styles.blockedBanner}>
                <Text style={styles.blockedBannerText}>🚫 {profile.name} has blocked you. You cannot send messages.</Text>
              </View>
            )}

            {uploading && (
              <View style={styles.uploadingBanner}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.uploadingText}>Uploading...</Text>
              </View>
            )}

            <View tint={isDark ? 'dark' : 'light'} style={styles.inputContainer}>
              <TouchableOpacity onPress={pickMedia}>
                <View tint={isDark ? 'dark' : 'light'} style={styles.iconButton}>
                  <Text style={styles.icon}>🔗</Text>
                </View>
              </TouchableOpacity>
              <View tint={isDark ? 'dark' : 'light'} style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Message"
                  placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
                  value={message}
                  onChangeText={handleTyping}
                />
              </View>
              <TouchableOpacity>
                <View tint={isDark ? 'dark' : 'light'} style={styles.iconButton}>
                  <Text style={styles.icon}>🎤</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={sendMessage}>
                <View  tint={isDark ? 'dark' : 'light'} style={styles.iconButton}>
                  <Text style={styles.icon}>➤</Text>
                </View>
              </TouchableOpacity>
            </View>

            {showMenu && (
              <View style={styles.menuOverlay}>
                <TouchableOpacity style={styles.menuBackdrop} onPress={() => setShowMenu(false)} />
                <View style={styles.menuDropdown}>
                  <TouchableOpacity onPress={() => { setShowMenu(false); setShowReportModal(true); }} style={styles.menuItem}>
                    <Text style={styles.menuItemText}>🚨 Report User</Text>
                  </TouchableOpacity>
                  {isBlocked ? (
                    <TouchableOpacity onPress={() => { setShowMenu(false); setShowUnblockConfirm(true); }} style={styles.menuItem}>
                      <Text style={styles.menuItemText}>✅ Unblock User</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity onPress={() => { setShowMenu(false); setShowBlockConfirm(true); }} style={styles.menuItem}>
                      <Text style={[styles.menuItemText, styles.menuItemDanger]}>🚫 Block User</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            <Modal visible={showReportModal} animationType="slide" transparent>
              <View style={styles.reportOverlay}>
                <View style={styles.reportBox}>
                  <Text style={styles.reportTitle}>Report User</Text>
                  <Text style={styles.reportText}>Why are you reporting?</Text>
                  
                  <View style={styles.reportOptions}>
                    {['Harassment', 'Spam', 'Inappropriate Content', 'Fake Profile', 'Other'].map((option) => (
                      <TouchableOpacity
                        key={option}
                        onPress={() => setSelectedReportOption(option)}
                        style={[styles.reportOption, selectedReportOption === option && styles.reportOptionSelected]}
                      >
                        <Text style={[styles.reportOptionText, selectedReportOption === option && styles.reportOptionTextSelected]}>
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  
                  {selectedReportOption === 'Other' && (
                    <TextInput
                      style={styles.reportInput}
                      placeholder="Enter reason..."
                      placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
                      value={reportReason}
                      onChangeText={setReportReason}
                      multiline
                    />
                  )}
                  
                  <TouchableOpacity onPress={handleReport}>
                    <View style={styles.reportButton}>
                      <Text style={styles.reportButtonText}>Submit</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { setShowReportModal(false); setReportReason(''); setSelectedReportOption(''); }}>
                    <Text style={styles.reportCancel}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            <Modal visible={showBlockConfirm} animationType="slide" transparent>
              <View style={styles.reportOverlay}>
                <View style={styles.reportBox}>
                  <Text style={styles.reportTitle}>Block User</Text>
                  <Text style={styles.reportText}>Block {profile.name}?</Text>
                  <TouchableOpacity onPress={handleBlock}>
                    <View style={styles.reportButton}>
                      <Text style={styles.reportButtonText}>Yes, Block</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setShowBlockConfirm(false)}>
                    <Text style={styles.reportCancel}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
            <Modal visible={showUnblockConfirm} animationType="slide" transparent>
              <View style={styles.reportOverlay}>
                <View style={styles.reportBox}>
                  <Text style={styles.reportTitle}>User Blocked</Text>
                  <Text style={styles.reportText}>You have blocked {profile.name}. Unblock to send messages.</Text>
                  <TouchableOpacity onPress={handleUnblock}>
                    <View style={styles.reportButton}>
                      <Text style={styles.reportButtonText}>Unblock</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setShowUnblockConfirm(false)}>
                    <Text style={styles.reportCancel}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            <Modal visible={showCoinModal} animationType="slide" transparent>
              <View style={styles.reportOverlay}>
                <View style={styles.reportBox}>
                  <Text style={styles.reportTitle}>💰 Insufficient Coins</Text>
                  <Text style={styles.reportText}>You need 10 coins to continue chatting with {profile.name}</Text>
                  <View style={styles.coinInfo}>
                    <Text style={styles.coinBalance}>Your Balance: {userCoins} coins</Text>
                  </View>
                  <TouchableOpacity onPress={() => { setShowCoinModal(false); navigation.navigate('MyCoins'); }}>
                    <View style={styles.reportButton}>
                      <Text style={styles.reportButtonText}>Buy Coins</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setShowCoinModal(false)}>
                    <Text style={styles.reportCancel}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            <Modal visible={fullScreenImage !== null} animationType="fade" transparent onRequestClose={() => setFullScreenImage(null)}>
              <View style={styles.fullScreenOverlay}>
                <TouchableOpacity style={styles.fullScreenClose} onPress={() => setFullScreenImage(null)}>
                  <Text style={styles.fullScreenCloseText}>✕</Text>
                </TouchableOpacity>
                <Image source={{ uri: fullScreenImage }} style={styles.fullScreenImage} resizeMode="contain" />
              </View>
            </Modal>

            <Modal visible={showMessageOptions} animationType="slide" transparent>
              <View style={styles.reportOverlay}>
                <View style={styles.reportBox}>
                  <Text style={styles.reportTitle}>Message Options</Text>
                  
                  <View style={styles.messageTimeDisplay}>
                    <Text style={styles.messageTimeText}>{selectedMessage?.time}</Text>
                  </View>
                  
                  {selectedMessage?.text && (
                    <TouchableOpacity onPress={handleCopyMessage}>
                      <View style={styles.messageOptionButton}>
                        <Text style={styles.messageOptionText}>📋 Copy</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  
                  {selectedMessage?.sent && canRecallMessage(selectedMessage) && !selectedMessage?.isRecalled && (
                    <TouchableOpacity onPress={handleDeleteMessage}>
                      <View style={[styles.messageOptionButton, styles.messageOptionDanger]}>
                        <Text style={[styles.messageOptionText, styles.messageOptionDangerText]}>↩️ Recall</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  
                  {selectedMessage?.sent && (!canRecallMessage(selectedMessage) || selectedMessage?.isRecalled) && (
                    <View style={[styles.messageOptionButton, styles.messageOptionDisabled]}>
                      <Text style={[styles.messageOptionText, styles.messageOptionDisabledText]}>↩️ Recall (expired)</Text>
                    </View>
                  )}
                  
                  <TouchableOpacity onPress={() => { setShowMessageOptions(false); setSelectedMessage(null); }}>
                    <Text style={styles.reportCancel}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const getStyles = (theme, isDark) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDark ? '#1a0a2e' : '#ffeef8' }, 
  gradientBackground: { flex: 1 },
  keyboardView: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 15, 
    borderRadius: 0, 
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)',
  },
  backButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
  },
  backIcon: { fontSize: 18, color: theme.text, fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: theme.text },
  menuButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
  menuIcon: { fontSize: 20, color: theme.text, fontWeight: 'bold' },
  menuOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 },
  menuBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  menuDropdown: { position: 'absolute', top: 70, right: 20, backgroundColor: isDark ? '#1a0a2e' : '#fff', borderRadius: 12, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 5 },
  menuItem: { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
  menuItemText: { fontSize: 15, color: theme.text },
  menuItemDanger: { color: '#F70776' },
  reportOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  reportBox: { backgroundColor: isDark ? '#1a0a2e' : '#fff', borderRadius: 20, padding: 24, width: '80%', maxHeight: '80%' },
  reportTitle: { fontSize: 20, fontWeight: 'bold', color: theme.text, marginBottom: 12, textAlign: 'center' },
  reportText: { fontSize: 15, color: theme.textSecondary, textAlign: 'center', marginBottom: 16 },
  reportOptions: { width: '100%', marginBottom: 16 },
  reportOption: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)', marginBottom: 8 },
  reportOptionSelected: { backgroundColor: '#F70776', borderColor: '#F70776' },
  reportOptionText: { fontSize: 14, color: theme.text, textAlign: 'center' },
  reportOptionTextSelected: { color: '#fff', fontWeight: '600' },
  reportInput: { width: '100%', height: 80, borderRadius: 12, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)', padding: 12, fontSize: 15, color: theme.text, marginBottom: 16, textAlignVertical: 'top' },
  reportButton: { backgroundColor: '#F70776', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 12, marginBottom: 12, alignSelf: 'center' },
  reportButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  reportCancel: { fontSize: 15, color: theme.textSecondary, textAlign: 'center', marginTop: 8 },
  coinInfo: { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', padding: 16, borderRadius: 12, marginBottom: 16 },
  coinBalance: { fontSize: 16, fontWeight: '600', color: theme.text, textAlign: 'center' },
  reportButtonDisabled: { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)', opacity: 0.5 },
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  typingIndicator: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    borderBottomWidth: 1,
    borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    alignItems: 'center',
  },
  typingIndicatorText: {
    fontSize: 13,
    color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
    fontStyle: 'italic',
  },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 4 },
  messageAvatar: { marginRight: 8, marginBottom: 4 },
  smallAvatar: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  smallAvatarText: { fontSize: 12, fontWeight: 'bold', color: '#fff' },
  messageContainer: { flex: 1 },
  sentContainer: { alignItems: 'flex-end' },
  receivedContainer: { alignItems: 'flex-start' },
  messagesContainer: { flex: 1 },
  messagesContent: { padding: 20, gap: 4, flexGrow: 1, justifyContent: 'flex-end' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' },
  blockedBanner: { backgroundColor: '#F70776', paddingVertical: 12, paddingHorizontal: 20, alignItems: 'center' },
  blockedBannerText: { color: '#fff', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  uploadingBanner: { backgroundColor: '#03C8F0', paddingVertical: 12, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  uploadingText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  messageBubble: { 
    minWidth: 60,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sentBubble: { 
    alignSelf: 'flex-end', 
    borderBottomRightRadius: 4, 
    backgroundColor: isDark ? 'rgba(255,107,157,0.3)' : 'rgba(255,107,157,0.2)',
  },
  receivedBubble: { 
    alignSelf: 'flex-start', 
    borderBottomLeftRadius: 4, 
    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.95)',
  },
  messageText: { fontSize: 15, lineHeight: 20 },
  sentText: { color: theme.text },
  receivedText: { color: theme.text },
  recalledText: { fontStyle: 'italic', opacity: 0.6 },
  messageTime: { fontSize: 11, alignSelf: 'flex-end', marginTop: 4 },
  sentTime: { color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' },
  receivedTime: { color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)' },
  sentLabel: { alignSelf: 'flex-end', marginBottom: 12, marginTop: 2 },
  sentLabelText: { fontSize: 11, color: '#03C8F0', fontWeight: '500' },
  mediaImage: { width: 200, height: 200, borderRadius: 12, marginBottom: 8 },
  videoContainer: { width: 200, height: 150, borderRadius: 12, backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  videoText: { fontSize: 16, color: theme.text },
  typingContainer: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 20, marginLeft: 0 },
  typingBubble: { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.95)', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 20, borderBottomLeftRadius: 6, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2, minWidth: 80 },
  typingText: { fontSize: 14, color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)', fontStyle: 'italic', fontWeight: '500' },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'flex-end', 
    paddingHorizontal: 15, 
    paddingVertical: 12, 
    borderTopWidth: 1, 
    borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)', 
    gap: 10,
  },
  iconButton: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    justifyContent: 'center', 
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)',
  },
  icon: { fontSize: 20, color: theme.text },
  inputWrapper: {
    flex: 1,
    maxHeight: 120,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)',
    backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.1)',
  },
  input: { 
    paddingHorizontal: 18, 
    paddingVertical: 12,
    fontSize: 15, 
    color: theme.text,
  },
  fullScreenOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  fullScreenImage: { width: '100%', height: '100%' },
  fullScreenClose: { position: 'absolute', top: 50, right: 20, zIndex: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  fullScreenCloseText: { fontSize: 24, color: '#fff', fontWeight: 'bold' },
  messageOptionButton: { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', paddingVertical: 16, paddingHorizontal: 24, borderRadius: 12, marginBottom: 12, alignItems: 'center' },
  messageOptionText: { fontSize: 16, color: theme.text, fontWeight: '600' },
  messageOptionDanger: { backgroundColor: 'rgba(247,7,118,0.1)', borderWidth: 1, borderColor: '#F70776' },
  messageOptionDangerText: { color: '#F70776' },
  messageOptionDisabled: { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', opacity: 0.5 },
  messageOptionDisabledText: { color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' },
  messageTimeDisplay: { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, marginBottom: 16, alignItems: 'center' },
  messageTimeText: { fontSize: 13, color: theme.textSecondary, fontWeight: '500' },
});
