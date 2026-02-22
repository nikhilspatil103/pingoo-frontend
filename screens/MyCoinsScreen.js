import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
// import { View } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function MyCoinsScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const [coins, setCoins] = useState(100);

  useEffect(() => {
    loadCoins();
  }, []);

  const loadCoins = async () => {
    const userCoins = await AsyncStorage.getItem('userCoins');
    if (userCoins) setCoins(parseInt(userCoins));
  };

  const earnOptions = [
    { id: 1, icon: '🎥', title: 'Watch Ad', coins: 5, desc: 'Watch a short video' },
    { id: 2, icon: '✓', title: 'Complete Profile', coins: 20, desc: 'Fill all profile details' },
    { id: 3, icon: '📸', title: 'Add Photos', coins: 10, desc: 'Upload 3+ photos' },
    { id: 4, icon: '🎁', title: 'Daily Login', coins: 5, desc: 'Login every day' },
  ];

  const buyOptions = [
    { id: 1, coins: 50, price: '$0.99', popular: false },
    { id: 2, coins: 150, price: '$2.49', popular: true },
    { id: 3, coins: 300, price: '$4.99', popular: false },
    { id: 4, coins: 1000, price: '$14.99', popular: false },
  ];

  const styles = getStyles(theme, isDark);

  return (
    <View style={styles.container}>
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

            <View tint={isDark ? 'dark' : 'light'} style={styles.infoCard}>
              <Text style={styles.infoIcon}>💬</Text>
              <Text style={styles.infoTitle}>How Coins Work</Text>
              <Text style={styles.infoText}>• First message costs 10 coins</Text>
              <Text style={styles.infoText}>• Chat free for 24 hours</Text>
              <Text style={styles.infoText}>• After 24h, pay 10 coins to continue</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Earn Free Coins</Text>
              {earnOptions.map((option) => (
                <View key={option.id}  tint={isDark ? 'dark' : 'light'} style={styles.optionCard}>
                  <TouchableOpacity style={styles.optionInner}>
                    <View style={styles.optionIcon}>
                      <Text style={styles.optionEmoji}>{option.icon}</Text>
                    </View>
                    <View style={styles.optionInfo}>
                      <Text style={styles.optionTitle}>{option.title}</Text>
                      <Text style={styles.optionDesc}>{option.desc}</Text>
                    </View>
                    <View style={styles.coinBadge}>
                      <Text style={styles.coinBadgeText}>+{option.coins}</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Buy Coins</Text>
              <View style={styles.buyGrid}>
                {buyOptions.map((option) => (
                  <View key={option.id}  tint={isDark ? 'dark' : 'light'} style={styles.buyCard}>
                    <TouchableOpacity style={styles.buyInner}>
                      {option.popular && (
                        <View style={styles.popularBadge}>
                          <Text style={styles.popularText}>POPULAR</Text>
                        </View>
                      )}
                      <Text style={styles.buyCoinIcon}>◎</Text>
                      <Text style={styles.buyCoinAmount}>{option.coins}</Text>
                      <Text style={styles.buyPrice}>{option.price}</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
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
});
