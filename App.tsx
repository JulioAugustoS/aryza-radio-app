import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ImageBackground,
  Modal,
  Platform,
} from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { BlurView } from "expo-blur";
import { WebView } from "react-native-webview";
import TrackPlayer, {
  State,
  usePlaybackState,
} from "react-native-track-player";
import { Ionicons } from "@expo/vector-icons";
import { setupPlayer } from "./src/services/TrackPlayerSetup";

const CHAT_URL = "https://player.xcast.com.br/chat/8616";

const VIEWPORT_NO_ZOOM_SCRIPT = `
  (function() {
    var meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'viewport';
      var head = document.getElementsByTagName('head')[0];
      if (head) head.appendChild(meta);
    }
    if (meta) meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
  })();
  true;
`;

const track = {
  url: "http://stm25.xcast.com.br:8616/;",
  title: "Rádio Atos",
  artist: "Ao Vivo",
  artwork: require("./src/assets/bg4.jpeg"),
  isLiveStream: true,
};

export default function App() {
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const playbackState = usePlaybackState();

  const isPlaying =
    playbackState.state === State.Playing ||
    playbackState === (State.Playing as any);

  useEffect(() => {
    SplashScreen.preventAutoHideAsync();
  }, []);

  useEffect(() => {
    async function setup() {
      try {
        const isSetup = await setupPlayer();
        if (isSetup) {
          await TrackPlayer.add([track]);
          await TrackPlayer.play();
          setIsPlayerReady(true);
        }
      } finally {
        await SplashScreen.hideAsync();
      }
    }
    setup();
  }, []);

  async function togglePlayback() {
    const currentTrack = await TrackPlayer.getActiveTrackIndex();
    if (currentTrack !== undefined && currentTrack !== null) {
      if (isPlaying) {
        await TrackPlayer.pause();
      } else {
        await TrackPlayer.play();
      }
    } else {
      await TrackPlayer.play();
    }
  }

  if (!isPlayerReady) {
    return (
      <ImageBackground
        source={require("./src/assets/bg4.jpeg")}
        style={styles.background}
        resizeMode="cover"
        imageStyle={styles.backgroundImage}
      >
        <BlurView
          intensity={35}
          tint="dark"
          style={StyleSheet.absoluteFill}
          experimentalBlurMethod={
            Platform.OS === "android" ? "dimezisBlurView" : undefined
          }
        />
        <View style={styles.centerSection}>
          <Image
            source={require("./src/assets/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <ActivityIndicator
            size="large"
            color="#007AFF"
            style={{ marginTop: 24 }}
          />
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require("./src/assets/bg4.jpeg")}
      style={styles.background}
      resizeMode="cover"
      imageStyle={styles.backgroundImage}
    >
      <BlurView
        intensity={0}
        tint="dark"
        style={StyleSheet.absoluteFill}
        experimentalBlurMethod={
          Platform.OS === "android" ? "dimezisBlurView" : undefined
        }
      />
      <View style={styles.centerSection}>
        <Image
          source={require("./src/assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Web Rádio Atos</Text>
      </View>

      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={styles.playButton}
          onPress={togglePlayback}
          activeOpacity={0.9}
        >
          <BlurView
            intensity={60}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
          <Ionicons
            name={isPlaying ? "pause" : "play"}
            size={48}
            color="white"
            style={{ marginLeft: isPlaying ? 0 : 6 }}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => setChatVisible(true)}
          activeOpacity={0.9}
        >
          <BlurView
            intensity={60}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
          <Ionicons name="chatbubbles" size={24} color="white" />
          <Text style={styles.chatButtonText}>Entrar no Chat</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={chatVisible}
        animationType="slide"
        onRequestClose={() => setChatVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Rádio Atos Chat</Text>
            <TouchableOpacity
              onPress={() => setChatVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
          <WebView
            source={{ uri: CHAT_URL }}
            style={styles.webview}
            injectedJavaScriptBeforeContentLoaded={VIEWPORT_NO_ZOOM_SCRIPT}
            injectedJavaScript={VIEWPORT_NO_ZOOM_SCRIPT}
          />
        </View>
      </Modal>

      <StatusBar style="light" />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#1a1a1a",
  },
  backgroundImage: {
    alignSelf: "center",
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  centerSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  logo: {
    width: "100%",
    maxWidth: 280,
    height: 200,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 16,
    color: "#fff",
  },
  bottomSection: {
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 48,
    paddingHorizontal: 24,
    gap: 20,
  },
  playButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    overflow: "hidden",
    minWidth: 180,
  },
  chatButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: "#000",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  closeButton: {
    padding: 4,
  },
  webview: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
