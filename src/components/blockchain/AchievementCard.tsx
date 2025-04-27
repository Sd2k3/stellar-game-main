
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useAchievementVerification } from "@/hooks/useAchievementVerification";
import { Check, Loader2 } from "lucide-react";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  rewardAmount: number;
  completed: boolean;
  timestamp?: string;
  verificationStatus: "pending" | "verified" | "rejected";
}

interface AchievementCardProps {
  achievement: Achievement;
  className?: string;
  walletAddress?: string | null;
  onVerificationComplete?: (verified: boolean) => void;
}

const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  className,
  walletAddress = null,
  onVerificationComplete
}) => {
  const { verifyAchievement, verifying } = useAchievementVerification();
  
  const statusColors = {
    pending: "bg-yellow-500 hover:bg-yellow-600",
    verified: "bg-green-500 hover:bg-green-600",
    rejected: "bg-red-500 hover:bg-red-600",
  };
  
  const statusLabels = {
    pending: "Pending Verification",
    verified: "Verified by Screenpipe",
    rejected: "Verification Failed",
  };

  const handleVerify = async () => {
    const verified = await verifyAchievement(achievement, walletAddress);
    if (onVerificationComplete) {
      onVerificationComplete(verified);
    }
  };

  return (
    <Card className={`overflow-hidden border-2 ${achievement.completed ? "border-green-500" : "border-gray-300"} ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold">{achievement.title}</CardTitle>
          <Badge variant={achievement.completed ? "default" : "outline"}>
            {achievement.completed ? "Completed" : "Incomplete"}
          </Badge>
        </div>
        <CardDescription>{achievement.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-2">
          <svg className="h-5 w-5 text-space-nova-yellow glow-yellow" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="10" />
            <path fill="white" d="M12 6l1.5 4.5h4.5l-3.6 2.7 1.4 4.3-3.8-2.8-3.8 2.8 1.4-4.3-3.6-2.7h4.5z" />
          </svg>
          <span className="font-medium text-space-nova-yellow">
            {achievement.rewardAmount} Stellar Tokens
          </span>
        </div>
        
        <Separator className="my-2" />
        
        <div className="mt-2 flex justify-between items-center text-sm">
          <div className="flex items-center">
            <Badge variant="secondary" className={`${statusColors[achievement.verificationStatus]}`}>
              {statusLabels[achievement.verificationStatus]}
            </Badge>
          </div>
          {achievement.timestamp && (
            <span className="text-muted-foreground">
              {new Date(achievement.timestamp).toLocaleDateString()}
            </span>
          )}
        </div>
        
        {achievement.completed && achievement.verificationStatus === "pending" && walletAddress && (
          <Button 
            onClick={handleVerify}
            disabled={verifying}
            size="sm" 
            className="w-full mt-3 bg-space-stellar-blue hover:bg-space-stellar-blue/80"
          >
            {verifying ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Verify with Screenpipe
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default AchievementCard;
