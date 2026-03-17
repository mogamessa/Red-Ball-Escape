import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useGame } from "@/context/GameContext";

export default function MenuScreen() {
  const { startGame, highScore } = useGame();
  const insets = useSafeAreaInsets();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const handleStart = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    startGame();
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: topInset + 20, paddingBottom: bottomInset + 20 },
      ]}
    >
      <View style={styles.topSection}>
        <View style={styles.ballPreview}>
          <View style={styles.playerBallLarge} />
          <View style={[styles.enemyBallSmall, { top: 4, right: 4 }]} />
          <View style={[styles.enemyBallSmall, { bottom: 8, left: 0 }]} />
          <View style={[styles.enemyBallSmall, { top: 20, left: -10 }]} />
        </View>

        <Text style={styles.title}>RED BALL</Text>
        <Text style={styles.titleAccent}>ESCAPE</Text>
        <Text style={styles.tagline}>How long can you survive?</Text>
      </View>

      <View style={styles.middleSection}>
        {highScore > 0 && (
          <View style={styles.highScoreCard}>
            <Ionicons name="trophy" size={20} color={Colors.score} />
            <Text style={styles.highScoreLabel}>BEST</Text>
            <Text style={styles.highScoreValue}>{highScore}</Text>
          </View>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.startButton,
            pressed && styles.startButtonPressed,
          ]}
          onPress={handleStart}
        >
          <Ionicons name="play" size={28} color="#fff" />
          <Text style={styles.startButtonText}>PLAY</Text>
        </Pressable>
      </View>

      <View style={styles.bottomSection}>
        <Text style={styles.howToTitle}>HOW TO PLAY</Text>
        <View style={styles.instructionRow}>
          <View style={styles.instructionIcon}>
            <Feather name="move" size={16} color={Colors.secondary} />
          </View>
          <Text style={styles.instructionText}>
            Drag to move the red ball
          </Text>
        </View>
        <View style={styles.instructionRow}>
          <View style={styles.instructionIcon}>
            <Ionicons name="radio-button-on" size={16} color={Colors.enemyBall} />
          </View>
          <Text style={styles.instructionText}>
            Avoid the white balls — they multiply!
          </Text>
        </View>
        <View style={styles.instructionRow}>
          <View style={styles.instructionIcon}>
            <Ionicons name="time-outline" size={16} color={Colors.accent} />
          </View>
          <Text style={styles.instructionText}>
            Survive as long as possible
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
    justifyContent: "space-between",
  },
  topSection: {
    alignItems: "center",
    gap: 4,
  },
  ballPreview: {
    width: 90,
    height: 90,
    position: "relative",
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  playerBallLarge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.playerBall,
    elevation: 20,
  },
  enemyBallSmall: {
    position: "absolute",
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.enemyBall,
  },
  title: {
    fontSize: 42,
    fontWeight: "900",
    color: Colors.text,
    letterSpacing: 6,
    fontFamily: "Inter_700Bold",
  },
  titleAccent: {
    fontSize: 42,
    fontWeight: "900",
    color: Colors.playerBall,
    letterSpacing: 6,
    fontFamily: "Inter_700Bold",
    marginTop: -6,
  },
  tagline: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    letterSpacing: 1,
    fontFamily: "Inter_400Regular",
  },
  middleSection: {
    alignItems: "center",
    gap: 20,
  },
  highScoreCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.backgroundCard,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  highScoreLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
    letterSpacing: 2,
  },
  highScoreValue: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: Colors.score,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: Colors.playerBall,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 60,
    elevation: 12,
  },
  startButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  startButtonText: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: 3,
  },
  bottomSection: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  howToTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted,
    letterSpacing: 3,
    marginBottom: 4,
  },
  instructionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  instructionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.backgroundElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  instructionText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    flex: 1,
  },
});
