import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { getAvatarColor } from '../utils/avatarColors';
import { useTheme } from '../context/ThemeContext';

const OptimizedImage = ({ uri, style, userId, userName, priority, resizeMode }) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  if (!uri) {
    const [bgColor] = getAvatarColor(userId, userName);
    return (
      <View style={[style, styles.avatarContainer, { backgroundColor: bgColor }]}>
        <Text style={styles.avatarLetter}>{userName?.charAt(0) || '?'}</Text>
      </View>
    );
  }

  return (
    <View style={style}>
      {loading && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="small" color={theme.primary} />
        </View>
      )}
      <Image
        source={{ uri }}
        style={style}
        contentFit={resizeMode || 'cover'}
        cachePolicy="disk"
        onLoadEnd={() => setLoading(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  avatarContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default React.memo(OptimizedImage);
