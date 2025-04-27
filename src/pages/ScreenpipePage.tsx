
import ScreenpipePanel from "@/components/screenpipe/ScreenpipePanel";
import ScreenpipeLivePanel from "@/components/screenpipe/ScreenpipeLivePanel";
import ScreenpipeSearchPanel from "@/components/screenpipe/ScreenpipeSearchPanel";
import ScreenpipeMeetingSummarizer from "@/components/screenpipe/ScreenpipeMeetingSummarizer";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

export default function ScreenpipePage() {
  return (
    <div className="min-h-screen space-gradient flex flex-col items-center py-8">
      <div className="container max-w-2xl mx-auto py-4 w-full">
        <h2 className="text-3xl font-bold text-white mb-2 text-center">Screenpipe Activity &amp; Search</h2>
        <p className="mb-6 text-slate-300 text-center">
          View recent screen or audio data captured with Screenpipe.<br />
          Your data stays private – everything is processed locally in your browser.
        </p>
        <Tabs defaultValue="latest" className="w-full mb-4">
          <TabsList className="w-full bg-black/50 border border-space-stellar-blue flex flex-wrap">
            <TabsTrigger value="latest" className="flex-1">Latest Activity</TabsTrigger>
            <TabsTrigger value="live" className="flex-1">Live Monitor</TabsTrigger>
            <TabsTrigger value="search" className="flex-1">Search</TabsTrigger>
            <TabsTrigger value="meeting" className="flex-1">Meeting Summarizer</TabsTrigger>
          </TabsList>

          <TabsContent value="latest">
            <ScreenpipePanel />
          </TabsContent>
          <TabsContent value="live">
            <ScreenpipeLivePanel />
          </TabsContent>
          <TabsContent value="search">
            <ScreenpipeSearchPanel />
          </TabsContent>
          <TabsContent value="meeting">
            <ScreenpipeMeetingSummarizer />
          </TabsContent>
        </Tabs>
        <Alert className="bg-black/30 border border-space-stellar-blue text-white mt-6">
          <InfoIcon className="h-4 w-4 text-space-stellar-blue" />
          <AlertTitle>How does it work?</AlertTitle>
          <AlertDescription className="text-slate-300">
            Screenpipe captures your screen or audio data <strong>locally</strong>. Results shown here never leave your device.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
