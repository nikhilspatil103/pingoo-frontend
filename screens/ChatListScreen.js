import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, TextInput, FlatList } from 'react-native';
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
      style={styles.chatItem}
      onPress={() => navigation.navigate('Chat', { profile: { name: item.name, age: item.age } })}
    >
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
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Chats</Text>
      
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={chats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id.toString()}
        style={styles.chatList}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const getStyles = (theme, isDark) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDark ? '#1C0F2A' : '#F3E9EC' },
  title: { fontSize: 24, fontWeight: '600', color: isDark ? '#fff' : theme.text, textAlign: 'center', marginTop: 20, marginBottom: 20 },
  searchContainer: { paddingHorizontal: 20, marginBottom: 20 },
  searchInput: { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: isDark ? '#fff' : theme.text },
  chatList: { flex: 1 },
  chatItem: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 16, alignItems: 'center' },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#F70776', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  chatInfo: { flex: 1 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  chatName: { fontSize: 16, fontWeight: '600', color: isDark ? '#fff' : theme.text },
  timeContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chatTime: { fontSize: 13, color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' },
  checkmark: { fontSize: 12, color: '#03C8F0' },
  chatMessage: { fontSize: 14, color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' },
  separator: { height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', marginLeft: 88 },
});
