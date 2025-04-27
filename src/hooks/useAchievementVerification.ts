
import { useState, useEffect } from "react";
import { pipe } from "@screenpipe/browser";
import { useToast } from "./use-toast";
import type { Achievement } from "@/components/blockchain/AchievementCard";
import { verifyAchievementWithContract } from "@/integrations/supabase/blockchainApi";

export function useAchievementVerification() {
  const [verifying, setVerifying] = useState(false);
  const [recentScreenpipeData, setRecentScreenpipeData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch recent Screenpipe data that could be used for verification
  const fetchScreenpipeData = async () => {
    setVerifying(true);
    setError(null);
    
    try {
      // Check if Screenpipe is available
      if (!pipe || typeof pipe.queryScreenpipe !== 'function') {
        throw new Error("Screenpipe is not properly initialized");
      }

      const since = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // Last hour
      
      const results = await pipe.queryScreenpipe({
        startTime: since,
        limit: 50,
        contentType: "all"
      });
      
      if (results && results.data) {
        setRecentScreenpipeData(results.data);
      }
      
      return results?.data || [];
    } catch (e) {
      console.error("Screenpipe error:", e);
      setError(`Failed to fetch Screenpipe data: ${(e as any)?.message || String(e)}`);
      return [];
    } finally {
      setVerifying(false);
    }
  };

  // Verify a specific achievement using Screenpipe data
  const verifyAchievement = async (
    achievement: Achievement, 
    walletAddress: string | null,
    contractAddress?: string 
  ): Promise<boolean> => {
    if (!walletAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to verify achievements",
        variant: "destructive"
      });
      return false;
    }

    setVerifying(true);
    
    try {
      // Get fresh Screenpipe data
      const screenData = await fetchScreenpipeData();
      
      // Search for achievement evidence in screen data
      let found = false;
      const relevantKeywords = extractAchievementKeywords(achievement);
      
      // Check OCR data for evidence
      for (const item of screenData) {
        if (item.type === "OCR" && item.content?.text) {
          const text = item.content.text.toLowerCase();
          
          // Look for achievement-related keywords in the screen text
          const matchesKeywords = relevantKeywords.some(keyword => 
            text.includes(keyword.toLowerCase())
          );
          
          if (matchesKeywords) {
            // Look for score evidence if achievement is score-based
            if (achievement.title.includes("Score") || achievement.description.includes("score")) {
              const scoreMatch = text.match(/score[:\s]*(\d+)/i);
              if (scoreMatch && parseInt(scoreMatch[1]) >= getRequiredScore(achievement)) {
                found = true;
                break;
              }
            } else {
              // For non-score achievements
              found = true;
              break;
            }
          }
        }
      }
      
      if (found) {
        // Record the achievement on the blockchain
        const result = await verifyAchievementWithContract({
          walletAddress,
          achievementId: achievement.id,
          contractAddress: contractAddress || "0x123..." // Use default or provided address
        });
        
        if (result && result.verified) {
          toast({
            title: "Achievement Verified!",
            description: `Your "${achievement.title}" achievement has been verified on-chain.`,
          });
          return true;
        }
      } else {
        toast({
          title: "Achievement Verification Failed",
          description: "No on-screen evidence found for this achievement. Try playing the game again.",
          variant: "destructive"
        });
      }
      
      return false;
    } catch (e) {
      console.error("Achievement verification error:", e);
      toast({
        title: "Verification Error",
        description: `Error verifying achievement: ${(e as any)?.message || String(e)}`,
        variant: "destructive"
      });
      return false;
    } finally {
      setVerifying(false);
    }
  };
  
  // Helper functions for achievement verification
  const extractAchievementKeywords = (achievement: Achievement): string[] => {
    const baseKeywords = ["achievement", "complete", "stellar", achievement.title];
    
    // Add score-specific keywords
    if (achievement.title.includes("Score") || achievement.description.includes("score")) {
      const scoreMatch = achievement.description.match(/score\s+(\d+)/i);
      if (scoreMatch) {
        baseKeywords.push(scoreMatch[1]);
      }
    }
    
    // Add token-specific keywords
    if (achievement.title.includes("Token") || achievement.description.includes("token")) {
      baseKeywords.push("token", "collect");
    }
    
    return baseKeywords;
  };
  
  const getRequiredScore = (achievement: Achievement): number => {
    const scoreMatch = achievement.description.match(/score\s+(\d+)/i);
    return scoreMatch ? parseInt(scoreMatch[1]) : 0;
  };

  return {
    verifyAchievement,
    fetchScreenpipeData,
    recentScreenpipeData,
    verifying,
    error
  };
}
