import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, TextInput, KeyboardAvoidingView, Platform, StatusBar, Image, Modal, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
// import { View } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useUnread } from '../context/UnreadContext';
import { getAvatarColor } from '../utils/avatarColors';
import SocketService from '../services/SocketService';
import { API_URL } from '../config/urlConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ChatScreen({ route, navigation }) {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();
  const { refreshUnreadCount, setActiveChat, clearActiveChat } = useUnread();
  const { profile } = route.params;
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showUnblockConfirm, setShowUnblockConfirm] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isBlockedByUser, setIsBlockedByUser] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [selectedReportOption, setSelectedReportOption] = useState('');
  const scrollViewRef = useRef();
  const styles = getStyles(theme, isDark);

  useEffect(() => {
    // Set this chat as active
    setActiveChat(profile.id);
    
    loadChatHistory();
    checkIfBlocked();
    
    const handleMessage = (data) => {
      if (data.senderId === profile.id) {
        const newMessage = {
          id: Date.now(),
          text: data.message,
          sent: false,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, newMessage]);
      }
    };
    
    SocketService.onReceiveMessage(handleMessage);

    const unsubscribe = navigation.addListener('focus', () => {
      checkIfBlocked();
    });

    return () => {
      // Clear active chat when leaving
      clearActiveChat();
      SocketService.offReceiveMessage(handleMessage);
      unsubscribe();
    };
  }, [profile.id, user.userId]);

  const loadChatHistory = async () => {
    try {
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
      const newMessage = {
        id: Date.now(),
        text: message.trim(),
        sent: true,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => [...prev, newMessage]);
      SocketService.sendMessage(profile.id, message.trim(), user.userId);
      setMessage('');
      
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? '#1a0a2e' : '#ffeef8'} />
      <LinearGradient
        colors={isDark ? ['#1a0a2e', '#16213e', '#0f3460'] : ['#ffeef8', '#e8d5f2', '#d4e4f7']}
        style={styles.gradientBackground}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
            <View tint={isDark ? 'dark' : 'light'} style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={1}>
                <View  tint={isDark ? 'dark' : 'light'} style={styles.backButton}>
                  <Text style={styles.backIcon}>←</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('ProfileView', { profile })} activeOpacity={1}>
                <Text style={styles.headerTitle}>{profile.name}, {profile.age}</Text>
              </TouchableOpacity>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity onPress={() => setShowMenu(!showMenu)}>
                  <View style={styles.menuButton}>
                    <Text style={styles.menuIcon}>⋮</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('ProfileView', { profile })} activeOpacity={1}>
                  {profile.profilePhoto ? (
                    <Image source={{ uri: profile.profilePhoto }} style={styles.avatar} />
                  ) : (
                    <LinearGradient colors={getAvatarColor(profile.name, profile.email)} style={styles.avatar}>
                      <Text style={styles.avatarText}>{profile.name.charAt(0)}</Text>
                    </LinearGradient>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView 
              ref={scrollViewRef}
              style={styles.messagesContainer} 
              contentContainerStyle={styles.messagesContent}
            >
              {messages.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>Start the conversation</Text>
                </View>
              ) : (
                messages.map((msg) => (
                  <View key={msg.id} style={styles.messageRow}>
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
                      <View 
                        
                        tint={msg.sent ? (isDark ? 'dark' : 'light') : 'light'} 
                        style={[styles.messageBubble, msg.sent ? styles.sentBubble : styles.receivedBubble]}
                      >
                        <Text style={[styles.messageText, msg.sent ? styles.sentText : styles.receivedText]}>{msg.text}</Text>
                        <Text style={[styles.messageTime, msg.sent ? styles.sentTime : styles.receivedTime]}>{msg.time} ✓✓</Text>
                      </View>
                      {msg.sent && (
                        <View style={styles.sentLabel}>
                          <Text style={styles.sentLabelText}>✓✓ Sent</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            {isBlockedByUser && (
              <View style={styles.blockedBanner}>
                <Text style={styles.blockedBannerText}>🚫 {profile.name} has blocked you. You cannot send messages.</Text>
              </View>
            )}

            <View tint={isDark ? 'dark' : 'light'} style={styles.inputContainer}>
              <TouchableOpacity>
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
                  onChangeText={setMessage}
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
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    justifyContent: 'center', 
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
    shadowColor: isDark ? '#fff' : '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.1 : 0.15,
    shadowRadius: 4,
    elevation: 3,
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
  avatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 4 },
  messageAvatar: { marginRight: 8, marginBottom: 20 },
  smallAvatar: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  smallAvatarText: { fontSize: 12, fontWeight: 'bold', color: '#fff' },
  messageContainer: { flex: 1 },
  sentContainer: { alignItems: 'flex-end' },
  receivedContainer: { alignItems: 'flex-start' },
  messagesContainer: { flex: 1 },
  messagesContent: { padding: 20, gap: 4, flexGrow: 1 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' },
  blockedBanner: { backgroundColor: '#F70776', paddingVertical: 12, paddingHorizontal: 20, alignItems: 'center' },
  blockedBannerText: { color: '#fff', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  messageBubble: { 
    maxWidth: '80%', 
    padding: 14, 
    borderRadius: 20, 
    marginBottom: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
  },
  sentBubble: { alignSelf: 'flex-end', borderBottomRightRadius: 6, backgroundColor: isDark ? 'rgba(255,107,157,0.2)' : 'rgba(255,107,157,0.15)' },
  receivedBubble: { alignSelf: 'flex-start', borderBottomLeftRadius: 6, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)' },
  messageText: { fontSize: 15, lineHeight: 20, marginBottom: 6 },
  sentText: { color: theme.text },
  receivedText: { color: theme.text },
  messageTime: { fontSize: 11, alignSelf: 'flex-end' },
  sentTime: { color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' },
  receivedTime: { color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)' },
  sentLabel: { alignSelf: 'flex-end', marginBottom: 12, marginTop: 4 },
  sentLabelText: { fontSize: 11, color: '#03C8F0', fontWeight: '500' },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 15, 
    paddingVertical: 12, 
    borderTopWidth: 1, 
    borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)', 
    gap: 10,
    overflow: 'hidden',
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
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)',
    backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.1)',
  },
  input: { 
    flex: 1, 
    height: 44, 
    paddingHorizontal: 18, 
    fontSize: 15, 
    color: theme.text,
  },
});
