// Simple Wallet Test Component
// Add this component to test wallet connections

import React, { useState } from 'react';
import { WalletType, useWallet } from '../contexts/EnhancedWalletContext';

const WalletTest: React.FC = () => {
  const { wallet, connectWallet, disconnectWallet, isLoading, availableWallets } = useWallet();
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testWalletConnection = async (walletType: WalletType) => {
    addTestResult(`Testing ${walletType} connection...`);
    
    try {
      await connectWallet(walletType);
      addTestResult(`✅ ${walletType} connected successfully!`);
      addTestResult(`Principal: ${wallet?.principal?.toString() || 'N/A'}`);
    } catch (error) {
      addTestResult(`❌ ${walletType} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testDisconnection = async () => {
    addTestResult('Testing disconnect...');
    try {
      await disconnectWallet();
      addTestResult('✅ Wallet disconnected successfully!');
    } catch (error) {
      addTestResult(`❌ Disconnect failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">🧪 Wallet Connection Test</h2>
      
      {/* Current Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Current Status:</h3>
        <p className="text-sm">
          <span className="font-medium">Connected:</span> {(wallet && wallet.isConnected) ? '✅ Yes' : '❌ No'}
        </p>
        {wallet && wallet.isConnected && (
          <>
            <p className="text-sm">
              <span className="font-medium">Wallet Type:</span> {wallet?.walletType || 'Unknown'}
            </p>
            <p className="text-sm">
              <span className="font-medium">Principal:</span> {wallet?.principal?.toString().slice(0, 30) || 'N/A'}...
            </p>
          </>
        )}
      </div>

      {/* Available Wallets */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Available Wallets:</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {availableWallets.map((walletType) => (
            <button
              key={walletType}
              onClick={() => testWalletConnection(walletType)}
              disabled={isLoading}
              className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              Test {walletType}
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="mb-6 flex gap-3">
        {wallet && wallet.isConnected && (
          <button
            onClick={testDisconnection}
            disabled={isLoading}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium disabled:opacity-50"
          >
            Test Disconnect
          </button>
        )}
        <button
          onClick={clearResults}
          className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium"
        >
          Clear Results
        </button>
      </div>

      {/* Test Results */}
      <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-white font-semibold">Test Console:</h3>
          <span className="text-gray-400 text-xs">{testResults.length} entries</span>
        </div>
        {testResults.length === 0 ? (
          <p className="text-gray-500">No tests run yet. Click a wallet type to test connection.</p>
        ) : (
          testResults.map((result, index) => (
            <div key={index} className="mb-1">
              {result}
            </div>
          ))
        )}
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">🔧 Testing Instructions:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Development Wallet:</strong> Should work instantly</li>
          <li>• <strong>Internet Identity:</strong> Will open new tab for auth</li>
          <li>• <strong>Plug Wallet:</strong> Requires extension installation</li>
          <li>• <strong>Stoic Wallet:</strong> Will redirect to Stoic website</li>
        </ul>
      </div>
    </div>
  );
};

export default WalletTest;
