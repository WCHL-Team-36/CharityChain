/**
 * Enhanced Plug Wallet Silent Restoration
 * Provides robust methods to restore Plug wallet sessions without user prompts
 */

import { plugHelper } from './plugWalletHelper';

interface SavedWalletState {
  principal: string;
  isConnected: boolean;
  walletType: string;
  timestamp?: number; // Make timestamp optional
}

export class PlugSilentRestore {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.DFX_NETWORK !== "ic";
  }

  /**
   * Attempt silent restoration of Plug wallet connection
   * Returns principal if successful, null if manual connection required
   */
  async attemptSilentRestore(savedState: SavedWalletState): Promise<string | null> {
    console.log('🔄 PlugSilentRestore: Starting comprehensive restoration...');

    // Method 1: Check for existing active session
    const existingPrincipal = await this.checkExistingSession();
    if (existingPrincipal) {
      console.log('✅ Method 1 Success: Found existing session');
      return existingPrincipal;
    }

    // Method 2: Try to restore session using isConnected
    const connectedPrincipal = await this.checkIsConnectedMethod();
    if (connectedPrincipal) {
      console.log('✅ Method 2 Success: Restored via isConnected');
      return connectedPrincipal;
    }

    // Method 3: Check for cached agent/identity
    const cachedPrincipal = await this.checkCachedAgent();
    if (cachedPrincipal) {
      console.log('✅ Method 3 Success: Found cached agent');
      return cachedPrincipal;
    }

    // Method 4: Try browser storage restoration
    const storagePrincipal = await this.checkBrowserStorage(savedState);
    if (storagePrincipal) {
      console.log('✅ Method 4 Success: Restored from browser storage');
      return storagePrincipal;
    }

    console.log('❌ All silent restoration methods failed');
    return null;
  }

  /**
   * Method 1: Check for existing active Plug session
   */
  private async checkExistingSession(): Promise<string | null> {
    try {
      console.log('🔍 Method 1: Checking existing Plug session...');
      
      if (!(window as any).ic?.plug) {
        console.log('⚠️ Plug wallet not available');
        return null;
      }

      const principal = await plugHelper.getPrincipal();
      if (principal) {
        console.log('✅ Found active principal:', principal.toString());
        return principal.toString();
      }

      return null;
    } catch (error: any) {
      console.log('⚠️ Method 1 failed:', error.message);
      return null;
    }
  }

  /**
   * Method 2: Use isConnected to check/restore session
   */
  private async checkIsConnectedMethod(): Promise<string | null> {
    try {
      console.log('🔍 Method 2: Checking via isConnected...');
      
      if (!(window as any).ic?.plug) {
        return null;
      }

      // Try isConnected in both development and production, handle CORS gracefully
      const isDevelopment = process.env.DFX_NETWORK !== "ic";
      
      try {
        if (isDevelopment) {
          console.log('🔧 Development mode: Attempting isConnected with CORS handling...');
        }

        // Try isConnected - this might restore session
        const isConnected = await (window as any).ic.plug.isConnected();
        console.log('🔗 isConnected result:', isConnected);
        
        if (isConnected) {
          console.log('🔧 Plug reports as connected, getting principal...');
          const principal = await plugHelper.getPrincipal();
          if (principal) {
            console.log('✅ Method 2 Success: Silent restoration via isConnected');
            return principal.toString();
          }
        }
      } catch (corsError: any) {
        if (isDevelopment && corsError.message?.includes('CORS')) {
          console.warn('⚠️ CORS error in development (trying fallback):', corsError.message);
          
          // Fallback: Try direct principal check
          try {
            const principal = await plugHelper.getPrincipal();
            if (principal) {
              console.log('🔧 Fallback success: Got principal via direct method');
              return principal.toString();
            }
          } catch (fallbackError) {
            console.warn('⚠️ Fallback also failed:', fallbackError);
          }
        } else {
          throw corsError;
        }
      }

      return null;
    } catch (error: any) {
      console.log('⚠️ Method 2 failed:', error.message);
      return null;
    }
  }

  /**
   * Method 3: Check for cached agent/identity in window
   */
  private async checkCachedAgent(): Promise<string | null> {
    try {
      console.log('🔍 Method 3: Checking cached agent...');
      
      const agent = (window as any).ic?.plug?.agent;
      if (agent && agent._identity) {
        const agentPrincipal = agent._identity.getPrincipal();
        if (agentPrincipal && !agentPrincipal.isAnonymous()) {
          console.log('✅ Found cached agent identity:', agentPrincipal.toString());
          return agentPrincipal.toString();
        }
      }

      return null;
    } catch (error: any) {
      console.log('⚠️ Method 3 failed:', error.message);
      return null;
    }
  }

  /**
   * Method 4: Check browser storage for Plug session data
   */
  private async checkBrowserStorage(savedState: SavedWalletState): Promise<string | null> {
    try {
      console.log('🔍 Method 4: Checking browser storage...');
      
      // Check various storage locations where Plug might store session data
      const storageKeys = [
        'plug-wallet',
        'ic-plug',
        'plug_identity',
        'plug_session',
        'plug_auth'
      ];

      for (const key of storageKeys) {
        try {
          const stored = localStorage.getItem(key) || sessionStorage.getItem(key);
          if (stored) {
            console.log(`🔍 Found storage data for key: ${key}`);
            
            // Try to validate this might be related to our saved principal
            if (stored.includes(savedState.principal.substring(0, 10))) {
              console.log('🔧 Storage might contain our session, attempting restore...');
              
              // Try to get principal after finding storage
              const principal = await plugHelper.getPrincipal();
              if (principal) {
                return principal.toString();
              }
            }
          }
        } catch (e) {
          // Skip this storage key if there's an error
        }
      }

      return null;
    } catch (error: any) {
      console.log('⚠️ Method 4 failed:', error.message);
      return null;
    }
  }

  /**
   * Force cleanup of any stale Plug state
   */
  async cleanupStaleState(): Promise<void> {
    try {
      console.log('🧹 Cleaning up stale Plug state...');
      
      // Clear any stale agent references
      if ((window as any).ic?.plug?.agent) {
        try {
          delete (window as any).ic.plug.agent;
        } catch (e) {
          // Ignore cleanup errors
        }
      }

      console.log('✅ Cleanup completed');
    } catch (error: any) {
      console.log('⚠️ Cleanup failed:', error.message);
    }
  }

  /**
   * Initialize a fresh Plug connection (non-silent, for fallback)
   */
  async initializeFreshConnection(config: any): Promise<boolean> {
    try {
      console.log('🔧 Initializing fresh Plug connection...');
      
      // Clean up any stale state first
      await this.cleanupStaleState();

      const devConfig = {
        ...config,
        host: this.isDevelopment ? "http://127.0.0.1:4943" : "https://icp0.io",
        dev: this.isDevelopment,
        fetchRootKey: this.isDevelopment
      };

      // Wait a bit for cleanup to take effect
      await new Promise(resolve => setTimeout(resolve, 100));

      const result = await (window as any).ic.plug.requestConnect(devConfig);
      
      if (result) {
        console.log('✅ Fresh connection established');
        return true;
      }

      return false;
    } catch (error: any) {
      console.log('❌ Fresh connection failed:', error.message);
      return false;
    }
  }
}

// Export singleton instance
export const plugSilentRestore = new PlugSilentRestore();
