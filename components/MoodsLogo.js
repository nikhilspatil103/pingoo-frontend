import React from 'react';
import { Image } from 'react-native';

export default function MoodsLogo({ size = 28 }) {
  return (
    <Image
      source={require('../assets/Ping.png')}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}
