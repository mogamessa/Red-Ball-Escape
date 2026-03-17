import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useRef, useState } from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import GameEngine from "@/components/GameEngine";
import { useGame } from "@/context/GameContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GAME_WIDTH = Math.min(SCREEN_WIDTH, 420);

const HUD_HEIGHT = 60;

export default function GameScreen() {
  const { gameState, pauseGame, resumeGame, endGame } = useGame();
  const insets = useSafeAreaInsets();
  const [liveScore, setLiveScore] = useState(0);
  const [ballCount, setBallCount] = useState(4);
  const engineRef = useRef<{ reset: () => void }>(null);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const totalHeaderHeight = topInset + HUD_HEIGHT;
  const gameAreaHeight =
    Dimensions.get("window").height - totalHeaderHeight - bottomInset - 4;

  const handleScoreUpdate = useCallback((s: number) => {
    setLiveScore(s);
  }, []);

  const handleGameOver = useCallback(
    (s: number) => {
      endGame(s);
    },
    [endGame]
  );

  const handleBallCount = useCallback((count: number) => {
    setBallCount(count);
  }, []);

  const handlePause = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    pauseGame();
  };

  const handleResume = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    resumeGame();
  };

  const isPaused = gameState === "paused";
  const isPlaying = gameState === "playing";

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <View style={styles.hud}>
        <View style={styles.hudItem}>
          <Text style={styles.hudLabel}>SCORE</Text>
          <Text style={styles.hudValue}>{liveScore}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.pauseButton,
            pressed && { opacity: 0.7 },
          ]}
          onPress={isPaused ? handleResume : handlePause}
        >
          <Ionicons
            name={isPaused ? "play" : "pause"}
            size={22}
            color={Colors.text}
          />
        </Pressable>
        <View style={[styles.hudItem, { alignItems: "flex-end" }]}>
          <Text style={styles.hudLabel}>BALLS</Text>
          <Text style={[styles.hudValue, { color: Colors.textSecondary }]}>
            {ballCount}
          </Text>
        </View>
      </View>

      <View style={styles.gameWrapper}>
        <GameEngine
          ref={engineRef}
          onScoreUpdate={handleScoreUpdate}
          onGameOver={handleGameOver}
          onBallCountUpdate={handleBallCount}
          running={isPlaying}
          gameAreaHeight={gameAreaHeight}
        />

        {isPaused && (
          <View style={styles.pauseOverlay}>
            <Text style={styles.pauseTitle}>PAUSED</Text>
            <Pressable
              style={({ pressed }) => [
                styles.resumeButton,
                pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
              ]}
              onPress={handleResume}
            >
              <Ionicons name="play" size={22} color="#fff" />
              <Text style={styles.resumeButtonText}>RESUME</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  hud: {
    height: HUD_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  hudItem: {
    width: 80,
  },
  hudLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted,
    letterSpacing: 2,
  },
  hudValue: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.score,
    letterSpacing: 1,
  },
  pauseButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.backgroundCard,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gameWrapper: {
    flex: 1,
    position: "relative",
    alignItems: "center",
  },
  pauseOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.overlay,
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  pauseTitle: {
    fontSize: 36,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: 8,
  },
  resumeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 40,
    elevation: 10,
  },
  resumeButtonText: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: 3,
  },
});
