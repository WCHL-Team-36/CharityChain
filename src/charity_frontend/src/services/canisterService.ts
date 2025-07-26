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
    createdAt: IDL.Int,
    endDate: IDL.Opt(IDL.Int),
    withdrawable: IDL.Bool,
  });

  const Donation = IDL.Record({
    id: IDL.Nat,
    donor: IDL.Principal,
    campaignId: IDL.Text,
    amount: IDL.Nat,
    timestamp: IDL.Int,
    txHash: IDL.Opt(IDL.Text),
  });

  const Result = (T: any, E: any) => IDL.Variant({ ok: T, err: E });

  return IDL.Service({
    createCampaign: IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Nat, IDL.Opt(IDL.Int)], [Result(Campaign, IDL.Text)], []),
    getCampaigns: IDL.Func([], [IDL.Vec(Campaign)], ["query"]),
    getCampaign: IDL.Func([IDL.Text], [IDL.Opt(Campaign)], ["query"]),
    donate: IDL.Func([IDL.Text, IDL.Nat], [Result(IDL.Null, DonationError)], []),
    getDonations: IDL.Func([IDL.Text], [IDL.Vec(Donation)], ["query"]),
    getDonationsByDonor: IDL.Func([IDL.Principal], [IDL.Vec(Donation)], ["query"]),
    withdraw: IDL.Func([IDL.Text], [Result(IDL.Null, DonationError)], []),
    getTotalStats: IDL.Func(
      [],
      [
        IDL.Record({
          totalDonations: IDL.Nat,
          totalAmount: IDL.Nat,
          totalCampaigns: IDL.Nat,
        }),
      ],
      ["query"]
    ),
  });
};

const nftCanisterIdl = ({ IDL }: any) => {
  const NFTError = IDL.Variant({
    TokenNotFound: IDL.Null,
    Unauthorized: IDL.Null,
    AlreadyExists: IDL.Null,
    InvalidMetadata: IDL.Null,
  });

  const NFTMetadata = IDL.Record({
    tokenId: IDL.Nat,
    donationId: IDL.Nat,
    donor: IDL.Principal,
    campaignId: IDL.Text,
    amount: IDL.Nat,
    timestamp: IDL.Int,
    imageUrl: IDL.Text,
    attributes: IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
  });

  const Result = (T: any, E: any) => IDL.Variant({ ok: T, err: E });

  return IDL.Service({
    mintDonationNFT: IDL.Func([IDL.Nat, IDL.Principal, IDL.Text, IDL.Nat], [Result(IDL.Nat, NFTError)], []),
    tokenMetadata: IDL.Func([IDL.Nat], [IDL.Opt(NFTMetadata)], ["query"]),
    tokensOf: IDL.Func([IDL.Principal], [IDL.Vec(IDL.Nat)], ["query"]),
    getAllNFTs: IDL.Func([], [IDL.Vec(NFTMetadata)], ["query"]),
    getNFTsByCampaign: IDL.Func([IDL.Text], [IDL.Vec(NFTMetadata)], ["query"]),
  });
};

// Canister IDs - loaded from environment or defaults for local development
const DONATION_CANISTER_ID = process.env.DONATION_CANISTER_ID || "u6s2n-gx777-77774-qaaba-cai";
const NFT_CANISTER_ID = process.env.NFT_CANISTER_ID || "uzt4z-lp777-77774-qaabq-cai";

class CanisterService {
  private agent: HttpAgent;
  private donationActor: any;
  private nftActor: any;
  private isInitialized: boolean = false;

  constructor(identity?: any) {
    console.log("🔧 CanisterService: Initializing with identity:", identity ? "Present" : "Anonymous");

    // Create agent with identity
    this.agent = new HttpAgent({
      host: process.env.DFX_NETWORK === "local" ? "http://127.0.0.1:4943" : "https://mainnet.dfinity.network",
      identity,
    });

    console.log("🔧 CanisterService: Agent created, host:", process.env.DFX_NETWORK === "local" ? "http://127.0.0.1:4943" : "https://mainnet.dfinity.network");

    // Initialize actors
    this.initializeActors();
  }

