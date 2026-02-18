import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, TextInput, Modal, Image } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';

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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const userName = await AsyncStorage.getItem('userName');
    const userPhoto = await AsyncStorage.getItem('userProfilePhoto');
    if (userName) setName(userName);
    if (userPhoto) setProfilePhoto(userPhoto);
  };

  const saveField = async (field, value) => {
    await AsyncStorage.setItem(field, value);
  };

  const pickImage = async (isProfile) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      if (isProfile) {
        setProfilePhoto(uri);
        await saveField('userProfilePhoto', uri);
      } else {
        const newPhotos = [...photos, uri];
        setPhotos(newPhotos);
      }
    }
  };

  const styles = getStyles(theme, isDark);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.photoSection}>
          <Text style={styles.sectionTitle}>Profile Photo</Text>
          <TouchableOpacity style={styles.photoContainer} onPress={() => pickImage(true)}>
            {profilePhoto ? (
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
              <Image key={index} source={{ uri: photo }} style={styles.photoThumb} />
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
          <BlurView intensity={isDark ? 60 : 40} tint={isDark ? 'dark' : 'light'} style={styles.infoCard}>
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
          </BlurView>

          <BlurView intensity={isDark ? 60 : 40} tint={isDark ? 'dark' : 'light'} style={styles.infoCard}>
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
          </BlurView>

          <BlurView intensity={isDark ? 60 : 40} tint={isDark ? 'dark' : 'light'} style={styles.infoCard}>
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
          </BlurView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lifestyle</Text>
          <BlurView intensity={isDark ? 60 : 40} tint={isDark ? 'dark' : 'light'} style={styles.infoCard}>
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
          </BlurView>

          <BlurView intensity={isDark ? 60 : 40} tint={isDark ? 'dark' : 'light'} style={styles.infoCard}>
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
          </BlurView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Work & Education</Text>
          <BlurView intensity={isDark ? 60 : 40} tint={isDark ? 'dark' : 'light'} style={styles.infoCard}>
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
          </BlurView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <BlurView intensity={isDark ? 60 : 40} tint={isDark ? 'dark' : 'light'} style={styles.infoCard}>
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
          </BlurView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Relationship</Text>
          <BlurView intensity={isDark ? 60 : 40} tint={isDark ? 'dark' : 'light'} style={styles.infoCard}>
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
          </BlurView>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={showNameEdit} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <BlurView intensity={isDark ? 80 : 60} tint={isDark ? 'dark' : 'light'} style={styles.modalContent}>
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
              await saveField('userName', name);
              setShowNameEdit(false);
            }}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </Modal>

      <Modal visible={showBioEdit} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <BlurView intensity={isDark ? 80 : 60} tint={isDark ? 'dark' : 'light'} style={styles.modalContent}>
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
              await saveField('userBio', bio);
              setShowBioEdit(false);
            }}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </Modal>

      <Modal visible={showHeightEdit} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <BlurView intensity={isDark ? 80 : 60} tint={isDark ? 'dark' : 'light'} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Height</Text>
              <TouchableOpacity onPress={() => setShowHeightEdit(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput style={styles.input} value={height} onChangeText={setHeight} placeholder="Height in cm" placeholderTextColor={theme.textSecondary} keyboardType="numeric" />
            <TouchableOpacity style={styles.saveBtn} onPress={() => setShowHeightEdit(false)}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </Modal>

      <Modal visible={showBodyTypeEdit} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <BlurView intensity={isDark ? 80 : 60} tint={isDark ? 'dark' : 'light'} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Body Type</Text>
              <TouchableOpacity onPress={() => setShowBodyTypeEdit(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            {['Slim', 'Athletic', 'Average', 'Curvy'].map((type) => (
              <TouchableOpacity key={type} style={[styles.optionBtn, bodyType === type && styles.optionSelected]} onPress={() => { setBodyType(type); setShowBodyTypeEdit(false); }}>
                <Text style={styles.optionText}>{type}</Text>
              </TouchableOpacity>
            ))}
          </BlurView>
        </View>
      </Modal>

      <Modal visible={showLifestyleEdit} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <BlurView intensity={isDark ? 80 : 60} tint={isDark ? 'dark' : 'light'} style={styles.modalContent}>
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
            <TouchableOpacity style={styles.saveBtn} onPress={() => setShowLifestyleEdit(false)}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </Modal>

      <Modal visible={showWorkEdit} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <BlurView intensity={isDark ? 80 : 60} tint={isDark ? 'dark' : 'light'} style={styles.modalContent}>
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
            <TouchableOpacity style={styles.saveBtn} onPress={() => setShowWorkEdit(false)}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </Modal>

      <Modal visible={showLocationEdit} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <BlurView intensity={isDark ? 80 : 60} tint={isDark ? 'dark' : 'light'} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Location</Text>
              <TouchableOpacity onPress={() => setShowLocationEdit(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput style={styles.input} value={hometown} onChangeText={setHometown} placeholder="Hometown" placeholderTextColor={theme.textSecondary} />
            <TextInput style={styles.input} value={currentCity} onChangeText={setCurrentCity} placeholder="Current City" placeholderTextColor={theme.textSecondary} />
            <TouchableOpacity style={styles.saveBtn} onPress={() => setShowLocationEdit(false)}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </Modal>

      <Modal visible={showRelationshipEdit} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <BlurView intensity={isDark ? 80 : 60} tint={isDark ? 'dark' : 'light'} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Relationship</Text>
              <TouchableOpacity onPress={() => setShowRelationshipEdit(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.fieldLabel}>Looking For</Text>
            {['Relationship', 'Friendship', 'Casual'].map((opt) => (
              <TouchableOpacity key={opt} style={[styles.optionBtn, lookingFor === opt && styles.optionSelected]} onPress={() => setLookingFor(opt)}>
                <Text style={styles.optionText}>{opt}</Text>
              </TouchableOpacity>
            ))}
            <Text style={styles.fieldLabel}>Status</Text>
            {['Single', 'Divorced', 'Widowed'].map((opt) => (
              <TouchableOpacity key={opt} style={[styles.optionBtn, relationshipStatus === opt && styles.optionSelected]} onPress={() => setRelationshipStatus(opt)}>
                <Text style={styles.optionText}>{opt}</Text>
              </TouchableOpacity>
            ))}
            <Text style={styles.fieldLabel}>Kids</Text>
            {["Don't have", 'Have kids', "Don't want"].map((opt) => (
              <TouchableOpacity key={opt} style={[styles.optionBtn, kids === opt && styles.optionSelected]} onPress={() => setKids(opt)}>
                <Text style={styles.optionText}>{opt}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.saveBtn} onPress={() => setShowRelationshipEdit(false)}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (theme, isDark) => StyleSheet.create({
  container: { flex: 1, backgroundColor: isDark ? '#130B1A' : '#F3E9EC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: isDark ? '#130B1A' : '#F3E9EC' },
  backIcon: { fontSize: 24, color: isDark ? '#fff' : '#333' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: isDark ? '#fff' : '#333' },
  photoSection: { padding: 20, alignItems: 'center' },
  photoContainer: { position: 'relative', marginBottom: 20 },
  profileImage: { width: 120, height: 120, borderRadius: 60 },
  avatarPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#FFB6C1', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 48, fontWeight: 'bold', color: '#fff' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, width: 36, height: 36, borderRadius: 18, backgroundColor: '#F70776', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' },
  editIcon: { fontSize: 16 },
  photoThumb: { width: 100, height: 100, borderRadius: 12, marginRight: 12 },
  addPhotoBtn: { width: 100, height: 100, borderRadius: 12, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderStyle: 'dashed', borderColor: theme.border },
  addPhotoText: { fontSize: 40, color: theme.textSecondary },
  section: { paddingHorizontal: 20, marginBottom: 20, marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 16 },
  infoCard: { borderRadius: 16, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)' },
  infoCardInner: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  infoIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#667eea', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  infoEmoji: { fontSize: 24 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 12, color: theme.textSecondary, marginBottom: 4 },
  infoValue: { fontSize: 15, fontWeight: '600', color: theme.text },
  infoArrow: { fontSize: 24, color: theme.textSecondary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%', overflow: 'hidden', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: theme.text },
  closeBtn: { fontSize: 24, color: theme.text },
  input: { backgroundColor: isDark ? '#3a3a3a' : '#f5f5f5', color: theme.text, padding: 15, borderRadius: 10, fontSize: 16, marginBottom: 20 },
  charCount: { fontSize: 12, color: theme.textSecondary, marginBottom: 10 },
  saveBtn: { backgroundColor: '#667eea', padding: 15, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  optionBtn: { padding: 16, borderRadius: 10, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', marginBottom: 10 },
  optionSelected: { backgroundColor: '#667eea' },
  optionText: { fontSize: 16, color: theme.text, textAlign: 'center' },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: theme.text, marginTop: 15, marginBottom: 10 },
  optionRow: { flexDirection: 'row', gap: 8, marginBottom: 15 },
  optionChip: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
});
