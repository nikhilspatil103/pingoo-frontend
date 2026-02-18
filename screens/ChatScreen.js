import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function ChatScreen({ route, navigation }) {
  const { theme, isDark } = useTheme();
  const { profile } = route.params;
  const [message, setMessage] = useState('');

  const styles = getStyles(theme, isDark);

  const [messages, setMessages] = useState([]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{profile.name}, {profile.age}</Text>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{profile.name.charAt(0)}</Text>
        </View>
      </View>

      <ScrollView style={styles.messagesContainer} contentContainerStyle={styles.messagesContent}>
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Start the conversation</Text>
          </View>
        ) : (
          messages.map((msg) => (
            <View key={msg.id}>
              <View style={[styles.messageBubble, msg.sent ? styles.sentBubble : styles.receivedBubble]}>
                <Text style={[styles.messageText, msg.sent ? styles.sentText : styles.receivedText]}>{msg.text}</Text>
                <Text style={[styles.messageTime, msg.sent ? styles.sentTime : styles.receivedTime]}>{msg.time} ✓✓</Text>
              </View>
              {msg.sent && (
                <View style={styles.sentLabel}>
                  <Text style={styles.sentLabelText}>✓✓ Sent</Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inputContainer}>
        <TouchableOpacity style={styles.iconButton}>
          <Text style={styles.icon}>🔗</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Message"
          placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
          value={message}
          onChangeText={setMessage}
        />
        <TouchableOpacity style={styles.iconButton}>
          <Text style={styles.icon}>➤</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <Text style={styles.icon}>🎤</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (theme, isDark) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDark ? '#1C0F2A' : '#F3E9EC' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: isDark ? '#2A1838' : '#fff', borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 24, color: isDark ? '#fff' : theme.text },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '600', color: isDark ? '#fff' : theme.text, textAlign: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F70776', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  messagesContainer: { flex: 1 },
  messagesContent: { padding: 20, gap: 4, flexGrow: 1 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' },
  messageBubble: { maxWidth: '80%', padding: 14, borderRadius: 20, marginBottom: 4 },
  sentBubble: { alignSelf: 'flex-end', backgroundColor: isDark ? '#5A4066' : '#E8D5E8', borderBottomRightRadius: 6 },
  receivedBubble: { alignSelf: 'flex-start', backgroundColor: isDark ? '#F5F5F5' : '#fff', borderBottomLeftRadius: 6, borderWidth: isDark ? 0 : 1, borderColor: 'rgba(0,0,0,0.1)' },
  messageText: { fontSize: 15, lineHeight: 20, marginBottom: 6 },
  sentText: { color: isDark ? '#E8E8E8' : '#2A2A2A' },
  receivedText: { color: '#2A2A2A' },
  messageTime: { fontSize: 11, alignSelf: 'flex-end' },
  sentTime: { color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' },
  receivedTime: { color: 'rgba(0,0,0,0.4)' },
  sentLabel: { alignSelf: 'flex-end', marginBottom: 12, marginTop: 4 },
  sentLabelText: { fontSize: 11, color: '#03C8F0', fontWeight: '500' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12, backgroundColor: isDark ? '#2A1838' : '#fff', borderTopWidth: 1, borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', gap: 10 },
  iconButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)', justifyContent: 'center', alignItems: 'center' },
  icon: { fontSize: 20, color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.6)' },
  input: { flex: 1, height: 44, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', borderRadius: 22, paddingHorizontal: 18, fontSize: 15, color: isDark ? '#fff' : theme.text },
});
