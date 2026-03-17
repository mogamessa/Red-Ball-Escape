import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useRef, useState } from "react";
import {
  LayoutChangeEvent,
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

const HUD_HEIGHT = 60;

export default function GameScreen() {
  const { gameState, pauseGame, resumeGame, endGame } = useGame();
  const insets = useSafeAreaInsets();
  const [liveScore, setLiveScore] = useState(0);
  const [ballCount, setBallCount] = useState(4);
  const [gameAreaHeight, setGameAreaHeight] = useState(0);
  const [gameAreaWidth, setGameAreaWidth] = useState(0);
  const engineRef = useRef<{ reset: () => void }>(null);

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const handleGameWrapperLayout = useCallback((e: LayoutChangeEvent) => {
    const { height, width } = e.nativeEvent.layout;
    setGameAreaHeight(height);
    setGameAreaWidth(width);
  }, []);

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
  const isReady = gameAreaHeight > 0 && gameAreaWidth > 0;

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

      <View style={styles.gameWrapper} onLayout={handleGameWrapperLayout}>
        {isReady && (
          <GameEngine
            ref={engineRef}
            onScoreUpdate={handleScoreUpdate}
            onGameOver={handleGameOver}
            onBallCountUpdate={handleBallCount}
            running={isPlaying}
            gameAreaHeight={gameAreaHeight}
            gameAreaWidth={gameAreaWidth}
          />
        )}

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
    backgroundColor: Colors.gameArea,
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
