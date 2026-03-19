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
  Text,
  View,
} from "react-native";
import Colors from "@/constants/colors";

const PLAYER_RADIUS = 18;
const ENEMY_RADIUS = 14;
const FPS_INTERVAL = 16;
const STAR_RADIUS = 20;
const SLOW_MULTIPLIER = 0.3;
const SLOW_DURATION_MS = 3000;
const STAR_BASE_INTERVAL_MS = 10000; // starts at 10s, gets faster as balls increase
const STAR_MIN_INTERVAL_MS = 2000;   // fastest possible: 2s
const STAR_LIFETIME_MS = 5000;       // star auto-expires after 5s if not collected
const BALL_SPAWN_INTERVAL_MS = 6000; // +2 balls every 6 seconds

interface Ball {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface Star {
  x: number;
  y: number;
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

function makeRandomBall(w: number, h: number): Ball {
  // Spawn from a random edge so ball enters from the sides
  const side = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
  let x: number;
  let y: number;
  const speed = Math.random() * 1.5 + 1.5;
  const angle = Math.random() * Math.PI * 2;
  const vx = Math.cos(angle) * speed;
  const vy = Math.sin(angle) * speed;

  switch (side) {
    case 0: x = Math.random() * w; y = ENEMY_RADIUS; break;
    case 1: x = w - ENEMY_RADIUS; y = Math.random() * h; break;
    case 2: x = Math.random() * w; y = h - ENEMY_RADIUS; break;
    default: x = ENEMY_RADIUS; y = Math.random() * h; break;
  }

  return { id: genId(), x, y, vx, vy, radius: ENEMY_RADIUS };
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

    // Powerup state
    const starRef = useRef<Star | null>(null);
    const slowActiveRef = useRef(false);
    const ballSpawnTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const slowTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Dynamic star timing (updated inside game loop)
    const lastStarSpawnRef = useRef<number>(0); // timestamp of last spawn attempt
    const starShownAtRef = useRef<number>(0);   // timestamp when current star appeared

    // View offset for Android coordinate fix
    const viewOffsetRef = useRef({ x: 0, y: 0 });
    const viewRef = useRef<View>(null);

    const [isReady, setIsReady] = useState(false);
    const [renderTick, setRenderTick] = useState(0);

    useEffect(() => { runningRef.current = running; }, [running]);
    useEffect(() => { gameAreaHeightRef.current = gameAreaHeight; }, [gameAreaHeight]);
    useEffect(() => { gameAreaWidthRef.current = gameAreaWidth; }, [gameAreaWidth]);

    // Spawn 2 new balls to progress difficulty
    const spawnTwoBalls = useCallback(() => {
      if (!runningRef.current) return;
      if (ballsRef.current.length >= 60) return;
      const w = gameAreaWidthRef.current;
      const h = gameAreaHeightRef.current;
      ballsRef.current = [
        ...ballsRef.current,
        makeRandomBall(w, h),
        makeRandomBall(w, h),
      ];
    }, []);

    // Activate slow powerup
    const activateSlow = useCallback(() => {
      slowActiveRef.current = true;
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      if (slowTimeoutRef.current) clearTimeout(slowTimeoutRef.current);
      slowTimeoutRef.current = setTimeout(() => {
        slowActiveRef.current = false;
        slowTimeoutRef.current = null;
      }, SLOW_DURATION_MS);
    }, []);

    const resetGame = useCallback(() => {
      const w = gameAreaWidthRef.current;
      const h = gameAreaHeightRef.current;

      playerRef.current = { x: w / 2, y: h / 2 };
      scoreRef.current = 0;
      starRef.current = null;
      slowActiveRef.current = false;
      lastStarSpawnRef.current = Date.now(); // start timer from now
      starShownAtRef.current = 0;

      if (slowTimeoutRef.current) { clearTimeout(slowTimeoutRef.current); slowTimeoutRef.current = null; }
      if (ballSpawnTimerRef.current) { clearInterval(ballSpawnTimerRef.current); ballSpawnTimerRef.current = null; }

      // Start with exactly 2 balls
      ballsRef.current = [makeRandomBall(w, h), makeRandomBall(w, h)];

      setIsReady(true);
      setRenderTick((t) => t + 1);
    }, []);

    useImperativeHandle(ref, () => ({ reset: resetGame }));

    useEffect(() => {
      resetGame();
    }, [resetGame]);

    // Ball progression timer: +2 balls every 6s → count: 2→4→6→8→...
    useEffect(() => {
      if (!isReady) return;

      ballSpawnTimerRef.current = setInterval(() => {
        if (runningRef.current) spawnTwoBalls();
      }, BALL_SPAWN_INTERVAL_MS);

      return () => {
        if (ballSpawnTimerRef.current) clearInterval(ballSpawnTimerRef.current);
      };
    }, [isReady, spawnTwoBalls]);

    // Measure view offset after mount (Android coordinate fix)
    useEffect(() => {
      const measureOffset = () => {
        if (viewRef.current) {
          viewRef.current.measure((_x, _y, _w, _h, pageX, pageY) => {
            viewOffsetRef.current = { x: pageX ?? 0, y: pageY ?? 0 };
          });
        }
      };
      const t = setTimeout(measureOffset, 100);
      return () => clearTimeout(t);
    }, [isReady, gameAreaWidth, gameAreaHeight]);

    // Game loop — pure bouncing, no random splits
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
        const speedMult = slowActiveRef.current ? SLOW_MULTIPLIER : 1.0;
        const newBalls: Ball[] = [];

        for (const ball of ballsRef.current) {
          let nx = ball.x + ball.vx * speedMult;
          let ny = ball.y + ball.vy * speedMult;
          let nvx = ball.vx;
          let nvy = ball.vy;

          // Wall bounce — no splitting, equal size maintained
          if (nx - ball.radius <= 0) { nx = ball.radius; nvx = Math.abs(nvx); }
          else if (nx + ball.radius >= w) { nx = w - ball.radius; nvx = -Math.abs(nvx); }

          if (ny - ball.radius <= 0) { ny = ball.radius; nvy = Math.abs(nvy); }
          else if (ny + ball.radius >= h) { ny = h - ball.radius; nvy = -Math.abs(nvy); }

          newBalls.push({ ...ball, x: nx, y: ny, vx: nvx, vy: nvy });
        }

        ballsRef.current = newBalls;
        onBallCountUpdate(ballsRef.current.length);

        // Player vs enemy collision
        for (const ball of ballsRef.current) {
          const dx = player.x - ball.x;
          const dy = player.y - ball.y;
          if (Math.sqrt(dx * dx + dy * dy) < PLAYER_RADIUS + ball.radius - 4) {
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            }
            onGameOver(scoreRef.current);
            return;
          }
        }

