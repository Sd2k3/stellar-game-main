
import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { AlertCircle, Check, Terminal, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

export function ScreenpipeInstaller() {
  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [platform, setPlatform] = useState<'windows' | 'mac' | 'linux' | 'unknown'>('unknown');
  const { toast } = useToast();

  useEffect(() => {
    // Try to detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.indexOf("win") !== -1) setPlatform('windows');
    else if (userAgent.indexOf("mac") !== -1) setPlatform('mac');
    else if (userAgent.indexOf("linux") !== -1) setPlatform('linux');
  }, []);
  
  const copyWindowsCommand = async () => {
    setInstalling(true);
    
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText('iwr get.screenpi.pe/cli.ps1 | iex');
        
        toast({
          title: "Installation command copied",
          description: "Open PowerShell and paste the command to install Screenpipe",
        });
        
        setInstalled(true);
      } else {
        toast({
          title: "Manual installation required",
          description: "Copy this command: iwr get.screenpi.pe/cli.ps1 | iex",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to copy installation command:", error);
      toast({
        title: "Copy failed",
        description: "Please manually copy the installation command: iwr get.screenpi.pe/cli.ps1 | iex",
        variant: "destructive",
      });
    } finally {
      setInstalling(false);
    }
  };
  
  const copyMacCommand = async () => {
    setInstalling(true);
    
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText('curl -fsSL get.screenpi.pe/cli.sh | bash');
        
        toast({
          title: "Installation command copied",
          description: "Open Terminal and paste the command to install Screenpipe",
        });
        
        setInstalled(true);
      } else {
        toast({
          title: "Manual installation required",
          description: "Copy this command: curl -fsSL get.screenpi.pe/cli.sh | bash",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to copy installation command:", error);
      toast({
        title: "Copy failed",
        description: "Please manually copy the installation command",
        variant: "destructive",
      });
    } finally {
      setInstalling(false);
    }
  };
  
  const copyLinuxCommand = async () => {
    setInstalling(true);
    
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText('curl -fsSL get.screenpi.pe/cli.sh | bash');
        
        toast({
          title: "Installation command copied",
          description: "Open Terminal and paste the command to install Screenpipe",
        });
        
        setInstalled(true);
      } else {
        toast({
          title: "Manual installation required",
          description: "Copy this command: curl -fsSL get.screenpi.pe/cli.sh | bash",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to copy installation command:", error);
      toast({
        title: "Copy failed",
        description: "Please manually copy the installation command",
        variant: "destructive",
      });
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div className="flex flex-col space-y-3 mt-2">
      <Tabs defaultValue={platform === 'unknown' ? "windows" : platform} className="w-full">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="windows">Windows</TabsTrigger>
          <TabsTrigger value="mac">Mac</TabsTrigger>
          <TabsTrigger value="linux">Linux</TabsTrigger>
        </TabsList>
        
        <TabsContent value="windows" className="space-y-2">
          <Button 
            onClick={copyWindowsCommand} 
            disabled={installing || installed}
            className="bg-space-stellar-blue hover:bg-space-stellar-blue/80 text-white w-full"
          >
            {installing ? (
              "Copying command..."
            ) : installed ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Command copied
              </>
            ) : (
              <>
                <Terminal className="mr-2 h-4 w-4" />
                Copy Windows install command
              </>
            )}
          </Button>
          <div className="text-xs text-white/70">
            After copying, open PowerShell and paste the command:
            <pre className="bg-black/30 p-2 my-1 rounded font-mono text-white/90">
              iwr get.screenpi.pe/cli.ps1 | iex
            </pre>
            Then run:
            <pre className="bg-black/30 p-2 my-1 rounded font-mono text-white/90">
              screenpipe.exe
            </pre>
          </div>
        </TabsContent>
        
        <TabsContent value="mac" className="space-y-2">
          <Button 
            onClick={copyMacCommand} 
            disabled={installing || installed}
            className="bg-space-stellar-blue hover:bg-space-stellar-blue/80 text-white w-full"
          >
            {installing ? (
              "Copying command..."
            ) : installed ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Command copied
              </>
            ) : (
              <>
                <Terminal className="mr-2 h-4 w-4" />
                Copy Mac install command
              </>
            )}
          </Button>
          <div className="text-xs text-white/70">
            After copying, open Terminal and paste the command:
            <pre className="bg-black/30 p-2 my-1 rounded font-mono text-white/90">
              curl -fsSL get.screenpi.pe/cli.sh | bash
            </pre>
            Then run:
            <pre className="bg-black/30 p-2 my-1 rounded font-mono text-white/90">
              screenpipe
            </pre>
          </div>
        </TabsContent>
        
        <TabsContent value="linux" className="space-y-2">
          <Button 
            onClick={copyLinuxCommand} 
            disabled={installing || installed}
            className="bg-space-stellar-blue hover:bg-space-stellar-blue/80 text-white w-full"
          >
            {installing ? (
              "Copying command..."
            ) : installed ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Command copied
              </>
            ) : (
              <>
                <Terminal className="mr-2 h-4 w-4" />
                Copy Linux install command
              </>
            )}
          </Button>
          <div className="text-xs text-white/70">
            After copying, open Terminal and paste the command:
            <pre className="bg-black/30 p-2 my-1 rounded font-mono text-white/90">
              curl -fsSL get.screenpi.pe/cli.sh | bash
            </pre>
            Then run:
            <pre className="bg-black/30 p-2 my-1 rounded font-mono text-white/90">
              screenpipe
            </pre>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-between">
        <a 
          href="https://www.screenpipe.com"
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-space-nova-yellow underline flex items-center"
        >
          <Download className="h-3 w-3 mr-1" />
          Download manually
        </a>
        
        <a 
          href="https://www.screenpipe.com/docs"
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-space-stellar-blue underline"
        >
          Documentation
        </a>
      </div>
    </div>
  );
}
