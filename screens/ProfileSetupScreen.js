import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, SafeAreaView, StatusBar, Image, TextInput, ScrollView, Modal, Animated } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/urlConfig';
import { uploadImageToCloudinary } from '../utils/imageUpload';
import { requestLocationPermission, getCurrentLocation } from '../utils/locationService';
import PingooLogo from '../components/PingooLogo';

export default function ProfileSetupScreen({ route, navigation }) {
  const { name, email, password } = route.params;
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [interestedIn, setInterestedIn] = useState('');
  const [lookingFor, setLookingFor] = useState('');
  const [locationGranted, setLocationGranted] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState('');
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({ visible: false, type: '', title: '', message: '' });

  const showPopup = (type, title, message) => {
    setPopup({ visible: true, type, title, message });
  };

  const hidePopup = () => {
    setPopup({ visible: false, type: '', title: '', message: '' });
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showPopup('error', 'Permission Required', 'Please allow access to photos to upload your profile picture');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setLoading(true);
      const uploadResult = await uploadImageToCloudinary(result.assets[0].uri, true);
      if (uploadResult.success) {
        setProfilePhoto(uploadResult.imageUrl);
        showPopup('success', 'Photo Uploaded', 'Your profile photo has been uploaded successfully!');
      } else {
        showPopup('error', 'Upload Failed', 'Failed to upload image. Please try again.');
      }
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (!age.trim()) {
        showPopup('error', 'Age Required', 'Please enter your age to continue');
        return;
      }
      const ageNum = parseInt(age);
      if (isNaN(ageNum) || ageNum < 18) {
        showPopup('error', 'Age Restriction', 'You must be at least 18 years old');
        return;
      }
      if (ageNum > 100) {
        showPopup('error', 'Invalid Age', 'Please enter a valid age');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!gender) {
        showPopup('error', 'Gender Required', 'Please select your gender');
        return;
      }
      setStep(4);
    } else if (step === 4) {
      if (!interestedIn) {
        showPopup('error', 'Interest Required', 'Please select who you are interested in');
        return;
      }
      if (loading) return;
      setStep(5);
    } else if (step === 5) {
      if (!lookingFor.trim()) {
        showPopup('error', 'Looking For Required', 'Please tell us what you are looking for');
        return;
      }
      if (loading) return;
      setStep(6);
    } else if (step === 6) {
      if (loading) return;
      console.log('Step 6: Requesting location permission');
      
      const granted = await requestLocationPermission();
      console.log('Location permission result:', granted);
      
      if (granted) {
        console.log('Permission granted, getting location...');
        try {
          await getCurrentLocation();
          console.log('Location obtained, proceeding to signup');
        } catch (locError) {
          console.log('Location fetch failed:', locError);
        }
        // Call handleSignup
        handleSignup();
      } else {
        console.log('Location permission denied');
        Alert.alert(
          'Location Required',
          'Location access is required to find people near you. Please enable location to continue.',
          [
            {
              text: 'Try Again',
              onPress: () => handleNext()
            },
            {
              text: 'Cancel',
              style: 'cancel'
            }
          ]
        );
      }
    }
  };

  const handleSignup = async () => {
    console.log('handleSignup called');
    console.log('age:', age);
    console.log('gender:', gender);
    console.log('interestedIn:', interestedIn);
    console.log('lookingFor:', lookingFor);
    
    if (!age.trim()) {
      console.log('Age validation failed');
      setLoading(false);
      showPopup('error', 'Age Required', 'Please enter your age to continue');
      return;
    }

    if (!gender) {
      console.log('Gender validation failed');
      setLoading(false);
      showPopup('error', 'Gender Required', 'Please select your gender');
      return;
    }

    if (!interestedIn) {
      console.log('Interest validation failed');
      setLoading(false);
      showPopup('error', 'Interest Required', 'Please select who you are interested in');
      return;
    }

    if (!lookingFor.trim()) {
      console.log('Looking for validation failed');
      setLoading(false);
      showPopup('error', 'Looking For Required', 'Please tell us what you are looking for');
      return;
    }

    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 18) {
      console.log('Age restriction validation failed');
      setLoading(false);
      showPopup('error', 'Age Restriction', 'You must be at least 18 years old to use this app');
      return;
    }

    if (ageNum > 100) {
      console.log('Invalid age validation failed');
      setLoading(false);
      showPopup('error', 'Invalid Age', 'Please enter a valid age');
      return;
    }

    console.log('All validations passed, proceeding with signup');
    setLoading(true);
    try {
      console.log('Fetching signup API...');
      const response = await fetch(`${API_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          email, 
          password, 
          age: ageNum, 
          gender, 
          interestedIn,
          lookingFor,
          profilePhoto 
        })
      });
      console.log('Signup response received:', response.status);
      const data = await response.json();
      console.log('Signup data:', data);
      
      if (response.ok) {
        console.log('Signup successful, logging in...');
        await login(data.user, data.token);
        console.log('Login completed');
      } else {
        console.log('Signup failed:', data.error);
        setLoading(false);
        showPopup('error', 'Signup Failed', data.error || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Signup error:', error);
      setLoading(false);
      showPopup('error', 'Network Error', 'Please check your internet connection and try again.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1C0F2A" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Step {step} of 6</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
          <View style={styles.content}>
            <View style={styles.welcomeSection}>
              <PingooLogo size={64} animated={true} />
              <Text style={styles.title}>
                {step === 1 ? 'Add Your Photo' : step === 2 ? 'How old are you?' : step === 3 ? 'Your Gender' : step === 4 ? 'Interested in' : step === 5 ? 'What are you looking for?' : 'Enable Location'}
              </Text>
              <Text style={styles.subtitle}>
                {step === 1 ? 'Optional - You can skip this' : step === 2 ? 'You must be 18 or older' : step === 3 ? 'Select your gender' : step === 4 ? 'Who would you like to meet?' : step === 5 ? 'Tell us your preferences' : 'Required to find people near you'}
              </Text>
            </View>

            {step === 1 && (
              <View style={styles.photoCard}>
                <TouchableOpacity style={styles.photoWrapper} onPress={pickImage} disabled={loading}>
                  {loading ? (
                    <View style={styles.photoPlaceholder}>
                      <PingooLogo size={60} animated={true} />
                    </View>
                  ) : profilePhoto ? (
                    <Image source={{ uri: profilePhoto }} style={styles.profilePhoto} />
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      <Text style={styles.cameraIcon}>📷</Text>
                      <Text style={styles.photoHint}>Add your photo</Text>
                    </View>
                  )}
                  {!loading && (
                    <View style={styles.editIcon}>
                      <Text style={styles.editText}>✏️</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {step === 2 && (
              <View style={styles.formCard}>
                <View style={styles.fieldGroup}>
                  <TextInput
                    style={styles.ageInputLarge}
                    placeholder="Enter your age"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    value={age}
                    onChangeText={setAge}
                    keyboardType="numeric"
                    maxLength={2}
                    autoFocus
                  />
                </View>
              </View>
            )}

            {step === 3 && (
              <View style={styles.formCard}>
                <View style={styles.optionsGrid}>
                  {[{key: 'male', label: 'Male', icon: '♂'}, {key: 'female', label: 'Female', icon: '♀'}].map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      style={[styles.optionCardLarge, gender === option.key && styles.selectedCard]}
                      onPress={() => setGender(option.key)}
                    >
                      <Text style={[styles.optionIconLarge, { color: '#fff' }]}>{option.icon}</Text>
                      <Text style={[styles.optionLabel, gender === option.key && styles.selectedLabel]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {step === 4 && (
              <View style={styles.formCard}>
                <View style={styles.optionsGrid}>
                  {[{key: 'male', label: 'Men', icon: '♂'}, {key: 'female', label: 'Women', icon: '♀'}, {key: 'both', label: 'Both', icon: '⚤'}].map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      style={[styles.optionCardLarge, interestedIn === option.key && styles.selectedCard]}
                      onPress={() => setInterestedIn(option.key)}
                    >
                      <Text style={[styles.optionIconLarge, { color: '#fff' }]}>{option.icon}</Text>
                      <Text style={[styles.optionLabel, interestedIn === option.key && styles.selectedLabel]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {step === 5 && (
              <View style={styles.formCard}>
                <View style={styles.fieldGroup}>
                  <TextInput
                    style={styles.textAreaInputLarge}
                    placeholder="e.g., serious relationship, friendship, casual dating"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    value={lookingFor}
                    onChangeText={setLookingFor}
                    multiline
                    maxLength={100}
                    autoFocus
                  />
                  <Text style={styles.charCounter}>{lookingFor.length}/100</Text>
                </View>
              </View>
            )}

            {step === 6 && (
              <View style={styles.formCard}>
                <View style={styles.locationCard}>
                  <Text style={styles.locationIcon}>📍</Text>
                  <Text style={styles.locationTitle}>Location Access</Text>
                  <Text style={styles.locationDescription}>
                    We need your location to show you people nearby and calculate distances. Your exact location is never shared with other users.
                  </Text>
                  <View style={styles.locationFeatures}>
                    <Text style={styles.locationFeature}>• Find people near you</Text>
                    <Text style={styles.locationFeature}>• See distance to profiles</Text>
                    <Text style={styles.locationFeature}>• Your privacy is protected</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.bottomSection}>
          <TouchableOpacity 
            style={[styles.continueBtn, loading && styles.btnDisabled]} 
            onPress={handleNext}
            disabled={loading}
          >
            <Text style={styles.continueBtnText}>
              {loading ? 'Creating Account...' : step === 6 ? 'Allow Location & Complete' : step === 5 ? 'Next' : step === 1 ? (profilePhoto ? 'Next' : 'Skip') : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <Modal visible={popup.visible} transparent animationType="fade">
        <View style={styles.popupOverlay}>
          <View style={styles.popupContainer}>
            <View style={[styles.popupIcon, popup.type === 'success' ? styles.successIcon : styles.errorIcon]}>
              <Text style={styles.popupIconText}>{popup.type === 'success' ? '✓' : '⚠'}</Text>
            </View>
            <Text style={styles.popupTitle}>{popup.title}</Text>
            <Text style={styles.popupMessage}>{popup.message}</Text>
            <TouchableOpacity style={styles.popupButton} onPress={hidePopup}>
              <Text style={styles.popupButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1C0F2A' },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)'
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  backIcon: { fontSize: 18, color: '#fff', fontWeight: '600' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },
  scrollView: { flex: 1 },
  content: { padding: 20 },
  welcomeSection: { alignItems: 'center', marginBottom: 30 },
  logo: { fontSize: 64, color: '#FF6B9D', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },
  photoCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  photoWrapper: { position: 'relative' },
  profilePhoto: { width: 120, height: 120, borderRadius: 60 },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    borderStyle: 'dashed'
  },
  cameraIcon: { fontSize: 32, marginBottom: 8 },
  photoHint: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF6B9D',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#1C0F2A'
  },
  editText: { fontSize: 14 },
  formCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  fieldGroup: { marginBottom: 24 },
  fieldLabel: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 12 },
  inputWrapper: { marginBottom: 8 },
  ageInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    textAlign: 'center'
  },
  ageInputLarge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 24,
    fontSize: 36,
    color: '#fff',
    borderWidth: 2,
    borderColor: '#FF6B9D',
    textAlign: 'center',
    fontWeight: 'bold'
  },
  textAreaInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    minHeight: 80,
    textAlignVertical: 'top'
  },
  textAreaInputLarge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 20,
    fontSize: 18,
    color: '#fff',
    borderWidth: 2,
    borderColor: '#FF6B9D',
    minHeight: 150,
    textAlignVertical: 'top'
  },
  charCounter: { fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'right', marginTop: 4 },
  optionsGrid: { flexDirection: 'row', gap: 12 },
  optionCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  optionCardLarge: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  selectedCard: { backgroundColor: '#FF6B9D', borderColor: '#FF6B9D' },
  optionIcon: { fontSize: 24, marginBottom: 8 },
  optionIconLarge: { fontSize: 48, marginBottom: 12 },
  optionLabel: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.6)' },
  selectedLabel: { color: '#fff', fontWeight: '600' },
  bottomSection: {
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)'
  },
  continueBtn: {
    backgroundColor: '#FF6B9D',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center'
  },
  btnDisabled: { opacity: 0.6 },
  continueBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20
  },
  popupContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    minWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10
  },
  popupIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  successIcon: { backgroundColor: '#4CAF50' },
  errorIcon: { backgroundColor: '#FF5252' },
  popupIconText: { fontSize: 24, color: '#fff', fontWeight: 'bold' },
  popupTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 8, textAlign: 'center' },
  popupMessage: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  popupButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
    minWidth: 100
  },
  popupButtonText: { color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  locationCard: {
    alignItems: 'center',
    paddingVertical: 20
  },
  locationIcon: {
    fontSize: 64,
    marginBottom: 16
  },
  locationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12
  },
  locationDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20
  },
  locationFeatures: {
    alignSelf: 'stretch'
  },
  locationFeature: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
    paddingLeft: 8
  }
});