
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

interface GameStatsProps {
  currentScore: number;
  highScore: number;
  gamesPlayed: number;
  tokensEarned: number;
  className?: string;
}

const GameStats: React.FC<GameStatsProps> = ({
  currentScore,
  highScore,
  gamesPlayed,
  tokensEarned,
  className,
}) => {
  const [prevScore, setPrevScore] = useState(currentScore);
  const [isIncreasing, setIsIncreasing] = useState(false);
  const [progressToNextAchievement, setProgressToNextAchievement] = useState(0);
  
  useEffect(() => {
    if (currentScore > prevScore) {
      setIsIncreasing(true);
      const timer = setTimeout(() => {
        setIsIncreasing(false);
      }, 1000);
      setPrevScore(currentScore);
      return () => clearTimeout(timer);
    }
  }, [currentScore, prevScore]);

  useEffect(() => {
    // Calculate progress towards next achievement
    if (currentScore < 100) {
      setProgressToNextAchievement(currentScore);
    } else if (currentScore < 200) {
      setProgressToNextAchievement((currentScore - 100) / (200 - 100) * 100);
    } else if (currentScore < 300) {
      setProgressToNextAchievement((currentScore - 200) / (300 - 200) * 100);
    } else if (currentScore < 500) {
      setProgressToNextAchievement((currentScore - 300) / (500 - 300) * 100);
    } else {
      setProgressToNextAchievement(100);
    }
  }, [currentScore]);

  const getNextAchievementText = () => {
    if (currentScore < 100) {
      return `Score ${100 - currentScore} more points for "Stellar Novice"`;
    } else if (currentScore < 200) {
      return `Score ${200 - currentScore} more points for "Cosmic Explorer"`;
    } else if (currentScore < 300) {
      return `Score ${300 - currentScore} more points for "Stellar Champion"`;
    } else if (currentScore < 500) {
      return `Score ${500 - currentScore} more points for "Astro Legend"`;
    } else {
      return "All score achievements unlocked!";
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Game Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-y-3 gap-x-6">
          <div>
            <div className="text-sm text-muted-foreground">Current Score</div>
            <div className={`text-xl font-bold ${isIncreasing ? "text-green-500" : ""}`}>
              {currentScore}
            </div>
          </div>
          
          <div>
            <div className="text-sm text-muted-foreground">High Score</div>
            <div className="text-xl font-bold">{highScore}</div>
          </div>
          
          <div>
            <div className="text-sm text-muted-foreground">Games Played</div>
            <div className="text-xl font-bold">{gamesPlayed}</div>
          </div>
          
          <div>
            <div className="text-sm text-muted-foreground">Tokens Earned</div>
            <div className="flex items-center gap-1">
              <svg className="h-4 w-4 text-space-nova-yellow" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" />
                <path fill="white" d="M12 6l1.5 4.5h4.5l-3.6 2.7 1.4 4.3-3.8-2.8-3.8 2.8 1.4-4.3-3.6-2.7h4.5z" />
              </svg>
              <span className="text-xl font-bold">{tokensEarned}</span>
            </div>
          </div>
        </div>
        
        <Separator className="my-3" />
        
        <div className="mt-3 space-y-2">
          <div className="text-sm text-muted-foreground">
            Next Achievement Progress
          </div>
          <Progress value={progressToNextAchievement} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {getNextAchievementText()}
          </p>
        </div>
        
        <div className="mt-3 text-sm">
          {currentScore >= 100 && currentScore < 200 && (
            <div className="flex items-center gap-2">
              <span className="block h-2 w-2 rounded-full bg-yellow-400 animate-pulse"></span>
              <span>Achievement "Stellar Novice" unlocked!</span>
            </div>
          )}
          
          {currentScore >= 200 && currentScore < 300 && (
            <div className="flex items-center gap-2">
              <span className="block h-2 w-2 rounded-full bg-yellow-400 animate-pulse"></span>
              <span>Achievement "Cosmic Explorer" unlocked!</span>
            </div>
          )}
          
          {currentScore >= 300 && currentScore < 500 && (
            <div className="flex items-center gap-2">
              <span className="block h-2 w-2 rounded-full bg-yellow-400 animate-pulse"></span>
              <span>Achievement "Stellar Champion" unlocked!</span>
            </div>
          )}
          
          {currentScore >= 500 && (
            <div className="flex items-center gap-2">
              <span className="block h-2 w-2 rounded-full bg-yellow-400 animate-pulse"></span>
              <span>Achievement "Astro Legend" unlocked!</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GameStats;
