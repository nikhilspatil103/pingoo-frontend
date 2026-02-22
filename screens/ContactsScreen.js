import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

export default function ContactsScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const [contacts, setContacts] = useState([]);

  useFocusEffect(
    React.useCallback(() => {
      loadContacts();
    }, [])
  );

  const loadContacts = async () => {
    const saved = await AsyncStorage.getItem('contacts');
    if (saved) setContacts(JSON.parse(saved));
  };

  const removeContact = async (id) => {
    const updated = contacts.filter(c => c.id !== id);
    setContacts(updated);
    await AsyncStorage.setItem('contacts', JSON.stringify(updated));
  };

  const styles = getStyles(theme, isDark);

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? '#1a0a2e' : '#ffeef8'} />
      <LinearGradient
        colors={isDark ? ['#1a0a2e', '#16213e', '#0f3460'] : ['#ffeef8', '#e8d5f2', '#d4e4f7']}
        style={styles.gradientBackground}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Contacts</Text>
            <Text style={styles.contactCount}>{contacts.length}</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {contacts.length === 0 ? (
              <BlurView intensity={isDark ? 40 : 20} tint={isDark ? 'dark' : 'light'} style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>⭐</Text>
                <Text style={styles.emptyTitle}>No Contacts Yet</Text>
                <Text style={styles.emptyText}>Star profiles to add them to your contacts</Text>
              </View>
            ) : (
              <View style={styles.content}>
                {contacts.map((contact) => (
                  <BlurView key={contact.id} intensity={isDark ? 60 : 40} tint={isDark ? 'dark' : 'light'} style={styles.contactCard}>
                    <TouchableOpacity 
                      style={styles.contactInner}
                      onPress={() => navigation.navigate('ProfileView', { profile: contact })}
                      activeOpacity={1}
                    >
                      <View style={[styles.avatar, { backgroundColor: contact.borderColor?.[0] || '#FFB6C1' }]}>
                        <Text style={styles.avatarText}>{contact.name.charAt(0)}</Text>
                      </View>
                      <View style={styles.contactInfo}>
                        <Text style={styles.contactName}>{contact.name}, {contact.age}</Text>
                        <Text style={styles.contactLocation}>📍 {contact.location || 'Unknown'}</Text>
                        <Text style={styles.contactTag}>{contact.tag || 'No tag'}</Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.removeBtn}
                        onPress={() => removeContact(contact.id)}
                        activeOpacity={1}
                      >
                        <Text style={styles.removeIcon}>✕</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
            <View style={{ height: 100 }} />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const getStyles = (theme, isDark) => StyleSheet.create({
  container: { flex: 1 },
  gradientBackground: { flex: 1 },
  safeArea: { flex: 1, paddingTop: StatusBar.currentHeight || 0 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 15,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)',
  },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: theme.text },
  contactCount: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#F70776',
    backgroundColor: isDark ? 'rgba(247,7,118,0.2)' : 'rgba(247,7,118,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  emptyCard: { 
    margin: 40, 
    borderRadius: 24, 
    padding: 40, 
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(147,147,147,0.5)',
  },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: theme.text, marginBottom: 8 },
  emptyText: { fontSize: 14, color: theme.textSecondary, textAlign: 'center' },
  content: { padding: 20, gap: 12 },
  contactCard: { 
    borderRadius: 20, 
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(147,147,147,0.5)',
  },
  contactInner: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  avatar: { 
    width: 64, 
    height: 64, 
    borderRadius: 32, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 4 },
  contactLocation: { fontSize: 13, color: theme.textSecondary, marginBottom: 4 },
  contactTag: { fontSize: 12, color: theme.textSecondary },
  removeBtn: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeIcon: { fontSize: 18, color: theme.textSecondary },
});