  private initializeActors() {
    // Fetch root key for local development
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

    // Create actors immediately
    console.log("🔧 CanisterService: Creating actors...");
    this.donationActor = Actor.createActor(donationCanisterIdl, {
      agent: this.agent,
      canisterId: DONATION_CANISTER_ID,
    });

    this.nftActor = Actor.createActor(nftCanisterIdl, {
      agent: this.agent,
      canisterId: NFT_CANISTER_ID,
    });

    console.log("✅ CanisterService: Actors created successfully");
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
      const result = await this.donationActor.createCampaign(data.id, data.title, data.description, data.targetAmount, data.endDate ? [data.endDate] : []);

      if ("err" in result) {
        throw new Error(result.err);
      }

      console.log("✅ CanisterService: Campaign created successfully");
      return result.ok;
    } catch (error) {
      console.error("❌ CanisterService: Failed to create campaign:", error);
      throw error;
    }
  }

  async getCampaigns(): Promise<Campaign[]> {
    console.log("🔧 CanisterService: Fetching campaigns...");
    await this.waitForInitialization();

    try {
      const campaigns = await this.donationActor.getCampaigns();
      console.log("✅ CanisterService: Retrieved", campaigns.length, "campaigns");
      return campaigns;
    } catch (error) {
      console.error("❌ CanisterService: Failed to fetch campaigns:", error);
      throw error;
    }
  }

  async getCampaign(id: string): Promise<Campaign | null> {
    console.log("🔧 CanisterService: Fetching campaign:", id);
    await this.waitForInitialization();

    try {
      const result = await this.donationActor.getCampaign(id);
      const campaign = result.length > 0 ? result[0] : null;
      console.log("✅ CanisterService: Campaign retrieved:", campaign ? "Found" : "Not found");
      return campaign;
    } catch (error) {
      console.error("❌ CanisterService: Failed to fetch campaign:", error);
      throw error;
    }
  }

  // Donation methods
  async donate(campaignId: string, amount: bigint, txHash?: string): Promise<Donation> {
    console.log("🔧 CanisterService: Making donation to campaign:", campaignId, "amount:", amount);
    await this.waitForInitialization();

    try {
      const result = await this.donationActor.donate(campaignId, amount, txHash ? [txHash] : []);

      if ("err" in result) {
        throw new Error(`Donation failed: ${Object.keys(result.err)[0]}`);
      }

      console.log("✅ CanisterService: Donation successful");
      return result.ok;
    } catch (error) {
      console.error("❌ CanisterService: Failed to make donation:", error);
      throw error;
    }
  }

  async getDonations(campaignId: string): Promise<Donation[]> {
    console.log("🔧 CanisterService: Fetching donations for campaign:", campaignId);
    await this.waitForInitialization();

    try {
      const donations = await this.donationActor.getDonations(campaignId);
      console.log("✅ CanisterService: Retrieved", donations.length, "donations");
      return donations;
    } catch (error) {
      console.error("❌ CanisterService: Failed to fetch donations:", error);
      throw error;
    }
  }

  async getDonationsByDonor(donor: Principal): Promise<Donation[]> {
    console.log("🔧 CanisterService: Fetching donations by donor:", donor.toString());
    await this.waitForInitialization();

    try {
      const donations = await this.donationActor.getDonationsByDonor(donor);
      console.log("✅ CanisterService: Retrieved", donations.length, "donations by donor");
      return donations;
    } catch (error) {
      console.error("❌ CanisterService: Failed to fetch donations by donor:", error);
      throw error;
    }
  }

  async withdraw(campaignId: string): Promise<bigint> {
    console.log("🔧 CanisterService: Withdrawing from campaign:", campaignId);
    await this.waitForInitialization();

    try {
      const result = await this.donationActor.withdraw(campaignId);

      if ("err" in result) {
        throw new Error(`Withdrawal failed: ${Object.keys(result.err)[0]}`);
      }

      console.log("✅ CanisterService: Withdrawal successful");
      return result.ok;
    } catch (error) {
      console.error("❌ CanisterService: Failed to withdraw:", error);
      throw error;
    }
  }

  async getTotalStats(): Promise<CampaignStats> {
    console.log("🔧 CanisterService: Fetching total stats...");
    await this.waitForInitialization();

    try {
      const stats = await this.donationActor.getTotalStats();
      console.log("✅ CanisterService: Total stats retrieved:", stats);
      return stats;
    } catch (error) {
      console.error("❌ CanisterService: Failed to fetch total stats:", error);
      throw error;
    }
  }

  // NFT methods
  async mintDonationNFT(donationId: bigint, donor: Principal, campaignId: string, amount: bigint): Promise<bigint> {
    console.log("🔧 CanisterService: Minting NFT for donation:", donationId);
    await this.waitForInitialization();

    try {
      const result = await this.nftActor.mintDonationNFT(donationId, donor, campaignId, amount);

      if ("err" in result) {
        throw new Error(`NFT minting failed: ${Object.keys(result.err)[0]}`);
      }

      console.log("✅ CanisterService: NFT minted successfully");
      return result.ok;
    } catch (error) {
      console.error("❌ CanisterService: Failed to mint NFT:", error);
      throw error;
    }
  }

  async getNFTsByOwner(owner: Principal): Promise<bigint[]> {
    console.log("🔧 CanisterService: Fetching NFTs for owner:", owner.toString());
    await this.waitForInitialization();

    try {
      const nfts = await this.nftActor.tokensOf(owner);
      console.log("✅ CanisterService: Retrieved", nfts.length, "NFTs for owner");
      return nfts;
    } catch (error) {
      console.error("❌ CanisterService: Failed to fetch NFTs by owner:", error);
      throw error;
    }
  }

  async getNFTMetadata(tokenId: bigint): Promise<NFTMetadata | null> {
    console.log("🔧 CanisterService: Fetching NFT metadata for token:", tokenId);
    await this.waitForInitialization();

    try {
      const result = await this.nftActor.tokenMetadata(tokenId);
      const metadata = result.length > 0 ? result[0] : null;
      console.log("✅ CanisterService: NFT metadata retrieved:", metadata ? "Found" : "Not found");
      return metadata;
    } catch (error) {
      console.error("❌ CanisterService: Failed to fetch NFT metadata:", error);
      throw error;
    }
  }

  async getAllNFTs(): Promise<NFTMetadata[]> {
    console.log("🔧 CanisterService: Fetching all NFTs...");
    await this.waitForInitialization();

    try {
      const nfts = await this.nftActor.getAllNFTs();
      console.log("✅ CanisterService: Retrieved", nfts.length, "NFTs");
      return nfts;
    } catch (error) {
      console.error("❌ CanisterService: Failed to fetch all NFTs:", error);
      throw error;
    }
  }

  async getNFTsByCampaign(campaignId: string): Promise<NFTMetadata[]> {
    console.log("🔧 CanisterService: Fetching NFTs for campaign:", campaignId);
    await this.waitForInitialization();

    try {
      const nfts = await this.nftActor.getNFTsByCampaign(campaignId);
      console.log("✅ CanisterService: Retrieved", nfts.length, "NFTs for campaign");
      return nfts;
    } catch (error) {
      console.error("❌ CanisterService: Failed to fetch NFTs by campaign:", error);
      throw error;
    }
  }
}

export default CanisterService;

// Export a function to get the service instance
export const getCanisterService = (identity?: any): CanisterService => {
  return new CanisterService(identity);
};
