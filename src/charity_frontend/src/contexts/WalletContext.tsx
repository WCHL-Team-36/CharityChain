import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { AuthClient } from "@dfinity/auth-client";
import { Identity } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { Ed25519KeyIdentity } from "@dfinity/identity";

console.log("🔥 WALLET CONTEXT: File loaded and imports completed");

// Enhanced wallet info type
interface WalletInfo {
  principal: Principal | null;
  isConnected: boolean;
  balance: bigint;
  identity?: Identity;
}

interface WalletContextType {
  wallet: WalletInfo;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  isLoading: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // CHROME COMPATIBILITY DEBUG
  console.log('🚀 WalletProvider: Component initialized');
  console.error('🚨🚨🚨 WALLET PROVIDER STARTING - THIS MUST APPEAR!');
  
  // Chrome-safe storage detection
  const isStorageAvailable = () => {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      console.error('❌ Chrome localStorage blocked:', e);
      return false;
    }
  };

  console.log('🔍 Chrome storage available:', isStorageAvailable());
  
  // State management
  const [wallet, setWallet] = useState<WalletInfo>({
    principal: null,
    isConnected: false,
    balance: BigInt(0),
  });
  const [isLoading, setIsLoading] = useState(false);

  console.log('🚀 WalletProvider: State initialized');
  console.log('🚀 WalletProvider: Initial wallet state:', {
    isConnected: wallet.isConnected,
    principal: wallet.principal?.toString(),
    hasIdentity: !!wallet.identity
  });  // Core initialization - runs on every page load/refresh
  useEffect(() => {
    console.log("🚀 WalletContext: MAIN useEffect triggered - FRESH LOAD OR REFRESH");
    console.log("🚀 Current URL:", window.location.href);
    console.log("🚀 Current timestamp:", new Date().toISOString());

    // ULTRA AGGRESSIVE WALLET RESTORATION - MULTI-STRATEGY APPROACH
    const ultimateWalletRestore = async () => {
      console.log("🔥🔥🔥 ULTIMATE WALLET RESTORE: Starting MAXIMUM FORCE restoration...");

      try {
        // Strategy 1: Check all possible storage locations and key variations
        console.log("📦 STEP 1: Comprehensive storage inspection...");

        const storageKeys = ["wallet_connected", "wallet_principal", "wallet_private_key", "dev_wallet_connected", "dev_wallet_principal", "dev_wallet_private_key"];

        console.log("📦 LocalStorage contents:");
        storageKeys.forEach((key) => {
          const value = localStorage.getItem(key);
          console.log(`   ${key}: ${value ? (key.includes("private") ? "EXISTS(length=" + value.length + ")" : value) : "null"}`);
        });

        console.log("📦 SessionStorage contents:");
        storageKeys.forEach((key) => {
          const value = sessionStorage.getItem(key);
          console.log(`   ${key}: ${value ? (key.includes("private") ? "EXISTS(length=" + value.length + ")" : value) : "null"}`);
        });

        // Strategy 2: Try multiple combinations of keys
        const attempts = [
          {
            name: "SessionStorage Standard",
            connected: sessionStorage.getItem("wallet_connected"),
            principal: sessionStorage.getItem("wallet_principal"),
            privateKey: sessionStorage.getItem("wallet_private_key"),
          },
          {
            name: "LocalStorage Standard",
            connected: localStorage.getItem("wallet_connected"),
            principal: localStorage.getItem("wallet_principal"),
            privateKey: localStorage.getItem("wallet_private_key"),
          },
          {
            name: "LocalStorage Dev Keys",
            connected: localStorage.getItem("dev_wallet_connected"),
            principal: localStorage.getItem("dev_wallet_principal"),
            privateKey: localStorage.getItem("dev_wallet_private_key"),
          },
          {
            name: "SessionStorage Dev Keys",
            connected: sessionStorage.getItem("dev_wallet_connected"),
            principal: sessionStorage.getItem("dev_wallet_principal"),
            privateKey: sessionStorage.getItem("dev_wallet_private_key"),
          },
          {
            name: "Mixed Keys (localStorage)",
            connected: localStorage.getItem("wallet_connected"),
            principal: localStorage.getItem("wallet_principal"),
            privateKey: localStorage.getItem("dev_wallet_private_key"),
          },
        ];

        for (const attempt of attempts) {
          console.log(`🔍 ATTEMPTING: ${attempt.name}`);
          console.log(`   Connected: ${attempt.connected}`);
          console.log(`   Principal: ${attempt.principal ? attempt.principal.substring(0, 20) + "..." : "null"}`);
          console.log(`   PrivateKey: ${attempt.privateKey ? "EXISTS(length=" + attempt.privateKey.length + ")" : "null"}`);

          if (attempt.connected === "true" && attempt.principal && attempt.privateKey) {
            console.log(`🎯 VALID DATA FOUND IN: ${attempt.name}`);

            try {
              // Parse and restore identity
              console.log("🔑 Parsing private key...");
              const privateKeyArray = JSON.parse(attempt.privateKey);
              const privateKey = new Uint8Array(privateKeyArray);

              console.log("🔑 Creating identity from private key...");
              const identity = Ed25519KeyIdentity.fromSecretKey(privateKey);
              const restoredPrincipal = identity.getPrincipal();

              console.log("✅ IDENTITY RESTORATION SUCCESS!");
              console.log("   Stored principal:    ", attempt.principal);
              console.log("   Restored principal:  ", restoredPrincipal.toString());
              console.log("   Principals match:    ", attempt.principal === restoredPrincipal.toString());

              // Set wallet state immediately
              const walletState = {
                principal: restoredPrincipal,
                isConnected: true,
                balance: BigInt(0),
                identity,
              };

              console.log("📱 SETTING WALLET STATE NOW...");
              setWallet(walletState);

              // Save to all storage locations for maximum persistence
              const persistData = {
                connected: "true",
                principal: restoredPrincipal.toString(),
                privateKey: JSON.stringify(Array.from(privateKey)),
              };

              console.log("💾 SAVING TO ALL STORAGE LOCATIONS FOR REDUNDANCY...");

              // Save to localStorage
              localStorage.setItem("wallet_connected", persistData.connected);
              localStorage.setItem("wallet_principal", persistData.principal);
              localStorage.setItem("wallet_private_key", persistData.privateKey);
              localStorage.setItem("dev_wallet_connected", persistData.connected);
              localStorage.setItem("dev_wallet_principal", persistData.principal);
              localStorage.setItem("dev_wallet_private_key", persistData.privateKey);

              // Save to sessionStorage
              sessionStorage.setItem("wallet_connected", persistData.connected);
              sessionStorage.setItem("wallet_principal", persistData.principal);
              sessionStorage.setItem("wallet_private_key", persistData.privateKey);
              sessionStorage.setItem("dev_wallet_connected", persistData.connected);
              sessionStorage.setItem("dev_wallet_principal", persistData.principal);
              sessionStorage.setItem("dev_wallet_private_key", persistData.privateKey);

              console.log("🎉🎉🎉 WALLET RESTORATION COMPLETED SUCCESSFULLY!");
              console.log("🎉 Strategy used:", attempt.name);
              console.log("🎉 Principal:", restoredPrincipal.toString());
              console.log("🎉 Current time:", new Date().toISOString());

              return true; // Success!
            } catch (identityError) {
              console.error(`❌ Identity restoration failed for ${attempt.name}:`, identityError);
              continue; // Try next attempt
            }
          } else {
            console.log(`❌ Invalid data in: ${attempt.name}`);
          }
        }

        console.log("❌ ALL RESTORATION ATTEMPTS FAILED - NO VALID WALLET DATA FOUND");
        return false;
      } catch (error) {
        console.error("❌ ULTIMATE WALLET RESTORE FAILED:", error);
        return false;
      }
    };

    // Execute with multiple timings for maximum reliability
    console.log("🔥 ATTEMPT 1: Immediate execution");
    ultimateWalletRestore();

    setTimeout(() => {
      console.log("🔥 ATTEMPT 2: 25ms delay");
      ultimateWalletRestore();
    }, 25);

    setTimeout(() => {
      console.log("🔥 ATTEMPT 3: 100ms delay");
      ultimateWalletRestore();
    }, 100);

    setTimeout(() => {
      console.log("🔥 ATTEMPT 4: 300ms delay");
      ultimateWalletRestore();
    }, 300);

    setTimeout(() => {
      console.log("🔥 FINAL ATTEMPT: 1000ms delay");
      ultimateWalletRestore();
    }, 1000);
  }, []); // Empty dependency array - only run on mount

  const connectWallet = async () => {
    // EXTREME DEBUG: Multiple ways to log start
    console.log("🔗🔗🔗 connectWallet: Starting LOCAL DEVELOPMENT connection...");
    console.error("❗ CONNECT WALLET FUNCTION CALLED - THIS SHOULD ALWAYS APPEAR");
    alert("🚨 connectWallet function triggered! Check console.");
    console.log("🔗 TIMESTAMP:", new Date().toISOString());
    console.log("🔗 CURRENT URL:", window.location.href);

    try {
      setIsLoading(true);

      // FOR LOCAL DEVELOPMENT: Use persistent Ed25519KeyIdentity instead of Internet Identity
      console.log("🏠 LOCAL DEV MODE: Creating persistent local identity...");

      // IMMEDIATE CHECK: Test if storage is working
      console.log("🧪 STORAGE TEST: Testing if localStorage works...");
      try {
        localStorage.setItem("test_storage", "working");
        const testResult = localStorage.getItem("test_storage");
        console.log("🧪 STORAGE TEST RESULT:", testResult);
        localStorage.removeItem("test_storage");
      } catch (storageError) {
        console.error("🧪 STORAGE TEST FAILED:", storageError);
      }

      // Check if we already have a saved identity
      const savedPrivateKey = localStorage.getItem("dev_wallet_private_key");
      let identity: Ed25519KeyIdentity;
      let principal: Principal;

      if (savedPrivateKey) {
        console.log("🔑 Restoring existing local development identity...");
        console.log("🔑 Saved private key length:", savedPrivateKey.length);
        try {
          const privateKeyBytes = new Uint8Array(JSON.parse(savedPrivateKey));
          identity = Ed25519KeyIdentity.fromSecretKey(privateKeyBytes);
          principal = identity.getPrincipal();
          console.log("✅ Restored identity:", principal.toString());
        } catch (error) {
          console.log("❌ Failed to restore, creating new identity...", error);
          identity = Ed25519KeyIdentity.generate();
          principal = identity.getPrincipal();
        }
      } else {
        console.log("🆕 Creating new local development identity...");
        identity = Ed25519KeyIdentity.generate();
        principal = identity.getPrincipal();
      }

      const keyPair = identity.getKeyPair();
      const privateKeyBytes = new Uint8Array(keyPair.secretKey);

      console.log("🔑 Identity details:");
      console.log("- Principal:", principal.toString());
      console.log("- Private key length:", privateKeyBytes.length);
      console.log("- KeyPair type:", typeof keyPair);

      // Store wallet data with MAXIMUM REDUNDANCY AND IMMEDIATE VERIFICATION
      console.log("💾💾💾 SAVING WALLET DATA WITH MAXIMUM FORCE...");

      const persistData = {
        connected: "true",
        principal: principal.toString(),
        privateKey: JSON.stringify(Array.from(privateKeyBytes)),
      };

      console.log("💾 Data to save:");
      console.log("- Connected:", persistData.connected);
      console.log("- Principal:", persistData.principal);
      console.log("- Private key array length:", Array.from(privateKeyBytes).length);

      // STEP 1: Save to localStorage with multiple key names
      console.log("💾 STEP 1: Saving to localStorage...");
      try {
        localStorage.setItem("wallet_connected", persistData.connected);
        localStorage.setItem("wallet_principal", persistData.principal);
        localStorage.setItem("wallet_private_key", persistData.privateKey);
        localStorage.setItem("dev_wallet_connected", persistData.connected);
        localStorage.setItem("dev_wallet_principal", persistData.principal);
        localStorage.setItem("dev_wallet_private_key", persistData.privateKey);
        console.log("✅ localStorage saved successfully");
      } catch (localError) {
        console.error("❌ localStorage save failed:", localError);
      }

      // STEP 2: Save to sessionStorage with multiple key names
      console.log("💾 STEP 2: Saving to sessionStorage...");
      try {
        sessionStorage.setItem("wallet_connected", persistData.connected);
        sessionStorage.setItem("wallet_principal", persistData.principal);
        sessionStorage.setItem("wallet_private_key", persistData.privateKey);
        sessionStorage.setItem("dev_wallet_connected", persistData.connected);
        sessionStorage.setItem("dev_wallet_principal", persistData.principal);
        sessionStorage.setItem("dev_wallet_private_key", persistData.privateKey);
        console.log("✅ sessionStorage saved successfully");
      } catch (sessionError) {
        console.error("❌ sessionStorage save failed:", sessionError);
      }

      // STEP 3: IMMEDIATE VERIFICATION
      console.log("🔍🔍🔍 IMMEDIATE VERIFICATION OF SAVED DATA...");

      const verificationResults = {
        localStorage: {
          wallet_connected: localStorage.getItem("wallet_connected"),
          wallet_principal: localStorage.getItem("wallet_principal"),
          wallet_private_key_length: localStorage.getItem("wallet_private_key")?.length || 0,
          dev_wallet_connected: localStorage.getItem("dev_wallet_connected"),
          dev_wallet_principal: localStorage.getItem("dev_wallet_principal"),
          dev_wallet_private_key_length: localStorage.getItem("dev_wallet_private_key")?.length || 0,
        },
        sessionStorage: {
          wallet_connected: sessionStorage.getItem("wallet_connected"),
          wallet_principal: sessionStorage.getItem("wallet_principal"),
          wallet_private_key_length: sessionStorage.getItem("wallet_private_key")?.length || 0,
          dev_wallet_connected: sessionStorage.getItem("dev_wallet_connected"),
          dev_wallet_principal: sessionStorage.getItem("dev_wallet_principal"),
          dev_wallet_private_key_length: sessionStorage.getItem("dev_wallet_private_key")?.length || 0,
        },
      };

      console.log("🔍 VERIFICATION RESULTS:");
      console.log("📦 localStorage:", verificationResults.localStorage);
      console.log("📦 sessionStorage:", verificationResults.sessionStorage);

      // Check if verification passed
      const localStorageOK = verificationResults.localStorage.wallet_connected === "true" && verificationResults.localStorage.wallet_principal === principal.toString() && verificationResults.localStorage.wallet_private_key_length > 0;

      const sessionStorageOK =
        verificationResults.sessionStorage.wallet_connected === "true" && verificationResults.sessionStorage.wallet_principal === principal.toString() && verificationResults.sessionStorage.wallet_private_key_length > 0;

      console.log("🔍 VERIFICATION STATUS:");
      console.log("✅ localStorage OK:", localStorageOK);
      console.log("✅ sessionStorage OK:", sessionStorageOK);

      if (!localStorageOK) {
        console.error("❌ localStorage verification FAILED - Data not saved properly");
      }
      if (!sessionStorageOK) {
        console.error("❌ sessionStorage verification FAILED - Data not saved properly");
      }

      // STEP 4: Update React state
      console.log("📱 STEP 4: Updating React wallet state...");
      const newWalletState = {
        principal,
        isConnected: true,
        balance: BigInt(0),
        identity,
      };

      setWallet(newWalletState);
      console.log("✅ React state updated:", {
        principal: newWalletState.principal.toString(),
        isConnected: newWalletState.isConnected,
        hasIdentity: !!newWalletState.identity,
      });

      console.log("🎉🎉🎉 LOCAL DEV connectWallet: Connection completed successfully");
      console.log("🎯 This identity SHOULD persist across page refreshes!");
      console.log("🎯 Principal to remember:", principal.toString());

      // STEP 5: Send message to test tool (if open)
      try {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: "wallet_connected", principal: principal.toString() }, "*");
        }
      } catch (e) {
        console.log("Note: Could not send message to parent window (normal if test tool not open)");
      }
    } catch (error) {
      console.error("❌❌❌ connectWallet: CRITICAL ERROR:", error);
      console.error("❌ Error stack:", error.stack);
    } finally {
      setIsLoading(false);
      console.log("🔗 connectWallet: Process completed (loading set to false)");
    }
  };

  const disconnectWallet = async () => {
    console.log("🔌 disconnectWallet: Starting disconnection...");

    try {
      // Clear all storage
      localStorage.removeItem("wallet_connected");
      localStorage.removeItem("wallet_principal");
      localStorage.removeItem("wallet_private_key");

      // Reset state
      setWallet({
        principal: null,
        isConnected: false,
        balance: BigInt(0),
      });

      console.log("✅ disconnectWallet: Disconnection completed");
    } catch (error) {
      console.error("❌ disconnectWallet: Error:", error);
    }
  };

  // Monitor wallet state changes
  useEffect(() => {
    console.log("🔄 WALLET STATE CHANGED:", {
      isConnected: wallet.isConnected,
      principal: wallet.principal?.toString(),
      hasIdentity: !!wallet.identity,
      isLoading,
    });
  }, [wallet, isLoading]);

  return <WalletContext.Provider value={{ wallet, connectWallet, disconnectWallet, isLoading }}>{children}</WalletContext.Provider>;
};

console.log("✅ WALLET CONTEXT: All exports defined");
