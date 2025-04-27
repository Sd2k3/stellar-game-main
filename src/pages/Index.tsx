import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, RocketIcon, TrophyIcon, BarChart3Icon, WalletIcon, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import GameCanvas from "@/components/game/GameCanvas";
import TokenBalance from "@/components/blockchain/TokenBalance";
import AchievementCard, { Achievement } from "@/components/blockchain/AchievementCard";
import Leaderboard from "@/components/blockchain/Leaderboard";
import GameStats from "@/components/game/GameStats";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { 
  createBlockchainTransaction, 
  recordAchievementOnChain, 
  upsertPlayerTokenBalance, 
  getPlayerTokenBalance 
} from "@/integrations/supabase/blockchainApi";
import BlockchainSelector from "@/components/blockchain/BlockchainSelector";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import NameDialog from "@/components/game/NameDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Tables } from "@/integrations/supabase/types";

const STORAGE_KEYS = {
  HIGH_SCORE: 'stellar_high_score',
  GAMES_PLAYED: 'stellar_games_played',
  TOKENS_EARNED: 'stellar_tokens_earned',
  PENDING_TOKENS: 'stellar_pending_tokens',
  ACHIEVEMENTS: 'stellar_achievements',
  PLAYER_NAME: 'stellar_player_name'
};

