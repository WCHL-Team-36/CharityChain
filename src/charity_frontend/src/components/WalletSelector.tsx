// WalletSelector Component
// Add this component to easily switch between different wallets

import React from "react";
import { WalletType, useWallet } from "../contexts/EnhancedWalletContext";

const WalletSelector: React.FC = () => {
  const { wallet, connectWallet, disconnectWallet, isLoading, availableWallets } = useWallet();

  const walletInfo = {
    [WalletType.DEVELOPMENT]: {
      name: "Development Wallet",
      description: "For testing purposes only",
      icon: "🔧",
      color: "bg-gray-500",
    },
    [WalletType.INTERNET_IDENTITY]: {
      name: "Internet Identity",
      description: "Official IC wallet with biometric auth",
      icon: "🛡️",
      color: "bg-blue-500",
    },
    [WalletType.PLUG]: {
      name: "Plug Wallet",
      description: "Popular browser extension wallet",
      icon: "🔌",
      color: "bg-purple-500",
    },
    [WalletType.STOIC]: {
      name: "Stoic Wallet",
      description: "Web-based wallet with NFT support",
      icon: "💎",
      color: "bg-green-500",
    },
    [WalletType.BITFINITY]: {
      name: "Bitfinity Wallet",
      description: "Cross-chain DeFi wallet",
      icon: "♾️",
      color: "bg-orange-500",
    },
  };

  const handleConnect = async (type: WalletType) => {
    try {
      await connectWallet(type);
    } catch (error) {
      console.error(`Failed to connect ${type}:`, error);
      // You might want to show a toast notification here
      alert(`Failed to connect ${walletInfo[type].name}: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  if (wallet && wallet.isConnected) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
        <div className="text-center">
          <div className="text-4xl mb-2">{wallet?.walletType ? walletInfo[wallet.walletType].icon : "👤"}</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{wallet?.walletType ? walletInfo[wallet.walletType].name : "Unknown Wallet"}</h3>
          <p className="text-sm text-gray-600 mb-4">{wallet?.principal?.toString().slice(0, 20) || "N/A"}...</p>
          <button onClick={disconnectWallet} className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors">
            Disconnect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">Connect Your Wallet</h2>

      <div className="space-y-3">
        {availableWallets.map((walletType) => {
          const info = walletInfo[walletType];
          return (
            <button
              key={walletType}
              onClick={() => handleConnect(walletType)}
              disabled={isLoading}
              className={`w-full p-4 rounded-lg border-2 border-gray-200 hover:border-gray-300 
                         transition-all duration-200 text-left group
                         ${isLoading ? "opacity-50 cursor-not-allowed" : "hover:shadow-md"}`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full ${info.color} flex items-center justify-center text-white text-lg`}>{info.icon}</div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800 group-hover:text-gray-900">{info.name}</h3>
                  <p className="text-sm text-gray-600">{info.description}</p>
                </div>
                <div className="text-gray-400 group-hover:text-gray-600">→</div>
              </div>
            </button>
          );
        })}
      </div>

      {!availableWallets.includes(WalletType.PLUG) && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            💡 Install{" "}
            <a href="https://plugwallet.ooo/" target="_blank" rel="noopener noreferrer" className="font-medium underline">
              Plug Wallet
            </a>{" "}
            for the best experience
          </p>
        </div>
      )}

      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">{isLoading ? "Connecting..." : "Choose your preferred wallet to continue"}</p>
      </div>
    </div>
  );
};

export default WalletSelector;
