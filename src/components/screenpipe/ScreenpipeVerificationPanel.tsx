import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAchievementVerification } from "@/hooks/useAchievementVerification";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, RefreshCw, Shield, CheckCircle, XCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ScreenpipeInstaller } from "./ScreenpipeInstaller";
import { Achievement } from "@/components/blockchain/AchievementCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

interface ScreenpipeVerificationPanelProps {
  achievements: Achievement[];
  walletAddress: string | null;
  onVerificationComplete?: (achievementId: string, verified: boolean) => void;
}

export default function ScreenpipeVerificationPanel({
  achievements,
  walletAddress,
  onVerificationComplete
}: ScreenpipeVerificationPanelProps) {
  const { 
    fetchScreenpipeData, 
    recentScreenpipeData, 
    verifying, 
    verificationProgress,
    error, 
    verifyAchievement,
    resetVerificationState
  } = useAchievementVerification();
  
  const { toast } = useToast();
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [lastVerificationResult, setLastVerificationResult] = useState<{
    success: boolean;
    message: string;
    achievementId?: string;
  } | null>(null);

  // Load Screenpipe data and check connection
  useEffect(() => {
    const initializeScreenpipe = async () => {
      try {
        await fetchScreenpipeData();
        setConnectionStatus('connected');
      } catch (e) {
        console.error("Screenpipe connection error:", e);
        setConnectionStatus('disconnected');
      }
    };

    initializeScreenpipe();

    // Set up periodic refresh every 30 seconds
    const interval = setInterval(initializeScreenpipe, 30000);
    return () => clearInterval(interval);
  }, [fetchScreenpipeData]);

  // Filter achievements
  const pendingAchievements = achievements.filter(a => 
    a.completed && a.verificationStatus === "pending"
  );
  
  const verifiedAchievements = achievements.filter(a => 
    a.verificationStatus === "verified"
  );

  // Handle verification
  const verifySelectedAchievement = async () => {
    if (!selectedAchievement || !walletAddress) return;
    
    resetVerificationState();
    setLastVerificationResult(null);

    try {
      const verified = await verifyAchievement(selectedAchievement, walletAddress);
      
      if (verified) {
        setLastVerificationResult({
          success: true,
          message: "Achievement verified successfully!",
          achievementId: selectedAchievement.id
        });
        
        if (onVerificationComplete) {
          onVerificationComplete(selectedAchievement.id, true);
        }
        
        toast({
          title: "Verification Successful",
          description: `${selectedAchievement.title} has been verified`,
          variant: "default",
        });
      } else {
        setLastVerificationResult({
          success: false,
          message: "Could not verify achievement. Make sure the content is visible on your screen.",
          achievementId: selectedAchievement.id
        });
      }
    } catch (e: any) {
      console.error("Verification error:", e);
      
      setLastVerificationResult({
        success: false,
        message: e.message || "Verification failed due to an unexpected error"
      });
      
      toast({
        title: "Verification Failed",
        description: e.message || "An error occurred during verification",
        variant: "destructive"
      });
    }
  };

  // Connection status alert
  const renderConnectionAlert = () => {
    switch (connectionStatus) {
      case 'connecting':
        return (
          <Alert className="mb-4 bg-blue-500/10 border-blue-500/30">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <AlertTitle>Connecting to Screenpipe</AlertTitle>
            <AlertDescription className="text-white/70">
              Establishing connection to Screenpipe extension...
            </AlertDescription>
          </Alert>
        );
      case 'disconnected':
        return (
          <Alert className="mb-4 bg-red-500/10 border-red-500/30">
            <XCircle className="h-4 w-4 text-red-400" />
            <AlertTitle>Screenpipe Not Connected</AlertTitle>
            <AlertDescription className="text-white/70">
              <div className="space-y-2">
                <p>Screenpipe extension is required for verification.</p>
                <ScreenpipeInstaller />
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                  className="mt-2"
                >
                  <RefreshCw className="h-3 w-3 mr-2" />
                  Reload After Installation
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        );
      case 'connected':
        return null;
    }
  };

  // Verification result alert
  const renderVerificationResult = () => {
    if (!lastVerificationResult || !selectedAchievement) return null;

    return (
      <Alert className={`mb-4 ${
        lastVerificationResult.success 
          ? 'bg-green-500/10 border-green-500/30' 
          : 'bg-red-500/10 border-red-500/30'
      }`}>
        {lastVerificationResult.success ? (
          <CheckCircle className="h-4 w-4 text-green-400" />
        ) : (
          <XCircle className="h-4 w-4 text-red-400" />
        )}
        <AlertTitle>
          {lastVerificationResult.success ? 'Success!' : 'Verification Failed'}
        </AlertTitle>
        <AlertDescription className="text-white/70">
          {lastVerificationResult.message}
          {!lastVerificationResult.success && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={verifySelectedAchievement}
              className="mt-2"
              disabled={verifying}
            >
              <RefreshCw className="h-3 w-3 mr-2" />
              Try Again
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <Card className="w-full border border-space-stellar-blue bg-black/30">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center">
            <Shield className="h-5 w-5 mr-2 text-space-stellar-blue" />
            Achievement Verification
          </span>
          <Button 
            onClick={() => {
              setConnectionStatus('connecting');
              fetchScreenpipeData().then(() => {
                setConnectionStatus('connected');
              }).catch(() => {
                setConnectionStatus('disconnected');
              });
            }} 
            size="sm"
            variant="outline"
            disabled={verifying}
            className="h-8"
          >
            <RefreshCw className={`h-3 w-3 mr-2 ${connectionStatus === 'connecting' ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {renderConnectionAlert()}
        {renderVerificationResult()}
        
        {verifying && (
          <div className="mb-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Verifying {selectedAchievement?.title}...</span>
              <span>{verificationProgress}%</span>
            </div>
            <Progress value={verificationProgress} className="h-2" />
          </div>
        )}

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="pending" className="flex-1">
              Pending ({pendingAchievements.length})
            </TabsTrigger>
            <TabsTrigger value="verified" className="flex-1">
              Verified ({verifiedAchievements.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending">
            <ScrollArea className="h-[300px] pr-2">
              {pendingAchievements.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-white/70">
                  <CheckCircle className="h-12 w-12 mb-2 opacity-30" />
                  <p>No pending achievements to verify</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingAchievements.map(achievement => (
                    <Card 
                      key={achievement.id}
                      className={`border cursor-pointer transition-all ${
                        selectedAchievement?.id === achievement.id
                          ? 'border-space-stellar-blue bg-space-stellar-blue/10'
                          : 'border-white/20 hover:border-white/40'
                      }`}
                      onClick={() => {
                        setSelectedAchievement(achievement);
                        setLastVerificationResult(null);
                      }}
                    >
                      <CardContent className="p-3">
                        <div className="flex justify-between">
                          <h4 className="font-semibold">{achievement.title}</h4>
                          <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full">
                            Pending
                          </span>
                        </div>
                        <p className="text-sm text-white/70 mt-1">{achievement.description}</p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-space-nova-yellow">
                            {achievement.rewardAmount} Tokens
                          </span>
                          <span className="text-xs text-white/50">
                            Requires {achievement.verificationMethod || "screen verification"}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
            
            {selectedAchievement && connectionStatus === 'connected' && (
              <div className="mt-4 space-y-2">
                <div className="text-xs text-white/70">
                  <p>Make sure this content is visible on your screen:</p>
                  <p className="font-medium mt-1">"{selectedAchievement.verificationText || selectedAchievement.title}"</p>
                </div>
                <Button
                  className="w-full bg-space-stellar-blue hover:bg-space-stellar-blue/80"
                  disabled={!walletAddress || verifying}
                  onClick={verifySelectedAchievement}
                >
                  {verifying ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Verify Achievement
                    </>
                  )}
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="verified">
            <ScrollArea className="h-[300px] pr-2">
              {verifiedAchievements.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-white/70">
                  <Shield className="h-12 w-12 mb-2 opacity-30" />
                  <p>No verified achievements yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {verifiedAchievements.map(achievement => (
                    <Card key={achievement.id} className="border border-green-500/50 bg-green-500/5">
                      <CardContent className="p-3">
                        <div className="flex justify-between">
                          <h4 className="font-semibold">{achievement.title}</h4>
                          <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full">
                            Verified
                          </span>
                        </div>
                        <p className="text-sm text-white/70 mt-1">{achievement.description}</p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-space-nova-yellow">
                            {achievement.rewardAmount} Tokens
                          </span>
                          {achievement.timestamp && (
                            <span className="text-xs text-white/50">
                              {new Date(achievement.timestamp).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
        
        <div className="text-xs text-white/50 mt-4">
          <p className="font-medium">Verification Tips:</p>
          <ul className="list-disc pl-4 mt-1 space-y-1">
            <li>Keep the achievement content visible on your screen during verification</li>
            <li>Ensure good lighting conditions if using camera verification</li>
            <li>Close other applications that might interfere with screen capture</li>
            <li>Grant all necessary permissions to Screenpipe extension</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}