import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface WalletState {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  balance: number | null;
  chainId: string | null;
}

export function useWalletConnection() {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    isConnecting: false,
    address: null,
    balance: null,
    chainId: null,
  });
  const { toast } = useToast();

  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ 
            method: 'eth_accounts' 
          });
          
          if (accounts.length > 0) {
            const chainId = await window.ethereum.request({ 
              method: 'eth_chainId' 
            });
            
            const balance = await window.ethereum.request({ 
              method: 'eth_getBalance',
              params: [accounts[0], 'latest']
            });
            
            const ethBalance = parseInt(balance) / 1e18;
            
            setWalletState({
              isConnected: true,
              isConnecting: false,
              address: accounts[0],
              balance: parseFloat(ethBalance.toFixed(4)),
              chainId,
            });
          }
        } catch (error) {
          console.error("Error checking wallet connection:", error);
        }
      }
    };
    
    checkConnection();
  }, []);
  
  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      const handleAccountsChanged = async (accounts: string[]) => {
        if (accounts.length === 0) {
          setWalletState({
            isConnected: false,
            isConnecting: false,
            address: null,
            balance: null,
            chainId: null,
          });
          toast({
            title: "Wallet Disconnected",
            description: "Your wallet has been disconnected"
          });
        } else if (accounts[0] !== walletState.address) {
          try {
            const chainId = await window.ethereum.request({ 
              method: 'eth_chainId' 
            });
            
            const balance = await window.ethereum.request({ 
              method: 'eth_getBalance',
              params: [accounts[0], 'latest']
            });
            
            const ethBalance = parseInt(balance) / 1e18;
            
            setWalletState({
              isConnected: true,
              isConnecting: false,
              address: accounts[0],
              balance: parseFloat(ethBalance.toFixed(4)),
              chainId,
            });
            
            toast({
              title: "Account Changed",
              description: `Connected to address ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
            });
          } catch (error) {
            console.error("Error handling account change:", error);
          }
        }
      };
      
      const handleChainChanged = (chainId: string) => {
        window.location.reload();
      };
      
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      
      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [walletState.address, toast]);

  const connectWallet = useCallback(async () => {
    if (walletState.isConnecting || walletState.isConnected) return;

    try {
      setWalletState(prev => ({ ...prev, isConnecting: true }));

      if (typeof window !== "undefined" && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
          });
          
          if (accounts.length > 0) {
            const chainId = await window.ethereum.request({ 
              method: 'eth_chainId' 
            });
            
            const balance = await window.ethereum.request({ 
              method: 'eth_getBalance',
              params: [accounts[0], 'latest']
            });
            
            const ethBalance = parseInt(balance) / 1e18;
            
            setWalletState({
              isConnected: true,
              isConnecting: false,
              address: accounts[0],
              balance: parseFloat(ethBalance.toFixed(4)),
              chainId,
            });

            localStorage.setItem('wallet_address', accounts[0]);

            toast({
              title: "Wallet Connected",
              description: `Connected to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
            });
            
            console.log("Wallet connected:", accounts[0]);
            return true;
          }
        } catch (error: any) {
          handleWalletError(error);
          return false;
        }
      } else {
        toast({
          variant: "destructive",
          title: "No Wallet Detected",
          description: "Please install MetaMask or another compatible wallet",
        });
      }
      
      setWalletState(prev => ({ ...prev, isConnecting: false }));
      return false;
    } catch (error) {
      handleWalletError(error);
      return false;
    }
  }, [walletState.isConnecting, walletState.isConnected, toast]);

  const handleWalletError = (error: any) => {
    console.error("Wallet error:", error);
    let description = "Could not connect wallet";
    
    if (error.code === 4001) {
      description = "You rejected the connection request";
    } else if (error.code === -32002) {
      description = "Please check your wallet - a connection request is pending";
    }
    
    toast({
      variant: "destructive",
      title: "Connection Failed",
      description
    });
    
    setWalletState(prev => ({ ...prev, isConnecting: false }));
  };

  const disconnectWallet = useCallback(() => {
    setWalletState({
      isConnected: false,
      isConnecting: false,
      address: null,
      balance: null,
      chainId: null,
    });
    
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected"
    });
    
    // Note: MetaMask doesn't actually provide a disconnect method via their API
    // This just clears the connection state in our app, but the wallet remains connected
    // The user will need to disconnect from the wallet itself if desired
    
  }, [toast]);

  return {
    ...walletState,
    connectWallet,
    disconnectWallet
  };
}
