import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, SafeAreaView, Animated, StatusBar, RefreshControl, ActivityIndicator, Modal, Image, TextInput } from 'react-native';
import RangeSlider from '../components/RangeSlider';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLikes } from '../context/LikesContext';
import { useFocusEffect } from '@react-navigation/native';
import PingooLogo from '../components/PingooLogo';
import PingooLoader from '../assets/brand/PingooLoader';
import { ProfileCard, ListCard } from '../components/ProfileCard';
import useProfileStore from '../store/profileStore';
import ProfileSocketService from '../services/ProfileSocketService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/urlConfig';
import { getStoredLocation, calculateDistance } from '../utils/locationService';
import { FEATURES } from '../config/featureFlags';

export default function HomeScreen({ navigation }) {
  const { theme, isDark, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const { newLikes, unreadCount, fetchNewLikes } = useLikes();
  const [isListView, setIsListView] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [ageRange, setAgeRange] = useState({ min: 18, max: 80 });
  const [genderFilter, setGenderFilter] = useState('both');
  const [distanceFilter, setDistanceFilter] = useState(50);
  const [userLocation, setUserLocation] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [slideAnim] = useState(new Animated.Value(0));
  
  const { profiles, page, hasMore, initialLoading, loadingMore, refreshing, fetchProfiles, setPage, updateUserOnlineStatus } = useProfileStore();

  useFocusEffect(
    React.useCallback(() => {
      fetchProfiles(1, false);
      fetchNewLikes();

      // Load user location for distance filtering
      if (FEATURES.DISTANCE_FILTER) {
        getStoredLocation().then(loc => { if (loc) setUserLocation(loc); });
      }
      
      // Setup WebSocket for real-time updates
      const setupSocket = async () => {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          ProfileSocketService.connect(token);
          
          const handleUserOnline = (data) => {
            updateUserOnlineStatus(data.userId, true);
          };
          
          const handleUserOffline = (data) => {
            updateUserOnlineStatus(data.userId, false);
          };
          
          ProfileSocketService.on('user-online', handleUserOnline);
          ProfileSocketService.on('user-offline', handleUserOffline);
          
          // Cleanup function
          return () => {
            ProfileSocketService.off('user-online', handleUserOnline);
            ProfileSocketService.off('user-offline', handleUserOffline);
          };
        }
      };
      
      const cleanup = setupSocket();
      
      return () => {
        // Unsubscribe from socket events on unmount
        if (cleanup) cleanup.then(fn => fn && fn());
      };
    }, [])
  );

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [isDark]);

  const onRefresh = useCallback(() => {
    fetchProfiles(1, true);
  }, [fetchProfiles]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchProfiles(nextPage, false);
    }
  }, [page, loadingMore, hasMore, fetchProfiles, setPage]);

  const renderItem = useCallback(({ item, index }) => {
    if (isListView) {
      return <ListCard profile={item} onPress={() => navigation.navigate('ProfileView', { profile: item })} isDark={isDark} theme={theme} index={index} />;
    }
    return <ProfileCard profile={item} onPress={() => navigation.navigate('ProfileView', { profile: item })} isDark={isDark} theme={theme} index={index} />;
  }, [isListView, isDark, theme, navigation]);

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="large" color="#FF6B9D" />
          <Text style={styles.footerLoaderText}>Loading more profiles...</Text>
        </View>
      );
    }
    if (!hasMore && filteredProfiles.length > 0) {
      return (
        <View style={styles.footerLoader}>
          <Text style={styles.footerEndText}>No more profiles</Text>
        </View>
      );
    }
    return null;
  };

  const keyExtractor = useCallback((item) => item.id.toString(), []);

  const filteredProfiles = profiles.filter(profile => {
    // Gender filter
    if (genderFilter !== 'both' && profile.gender !== genderFilter) return false;
    // Age filter
    if (profile.age && (profile.age < ageRange.min || profile.age > ageRange.max)) return false;
    // Online filter
    if (filterType === 'online' && !profile.isOnline) return false;
    // Distance filter
    if (FEATURES.DISTANCE_FILTER && userLocation && profile.latitude && profile.longitude) {
      const dist = calculateDistance(userLocation.latitude, userLocation.longitude, profile.latitude, profile.longitude);
      if (dist > distanceFilter) return false;
    }
    return true;
  }).sort((a, b) => {
    if (filterType === 'age') return a.age - b.age;
    if (filterType === 'mostLiked') return (b.likesCount || 0) - (a.likesCount || 0);
    return 0;
  });

  const applyFilter = (type) => {
    setFilterType(type);
    setFilterVisible(false);
  };

  const searchUsers = async (query) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(query.trim())}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.users || []);
      }
    } catch (e) {
      console.error('Search error:', e);
    } finally {
      setSearching(false);
    }
  };

  const clearFilters = () => {
    setFilterType('all');
    setGenderFilter('both');
    setAgeRange({ min: 18, max: 80 });
    setDistanceFilter(50);
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
            <Text style={styles.headerTitle}>Pingoo</Text>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.viewToggle} onPress={() => setSearchVisible(true)} activeOpacity={0.7}>
                <Ionicons name="search-outline" size={20} color={isDark ? '#fff' : '#333'} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.viewToggle} 
                onPress={() => navigation.navigate('Notifications')} 
                activeOpacity={0.7}
              >
                <Ionicons name="notifications-outline" size={20} color={isDark ? '#fff' : '#333'} />
                {unreadCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.viewToggle} onPress={() => setFilterVisible(true)} activeOpacity={0.7}>
                <Ionicons name="options-outline" size={20} color={isDark ? '#fff' : '#333'} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.viewToggle} onPress={() => setIsListView(!isListView)} activeOpacity={0.7}>
                <Ionicons name={isListView ? 'grid-outline' : 'list-outline'} size={20} color={isDark ? '#fff' : '#333'} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.themeButton} onPress={toggleTheme} activeOpacity={0.7}>
                <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={20} color={isDark ? '#FFD93D' : '#333'} />
              </TouchableOpacity>
            </View>
          </View>

          {initialLoading ? (
            <View style={styles.loadingContainer}>
              <PingooLoader size={100} />
              <Text style={styles.loadingText}>Loading users...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredProfiles}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              numColumns={isListView ? 1 : 2}
              key={isListView ? 'list' : 'grid'}
              columnWrapperStyle={!isListView ? styles.gridRow : null}
              contentContainerStyle={isListView ? styles.listContainer : styles.gridContainer}
              showsVerticalScrollIndicator={false}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.text} />}
              onEndReached={loadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={renderFooter}
              ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyText}>No users found</Text></View>}
              windowSize={10}
              maxToRenderPerBatch={6}
              removeClippedSubviews={true}
              initialNumToRender={6}
              updateCellsBatchingPeriod={50}
            />
          )}
        </SafeAreaView>

        <Modal visible={filterVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <BlurView intensity={20} tint={isDark ? 'dark' : 'light'} style={styles.blurView}>
              <View style={[styles.modalContent, { backgroundColor: isDark ? 'rgba(26,10,46,0.95)' : 'rgba(255,238,248,0.95)' }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>Filters</Text>
                  <TouchableOpacity onPress={() => setFilterVisible(false)} style={styles.closeButton}>
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.filterSection}>
                  <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>GENDER</Text>
                  <View style={styles.genderButtons}>
                    <TouchableOpacity style={[styles.genderCard, genderFilter === 'male' && styles.genderCardActive]} onPress={() => setGenderFilter('male')}>
                      <Text style={[styles.genderEmoji, { color: genderFilter === 'male' ? '#fff' : (isDark ? '#fff' : '#000') }]}>♂</Text>
                      <Text style={[styles.genderCardText, { color: genderFilter === 'male' ? '#fff' : theme.text }]}>Male</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.genderCard, genderFilter === 'female' && styles.genderCardActive]} onPress={() => setGenderFilter('female')}>
                      <Text style={[styles.genderEmoji, { color: genderFilter === 'female' ? '#fff' : (isDark ? '#fff' : '#000') }]}>♀</Text>
                      <Text style={[styles.genderCardText, { color: genderFilter === 'female' ? '#fff' : theme.text }]}>Female</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.genderCard, genderFilter === 'both' && styles.genderCardActive]} onPress={() => setGenderFilter('both')}>
                      <Text style={[styles.genderEmoji, { color: genderFilter === 'both' ? '#fff' : (isDark ? '#fff' : '#000') }]}>⚥</Text>
                      <Text style={[styles.genderCardText, { color: genderFilter === 'both' ? '#fff' : theme.text }]}>Both</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.filterSection}>
                  <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>AGE RANGE ({ageRange.min} - {ageRange.max})</Text>
                  <View style={[styles.ageCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
                    <RangeSlider
                      min={18}
                      max={80}
                      low={ageRange.min}
                      high={ageRange.max}
                      theme={theme}
                      isDark={isDark}
                      onValueChanged={(low, high) => {
                        setAgeRange({ min: low, max: high });
                      }}
                    />
                  </View>
                </View>

                {FEATURES.DISTANCE_FILTER && (
                <View style={styles.filterSection}>
                  <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>DISTANCE ({distanceFilter} km)</Text>
                  <View style={styles.sortButtons}>
                    {[10, 20, 30, 50, 100].map(km => (
                      <TouchableOpacity key={km} style={[styles.sortChip, distanceFilter === km && styles.sortChipActive]} onPress={() => setDistanceFilter(km)}>
                        <Text style={[styles.sortChipText, { color: distanceFilter === km ? '#fff' : theme.text }]}>{km} km</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                )}

                <View style={styles.filterSection}>
                  <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>SORT BY</Text>
                  <View style={styles.sortButtons}>
                    <TouchableOpacity style={[styles.sortChip, filterType === 'all' && styles.sortChipActive]} onPress={() => setFilterType('all')}>
                      <Text style={[styles.sortChipText, { color: filterType === 'all' ? '#fff' : theme.text }]}>All</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.sortChip, filterType === 'online' && styles.sortChipActive]} onPress={() => setFilterType('online')}>
                      <Text style={[styles.sortChipText, { color: filterType === 'online' ? '#fff' : theme.text }]}>🟢 Online</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.sortChip, filterType === 'mostLiked' && styles.sortChipActive]} onPress={() => setFilterType('mostLiked')}>
                      <Text style={[styles.sortChipText, { color: filterType === 'mostLiked' ? '#fff' : theme.text }]}>❤️ Popular</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.sortChip, filterType === 'age' && styles.sortChipActive]} onPress={() => setFilterType('age')}>
                      <Text style={[styles.sortChipText, { color: filterType === 'age' ? '#fff' : theme.text }]}>🎂 Age</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.filterActions}>
                  <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                    <Text style={styles.clearButtonText}>Clear All</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.applyButton} onPress={() => setFilterVisible(false)}>
                    <Text style={styles.applyButtonText}>Apply</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </BlurView>
          </View>
        </Modal>

        <Modal visible={searchVisible} animationType="slide">
          <View style={[styles.searchContainer, { backgroundColor: isDark ? '#1a0a2e' : '#ffeef8' }]}>
            <LinearGradient colors={isDark ? ['#1a0a2e', '#16213e'] : ['#ffeef8', '#e8d5f2']} style={{ flex: 1 }}>
              <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.searchHeader}>
                  <TouchableOpacity onPress={() => { setSearchVisible(false); setSearchQuery(''); setSearchResults([]); }} style={styles.searchBackBtn}>
                    <Ionicons name="arrow-back" size={22} color={theme.text} />
                  </TouchableOpacity>
                  <View style={styles.searchInputWrapper}>
                    <Ionicons name="search" size={18} color={theme.textSecondary} />
                    <TextInput
                      style={[styles.searchInput, { color: theme.text }]}
                      placeholder="Search name or @username..."
                      placeholderTextColor={theme.textSecondary}
                      value={searchQuery}
                      onChangeText={searchUsers}
                      autoFocus
                      autoCapitalize="none"
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); }}>
                        <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {searching && (
                  <View style={styles.searchLoading}>
                    <ActivityIndicator size="small" color="#FF6B9D" />
                    <Text style={[styles.searchLoadingText, { color: theme.textSecondary }]}>Searching...</Text>
                  </View>
                )}

                {!searching && searchQuery.length === 0 && (
                  <View style={styles.searchHint}>
                    <Ionicons name="people-outline" size={60} color={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'} />
                    <Text style={[styles.searchHintTitle, { color: theme.text }]}>Find People</Text>
                    <Text style={[styles.searchHintText, { color: theme.textSecondary }]}>Search by name or @username to find and connect with people</Text>
                  </View>
                )}

                {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
                  <View style={styles.searchHint}>
                    <Ionicons name="search-outline" size={50} color={isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'} />
                    <Text style={[styles.searchHintTitle, { color: theme.text }]}>No results</Text>
                    <Text style={[styles.searchHintText, { color: theme.textSecondary }]}>Try a different name or username</Text>
                  </View>
                )}

                <FlatList
                  data={searchResults}
                  keyExtractor={item => item.id.toString()}
                  contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8 }}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={[styles.searchResultCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#fff' }]} 
                      onPress={() => { setSearchVisible(false); setSearchQuery(''); setSearchResults([]); navigation.navigate('ProfileView', { profile: item }); }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.searchResultLeft}>
                        {item.profilePhoto ? (
                          <Image source={{ uri: item.profilePhoto }} style={styles.searchResultAvatar} />
                        ) : (
                          <LinearGradient colors={['#FF6B9D', '#FF3B7F']} style={styles.searchResultAvatar}>
                            <Text style={styles.searchResultAvatarText}>{item.name?.[0]}</Text>
                          </LinearGradient>
                        )}
                        {item.isOnline && <View style={styles.searchResultOnline} />}
                      </View>
                      <View style={styles.searchResultInfo}>
                        <Text style={[styles.searchResultName, { color: theme.text }]}>{item.name}, {item.age}</Text>
                        {item.username && <Text style={styles.searchResultUsername}>@{item.username}</Text>}
                        <View style={styles.searchResultMeta}>
                          <Text style={styles.searchResultGender}>{item.gender === 'male' ? '♂' : '♀'} {item.gender}</Text>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                    </TouchableOpacity>
                  )}
                />
              </SafeAreaView>
            </LinearGradient>
          </View>
        </Modal>
      </LinearGradient>
    </View>
  );
}

