import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { requestLocationPermission } from '../utils/locationService';

export default function LocationPermissionModal({ visible, onClose, onGranted }) {
  const { theme, isDark } = useTheme();

  const handleRequest = async () => {
    const granted = await requestLocationPermission();
    if (granted) {
      onGranted?.();
    }
    onClose();
  };

  const styles = getStyles(theme, isDark);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.icon}>📍</Text>
          <Text style={styles.title}>Enable Location</Text>
          <Text style={styles.message}>
            Allow Pingoo to access your location to show distances to other profiles
          </Text>
          <TouchableOpacity style={styles.allowBtn} onPress={handleRequest}>
            <Text style={styles.allowText}>Allow Location</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Not Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (theme, isDark) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: isDark ? '#1a1a2e' : '#fff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  icon: { fontSize: 64, marginBottom: 16 },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 12,
  },
  message: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  allowBtn: {
    backgroundColor: '#F70776',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    marginBottom: 12,
  },
  allowText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cancelBtn: {
    paddingVertical: 12,
  },
  cancelText: {
    color: theme.textSecondary,
    fontSize: 14,
  },
});
