import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
import { connectPlugAbsolute, approveTransactionAbsolute } from "../services/absoluteProtection";

// Types for our wallet context
interface WalletState {
  isConnected: boolean;
  principal: string | null;
  principalText: string | null;
  accountId: string | null;
  balance: number;
  isLoading: boolean;
  error: string | null;
}

interface WalletContextType {
  walletState: WalletState;
  connectWallet: (walletType?: string) => Promise<boolean>;
  disconnectWallet: () => void;
  approveTransaction: (amount: number) => Promise<boolean>;
  refreshBalance: () => Promise<void>;

  // Compatibility properties for old interface
  wallet: {
    principal: any;
    isConnected: boolean;
    balance: bigint;
    identity?: any;
    walletType?: string;
    approveTransaction?: (amount: number) => Promise<boolean>;
  };
  isLoading: boolean;
  availableWallets?: any[];
  isConnecting?: boolean;
}

// Create the context
const WalletContext = createContext<WalletContextType | null>(null);

// Initial state
const initialState: WalletState = {
  isConnected: false,
  principal: null,
  principalText: null,
  accountId: null,
  balance: 0,
  isLoading: false,
  error: null,
};

// Provider component
export const EnhancedWalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [walletState, setWalletState] = useState<WalletState>(initialState);
  const [isRestoring, setIsRestoring] = useState(false); // Add flag to prevent multiple restoration calls
  const hasAttemptedRestore = useRef(false); // Ref to track if restoration was already attempted

  // Save wallet state to localStorage
  const saveWalletState = (state: WalletState) => {
    try {
      if (typeof window !== "undefined" && state.isConnected) {
        const stateToSave = {
          isConnected: state.isConnected,
          principal: state.principal, // Save principal too
          principalText: state.principalText,
          accountId: state.accountId,
          balance: state.balance,
          timestamp: Date.now(), // Add timestamp for expiry check
        };
        localStorage.setItem("charitychain_wallet_state", JSON.stringify(stateToSave));
        console.log("💾 Wallet state saved to localStorage:", stateToSave);
      }
    } catch (error) {
      console.warn("⚠️ Could not save wallet state:", error);
    }
  };

  // Load wallet state from localStorage
  const loadWalletState = (): any => {
    try {
      if (typeof window !== "undefined") {
        const savedState = localStorage.getItem("charitychain_wallet_state");
        if (savedState) {
          const parsed = JSON.parse(savedState);
          // Check if state is not too old (max 24 hours)
          const maxAge = 24 * 60 * 60 * 1000; // 24 hours
          if (Date.now() - parsed.timestamp < maxAge) {
            console.log("📂 Loaded wallet state from localStorage");
            return parsed;
          } else {
            console.log("⏰ Saved wallet state expired, clearing...");
            localStorage.removeItem("charitychain_wallet_state");
          }
        }
      }
    } catch (error) {
      console.warn("⚠️ Could not load wallet state:", error);
    }
    return null;
  };

  // Clear wallet state from localStorage
  const clearWalletState = () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("charitychain_wallet_state");
        console.log("🗑️ Wallet state cleared from localStorage");
      }
    } catch (error) {
      console.warn("⚠️ Could not clear wallet state:", error);
    }
  };

  // Enhanced silent restoration with localStorage
  useEffect(() => {
    const silentRestore = async () => {
      // Double protection against multiple executions
      if (isRestoring || hasAttemptedRestore.current) {
        console.log("🔄 Restoration already in progress or completed, skipping...");
        return;
      }

      hasAttemptedRestore.current = true;
      setIsRestoring(true);

      try {
        console.log("🔄 Attempting enhanced silent wallet restoration...");

        // First try to load from localStorage
        const savedState = loadWalletState();
        if (savedState) {
          console.log("📂 Found saved wallet state, attempting restoration...");

          // IMMEDIATE RESTORE: Trust localStorage and restore immediately
          console.log("⚡ Immediate restore from localStorage...");
          setWalletState({
            isConnected: true,
            principal: savedState.principal || savedState.principalText,
            principalText: savedState.principalText,
            accountId: savedState.accountId,
            balance: savedState.balance,
            isLoading: false,
            error: null,
          });
          console.log("✅ Wallet state restored immediately from localStorage");

          // BACKGROUND VERIFICATION: Check Plug connection in background (only once)
          if (typeof window !== "undefined" && window.ic?.plug) {
            console.log("🔌 Starting background verification of Plug connection...");

            // Run verification in background without blocking - but only once per session
            const verificationKey = `verification_${Date.now()}`;
            setTimeout(async () => {
              try {
                console.log("🔍 Background: About to call isConnected()...");

                // Add timeout for isConnected call
                const isConnectedPromise = window.ic.plug.isConnected();
                const timeoutPromise = new Promise(
                  (_, reject) => setTimeout(() => reject(new Error("isConnected timeout")), 5000) // 5 second timeout for background check
                );

                const isConnected = await Promise.race([isConnectedPromise, timeoutPromise]);
                console.log("📊 Background verification result:", isConnected);

                if (!isConnected) {
                  // If Plug is not connected, try silent reconnection
                  console.log("🔌 Background: Plug disconnected, attempting silent reconnection...");
                  const reconnectResult = await connectPlugAbsolute();

                  if (reconnectResult.success && reconnectResult.data) {
                    const newState = {
                      isConnected: true,
                      principal: reconnectResult.data.principal,
                      principalText: reconnectResult.data.principal,
                      accountId: reconnectResult.data.accountId,
                      balance: reconnectResult.data.balance,
                      isLoading: false,
                      error: null,
                    };

                    setWalletState(newState);
                    saveWalletState(newState);

                    console.log("✅ Background silent reconnection successful");
                  } else {
                    console.log("❌ Background: Silent reconnection failed, keeping current state");
                    // Don't clear state - keep showing connected state for better UX
                    console.log("⚠️ Keeping localStorage state despite background reconnection failure");
                  }
                } else {
                  console.log("✅ Background verification: Plug is still connected");
                }
              } catch (plugError) {
                console.log("🔌 Background verification failed:", plugError);
                // Don't clear state on background verification failure
                console.log("⚠️ Keeping localStorage state despite verification failure");
              }
            }, 3000); // Longer delay to let page fully load and avoid conflicts

            // Complete restoration process immediately
            console.log("🏁 Immediate restoration from localStorage completed");
            setIsRestoring(false);
            return; // Exit early since we already restored
          } else {
            console.log("🚫 Plug wallet not available during restoration");
            console.log("🏁 Restoration completed without background verification");
            setIsRestoring(false);
            return;
          }
        }

        // No saved state or restoration failed - try normal Plug detection
        console.log("📭 No valid saved state found, trying normal detection...");
        if (typeof window !== "undefined" && window.ic?.plug) {
          console.log("🔍 Checking Plug connection for normal detection...");

          try {
            // Add timeout for normal detection isConnected call too
            const isConnectedPromise = window.ic.plug.isConnected();
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Normal detection isConnected timeout")), 3000));

            const isConnected = await Promise.race([isConnectedPromise, timeoutPromise]);
            console.log("📊 Normal detection isConnected:", isConnected);

            if (isConnected) {
              console.log("✅ Plug wallet found connected, restoring state...");

              const principal = await window.ic.plug.getPrincipal();
              const principalText = principal.toString();

              // Get account ID - for local development, use principal as fallback
              let accountId = principalText;
              try {
                const plugWallet = window.ic.plug as any;
                if (plugWallet.getAccountID && typeof plugWallet.getAccountID === "function") {
                  accountId = await plugWallet.getAccountID();
                }
              } catch (error) {
                console.warn("⚠️ Using principal as account ID:", error);
              }

              // Get balance - handle local development gracefully
              let balance = 0;
              try {
                const plugWallet = window.ic.plug as any;
                if (plugWallet.requestBalance && typeof plugWallet.requestBalance === "function") {
                  const balanceResponse = await plugWallet.requestBalance();
                  const ckusdtBalance = balanceResponse.find((item: any) => item.name === "ckUSDT" || item.symbol === "ckUSDT");
                  balance = ckusdtBalance ? parseFloat(ckusdtBalance.amount) : 0;
                }
              } catch (balanceError) {
                console.warn("⚠️ Could not fetch balance during restoration:", balanceError);
              }

              const newState = {
                isConnected: true,
                principal: principal,
                principalText: principalText,
                accountId: accountId,
                balance: balance,
                isLoading: false,
                error: null,
              };

              setWalletState(newState);
              saveWalletState(newState);

              console.log("✅ Silent restoration successful!", {
                principalText,
                accountId,
                balance,
              });
            } else {
              console.log("📱 Plug wallet not connected, skipping restoration");
              setWalletState({ ...initialState, isLoading: false });
            }
          } catch (normalDetectionError) {
            console.log("❌ Normal detection isConnected failed:", normalDetectionError);
            setWalletState({ ...initialState, isLoading: false });
          }
        } else {
          console.log("🔌 Plug wallet not available for normal detection");
          setWalletState({ ...initialState, isLoading: false });
        }

        console.log("🏁 Silent restoration completed");
      } catch (error) {
        console.error("❌ Silent restoration error:", error);
        console.error("❌ Error stack:", error.stack);
        clearWalletState();
        setWalletState({ ...initialState, isLoading: false, error: "Restoration failed" });
      } finally {
        setIsRestoring(false); // Always reset the flag
      }
    };

    // Only run restoration if not already attempted
    silentRestore();
  }, []); // Keep empty dependencies

  // Connect wallet function
  const connectWallet = async (walletType?: string): Promise<boolean> => {
    console.log("🚀 ENHANCED WALLET: connectWallet function called with type:", walletType);

    try {
      console.log("🔄 Setting loading state...");
      setWalletState({ ...initialState, isLoading: true });

      console.log("🔌 Starting wallet connection...");
      console.log("🔍 About to call connectPlugAbsolute...");

      const result = await connectPlugAbsolute();

      console.log("📊 Connection result:", result);
      console.log("📊 Result type:", typeof result);
      console.log("📊 Result keys:", Object.keys(result));
      console.log("📊 Result.success:", result.success);
      console.log("📊 Result.data:", result.data);

      // connectPlugAbsolute returns { success: boolean, data?: {...}, error?: string }
      if (result.success && result.data) {
        console.log("✅ Wallet connected successfully!");
        console.log("📋 Principal:", result.data.principal);
        console.log("🆔 Account ID:", result.data.accountId);
        console.log("💰 Balance:", result.data.balance);

        setWalletState({
          isConnected: true,
          principal: result.data.principal,
          principalText: result.data.principal.toString(),
          accountId: result.data.accountId,
          balance: result.data.balance || 0,
          isLoading: false,
          error: null,
        });

        // Save wallet state to localStorage
        saveWalletState({
          isConnected: true,
          principal: result.data.principal,
          principalText: result.data.principal.toString(),
          accountId: result.data.accountId,
          balance: result.data.balance || 0,
          isLoading: false,
          error: null,
        });

        return true;
      } else {
        console.error("❌ Connection failed. Success:", result.success);
        console.error("❌ Data:", result.data);
        console.error("❌ Error:", result.error);
        setWalletState({ ...initialState, isLoading: false });
        return false;
      }
    } catch (error) {
      console.error("❌ Connect wallet error:", error);
      console.error("❌ Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      setWalletState({ ...initialState, isLoading: false });
      return false;
    }
  };

  // Disconnect wallet function
  const disconnectWallet = () => {
    try {
      setWalletState(initialState);
      clearWalletState(); // Clear localStorage on disconnect
      hasAttemptedRestore.current = false; // Reset restoration flag for future connections
      console.log("👋 Wallet disconnected");
    } catch (error) {
      console.error("❌ Disconnect error:", error);
    }
  };

  // Approve transaction function
  const approveTransaction = async (amount: number): Promise<boolean> => {
    try {
      console.log("💰 Starting transaction approval for amount:", amount);

      const result = await approveTransactionAbsolute(amount);

      if (result.success) {
        console.log("✅ Transaction approved successfully!");
        // Refresh balance after successful transaction
        await refreshBalance();
        return true;
      } else {
        console.error("❌ Transaction approval failed:", result.error);
        return false;
      }
    } catch (error) {
      console.error("❌ Approve transaction error:", error);
      return false;
    }
  };

  // Refresh balance function
  const refreshBalance = async (): Promise<void> => {
    try {
      if (!walletState.isConnected || !window.ic?.plug) return;

      // Handle balance refresh gracefully for local development
      const plugWallet = window.ic.plug as any;
      if (plugWallet.requestBalance && typeof plugWallet.requestBalance === "function") {
        const balanceResponse = await plugWallet.requestBalance();
        const ckusdtBalance = balanceResponse.find((item: any) => item.name === "ckUSDT" || item.symbol === "ckUSDT");
        const newBalance = ckusdtBalance ? parseFloat(ckusdtBalance.amount) : 0;

        setWalletState((currentState) => ({
          ...currentState,
          balance: newBalance,
        }));
        console.log("💰 Balance refreshed:", newBalance);
      } else {
        console.log("💰 Balance refresh skipped for local development");
      }
    } catch (error) {
      console.error("❌ Refresh balance error:", error);
    }
  };

  const contextValue: WalletContextType = {
    walletState,
    connectWallet,
    disconnectWallet,
    approveTransaction,
    refreshBalance,

    // Compatibility properties for old interface
    wallet: {
      principal: walletState.principal ? { toString: () => walletState.principalText } : null,
      isConnected: walletState.isConnected,
      balance: BigInt(Math.floor(walletState.balance * 100000000)), // Convert to bigint
      identity: undefined,
      walletType: WalletType.PLUG, // Always PLUG for this context
      approveTransaction: approveTransaction, // Add the function
    },
    isLoading: walletState.isLoading,
    availableWallets: [], // Empty array for compatibility
    isConnecting: walletState.isLoading,
  };

  return <WalletContext.Provider value={contextValue}>{children}</WalletContext.Provider>;
};

// Hook to use wallet context
export const useEnhancedWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useEnhancedWallet must be used within an EnhancedWalletProvider");
  }
  return context;
};

// Export types for use in other files
export type { WalletState, WalletContextType };

// Compatibility aliases for existing code
export const WalletProvider = EnhancedWalletProvider;
export const useWallet = useEnhancedWallet;

// Export dummy WalletType for compatibility
export enum WalletType {
  PLUG = "PLUG",
  STOIC = "STOIC",
  NFID = "NFID",
  BITFINITY = "BITFINITY",
  INTERNET_IDENTITY = "INTERNET_IDENTITY",
  DEVELOPMENT = "DEVELOPMENT",
}
