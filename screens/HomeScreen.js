import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, SafeAreaView, Animated, StatusBar, RefreshControl, ActivityIndicator, Modal } from 'react-native';
import RangeSlider from '../components/RangeSlider';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import PingooLogo from '../components/PingooLogo';
import { ProfileCard, ListCard } from '../components/ProfileCard';
import useProfileStore from '../store/profileStore';
import ProfileSocketService from '../services/ProfileSocketService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen({ navigation }) {
  const { theme, isDark, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const [isListView, setIsListView] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [ageRange, setAgeRange] = useState({ min: 18, max: 80 });
  const [genderFilter, setGenderFilter] = useState('both');
  const [fadeAnim] = useState(new Animated.Value(1));
  const [slideAnim] = useState(new Animated.Value(0));
  
  const { profiles, page, hasMore, initialLoading, loadingMore, refreshing, fetchProfiles, setPage, updateUserOnlineStatus } = useProfileStore();

  useFocusEffect(
    React.useCallback(() => {
      fetchProfiles(1, false);
      
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

  const renderItem = useCallback(({ item }) => {
    if (isListView) {
      return <ListCard profile={item} onPress={() => navigation.navigate('ProfileView', { profile: item })} isDark={isDark} theme={theme} />;
    }
    return <ProfileCard profile={item} onPress={() => navigation.navigate('ProfileView', { profile: item })} isDark={isDark} theme={theme} />;
  }, [isListView, isDark, theme, navigation]);

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.text} />
      </View>
    );
  };

  const keyExtractor = useCallback((item) => item.id.toString(), []);

  const filteredProfiles = profiles.filter(profile => {
    if (filterType === 'online' && !profile.isOnline) return false;
    if (filterType === 'age' && profile.age && (profile.age < ageRange.min || profile.age > ageRange.max)) return false;
    if (genderFilter !== 'both' && profile.gender !== genderFilter) return false;
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

  const clearFilters = () => {
    setFilterType('all');
    setGenderFilter('both');
    setAgeRange({ min: 18, max: 80 });
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
              <TouchableOpacity style={styles.viewToggle} onPress={() => setFilterVisible(true)} activeOpacity={1}>
                <Text style={styles.viewToggleIcon}>⚡</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.viewToggle} onPress={() => setIsListView(!isListView)} activeOpacity={1}>
                <Text style={styles.viewToggleIcon}>{isListView ? '⊞' : '☰'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.themeButton} onPress={toggleTheme} activeOpacity={1}>
                <Text style={styles.themeIcon}>{isDark ? '☀️' : '🌙'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {initialLoading ? (
            <View style={styles.loadingContainer}>
              <PingooLogo size={100} animated={true} />
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
                  <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>SHOW</Text>
                  <TouchableOpacity style={[styles.filterCard, filterType === 'online' && styles.filterCardActive]} onPress={() => applyFilter('online')}>
                    <Text style={styles.filterEmoji}>🟢</Text>
                    <Text style={[styles.filterCardText, { color: filterType === 'online' ? '#fff' : theme.text }]}>Online Only</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.filterCard, filterType === 'mostLiked' && styles.filterCardActive]} onPress={() => applyFilter('mostLiked')}>
                    <Text style={styles.filterEmoji}>❤️</Text>
                    <Text style={[styles.filterCardText, { color: filterType === 'mostLiked' ? '#fff' : theme.text }]}>Most Liked</Text>
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
                  <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>AGE RANGE</Text>
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
                        setFilterType('age');
                      }}
                    />
                  </View>
                </View>

                <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                  <Text style={styles.clearButtonText}>Clear All Filters</Text>
                </TouchableOpacity>
              </View>
            </BlurView>
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
    borderBottomWidth: 1,
    borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
  },
  headerRight: { flexDirection: 'row', gap: 10 },
  viewToggle: { width: 40, height: 40, borderRadius: 20, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', justifyContent: 'center', alignItems: 'center' },
  viewToggleIcon: { fontSize: 20, color: theme.text },
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
  footerLoader: { paddingVertical: 20, alignItems: 'center' },
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
  clearButton: { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 8 },
  clearButtonText: { fontSize: 16, fontWeight: '600', color: '#FF6B9D' },
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
});
