import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

class AudioRecorder {
  constructor() {
    this.recording = null;
    this.isRecording = false;
  }

  async startRecording() {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Audio permission not granted');
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_MEDIUM,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
      });

      this.recording = recording;
      this.isRecording = true;
      return recording;
    } catch (error) {
      throw error;
    }
  }

  async stopRecording() {
    if (!this.recording) return null;

    try {
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.recording = null;
      this.isRecording = false;
      return uri;
    } catch (error) {
      throw error;
    }
  }

  async getAudioDuration(uri) {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri });
      const status = await sound.getStatusAsync();
      await sound.unloadAsync();
      return Math.round(status.durationMillis / 1000);
    } catch (error) {
      return 0;
    }
  }
}

export default new AudioRecorder();