import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const HIGH_SCORE_KEY = "@red_ball_escape_high_score";

type GameState = "menu" | "playing" | "paused" | "gameover";

interface GameContextValue {
  gameState: GameState;
  score: number;
  highScore: number;
  isNewHighScore: boolean;
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  endGame: (finalScore: number) => void;
  backToMenu: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [gameState, setGameState] = useState<GameState>("menu");
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const scoreRef = useRef(0);

  useEffect(() => {
    AsyncStorage.getItem(HIGH_SCORE_KEY).then((val) => {
      if (val) setHighScore(parseInt(val, 10));
    });
  }, []);

  const startGame = useCallback(() => {
    setScore(0);
    scoreRef.current = 0;
    setIsNewHighScore(false);
    setGameState("playing");
  }, []);

  const pauseGame = useCallback(() => {
    setGameState("paused");
  }, []);

  const resumeGame = useCallback(() => {
    setGameState("playing");
  }, []);

  const endGame = useCallback(
    async (finalScore: number) => {
      setScore(finalScore);
      let newHigh = false;
      if (finalScore > highScore) {
        setHighScore(finalScore);
        setIsNewHighScore(true);
        newHigh = true;
        await AsyncStorage.setItem(HIGH_SCORE_KEY, finalScore.toString());
      }
      setGameState("gameover");
    },
    [highScore]
  );

  const backToMenu = useCallback(() => {
    setIsNewHighScore(false);
    setGameState("menu");
  }, []);

  return (
    <GameContext.Provider
      value={{
        gameState,
        score,
        highScore,
        isNewHighScore,
        startGame,
        pauseGame,
        resumeGame,
        endGame,
        backToMenu,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
