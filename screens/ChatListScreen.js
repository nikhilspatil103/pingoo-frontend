import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, TextInput, FlatList, StatusBar, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';
import { useUnread } from '../context/UnreadContext';
import { API_URL } from '../config/urlConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAvatarColor } from '../utils/avatarColors';
import PingooLogo from '../components/PingooLogo';
import { useFocusEffect } from '@react-navigation/native';

export default function ChatListScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const { refreshUnreadCount } = useUnread();
  const [searchQuery, setSearchQuery] = useState('');
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const styles = getStyles(theme, isDark);

  useEffect(() => {
    fetchConversations();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchConversations();
    }, [])
  );

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_URL}/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const formattedChats = data.conversations.map(conv => ({
          id: conv.id,
          name: conv.name,
          age: conv.age,
          message: conv.isFromMe ? `You: ${conv.lastMessage}` : conv.lastMessage,
          time: new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          avatar: conv.name.charAt(0),
          profilePhoto: conv.profilePhoto,
          unread: conv.unreadCount > 0,
          unreadCount: conv.unreadCount
        }));
        setChats(formattedChats);
        refreshUnreadCount();
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderChatItem = ({ item }) => (
    <TouchableOpacity 
      onPress={() => navigation.navigate('Chat', { profile: { id: item.id, name: item.name, age: item.age, profilePhoto: item.profilePhoto } })}
      activeOpacity={1}
    >
      <View tint={isDark ? 'dark' : 'light'} style={styles.chatItem}>
        {item.profilePhoto ? (
          <View style={styles.avatar}>
            <Image source={{ uri: item.profilePhoto }} style={styles.avatarImage} />
          </View>
        ) : (
          <View style={[styles.avatar, { backgroundColor: getAvatarColor(item.id, item.name)[0] }]}>
            <Text style={styles.avatarText}>{item.avatar}</Text>
          </View>
        )}
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName}>{item.name}, {item.age}</Text>
            <View style={styles.timeContainer}>
              <Text style={styles.chatTime}>{item.time}</Text>
              <Text style={styles.checkmark}>✓✓</Text>
            </View>
          </View>
          <View style={styles.messageRow}>
            <Text style={[styles.chatMessage, item.unread && styles.unreadMessage]} numberOfLines={1}>{item.message}</Text>
            {item.unread && item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? '#1a0a2e' : '#ffeef8'} />
      <LinearGradient
        colors={isDark ? ['#1a0a2e', '#16213e', '#0f3460'] : ['#ffeef8', '#e8d5f2', '#d4e4f7']}
        style={styles.gradientBackground}
      >
        <SafeAreaView style={styles.safeArea}>
          <Text style={styles.title}>Chats</Text>
          
          <View style={styles.searchContainer}>
            <View tint={isDark ? 'dark' : 'light'} style={styles.searchWrapper}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search"
                placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <PingooLogo size={100} animated={true} />
            </View>
          ) : chats.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No conversations yet</Text>
              <Text style={styles.emptySubtext}>Start chatting with someone!</Text>
            </View>
          ) : (
            <FlatList
              data={chats}
              renderItem={renderChatItem}
              keyExtractor={(item) => item.id.toString()}
              style={styles.chatList}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              showsVerticalScrollIndicator={false}
            />
          )}
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const getStyles = (theme, isDark) => StyleSheet.create({
  container: { flex: 1 },
  gradientBackground: { flex: 1 },
  safeArea: { flex: 1 },
  title: { fontSize: 24, fontWeight: '600', color: theme.text, textAlign: 'center', marginTop: 20, marginBottom: 20 },
  searchContainer: { paddingHorizontal: 20, marginBottom: 20 },
  searchWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(147,147,147,0.5)',
  },
  searchInput: { 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    fontSize: 15, 
    color: theme.text,
  },
  chatList: { flex: 1, paddingHorizontal: 20 },
  chatItem: { 
    flexDirection: 'row', 
    paddingHorizontal: 16, 
    paddingVertical: 16, 
    alignItems: 'center',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(147,147,147,0.5)',
    marginBottom: 12,
  },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#F70776', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarImage: { width: 56, height: 56, borderRadius: 28 },
  avatarText: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  chatInfo: { flex: 1 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  chatName: { fontSize: 16, fontWeight: '600', color: theme.text },
  timeContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chatTime: { fontSize: 13, color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' },
  checkmark: { fontSize: 12, color: '#03C8F0' },
  chatMessage: { fontSize: 14, color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' },
  messageRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  unreadMessage: { fontWeight: '600', color: theme.text },
  unreadBadge: { backgroundColor: '#FF3B30', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  unreadCount: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  separator: { height: 12 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 18, fontWeight: '600', color: theme.text, marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' },
});
