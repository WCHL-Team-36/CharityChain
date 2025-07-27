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
    withdrawable: IDL.Bool,
    imageUrl: IDL.Opt(IDL.Text),
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
    createCampaign: IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Nat, IDL.Opt(IDL.Int), IDL.Opt(IDL.Text)], [IDL.Variant({ ok: Campaign, err: DonationError })], []),
    getCampaigns: IDL.Func([], [IDL.Vec(Campaign)], ["query"]),
    getCampaign: IDL.Func([IDL.Text], [IDL.Opt(Campaign)], ["query"]),
    donate: IDL.Func([IDL.Text, IDL.Nat], [IDL.Variant({ ok: IDL.Nat, err: DonationError })], []),
    getDonations: IDL.Func([IDL.Text], [IDL.Vec(Donation)], ["query"]),
    getTotalStats: IDL.Func([], [CampaignStats], ["query"]),
  });
};

const nftCanisterIdl = ({ IDL }: any) => {
  const NFTError = IDL.Variant({
    Unauthorized: IDL.Null,
    TokenNotFound: IDL.Null,
    InvalidRecipient: IDL.Null,
    InsufficientFunds: IDL.Null,
    MintingFailed: IDL.Null,
  });

  const NFTMetadata = IDL.Record({
    id: IDL.Nat,
    donor: IDL.Principal,
    campaignId: IDL.Text,
    amount: IDL.Nat,
    timestamp: IDL.Int,
    imageUrl: IDL.Text,
    attributes: IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
  });

  return IDL.Service({
    mintNFT: IDL.Func([IDL.Principal, IDL.Nat, IDL.Text, IDL.Nat], [IDL.Variant({ ok: IDL.Nat, err: NFTError })], []),
    getNFTsByOwner: IDL.Func([IDL.Principal], [IDL.Vec(NFTMetadata)], ["query"]),
    getNFTMetadata: IDL.Func([IDL.Nat], [IDL.Opt(NFTMetadata)], ["query"]),
    getAllNFTs: IDL.Func([], [IDL.Vec(NFTMetadata)], ["query"]),
  });
};

// Canister IDs (these should match your dfx.json)
const DONATION_CANISTER_ID = "u6s2n-gx777-77774-qaaba-cai";
const NFT_CANISTER_ID = "uzt4z-lp777-77774-qaabq-cai";

export class CanisterService {
  private agent: HttpAgent;
  private donationActor: any;
  private nftActor: any;
  private isInitialized: boolean = false;

  constructor(identity?: any) {
    console.log("🔧 CanisterService: Initializing with identity:", identity ? "Present" : "Anonymous");

    // Handle Plug Wallet specially - use their createActor method
    if (identity && (window as any).ic?.plug && identity === (window as any).ic.plug.agent) {
      console.log("🔧 CanisterService: Using Plug Wallet - creating actors via Plug");
      this.agent = identity;
      this.initializePlugActors();
    } else {
      // Create agent with identity for other wallet types
      this.agent = new HttpAgent({
        host: process.env.DFX_NETWORK === "ic" ? "https://mainnet.dfinity.network" : "http://127.0.0.1:4943",
        identity,
      });

      console.log("🔧 CanisterService: Agent created, host:", process.env.DFX_NETWORK === "local" ? "http://127.0.0.1:4943" : "https://mainnet.dfinity.network");

      // Initialize actors for non-Plug wallets
      this.initializeStandardActors();
    }
  }

  private async initializePlugActors() {
    try {
      console.log("🔧 CanisterService: Creating actors via Plug Wallet...");

      // For local development, we need to ensure Plug uses the correct host
      const host = process.env.DFX_NETWORK === "ic" ? "https://mainnet.dfinity.network" : "http://127.0.0.1:4943";

      // Use Plug's createActor method with proper host configuration
      this.donationActor = await (window as any).ic.plug.createActor({
        canisterId: DONATION_CANISTER_ID,
        interfaceFactory: donationCanisterIdl,
        host: host,
      });

      this.nftActor = await (window as any).ic.plug.createActor({
        canisterId: NFT_CANISTER_ID,
        interfaceFactory: nftCanisterIdl,
        host: host,
      });

      console.log("✅ CanisterService: Plug actors created successfully");
      console.log("🔧 CanisterService: Donation canister ID:", DONATION_CANISTER_ID);
      console.log("🔧 CanisterService: NFT canister ID:", NFT_CANISTER_ID);
      console.log("🔧 CanisterService: Host:", host);

      this.isInitialized = true;
    } catch (error) {
      console.error("❌ CanisterService: Failed to create Plug actors:", error);
      throw error;
    }
  }

