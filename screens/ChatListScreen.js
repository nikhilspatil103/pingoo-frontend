import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, TextInput, FlatList, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';

export default function ChatListScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const styles = getStyles(theme, isDark);

  const chats = [
    { id: 1, name: 'Mari', age: 22, message: 'You: It was great!', time: '03:25', avatar: 'M', unread: false },
    { id: 2, name: 'Veronika', age: 19, message: 'Photo - super!)', time: '22:34', avatar: 'V', unread: false },
    { id: 3, name: 'Anastasia', age: 30, message: 'You: Yes, I really think so', time: '15:03', avatar: 'A', unread: false },
    { id: 4, name: 'Elena', age: 19, message: 'You: Get to know your cat?', time: '12:28', avatar: 'E', unread: false },
  ];

  const renderChatItem = ({ item }) => (
    <TouchableOpacity 
      onPress={() => navigation.navigate('Chat', { profile: { name: item.name, age: item.age } })}
    >
      <BlurView intensity={isDark ? 20 : 15} tint={isDark ? 'dark' : 'light'} style={styles.chatItem}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.avatar}</Text>
        </View>
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName}>{item.name}, {item.age}</Text>
            <View style={styles.timeContainer}>
              <Text style={styles.chatTime}>{item.time}</Text>
              <Text style={styles.checkmark}>✓✓</Text>
            </View>
          </View>
          <Text style={styles.chatMessage}>{item.message}</Text>
        </View>
      </BlurView>
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
            <BlurView intensity={isDark ? 20 : 15} tint={isDark ? 'dark' : 'light'} style={styles.searchWrapper}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search"
                placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </BlurView>
          </View>

          <FlatList
            data={chats}
            renderItem={renderChatItem}
            keyExtractor={(item) => item.id.toString()}
            style={styles.chatList}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            showsVerticalScrollIndicator={false}
          />
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const getStyles = (theme, isDark) => StyleSheet.create({
  container: { flex: 1 },
  gradientBackground: { flex: 1 },
  safeArea: { flex: 1, paddingTop: StatusBar.currentHeight || 0 },
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
  avatarText: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  chatInfo: { flex: 1 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  chatName: { fontSize: 16, fontWeight: '600', color: theme.text },
  timeContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chatTime: { fontSize: 13, color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' },
  checkmark: { fontSize: 12, color: '#03C8F0' },
  chatMessage: { fontSize: 14, color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' },
  separator: { height: 12 },
});
