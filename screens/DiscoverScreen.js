import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, TextInput } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function DiscoverScreen({ navigation }) {
  const { theme, isDark, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const groups = [
    { id: 1, icon: '☕', title: 'Coffee Lovers', members: 124, description: 'Weekly coffee meetups', color: '#FF6B9D' },
    { id: 2, icon: '🏃', title: 'Morning Runners', members: 89, description: 'Run together every morning', color: '#4ECDC4' },
    { id: 3, icon: '🎮', title: 'Gaming Squad', members: 156, description: 'Play games, make friends', color: '#FFB6C1' },
    { id: 4, icon: '🍕', title: 'Foodies United', members: 203, description: 'Explore new restaurants', color: '#E0BBE4' },
    { id: 5, icon: '🎬', title: 'Movie Buffs', members: 78, description: 'Watch and discuss movies', color: '#FF6B9D' },
    { id: 6, icon: '🏋️', title: 'Gym Buddies', members: 145, description: 'Workout partners wanted', color: '#4ECDC4' },
  ];

  const styles = getStyles(theme, isDark);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
        <TouchableOpacity style={styles.themeButton} onPress={toggleTheme}>
          <Text style={styles.themeIcon}>{isDark ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search groups..."
          placeholderTextColor={theme.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
        <TouchableOpacity style={styles.categoryChip}>
          <Text style={styles.categoryText}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.categoryChipOutline}>
          <Text style={styles.categoryTextOutline}>Sports</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.categoryChipOutline}>
          <Text style={styles.categoryTextOutline}>Food</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.categoryChipOutline}>
          <Text style={styles.categoryTextOutline}>Entertainment</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Groups List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {groups.map((group) => (
          <TouchableOpacity key={group.id} style={styles.groupCard}>
            <View style={[styles.groupIcon, { backgroundColor: group.color + '20' }]}>
              <Text style={styles.groupEmoji}>{group.icon}</Text>
            </View>
            <View style={styles.groupInfo}>
              <Text style={styles.groupTitle}>{group.title}</Text>
              <Text style={styles.groupDescription}>{group.description}</Text>
              <Text style={styles.groupMembers}>👥 {group.members} members</Text>
            </View>
            <TouchableOpacity style={[styles.joinButton, { backgroundColor: group.color }]}>
              <Text style={styles.joinButtonText}>Join</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
          <View style={styles.navIconContainer}>
            <Text style={styles.navIcon}>🔍</Text>
          </View>
          <Text style={styles.navLabel}>Find</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <View style={[styles.navIconContainer, styles.navIconActive]}>
            <Text style={styles.navIcon}>🌟</Text>
          </View>
          <Text style={styles.navLabel}>Discover</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <View style={styles.navIconContainer}>
            <Text style={styles.navIcon}>💬</Text>
          </View>
          <Text style={styles.navLabel}>Chats</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('MyProfile')}>
          <View style={styles.navIconContainer}>
            <Text style={styles.navIcon}>👤</Text>
          </View>
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (theme, isDark) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDark ? '#130B1A' : '#F3E9EC' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 15,
    backgroundColor: isDark ? '#130B1A' : '#F3E9EC',
  },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: theme.text },
  themeButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  themeIcon: { fontSize: 20 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 15,
    paddingHorizontal: 15,
    height: 50,
    backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
    borderRadius: 25,
  },
  searchIcon: { fontSize: 20, marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: theme.text },
  categories: { paddingHorizontal: 20, marginBottom: 20 },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: isDark ? '#2a2a2a' : '#e0e0e0',
    borderRadius: 20,
    marginRight: 10,
  },
  categoryText: { color: theme.text, fontWeight: '600', fontSize: 14 },
  categoryChipOutline: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: isDark ? '#2a2a2a' : '#e0e0e0',
    borderRadius: 20,
    marginRight: 10,
  },
  categoryTextOutline: { color: theme.textSecondary, fontWeight: '600', fontSize: 14 },
  content: { flex: 1, paddingHorizontal: 20 },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
  },
  groupIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  groupEmoji: { fontSize: 32 },
  groupInfo: { flex: 1 },
  groupTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 4 },
  groupDescription: { fontSize: 14, color: theme.textSecondary, marginBottom: 6 },
  groupMembers: { fontSize: 12, color: theme.textTertiary },
  joinButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  joinButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  bottomNav: { 
    flexDirection: 'row', 
    backgroundColor: isDark ? '#130B1A' : '#F3E9EC',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: isDark ? '#1a1a1a' : '#f0f0f0',
    justifyContent: 'space-around',
  },
  navItem: { 
    alignItems: 'center',
    gap: 4,
  },
  navIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navIconActive: {
    backgroundColor: isDark ? '#2a2a2a' : '#e0e0e0',
  },
  navIcon: { fontSize: 24 },
  navLabel: {
    fontSize: 11,
    color: theme.textSecondary,
    marginTop: 4,
  },
});
