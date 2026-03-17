import * as Haptics from "expo-haptics";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  PanResponder,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import Colors from "@/constants/colors";

const PLAYER_RADIUS = 18;
const ENEMY_RADIUS = 14;
const MIN_ENEMY_RADIUS = 5;
const FPS_INTERVAL = 16;

interface Ball {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface GameEngineHandle {
  reset: () => void;
}

interface GameEngineProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (score: number) => void;
  onBallCountUpdate: (count: number) => void;
  running: boolean;
  gameAreaHeight: number;
  gameAreaWidth: number;
}

let _idCounter = 0;
function genId() {
  return `ball_${Date.now()}_${_idCounter++}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

const GameEngine = forwardRef<GameEngineHandle, GameEngineProps>(
  (
    { onScoreUpdate, onGameOver, onBallCountUpdate, running, gameAreaHeight, gameAreaWidth },
    ref
  ) => {
    const playerRef = useRef({ x: gameAreaWidth / 2, y: gameAreaHeight / 2 });
    const ballsRef = useRef<Ball[]>([]);
    const scoreRef = useRef(0);
    const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const runningRef = useRef(running);
    const gameAreaHeightRef = useRef(gameAreaHeight);
    const gameAreaWidthRef = useRef(gameAreaWidth);

    // Store the screen-space offset of the game view (for Android coordinate fix)
    const viewOffsetRef = useRef({ x: 0, y: 0 });
    const viewRef = useRef<View>(null);

    const [isReady, setIsReady] = useState(false);
    const [renderTick, setRenderTick] = useState(0);

    useEffect(() => {
      runningRef.current = running;
    }, [running]);

    useEffect(() => {
      gameAreaHeightRef.current = gameAreaHeight;
    }, [gameAreaHeight]);

    useEffect(() => {
      gameAreaWidthRef.current = gameAreaWidth;
    }, [gameAreaWidth]);

    const spawnInitialBalls = useCallback(() => {
      const h = gameAreaHeightRef.current;
      const w = gameAreaWidthRef.current;
      const corners = [
        { x: ENEMY_RADIUS + 10, y: ENEMY_RADIUS + 10 },
        { x: w - ENEMY_RADIUS - 10, y: ENEMY_RADIUS + 10 },
        { x: ENEMY_RADIUS + 10, y: h - ENEMY_RADIUS - 10 },
        { x: w - ENEMY_RADIUS - 10, y: h - ENEMY_RADIUS - 10 },
      ];

      ballsRef.current = corners.map((pos) => ({
        id: genId(),
        x: pos.x,
        y: pos.y,
        vx: (Math.random() * 2 + 1) * (Math.random() < 0.5 ? 1 : -1),
        vy: (Math.random() * 2 + 1) * (Math.random() < 0.5 ? 1 : -1),
        radius: ENEMY_RADIUS,
      }));
    }, []);

    const resetGame = useCallback(() => {
      playerRef.current = {
        x: gameAreaWidthRef.current / 2,
        y: gameAreaHeightRef.current / 2,
      };
      scoreRef.current = 0;
      spawnInitialBalls();
      setIsReady(true);
      setRenderTick((t) => t + 1);
    }, [spawnInitialBalls]);

    useImperativeHandle(ref, () => ({ reset: resetGame }));

    useEffect(() => {
      resetGame();
    }, [resetGame]);

    // Measure view offset after mount so PanResponder can convert screen coords
    useEffect(() => {
      const measureOffset = () => {
        if (viewRef.current) {
          viewRef.current.measure((_x, _y, _w, _h, pageX, pageY) => {
            viewOffsetRef.current = { x: pageX ?? 0, y: pageY ?? 0 };
          });
        }
      };
      // Slight delay to ensure layout is complete
      const t = setTimeout(measureOffset, 100);
      return () => clearTimeout(t);
    }, [isReady, gameAreaWidth, gameAreaHeight]);

    // Game loop
    useEffect(() => {
      let frameCount = 0;

      const tick = () => {
        if (!runningRef.current) return;

        frameCount++;
        scoreRef.current++;
        if (frameCount % 6 === 0) {
          onScoreUpdate(scoreRef.current);
        }

        const h = gameAreaHeightRef.current;
        const w = gameAreaWidthRef.current;
        const player = playerRef.current;
        const newBalls: Ball[] = [];

        for (const ball of ballsRef.current) {
          let nx = ball.x + ball.vx;
          let ny = ball.y + ball.vy;
          let nvx = ball.vx;
          let nvy = ball.vy;
          let split = false;

          if (nx - ball.radius <= 0) {
            nx = ball.radius;
            nvx = Math.abs(nvx);
            split = true;
          } else if (nx + ball.radius >= w) {
            nx = w - ball.radius;
            nvx = -Math.abs(nvx);
            split = true;
          }

          if (ny - ball.radius <= 0) {
            ny = ball.radius;
            nvy = Math.abs(nvy);
            split = true;
          } else if (ny + ball.radius >= h) {
            ny = h - ball.radius;
            nvy = -Math.abs(nvy);
            split = true;
          }

          const updatedBall: Ball = {
            ...ball,
            x: nx,
            y: ny,
            vx: nvx,
            vy: nvy,
          };
          newBalls.push(updatedBall);

          if (split && ball.radius > MIN_ENEMY_RADIUS) {
            const newRadius = Math.max(ball.radius * 0.65, MIN_ENEMY_RADIUS);
            const speed =
              Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy) * 1.1;
            const angle = Math.random() * Math.PI * 2;
            newBalls.push({
              id: genId(),
              x: nx,
              y: ny,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              radius: newRadius,
            });
          }
        }

        ballsRef.current = newBalls.slice(0, 60);
        onBallCountUpdate(ballsRef.current.length);

        for (const ball of ballsRef.current) {
          const dx = player.x - ball.x;
          const dy = player.y - ball.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < PLAYER_RADIUS + ball.radius - 4) {
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            }
            onGameOver(scoreRef.current);
            return;
          }
        }

        setRenderTick((t) => t + 1);
      };

      tickRef.current = setInterval(tick, FPS_INTERVAL);
      return () => {
        if (tickRef.current) clearInterval(tickRef.current);
      };
    }, [onScoreUpdate, onGameOver, onBallCountUpdate]);

    // Convert screen-space pageX/pageY to game-area-local coordinates
    const toLocal = useCallback((pageX: number, pageY: number) => {
      const w = gameAreaWidthRef.current;
      const h = gameAreaHeightRef.current;
      const ox = viewOffsetRef.current.x;
      const oy = viewOffsetRef.current.y;
      return {
        x: Math.max(PLAYER_RADIUS, Math.min(w - PLAYER_RADIUS, pageX - ox)),
        y: Math.max(PLAYER_RADIUS, Math.min(h - PLAYER_RADIUS, pageY - oy)),
      };
    }, []);

    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => {
          if (!runningRef.current) return;
          const { pageX, pageY } = e.nativeEvent;
          const pos = toLocal(pageX, pageY);
          playerRef.current = pos;
        },
        onPanResponderMove: (e) => {
          if (!runningRef.current) return;
          const { pageX, pageY } = e.nativeEvent;
          const pos = toLocal(pageX, pageY);
          playerRef.current = pos;
        },
      })
    ).current;

    if (!isReady) return null;

    const player = playerRef.current;
    const balls = ballsRef.current;

    return (
      <View
        ref={viewRef}
        style={[
          styles.gameArea,
          { width: gameAreaWidth, height: gameAreaHeight },
        ]}
        {...panResponder.panHandlers}
      >
        {balls.map((ball) => (
          <View
            key={ball.id}
            style={[
              styles.enemyBall,
              {
                left: ball.x - ball.radius,
                top: ball.y - ball.radius,
                width: ball.radius * 2,
                height: ball.radius * 2,
                borderRadius: ball.radius,
              },
            ]}
          />
        ))}
        <View
          style={[
            styles.playerBall,
            {
              left: player.x - PLAYER_RADIUS,
              top: player.y - PLAYER_RADIUS,
            },
          ]}
        />
      </View>
    );
  }
);

GameEngine.displayName = "GameEngine";

export default GameEngine;

const styles = StyleSheet.create({
  gameArea: {
    backgroundColor: Colors.gameArea,
    position: "relative",
    overflow: "hidden",
  },
  playerBall: {
    position: "absolute",
    width: PLAYER_RADIUS * 2,
    height: PLAYER_RADIUS * 2,
    borderRadius: PLAYER_RADIUS,
    backgroundColor: Colors.playerBall,
    elevation: 10,
  },
  enemyBall: {
    position: "absolute",
    backgroundColor: Colors.enemyBall,
    elevation: 4,
  },
});
