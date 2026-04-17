import { useEffect, useRef, useState } from "react";
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
  Animated,
  Easing,
  PanResponder,
} from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { BlurView } from "expo-blur";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import Svg, { Path } from "react-native-svg";
import TrackPlayer, {
  State,
  usePlaybackState,
} from "react-native-track-player";
import { Ionicons } from "@expo/vector-icons";
import { setupPlayer } from "./src/services/TrackPlayerSetup";

const CHAT_URL = "https://www3.cbox.ws/box/?boxid=3554303&boxtag=T4hulW";

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

const WAVE_BARS = [8, 16, 10, 22, 14, 18, 28, 18, 12, 24, 15, 20, 11, 17, 9];

const VOLUME_RING_SIZE = 284;
const VOLUME_RING_STROKE = 12;
const VOLUME_RING_CENTER = VOLUME_RING_SIZE / 2;
const VOLUME_RING_RADIUS = VOLUME_RING_CENTER - VOLUME_RING_STROKE / 2 - 8;
const VOLUME_RING_ARC_LENGTH = Math.PI * VOLUME_RING_RADIUS;
const VOLUME_HANDLE_SIZE = 22;
const VOLUME_SIDE_ICON_SIZE = 40;
const VOLUME_SIDE_ICON_TOP = VOLUME_RING_CENTER - VOLUME_SIDE_ICON_SIZE - 20;
const VOLUME_SIDE_ICON_SIDE_OFFSET = 45;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export default function App() {
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const [volume, setVolume] = useState(0.58);
  const playbackState = usePlaybackState();
  const waveAnimations = useRef(
    WAVE_BARS.map(() => new Animated.Value(0.35)),
  ).current;
  const waveLoopsRef = useRef<Animated.CompositeAnimation[]>([]);

  const isPlaying =
    playbackState.state === State.Playing ||
    playbackState === (State.Playing as any);
  const volumeVisualProgress = volume;
  const volumeAngleRadians = Math.PI * (1 - volume);
  const volumeHandleX =
    VOLUME_RING_CENTER +
    VOLUME_RING_RADIUS * Math.cos(volumeAngleRadians) -
    VOLUME_HANDLE_SIZE / 2;
  const volumeHandleY =
    VOLUME_RING_CENTER +
    VOLUME_RING_RADIUS * Math.sin(volumeAngleRadians) -
    VOLUME_HANDLE_SIZE / 2;

  function updateVolumeFromTouch(locationX: number, locationY: number) {
    const deltaX = locationX - VOLUME_RING_CENTER;
    const deltaY = locationY - VOLUME_RING_CENTER;

    let angle = Math.atan2(deltaY, deltaX);
    if (angle < 0) angle += 2 * Math.PI;

    // Controla apenas a meia-lua inferior; toque acima "cola" no lado mais próximo.
    if (angle > Math.PI) {
      angle = angle > 1.5 * Math.PI ? 0 : Math.PI;
    }

    const nextVolume = 1 - angle / Math.PI;
    setVolume(clamp(nextVolume, 0, 1));
  }

  const volumePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => {
        updateVolumeFromTouch(
          event.nativeEvent.locationX,
          event.nativeEvent.locationY,
        );
      },
      onPanResponderMove: (event) => {
        updateVolumeFromTouch(
          event.nativeEvent.locationX,
          event.nativeEvent.locationY,
        );
      },
    }),
  ).current;

  useEffect(() => {
    function stopWaveLoops() {
      waveLoopsRef.current.forEach((loop) => loop.stop());
      waveLoopsRef.current = [];
    }

    stopWaveLoops();

    if (isPlaying) {
      waveLoopsRef.current = waveAnimations.map((wave, index) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(index * 60),
            Animated.timing(wave, {
              toValue: 1,
              duration: 180 + ((index + 1) % 5) * 45,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: false,
            }),
            Animated.timing(wave, {
              toValue: 0.35,
              duration: 220 + ((index + 2) % 4) * 45,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: false,
            }),
          ]),
        ),
      );

      waveLoopsRef.current.forEach((loop) => loop.start());
    } else {
      waveAnimations.forEach((wave, index) => {
        Animated.timing(wave, {
          toValue: 0.35,
          duration: 160 + index * 10,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }).start();
      });
    }

    return () => {
      stopWaveLoops();
    };
  }, [isPlaying, waveAnimations]);

  useEffect(() => {
    SplashScreen.preventAutoHideAsync();
  }, []);

  useEffect(() => {
    async function setup() {
      try {
        const isSetup = await setupPlayer();
        if (isSetup) {
          await TrackPlayer.add([track]);
          await TrackPlayer.setVolume(volume);
          await TrackPlayer.play();
          setIsPlayerReady(true);
        }
      } finally {
        await SplashScreen.hideAsync();
      }
    }
    setup();
  }, []);

  useEffect(() => {
    if (!isPlayerReady) return;

    TrackPlayer.setVolume(volume).catch(() => {
      // Se falhar momentaneamente, o próximo update reaplica o volume.
    });
  }, [isPlayerReady, volume]);

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
        style={styles.loadingBackground}
        resizeMode="cover"
        imageStyle={styles.loadingBackgroundImage}
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
            source={track.artwork}
            style={styles.loadingArtwork}
            resizeMode="cover"
          />
          <ActivityIndicator
            size="large"
            color="#ff5b8c"
            style={styles.loadingIndicator}
          />
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require("./src/assets/bg4.jpeg")}
      style={styles.appBackground}
      resizeMode="cover"
      imageStyle={styles.appBackgroundImage}
    >
      <BlurView
        intensity={20}
        tint="dark"
        style={StyleSheet.absoluteFill}
        experimentalBlurMethod={
          Platform.OS === "android" ? "dimezisBlurView" : undefined
        }
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.playerCard}>
          <View style={styles.turntableSection}>
            <View style={[styles.volumeSideIcon, styles.volumeSideIconLeft]}>
              <Ionicons name="volume-mute-outline" size={22} color="#a6afd8" />
            </View>
            <View style={[styles.volumeSideIcon, styles.volumeSideIconRight]}>
              <Ionicons name="volume-high-outline" size={22} color="#d8deff" />
            </View>
            <View style={styles.volumeDialContainer} {...volumePanResponder.panHandlers}>
              <Svg
                width={VOLUME_RING_SIZE}
                height={VOLUME_RING_SIZE}
                style={styles.volumeRingSvg}
                pointerEvents="none"
              >
                <Path
                  d={`
                    M ${VOLUME_RING_CENTER - VOLUME_RING_RADIUS} ${VOLUME_RING_CENTER}
                    A ${VOLUME_RING_RADIUS} ${VOLUME_RING_RADIUS} 0 0 0 ${VOLUME_RING_CENTER + VOLUME_RING_RADIUS} ${VOLUME_RING_CENTER}
                  `}
                  stroke="rgba(220,228,255,0.2)"
                  strokeWidth={VOLUME_RING_STROKE}
                  fill="none"
                  strokeLinecap="round"
                />
                <Path
                  d={`
                    M ${VOLUME_RING_CENTER - VOLUME_RING_RADIUS} ${VOLUME_RING_CENTER}
                    A ${VOLUME_RING_RADIUS} ${VOLUME_RING_RADIUS} 0 0 0 ${VOLUME_RING_CENTER + VOLUME_RING_RADIUS} ${VOLUME_RING_CENTER}
                  `}
                  stroke="#8B7DFF"
                  strokeWidth={VOLUME_RING_STROKE}
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${VOLUME_RING_ARC_LENGTH * volumeVisualProgress} ${VOLUME_RING_ARC_LENGTH}`}
                />
              </Svg>
              <View style={[styles.volumeHandle, { left: volumeHandleX, top: volumeHandleY }]} />
              <View style={styles.albumCoverOnlyContainer}>
                <Image source={track.artwork} style={styles.albumCover} resizeMode="cover" />
              </View>
            </View>
          </View>

          <View style={styles.trackInfoSection}>
            <View style={styles.trackInfoHeader}>
              <View style={styles.trackTextBlock}>
                <Text style={styles.trackTitle}>{track.title}</Text>
                <Text style={styles.trackArtist}>{track.artist}</Text>
              </View>
              <TouchableOpacity
                style={styles.secondaryIconButton}
                onPress={() => setChatVisible(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={22} color="#9098bf" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.wavePanel}>
            <View style={styles.waveContainer}>
            {WAVE_BARS.map((height, index) => (
              <Animated.View
                key={`bar-${index}`}
                style={[
                  styles.waveBar,
                  {
                    height: waveAnimations[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [Math.max(6, height * 0.45), height + 12],
                    }),
                  },
                  index >= 6 && index <= 8 ? styles.waveBarHighlight : null,
                ]}
              />
            ))}
            </View>
          </View>

          <View style={styles.playerControlsRow}>
            <TouchableOpacity
              style={styles.mainPlayButton}
              onPress={togglePlayback}
              activeOpacity={0.9}
            >
              <View style={styles.mainPlayButtonInner}>
                <Ionicons
                  name={isPlaying ? "pause" : "play"}
                  size={36}
                  color="#fff"
                  style={isPlaying ? undefined : { marginLeft: 4 }}
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

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
  loadingBackground: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#1a1a1a",
  },
  loadingBackgroundImage: {
    alignSelf: "center",
  },
  centerSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  loadingArtwork: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.25)",
  },
  loadingIndicator: {
    marginTop: 24,
  },
  appBackground: {
    flex: 1,
    backgroundColor: "#060914",
  },
  appBackgroundImage: {
    opacity: 0.14,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  playerCard: {
    flex: 1,
    borderRadius: 34,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 24,
    backgroundColor: "rgba(9,14,35,0.82)",
    borderWidth: 1,
    borderColor: "rgba(189,203,255,0.12)",
    justifyContent: "center",
  },
  turntableSection: {
    marginTop: 0,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  volumeSideIcon: {
    position: "absolute",
    width: VOLUME_SIDE_ICON_SIZE,
    height: VOLUME_SIDE_ICON_SIZE,
    borderRadius: VOLUME_SIDE_ICON_SIZE / 2,
    top: VOLUME_SIDE_ICON_TOP,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(206,215,255,0.2)",
    zIndex: 2,
  },
  volumeSideIconLeft: {
    left: VOLUME_SIDE_ICON_SIDE_OFFSET,
  },
  volumeSideIconRight: {
    right: VOLUME_SIDE_ICON_SIDE_OFFSET,
  },
  volumeDialContainer: {
    width: VOLUME_RING_SIZE,
    height: VOLUME_RING_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  volumeRingSvg: {
    position: "absolute",
  },
  volumeHandle: {
    position: "absolute",
    width: VOLUME_HANDLE_SIZE,
    height: VOLUME_HANDLE_SIZE,
    borderRadius: VOLUME_HANDLE_SIZE / 2,
    backgroundColor: "#F4F7FF",
    borderWidth: 4,
    borderColor: "#6E62FF",
    shadowColor: "#6E62FF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  albumCoverOnlyContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.33,
    shadowRadius: 20,
    elevation: 8,
  },
  albumCover: {
    width: "100%",
    height: "100%",
  },
  trackInfoSection: {
    marginTop: 30,
  },
  trackInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  trackTextBlock: {
    flex: 1,
  },
  trackTitle: {
    color: "#f4f6ff",
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  trackArtist: {
    color: "#99a4d2",
    fontSize: 20,
    fontWeight: "500",
    marginTop: 4,
  },
  secondaryIconButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.09)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  wavePanel: {
    marginTop: 28,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(222,229,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  waveContainer: {
    height: 32,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  waveBar: {
    width: 5,
    borderRadius: 3,
    backgroundColor: "#8a94be",
    opacity: 0.8,
  },
  waveBarHighlight: {
    backgroundColor: "#eef2ff",
    opacity: 1,
  },
  playerControlsRow: {
    marginTop: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  mainPlayButton: {
    width: 92,
    height: 92,
    borderRadius: 46,
    padding: 4,
    backgroundColor: "rgba(255,255,255,0.16)",
    shadowColor: "#5c61ff",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
  },
  mainPlayButtonInner: {
    flex: 1,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6f63ff",
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