const getStyles = (theme, isDark) => StyleSheet.create({
  container: { flex: 1 },
  gradientBackground: { flex: 1 },
  safeArea: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 15,
  },
  headerRight: { flexDirection: 'row', gap: 10 },
  viewToggle: { width: 40, height: 40, borderRadius: 20, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  viewToggleIcon: { fontSize: 20, color: theme.text },
  notificationBadge: { position: 'absolute', top: -2, right: -2, backgroundColor: '#FF3B30', borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  notificationBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: theme.text },
  themeButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  themeIcon: { fontSize: 20 },
  content: { flex: 1 },
  gridContainer: { 
    padding: 15,
  },
  gridRow: {
    justifyContent: 'flex-start',
    gap: 20,
    marginBottom: 12,
  },
  listContainer: { padding: 15 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  loadingText: { marginTop: 20, fontSize: 16, color: theme.text },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { fontSize: 16, color: theme.textSecondary },
  footerLoader: { paddingVertical: 30, alignItems: 'center', gap: 8 },
  footerLoaderText: { fontSize: 14, color: theme.textSecondary, marginTop: 8 },
  footerEndText: { fontSize: 14, color: theme.textSecondary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  blurView: { borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 24, fontWeight: 'bold' },
  closeButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,107,157,0.2)', justifyContent: 'center', alignItems: 'center' },
  closeButtonText: { fontSize: 20, color: '#FF6B9D', fontWeight: 'bold' },
  filterSection: { marginBottom: 24 },
  sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },
  filterCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, borderRadius: 16, marginBottom: 8, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderWidth: 2, borderColor: 'transparent' },
  filterCardActive: { backgroundColor: '#FF6B9D', borderColor: '#FF6B9D' },
  filterEmoji: { fontSize: 20, marginRight: 12 },
  filterCardText: { fontSize: 16, fontWeight: '600' },
  genderButtons: { flexDirection: 'row', gap: 10 },
  genderCard: { flex: 1, alignItems: 'center', paddingVertical: 16, borderRadius: 16, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderWidth: 2, borderColor: 'transparent' },
  genderCardActive: { backgroundColor: '#FF6B9D', borderColor: '#FF6B9D' },
  genderEmoji: { fontSize: 24, marginBottom: 6 },
  genderCardText: { fontSize: 14, fontWeight: '600' },
  ageCard: { borderRadius: 16, paddingHorizontal: 12 },
  clearButton: { flex: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  clearButtonText: { fontSize: 16, fontWeight: '600', color: '#FF6B9D' },
  applyButton: { flex: 1, backgroundColor: '#FF6B9D', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  applyButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  filterActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  sortButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sortChip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderWidth: 2, borderColor: 'transparent' },
  sortChipActive: { backgroundColor: '#FF6B9D', borderColor: '#FF6B9D' },
  sortChipText: { fontSize: 14, fontWeight: '600' },
  listCard: { width: '100%', backgroundColor: isDark ? '#1a1a1a' : '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  listCardContent: { flexDirection: 'row', padding: 12 },
  listImage: { width: 80, height: 80, borderRadius: 12, overflow: 'hidden' },
  listImageContainer: { position: 'relative' },
  listOnlineBadge: { position: 'absolute', top: 2, right: 2, width: 10, height: 10, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  listOnlineBadgeText: { fontSize: 8 },
  listInfo: { flex: 1, marginLeft: 15, justifyContent: 'center' },
  listNameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  listName: { fontSize: 18, fontWeight: 'bold', color: theme.text },
  listLikes: { fontSize: 12, color: theme.text, fontWeight: 'bold' },
  listLocation: { fontSize: 12, color: theme.textSecondary, marginBottom: 6 },
  listTagRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  listGenderIcon: { fontSize: 16, fontWeight: 'bold' },
  listTag: { fontSize: 14, color: theme.textSecondary },
  profileCardWrapper: { 
    width: '47%',
  },
  glassCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isDark ? 0.4 : 0.2,
    shadowRadius: 12,
    elevation: 8,
    shadowColor: isDark ? '#000' : '#999',
  },
  cardImage: {
    width: '100%',
    height: 240,
    justifyContent: 'flex-end',
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardImageStyle: {
    borderRadius: 20,
  },
  cardGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  cardInfo: {
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  likesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likesText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  profileName: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#fff',
  },
  profileLocation: {
    fontSize: 11,
    color: '#fff',
  },
  tagBadge: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  genderIcon: { fontSize: 12, fontWeight: 'bold' },
  tagText: { fontSize: 11, color: '#fff', fontWeight: '500' },
  sortContainer: {
    padding: 20,
    gap: 12,
  },
  sortButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)',
  },
  sortButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  sortButtonOutline: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)',
  },
  sortButtonTextOutline: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textSecondary,
  },
  avatarContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  avatarLetter: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    fontSize: 16,
    color: theme.textSecondary,
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 18,
    color: theme.textSecondary,
  },
  onlineIndicator: {
    fontSize: 12,
    marginLeft: 8,
  },
  onlineBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineBadgeText: {
    fontSize: 8,
  },
  searchContainer: { flex: 1 },
  searchHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, gap: 12 },
  searchBackBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', justifyContent: 'center', alignItems: 'center' },
  searchInputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)', borderRadius: 25, paddingHorizontal: 16, paddingVertical: 12, gap: 10, borderWidth: 1.5, borderColor: isDark ? 'rgba(255,107,157,0.3)' : 'rgba(255,107,157,0.2)' },
  searchInput: { flex: 1, fontSize: 16, fontWeight: '400' },
  searchLoading: { alignItems: 'center', marginTop: 30, gap: 8 },
  searchLoadingText: { fontSize: 13 },
  searchHint: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 40, gap: 12 },
  searchHintTitle: { fontSize: 20, fontWeight: '700' },
  searchHintText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  searchResultCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  searchResultLeft: { position: 'relative' },
  searchResultAvatar: { width: 52, height: 52, borderRadius: 26, marginRight: 14, justifyContent: 'center', alignItems: 'center' },
  searchResultAvatarText: { color: '#fff', fontWeight: 'bold', fontSize: 20 },
  searchResultOnline: { position: 'absolute', bottom: 2, right: 14, width: 12, height: 12, borderRadius: 6, backgroundColor: '#4ECDC4', borderWidth: 2, borderColor: isDark ? '#1a0a2e' : '#fff' },
  searchResultInfo: { flex: 1 },
  searchResultName: { fontSize: 16, fontWeight: '700' },
  searchResultUsername: { fontSize: 13, color: '#FF6B9D', marginTop: 2, fontWeight: '500' },
  searchResultMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 },
  searchResultGender: { fontSize: 12, color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' },
});