const Index = () => {
  const [currentScore, setCurrentScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [tokensEarned, setTokensEarned] = useState(0);
  const [pendingTokens, setPendingTokens] = useState(0);
  const [blockchain, setBlockchain] = useState<"ethereum" | "polygon">("ethereum");
  const [leaderboardEntries, setLeaderboardEntries] = useState<any[]>([]);
  const { toast } = useToast();
  const [playerName, setPlayerName] = useState("");
  const [shouldShowNameDialog, setShouldShowNameDialog] = useState(false);
  const [pendingFinalScore, setPendingFinalScore] = useState<number | null>(null);

  const { 
    isConnected, 
    isConnecting, 
    address, 
    connectWallet, 
    disconnectWallet 
  } = useWalletConnection();

  const blockchainLabel =
    blockchain === "ethereum"
      ? "Ethereum (Goerli Testnet)"
      : "Polygon (Mumbai Testnet)";

  useEffect(() => {
    const savedHighScore = localStorage.getItem(STORAGE_KEYS.HIGH_SCORE);
    const savedGamesPlayed = localStorage.getItem(STORAGE_KEYS.GAMES_PLAYED);
    const savedTokensEarned = localStorage.getItem(STORAGE_KEYS.TOKENS_EARNED);
    const savedPendingTokens = localStorage.getItem(STORAGE_KEYS.PENDING_TOKENS);
    const savedAchievements = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
    const savedPlayerName = localStorage.getItem(STORAGE_KEYS.PLAYER_NAME);

    if (savedHighScore) setHighScore(parseInt(savedHighScore));
    if (savedGamesPlayed) setGamesPlayed(parseInt(savedGamesPlayed));
    if (savedTokensEarned) setTokensEarned(parseInt(savedTokensEarned));
    if (savedPendingTokens) setPendingTokens(parseInt(savedPendingTokens));
    if (savedPlayerName) setPlayerName(savedPlayerName);
    
    if (savedAchievements) {
      try {
        const parsedAchievements = JSON.parse(savedAchievements);
        setAchievements(parsedAchievements);
      } catch (e) {
        console.error("Error parsing saved achievements:", e);
      }
    }
  }, []);

  useEffect(() => {
    if (isConnected && address) {
      getPlayerTokenBalance(address).then(balanceRow => {
        if (balanceRow) {
          setTokensEarned(prev => {
            const newValue = balanceRow.balance;
            localStorage.setItem(STORAGE_KEYS.TOKENS_EARNED, newValue.toString());
            return newValue;
          });
          setPendingTokens(prev => {
            const newValue = balanceRow.pending_balance;
            localStorage.setItem(STORAGE_KEYS.PENDING_TOKENS, newValue.toString());
            return newValue;
          });
        }
      }).catch(console.error);
    }
  }, [isConnected, address]);

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  const fetchLeaderboardData = async () => {
    try {
      const { data: scores, error } = await supabase
        .from("game_scores")
        .select("*")
        .order("score", { ascending: false })
        .limit(5) as {
          data: Tables<"game_scores">[] | null;
          error: any;
        };

      if (error) {
        console.error("Error fetching leaderboard:", error);
        toast({
          variant: "destructive",
          title: "Error fetching leaderboard",
          description: error.message,
        });
        return;
      }

      if (scores && Array.isArray(scores) && scores.length > 0) {
        const formattedEntries = scores.map((score: Tables<"game_scores">, index: number) => ({
          id: score.id,
          rank: index + 1,
          username: score.player_name?.trim() !== '' 
                    ? score.player_name 
                    : (score.wallet_address ? score.wallet_address.slice(0, 6) + "..." : "Player"),
          score: score.score,
          tokens: Math.floor(score.score / 10),
        }));
        setLeaderboardEntries(formattedEntries);
      }
    } catch (err) {
      console.error("Leaderboard fetch error:", err);
    }
  };

  const handleGameCanvasNameRequired = (finalScore: number) => {
    setPendingFinalScore(finalScore);
    setShouldShowNameDialog(true);
  };

  const handleNameDialogSubmit = async (enteredName: string) => {
    setPlayerName(prev => {
      const newName = enteredName;
      localStorage.setItem(STORAGE_KEYS.PLAYER_NAME, newName);
      return newName;
    });
    setShouldShowNameDialog(false);

    if (pendingFinalScore !== null) {
      await saveScore(pendingFinalScore, enteredName);
      setPendingFinalScore(null);
    }
  };

  const saveScore = async (finalScore: number, name: string | null) => {
    setGamesPlayed(prev => {
      const newValue = prev + 1;
      localStorage.setItem(STORAGE_KEYS.GAMES_PLAYED, newValue.toString());
      return newValue;
    });
    
    if (finalScore > highScore) {
      setHighScore(prev => {
        const newValue = finalScore;
        localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, newValue.toString());
        return newValue;
      });
    }

    const newTokens = Math.floor(finalScore / 10);
    setPendingTokens(prev => {
      const newValue = prev + newTokens;
      localStorage.setItem(STORAGE_KEYS.PENDING_TOKENS, newValue.toString());
      return newValue;
    });

    try {
      const walletAddr = isConnected && address ? address : (name || "guest-player");

      const { error } = await supabase
        .from("game_scores")
        .insert([
          {
            wallet_address: walletAddr,
            score: finalScore,
            player_name: name || null,
          }
        ]);

      if (error) {
        console.error("Error saving game score:", error);
        toast({
          variant: "destructive",
          title: "Error saving score",
          description: error.message,
        });
      } else {
        toast({
          title: "Score saved",
          description: `Your score of ${finalScore} has been recorded.`,
        });
        fetchLeaderboardData();
      }

      if (isConnected && address && newTokens > 0) {
        try {
          const tx = await createBlockchainTransaction({
            walletAddress: address,
            type: "earn_token",
            amount: newTokens,
          });

          await upsertPlayerTokenBalance({
            walletAddress: address,
            amount: tokensEarned,
            pendingAmount: pendingTokens + newTokens
          });

        } catch (err) {
          console.error("Blockchain tx error", err);
        }
      }
    } catch (err) {
      console.error("Error in handleGameOver:", err);
    }

    setTimeout(async () => {
      setTokensEarned(prev => {
        const newValue = prev + newTokens;
        localStorage.setItem(STORAGE_KEYS.TOKENS_EARNED, newValue.toString());
        return newValue;
      });
      
      setPendingTokens(prev => {
        const newValue = prev - newTokens;
        localStorage.setItem(STORAGE_KEYS.PENDING_TOKENS, newValue.toString());
        return newValue;
      });

      if (isConnected && address && newTokens > 0) {
        await upsertPlayerTokenBalance({
          walletAddress: address,
          amount: tokensEarned + newTokens,
          pendingAmount: pendingTokens - newTokens
        });
      }
    }, 5000);
  };

  const handleGameOver = (finalScore: number) => {
    if (!isConnected) {
      setPendingFinalScore(finalScore);
      setShouldShowNameDialog(true);
      return;
    }

    saveScore(finalScore, null);
  };

  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: "1",
      title: "Stellar Novice",
      description: "Score 100 points in a single game",
      rewardAmount: 5,
      completed: false,
      verificationStatus: "pending"
    },
    {
      id: "2",
      title: "Cosmic Explorer",
      description: "Score 200 points in a single game",
      rewardAmount: 10,
      completed: false,
      verificationStatus: "pending"
    },
    {
      id: "10",
      title: "Stellar Champion",
      description: "Score 300 points in a single game",
      rewardAmount: 25,
      completed: false,
      verificationStatus: "pending"
    },
    {
      id: "11",
      title: "Astro Legend",
      description: "Score 500 points in a single game",
      rewardAmount: 50,
      completed: false,
      verificationStatus: "pending"
    },
    {
      id: "3",
      title: "Token Collector",
      description: "Collect 50 tokens in total",
      rewardAmount: 15,
      completed: false,
      verificationStatus: "pending"
    },
    {
      id: "4",
      title: "Token Hoarder",
      description: "Collect 100 tokens in total",
      rewardAmount: 30,
      completed: false,
      verificationStatus: "pending"
    },
    {
      id: "5",
      title: "Frequent Flyer",
      description: "Play 10 games",
      rewardAmount: 10,
      completed: false,
      verificationStatus: "pending"
    },
    {
      id: "6",
      title: "Unbreakable",
      description: "Collect 20 tokens in a game without hitting an asteroid",
      rewardAmount: 20,
      completed: false,
      verificationStatus: "pending"
    },
  ]);

  useEffect(() => {
    let updatedAchievements = [...achievements];
    let changed = false;
    let achievementToRecord = null;

    const checkAndUpdateAchievement = async (achievement: Achievement, condition: boolean) => {
      if (condition && !achievement.completed) {
        achievement.completed = true;
        achievement.timestamp = new Date().toISOString();
        achievement.verificationStatus = "pending";
        changed = true;
        achievementToRecord = achievement;
      }
    };

    checkAndUpdateAchievement(updatedAchievements[0], currentScore >= 100);
    checkAndUpdateAchievement(updatedAchievements[1], currentScore >= 200);
    checkAndUpdateAchievement(updatedAchievements[2], currentScore >= 300);
    checkAndUpdateAchievement(updatedAchievements[3], currentScore >= 500);
    checkAndUpdateAchievement(updatedAchievements[4], tokensEarned >= 50);
    checkAndUpdateAchievement(updatedAchievements[5], tokensEarned >= 100);
    checkAndUpdateAchievement(updatedAchievements[6], gamesPlayed >= 10);

    const sessionTokensCollected = Math.floor(currentScore / 10);
    checkAndUpdateAchievement(updatedAchievements[7], sessionTokensCollected >= 20);

    if (changed) {
      setAchievements(prev => {
        localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(updatedAchievements));
        return updatedAchievements;
      });

      if (isConnected && address && achievementToRecord) {
        recordAchievementOnChain({
          walletAddress: address,
          achievementId: achievementToRecord.id,
          achievementTitle: achievementToRecord.title,
          contractAddress: blockchain === "ethereum" 
            ? "0x123..." // Replace with actual contract address
            : "0x456..."  // Replace with actual contract address
        }).then(result => {
          if (result && result.success) {
            toast({
              title: "Achievement Recorded",
              description: `${achievementToRecord.title} has been recorded on the blockchain!`,
            });
          }
        }).catch(error => {
          console.error("Error recording achievement:", error);
          toast({
            variant: "destructive",
            title: "Recording Failed",
            description: "Could not record achievement on the blockchain.",
          });
        });
      }
    }
  }, [currentScore, tokensEarned, gamesPlayed, achievements, isConnected, address, blockchain, toast]);

  return (
    <div className="min-h-screen space-gradient">
      <div className="container mx-auto py-8">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 text-white tracking-tight">Stellar Screenplay Arena</h1>
          <p className="text-lg text-slate-300">Play, earn Stellar tokens, and climb the leaderboard!</p>
          <div className="flex justify-center gap-3 mt-3">
            <Link
              to="/screenpipe"
              className="inline-block px-6 py-2 text-white bg-space-stellar-blue/90 hover:bg-space-stellar-blue transition rounded shadow font-semibold"
            >
              🔍 Screenpipe Activity
            </Link>
            <Link
              to="/verify"
              className="inline-block px-6 py-2 text-white bg-space-cosmic-purple/90 hover:bg-space-cosmic-purple transition rounded shadow font-semibold"
            >
              <Shield className="inline-block h-4 w-4 mr-1" /> Verify Achievements
            </Link>
          </div>
        </header>
        
        <div className="mb-4 flex items-center justify-end gap-3">
          <BlockchainSelector
            value={blockchain}
            onChange={val => setBlockchain(val as "ethereum" | "polygon")}
          />
          <span className="ml-4 px-3 py-1 rounded-full bg-space-stellar-blue/70 text-white text-xs font-semibold">
            Network: {blockchainLabel}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <GameCanvas 
              onScoreUpdate={setCurrentScore}
              onGameOver={handleGameOver}
              onNameRequired={handleGameCanvasNameRequired}
              className="h-[600px] mb-4 shadow-xl shadow-space-cosmic-purple/20"
            />
            
            <Alert className="mt-4 bg-black/30 border border-space-stellar-blue text-white">
              <InfoIcon className="h-4 w-4 text-space-stellar-blue" />
              <AlertTitle>Game Controls</AlertTitle>
              <AlertDescription className="text-slate-300">
                Use LEFT and RIGHT arrow keys to move your ship. Collect Stellar tokens and avoid asteroids!
              </AlertDescription>
            </Alert>
          </div>
          
          <div className="flex flex-col gap-4">
            <TokenBalance 
              balance={tokensEarned}
              pendingBalance={pendingTokens}
              className="border border-space-stellar-blue bg-black/30 text-white"
            />
            
            <GameStats 
              currentScore={currentScore}
              highScore={highScore}
              gamesPlayed={gamesPlayed}
              tokensEarned={tokensEarned}
              className="border border-space-stellar-blue bg-black/30 text-white"
            />
            
            <Tabs defaultValue="achievements" className="w-full">
              <TabsList className="w-full bg-black/50 border border-space-stellar-blue">
                <TabsTrigger value="achievements" className="data-[state=active]:bg-space-stellar-blue/20">
                  <TrophyIcon className="h-4 w-4 mr-2" />
                  Achievements
                </TabsTrigger>
                <TabsTrigger value="leaderboard" className="data-[state=active]:bg-space-stellar-blue/20">
                  <BarChart3Icon className="h-4 w-4 mr-2" />
                  Leaderboard
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="achievements" className="mt-2">
                <div className="border border-space-stellar-blue bg-black/30 rounded-md p-3">
                  <ScrollArea className="h-[350px] pr-3" style={{ position: "relative" }}>
                    <div className="flex flex-col gap-3 pr-2">
                      {achievements.map(achievement => (
                        <AchievementCard 
                          key={achievement.id} 
                          achievement={achievement}
                          className="border border-space-stellar-blue bg-black/30 text-white"
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>
              
              <TabsContent value="leaderboard" className="mt-2">
                <div className="border border-space-stellar-blue bg-black/30 rounded-md p-3">
                  <ScrollArea className="h-[350px] pr-3" style={{ position: "relative" }}>
                    <Leaderboard 
                      entries={leaderboardEntries}
                      className="text-white"
                    />
                  </ScrollArea>
                </div>
              </TabsContent>
            </Tabs>
            
            <Button 
              className="mt-2" 
              variant={isConnected ? "outline" : "default"} 
              onClick={isConnected ? disconnectWallet : connectWallet}
              disabled={isConnecting}
            >
              <WalletIcon className="h-4 w-4 mr-2" />
              {isConnecting ? "Connecting..." : 
               isConnected ? `Connected: ${address}` : 
               "Connect Blockchain Wallet"}
            </Button>
            {isConnected && (
              <div className="mt-2 flex items-center gap-2 text-xs text-white">
                <span className="px-2 py-1 rounded bg-space-cosmic-purple/70">
                  On {blockchainLabel}
                </span>
              </div>
            )}
          </div>
        </div>

        <NameDialog
          open={shouldShowNameDialog}
          onSubmit={handleNameDialogSubmit}
        />
        
        <footer className="mt-10 text-center text-slate-400 text-sm">
          <p>Achievements tracked on Monad blockchain and verified via Screenpipe.</p>
          <p className="mt-1">©2025 Stellar Screenplay Arena</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
