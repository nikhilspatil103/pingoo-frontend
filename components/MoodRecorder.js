import React from 'react';
import * as ImagePicker from 'expo-image-picker';

export default function MoodRecorder({ visible, onClose, onVideoRecorded }) {
  React.useEffect(() => {
    if (visible) {
      launchCamera();
    }
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
      onVideoRecorded(result.assets[0].uri);
    }
    onClose();
  };

  return null;
}
