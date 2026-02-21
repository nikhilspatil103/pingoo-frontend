import React from 'react';
import { View, Text, StyleSheet, Platform, Image } from 'react-native';
import { getAvatarColor } from '../utils/avatarColors';

let FastImage;
if (Platform.OS !== 'web') {
  FastImage = require('react-native-fast-image');
}

const OptimizedImage = ({ uri, style, userId, userName, priority, resizeMode }) => {
  if (!uri) {
    const [bgColor] = getAvatarColor(userId, userName);
    return (
      <View style={[style, styles.avatarContainer, { backgroundColor: bgColor }]}>
        <Text style={styles.avatarLetter}>{userName?.charAt(0) || '?'}</Text>
      </View>
    );
  }

  if (Platform.OS === 'web') {
    return <Image source={{ uri }} style={style} resizeMode="cover" />;
  }

  return (
    <FastImage
      style={style}
      source={{
        uri,
        priority: priority || FastImage.priority.normal,
        cache: FastImage.cacheControl.immutable,
      }}
      resizeMode={resizeMode || FastImage.resizeMode.cover}
    />
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
