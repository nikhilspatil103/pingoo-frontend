import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileViewScreen({ route, navigation }) {
  const { theme, isDark } = useTheme();
  const { profile } = route.params;
  const [isStarred, setIsStarred] = useState(false);

  useEffect(() => {
    checkIfStarred();
  }, []);

  const checkIfStarred = async () => {
    const contacts = await AsyncStorage.getItem('contacts');
    if (contacts) {
      const list = JSON.parse(contacts);
      setIsStarred(list.some(c => c.id === profile.id));
    }
  };

  const toggleStar = async () => {
    const contacts = await AsyncStorage.getItem('contacts');
    let list = contacts ? JSON.parse(contacts) : [];
    
    if (isStarred) {
      list = list.filter(c => c.id !== profile.id);
    } else {
      list.push(profile);
    }
    
    await AsyncStorage.setItem('contacts', JSON.stringify(list));
    setIsStarred(!isStarred);
  };

  const styles = getStyles(theme, isDark);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark ? ['#1a0a2e', '#16213e', '#0f3460'] : ['#ffeef8', '#e8d5f2', '#d4e4f7']}
        style={styles.gradientBackground}
      >
        <SafeAreaView style={styles.safeArea}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <BlurView intensity={30} tint="dark" style={styles.backButtonBlur}>
              <Text style={styles.backIcon}>←</Text>
            </BlurView>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{profile.name}, {profile.age}</Text>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {profile.image ? (
              <ImageBackground source={{ uri: profile.image }} style={styles.profileImage} imageStyle={styles.imageStyle} />
            ) : (
              <LinearGradient colors={profile.borderColor} style={styles.profileImage}>
                <Text style={styles.avatarLetter}>{profile.name.charAt(0)}</Text>
              </LinearGradient>
            )}

            <BlurView intensity={isDark ? 20 : 15} tint={isDark ? 'dark' : 'light'} style={styles.infoCard}>
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
                <Text style={styles.infoLabel}>Height:</Text>
                <Text style={styles.infoValue}>{profile.height ? `${profile.height} cm` : 'Not mentioned'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Body Type:</Text>
                <Text style={styles.infoValue}>{profile.bodyType || 'Not mentioned'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Location:</Text>
                <Text style={styles.infoValue}>📍 {profile.currentCity || 'New York'}</Text>
              </View>
              
              <View style={styles.divider} />
              
              <Text style={styles.aboutTitle}>About me:</Text>
              <Text style={styles.aboutText}>{profile.bio || 'Looking for people interested in art and culture. Love exploring new places and meeting creative minds.'}</Text>
              
              <View style={styles.divider} />
              
              <Text style={styles.aboutTitle}>Interests:</Text>
              <View style={styles.tagsContainer}>
                {profile.interests && profile.interests.length > 0 ? (
                  profile.interests.map((interest, index) => (
                    <BlurView key={index} intensity={20} tint={isDark ? 'dark' : 'light'} style={styles.tag}>
                      <Text style={styles.tagText}>{interest}</Text>
                    </BlurView>
                  ))
                ) : (
                  <>
                    <BlurView intensity={20} tint={isDark ? 'dark' : 'light'} style={styles.tag}>
                      <Text style={styles.tagText}>{profile.tag}</Text>
                    </BlurView>
                    <BlurView intensity={20} tint={isDark ? 'dark' : 'light'} style={styles.tag}>
                      <Text style={styles.tagText}>Art & Culture</Text>
                    </BlurView>
                  </>
                )}
              </View>
              
              <View style={styles.divider} />
              
              <Text style={styles.aboutTitle}>Lifestyle:</Text>
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailIcon}>🚬</Text>
                  <View>
                    <Text style={styles.detailLabel}>Smoking</Text>
                    <Text style={styles.detailValue}>{profile.smoking || 'Not mentioned'}</Text>
                  </View>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailIcon}>🍷</Text>
                  <View>
                    <Text style={styles.detailLabel}>Drinking</Text>
                    <Text style={styles.detailValue}>{profile.drinking || 'Not mentioned'}</Text>
                  </View>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailIcon}>🏃</Text>
                  <View>
                    <Text style={styles.detailLabel}>Exercise</Text>
                    <Text style={styles.detailValue}>{profile.exercise || 'Not mentioned'}</Text>
                  </View>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailIcon}>🥗</Text>
                  <View>
                    <Text style={styles.detailLabel}>Diet</Text>
                    <Text style={styles.detailValue}>{profile.diet || 'Not mentioned'}</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.divider} />
              
              <Text style={styles.aboutTitle}>Relationship:</Text>
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailIcon}>💕</Text>
                  <View>
                    <Text style={styles.detailLabel}>Looking for</Text>
                    <Text style={styles.detailValue}>{profile.lookingFor || 'Not mentioned'}</Text>
                  </View>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailIcon}>💑</Text>
                  <View>
                    <Text style={styles.detailLabel}>Status</Text>
                    <Text style={styles.detailValue}>{profile.relationshipStatus || 'Not mentioned'}</Text>
                  </View>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailIcon}>👶</Text>
                  <View>
                    <Text style={styles.detailLabel}>Kids</Text>
                    <Text style={styles.detailValue}>{profile.kids || 'Not mentioned'}</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.divider} />
              
              <Text style={styles.aboutTitle}>Work & Education:</Text>
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailIcon}>💼</Text>
                  <View>
                    <Text style={styles.detailLabel}>Occupation</Text>
                    <Text style={styles.detailValue}>{profile.occupation || 'Not mentioned'}</Text>
                  </View>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailIcon}>🏢</Text>
                  <View>
                    <Text style={styles.detailLabel}>Company</Text>
                    <Text style={styles.detailValue}>{profile.company || 'Not mentioned'}</Text>
                  </View>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailIcon}>🎓</Text>
                  <View>
                    <Text style={styles.detailLabel}>Education</Text>
                    <Text style={styles.detailValue}>{profile.graduation || 'Not mentioned'}</Text>
                  </View>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailIcon}>🏫</Text>
                  <View>
                    <Text style={styles.detailLabel}>School</Text>
                    <Text style={styles.detailValue}>{profile.school || 'Not mentioned'}</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.divider} />
              
              <Text style={styles.aboutTitle}>Location:</Text>
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailIcon}>🏠</Text>
                  <View>
                    <Text style={styles.detailLabel}>Hometown</Text>
                    <Text style={styles.detailValue}>{profile.hometown || 'Not mentioned'}</Text>
                  </View>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailIcon}>📍</Text>
                  <View>
                    <Text style={styles.detailLabel}>Lives in</Text>
                    <Text style={styles.detailValue}>{profile.currentCity || 'Not mentioned'}</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.divider} />
              
              <Text style={styles.aboutTitle}>Languages:</Text>
              <View style={styles.tagsContainer}>
                {profile.languages && profile.languages.length > 0 ? (
                  profile.languages.map((lang, index) => (
                    <BlurView key={index} intensity={20} tint={isDark ? 'dark' : 'light'} style={styles.tagOutline}>
                      <Text style={styles.tagOutlineText}>{lang}</Text>
                    </BlurView>
                  ))
                ) : (
                  <>
                    <BlurView intensity={20} tint={isDark ? 'dark' : 'light'} style={styles.tagOutline}>
                      <Text style={styles.tagOutlineText}>English</Text>
                    </BlurView>
                    <BlurView intensity={20} tint={isDark ? 'dark' : 'light'} style={styles.tagOutline}>
                      <Text style={styles.tagOutlineText}>Spanish</Text>
                    </BlurView>
                  </>
                )}
              </View>
            </BlurView>
          </ScrollView>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => navigation.navigate('Chat', { profile })}>
              <BlurView intensity={isDark ? 40 : 30} tint={isDark ? 'dark' : 'light'} style={styles.chatButton}>
                <Text style={styles.chatButtonText}>💬 Start Chat</Text>
              </BlurView>
            </TouchableOpacity>
            <TouchableOpacity>
              <BlurView intensity={isDark ? 80 : 60} tint={isDark ? 'dark' : 'light'} style={styles.actionButton}>
                <Text style={styles.actionIcon}>❤️</Text>
              </BlurView>
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleStar}>
              <BlurView intensity={isDark ? 80 : 60} tint={isDark ? 'dark' : 'light'} style={styles.actionButton}>
                <Text style={styles.actionIcon}>{isStarred ? '⭐' : '☆'}</Text>
              </BlurView>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const getStyles = (theme, isDark) => StyleSheet.create({
  container: { flex: 1 },
  gradientBackground: { flex: 1 },
  safeArea: { flex: 1 },
  backButton: { position: 'absolute', top: 50, left: 20, zIndex: 10, width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
  backButtonBlur: { flex: 1, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  backIcon: { fontSize: 24, color: '#fff' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: theme.text, textAlign: 'center', marginTop: 50, marginBottom: 20 },
  content: { flex: 1, paddingHorizontal: 20, paddingBottom: 100 },
  profileImage: { width: '100%', height: 450, borderRadius: 24, marginBottom: 20, justifyContent: 'center', alignItems: 'center' },
  imageStyle: { borderRadius: 24 },
  avatarLetter: { fontSize: 120, fontWeight: 'bold', color: '#fff' },
  infoCard: { borderRadius: 24, padding: 20, marginBottom: 20, overflow: 'hidden', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  infoLabel: { fontSize: 15, fontWeight: '600', color: theme.textSecondary },
  infoValue: { fontSize: 15, color: theme.text, fontWeight: '500' },
  genderIcon: { fontSize: 15, fontWeight: '600' },
  divider: { height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', marginVertical: 15 },
  detailRow: { gap: 16 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  detailIcon: { fontSize: 24 },
  detailLabel: { fontSize: 13, fontWeight: '600', color: theme.textSecondary },
  detailValue: { fontSize: 15, color: theme.text, fontWeight: '500' },
  aboutTitle: { fontSize: 16, fontWeight: '600', color: theme.text, marginBottom: 8 },
  aboutText: { fontSize: 15, color: theme.text, marginBottom: 20 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tag: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)' },
  tagText: { color: theme.text, fontSize: 14, fontWeight: '500' },
  tagOutline: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)' },
  tagOutlineText: { color: theme.text, fontSize: 14, fontWeight: '500' },
  actionButtons: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: 'transparent' },
  actionButton: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)' },
  actionIcon: { fontSize: 24 },
  chatButton: { paddingVertical: 14, borderRadius: 28, alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.5)' },
  chatButtonText: { fontSize: 16, fontWeight: '600', color: theme.text },
});
