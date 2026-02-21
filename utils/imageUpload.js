import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/urlConfig';

export const uploadImageToCloudinary = async (imageUri, isPublic = false) => {
  try {
    const token = await AsyncStorage.getItem('token');
    
    // Convert image to base64
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64data = reader.result;
          
          console.log('Uploading base64 image');
          
          const endpoint = isPublic ? '/upload-image-public' : '/upload-image-base64';
          const headers = {
            'Content-Type': 'application/json',
          };
          
          if (!isPublic && token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
          
          const uploadResponse = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              image: base64data,
              filename: 'profile.jpg'
            }),
          });
          
          console.log('Upload response status:', uploadResponse.status);
          
          if (uploadResponse.ok) {
            const data = await uploadResponse.json();
            console.log('Upload success:', data);
            resolve({ success: true, imageUrl: data.imageUrl });
          } else {
            const errorText = await uploadResponse.text();
            console.log('Upload error text:', errorText);
            try {
              const errorData = JSON.parse(errorText);
              resolve({ success: false, error: errorData.error });
            } catch {
              resolve({ success: false, error: 'Server error' });
            }
          }
        } catch (error) {
          console.error('Upload error:', error);
          resolve({ success: false, error: 'Network error' });
        }
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Image conversion error:', error);
    return { success: false, error: 'Failed to process image' };
  }
};