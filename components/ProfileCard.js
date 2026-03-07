import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import OptimizedImage from './OptimizedImage';
import { getStoredLocation, calculateDistance, formatDistance } from '../utils/locationService';
import { formatLastSeen } from '../utils/timeUtils';

let FastImage;
if (Platform.OS !== 'web') {
  FastImage = require('react-native-fast-image');
}

const ProfileCard = React.memo(({ profile, onPress, isDark, theme }) => {
  const priority = Platform.OS !== 'web' ? FastImage?.priority?.normal : undefined;
  const [distance, setDistance] = useState(null);

  useEffect(() => {
    const loadDistance = async () => {
      if (profile.latitude && profile.longitude) {
        const userLocation = await getStoredLocation();
        if (userLocation) {
          const dist = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            profile.latitude,
            profile.longitude
          );
          setDistance(formatDistance(dist));
        }
      }
    };
    loadDistance();
  }, [profile.latitude, profile.longitude]);
  
  return (
    <TouchableOpacity style={styles.wrapper} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.glassCard(isDark)}>
        <View style={styles.cardImage}>
          <OptimizedImage
            uri={profile.profilePhoto}
            style={styles.cardImageFull}
            userId={profile.id}
            userName={profile.name}
            priority={priority}
          />
          {profile.isOnline ? (
            <View style={styles.onlineBadge}>
              <View style={styles.onlineDot} />
            </View>
          ) : (
            <View style={styles.lastSeenBadge}>
              <Text style={styles.lastSeenText}>{formatLastSeen(profile.lastSeen)}</Text>
            </View>
          )}
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.cardGradient}>
            <View style={styles.cardOverlay}>
              <View style={styles.cardInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.profileName}>{profile.name}, {profile.age || 'N/A'}</Text>
                  {profile.likesCount > 0 && (
                    <View style={styles.likesBadge}>
                      <Text style={styles.likesText}>❤️ {profile.likesCount}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.profileLocation}>📍 {distance || profile.location || 'Unknown'}</Text>
                <View style={styles.tagBadge}>
                  <Text style={[styles.genderIcon, { color: profile.gender === 'female' ? '#F70776' : '#03C8F0' }]}>
                    {profile.gender === 'female' ? '♀' : '♂'}
                  </Text>
                  <Text style={styles.tagText} numberOfLines={2} ellipsizeMode="tail">
                    {profile.lookingFor || 'Looking for friends'}
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const ListCard = React.memo(({ profile, onPress, isDark, theme }) => {
  const priority = Platform.OS !== 'web' ? FastImage?.priority?.normal : undefined;
  const [distance, setDistance] = useState(null);

  useEffect(() => {
    const loadDistance = async () => {
      if (profile.latitude && profile.longitude) {
        const userLocation = await getStoredLocation();
        if (userLocation) {
          const dist = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            profile.latitude,
            profile.longitude
          );
          setDistance(formatDistance(dist));
        }
      }
    };
    loadDistance();
  }, [profile.latitude, profile.longitude]);
  
  return (
    <TouchableOpacity style={styles.listCard(isDark)} onPress={onPress} activeOpacity={1}>
      <View style={styles.listCardContent}>
        <View style={styles.listImageContainer}>
          <OptimizedImage
            uri={profile.profilePhoto}
            style={styles.listImage}
            userId={profile.id}
            userName={profile.name}
            priority={priority}
          />
          {profile.isOnline ? (
            <View style={styles.listOnlineBadge}>
              <View style={styles.listOnlineDot} />
            </View>
          ) : (
            <View style={styles.listLastSeenBadge}>
              <Text style={styles.listLastSeenText}>{formatLastSeen(profile.lastSeen)}</Text>
            </View>
          )}
        </View>
        <View style={styles.listInfo}>
          <View style={styles.listNameRow}>
            <Text style={[styles.listName, { color: theme.text }]}>{profile.name}, {profile.age || 'N/A'}</Text>
            {profile.likesCount > 0 && (
              <Text style={[styles.listLikes, { color: theme.text }]}>❤️ {profile.likesCount}</Text>
            )}
          </View>
          <Text style={[styles.listLocation, { color: theme.textSecondary }]}>📍 {distance || profile.location || 'Unknown'}</Text>
          <View style={styles.listTagRow}>
            <Text style={[styles.listGenderIcon, { color: profile.gender === 'female' ? '#F70776' : '#03C8F0' }]}>
              {profile.gender === 'female' ? '♀' : '♂'}
            </Text>
            <Text style={[styles.listTag, { color: theme.textSecondary }]} numberOfLines={2} ellipsizeMode="tail">
              {profile?.lookingFor || 'Looking for friends'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  wrapper: { width: '48%', marginBottom: 12 },
  glassCard: (isDark) => ({
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isDark ? 0.4 : 0.2,
    shadowRadius: 12,
    elevation: 8,
    shadowColor: isDark ? '#000' : '#999',
  }),
  cardImage: { width: '100%', height: 240, borderRadius: 20, overflow: 'hidden', position: 'relative' },
  cardImageFull: { width: '100%', height: '100%', borderRadius: 20 },
  onlineBadge: { 
    position: 'absolute', 
    top: 12, 
    right: 12, 
    width: 12, 
    height: 12, 
    borderRadius: 6, 
    backgroundColor: 'rgba(0,0,0,0.3)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  onlineDot: { 
    width: 8, 
    height: 8, 
    borderRadius: 4, 
    backgroundColor: '#00ff00' 
  },
  lastSeenBadge: { 
    position: 'absolute', 
    top: 10, 
    right: 10, 
    paddingHorizontal: 6, 
    paddingVertical: 2, 
    borderRadius: 8, 
    backgroundColor: 'rgba(0,0,0,0.6)' 
  },
  lastSeenText: { 
    fontSize: 9, 
    color: '#fff', 
    fontWeight: '500' 
  },
  cardGradient: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '50%' },
  cardOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 10, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)' },
  cardInfo: { gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  likesBadge: { flexDirection: 'row', alignItems: 'center' },
  likesText: { fontSize: 10, color: '#fff', fontWeight: 'bold' },
  profileName: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  profileLocation: { fontSize: 11, color: '#fff' },
  profileDistance: { fontSize: 11, color: '#F70776', fontWeight: '600' },
  tagBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.4)', alignSelf: 'flex-start' },
  genderIcon: { fontSize: 14, fontWeight: 'bold' },
  tagText: { fontSize: 11, color: '#fff', flex: 1 },
  listCard: (isDark) => ({ width: '100%', backgroundColor: isDark ? '#1a1a1a' : '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, marginBottom: 15 }),
  listCardContent: { flexDirection: 'row', padding: 12 },
  listImage: { width: 80, height: 80, borderRadius: 12, overflow: 'hidden' },
  listImageContainer: { position: 'relative' },
  listOnlineBadge: { 
    position: 'absolute', 
    top: 4, 
    right: 4, 
    width: 10, 
    height: 10, 
    borderRadius: 5, 
    backgroundColor: 'rgba(0,0,0,0.3)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  listOnlineDot: { 
    width: 6, 
    height: 6, 
    borderRadius: 3, 
    backgroundColor: '#00ff00' 
  },
  listLastSeenBadge: { 
    position: 'absolute', 
    top: 3, 
    right: 3, 
    paddingHorizontal: 4, 
    paddingVertical: 1, 
    borderRadius: 6, 
    backgroundColor: 'rgba(0,0,0,0.6)' 
  },
  listLastSeenText: { 
    fontSize: 7, 
    color: '#fff', 
    fontWeight: '500' 
  },
  listInfo: { flex: 1, marginLeft: 15, justifyContent: 'center' },
  listNameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  listName: { fontSize: 18, fontWeight: 'bold' },
  listLikes: { fontSize: 12, fontWeight: 'bold' },
  listLocation: { fontSize: 12, marginBottom: 6 },
  listDistance: { fontSize: 12, color: '#F70776', fontWeight: '600', marginBottom: 6 },
  listTagRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  listGenderIcon: { fontSize: 16, fontWeight: 'bold' },
  listTag: { fontSize: 14 },
});

export { ProfileCard, ListCard };
