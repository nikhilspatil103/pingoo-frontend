import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, SafeAreaView, StatusBar, KeyboardAvoidingView, ScrollView, Platform, BackHandler } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/urlConfig';
import PingooLogo from '../components/PingooLogo';
import PingooLoader from '../assets/brand/PingooLoader';

export default function SignupScreen({ navigation }) {
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '508441951929-0qf5uvhb6ifsev06qkd3tbd9jee0c67a.apps.googleusercontent.com',
    });
  }, []);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data.idToken;

      const res = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.isNewUser) {
          navigation.navigate('ProfileSetup', {
            name: data.user.name,
            email: data.user.email,
            token: data.token,
            fromGoogle: true,
          });
        } else {
          await login(data.user, data.token);
        }
      } else {
        Alert.alert('Error', data.error || 'Google sign-up failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleNext = () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    // Navigate to profile setup with basic info
    navigation.navigate('ProfileSetup', { name, email, password });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1C0F2A" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <PingooLoader />
              <Text style={styles.title}>Pingoo</Text>
              <Text style={styles.subtitle}>Connect. Chat. Meet.</Text>
            </View>

            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />

              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />

              <TouchableOpacity 
                style={[styles.button, loading && styles.buttonDisabled]} 
                onPress={handleNext}
                disabled={loading}
              >
                <Text style={styles.buttonText}>Next</Text>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.googleButton}
                onPress={handleGoogleSignIn}
                disabled={googleLoading}
              >
                <Ionicons name="logo-google" size={20} color="#fff" />
                <Text style={styles.googleButtonText}>
                  {googleLoading ? 'Signing up...' : 'Sign up with Google'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.linkText}>
                  Already have an account? <Text style={styles.linkBold}>Login</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1C0F2A' },
  scrollContent: { flexGrow: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  header: { alignItems: 'center', marginBottom: 48, width: '100%' },
  logo: { fontSize: 64, color: '#FF6B9D', marginBottom: 8 },
  title: { fontSize: 42, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 14, color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center' },
  form: { width: '100%' },
  input: { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 16, paddingHorizontal: 20, paddingVertical: 16, fontSize: 16, marginBottom: 16, color: '#fff', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)' },
  button: { backgroundColor: '#FF6B9D', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { backgroundColor: 'rgba(255, 107, 157, 0.5)' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  linkText: { textAlign: 'center', marginTop: 24, fontSize: 15, color: 'rgba(255, 255, 255, 0.6)' },
  linkBold: { color: '#FF6B9D', fontWeight: 'bold' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  dividerText: { color: 'rgba(255,255,255,0.5)', marginHorizontal: 12, fontSize: 14 },
  googleButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, paddingVertical: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', gap: 10 },
  googleButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
