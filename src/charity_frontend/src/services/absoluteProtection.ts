// ABSOLUTE PROTECTION SYSTEM - Final bulletproof solution for Plug Wallet
// This system prevents ALL duplicate actions with 10-second global blocking

// Global window state for absolute protection
declare global {
  interface Window {
    ABSOLUTE_PROTECTION_STATE?: {
      isBlocked: boolean;
      lastActionTime: number;
      activeOperation: string | null;
    };
  }
}

// Absolute protection configuration
const ABSOLUTE_BLOCK_TIME = 10000; // 10 seconds of absolute blocking

// Initialize global protection state
const initializeAbsoluteProtection = () => {
  if (typeof window !== 'undefined' && !window.ABSOLUTE_PROTECTION_STATE) {
    window.ABSOLUTE_PROTECTION_STATE = {
      isBlocked: false,
      lastActionTime: 0,
      activeOperation: null,
    };
  }
};

// Absolute protection wrapper - prevents ANY duplicate action
export const absoluteProtection = async <T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<{ success: boolean; data?: T; error?: string }> => {
  try {
    initializeAbsoluteProtection();
    const state = window.ABSOLUTE_PROTECTION_STATE!;
    const now = Date.now();

    // Check if we're still in absolute blocking period
    if (state.isBlocked && (now - state.lastActionTime) < ABSOLUTE_BLOCK_TIME) {
      const remainingTime = Math.ceil((ABSOLUTE_BLOCK_TIME - (now - state.lastActionTime)) / 1000);
      console.warn(`🚫 ABSOLUTE PROTECTION: Operation "${operationName}" blocked. ${remainingTime}s remaining.`);
      return {
        success: false,
        error: `Please wait ${remainingTime} seconds before trying again.`
      };
    }

    // Set absolute block
    state.isBlocked = true;
    state.lastActionTime = now;
    state.activeOperation = operationName;

    console.log(`🛡️ ABSOLUTE PROTECTION: Starting "${operationName}" with ${ABSOLUTE_BLOCK_TIME/1000}s block`);

    try {
      const result = await operation();
      console.log(`✅ ABSOLUTE PROTECTION: "${operationName}" completed successfully`);
      return { success: true, data: result };
    } catch (error: any) {
      console.error(`❌ ABSOLUTE PROTECTION: "${operationName}" failed:`, error);
      return { 
        success: false, 
        error: error.message || 'Operation failed'
      };
    }
  } catch (error: any) {
    console.error(`💥 ABSOLUTE PROTECTION: Critical error in "${operationName}":`, error);
    return { 
      success: false, 
      error: error.message || 'Critical error occurred'
    };
  }
};

// Plug Wallet connection with absolute protection
export const connectPlugAbsolute = async (): Promise<{
  success: boolean;
  data?: {
    principal: any;
    accountId: string;
    balance: number;
  };
  error?: string;
}> => {
  return await absoluteProtection(async () => {
    console.log('🔌 ABSOLUTE: Starting Plug Wallet connection...');
    
    // Debug: Check browser environment
    console.log('🔍 DEBUG - typeof window:', typeof window);
    console.log('🔍 DEBUG - window is undefined?', typeof window === 'undefined');
    
    if (typeof window !== 'undefined') {
      console.log('🔍 DEBUG - window object keys:', Object.keys(window).slice(0, 20));
      console.log('🔍 DEBUG - window.ic exists?', !!window.ic);
      console.log('🔍 DEBUG - window.ic object:', window.ic);
      
      if (window.ic) {
        console.log('🔍 DEBUG - window.ic keys:', Object.keys(window.ic));
        console.log('🔍 DEBUG - window.ic.plug exists?', !!window.ic.plug);
        console.log('🔍 DEBUG - window.ic.plug object:', window.ic.plug);
        
        if (window.ic.plug) {
          console.log('🔍 DEBUG - window.ic.plug keys:', Object.keys(window.ic.plug));
          console.log('🔍 DEBUG - requestConnect method?', typeof window.ic.plug.requestConnect);
        }
      }
    }

    if (typeof window === 'undefined' || !window.ic?.plug) {
      console.error('❌ ABSOLUTE: Plug Wallet not available. Conditions:');
      console.error('  - window undefined?', typeof window === 'undefined');
      console.error('  - window.ic exists?', typeof window !== 'undefined' && !!window.ic);
      console.error('  - window.ic.plug exists?', typeof window !== 'undefined' && !!window.ic?.plug);
      throw new Error('Plug Wallet not available');
    }

    // Enhanced local development configuration with VALID Principal IDs ONLY
    const localConfig = {
      whitelist: [
        'u6s2n-gx777-77774-qaaba-cai', // donation_canister (CORRECT)
        'uzt4z-lp777-77774-qaabq-cai', // nft_canister (CORRECT)
        'uxrrr-q7777-77774-qaaaq-cai', // charity_frontend (CORRECT)
        // Internet Identity removed for local development (causes checksum errors)
      ],
      host: 'http://127.0.0.1:4943', // Local development
      timeout: 60000,
    };

    console.log('🔗 ABSOLUTE: Connecting with config:', localConfig);

    const connected = await window.ic.plug.requestConnect(localConfig);

    if (!connected) {
      throw new Error('Failed to connect to Plug Wallet');
    }

    console.log('✅ ABSOLUTE: Plug Wallet connected');

    // Get wallet information
    const principal = await window.ic.plug.getPrincipal();
    const principalText = principal.toString();

    // Create agent for local development
    const agent = await window.ic.plug.createAgent({
      whitelist: localConfig.whitelist,
      host: localConfig.host,
    });

    console.log('🏭 ABSOLUTE: Agent created for local development');

    // Get account ID using agent
    let accountId = '';
    try {
      // Try to get account ID from agent's publicKey if available
      if (agent.getPrincipal) {
        accountId = principalText; // Fallback to principal text
      }
    } catch (error) {
      console.warn('⚠️ ABSOLUTE: Could not get account ID, using principal:', error);
      accountId = principalText;
    }

    // Get balance
    let balance = 0;
    try {
      // For local development, we might not have balance API
      console.log('💰 ABSOLUTE: Balance check skipped for local development');
    } catch (error) {
      console.warn('⚠️ ABSOLUTE: Could not fetch balance:', error);
    }

    console.log('🎉 ABSOLUTE: Connection successful!', {
      principalText: principalText.slice(0, 20) + '...',
      accountId: accountId.slice(0, 20) + '...',
      balance,
    });

    return {
      principal,
      accountId,
      balance,
    };
  }, 'PLUG_CONNECTION');
};

// Transaction approval with absolute protection
export const approveTransactionAbsolute = async (amount: number): Promise<{
  success: boolean;
  error?: string;
}> => {
  return await absoluteProtection(async () => {
    console.log(`💰 ABSOLUTE: Starting transaction approval for ${amount} ckUSDT`);

    if (typeof window === 'undefined' || !window.ic?.plug) {
      throw new Error('Plug Wallet not available');
    }

    // For local development, we'll simulate transaction approval
    console.log('🧪 ABSOLUTE: Simulating transaction approval for local development');
    
    // Add artificial delay to simulate real transaction
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if wallet is still connected
    const isConnected = await window.ic.plug.isConnected();
    if (!isConnected) {
      throw new Error('Wallet disconnected during transaction');
    }

    console.log('✅ ABSOLUTE: Transaction approved successfully');
    return true;
  }, 'TRANSACTION_APPROVAL');
};
