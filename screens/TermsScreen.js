import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
// import { View } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';

export default function TermsScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const styles = getStyles(theme, isDark);

  return (
    <View style={styles.container}>
      <LinearGradient colors={isDark ? ['#1a0a2e', '#16213e', '#0f3460'] : ['#ffeef8', '#e8d5f2', '#d4e4f7']} style={styles.gradientBackground}>
        <SafeAreaView style={styles.safeArea}>
          <View  tint={isDark ? 'dark' : 'light'} style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Terms & Conditions</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View tint={isDark ? 'dark' : 'light'} style={styles.card}>
              <Text style={styles.title}>Terms of Service</Text>
              <Text style={styles.text}>By using Pingoo, you agree to these terms and conditions.</Text>
              
              <Text style={styles.subtitle}>1. Acceptance of Terms</Text>
              <Text style={styles.text}>By accessing and using this service, you accept and agree to be bound by the terms and provision of this agreement.</Text>
              
              <Text style={styles.subtitle}>2. Use License</Text>
              <Text style={styles.text}>Permission is granted to temporarily use Pingoo for personal, non-commercial transitory viewing only.</Text>
              
              <Text style={styles.subtitle}>3. User Conduct</Text>
              <Text style={styles.text}>You agree not to use the service for any unlawful purpose or to violate any laws in your jurisdiction.</Text>
              
              <Text style={styles.subtitle}>4. Privacy</Text>
              <Text style={styles.text}>Your privacy is important to us. We collect and use your data as described in our Privacy Policy.</Text>
              
              <Text style={styles.subtitle}>5. Coins & Payments</Text>
              <Text style={styles.text}>• First message costs 10 coins{'\n'}• Chat free for 24 hours{'\n'}• After 24h, pay 10 coins to continue{'\n'}• All coin purchases are final</Text>
              
              <Text style={styles.subtitle}>6. Termination</Text>
              <Text style={styles.text}>We may terminate or suspend your account immediately, without prior notice, for conduct that we believe violates these Terms.</Text>
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
  card: { margin: 20, borderRadius: 24, padding: 24, overflow: 'hidden', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)' },
  title: { fontSize: 24, fontWeight: 'bold', color: theme.text, marginBottom: 16 },
  subtitle: { fontSize: 18, fontWeight: '600', color: theme.text, marginTop: 20, marginBottom: 8 },
  text: { fontSize: 15, color: theme.textSecondary, lineHeight: 22, marginBottom: 12 },
});
