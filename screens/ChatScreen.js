import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';

export default function ChatScreen({ route, navigation }) {
  const { theme, isDark } = useTheme();
  const { profile } = route.params;
  const [message, setMessage] = useState('');

  const styles = getStyles(theme, isDark);

  const [messages, setMessages] = useState([]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark ? ['#1a0a2e', '#16213e', '#0f3460'] : ['#ffeef8', '#e8d5f2', '#d4e4f7']}
        style={styles.gradientBackground}
      >
        <SafeAreaView style={styles.safeArea}>
          <BlurView intensity={isDark ? 60 : 40} tint={isDark ? 'dark' : 'light'} style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <BlurView intensity={40} tint={isDark ? 'dark' : 'light'} style={styles.backButton}>
                <Text style={styles.backIcon}>←</Text>
              </BlurView>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{profile.name}, {profile.age}</Text>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{profile.name.charAt(0)}</Text>
            </View>
          </BlurView>

          <ScrollView style={styles.messagesContainer} contentContainerStyle={styles.messagesContent}>
            {messages.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Start the conversation</Text>
              </View>
            ) : (
              messages.map((msg) => (
                <View key={msg.id}>
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
              ))
            )}
          </ScrollView>

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <BlurView intensity={isDark ? 60 : 40} tint={isDark ? 'dark' : 'light'} style={styles.inputContainer}>
              <TouchableOpacity>
                <BlurView intensity={30} tint={isDark ? 'dark' : 'light'} style={styles.iconButton}>
                  <Text style={styles.icon}>🔗</Text>
                </BlurView>
              </TouchableOpacity>
              <BlurView intensity={20} tint={isDark ? 'dark' : 'light'} style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Message"
                  placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
                  value={message}
                  onChangeText={setMessage}
                />
              </BlurView>
              <TouchableOpacity>
                <BlurView intensity={30} tint={isDark ? 'dark' : 'light'} style={styles.iconButton}>
                  <Text style={styles.icon}>➤</Text>
                </BlurView>
              </TouchableOpacity>
              <TouchableOpacity>
                <BlurView intensity={30} tint={isDark ? 'dark' : 'light'} style={styles.iconButton}>
                  <Text style={styles.icon}>🎤</Text>
                </BlurView>
              </TouchableOpacity>
            </BlurView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const getStyles = (theme, isDark) => StyleSheet.create({
  container: { flex: 1 },
  gradientBackground: { flex: 1 },
  safeArea: { flex: 1 },
  header: { 
    flexDirection: 'row', 
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
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)',
  },
  backIcon: { fontSize: 24, color: theme.text },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '600', color: theme.text, textAlign: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F70776', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
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
  },
  input: { 
    flex: 1, 
    height: 44, 
    paddingHorizontal: 18, 
    fontSize: 15, 
    color: theme.text,
  },
});