  private initializeStandardActors() {
    // For standard wallets, fetch root key if local
    if (process.env.DFX_NETWORK === "local") {
      console.log("🔧 CanisterService: Fetching root key for local development...");
      this.agent
        .fetchRootKey()
        .then(() => {
          console.log("✅ CanisterService: Root key fetched successfully");
          this.isInitialized = true;
        })
        .catch((err) => {
          console.error("❌ CanisterService: Unable to fetch root key:", err);
          console.warn("Check to ensure that your local replica is running");
          // Still try to initialize actors even if root key fetch fails
          this.isInitialized = true;
        });
    } else {
      this.isInitialized = true;
    }

    // Create actors for standard wallets
    console.log("🔧 CanisterService: Creating actors for standard wallet...");

    this.donationActor = Actor.createActor(donationCanisterIdl, {
      agent: this.agent,
      canisterId: DONATION_CANISTER_ID,
    });

    this.nftActor = Actor.createActor(nftCanisterIdl, {
      agent: this.agent,
      canisterId: NFT_CANISTER_ID,
    });

    console.log("✅ CanisterService: Standard actors created successfully");
    console.log("🔧 CanisterService: Donation canister ID:", DONATION_CANISTER_ID);
    console.log("🔧 CanisterService: NFT canister ID:", NFT_CANISTER_ID);
  }

