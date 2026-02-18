import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/urlConfig';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      
      if (response.ok) {
        await login({ userId: data.userId, name: data.name, email: data.email }, data.token);
      } else {
        Alert.alert('Error', data.error || 'Login failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logo}>◎</Text>
          <Text style={styles.title}>Pingoo</Text>
          <Text style={styles.subtitle}>Connect. Chat. Meet.</Text>
        </View>

        <View style={styles.form}>
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

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Logging in...' : 'Login'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text style={styles.linkText}>
              Don't have an account? <Text style={styles.linkBold}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1C0F2A' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  header: { alignItems: 'center', marginBottom: 48 },
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
});
