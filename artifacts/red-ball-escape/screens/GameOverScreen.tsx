import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useGame } from "@/context/GameContext";

export default function GameOverScreen() {
  const { score, highScore, isNewHighScore, startGame, backToMenu } = useGame();
  const insets = useSafeAreaInsets();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const titleScale = useSharedValue(0.5);
  const scoreOpacity = useSharedValue(0);
  const buttonsOpacity = useSharedValue(0);

  useEffect(() => {
    titleScale.value = withSpring(1, { damping: 12, stiffness: 150 });
    scoreOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));
    buttonsOpacity.value = withDelay(600, withTiming(1, { duration: 400 }));
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, []);

  const titleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: titleScale.value }],
  }));
  const scoreStyle = useAnimatedStyle(() => ({ opacity: scoreOpacity.value }));
  const buttonsStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
  }));

  const handleRetry = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    startGame();
  };

  const handleMenu = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    backToMenu();
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: topInset + 30, paddingBottom: bottomInset + 30 },
      ]}
    >
      <View style={styles.topDecorations}>
        <View style={[styles.decoCircle, { width: 6, height: 6, top: 20, left: 30 }]} />
        <View style={[styles.decoCircle, { width: 10, height: 10, top: 60, right: 50 }]} />
        <View style={[styles.decoCircle, { width: 5, height: 5, top: 40, right: 80 }]} />
      </View>

      <Animated.View style={[styles.titleSection, titleStyle]}>
        <View style={styles.xMark}>
          <Ionicons name="close-circle" size={64} color={Colors.buttonDanger} />
        </View>
        <Text style={styles.gameOverText}>GAME OVER</Text>
      </Animated.View>

      <Animated.View style={[styles.scoreSection, scoreStyle]}>
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabelText}>YOUR SCORE</Text>
          <Text style={styles.scoreValueText}>{score}</Text>
        </View>

        {isNewHighScore ? (
          <View style={styles.newHighScoreBadge}>
            <Ionicons name="trophy" size={16} color={Colors.score} />
            <Text style={styles.newHighScoreText}>NEW BEST!</Text>
          </View>
        ) : (
          <View style={styles.bestRow}>
            <Ionicons name="trophy-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.bestText}>Best: {highScore}</Text>
          </View>
        )}
      </Animated.View>

      <Animated.View style={[styles.buttonSection, buttonsStyle]}>
        <Pressable
          style={({ pressed }) => [
            styles.retryButton,
            pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
          ]}
          onPress={handleRetry}
        >
          <Ionicons name="refresh" size={22} color="#fff" />
          <Text style={styles.retryButtonText}>TRY AGAIN</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.menuButton,
            pressed && { opacity: 0.7 },
          ]}
          onPress={handleMenu}
        >
          <Ionicons name="home-outline" size={18} color={Colors.textSecondary} />
          <Text style={styles.menuButtonText}>Main Menu</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 32,
    justifyContent: "space-between",
  },
  topDecorations: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  decoCircle: {
    position: "absolute",
    borderRadius: 100,
    backgroundColor: Colors.enemyBall,
    opacity: 0.2,
  },
  titleSection: {
    alignItems: "center",
    gap: 12,
    marginTop: 20,
  },
  xMark: {
    elevation: 10,
  },
  gameOverText: {
    fontSize: 36,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: 6,
  },
  scoreSection: {
    alignItems: "center",
    gap: 16,
  },
  scoreCard: {
    width: "100%",
    backgroundColor: Colors.backgroundCard,
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  scoreLabelText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textMuted,
    letterSpacing: 3,
  },
  scoreValueText: {
    fontSize: 64,
    fontFamily: "Inter_700Bold",
    color: Colors.score,
    lineHeight: 72,
  },
  newHighScoreBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 214, 10, 0.1)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 214, 10, 0.3)",
  },
  newHighScoreText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: Colors.score,
    letterSpacing: 2,
  },
  bestRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  bestText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.textMuted,
  },
  buttonSection: {
    gap: 12,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.playerBall,
    borderRadius: 18,
    paddingVertical: 20,
    elevation: 12,
  },
  retryButtonText: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: 2,
  },
  menuButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  menuButtonText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
});
