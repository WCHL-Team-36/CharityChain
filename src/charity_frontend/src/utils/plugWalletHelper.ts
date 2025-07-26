/**
 * Plug Wallet Helper for Development Environment
 * Provides workarounds for CORS issues in local development
 */

interface PlugWalletHelper {
  isConnected: () => Promise<boolean>;
  getPrincipal: () => Promise<any>;
  createAgent: (options: any) => Promise<any>;
}

export const createPlugWalletHelper = (): PlugWalletHelper => {
  const isDevelopment = process.env.DFX_NETWORK !== "ic";

  return {
    async isConnected(): Promise<boolean> {
      try {
        if (!window.ic?.plug) return false;

        if (isDevelopment) {
          // In development, avoid CORS-problematic isConnected() call
          // Instead, check if we can get principal directly
          try {
            const principal = await (window as any).ic.plug.getPrincipal();
            return !!principal;
          } catch (error) {
            console.log("🔧 Development check: getPrincipal failed, assuming not connected");
            return false;
          }
        } else {
          // Production: use normal isConnected
          return await (window as any).ic.plug.isConnected();
        }
      } catch (error) {
        console.log("⚠️ isConnected check failed:", error.message);
        return false;
      }
    },

    async getPrincipal(): Promise<any> {
      try {
        if (!(window as any).ic?.plug) {
          console.log("⚠️ Plug wallet not available");
          return null;
        }

        // Try main getPrincipal method
        try {
          const principal = await (window as any).ic.plug.getPrincipal();
          if (principal) {
            console.log("✅ Got principal via direct method:", principal.toString());
            return principal;
          }
        } catch (directError) {
          console.log("⚠️ Direct getPrincipal failed:", directError.message);
        }

        // Fallback: try via agent if available
        try {
          const agent = (window as any).ic?.plug?.agent;
          if (agent && agent._identity) {
            const agentPrincipal = agent._identity.getPrincipal();
            if (agentPrincipal && !agentPrincipal.isAnonymous()) {
              console.log("✅ Got principal via agent fallback:", agentPrincipal.toString());
              return agentPrincipal;
            }
          }
        } catch (agentError) {
          console.log("⚠️ Agent fallback failed:", agentError.message);
        }

        console.log("ℹ️ No principal available via any method");
        return null;
      } catch (error: any) {
        console.log("⚠️ getPrincipal completely failed:", error.message);
        return null; // Return null instead of throwing for silent restoration
      }
    },

    async createAgent(options: any): Promise<any> {
      try {
        if (!(window as any).ic?.plug) throw new Error("Plug wallet not available");

        if (isDevelopment) {
          // In development, create agent with specific configuration to avoid CORS
          const agent = await (window as any).ic.plug.createAgent({
            ...options,
            host: "http://127.0.0.1:4943",
            fetchRootKey: true,
          });

          // Try to set the host directly on the agent if possible
          if (agent && typeof agent === "object") {
            try {
              agent._host = "http://127.0.0.1:4943";
              agent.host = "http://127.0.0.1:4943";
            } catch (e: any) {
              console.log("⚠️ Could not set agent host properties:", e.message);
            }
          }

          return agent;
        } else {
          // Production: use normal createAgent
          return await (window as any).ic.plug.createAgent(options);
        }
      } catch (error: any) {
        console.log("⚠️ createAgent failed:", error.message);
        throw error;
      }
    },
  };
};

// Global helper instance
export const plugHelper = createPlugWalletHelper();

// Development-specific connection function
export const connectPlugWalletDev = async (config: any) => {
  const isDevelopment = process.env.DFX_NETWORK !== "ic";

  if (!isDevelopment) {
    // Production: use normal requestConnect
    return await (window as any).ic.plug.requestConnect(config);
  }

  // Development: enhanced configuration to avoid CORS
  const devConfig = {
    ...config,
    dev: true,
    fetchRootKey: true,
    host: "http://127.0.0.1:4943",
  };

  console.log("🔧 Development Plug connection with config:", devConfig);

  try {
    const result = await (window as any).ic.plug.requestConnect(devConfig);

    // After connection, try to configure the agent properly
    if (result && (window as any).ic?.plug?.agent) {
      try {
        const agent = (window as any).ic.plug.agent;

        // Force set the correct host
        if (agent._host !== devConfig.host) {
          console.log("🔧 Setting agent host to:", devConfig.host);
          agent._host = devConfig.host;
        }

        // Try to fetch root key for local development
        if (agent.fetchRootKey && typeof agent.fetchRootKey === "function") {
          try {
            await agent.fetchRootKey();
            console.log("✅ Root key fetched successfully");
          } catch (e: any) {
            console.log("⚠️ Root key fetch failed (this is expected in some cases):", e.message);
          }
        }
      } catch (agentError: any) {
        console.log("⚠️ Agent configuration warning:", agentError.message);
      }
    }

    return result;
  } catch (error: any) {
    console.log("❌ Development Plug connection failed:", error.message);
    throw error;
  }
};

// Type augmentation for TypeScript
declare global {
  interface Window {
    ic?: {
      plug?: {
        isConnected(): Promise<boolean>;
        getPrincipal(): Promise<any>;
        createAgent(options: any): Promise<any>;
        requestConnect(config: any): Promise<boolean>;
        agent?: any;
      };
    };
  }
}
