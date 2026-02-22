import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function BlockListScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const [blockedUsers, setBlockedUsers] = useState([]);

  useEffect(() => {
    loadBlockedUsers();
  }, []);

  const loadBlockedUsers = async () => {
    const blocked = await AsyncStorage.getItem('blockedUsers');
    if (blocked) setBlockedUsers(JSON.parse(blocked));
  };

  const unblockUser = async (id) => {
    const updated = blockedUsers.filter(u => u.id !== id);
    setBlockedUsers(updated);
    await AsyncStorage.setItem('blockedUsers', JSON.stringify(updated));
  };

  const styles = getStyles(theme, isDark);

  return (
    <View style={styles.container}>
      <LinearGradient colors={isDark ? ['#1a0a2e', '#16213e', '#0f3460'] : ['#ffeef8', '#e8d5f2', '#d4e4f7']} style={styles.gradientBackground}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Blocked Users</Text>
            <Text style={styles.count}>{blockedUsers.length}</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {blockedUsers.length === 0 ? (
              <BlurView intensity={isDark ? 40 : 20} tint={isDark ? 'dark' : 'light'} style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>🚫</Text>
                <Text style={styles.emptyTitle}>No Blocked Users</Text>
                <Text style={styles.emptyText}>You haven't blocked anyone yet</Text>
              </View>
            ) : (
              <View style={styles.content}>
                {blockedUsers.map((user) => (
                  <BlurView key={user.id} intensity={isDark ? 60 : 40} tint={isDark ? 'dark' : 'light'} style={styles.userCard}>
                    <View style={styles.userInner}>
                      <View style={[styles.avatar, { backgroundColor: '#999' }]}>
                        <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
                      </View>
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>{user.name}</Text>
                        <Text style={styles.userDate}>Blocked on {user.blockedDate || 'Unknown'}</Text>
                      </View>
                      <TouchableOpacity style={styles.unblockBtn} onPress={() => unblockUser(user.id)}>
                        <Text style={styles.unblockText}>Unblock</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const getStyles = (theme, isDark) => StyleSheet.create({
  container: { flex: 1 },
  gradientBackground: { flex: 1 },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, overflow: 'hidden', borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)' },
  backIcon: { fontSize: 24, color: theme.text },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: theme.text },
  count: { fontSize: 16, fontWeight: 'bold', color: '#F70776', backgroundColor: isDark ? 'rgba(247,7,118,0.2)' : 'rgba(247,7,118,0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  emptyCard: { margin: 40, borderRadius: 24, padding: 40, alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)' },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: theme.text, marginBottom: 8 },
  emptyText: { fontSize: 14, color: theme.textSecondary, textAlign: 'center' },
  content: { padding: 20, gap: 12 },
  userCard: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)' },
  userInner: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  avatar: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarText: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: 'bold', color: theme.text, marginBottom: 4 },
  userDate: { fontSize: 13, color: theme.textSecondary },
  unblockBtn: { backgroundColor: '#F70776', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16 },
  unblockText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
