import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { Camera } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_DURATION = 15;

export default function MoodRecorder({ visible, onClose, onVideoRecorded }) {
  const cameraRef = useRef(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [recording, setRecording] = useState(false);
  const [countdown, setCountdown] = useState(MAX_DURATION);
  const [cameraType, setCameraType] = useState(Camera.Constants.Type.front);
  const timerRef = useRef(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      const { status: audioStatus } = await Camera.requestMicrophonePermissionsAsync();
      setHasPermission(status === 'granted' && audioStatus === 'granted');
    })();
  }, []);

  useEffect(() => {
    if (!visible) {
      stopRecording();
      setCountdown(MAX_DURATION);
      progressAnim.setValue(0);
    }
  }, [visible]);

  const startRecording = async () => {
    if (!cameraRef.current || recording) return;

    setRecording(true);
    setCountdown(MAX_DURATION);
    progressAnim.setValue(0);

    // Animate progress bar
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: MAX_DURATION * 1000,
      useNativeDriver: false,
    }).start();

    // Countdown timer
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          stopRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    try {
      const video = await cameraRef.current.recordAsync({
        maxDuration: MAX_DURATION,
        quality: Camera.Constants.VideoQuality['720p'],
      });
      if (video?.uri) {
        onVideoRecorded(video.uri);
      }
    } catch (e) {
      console.error('Recording error:', e);
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recording && cameraRef.current) {
      cameraRef.current.stopRecording();
    }
    setRecording(false);
    progressAnim.stopAnimation();
  };

  const flipCamera = () => {
    setCameraType(prev =>
      prev === Camera.Constants.Type.front
        ? Camera.Constants.Type.back
        : Camera.Constants.Type.front
    );
  };

  if (!visible) return null;

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.permText}>Camera permission is required</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <Camera ref={cameraRef} style={styles.camera} type={cameraType} ratio="16:9">
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose} style={styles.topBtn}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={styles.timerBadge}>
            <Text style={[styles.timerText, countdown <= 5 && styles.timerTextRed]}>
              {countdown}s
            </Text>
          </View>
          <TouchableOpacity onPress={flipCamera} style={styles.topBtn} disabled={recording}>
            <Ionicons name="camera-reverse-outline" size={26} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Bottom controls */}
        <View style={styles.bottomBar}>
          <Text style={styles.hint}>{recording ? 'Recording...' : 'Tap to record'}</Text>
          <TouchableOpacity
            style={[styles.recordButton, recording && styles.recordButtonActive]}
            onPress={recording ? stopRecording : startRecording}
          >
            <View style={[styles.recordInner, recording && styles.recordInnerActive]} />
          </TouchableOpacity>
        </View>
      </Camera>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000', zIndex: 999 },
  camera: { flex: 1, justifyContent: 'space-between' },
  permText: { color: '#fff', fontSize: 16, textAlign: 'center', marginTop: 100 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60 },
  topBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  closeBtn: { position: 'absolute', top: 60, left: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  timerBadge: { backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  timerText: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  timerTextRed: { color: '#FF3B30' },
  progressContainer: { height: 4, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 20, borderRadius: 2, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: '#FF6B9D', borderRadius: 2 },
  bottomBar: { alignItems: 'center', paddingBottom: 60, gap: 12 },
  hint: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '500' },
  recordButton: { width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  recordButtonActive: { borderColor: '#FF3B30' },
  recordInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FF6B9D' },
  recordInnerActive: { width: 28, height: 28, borderRadius: 6, backgroundColor: '#FF3B30' },
});
