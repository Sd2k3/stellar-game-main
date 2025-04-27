
import React, { useEffect, useRef, useState } from "react";
import Ship from "./Ship";
import Asteroid from "./Asteroid";
import Token from "./Token";
import { cn } from "@/lib/utils";

interface GameCanvasProps {
  onScoreUpdate: (score: number) => void;
  onGameOver: (finalScore: number) => void;
  onNameRequired?: (finalScore: number) => void;
  className?: string;
}

const GameCanvas: React.FC<GameCanvasProps> = ({
  onScoreUpdate,
  onGameOver,
  onNameRequired,
  className,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [shipPosition, setShipPosition] = useState({ x: 0, y: 0 });
  const [shipRotation, setShipRotation] = useState(0);
  const [asteroids, setAsteroids] = useState<Array<{
    id: number;
    position: { x: number; y: number };
    rotation: number;
    size: number;
    type: "small" | "medium" | "large";
    speed: number;
  }>>([]);
  const [tokens, setTokens] = useState<Array<{
    id: number;
    position: { x: number; y: number };
    collected: boolean;
    value: number;
  }>>([]);
  const [score, setScore] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [difficulty, setDifficulty] = useState(1);
  const [showCollision, setShowCollision] = useState(false);
  const [tokensCollectedThisRun, setTokensCollectedThisRun] = useState(0);
  
  const gameLoopRef = useRef<number | null>(null);
  const keysPressed = useRef<Set<string>>(new Set());
  const lastTokenTime = useRef<number>(0);
  const lastAsteroidTime = useRef<number>(0);
  const frameCount = useRef<number>(0);

  useEffect(() => {
    if (canvasRef.current) {
      const { width, height } = canvasRef.current.getBoundingClientRect();
      setCanvasSize({ width, height });
      setShipPosition({ x: width / 2, y: height - 100 });
    }
    
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key);
      if (e.key === " " && !isActive && !gameOver) {
        setIsActive(true);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key);
    };
    
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [isActive, gameOver]);

  const resetGame = () => {
    setShipPosition({ x: canvasSize.width / 2, y: canvasSize.height - 100 });
    setShipRotation(0);
    setAsteroids([]);
    setTokens([]);
    setScore(0);
    setGameOver(false);
    setIsActive(false);
    setDifficulty(1);
    setTokensCollectedThisRun(0);
    frameCount.current = 0;
    lastTokenTime.current = 0;
    lastAsteroidTime.current = 0;
  };

  // Increase difficulty as the game progresses
  useEffect(() => {
    if (score > 0) {
      const newDifficulty = 1 + Math.floor(score / 100) * 0.25;
      setDifficulty(newDifficulty);
    }
  }, [score]);

  useEffect(() => {
    if (!isActive || gameOver) {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      return;
    }

    const gameLoop = () => {
      const shipSpeed = 6; // Base ship speed
      
      if (keysPressed.current.has("ArrowLeft")) {
        setShipPosition(prev => ({
          ...prev,
          x: Math.max(20, prev.x - shipSpeed)
        }));
        setShipRotation(-15);
      } else if (keysPressed.current.has("ArrowRight")) {
        setShipPosition(prev => ({
          ...prev,
          x: Math.min(canvasSize.width - 20, prev.x + shipSpeed)
        }));
        setShipRotation(15);
      } else {
        setShipRotation(0);
      }

      // Spawn asteroids based on difficulty
      const asteroidSpawnInterval = Math.max(60 - difficulty * 10, 20);
      if (frameCount.current - lastAsteroidTime.current > asteroidSpawnInterval) {
        lastAsteroidTime.current = frameCount.current;
        
        // Randomize asteroid types based on difficulty
        let typeChance = Math.random();
        let type: "small" | "medium" | "large";
        
        if (difficulty > 2.5) {
          // Higher chance for large asteroids at high difficulty
          type = typeChance < 0.5 ? "large" : typeChance < 0.8 ? "medium" : "small";
        } else if (difficulty > 1.5) {
          // More medium asteroids at medium difficulty
          type = typeChance < 0.3 ? "large" : typeChance < 0.7 ? "medium" : "small";
        } else {
          // More small asteroids at low difficulty
          type = typeChance < 0.2 ? "large" : typeChance < 0.5 ? "medium" : "small";
        }
        
        const size = type === "large" ? 60 : type === "medium" ? 40 : 25;
        const speed = (Math.random() * 1.5 + 1) * difficulty;
        
        const newAsteroid = {
          id: Date.now(),
          position: { 
            x: Math.random() * (canvasSize.width - size), 
            y: -50 
          },
          rotation: Math.random() * 360,
          size,
          type,
          speed
        };
        
        setAsteroids(prev => [...prev, newAsteroid]);
      }
      
      // Spawn tokens
      const tokenSpawnInterval = Math.max(120 - difficulty * 5, 80);
      if (frameCount.current - lastTokenTime.current > tokenSpawnInterval) {
        lastTokenTime.current = frameCount.current;
        
        // Rare chance for special tokens (worth more points)
        const isSpecial = Math.random() < 0.1;
        const tokenValue = isSpecial ? 3 : 1;
        
        const newToken = {
          id: Date.now(),
          position: { 
            x: Math.random() * (canvasSize.width - 30), 
            y: -30 
          },
          collected: false,
          value: tokenValue
        };
        
        setTokens(prev => [...prev, newToken]);
      }

      // Update asteroid positions
      setAsteroids(prev => 
        prev
          .map(asteroid => ({
            ...asteroid,
            position: {
              ...asteroid.position,
              y: asteroid.position.y + asteroid.speed
            },
            rotation: asteroid.rotation + 0.5
          } as typeof asteroid))
          .filter(asteroid => asteroid.position.y < canvasSize.height + 50)
      );

      // Update token positions
      setTokens(prev => 
        prev
          .map(token => ({
            ...token,
            position: {
              ...token.position,
              y: token.position.y + 1.5
            }
          }))
          .filter(token => token.position.y < canvasSize.height + 30)
      );

      const shipRadius = 18; // Slightly reduced ship hitbox for more forgiving collisions
      
      // Token collection logic with improved collision detection
      setTokens(prev => 
        prev.map(token => {
          const dx = token.position.x - shipPosition.x;
          const dy = token.position.y - shipPosition.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (!token.collected && distance < shipRadius + 15) {
            const pointsToAdd = token.value * 10;
            setScore(s => s + pointsToAdd);
            setTokensCollectedThisRun(prev => prev + token.value);
            return { ...token, collected: true };
          }
          return token;
        })
      );
      
      // Improved collision detection with asteroids
      let collision = false;
      asteroids.forEach(asteroid => {
        const dx = asteroid.position.x - shipPosition.x;
        const dy = asteroid.position.y - shipPosition.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Adjust collision threshold based on asteroid size
        // Making it slightly more forgiving than the visual size
        const collisionThreshold = shipRadius + asteroid.size / 2 - 12;
        
        if (distance < collisionThreshold) {
          collision = true;
        }
      });
      
      if (collision && !gameOver) {
        setShowCollision(true);
        setTimeout(() => setShowCollision(false), 500);
        setGameOver(true);
        setIsActive(false);
        onGameOver(score);
      }
      
      onScoreUpdate(score);
      frameCount.current++;
      
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [isActive, gameOver, canvasSize, shipPosition, asteroids, tokens, score, difficulty, onScoreUpdate, onGameOver]);

  useEffect(() => {
    if (gameOver) {
      if (onNameRequired) {
        onNameRequired(score);
      } else {
        onGameOver(score);
      }
    }
    // eslint-disable-next-line
  }, [gameOver]);

  return (
    <div 
      ref={canvasRef} 
      className={cn(
        "relative overflow-hidden rounded-lg space-gradient star-field", 
        className
      )}
      style={{ height: "600px", cursor: "default" }}
    >
      <Ship position={shipPosition} rotation={shipRotation} />
      
      {asteroids.map(asteroid => (
        <Asteroid 
          key={asteroid.id}
          position={asteroid.position}
          rotation={asteroid.rotation}
          size={asteroid.size}
          type={asteroid.type}
        />
      ))}
      
      {tokens.map(token => (
        <Token 
          key={token.id}
          position={token.position}
          collected={token.collected}
          special={token.value > 1}
        />
      ))}
      
      {showCollision && (
        <div className="absolute inset-0 bg-red-500 opacity-30 z-40 animate-pulse"></div>
      )}
      
      {!isActive && !gameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 z-50">
          <h2 className="text-white text-3xl mb-4 font-bold">Stellar Arcade</h2>
          <p className="text-white mb-6">Press SPACE to start</p>
          <div className="space-y-4 text-center">
            <p className="text-white text-sm">
              Use LEFT and RIGHT arrow keys to move your ship
            </p>
            <p className="text-white text-sm">
              Collect tokens and avoid asteroids
            </p>
            <p className="text-yellow-300 text-sm animate-pulse">
              Look out for special golden tokens - they're worth more!
            </p>
          </div>
        </div>
      )}
      
      {gameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 z-50">
          <h2 className="text-red-500 text-3xl mb-4">Game Over</h2>
          <p className="text-white text-xl mb-2">Final Score: {score}</p>
          <p className="text-space-nova-yellow text-lg mb-4">
            Tokens Collected: {tokensCollectedThisRun}
          </p>
          <button
            onClick={resetGame}
            className="mt-6 px-5 py-2.5 bg-space-stellar-blue hover:bg-blue-600 text-white rounded transition-colors"
          >
            Play Again
          </button>
        </div>
      )}
      
      {isActive && (
        <div className="absolute top-4 right-4 bg-black bg-opacity-40 px-3 py-1 rounded text-white">
          <div className="flex items-center gap-2">
            <span className="text-xs">SCORE:</span>
            <span className="text-xl font-bold">{score}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs">LEVEL:</span>
            <span className="text-sm font-bold">{Math.floor(difficulty)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameCanvas;
