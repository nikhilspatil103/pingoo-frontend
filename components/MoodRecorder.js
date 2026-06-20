import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Platform } from 'react-native';
import { Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import FilterSelector, { FILTERS } from './CameraFilters';

export default function MoodRecorder({ visible, onClose, onVideoRecorded }) {
  const [videoUri, setVideoUri] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('normal');
  const videoRef = useRef(null);

  useEffect(() => {
    if (visible) {
      launchCamera();
    }
    return () => {
      setVideoUri(null);
      setSelectedFilter('normal');
    };
  }, [visible]);

  const launchCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      onClose();
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['videos'],
      videoMaxDuration: 15,
      videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setVideoUri(result.assets[0].uri);
    } else {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (videoUri) {
      onVideoRecorded(videoUri, selectedFilter);
    }
    setVideoUri(null);
    setSelectedFilter('normal');
  };

  const handleRetake = () => {
    setVideoUri(null);
    setSelectedFilter('normal');
    launchCamera();
  };

  if (!visible || !videoUri) return null;

  const activeFilter = FILTERS.find(f => f.id === selectedFilter);

  return (
    <Modal visible={true} animationType="slide" statusBarTranslucent>
      <View style={styles.container}>
        {/* Video Preview */}
        <View style={styles.videoContainer}>
          <Video
            ref={videoRef}
            source={{ uri: videoUri }}
            style={styles.video}
            resizeMode="cover"
            shouldPlay
            isLooping
            isMuted={false}
          />
          {/* Filter Overlay */}
          {activeFilter?.overlay && (
            <View style={[styles.filterOverlay, { backgroundColor: activeFilter.overlay }]} pointerEvents="none" />
          )}
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomSection}>
          <FilterSelector selectedFilter={selectedFilter} onSelectFilter={setSelectedFilter} />

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.retakeBtn} onPress={handleRetake}>
              <Ionicons name="refresh" size={22} color="#fff" />
              <Text style={styles.retakeText}>Retake</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
              <Ionicons name="checkmark" size={22} color="#fff" />
              <Text style={styles.confirmText}>Next</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Close */}
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  video: {
    flex: 1,
  },
  filterOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomSection: {
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  retakeText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
    backgroundColor: '#FF6B9D',
  },
  confirmText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  closeBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
