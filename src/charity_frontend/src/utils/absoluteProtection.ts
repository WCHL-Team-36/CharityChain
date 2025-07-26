/**
 * FINAL SOLUTION: Absolute Double-Click Prevention and Canister Fix
 * This is the definitive, bulletproof solution for both problems
 */

// Global state to prevent any duplicate actions
(window as any).CHARITY_CHAIN_PROTECTION = {
  isConnecting: false,
  isApproving: false,
  lastAction: 0,
  blockUntil: 0,
};

const ABSOLUTE_BLOCK_TIME = 10000; // 10 seconds absolute protection

/**
 * Absolute protection wrapper for any function
 */
export const absoluteProtection = async <T>(actionName: string, actionFn: () => Promise<T>, customBlockTime?: number): Promise<T> => {
  const protection = (window as any).CHARITY_CHAIN_PROTECTION;
  const now = Date.now();
  const blockTime = customBlockTime || ABSOLUTE_BLOCK_TIME;

  // ABSOLUTE BLOCKING - no exceptions
  if (now < protection.blockUntil) {
    const remainingSeconds = Math.ceil((protection.blockUntil - now) / 1000);
    throw new Error(`Action blocked! Please wait ${remainingSeconds} seconds before trying again.`);
  }

  // Set protection
  protection.blockUntil = now + blockTime;
  protection.lastAction = now;

  if (actionName === "connect") {
    protection.isConnecting = true;
  } else if (actionName === "approve") {
    protection.isApproving = true;
  }

  try {
    console.log(`🛡️ ABSOLUTE: Starting protected action: ${actionName}`);
    const result = await actionFn();
    console.log(`✅ ABSOLUTE: Protected action completed: ${actionName}`);
    return result;
  } catch (error) {
    console.error(`❌ ABSOLUTE: Protected action failed: ${actionName}`, error);
    throw error;
  } finally {
    if (actionName === "connect") {
      protection.isConnecting = false;
    } else if (actionName === "approve") {
      protection.isApproving = false;
    }
  }
};

/**
 * Ultimate Plug Wallet Connection - Bulletproof
 */
export const connectPlugAbsolute = async (config: any) => {
  return absoluteProtection(
    "connect",
    async () => {
      console.log("🚀 ABSOLUTE: Starting bulletproof Plug connection...");

      const plug = (window as any).ic?.plug;
      if (!plug) {
        throw new Error("Plug Wallet not found");
      }

      // CRITICAL: Configure for local development BEFORE connection
      const localConfig = {
        ...config,
        host: "http://127.0.0.1:4943",
        timeout: 60000,
        dev: true,
        skipCorsCheck: true,
      };

      console.log("🔧 ABSOLUTE: Using local development config:", localConfig);

      // Connect with enhanced configuration
      const connectionResult = await plug.requestConnect(localConfig);

      if (!connectionResult) {
        throw new Error("Connection rejected");
      }

      // Force configure agent for local development
      if (plug.agent) {
        plug.agent.host = "http://127.0.0.1:4943";
        console.log("🔧 ABSOLUTE: Agent configured for local development");
      }

      // Verify connection
      const isConnected = await plug.isConnected();
      if (!isConnected) {
        throw new Error("Connection verification failed");
      }

      const principal = await plug.getPrincipal();
      if (!principal) {
        throw new Error("Failed to get principal");
      }

      return {
        principal: principal.toString(),
        agent: plug.agent,
        isConnected: true,
      };
    },
    15000
  ); // 15 second block for connections
};

/**
 * Ultimate Transaction Approval - Bulletproof
 */
export const approveTransactionAbsolute = async <T>(transactionFn: () => Promise<T>): Promise<T> => {
  return absoluteProtection("approve", transactionFn, 8000); // 8 second block for transactions
};

/**
 * Get protection state for debugging
 */
export const getProtectionState = () => {
  return { ...(window as any).CHARITY_CHAIN_PROTECTION };
};

/**
 * Emergency reset (use only if needed)
 */
export const resetProtection = () => {
  (window as any).CHARITY_CHAIN_PROTECTION = {
    isConnecting: false,
    isApproving: false,
    lastAction: 0,
    blockUntil: 0,
  };
  console.log("🔄 ABSOLUTE: Protection state reset");
};
