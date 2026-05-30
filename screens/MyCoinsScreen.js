import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/urlConfig';

export default function MyCoinsScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const [coins, setCoins] = useState(0);
  const [purchasing, setPurchasing] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [purchasedCoins, setPurchasedCoins] = useState(0);

  useEffect(() => {
    loadCoins();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadCoins();
    });
    return unsubscribe;
  }, [navigation]);

  const loadCoins = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/coins`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCoins(data.coins);
      }
    } catch (error) {
      console.error('Error loading coins:', error);
    }
  };

  const handlePurchase = async (pack) => {
    setPurchasing(pack.id);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/payment/test-purchase`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ coins: pack.coins, packageId: pack.id })
      });

      if (response.ok) {
        const data = await response.json();
        setCoins(data.coins);
        setPurchasedCoins(pack.coins);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        Alert.alert('Error', 'Purchase failed. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setPurchasing(null);
    }
  };

  const buyOptions = [
    { id: 1, coins: 50, price: '₹79', popular: false },
    { id: 2, coins: 150, price: '₹199', popular: true },
    { id: 3, coins: 300, price: '₹399', popular: false },
    { id: 4, coins: 1000, price: '₹1199', popular: false },
  ];

  const styles = getStyles(theme, isDark);

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? '#1a0a2e' : '#ffeef8'} translucent={false} />
      <LinearGradient
        colors={isDark ? ['#1a0a2e', '#16213e', '#0f3460'] : ['#ffeef8', '#e8d5f2', '#d4e4f7']}
        style={styles.gradientBackground}
      >
        <SafeAreaView style={styles.safeArea}>
          <View  tint={isDark ? 'dark' : 'light'} style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My Coins</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View  tint={isDark ? 'dark' : 'light'} style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Your Balance</Text>
              <View style={styles.balanceRow}>
                <Text style={styles.coinIcon}>◎</Text>
                <Text style={styles.balanceAmount}>{coins}</Text>
              </View>
              <Text style={styles.balanceDesc}>Coins</Text>
            </View>

            {showSuccess && (
              <View style={styles.successBanner}>
                <Text style={styles.successEmoji}>🎉</Text>
                <Text style={styles.successText}>+{purchasedCoins} coins credited!</Text>
              </View>
            )}

            <View tint={isDark ? 'dark' : 'light'} style={styles.infoCard}>
              <Text style={styles.infoIcon}>💬</Text>
              <Text style={styles.infoTitle}>How Coins Work</Text>
              <Text style={styles.infoText}>• First message costs 10 coins</Text>
              <Text style={styles.infoText}>• Chat free for 6 hours</Text>
              <Text style={styles.infoText}>• After 6h, pay 10 coins to continue</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Earn Free Coins</Text>
              <View style={styles.earnCard}>
                <TouchableOpacity style={styles.spinButton} onPress={() => navigation.navigate('SpinWheel')}>
                  <Text style={styles.spinEmoji}>🎰</Text>
                  <View style={styles.spinInfo}>
                    <Text style={styles.spinTitle}>Spin the Wheel</Text>
                    <Text style={styles.spinDesc}>Win up to 50 coins daily!</Text>
                  </View>
                  <View style={styles.coinBadge}>
                    <Text style={styles.coinBadgeText}>FREE</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Buy Coins</Text>
              <View style={styles.buyGrid}>
                {buyOptions.map((option) => (
                  <View key={option.id} style={styles.buyCard}>
                    <TouchableOpacity 
                      style={styles.buyInner} 
                      onPress={() => handlePurchase(option)}
                      disabled={purchasing !== null}
                    >
                      {option.popular && (
                        <View style={styles.popularBadge}>
                          <Text style={styles.popularText}>POPULAR</Text>
                        </View>
                      )}
                      {purchasing === option.id ? (
                        <ActivityIndicator size="small" color="#FFD700" style={{ marginVertical: 20 }} />
                      ) : (
                        <>
                          <Text style={styles.buyCoinIcon}>◎</Text>
                          <Text style={styles.buyCoinAmount}>{option.coins}</Text>
                        </>
                      )}
                      <Text style={styles.buyPrice}>{option.price}</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
              <Text style={styles.testModeText}>⚠️ Test Mode - No real charges</Text>
            </View>

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
  balanceCard: { margin: 20, borderRadius: 24, padding: 40, alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)' },
  balanceLabel: { fontSize: 14, color: theme.textSecondary, marginBottom: 12 },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  coinIcon: { fontSize: 48, color: '#FFD700' },
  balanceAmount: { fontSize: 56, fontWeight: 'bold', color: theme.text },
  balanceDesc: { fontSize: 16, color: theme.textSecondary },
  infoCard: { marginHorizontal: 20, marginBottom: 20, borderRadius: 20, padding: 20, overflow: 'hidden', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)' },
  infoIcon: { fontSize: 32, marginBottom: 12 },
  infoTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 12 },
  infoText: { fontSize: 14, color: theme.textSecondary, marginBottom: 6 },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: theme.text, marginBottom: 16 },
  optionCard: { borderRadius: 16, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)' },
  optionInner: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  optionIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  optionEmoji: { fontSize: 28 },
  optionInfo: { flex: 1 },
  optionTitle: { fontSize: 16, fontWeight: 'bold', color: theme.text, marginBottom: 4 },
  optionDesc: { fontSize: 13, color: theme.textSecondary },
  coinBadge: { backgroundColor: '#FFD700', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  coinBadgeText: { fontSize: 14, fontWeight: 'bold', color: '#000' },
  buyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  buyCard: { width: '48%', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)' },
  buyInner: { padding: 20, alignItems: 'center', position: 'relative' },
  popularBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: '#F70776', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  popularText: { fontSize: 10, fontWeight: 'bold', color: '#fff' },
  buyCoinIcon: { fontSize: 40, color: '#FFD700', marginBottom: 8 },
  buyCoinAmount: { fontSize: 28, fontWeight: 'bold', color: theme.text, marginBottom: 4 },
  buyPrice: { fontSize: 16, color: theme.textSecondary },
  testModeText: { fontSize: 12, color: theme.textSecondary, textAlign: 'center', marginTop: 12, fontStyle: 'italic' },
  successBanner: { marginHorizontal: 20, marginBottom: 16, backgroundColor: '#4CAF50', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  successEmoji: { fontSize: 24 },
  successText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  earnCard: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)' },
  spinButton: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  spinEmoji: { fontSize: 36, marginRight: 16 },
  spinInfo: { flex: 1 },
  spinTitle: { fontSize: 16, fontWeight: 'bold', color: theme.text, marginBottom: 4 },
  spinDesc: { fontSize: 13, color: theme.textSecondary },
});
