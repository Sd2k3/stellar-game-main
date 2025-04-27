import React, { useEffect, useState, useCallback, useRef } from "react";
import { pipe } from "@screenpipe/browser";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import { AlertCircle, Info } from "lucide-react";
import { generateMockTranscriptChunk } from "@/utils/screenpipeMockData";
import { Alert, AlertTitle, AlertDescription } from "../ui/alert";
import { ScreenpipeInstaller } from "./ScreenpipeInstaller";

export default function ScreenpipeMeetingSummarizer() {
  const [transcript, setTranscript] = useState("");
  const [summary, setSummary] = useState("");
  const [lastSummarized, setLastSummarized] = useState<number>(Date.now());
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isMockData, setIsMockData] = useState(false);
  const fullTranscriptRef = useRef("");
  const mockIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const useMockData = useCallback(() => {
    setIsMockData(true);
    
    // Clear any existing intervals
    if (mockIntervalRef.current) {
      clearInterval(mockIntervalRef.current);
    }
    
    // Start generating mock transcript data at intervals
    mockIntervalRef.current = setInterval(() => {
      const chunk = generateMockTranscriptChunk();
      const text = chunk.choices?.[0]?.text || "";
      
      if (text) {
        fullTranscriptRef.current += text + " ";
        setTranscript(fullTranscriptRef.current);
        
        if (Date.now() - lastSummarized > 20000 && fullTranscriptRef.current.length > 100) {
          setSummary("Demo Summary: " + fullTranscriptRef.current.substring(0, 150) + 
            (fullTranscriptRef.current.length > 150 ? "..." : ""));
          setLastSummarized(Date.now());
        }
      }
    }, 3000);
    
    setIsListening(true);
  }, [lastSummarized]);

  useEffect(() => {
    let isActive = true;
    fullTranscriptRef.current = "";

    async function startTranscriptionStream() {
      try {
        if (!pipe || typeof pipe.streamTranscriptions !== 'function') {
          throw new Error("Screenpipe is not properly initialized");
        }

        setIsListening(true);
        
        for await (const chunk of pipe.streamTranscriptions()) {
          if (!isActive) break;
          const text = chunk.choices?.[0]?.text || "";
          if (text) {
            fullTranscriptRef.current += text + " ";
            setTranscript(fullTranscriptRef.current);

            if (Date.now() - lastSummarized > 30000 && fullTranscriptRef.current.length > 200) {
              // Faking summary: For production, integrate with your AI provider as needed.
              setSummary("Summary: " + fullTranscriptRef.current.substring(0, 200) + 
                (fullTranscriptRef.current.length > 200 ? "..." : ""));
              setLastSummarized(Date.now());
            }
          }
        }
      } catch (e) {
        if (isActive) {
          console.error("Transcription stream error:", e);
          setError(`Failed to connect to Screenpipe: ${(e as any)?.message || String(e)}`);
          setIsListening(false);
          
          // Fall back to mock data if real Screenpipe fails
          useMockData();
        }
      }
    }

    startTranscriptionStream();

    return () => { 
      isActive = false; 
      setIsListening(false);
      
      // Clear mock data interval on cleanup
      if (mockIntervalRef.current) {
        clearInterval(mockIntervalRef.current);
        mockIntervalRef.current = null;
      }
    };
  }, [lastSummarized, useMockData]);

  return (
    <Card className="w-full border border-space-stellar-blue bg-black/30">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>📝 Real-time Meeting Summarizer</span>
          {isMockData && (
            <span className="text-xs text-amber-400 flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              Demo Mode
            </span>
          )}
          {error && !isMockData && (
            <span className="text-xs text-red-400 flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              Connection Error
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
        
        <ScrollArea className="h-72 pr-2 mb-2">
          <div className="text-white text-xs whitespace-pre-wrap">
            {transcript || (isListening ? "Listening for meeting audio..." : "Waiting to connect...")}
          </div>
        </ScrollArea>
        <div className="mt-4 bg-space-stellar-blue/15 px-3 py-2 rounded text-space-nova-yellow">
          {summary || "Waiting for summary (talk for 30s+ and the text will appear)..."}
        </div>
      </CardContent>
    </Card>
  );
}
