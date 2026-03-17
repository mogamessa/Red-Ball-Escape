import React from "react";
import { StatusBar } from "expo-status-bar";
import { View, StyleSheet } from "react-native";
import Colors from "@/constants/colors";
import { useGame } from "@/context/GameContext";
import MenuScreen from "@/screens/MenuScreen";
import GameScreen from "@/screens/GameScreen";
import GameOverScreen from "@/screens/GameOverScreen";

export default function Index() {
  const { gameState } = useGame();

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      {gameState === "menu" && <MenuScreen />}
      {(gameState === "playing" || gameState === "paused") && <GameScreen />}
      {gameState === "gameover" && <GameOverScreen />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
