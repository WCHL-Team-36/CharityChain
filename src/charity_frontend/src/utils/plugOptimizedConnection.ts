/**
 * Optimized Plug Wallet Connection Handler
 * Prevents multiple CORS requests and handles double-click issues
 */

interface ConnectionState {
  isConnecting: boolean;
  isApproving: boolean;
  lastConnectionTime: number;
  connectionPromise: Promise<any> | null;
  pendingApprovals: Set<string>;
}

class PlugOptimizedConnection {
  private state: ConnectionState = {
    isConnecting: false,
    isApproving: false,
    lastConnectionTime: 0,
    connectionPromise: null,
    pendingApprovals: new Set(),
  };

  private readonly DEBOUNCE_TIME = 5000; // 5 second debounce for maximum protection

  /**
   * Optimized connection with debouncing and state management
   */
  async connect(config: any): Promise<any> {
    const now = Date.now();

    // Prevent double-clicking within debounce time
    if (this.state.isConnecting || now - this.state.lastConnectionTime < this.DEBOUNCE_TIME) {
      console.log("🔄 Connection already in progress or too soon, using existing promise");
      if (this.state.connectionPromise) {
        return this.state.connectionPromise;
      }
      // If no promise but still within debounce time, reject
      throw new Error("Connection request too frequent - please wait");
    }

    this.state.isConnecting = true;
    this.state.lastConnectionTime = now;

    // Create single connection promise
    this.state.connectionPromise = this.performConnection(config);

    try {
      const result = await this.state.connectionPromise;
      return result;
    } finally {
      this.state.isConnecting = false;
      // Keep promise cached for a short time to handle rapid successive calls
      setTimeout(() => {
        this.state.connectionPromise = null;
      }, this.DEBOUNCE_TIME);
    }
  }

  /**
   * Perform the actual connection with optimized CORS handling
   */
  private async performConnection(config: any): Promise<any> {
    const isDevelopment = process.env.DFX_NETWORK !== "ic";

    console.log("🔌 Starting optimized Plug connection...");

    if (!window.ic?.plug) {
      throw new Error("Plug Wallet not found");
    }

    // Check if already connected to avoid unnecessary requests
    try {
      const alreadyConnected = await this.checkExistingConnection();
      if (alreadyConnected) {
        console.log("✅ Already connected, reusing connection");
        return true;
      }
    } catch (error) {
      console.log("⚠️ Connection check failed, proceeding with new connection");
    }

    // Optimized configuration for development
    const optimizedConfig = {
      ...config,
      timeout: 10000, // Shorter timeout
      retries: 1, // Reduce retries
      ...(isDevelopment && {
        dev: true,
        host: "http://127.0.0.1:4943",
      }),
    };

    console.log("🔧 Using optimized config:", optimizedConfig);

    try {
      const result = await window.ic.plug.requestConnect(optimizedConfig);

      if (result && isDevelopment) {
        await this.optimizeAgentForDevelopment();
      }

      console.log("✅ Connection successful");
      return result;
    } catch (error) {
      console.error("❌ Connection failed:", error);
      throw error;
    }
  }

  /**
   * Check if there's an existing valid connection
   */
  private async checkExistingConnection(): Promise<boolean> {
    try {
      const principal = await window.ic?.plug?.getPrincipal();
      if (principal && !principal.isAnonymous()) {
        return true;
      }
    } catch (error) {
      // Ignore CORS errors during check
    }
    return false;
  }

  /**
   * Optimize agent configuration for development
   */
  private async optimizeAgentForDevelopment(): Promise<void> {
    try {
      if (window.ic?.plug?.agent) {
        const agent = window.ic.plug.agent;

        // Set correct host
        if (agent._host !== "http://127.0.0.1:4943") {
          agent._host = "http://127.0.0.1:4943";
          console.log("🔧 Agent host optimized for development");
        }

        // Disable unnecessary root key fetching
        if (agent.fetchRootKey) {
          try {
            await agent.fetchRootKey();
          } catch (error) {
            // Ignore CORS errors for root key
            console.log("⚠️ Root key fetch skipped due to CORS (expected)");
          }
        }
      }
    } catch (error) {
      console.log("⚠️ Agent optimization failed:", error.message);
    }
  }

  /**
   * Optimized transaction approval with enhanced protection
   */
  async approveTransaction(transactionFn: () => Promise<any>): Promise<any> {
    // Check if any approval is currently in progress
    if (this.state.isApproving || this.state.pendingApprovals.size > 0) {
      console.log("🔄 Transaction approval already in progress");
      throw new Error("Transaction approval already in progress - please wait");
    }

    // Generate unique transaction ID
    const transactionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);

    this.state.isApproving = true;
    this.state.pendingApprovals.add(transactionId);

    try {
      console.log("📝 Starting transaction approval...");

      // Ensure we have a valid connection before attempting transaction
      await this.ensureValidConnection();

      const result = await transactionFn();
      console.log("✅ Transaction approved successfully");
      return result;
    } catch (error) {
      console.error("❌ Transaction approval failed:", error);
      throw error;
    } finally {
      this.state.isApproving = false;
      this.state.pendingApprovals.delete(transactionId);

      // Add small delay to prevent rapid successive calls
      setTimeout(() => {
        // Additional cleanup if needed
      }, 1000);
    }
  }

  /**
   * Ensure we have a valid connection before transaction
   */
  private async ensureValidConnection(): Promise<void> {
    try {
      if (!window.ic?.plug) {
        throw new Error("Plug Wallet not available");
      }

      const principal = await window.ic.plug.getPrincipal();
      if (!principal || principal.isAnonymous()) {
        throw new Error("No valid wallet connection");
      }

      // Verify agent is properly configured
      if (!window.ic.plug.agent) {
        throw new Error("Wallet agent not configured");
      }
    } catch (error) {
      console.error("❌ Connection validation failed:", error);
      throw new Error("Please reconnect your wallet");
    }
  }

  /**
   * Reset connection state (for cleanup)
   */
  reset(): void {
    this.state = {
      isConnecting: false,
      isApproving: false,
      lastConnectionTime: 0,
      connectionPromise: null,
      pendingApprovals: new Set(),
    };
  }

  /**
   * Get current connection state
   */
  getState(): ConnectionState {
    return { ...this.state };
  }
}

// Export singleton instance
export const plugOptimizedConnection = new PlugOptimizedConnection();

// Helper function for easy use
export const connectOptimizedPlug = async (config: any) => {
  return plugOptimizedConnection.connect(config);
};

export const approveOptimizedTransaction = async (transactionFn: () => Promise<any>) => {
  return plugOptimizedConnection.approveTransaction(transactionFn);
};