        // Dynamic star spawn logic
        const now = Date.now();
        if (starRef.current) {
          // Check player vs star collision
          const star = starRef.current;
          const dx = player.x - star.x;
          const dy = player.y - star.y;
          if (Math.sqrt(dx * dx + dy * dy) < PLAYER_RADIUS + STAR_RADIUS) {
            starRef.current = null;
            lastStarSpawnRef.current = now; // reset timer after collection
            activateSlow();
          } else if (now - starShownAtRef.current > STAR_LIFETIME_MS) {
            // Star expired without being collected — remove and reset timer
            starRef.current = null;
            lastStarSpawnRef.current = now;
          }
        } else {
          // Calculate dynamic interval: faster as more balls are on screen
          // 2 balls → 10s, 6 balls → 8s, 10 balls → 6s, 16 balls → 3s, 20+ → 2s
          const ballCount = ballsRef.current.length;
          const dynamicInterval = Math.max(
            STAR_MIN_INTERVAL_MS,
            STAR_BASE_INTERVAL_MS - (ballCount - 2) * 400
          );
          if (now - lastStarSpawnRef.current >= dynamicInterval) {
            const sw = gameAreaWidthRef.current;
            const sh = gameAreaHeightRef.current;
            const margin = STAR_RADIUS + 20;
            starRef.current = {
              x: margin + Math.random() * (sw - margin * 2),
              y: margin + Math.random() * (sh - margin * 2),
            };
            starShownAtRef.current = now;
          }
        }

        setRenderTick((t) => t + 1);
      };

      tickRef.current = setInterval(tick, FPS_INTERVAL);
      return () => {
        if (tickRef.current) clearInterval(tickRef.current);
      };
    }, [onScoreUpdate, onGameOver, onBallCountUpdate, activateSlow]);

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
          playerRef.current = toLocal(e.nativeEvent.pageX, e.nativeEvent.pageY);
        },
        onPanResponderMove: (e) => {
          if (!runningRef.current) return;
          playerRef.current = toLocal(e.nativeEvent.pageX, e.nativeEvent.pageY);
        },
      })
    ).current;

    if (!isReady) return null;

    const player = playerRef.current;
    const balls = ballsRef.current;
    const star = starRef.current;
    const isSlow = slowActiveRef.current;

    return (
      <View
        ref={viewRef}
        style={[styles.gameArea, { width: gameAreaWidth, height: gameAreaHeight }]}
        {...panResponder.panHandlers}
      >
        {balls.map((ball) => (
          <View
            key={ball.id}
            style={[
              styles.enemyBall,
              isSlow && styles.enemyBallSlow,
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

        {star && (
          <View
            style={[
              styles.starContainer,
              {
                left: star.x - STAR_RADIUS,
                top: star.y - STAR_RADIUS,
                width: STAR_RADIUS * 2,
                height: STAR_RADIUS * 2,
              },
            ]}
          >
            <Text style={styles.starText}>★</Text>
          </View>
        )}

        <View
          style={[
            styles.playerBall,
            { left: player.x - PLAYER_RADIUS, top: player.y - PLAYER_RADIUS },
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
  enemyBallSlow: {
    backgroundColor: "#aab0cc",
    opacity: 0.8,
  },
  starContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  starText: {
    fontSize: 34,
    color: "#FFD700",
  },
});
