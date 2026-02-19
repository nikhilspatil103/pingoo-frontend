import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import HomeScreen from './screens/HomeScreen';
import ContactsScreen from './screens/ContactsScreen';
import ProfileViewScreen from './screens/ProfileViewScreen';
import MyProfileScreen from './screens/MyProfileScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import MyCoinsScreen from './screens/MyCoinsScreen';
import TermsScreen from './screens/TermsScreen';
import AboutScreen from './screens/AboutScreen';
import BlockListScreen from './screens/BlockListScreen';
import DeleteAccountScreen from './screens/DeleteAccountScreen';
import ChatScreen from './screens/ChatScreen';
import ChatListScreen from './screens/ChatListScreen';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TabIcon = ({ focused, icon, isDark }) => (
  <View style={[
    styles.iconContainer,
    focused && { backgroundColor: isDark ? '#2A1F35' : '#E8D5E0' }
  ]}>
    <Ionicons name={icon} size={24} color={focused ? (isDark ? '#F70776' : '#FF6B9D') : (isDark ? '#8E8E93' : '#999')} />
  </View>
);

function MainTabs() {
  const { theme, isDark } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 20,
          left: 5,
          right: 5,
          backgroundColor: isDark ? '#1a1a1a' : '#2a2a2a',
          borderTopWidth: 0,
          elevation: 0,
          height: 70,
          paddingTop: 10,
          borderRadius: 35,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)',
        },
        tabBarBackground: () => null,
        tabBarActiveTintColor: isDark ? '#F70776' : '#FF6B9D',
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen 
        name="Find" 
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="home-outline" isDark={isDark} />,
        }}
      />
      <Tab.Screen 
        name="Contacts" 
        component={ContactsScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="people-outline" isDark={isDark} />,
        }}
      />
      <Tab.Screen 
        name="Chats" 
        component={ChatListScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="chatbubble-outline" isDark={isDark} />,
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={MyProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="person-outline" isDark={isDark} />,
        }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user, loading } = useAuth();
  
  console.log('AppNavigator - User:', user);
  console.log('AppNavigator - Loading:', loading);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{ headerShown: false }}
      >
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="ProfileView" component={ProfileViewScreen} options={{ presentation: 'card' }} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="MyCoins" component={MyCoinsScreen} />
            <Stack.Screen name="Terms" component={TermsScreen} />
            <Stack.Screen name="About" component={AboutScreen} />
            <Stack.Screen name="BlockList" component={BlockListScreen} />
            <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
});
