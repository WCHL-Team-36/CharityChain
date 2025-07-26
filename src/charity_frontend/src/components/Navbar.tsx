import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWallet, WalletType } from '../contexts/EnhancedWalletContext';

const Navbar: React.FC = () => {
  const { wallet, connectWallet, disconnectWallet, isLoading, availableWallets, isConnecting } = useWallet();
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const walletSelectorRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (walletSelectorRef.current && !walletSelectorRef.current.contains(event.target as Node)) {
        setShowWalletSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const formatPrincipal = (principal: string) => {
    if (principal.length <= 12) return principal;
    return `${principal.slice(0, 6)}...${principal.slice(-6)}`;
  };

  const getWalletIcon = (type: WalletType) => {
    switch (type) {
      case WalletType.PLUG: return '🔌';
      case WalletType.INTERNET_IDENTITY: return '🆔';
      case WalletType.STOIC: return '💼';
      case WalletType.BITFINITY: return '♾️';
      case WalletType.DEVELOPMENT: return '🔧';
      default: return '👛';
    }
  };

  const getWalletName = (type: WalletType) => {
    switch (type) {
      case WalletType.PLUG: return 'Plug Wallet';
      case WalletType.INTERNET_IDENTITY: return 'Internet Identity';
      case WalletType.STOIC: return 'Stoic Wallet';
      case WalletType.BITFINITY: return 'Bitfinity Wallet';
      case WalletType.DEVELOPMENT: return 'Development Wallet';
      default: return 'Unknown Wallet';
    }
  };

  const handleWalletConnect = async (walletType: WalletType) => {
    console.log('🎯 NAVBAR: handleWalletConnect called with wallet type:', walletType);
    console.log('🎯 NAVBAR: isConnecting state:', isConnecting);
    
    // Prevent double-clicking during connection
    if (isConnecting) {
      console.log('🔄 Connection already in progress, ignoring duplicate click');
      return;
    }

    try {
      console.log('🎯 NAVBAR: About to call connectWallet...');
      const result = await connectWallet(walletType);
      console.log('🎯 NAVBAR: connectWallet result:', result);
      
      setShowWalletSelector(false);
      console.log('🎯 NAVBAR: Wallet selector closed');
    } catch (error) {
      console.error('🎯 NAVBAR: Wallet connection failed:', error);
      // Keep selector open to try again
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and main navigation */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">❤️</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">CharityChain</span>
            </Link>
            
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              <Link
                to="/"
                className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/')
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                🏠 Home
              </Link>
              <Link
                to="/campaigns"
                className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/campaigns')
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                ✨ Campaigns
              </Link>
              <Link
                to="/create-campaign"
                className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/create-campaign')
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                🚀 Start
              </Link>
              {wallet && wallet.isConnected && (
                <>
                  <Link
                    to="/dashboard"
                    className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/dashboard')
                        ? 'bg-orange-50 text-orange-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    📊 Dashboard
                  </Link>
                  <Link
                    to="/nfts"
                    className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/nfts')
                        ? 'bg-orange-50 text-orange-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    🎨 My NFTs
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Wallet connection */}
          <div className="flex items-center space-x-4">
            {wallet && wallet.isConnected ? (
              <div className="flex items-center space-x-4">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-sm font-medium text-gray-900">
                    {getWalletIcon((wallet.walletType as WalletType) || WalletType.DEVELOPMENT)} {formatPrincipal(wallet.principal?.toString() || '')}
                  </span>
                  <span className="text-xs text-gray-500">
                    Balance: {wallet.balance?.toString() || '0'} ckUSDT
                  </span>
                </div>
                <button
                  onClick={disconnectWallet}
                  disabled={isLoading}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-3 py-2 rounded-lg transition-colors text-sm"
                >
                  {isLoading ? '⏳' : '👋 Disconnect'}
                </button>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setShowWalletSelector(!showWalletSelector)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Connect Wallet
                </button>
                
                {showWalletSelector && (
                  <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50">
                    <h3 className="font-semibold text-gray-900 mb-3">Connect Your Wallet</h3>
                    
                    {/* Plug Wallet Detection Status */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Extension Status:</span>
                      </div>
                      {typeof window !== 'undefined' && window.ic?.plug ? (
                        <div className="flex items-center text-green-600">
                          <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                          <span className="text-sm">Plug Wallet detected ✅</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center text-red-600">
                            <span className="w-2 h-2 bg-red-600 rounded-full mr-2"></span>
                            <span className="text-sm">Plug Wallet not detected ❌</span>
                          </div>
                          <div className="text-xs text-gray-600 bg-yellow-50 p-2 rounded border-l-3 border-yellow-400">
                            <strong>📝 Instructions:</strong><br/>
                            1. Install <a href="https://plugwallet.ooo/" target="_blank" className="text-blue-600 underline">Plug Wallet Extension</a><br/>
                            2. Open this app in <strong>Chrome/Firefox</strong> (not VS Code browser)<br/>
                            3. Refresh the page after installing
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <button
                        onClick={() => handleWalletConnect(WalletType.PLUG)}
                        disabled={!window.ic?.plug || isConnecting}
                        className={`w-full p-3 rounded-lg border text-left transition-colors ${
                          window.ic?.plug 
                            ? 'border-blue-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
                            : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg mr-3 flex items-center justify-center">
                            <span className="text-white text-sm font-bold">P</span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">Plug Wallet</div>
                            <div className="text-sm text-gray-500">
                              {window.ic?.plug ? 'Ready to connect' : 'Extension not found'}
                            </div>
                          </div>
                        </div>
                      </button>
                      
                      {/* Development/Test Button */}
                      <button
                        onClick={() => {
                          console.log('🚀 Opening development guide...');
                          window.open('file:///Users/bintangastawa/Downloads/WHCL/CharityChain/plug-test.html', '_blank');
                        }}
                        className="w-full p-2 text-sm text-blue-600 hover:text-blue-800 border border-blue-200 rounded hover:bg-blue-50 transition-colors"
                      >
                        🔧 Test Plug Detection (Development)
                      </button>
                    </div>
                    
                    <button
                      onClick={() => setShowWalletSelector(false)}
                      className="mt-3 w-full text-center text-sm text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile navigation */}
      <div className="md:hidden">
        <div className="px-2 pt-2 pb-3 space-y-1 bg-gray-50">
          <Link
            to="/"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive('/')
                ? 'text-primary-600 bg-primary-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Home
          </Link>
          <Link
            to="/campaigns"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive('/campaigns')
                ? 'text-primary-600 bg-primary-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Campaigns
          </Link>
          <Link
            to="/create-campaign"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              isActive('/create-campaign')
                ? 'text-primary-600 bg-primary-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Create Campaign
          </Link>
          {wallet && wallet.isConnected && (
            <>
              <Link
                to="/dashboard"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/dashboard')
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/nfts"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/nfts')
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                My NFTs
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
