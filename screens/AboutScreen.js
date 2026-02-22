import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';

export default function AboutScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const styles = getStyles(theme, isDark);

  return (
    <View style={styles.container}>
      <LinearGradient colors={isDark ? ['#1a0a2e', '#16213e', '#0f3460'] : ['#ffeef8', '#e8d5f2', '#d4e4f7']} style={styles.gradientBackground}>
        <SafeAreaView style={styles.safeArea}>
          <BlurView intensity={isDark ? 60 : 40} tint={isDark ? 'dark' : 'light'} style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>About Pingoo</Text>
            <View style={{ width: 40 }} />
          </BlurView>

          <ScrollView showsVerticalScrollIndicator={false}>
            <BlurView intensity={isDark ? 40 : 20} tint={isDark ? 'dark' : 'light'} style={styles.card}>
              <Text style={styles.logo}>🔮</Text>
              <Text style={styles.title}>Pingoo</Text>
              <Text style={styles.version}>Version 1.0.0</Text>
              
              <Text style={styles.subtitle}>About Us</Text>
              <Text style={styles.text}>Pingoo is a social connection platform where meaningful relationships are built. Connect with people nearby, share interests, and build lasting friendships.</Text>
              
              <Text style={styles.subtitle}>Our Mission</Text>
              <Text style={styles.text}>To create a safe and engaging platform where people can connect authentically and build meaningful relationships.</Text>
              
              <Text style={styles.subtitle}>Features</Text>
              <Text style={styles.text}>• Discover people nearby{'\n'}• Star your favorite contacts{'\n'}• Secure messaging with coins{'\n'}• Profile customization{'\n'}• Interest-based matching</Text>
              
              <Text style={styles.subtitle}>Contact Us</Text>
              <Text style={styles.text}>Email: support@pingoo.com{'\n'}Website: www.pingoo.com</Text>
            </BlurView>
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
  card: { margin: 20, borderRadius: 24, padding: 24, alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)' },
  logo: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: theme.text, marginBottom: 8 },
  version: { fontSize: 14, color: theme.textSecondary, marginBottom: 24 },
  subtitle: { fontSize: 18, fontWeight: '600', color: theme.text, marginTop: 20, marginBottom: 8, alignSelf: 'flex-start' },
  text: { fontSize: 15, color: theme.textSecondary, lineHeight: 22, marginBottom: 12, alignSelf: 'flex-start' },
});
