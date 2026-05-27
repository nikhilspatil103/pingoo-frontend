import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, StatusBar } from 'react-native';
import { Video } from 'expo-av';

export default function MoodPlayerScreen({ route, navigation }) {
  const { mood } = route.params;

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <Video
        source={{ uri: mood.videoUrl }}
        style={StyleSheet.absoluteFill}
        resizeMode="contain"
        shouldPlay
        isLooping
        videoStyle={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
      <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>
      {mood.caption ? <Text style={styles.caption}>{mood.caption}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  closeBtn: { position: 'absolute', top: 50, left: 20, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  closeText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  caption: { position: 'absolute', bottom: 40, left: 20, right: 20, color: '#fff', fontSize: 15, textShadowColor: '#000', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
});
