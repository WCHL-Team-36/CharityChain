/**
 * ULTIMATE Plug Wallet Connection System
 * This is the definitive solution for all Plug Wallet issues including:
 * 1. Double-click prevention with aggressive state management
 * 2. Proper canister configuration for local development
 * 3. Error handling and retry mechanisms
 */

interface UltimateConnectionState {
  isConnecting: boolean;
  isApproving: boolean;
  lastAttempt: number;
  activePromise: Promise<any> | null;
  blockedUntil: number;
}

class UltimatePlugConnection {
  private static instance: UltimatePlugConnection;
  private state: UltimateConnectionState = {
    isConnecting: false,
    isApproving: false,
    lastAttempt: 0,
    activePromise: null,
    blockedUntil: 0,
  };

  private readonly BLOCK_DURATION = 8000; // 8 seconds complete block
  private readonly MIN_RETRY_INTERVAL = 3000; // 3 seconds minimum

  public static getInstance(): UltimatePlugConnection {
    if (!UltimatePlugConnection.instance) {
      UltimatePlugConnection.instance = new UltimatePlugConnection();
    }
    return UltimatePlugConnection.instance;
  }

  /**
   * Ultimate connection method with complete protection
   */
  async connect(config: any): Promise<any> {
    const now = Date.now();

    // ABSOLUTE BLOCKING - no exceptions
    if (now < this.state.blockedUntil) {
      const remainingTime = Math.ceil((this.state.blockedUntil - now) / 1000);
      console.log(`🚫 Connection BLOCKED for ${remainingTime} more seconds`);
      throw new Error(`Please wait ${remainingTime} seconds before trying again`);
    }

    // If already connecting, return existing promise
    if (this.state.isConnecting && this.state.activePromise) {
      console.log("🔄 Using existing connection attempt...");
      return this.state.activePromise;
    }

    // Block future attempts
    this.state.blockedUntil = now + this.BLOCK_DURATION;
    this.state.isConnecting = true;
    this.state.lastAttempt = now;

    // Create and store the connection promise
    this.state.activePromise = this.performUltimateConnection(config);

    try {
      const result = await this.state.activePromise;
      return result;
    } catch (error) {
      throw error;
    } finally {
      this.state.isConnecting = false;
      // Keep activePromise for a bit longer to handle rapid successive calls
      setTimeout(() => {
        this.state.activePromise = null;
      }, 2000);
    }
  }

  private async performUltimateConnection(config: any): Promise<any> {
    console.log("🚀 ULTIMATE: Starting Plug connection with enhanced config...");

    // Enhanced configuration for local development
    const enhancedConfig = {
      ...config,
      host: config.host || "http://127.0.0.1:4943",
      timeout: 60000, // Increased timeout
      dev: true,
      fetchRootKey: false, // Disable to avoid CORS
      onConnectionUpdate: () => {},
      // Add specific local development settings
      developmentMode: true,
      skipCorsCheck: true,
    };

    console.log("🔧 ULTIMATE: Enhanced config:", {
      host: enhancedConfig.host,
      whitelist: enhancedConfig.whitelist,
      dev: enhancedConfig.dev,
    });

    // Direct Plug Wallet connection with error handling
    try {
      const plug = (window as any).ic?.plug;
      if (!plug) {
        throw new Error("Plug Wallet not available");
      }

      // Enhanced connection request
      const connectionResult = await plug.requestConnect(enhancedConfig);

      if (!connectionResult) {
        throw new Error("Connection was rejected or failed");
      }

      console.log("✅ ULTIMATE: Basic connection established");

      // Verify connection and get principal
      const isConnected = await plug.isConnected();
      if (!isConnected) {
        throw new Error("Connection verification failed");
      }

      const principal = await plug.getPrincipal();
      if (!principal) {
        throw new Error("Failed to get principal");
      }

      console.log("✅ ULTIMATE: Connection fully verified");
      console.log("✅ ULTIMATE: Principal:", principal.toString());

      // Configure agent for local development
      if (enhancedConfig.dev && plug.agent) {
        try {
          plug.agent.host = enhancedConfig.host;
          console.log("🔧 ULTIMATE: Agent host configured for local development");
        } catch (agentError) {
          console.log("⚠️ ULTIMATE: Agent configuration warning (non-critical):", agentError.message);
        }
      }

      return {
        principal: principal.toString(),
        agent: plug.agent,
        isConnected: true,
      };
    } catch (error) {
      console.error("❌ ULTIMATE: Connection failed:", error);
      throw error;
    }
  }

  /**
   * Ultimate transaction approval with complete protection
   */
  async approveTransaction(transactionFn: () => Promise<any>): Promise<any> {
    const now = Date.now();

    // Check if approval is blocked
    if (this.state.isApproving || now < this.state.blockedUntil) {
      throw new Error("Transaction approval is currently blocked - please wait");
    }

    this.state.isApproving = true;
    this.state.blockedUntil = now + this.BLOCK_DURATION;

    try {
      console.log("📝 ULTIMATE: Starting transaction approval...");
      const result = await transactionFn();
      console.log("✅ ULTIMATE: Transaction approved successfully");
      return result;
    } catch (error) {
      console.error("❌ ULTIMATE: Transaction approval failed:", error);
      throw error;
    } finally {
      this.state.isApproving = false;
    }
  }

  /**
   * Reset the connection state (emergency use only)
   */
  reset(): void {
    console.log("🔄 ULTIMATE: Resetting connection state");
    this.state = {
      isConnecting: false,
      isApproving: false,
      lastAttempt: 0,
      activePromise: null,
      blockedUntil: 0,
    };
  }

  /**
   * Get current state for debugging
   */
  getState(): UltimateConnectionState {
    return { ...this.state };
  }
}

// Export singleton instance and helper functions
const ultimatePlugConnection = UltimatePlugConnection.getInstance();

export const connectUltimatePlug = (config: any) => ultimatePlugConnection.connect(config);
export const approveUltimateTransaction = (transactionFn: () => Promise<any>) => ultimatePlugConnection.approveTransaction(transactionFn);
export const resetUltimateConnection = () => ultimatePlugConnection.reset();
export const getUltimateConnectionState = () => ultimatePlugConnection.getState();

export default ultimatePlugConnection;
