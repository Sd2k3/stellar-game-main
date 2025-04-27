import React, { useState, useEffect } from "react";
import { Wifi, WifiOff, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BlockchainSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

interface NetworkInfo {
  chainId: string;
  chainName: string;
}

const BlockchainSelector: React.FC<BlockchainSelectorProps> = ({
  value,
  onChange,
  className,
}) => {
  const [currentNetwork, setCurrentNetwork] = useState<NetworkInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize and listen for chain changes
  useEffect(() => {
    if (typeof window.ethereum === 'undefined') {
      setError("MetaMask not detected");
      return;
    }

    const handleChainChanged = (chainId: string) => {
      updateCurrentNetwork(chainId);
    };

    const updateCurrentNetwork = async (chainId: string) => {
      try {
        const networkName = await getNetworkName(chainId);
        setCurrentNetwork({
          chainId,
          chainName: networkName,
        });
        onChange(chainId);
        setError(null);
      } catch (err) {
        setError("Failed to get network info");
      }
    };

    // Initial setup
    const init = async () => {
      setIsLoading(true);
      try {
        // Request account access if needed
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // Get current chain ID
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        await updateCurrentNetwork(chainId);
        
        // Set up event listener for chain changes
        window.ethereum.on('chainChanged', handleChainChanged);
      } catch (err) {
        setError("Failed to connect to MetaMask");
      } finally {
        setIsLoading(false);
      }
    };

    init();

    // Clean up
    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [onChange]);

  const getNetworkName = async (chainId: string): Promise<string> => {
    // Common network names
    const networkNames: Record<string, string> = {
      '0x1': 'Ethereum Mainnet',
      '0x5': 'Goerli Testnet',
      '0xaa36a7': 'Sepolia Testnet',
      '0x89': 'Polygon Mainnet',
      '0x13881': 'Mumbai Testnet',
      '0xa': 'Optimism',
      '0xa4b1': 'Arbitrum One',
      '0x279f': 'Monad Testnet', // Updated chain ID
    };

    return networkNames[chainId.toLowerCase()] || `Chain ${parseInt(chainId, 16)}`;
  };

  const handleAddMonadTestnet = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Show detailed confirmation dialog
      const confirmed = window.confirm(
        `You're adding Monad Testnet to MetaMask:\n\n` +
        `Network Name: Monad Testnet\n` +
        `Chain ID: 10143 (0x279F)\n` +
        `RPC URL: https://testnet-rpc.monad.xyz\n` +
        `Currency Symbol: MON\n` +
        `Block Explorer: https://testnet.monadeexplorer.com\n\n` +
        `Please verify these details before continuing.`
      );

      if (!confirmed) {
        setIsLoading(false);
        return;
      }

      // Add Monad Testnet with correct parameters
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x279F', // 10143 in hex
          chainName: 'Monad Testnet',
          nativeCurrency: {
            name: 'Monad',
            symbol: 'MON', // Correct symbol from docs
            decimals: 18
          },
          rpcUrls: ['https://testnet-rpc.monad.xyz'],
          blockExplorerUrls: ['https://testnet.monadeexplorer.com']
        }]
      });

      // Try switching to Monad after adding
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x279F' }],
        });
      } catch (switchError) {
        console.warn("Added but failed to switch to Monad:", switchError);
      }
    } catch (err: any) {
      console.error("Network addition error:", err);
      
      let errorMessage = "Failed to add network";
      if (err.code === 4001) {
        errorMessage = "User rejected the request";
      } else if (err.code === -32602) {
        errorMessage = "Invalid parameters";
      } else if (err.code === -32603) {
        errorMessage = "Internal error - check RPC URL";
      } else if (err.message.includes("chain ID")) {
        errorMessage = "Invalid chain ID";
      }
      
      setError(`${errorMessage}. Please check the network details and try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchNetwork = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }]
      });
      
      // This will open MetaMask's network selector
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: currentNetwork?.chainId || '0x1' }],
      });
    } catch (err: any) {
      if (err.code === 4001) {
        setError("Network switch rejected");
      } else {
        setError("Failed to switch network");
      }
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label className="text-sm font-medium text-white">
        Blockchain Network
      </label>
      
      <Button
        onClick={handleSwitchNetwork}
        disabled={isLoading}
        className="bg-black/70 text-white border-space-stellar-blue hover:bg-space-stellar-blue/20 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          {isLoading ? (
            <WifiOff className="h-4 w-4 animate-pulse" />
          ) : error ? (
            <WifiOff className="h-4 w-4 text-red-500" />
          ) : (
            <Wifi className="h-4 w-4" />
          )}
          
          {currentNetwork?.chainName || (error ? "Connect to MetaMask" : "Select Network")}
        </div>
        <ChevronDown className="h-4 w-4 ml-2" />
      </Button>
      
      {error && (
        <p className="text-red-500 text-xs">{error}</p>
      )}
      
      <Button
        onClick={handleAddMonadTestnet}
        variant="outline"
        size="sm"
        className="text-xs text-space-stellar-blue border-space-stellar-blue hover:bg-space-stellar-blue/10"
      >
        + Add Monad Testnet
      </Button>

      {/* Network details tooltip */}
      <div className="text-xs text-gray-400 mt-1">
        Monad Testnet Details:
        <ul className="list-disc pl-4">
          <li>Chain ID: 10143 (0x279F)</li>
          <li>RPC: testnet-rpc.monad.xyz</li>
          <li>Symbol: MON</li>
        </ul>
      </div>
    </div>
  );
};

export default BlockchainSelector;