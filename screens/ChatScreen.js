import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, TextInput, KeyboardAvoidingView, Platform, StatusBar, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
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
  const scrollViewRef = useRef();
  const styles = getStyles(theme, isDark);

  useEffect(() => {
    // Set this chat as active
    setActiveChat(profile.id);
    
    loadChatHistory();
    
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

    return () => {
      // Clear active chat when leaving
      clearActiveChat();
      SocketService.offReceiveMessage(handleMessage);
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

  const sendMessage = () => {
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? '#1a0a2e' : '#ffeef8'} />
      <LinearGradient
        colors={isDark ? ['#1a0a2e', '#16213e', '#0f3460'] : ['#ffeef8', '#e8d5f2', '#d4e4f7']}
        style={styles.gradientBackground}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <SafeAreaView style={styles.safeArea}>
            <BlurView intensity={isDark ? 30 : 20} tint={isDark ? 'dark' : 'light'} style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={1}>
                <BlurView intensity={isDark ? 40 : 25} tint={isDark ? 'dark' : 'light'} style={styles.backButton}>
                  <Text style={styles.backIcon}>←</Text>
                </BlurView>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('ProfileView', { profile })} activeOpacity={1}>
                <Text style={styles.headerTitle}>{profile.name}, {profile.age}</Text>
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
            </BlurView>

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
                      <BlurView 
                        intensity={isDark ? 40 : 20} 
                        tint={msg.sent ? (isDark ? 'dark' : 'light') : 'light'} 
                        style={[styles.messageBubble, msg.sent ? styles.sentBubble : styles.receivedBubble]}
                      >
                        <Text style={[styles.messageText, msg.sent ? styles.sentText : styles.receivedText]}>{msg.text}</Text>
                        <Text style={[styles.messageTime, msg.sent ? styles.sentTime : styles.receivedTime]}>{msg.time} ✓✓</Text>
                      </BlurView>
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

            <BlurView intensity={isDark ? 30 : 20} tint={isDark ? 'dark' : 'light'} style={styles.inputContainer}>
              <TouchableOpacity>
                <BlurView intensity={8} tint={isDark ? 'dark' : 'light'} style={styles.iconButton}>
                  <Text style={styles.icon}>🔗</Text>
                </BlurView>
              </TouchableOpacity>
              <BlurView intensity={5} tint={isDark ? 'dark' : 'light'} style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Message"
                  placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
                  value={message}
                  onChangeText={setMessage}
                />
              </BlurView>
              <TouchableOpacity onPress={sendMessage}>
                <BlurView intensity={8} tint={isDark ? 'dark' : 'light'} style={styles.iconButton}>
                  <Text style={styles.icon}>➤</Text>
                </BlurView>
              </TouchableOpacity>
              <TouchableOpacity>
                <BlurView intensity={8} tint={isDark ? 'dark' : 'light'} style={styles.iconButton}>
                  <Text style={styles.icon}>🎤</Text>
                </BlurView>
              </TouchableOpacity>
            </BlurView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const getStyles = (theme, isDark) => StyleSheet.create({
  container: { flex: 1 }, 
  gradientBackground: { flex: 1 },
  keyboardView: { flex: 1 },
  safeArea: { flex: 1, paddingTop: StatusBar.currentHeight || 0 },
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
  messageBubble: { 
    maxWidth: '80%', 
    padding: 14, 
    borderRadius: 20, 
    marginBottom: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)',
  },
  sentBubble: { alignSelf: 'flex-end', borderBottomRightRadius: 6 },
  receivedBubble: { alignSelf: 'flex-start', borderBottomLeftRadius: 6 },
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
