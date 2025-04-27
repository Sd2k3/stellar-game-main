import React from "react";
import { useScreenpipeActivity } from "@/hooks/useScreenpipeActivity";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { verifyAchievementWithContract } from "@/integrations/supabase/blockchainApi";
import { AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "../ui/alert";
import { ScreenpipeInstaller } from "./ScreenpipeInstaller";

export interface ScreenpipePanelProps {
  minutes?: number;
  limit?: number;
  contentType?: "ocr" | "audio" | "ui" | "all";
}

// Define the typePretty object to display human-readable content types
const typePretty: Record<string, string> = {
  "OCR": "Screen Text",
  "Audio": "Voice/Audio",
  "UI": "UI Interaction"
};

const ScreenpipePanel: React.FC<ScreenpipePanelProps> = ({
  minutes = 5,
  limit = 15,
  contentType = "all",
}) => {
  const { data, loading, error, isMockData } = useScreenpipeActivity({ 
    minutes, 
    limit, 
    contentType,
    useMockOnFailure: true
  });
  const { toast } = useToast();

  // Process Screenpipe data for achievement verification
  const processScreenpipeData = (item: any) => {
    // Check for achievement-related content
    if (item.type === "OCR" && item.content?.text) {
      const text = item.content.text.toLowerCase();
      
      // Example verification logic - adjust based on your game's specific needs
      if (text.includes("achievement") || text.includes("complete") || text.includes("stellar")) {
        toast({
          title: "Achievement Verification",
          description: "Screenpipe detected achievement-related activity",
        });
      }
    }
  };

  React.useEffect(() => {
    if (data && data.length > 0) {
      data.forEach(processScreenpipeData);
    }
  }, [data]);

  return (
    <Card className="w-full border border-space-stellar-blue bg-black/30">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>🚀 Recent Screenpipe Activity (last {minutes} min)</span>
          {isMockData && (
            <span className="text-xs text-amber-400 flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              Demo Mode
            </span>
          )}
          {error && !isMockData && (
            <span className="text-xs text-red-400 flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              Fetch Error
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && !isMockData && (
          <div className="text-red-500 p-2 bg-red-500/10 rounded border border-red-500/30">
            {error}
            <div className="mt-2 text-xs text-white/70">
              Make sure Screenpipe is running in your browser. If you don't have Screenpipe:
              <ScreenpipeInstaller />
              Or <a 
                href="https://www.screenpipe.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-space-nova-yellow underline"
              >
                download it manually here
              </a>.
            </div>
          </div>
        )}
        
        {isMockData && (
          <Alert className="mb-4 bg-yellow-500/10 border-yellow-500/30">
            <AlertCircle className="h-4 w-4 text-yellow-400" />
            <AlertTitle>Demo Mode Active</AlertTitle>
            <AlertDescription className="text-white/70">
              You're seeing demonstration data since Screenpipe is not connected.
              <ScreenpipeInstaller />
            </AlertDescription>
          </Alert>
        )}
        
        <ScrollArea className="h-80 pr-2">
          {loading && <div className="text-slate-400">Loading activity…</div>}
          
          {error && !isMockData && !data.length && (
            <div className="text-slate-400 p-2">
              No activity data could be loaded.
            </div>
          )}
          
          {!loading && !error && data.length === 0 && (
            <div className="text-slate-400 p-2">
              No recent activity found. Make sure Screenpipe is running and capturing your screen or audio.
            </div>
          )}
          
          <ul className="space-y-4">
            {data.map(item => (
              <li key={item.id} className="border-b border-space-stellar-blue/30 pb-2">
                <div className="text-xs text-slate-400 mb-0.5">
                  {new Date(item.content?.timestamp || item.timestamp || Date.now()).toLocaleString()} 
                  {" · "}
                  <span className="font-mono">{typePretty[item.type] || item.type}</span>
                </div>
                {(item.type === "OCR" && item.content?.text) && (
                  <div className="whitespace-pre-wrap text-white">
                    {item.content.text}
                  </div>
                )}
                {(item.type === "Audio" && item.content?.transcription) && (
                  <div className="whitespace-pre-wrap text-white">
                    {item.content.transcription}
                  </div>
                )}
                {(item.type === "UI" && item.content?.element_type) && (
                  <div className="whitespace-pre-wrap text-white">
                    {JSON.stringify(item.content, null, 2)}
                  </div>
                )}
                {/* Show image preview if available */}
                {(item.type === "OCR" && item.content?.frame) && (
                  <img 
                    src={`data:image/png;base64,${item.content.frame}`} 
                    alt="Screen capture"
                    className="w-full max-w-xs border border-space-nova-yellow rounded my-2"
                  />
                )}
              </li>
            ))}
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ScreenpipePanel;
