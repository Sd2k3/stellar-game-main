
import React, { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Shield, Info, ArrowLeft } from "lucide-react";
import ScreenpipeVerificationPanel from "@/components/screenpipe/ScreenpipeVerificationPanel";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { Link } from "react-router-dom";
import type { Achievement } from "@/components/blockchain/AchievementCard";

export default function AchievementVerificationPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const { isConnected, address, connectWallet } = useWalletConnection();
  
  useEffect(() => {
    // Load achievements from localStorage
    const savedAchievements = localStorage.getItem('stellar_achievements');
    if (savedAchievements) {
      try {
        setAchievements(JSON.parse(savedAchievements));
      } catch (e) {
        console.error("Error parsing saved achievements:", e);
      }
    }
  }, []);
  
  const handleVerificationComplete = (achievementId: string, verified: boolean) => {
    if (verified) {
      setAchievements(prevAchievements => {
        const newAchievements = prevAchievements.map(achievement => {
          if (achievement.id === achievementId) {
            return {
              ...achievement,
              verificationStatus: "verified" as const,
              timestamp: new Date().toISOString()
            };
          }
          return achievement;
        });
        
        // Save updated achievements to localStorage
        localStorage.setItem('stellar_achievements', JSON.stringify(newAchievements));
        return newAchievements;
      });
    }
  };

  return (
    <div className="min-h-screen space-gradient flex flex-col items-center py-8">
      <div className="container max-w-2xl mx-auto py-4 w-full">
        <Link to="/" className="text-white/70 flex items-center hover:text-white mb-4 transition">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Game
        </Link>
        
        <h2 className="text-3xl font-bold text-white mb-2 text-center flex items-center justify-center">
          <Shield className="h-6 w-6 mr-2 text-space-stellar-blue" />
          Achievement Verification
        </h2>
        
        <p className="mb-6 text-slate-300 text-center">
          Verify your game achievements on the blockchain using Screenpipe.
          <br />
          Screenpipe captures your screen to provide evidence of achievements.
        </p>
        
        {!isConnected && (
          <Alert className="mb-6 bg-yellow-500/10 border-yellow-500/30">
            <Info className="h-4 w-4 text-yellow-400" />
            <AlertTitle>Wallet Connection Required</AlertTitle>
            <AlertDescription className="text-white/70">
              Connect your blockchain wallet to verify achievements on-chain.
              <Button
                onClick={connectWallet}
                className="mt-2 bg-space-stellar-blue hover:bg-space-stellar-blue/80 text-white w-full"
              >
                Connect Wallet
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        <ScreenpipeVerificationPanel 
          achievements={achievements}
          walletAddress={isConnected ? address : null}
          onVerificationComplete={handleVerificationComplete}
        />
        
        <Alert className="bg-black/30 border border-space-stellar-blue text-white mt-6">
          <Info className="h-4 w-4 text-space-stellar-blue" />
          <AlertTitle>How Achievement Verification Works</AlertTitle>
          <AlertDescription className="text-slate-300">
            <ol className="list-decimal ml-5 space-y-1 mt-2">
              <li>Complete achievements in the game</li>
              <li>Install and run the Screenpipe application</li>
              <li>Select an achievement to verify</li>
              <li>Screenpipe scans your screen for evidence</li>
              <li>Achievement is verified and recorded on the blockchain</li>
            </ol>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
