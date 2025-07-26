/**
 * ULTIMATE Canister Service with Plug Wallet Local Development Support
 * This service handles all the complex configurations needed for Plug Wallet
 * to work properly with local development environment
 */

import { Actor, HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { Campaign, Donation, NFTMetadata, CreateCampaignData, CampaignStats } from "../types";

// IDL definitions for the canisters
const donationCanisterIdl = ({ IDL }: any) => {
  const DonationError = IDL.Variant({
    CampaignNotFound: IDL.Null,
    InsufficientAmount: IDL.Null,
    CampaignInactive: IDL.Null,
    Unauthorized: IDL.Null,
    TransferFailed: IDL.Null,
    CampaignExpired: IDL.Null,
    InvalidInput: IDL.Null,
  });

  const Campaign = IDL.Record({
    id: IDL.Text,
    title: IDL.Text,
    description: IDL.Text,
    recipient: IDL.Principal,
    goalAmount: IDL.Nat,
    currentAmount: IDL.Nat,
    isActive: IDL.Bool,
    endDate: IDL.Opt(IDL.Int),
    createdAt: IDL.Int,
    nftThreshold: IDL.Opt(IDL.Nat),
  });

  const Donation = IDL.Record({
    id: IDL.Nat,
    campaignId: IDL.Text,
    donor: IDL.Principal,
    amount: IDL.Nat,
    timestamp: IDL.Int,
    transactionHash: IDL.Opt(IDL.Text),
  });

  const CampaignStats = IDL.Record({
    totalDonations: IDL.Nat,
    totalAmount: IDL.Nat,
    totalCampaigns: IDL.Nat,
  });

  return IDL.Service({
    createCampaign: IDL.Func(
      [IDL.Text, IDL.Text, IDL.Text, IDL.Nat, IDL.Opt(IDL.Int)],
      [IDL.Variant({ ok: Campaign, err: DonationError })],
      []
    ),
    getCampaign: IDL.Func([IDL.Text], [IDL.Opt(Campaign)], ["query"]),
    getAllCampaigns: IDL.Func([], [IDL.Vec(Campaign)], ["query"]),
    updateCampaign: IDL.Func(
      [IDL.Text, IDL.Text, IDL.Text, IDL.Bool],
      [IDL.Variant({ ok: Campaign, err: DonationError })],
      []
    ),
    deleteCampaign: IDL.Func([IDL.Text], [IDL.Variant({ ok: IDL.Null, err: DonationError })], []),
    donate: IDL.Func(
      [IDL.Text, IDL.Nat],
      [IDL.Variant({ ok: Donation, err: DonationError })],
      []
    ),
    getDonationsBycampaign: IDL.Func([IDL.Text], [IDL.Vec(Donation)], ["query"]),
    getDonationsByDonor: IDL.Func([IDL.Principal], [IDL.Vec(Donation)], ["query"]),
    getCampaignStats: IDL.Func([], [CampaignStats], ["query"]),
  });
};

const nftCanisterIdl = ({ IDL }: any) => {
  const NFTError = IDL.Variant({
    Unauthorized: IDL.Null,
    TokenNotFound: IDL.Null,
    OwnerNotFound: IDL.Null,
    OperatorNotFound: IDL.Null,
    ExistedNFT: IDL.Null,
    SelfApprove: IDL.Null,
    SelfTransfer: IDL.Null,
    TxNotFound: IDL.Null,
    Other: IDL.Text,
  });

  const NFTMetadata = IDL.Record({
    id: IDL.Nat,
    name: IDL.Text,
    description: IDL.Text,
    image: IDL.Text,
    campaignId: IDL.Text,
    donationAmount: IDL.Nat,
    mintedAt: IDL.Int,
    owner: IDL.Principal,
  });

  return IDL.Service({
    mintNFT: IDL.Func(
      [IDL.Principal, IDL.Nat, IDL.Text, IDL.Nat],
      [IDL.Variant({ ok: IDL.Nat, err: NFTError })],
      []
    ),
    getNFTsByOwner: IDL.Func([IDL.Principal], [IDL.Vec(NFTMetadata)], ["query"]),
    getNFTMetadata: IDL.Func([IDL.Nat], [IDL.Opt(NFTMetadata)], ["query"]),
    getAllNFTs: IDL.Func([], [IDL.Vec(NFTMetadata)], ["query"]),
  });
};

// ABSOLUTE canister configuration for local development
const LOCAL_CANISTER_CONFIG = {
  donation_canister: "u6s2n-gx777-77774-qaaba-cai",
  nft_canister: "uzt4z-lp777-77774-qaabq-cai",
  local_host: "http://127.0.0.1:4943",
  replica_host: "http://localhost:4943"
};

export class UltimateCanisterService {
  private agent: HttpAgent;
  private donationActor: any;
  private nftActor: any;
  private isInitialized: boolean = false;
  private isPlugWallet: boolean = false;

  constructor(identity?: any) {
    console.log("🚀 ULTIMATE: Initializing CanisterService with identity:", identity ? "Present" : "Anonymous");

    // Detect if this is Plug Wallet
    this.isPlugWallet = identity && (window as any).ic?.plug && identity === (window as any).ic.plug.agent;

    if (this.isPlugWallet) {
      console.log("🔌 ULTIMATE: Using Plug Wallet - creating specialized actors");
      this.agent = identity;
      this.initializePlugActorsUltimate();
    } else {
      console.log("🔧 ULTIMATE: Using standard wallet");
      this.agent = new HttpAgent({
        host: LOCAL_CANISTER_CONFIG.local_host,
        identity,
      });
      this.initializeStandardActors();
    }
  }

  private async initializePlugActorsUltimate() {
    try {
      console.log("🚀 ULTIMATE: Creating Plug Wallet actors with specialized configuration...");
      
      const plug = (window as any).ic?.plug;
      if (!plug) {
        throw new Error("Plug Wallet not available");
      }

      // CRITICAL: Configure Plug agent for local development
      if (plug.agent) {
        plug.agent.host = LOCAL_CANISTER_CONFIG.local_host;
        console.log("🔧 ULTIMATE: Configured Plug agent host:", LOCAL_CANISTER_CONFIG.local_host);
      }

      // Method 1: Try using createActor with full configuration
      try {
        console.log("🔧 ULTIMATE: Attempting Method 1 - createActor with full config");
        
        this.donationActor = await plug.createActor({
          canisterId: LOCAL_CANISTER_CONFIG.donation_canister,
          interfaceFactory: donationCanisterIdl,
          host: LOCAL_CANISTER_CONFIG.local_host,
          agent: plug.agent
        });

        this.nftActor = await plug.createActor({
          canisterId: LOCAL_CANISTER_CONFIG.nft_canister,
          interfaceFactory: nftCanisterIdl,
          host: LOCAL_CANISTER_CONFIG.local_host,
          agent: plug.agent
        });

        console.log("✅ ULTIMATE: Method 1 successful - actors created via createActor");
      } catch (method1Error) {
        console.log("⚠️ ULTIMATE: Method 1 failed, trying Method 2:", method1Error.message);

        // Method 2: Direct Actor creation with Plug agent
        this.donationActor = Actor.createActor(donationCanisterIdl, {
          agent: plug.agent,
          canisterId: LOCAL_CANISTER_CONFIG.donation_canister,
        });

        this.nftActor = Actor.createActor(nftCanisterIdl, {
          agent: plug.agent,
          canisterId: LOCAL_CANISTER_CONFIG.nft_canister,
        });

        console.log("✅ ULTIMATE: Method 2 successful - actors created via Actor.createActor");
      }

      // Verify actors are working
      try {
        await this.donationActor.getCampaignStats();
        console.log("✅ ULTIMATE: Donation actor verified and working");
      } catch (verifyError) {
        console.log("⚠️ ULTIMATE: Donation actor verification failed:", verifyError.message);
      }

      console.log("✅ ULTIMATE: Plug actors initialization complete");
      console.log("🔧 ULTIMATE: Donation canister ID:", LOCAL_CANISTER_CONFIG.donation_canister);
      console.log("🔧 ULTIMATE: NFT canister ID:", LOCAL_CANISTER_CONFIG.nft_canister);
      console.log("🔧 ULTIMATE: Host:", LOCAL_CANISTER_CONFIG.local_host);
      
      this.isInitialized = true;
    } catch (error) {
      console.error("❌ ULTIMATE: Failed to create Plug actors:", error);
      throw error;
    }
  }

  private initializeStandardActors() {
    // For standard wallets, use normal initialization
    if (process.env.DFX_NETWORK === "local") {
      console.log("🔧 ULTIMATE: Fetching root key for local development...");
      this.agent
        .fetchRootKey()
        .then(() => {
          console.log("✅ ULTIMATE: Root key fetched successfully");
          this.isInitialized = true;
        })
        .catch((err) => {
          console.error("❌ ULTIMATE: Unable to fetch root key:", err);
          this.isInitialized = true;
        });
    } else {
      this.isInitialized = true;
    }

    this.donationActor = Actor.createActor(donationCanisterIdl, {
      agent: this.agent,
      canisterId: LOCAL_CANISTER_CONFIG.donation_canister,
    });

    this.nftActor = Actor.createActor(nftCanisterIdl, {
      agent: this.agent,
      canisterId: LOCAL_CANISTER_CONFIG.nft_canister,
    });

    console.log("✅ ULTIMATE: Standard actors created successfully");
  }

  async waitForInitialization(): Promise<void> {
    if (this.isInitialized) return;
    
    return new Promise((resolve) => {
      const checkInit = () => {
        if (this.isInitialized) {
          resolve();
        } else {
          setTimeout(checkInit, 100);
        }
      };
      checkInit();
    });
  }

  async createCampaign(campaignData: CreateCampaignData): Promise<Campaign> {
    await this.waitForInitialization();
    
    console.log("🚀 ULTIMATE: Creating campaign:", campaignData.title);
    console.log("🔧 ULTIMATE: Campaign data:", {
      id: campaignData.id,
      title: campaignData.title,
      description: campaignData.description.substring(0, 50) + "...",
      targetAmount: campaignData.goalAmount.toString()
    });

    try {
      if (this.isPlugWallet) {
        console.log("🔌 ULTIMATE: Using Plug Wallet with enhanced error handling...");
        
        // Verify actor is available
        if (!this.donationActor) {
          throw new Error("Donation actor not available - please reconnect wallet");
        }

        // Enhanced campaign creation for Plug Wallet
        const result = await this.donationActor.createCampaign(
          campaignData.id,
          campaignData.title,
          campaignData.description,
          campaignData.goalAmount,
          campaignData.endDate ? [campaignData.endDate] : []
        );

        if ("err" in result) {
          throw new Error(`Campaign creation failed: ${Object.keys(result.err)[0]}`);
        }

        console.log("✅ ULTIMATE: Campaign created successfully via Plug Wallet");
        return result.ok;
      } else {
        // Standard wallet flow
        const result = await this.donationActor.createCampaign(
          campaignData.id,
          campaignData.title,
          campaignData.description,
          campaignData.goalAmount,
          campaignData.endDate ? [campaignData.endDate] : []
        );

        if ("err" in result) {
          throw new Error(`Campaign creation failed: ${Object.keys(result.err)[0]}`);
        }

        console.log("✅ ULTIMATE: Campaign created successfully via standard wallet");
        return result.ok;
      }
    } catch (error: any) {
      console.error("❌ ULTIMATE: Failed to create campaign:", error);
      throw {
        code: error.code || 3000,
        message: error.message || "Unknown error occurred during campaign creation"
      };
    }
  }

  // Other methods remain the same but with enhanced error handling...
  async getAllCampaigns(): Promise<Campaign[]> {
    await this.waitForInitialization();
    try {
      const campaigns = await this.donationActor.getAllCampaigns();
      console.log("✅ ULTIMATE: Retrieved", campaigns.length, "campaigns");
      return campaigns;
    } catch (error) {
      console.error("❌ ULTIMATE: Failed to get campaigns:", error);
      return [];
    }
  }

  async getCampaignStats(): Promise<CampaignStats> {
    await this.waitForInitialization();
    try {
      const stats = await this.donationActor.getCampaignStats();
      console.log("✅ ULTIMATE: Retrieved campaign stats");
      return stats;
    } catch (error) {
      console.error("❌ ULTIMATE: Failed to get campaign stats:", error);
      return {
        totalDonations: BigInt(0),
        totalAmount: BigInt(0),
        totalCampaigns: BigInt(0),
      };
    }
  }

  async getAllNFTs(): Promise<NFTMetadata[]> {
    await this.waitForInitialization();
    try {
      const nfts = await this.nftActor.getAllNFTs();
      console.log("✅ ULTIMATE: Retrieved", nfts.length, "NFTs");
      return nfts;
    } catch (error) {
      console.error("❌ ULTIMATE: Failed to get NFTs:", error);
      return [];
    }
  }
}

// Singleton instance management
let ultimateCanisterServiceInstance: UltimateCanisterService | null = null;

export const getUltimateCanisterService = (identity?: any): UltimateCanisterService => {
  if (!ultimateCanisterServiceInstance || (identity && identity !== (ultimateCanisterServiceInstance as any).lastIdentity)) {
    console.log("🚀 ULTIMATE: Creating new canister service instance");
    ultimateCanisterServiceInstance = new UltimateCanisterService(identity);
    (ultimateCanisterServiceInstance as any).lastIdentity = identity;
  }
  return ultimateCanisterServiceInstance;
};

export default UltimateCanisterService;
