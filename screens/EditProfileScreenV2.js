import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, TextInput, Modal, Image, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
// import { View } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { API_URL } from '../config/urlConfig';
import { uploadImageToCloudinary } from '../utils/imageUpload';
import PingooLogo from '../components/PingooLogo';

export default function EditProfileScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [height, setHeight] = useState('');
  const [bodyType, setBodyType] = useState('');
  const [smoking, setSmoking] = useState('');
  const [drinking, setDrinking] = useState('');
  const [exercise, setExercise] = useState('');
  const [diet, setDiet] = useState('');
  const [occupation, setOccupation] = useState('');
  const [company, setCompany] = useState('');
  const [graduation, setGraduation] = useState('');
  const [school, setSchool] = useState('');
  const [hometown, setHometown] = useState('');
  const [currentCity, setCurrentCity] = useState('');
  const [lookingFor, setLookingFor] = useState('');
  const [relationshipStatus, setRelationshipStatus] = useState('');
  const [kids, setKids] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [photos, setPhotos] = useState([]);
  const [interests, setInterests] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [showNameEdit, setShowNameEdit] = useState(false);
  const [showBioEdit, setShowBioEdit] = useState(false);
  const [showHeightEdit, setShowHeightEdit] = useState(false);
  const [showBodyTypeEdit, setShowBodyTypeEdit] = useState(false);
  const [showLifestyleEdit, setShowLifestyleEdit] = useState(false);
  const [showWorkEdit, setShowWorkEdit] = useState(false);
  const [showLocationEdit, setShowLocationEdit] = useState(false);
  const [showRelationshipEdit, setShowRelationshipEdit] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setName(data.user.name || '');
        setProfilePhoto(data.user.profilePhoto || '');
        setPhotos(data.user.additionalPhotos || []);
        setBio(data.user.bio || '');
        setHeight(data.user.height?.toString() || '');
        setBodyType(data.user.bodyType || '');
        setSmoking(data.user.smoking || '');
        setDrinking(data.user.drinking || '');
        setExercise(data.user.exercise || '');
        setDiet(data.user.diet || '');
        setOccupation(data.user.occupation || '');
        setCompany(data.user.company || '');
        setGraduation(data.user.graduation || '');
        setSchool(data.user.school || '');
        setHometown(data.user.hometown || '');
        setCurrentCity(data.user.currentCity || '');
        setLookingFor(data.user.lookingFor || '');
        setRelationshipStatus(data.user.relationshipStatus || '');
        setKids(data.user.kids || '');
      }
    } catch (error) {
      console.error('Failed to load profile data:', error);
    }
  };

  const updateProfile = async (updateData) => {
    try {
      console.log('Updating profile with data:', updateData);
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });
      
      console.log('Update response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Update response data:', data);
        Alert.alert('Success', 'Profile updated successfully');
        return true;
      } else {
        const errorData = await response.json();
        console.log('Update error:', errorData);
        Alert.alert('Error', errorData.error || 'Failed to update profile');
        return false;
      }
    } catch (error) {
      console.log('Update network error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
      return false;
    }
  };

  const deletePhoto = async (photoUrl, isProfile) => {
    try {
      setUploading(true);
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/delete-photo`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ photoUrl, isProfilePhoto: isProfile }),
      });
      
      if (response.ok) {
        if (isProfile) {
          setProfilePhoto('');
        } else {
          setPhotos(photos.filter(photo => photo !== photoUrl));
        }
        Alert.alert('Success', 'Photo deleted successfully');
      } else {
        Alert.alert('Error', 'Failed to delete photo');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const setAsProfilePhoto = async (photoUrl) => {
    try {
      setUploading(true);
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`${API_URL}/set-profile-photo`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ photoUrl }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfilePhoto(data.user.profilePhoto);
        setPhotos(data.user.additionalPhotos);
        Alert.alert('Success', 'Profile photo updated successfully');
      } else {
        Alert.alert('Error', 'Failed to update profile photo');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const showPhotoOptions = (photoUrl, isProfile) => {
    setSelectedPhoto({ url: photoUrl, isProfile });
    setShowPhotoModal(true);
  };

  const pickImage = async (isProfile) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      
      setUploading(true);
      
      if (isProfile) {
        const uploadResult = await uploadImageToCloudinary(uri);
        if (uploadResult.success) {
          setProfilePhoto(uploadResult.imageUrl);
          await updateProfile({ profilePhoto: uploadResult.imageUrl });
          Alert.alert('Success', 'Profile photo updated successfully!');
        } else {
          Alert.alert('Error', uploadResult.error || 'Failed to upload image');
        }
      } else {
        const uploadResult = await uploadImageToCloudinary(uri);
        if (uploadResult.success) {
          const newPhotos = [...photos, uploadResult.imageUrl];
          setPhotos(newPhotos);
          await updateProfile({ additionalPhotos: newPhotos });
          Alert.alert('Success', 'Photo added successfully!');
        } else {
          Alert.alert('Error', uploadResult.error || 'Failed to upload image');
        }
      }
      
      setUploading(false);
    }
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
          <View  tint={isDark ? 'dark' : 'light'} style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <View style={{ width: 40 }} />
          </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.photoSection}>
          <Text style={styles.sectionTitle}>Profile Photo</Text>
          <TouchableOpacity style={styles.photoContainer} onPress={() => !uploading && (profilePhoto ? showPhotoOptions(profilePhoto, true) : pickImage(true))} disabled={uploading}>
            {uploading ? (
              <View style={styles.profileImage}>
                <PingooLogo size={60} animated={true} />
              </View>
            ) : profilePhoto ? (
              <Image source={{ uri: profilePhoto }} style={styles.profileImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{name.charAt(0) || 'U'}</Text>
              </View>
            )}
            <View style={styles.editBadge}>
              <Text style={styles.editIcon}>✏️</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>More Photos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {photos.map((photo, index) => (
              <TouchableOpacity key={index} onPress={() => showPhotoOptions(photo, false)}>
                <Image source={{ uri: photo }} style={styles.photoThumb} />
              </TouchableOpacity>
            ))}
            {photos.length < 6 && (
              <TouchableOpacity style={styles.addPhotoBtn} onPress={() => pickImage(false)}>
                <Text style={styles.addPhotoText}>+</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View  tint={isDark ? 'dark' : 'light'} style={styles.infoCard}>
            <TouchableOpacity style={styles.infoCardInner} onPress={() => setShowNameEdit(true)}>
              <View style={styles.infoIcon}>
                <Text style={styles.infoEmoji}>👤</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>{name || 'Not set'}</Text>
              </View>
              <Text style={styles.infoArrow}>›</Text>
            </TouchableOpacity>
          </View>

          <View tint={isDark ? 'dark' : 'light'} style={styles.infoCard}>
            <TouchableOpacity style={styles.infoCardInner} onPress={() => setShowBioEdit(true)}>
              <View style={styles.infoIcon}>
                <Text style={styles.infoEmoji}>📝</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Bio</Text>
                <Text style={styles.infoValue} numberOfLines={1}>{bio || 'Not set'}</Text>
              </View>
              <Text style={styles.infoArrow}>›</Text>
            </TouchableOpacity>
          </View>

          <View tint={isDark ? 'dark' : 'light'} style={styles.infoCard}>
            <TouchableOpacity style={styles.infoCardInner} onPress={() => setShowRelationshipEdit(true)}>
              <View style={styles.infoIcon}>
                <Text style={styles.infoEmoji}>🔍</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Looking for</Text>
                <Text style={styles.infoValue} numberOfLines={1}>{lookingFor || 'Not set'}</Text>
              </View>
              <Text style={styles.infoArrow}>›</Text>
            </TouchableOpacity>
          </View>

          <View tint={isDark ? 'dark' : 'light'} style={styles.infoCard}>
            <TouchableOpacity style={styles.infoCardInner} onPress={() => setShowHeightEdit(true)}>
              <View style={styles.infoIcon}>
                <Text style={styles.infoEmoji}>📏</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Height</Text>
                <Text style={styles.infoValue}>{height ? `${height} cm` : 'Not set'}</Text>
              </View>
              <Text style={styles.infoArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lifestyle</Text>
          <View  tint={isDark ? 'dark' : 'light'} style={styles.infoCard}>
            <TouchableOpacity style={styles.infoCardInner} onPress={() => setShowBodyTypeEdit(true)}>
              <View style={styles.infoIcon}>
                <Text style={styles.infoEmoji}>💪</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Body Type</Text>
                <Text style={styles.infoValue}>{bodyType || 'Not set'}</Text>
              </View>
              <Text style={styles.infoArrow}>›</Text>
            </TouchableOpacity>
          </View>

          <View  tint={isDark ? 'dark' : 'light'} style={styles.infoCard}>
            <TouchableOpacity style={styles.infoCardInner} onPress={() => setShowLifestyleEdit(true)}>
              <View style={styles.infoIcon}>
                <Text style={styles.infoEmoji}>🌟</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Lifestyle</Text>
                <Text style={styles.infoValue}>Smoking, Drinking, Exercise, Diet</Text>
              </View>
              <Text style={styles.infoArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Work & Education</Text>
          <View  tint={isDark ? 'dark' : 'light'} style={styles.infoCard}>
            <TouchableOpacity style={styles.infoCardInner} onPress={() => setShowWorkEdit(true)}>
              <View style={styles.infoIcon}>
                <Text style={styles.infoEmoji}>💼</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Work Details</Text>
                <Text style={styles.infoValue}>{occupation || company || graduation || school || 'Not set'}</Text>
              </View>
              <Text style={styles.infoArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View tint={isDark ? 'dark' : 'light'} style={styles.infoCard}>
            <TouchableOpacity style={styles.infoCardInner} onPress={() => setShowLocationEdit(true)}>
              <View style={styles.infoIcon}>
                <Text style={styles.infoEmoji}>📍</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>{currentCity || hometown || 'Not set'}</Text>
              </View>
              <Text style={styles.infoArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Relationship</Text>
          <View tint={isDark ? 'dark' : 'light'} style={styles.infoCard}>
            <TouchableOpacity style={styles.infoCardInner} onPress={() => setShowRelationshipEdit(true)}>
              <View style={styles.infoIcon}>
                <Text style={styles.infoEmoji}>💕</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Relationship Info</Text>
                <Text style={styles.infoValue}>{lookingFor || relationshipStatus || kids || 'Not set'}</Text>
              </View>
              <Text style={styles.infoArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showNameEdit} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View  tint={isDark ? 'dark' : 'light'} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Name</Text>
              <TouchableOpacity onPress={() => setShowNameEdit(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor={theme.textSecondary}
            />
            <TouchableOpacity style={styles.saveBtn} onPress={async () => {
              const success = await updateProfile({ name });
              if (success) setShowNameEdit(false);
            }}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showBioEdit} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View  tint={isDark ? 'dark' : 'light'} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Bio</Text>
              <TouchableOpacity onPress={() => setShowBioEdit(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself..."
              placeholderTextColor={theme.textSecondary}
              multiline
              maxLength={150}
            />
            <Text style={styles.charCount}>{bio.length}/150</Text>
            <TouchableOpacity style={styles.saveBtn} onPress={async () => {
              const success = await updateProfile({ bio });
              if (success) setShowBioEdit(false);
            }}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showHeightEdit} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View  tint={isDark ? 'dark' : 'light'} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Height</Text>
              <TouchableOpacity onPress={() => setShowHeightEdit(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput style={styles.input} value={height} onChangeText={setHeight} placeholder="Height in cm" placeholderTextColor={theme.textSecondary} keyboardType="numeric" />
            <TouchableOpacity style={styles.saveBtn} onPress={async () => {
              const success = await updateProfile({ height: parseInt(height) });
              if (success) setShowHeightEdit(false);
            }}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showBodyTypeEdit} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View  tint={isDark ? 'dark' : 'light'} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Body Type</Text>
              <TouchableOpacity onPress={() => setShowBodyTypeEdit(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            {['Slim', 'Athletic', 'Average', 'Curvy'].map((type) => (
              <TouchableOpacity key={type} style={[styles.optionBtn, bodyType === type && styles.optionSelected]} onPress={async () => { 
                setBodyType(type); 
                await updateProfile({ bodyType: type });
                setShowBodyTypeEdit(false); 
              }}>
                <Text style={styles.optionText}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      <Modal visible={showLifestyleEdit} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View tint={isDark ? 'dark' : 'light'} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Lifestyle</Text>
              <TouchableOpacity onPress={() => setShowLifestyleEdit(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.fieldLabel}>Smoking</Text>
            <View style={styles.optionRow}>
              {['Never', 'Occasionally', 'Regularly'].map((opt) => (
                <TouchableOpacity key={opt} style={[styles.optionChip, smoking === opt && styles.optionSelected]} onPress={() => setSmoking(opt)}>
                  <Text style={styles.optionText}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.fieldLabel}>Drinking</Text>
            <View style={styles.optionRow}>
              {['Never', 'Socially', 'Regularly'].map((opt) => (
                <TouchableOpacity key={opt} style={[styles.optionChip, drinking === opt && styles.optionSelected]} onPress={() => setDrinking(opt)}>
                  <Text style={styles.optionText}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.fieldLabel}>Exercise</Text>
            <View style={styles.optionRow}>
              {['Never', 'Sometimes', 'Often'].map((opt) => (
                <TouchableOpacity key={opt} style={[styles.optionChip, exercise === opt && styles.optionSelected]} onPress={() => setExercise(opt)}>
                  <Text style={styles.optionText}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.fieldLabel}>Diet</Text>
            <View style={styles.optionRow}>
              {['Vegetarian', 'Non-Veg', 'Vegan'].map((opt) => (
                <TouchableOpacity key={opt} style={[styles.optionChip, diet === opt && styles.optionSelected]} onPress={() => setDiet(opt)}>
                  <Text style={styles.optionText}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={async () => {
              await updateProfile({ smoking, drinking, exercise, diet });
              setShowLifestyleEdit(false);
            }}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showWorkEdit} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View tint={isDark ? 'dark' : 'light'} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Work & Education</Text>
              <TouchableOpacity onPress={() => setShowWorkEdit(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput style={styles.input} value={occupation} onChangeText={setOccupation} placeholder="Occupation" placeholderTextColor={theme.textSecondary} />
            <TextInput style={styles.input} value={company} onChangeText={setCompany} placeholder="Company" placeholderTextColor={theme.textSecondary} />
            <TextInput style={styles.input} value={graduation} onChangeText={setGraduation} placeholder="Education" placeholderTextColor={theme.textSecondary} />
            <TextInput style={styles.input} value={school} onChangeText={setSchool} placeholder="School" placeholderTextColor={theme.textSecondary} />
            <TouchableOpacity style={styles.saveBtn} onPress={async () => {
              await updateProfile({ occupation, company, graduation, school });
              setShowWorkEdit(false);
            }}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showLocationEdit} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View  tint={isDark ? 'dark' : 'light'} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Location</Text>
              <TouchableOpacity onPress={() => setShowLocationEdit(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput style={styles.input} value={hometown} onChangeText={setHometown} placeholder="Hometown" placeholderTextColor={theme.textSecondary} />
            <TextInput style={styles.input} value={currentCity} onChangeText={setCurrentCity} placeholder="Current City" placeholderTextColor={theme.textSecondary} />
            <TouchableOpacity style={styles.saveBtn} onPress={async () => {
              await updateProfile({ hometown, currentCity });
              setShowLocationEdit(false);
            }}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showRelationshipEdit} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View  tint={isDark ? 'dark' : 'light'} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Looking For</Text>
              <TouchableOpacity onPress={() => setShowRelationshipEdit(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              value={lookingFor}
              onChangeText={setLookingFor}
              placeholder="What are you looking for? (e.g., serious relationship, friendship, casual dating)"
              placeholderTextColor={theme.textSecondary}
              multiline
              maxLength={100}
            />
            <Text style={styles.charCount}>{lookingFor.length}/100</Text>
            <TouchableOpacity style={styles.saveBtn} onPress={async () => {
              const success = await updateProfile({ lookingFor });
              if (success) setShowRelationshipEdit(false);
            }}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showPhotoModal} animationType="fade" transparent>
        <View style={styles.photoModalOverlay}>
          <View style={styles.photoModalContent}>
            <Image source={{ uri: selectedPhoto?.url }} style={styles.fullScreenImage} />
            <View style={styles.photoActions}>
              {!selectedPhoto?.isProfile && (
                <TouchableOpacity 
                  style={styles.actionBtn} 
                  onPress={() => {
                    setAsProfilePhoto(selectedPhoto.url);
                    setShowPhotoModal(false);
                  }}
                >
                  <Text style={styles.actionBtnText}>Set as Profile</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={[styles.actionBtn, styles.deleteBtn]} 
                onPress={() => {
                  deletePhoto(selectedPhoto.url, selectedPhoto.isProfile);
                  setShowPhotoModal(false);
                }}
              >
                <Text style={styles.actionBtnText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionBtn} 
                onPress={() => setShowPhotoModal(false)}
              >
                <Text style={styles.actionBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
        </SafeAreaView>
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
    paddingVertical: 20,
    borderRadius: 0,
    overflow: 'hidden',
  },
  backButton: { 
    width: 44, 
    height: 44, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
    borderRadius: 22,
  },
  backIcon: { fontSize: 20, color: theme.text, fontWeight: '600' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: theme.text },
  photoSection: { padding: 20, alignItems: 'center', marginBottom: 10 },
  photoContainer: { position: 'relative', marginBottom: 20 },
  profileImage: { width: 140, height: 140, borderRadius: 70, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', borderWidth: 4, borderColor: isDark ? 'rgba(255,107,157,0.3)' : 'rgba(255,107,157,0.2)' },
  avatarPlaceholder: { width: 140, height: 140, borderRadius: 70, backgroundColor: '#FF6B9D', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: isDark ? 'rgba(255,107,157,0.3)' : 'rgba(255,107,157,0.2)' },
  avatarText: { fontSize: 56, fontWeight: 'bold', color: '#fff' },
  editBadge: { position: 'absolute', bottom: 5, right: 5, width: 44, height: 44, borderRadius: 22, backgroundColor: '#FF6B9D', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: isDark ? '#1a0a2e' : '#ffeef8', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  editIcon: { fontSize: 18 },
  photoThumb: { width: 110, height: 110, borderRadius: 16, marginRight: 12, borderWidth: 2, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
  addPhotoBtn: { width: 110, height: 110, borderRadius: 16, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderStyle: 'dashed', borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' },
  addPhotoText: { fontSize: 36, color: theme.textSecondary, fontWeight: '300' },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.7 },
  infoCard: { borderRadius: 20, padding: 18, marginBottom: 10, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
  infoCardInner: { flexDirection: 'row', alignItems: 'center' },
  infoIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: isDark ? 'rgba(255,107,157,0.15)' : 'rgba(255,107,157,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  infoEmoji: { fontSize: 26 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, color: theme.textSecondary, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' },
  infoValue: { fontSize: 16, fontWeight: '600', color: theme.text },
  infoArrow: { fontSize: 20, color: theme.textSecondary, opacity: 0.5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, maxHeight: '85%', overflow: 'hidden', backgroundColor: isDark ? '#1a0a2e' : '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: theme.text },
  closeBtn: { fontSize: 28, color: theme.textSecondary, fontWeight: '300' },
  input: { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#f8f8f8', color: theme.text, padding: 16, borderRadius: 14, fontSize: 16, marginBottom: 16, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
  charCount: { fontSize: 12, color: theme.textSecondary, marginBottom: 12, textAlign: 'right' },
  saveBtn: { backgroundColor: '#FF6B9D', padding: 16, borderRadius: 14, alignItems: 'center', elevation: 2, shadowColor: '#FF6B9D', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
  optionBtn: { padding: 18, borderRadius: 14, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f8f8f8', marginBottom: 10, borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
  optionSelected: { backgroundColor: '#FF6B9D', borderColor: '#FF6B9D' },
  optionText: { fontSize: 16, color: theme.text, textAlign: 'center', fontWeight: '600' },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: theme.text, marginTop: 16, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  optionRow: { flexDirection: 'row', gap: 10, marginBottom: 16, flexWrap: 'wrap' },
  optionChip: { flex: 1, minWidth: '30%', padding: 14, borderRadius: 12, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f8f8f8', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
  photoModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  photoModalContent: { width: '90%', alignItems: 'center' },
  fullScreenImage: { width: '100%', height: 400, borderRadius: 20, marginBottom: 24 },
  photoActions: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', justifyContent: 'center' },
  actionBtn: { backgroundColor: '#FF6B9D', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12, minWidth: 100 },
  deleteBtn: { backgroundColor: '#ff4757' },
  actionBtnText: { color: '#fff', fontWeight: '700', textAlign: 'center', fontSize: 15 },
});
