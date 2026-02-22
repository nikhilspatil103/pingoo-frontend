import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
// import { View } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function DeleteAccountScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const { logout } = useAuth();
  const [confirmed, setConfirmed] = useState(false);

  const handleDelete = () => {
    Alert.alert(
      'Delete Account',
      'Are you absolutely sure? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          },
        },
      ]
    );
  };

  const styles = getStyles(theme, isDark);

  return (
    <View style={styles.container}>
      <LinearGradient colors={isDark ? ['#1a0a2e', '#16213e', '#0f3460'] : ['#ffeef8', '#e8d5f2', '#d4e4f7']} style={styles.gradientBackground}>
        <SafeAreaView style={styles.safeArea}>
          <View tint={isDark ? 'dark' : 'light'} style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Delete Account</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View  tint={isDark ? 'dark' : 'light'} style={styles.warningCard}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <Text style={styles.warningTitle}>Warning</Text>
              <Text style={styles.warningText}>Deleting your account is permanent and cannot be undone.</Text>
            </View>

            <View tint={isDark ? 'dark' : 'light'} style={styles.card}>
              <Text style={styles.title}>What will be deleted:</Text>
              <View style={styles.item}>
                <Text style={styles.itemIcon}>👤</Text>
                <Text style={styles.itemText}>Your profile and personal information</Text>
              </View>
              <View style={styles.item}>
                <Text style={styles.itemIcon}>💬</Text>
                <Text style={styles.itemText}>All your messages and conversations</Text>
              </View>
              <View style={styles.item}>
                <Text style={styles.itemIcon}>📸</Text>
                <Text style={styles.itemText}>All uploaded photos</Text>
              </View>
              <View style={styles.item}>
                <Text style={styles.itemIcon}>⭐</Text>
                <Text style={styles.itemText}>Your contacts and connections</Text>
              </View>
              <View style={styles.item}>
                <Text style={styles.itemIcon}>◎</Text>
                <Text style={styles.itemText}>All remaining coins</Text>
              </View>
            </View>

            <View  tint={isDark ? 'dark' : 'light'} style={styles.confirmCard}>
              <TouchableOpacity style={styles.checkbox} onPress={() => setConfirmed(!confirmed)}>
                <Text style={styles.checkboxIcon}>{confirmed ? '☑' : '☐'}</Text>
                <Text style={styles.checkboxText}>I understand this action is permanent</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.deleteBtn, !confirmed && styles.deleteBtnDisabled]} 
              onPress={handleDelete}
              disabled={!confirmed}
            >
              <Text style={styles.deleteBtnText}>Delete My Account</Text>
            </TouchableOpacity>

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
  warningCard: { margin: 20, marginBottom: 12, borderRadius: 20, padding: 20, alignItems: 'center', overflow: 'hidden', borderWidth: 2, borderColor: '#FF6B6B' },
  warningIcon: { fontSize: 48, marginBottom: 12 },
  warningTitle: { fontSize: 20, fontWeight: 'bold', color: '#FF6B6B', marginBottom: 8 },
  warningText: { fontSize: 14, color: theme.textSecondary, textAlign: 'center' },
  card: { marginHorizontal: 20, marginBottom: 12, borderRadius: 20, padding: 20, overflow: 'hidden', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)' },
  title: { fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 16 },
  item: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  itemIcon: { fontSize: 24, marginRight: 12 },
  itemText: { fontSize: 15, color: theme.textSecondary, flex: 1 },
  confirmCard: { marginHorizontal: 20, marginBottom: 20, borderRadius: 20, padding: 16, overflow: 'hidden', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)' },
  checkbox: { flexDirection: 'row', alignItems: 'center' },
  checkboxIcon: { fontSize: 24, marginRight: 12, color: theme.text },
  checkboxText: { fontSize: 15, color: theme.text, flex: 1 },
  deleteBtn: { marginHorizontal: 20, backgroundColor: '#FF6B6B', padding: 16, borderRadius: 16, alignItems: 'center' },
  deleteBtnDisabled: { backgroundColor: isDark ? 'rgba(255,107,107,0.3)' : 'rgba(255,107,107,0.5)' },
  deleteBtnText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
});
