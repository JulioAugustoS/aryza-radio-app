import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import TrackPlayer, { State, usePlaybackState } from 'react-native-track-player';
import { Ionicons } from '@expo/vector-icons';
import { setupPlayer } from './src/services/TrackPlayerSetup';

const track = {
  url: 'https://b2.1tunes.com/b2.1tunes.com?ident=radios-br', // Ponto de stream de exemplo
  title: 'Rádio Streaming',
  artist: 'Ao Vivo',
  artwork: 'https://reactnative.dev/img/tiny_logo.png',
};

export default function App() {
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const playbackState = usePlaybackState();

  // Compatibilidade entre v3 e v4 do react-native-track-player
  const isPlaying = 
    playbackState.state === State.Playing || 
    playbackState === State.Playing as any;

  useEffect(() => {
    async function setup() {
      const isSetup = await setupPlayer();
      if (isSetup) {
        await TrackPlayer.add([track]);
        setIsPlayerReady(true);
      }
    }
    setup();
  }, []);

  async function togglePlayback() {
    const currentTrack = await TrackPlayer.getActiveTrackIndex(); // v4 usa getActiveTrackIndex ou getActiveTrack
    if (currentTrack !== undefined && currentTrack !== null) {
      if (isPlaying) {
        await TrackPlayer.pause();
      } else {
        await TrackPlayer.play();
      }
    } else {
      // Se não tiver track ativa, tente dar play mesmo assim (pode estar no inicio)
      await TrackPlayer.play();
    }
  }

  if (!isPlayerReady) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rádio App</Text>
      
      <TouchableOpacity style={styles.playButton} onPress={togglePlayback}>
        <Ionicons 
          name={isPlaying ? "pause" : "play"} 
          size={48} 
          color="white" 
          style={{ marginLeft: isPlaying ? 0 : 6 }} // Ajuste visual do ícone de play
        />
      </TouchableOpacity>
      
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 60,
    color: '#333',
  },
  playButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  }
});