  // Wait for initialization to complete (especially root key fetch)
  private async waitForInitialization(): Promise<void> {
    if (this.isInitialized) return;

    // Wait up to 5 seconds for initialization
    for (let i = 0; i < 50; i++) {
      if (this.isInitialized) return;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.warn("⚠️ CanisterService: Initialization timeout, proceeding anyway");
  }

  // Campaign methods
  async createCampaign(data: CreateCampaignData): Promise<Campaign> {
    console.log("🔧 CanisterService: Creating campaign:", data.title);
    await this.waitForInitialization();

    try {
      // Special handling for Plug Wallet
      if ((window as any).ic?.plug && this.agent === (window as any).ic.plug.agent) {
        console.log("🔧 CanisterService: Using Plug Wallet with existing actor...");

        if (!this.donationActor) {
          throw new Error("Donation actor not initialized for Plug Wallet");
        }

        const result = await this.donationActor.createCampaign(data.id, data.title, data.description, data.goalAmount, data.endDate ? [data.endDate] : [], data.imageUrl ? [data.imageUrl] : []);

        if (result.ok) {
          console.log("✅ CanisterService: Campaign created successfully");
          return result.ok;
        } else {
          console.error("❌ CanisterService: Campaign creation failed:", result.err);
          throw new Error(`Campaign creation failed: ${JSON.stringify(result.err)}`);
        }
      } else {
        // Standard wallet logic
        const result = await this.donationActor.createCampaign(data.id, data.title, data.description, data.goalAmount, data.endDate ? [data.endDate] : [], data.imageUrl ? [data.imageUrl] : []);

        if (result.ok) {
          console.log("✅ CanisterService: Campaign created successfully");
          return result.ok;
        } else {
          console.error("❌ CanisterService: Campaign creation failed:", result.err);
          throw new Error(`Campaign creation failed: ${JSON.stringify(result.err)}`);
        }
      }
    } catch (error) {
      console.error("❌ CanisterService: Failed to create campaign:", error);
      throw error;
    }
  }

  async getCampaigns(): Promise<Campaign[]> {
    console.log("🔧 CanisterService: Getting campaigns");
    await this.waitForInitialization();

    try {
      const campaigns = await this.donationActor?.getCampaigns();
      console.log(`✅ CanisterService: Retrieved ${campaigns?.length || 0} campaigns`);
      return campaigns || [];
    } catch (error) {
      console.error("❌ CanisterService: Failed to get campaigns:", error);
      throw error;
    }
  }

  async getCampaign(id: string): Promise<Campaign | null> {
    console.log("🔧 CanisterService: Getting campaign by ID:", id);
    await this.waitForInitialization();

    try {
      const result = await this.donationActor?.getCampaign(id);
      const campaign = result?.[0] || null;
      console.log("✅ CanisterService: Campaign retrieved:", campaign ? "Found" : "Not found");
      return campaign;
    } catch (error) {
      console.error("❌ CanisterService: Failed to get campaign:", error);
      throw error;
    }
  }

  async donate(campaignId: string, amount: bigint): Promise<number> {
    console.log("🔧 CanisterService: Donating to campaign:", campaignId);
    await this.waitForInitialization();

    try {
      const result = await this.donationActor?.donate(campaignId, amount);
      if (result?.ok !== undefined) {
        console.log("✅ CanisterService: Donation successful, ID:", result.ok);
        return Number(result.ok);
      } else {
        console.error("❌ CanisterService: Donation failed:", result?.err);
        throw new Error(`Donation failed: ${JSON.stringify(result?.err)}`);
      }
    } catch (error) {
      console.error("❌ CanisterService: Failed to donate:", error);
      throw error;
    }
  }

  async getDonations(campaignId: string): Promise<Donation[]> {
    console.log("🔧 CanisterService: Getting donations for campaign:", campaignId);
    await this.waitForInitialization();

    try {
      const donations = await this.donationActor?.getDonations(campaignId);
      console.log(`✅ CanisterService: Retrieved ${donations?.length || 0} donations`);
      return donations || [];
    } catch (error) {
      console.error("❌ CanisterService: Failed to get donations:", error);
      throw error;
    }
  }

  async getTotalStats(): Promise<CampaignStats> {
    console.log("🔧 CanisterService: Getting total stats");
    await this.waitForInitialization();

    try {
      const stats = await this.donationActor?.getTotalStats();
      console.log("✅ CanisterService: Stats retrieved:", stats);
      return stats || { totalDonations: 0n, totalAmount: 0n, totalCampaigns: 0n };
    } catch (error) {
      console.error("❌ CanisterService: Failed to get stats:", error);
      throw error;
    }
  }

  // NFT methods
  async mintNFT(recipient: Principal, donationId: bigint, campaignId: string, amount: bigint): Promise<bigint> {
    console.log("🔧 CanisterService: Minting NFT for donation:", donationId);
    await this.waitForInitialization();

    try {
      const result = await this.nftActor?.mintNFT(recipient, donationId, campaignId, amount);
      if (result?.ok !== undefined) {
        console.log("✅ CanisterService: NFT minted successfully, ID:", result.ok);
        return result.ok;
      } else {
        console.error("❌ CanisterService: NFT minting failed:", result?.err);
        throw new Error(`NFT minting failed: ${JSON.stringify(result?.err)}`);
      }
    } catch (error) {
      console.error("❌ CanisterService: Failed to mint NFT:", error);
      throw error;
    }
  }

  async getNFTsByOwner(owner: Principal): Promise<NFTMetadata[]> {
    console.log("🔧 CanisterService: Getting NFTs for owner:", owner.toString());
    await this.waitForInitialization();

    try {
      const nfts = await this.nftActor?.getNFTsByOwner(owner);
      console.log(`✅ CanisterService: Retrieved ${nfts?.length || 0} NFTs for owner`);
      return nfts || [];
    } catch (error) {
      console.error("❌ CanisterService: Failed to get NFTs by owner:", error);
      throw error;
    }
  }

  async getNFTMetadata(tokenId: bigint): Promise<NFTMetadata | null> {
    console.log("🔧 CanisterService: Getting NFT metadata for token:", tokenId);
    await this.waitForInitialization();

    try {
      const result = await this.nftActor?.getNFTMetadata(tokenId);
      const metadata = result?.[0] || null;
      console.log("✅ CanisterService: NFT metadata retrieved:", metadata ? "Found" : "Not found");
      return metadata;
    } catch (error) {
      console.error("❌ CanisterService: Failed to get NFT metadata:", error);
      throw error;
    }
  }

  async getAllNFTs(): Promise<NFTMetadata[]> {
    console.log("🔧 CanisterService: Getting all NFTs");
    await this.waitForInitialization();

    try {
      const nfts = await this.nftActor?.getAllNFTs();
      console.log(`✅ CanisterService: Retrieved ${nfts?.length || 0} total NFTs`);
      return nfts || [];
    } catch (error) {
      console.error("❌ CanisterService: Failed to get all NFTs:", error);
      throw error;
    }
  }
}

// Factory function to create CanisterService instance
export const getCanisterService = (identity?: any): CanisterService => {
  return new CanisterService(identity);
};

export default CanisterService;
