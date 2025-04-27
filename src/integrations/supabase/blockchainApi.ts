import { supabase } from "@/integrations/supabase/client";
import { ethers } from "ethers";

// Record a new blockchain transaction
export async function createBlockchainTransaction({
  walletAddress,
  type,
  amount,
}: {
  walletAddress: string;
  type: string;
  amount: number;
}) {
  const { data, error } = await supabase
    .from("blockchain_transactions")
    .insert({
      wallet_address: walletAddress,
      transaction_type: type,
      amount,
      status: "pending",
    })
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

// Record a blockchain achievement verification
export async function recordAchievementOnChain({
  walletAddress,
  achievementId,
  achievementTitle,
  transactionId,
  contractAddress,
}: {
  walletAddress: string;
  achievementId: string;
  achievementTitle: string;
  transactionId?: string;
  contractAddress?: string;
}) {
  const { data, error } = await supabase
    .from("player_achievements")
    .insert({
      wallet_address: walletAddress,
      achievement_id: achievementId,
      achievement_title: achievementTitle,
      transaction_id: transactionId,
      verified_on_chain: false,
    })
    .select()
    .maybeSingle();

  if (error) throw error;
  return { ...data, success: true };
}

// Get or create the player's token balance row
export async function upsertPlayerTokenBalance({
  walletAddress,
  amount,
  pendingAmount,
}: {
  walletAddress: string;
  amount: number;
  pendingAmount?: number;
}) {
  const { data, error } = await supabase
    .from("player_tokens")
    .upsert(
      {
        wallet_address: walletAddress,
        balance: amount,
        pending_balance: pendingAmount ?? 0,
        last_updated: new Date().toISOString(),
      },
      { onConflict: "wallet_address" }
    )
    .select()
    .maybeSingle();

  if (error) throw error;
  return data;
}

// Fetch the player's token balance
export async function getPlayerTokenBalance(walletAddress: string) {
  const { data, error } = await supabase
    .from("player_tokens")
    .select("*")
    .eq("wallet_address", walletAddress)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// Smart contract interaction methods
// ABI for a basic ERC20 token with achievement verification
const tokenContractABI = [
  // Read functions
  "function balanceOf(address owner) view returns (uint256)",
  "function verifyAchievement(address player, string achievementId) view returns (bool)",
  // Write functions
  "function transferTokens(address to, uint256 amount) returns (bool)",
  "function recordAchievement(address player, string achievementId, string achievementTitle) returns (bool)",
];

/**
 * Verify transaction on the blockchain
 */
export async function verifyTransactionOnChain(txHash: string) {
  try {
    if (!window.ethereum) {
      throw new Error("No Ethereum provider found");
    }
    
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const receipt = await provider.getTransactionReceipt(txHash);
    
    if (receipt && receipt.blockNumber) {
      return {
        verified: true,
        blockNumber: receipt.blockNumber,
        blockHash: receipt.blockHash,
        status: receipt.status === 1 ? "success" : "failed"
      };
    }
    return { verified: false };
  } catch (error) {
    console.error("Error verifying transaction:", error);
    return { verified: false, error };
  }
}

/**
 * Update transaction status on the blockchain
 */
export async function updateTransactionStatus(transactionId: string, txHash: string) {
  const { data, error } = await supabase
    .from("blockchain_transactions")
    .update({
      transaction_hash: txHash,
      status: "submitted",
      updated_at: new Date().toISOString()
    })
    .eq("id", transactionId)
    .select()
    .maybeSingle();

  if (error) throw error;
  
  // Verify the transaction on chain and update status
  setTimeout(async () => {
    try {
      const verification = await verifyTransactionOnChain(txHash);
      
      if (verification.verified) {
        await supabase
          .from("blockchain_transactions")
          .update({
            status: verification.status === "success" ? "confirmed" : "failed",
            updated_at: new Date().toISOString()
          })
          .eq("id", transactionId);
      }
    } catch (err) {
      console.error("Error verifying blockchain transaction:", err);
    }
  }, 15000); // Check after 15 seconds for confirmation
  
  return data;
}

/**
 * Verify achievement on blockchain via smart contract
 */
export async function verifyAchievementWithContract({
  walletAddress,
  achievementId,
  contractAddress,
}: {
  walletAddress: string;
  achievementId: string;
  contractAddress: string;
}) {
  try {
    if (!window.ethereum) {
      throw new Error("No Ethereum provider found");
    }
    
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = new ethers.Contract(contractAddress, tokenContractABI, provider);
    
    const isVerified = await contract.verifyAchievement(walletAddress, achievementId);
    
    if (isVerified) {
      // Update achievement verification status in database
      const { error } = await supabase
        .from("player_achievements")
        .update({
          verified_on_chain: true,
          updated_at: new Date().toISOString()
        })
        .eq("wallet_address", walletAddress)
        .eq("achievement_id", achievementId);
      
      if (error) throw error;
    }
    
    return { verified: isVerified };
  } catch (error) {
    console.error("Error verifying achievement with contract:", error);
    return { verified: false, error };
  }
}

/**
 * Record achievement on blockchain via smart contract
 */
export async function recordAchievementWithContract({
  walletAddress,
  achievementId,
  achievementTitle,
  contractAddress,
}: {
  walletAddress: string;
  achievementId: string;
  achievementTitle: string;
  contractAddress: string;
}) {
  try {
    if (!window.ethereum) {
      throw new Error("No Ethereum provider found");
    }
    
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, tokenContractABI, signer);
    
    // Record achievement in the smart contract
    const tx = await contract.recordAchievement(walletAddress, achievementId, achievementTitle);
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    if (receipt.status === 1) {
      // Create transaction record
      const txRecord = await createBlockchainTransaction({
        walletAddress,
        type: "achievement_record",
        amount: 0,
      });
      
      // Update transaction with hash
      await updateTransactionStatus(txRecord.id, receipt.transactionHash);
      
      // Record achievement
      await recordAchievementOnChain({
        walletAddress,
        achievementId,
        achievementTitle,
        transactionId: txRecord.id,
      });
      
      return { success: true, transactionHash: receipt.transactionHash };
    }
    
    return { success: false };
  } catch (error) {
    console.error("Error recording achievement on contract:", error);
    return { success: false, error };
  }
}

/**
 * Transfer tokens via smart contract
 */
export async function transferTokensViaContract({
  walletAddress,
  amount,
  contractAddress,
}: {
  walletAddress: string;
  amount: number;
  contractAddress: string;
}) {
  try {
    if (!window.ethereum) {
      throw new Error("No Ethereum provider found");
    }
    
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, tokenContractABI, signer);
    
    // Transfer tokens via the smart contract
    const tx = await contract.transferTokens(walletAddress, amount);
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    if (receipt.status === 1) {
      // Create transaction record
      const txRecord = await createBlockchainTransaction({
        walletAddress,
        type: "token_transfer",
        amount,
      });
      
      // Update transaction with hash
      await updateTransactionStatus(txRecord.id, receipt.transactionHash);
      
      // Get current balance and update it
      const currentBalance = await getPlayerTokenBalance(walletAddress);
      await upsertPlayerTokenBalance({
        walletAddress,
        amount: (currentBalance?.balance || 0) + amount,
        pendingAmount: 0
      });
      
      return { success: true, transactionHash: receipt.transactionHash };
    }
    
    return { success: false };
  } catch (error) {
    console.error("Error transferring tokens via contract:", error);
    return { success: false, error };
  }
}

/**
 * Get token balance from smart contract
 */
export async function getTokenBalanceFromContract({
  walletAddress,
  contractAddress,
}: {
  walletAddress: string;
  contractAddress: string;
}) {
  try {
    if (!window.ethereum) {
      throw new Error("No Ethereum provider found");
    }
    
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = new ethers.Contract(contractAddress, tokenContractABI, provider);
    
    // Get token balance from the contract
    const balance = await contract.balanceOf(walletAddress);
    
    return { balance: Number(balance.toString()), success: true };
  } catch (error) {
    console.error("Error getting token balance from contract:", error);
    return { balance: 0, success: false, error };
  }
}
