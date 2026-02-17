import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, ImageBackground } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function ProfileViewScreen({ route, navigation }) {
  const { theme, isDark } = useTheme();
  const { profile } = route.params;

  const styles = getStyles(theme, isDark);

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backIcon}>←</Text>
      </TouchableOpacity>

      <Text style={styles.headerTitle}>{profile.name}, {profile.age}</Text>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {profile.image ? (
          <ImageBackground source={{ uri: profile.image }} style={styles.profileImage} imageStyle={styles.imageStyle} />
        ) : (
          <View style={[styles.profileImage, { backgroundColor: profile.borderColor[0] }]}>
            <Text style={styles.avatarLetter}>{profile.name.charAt(0)}</Text>
          </View>
        )}

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Age:</Text>
            <Text style={styles.infoValue}>{profile.age}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Gender:</Text>
            <Text style={[styles.genderIcon, { color: profile.gender === 'female' ? '#F70776' : '#03C8F0' }]}>
              {profile.gender === 'female' ? '♀ Female' : '♂ Male'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Location:</Text>
            <Text style={styles.infoValue}>📍 New York</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Here for:</Text>
            <Text style={styles.infoValue}>3 months</Text>
          </View>
          
          <View style={styles.divider} />
          
          <Text style={styles.aboutTitle}>About me:</Text>
          <Text style={styles.aboutText}>Looking for people interested in art and culture. Love exploring new places and meeting creative minds.</Text>
          
          <View style={styles.divider} />
          
          <Text style={styles.aboutTitle}>Interests:</Text>
          <View style={styles.tagsContainer}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{profile.tag}</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagText}>Art & Culture</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagText}>Photography</Text>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <Text style={styles.aboutTitle}>Languages:</Text>
          <View style={styles.tagsContainer}>
            <View style={styles.tagOutline}>
              <Text style={styles.tagOutlineText}>English</Text>
            </View>
            <View style={styles.tagOutline}>
              <Text style={styles.tagOutlineText}>Spanish</Text>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <Text style={styles.aboutTitle}>Looking for:</Text>
          <View style={styles.tagsContainer}>
            <View style={styles.tagOutline}>
              <Text style={styles.tagOutlineText}>Not in a rush</Text>
            </View>
            <View style={styles.tagOutline}>
              <Text style={styles.tagOutlineText}>No goals</Text>
            </View>
            <View style={styles.tagOutline}>
              <Text style={styles.tagOutlineText}>Friendship</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#F70776' }]}>
          <Text style={styles.actionIcon}>❤️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#FF88C5' }]}>
          <Text style={styles.actionIcon}>⭐</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#03C8F0' }]}>
          <Text style={styles.actionIcon}>👋</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.navIcon}>🏠</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>❤️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>💬</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>😊</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (theme, isDark) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDark ? '#130B1A' : '#F3E9EC' },
  backButton: { position: 'absolute', top: 50, left: 20, zIndex: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 24, color: '#fff' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: theme.text, textAlign: 'center', marginTop: 50, marginBottom: 20 },
  content: { flex: 1, paddingHorizontal: 20 },
  profileImage: { width: '100%', height: 450, borderRadius: 24, marginBottom: 20, justifyContent: 'center', alignItems: 'center' },
  imageStyle: { borderRadius: 24 },
  avatarLetter: { fontSize: 120, fontWeight: 'bold', color: '#fff' },
  infoCard: { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', borderRadius: 20, padding: 20, marginBottom: 100 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  infoLabel: { fontSize: 15, fontWeight: '600', color: theme.textSecondary },
  infoValue: { fontSize: 15, color: theme.text, fontWeight: '500' },
  genderIcon: { fontSize: 15, fontWeight: '600' },
  divider: { height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', marginVertical: 15 },
  locationText: { fontSize: 14, color: theme.textSecondary, marginBottom: 15 },
  aboutTitle: { fontSize: 16, fontWeight: '600', color: theme.text, marginBottom: 8 },
  aboutText: { fontSize: 15, color: theme.text, marginBottom: 20 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tag: { backgroundColor: isDark ? '#F70776' : '#F70776', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  tagText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  tagOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: isDark ? '#03C8F0' : '#03C8F0', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  tagOutlineText: { color: isDark ? '#03C8F0' : '#03C8F0', fontSize: 14, fontWeight: '500' },
  actionButtons: { position: 'absolute', bottom: 100, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 20, paddingHorizontal: 40 },
  actionButton: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  actionIcon: { fontSize: 32 },
  bottomNav: { flexDirection: 'row', backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.9)', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30, justifyContent: 'space-around', marginHorizontal: 20, marginBottom: 20 },
  navItem: { alignItems: 'center' },
  navIcon: { fontSize: 28 },
});
