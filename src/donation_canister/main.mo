import Principal "mo:base/Principal";
import Array "mo:base/Array";
import Time "mo:base/Time";
import Result "mo:base/Result";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Int "mo:base/Int";
import Float "mo:base/Float";


actor DonationCanister {
    
    // Types
    public type Result<T, E> = Result.Result<T, E>;
    
    public type Donation = {
        id: Nat;
        donor: Principal;
        campaignId: Text;
        amount: Nat;
        timestamp: Int;
        txHash: ?Text;
    };
    
 type CampaignId = Text;

  type Campaign = {
  id: CampaignId;
  recipient: Principal;
  title: Text;
  description: Text;
  goalAmount: Nat;
  currentAmount: Nat;
  isActive: Bool;
  createdAt: Int;
  endDate: ?Int;
  withdrawable: Bool;
};

    public type DonationError = {
        #CampaignNotFound;
        #InsufficientAmount;
        #CampaignInactive;
        #Unauthorized;
        #TransferFailed;
        #CampaignExpired;
        #InvalidInput;
    };


    // State
    private var campaigns = HashMap.HashMap<CampaignId, Campaign>(0, Text.equal, Text.hash);
    private stable var nextDonationId: Nat = 0;
    private stable var campaignEntries: [(Text, Campaign)] = [];
    private stable var donationEntries: [(Nat, Donation)] = [];
    
    
    private var donations = HashMap.fromIter<Nat, Donation>(
        donationEntries.vals(), donationEntries.size(), Nat.equal, func(n: Nat): Nat32 { Nat32.fromNat(n) }
    );

    // Admin principal (deployer) - will be set during deployment
    private stable var admin: Principal = Principal.fromText("2vxsx-fae"); // Anonymous principal as default

    // ICRC-1 Token Canister ID for ckUSDT - will be configured later
    private stable var _ckUSDT_CANISTER: Principal = Principal.fromText("2vxsx-fae"); // Anonymous principal as placeholder

    // System functions
    system func preupgrade() {
        campaignEntries := Iter.toArray(campaigns.entries());
        donationEntries := Iter.toArray(donations.entries());
    };

    system func postupgrade() {
        campaigns := HashMap.fromIter<CampaignId, Campaign>(
            campaignEntries.vals(), campaignEntries.size(), Text.equal, Text.hash
        );
        donations := HashMap.fromIter<Nat, Donation>(
            donationEntries.vals(), donationEntries.size(), Nat.equal, func(n: Nat): Nat32 { Nat32.fromNat(n) }
        );
        campaignEntries := [];
        donationEntries := [];
    };

    // Create a new campaign
    public shared(msg) func createCampaign(
        id: Text,
        title: Text, 
        description: Text,
        targetAmount: Nat,
        endDate: ?Int
    ): async Result<Campaign, Text> {
        
        // Input validation
        if (Text.size(id) == 0) {
            return #err("Campaign ID cannot be empty");
        };
        if (Text.size(title) == 0) {
            return #err("Campaign title cannot be empty");
        };
        if (Text.size(description) == 0) {
            return #err("Campaign description cannot be empty");
        };
        if (targetAmount == 0) {
            return #err("Target amount must be greater than 0");
        };
        
        // Check if campaign already exists
        switch (campaigns.get(id)) {
            case (?_) { return #err("Campaign with this ID already exists") };
            case null {};
        };
        
        let campaign: Campaign = {
            id = id;
            title = title;
            description = description;
            recipient = msg.caller;
            goalAmount = targetAmount;
            currentAmount = 0;
            isActive = true;
            createdAt = Time.now();
            endDate = endDate;
            withdrawable = false;
        };
        
        campaigns.put(id, campaign);
        #ok(campaign)
    };

    // Get all campaigns
    public query func getCampaigns(): async [Campaign] {
        Iter.toArray(campaigns.vals())
    };

    // Get specific campaign
    public query func getCampaign(id: Text): async ?Campaign {
        campaigns.get(id)
    };
    
    private shared func simulateTokenTransferTo(_recipient: Principal, _amount: Nat): async Bool {
    // Dummy transfer, return true to simulate success
    true
};

    // Make a donation
   // Donasi ke campaign
  public shared(msg) func donate(campaignId: CampaignId, amount: Nat) : async Result<(), DonationError> {
    // CHECK: Validate inputs and conditions
    if (amount == 0) {
        return #err(#InsufficientAmount);
    };
    
    switch (campaigns.get(campaignId)) {
      case null {
        return #err(#CampaignNotFound);
      };
      case (?campaign) {
        if (not campaign.isActive) {
          return #err(#CampaignInactive);
        };

        // Check if campaign has ended
        switch (campaign.endDate) {
            case (?endTime) {
                if (Time.now() > endTime) {
                    return #err(#CampaignInactive);
                };
            };
            case null {};
        };

        // EFFECTS: Update internal state first
        let newAmount = campaign.currentAmount + amount;
        let donationId = nextDonationId;
        nextDonationId += 1;

        let updatedCampaign: Campaign = {
          campaign with
          currentAmount = newAmount;
          // Jika sudah terpenuhi goal, mark withdrawable true
          withdrawable = newAmount >= campaign.goalAmount;
        };

        // Create donation record
        let donation: Donation = {
            id = donationId;
            donor = msg.caller;
            campaignId = campaignId;
            amount = amount;
            timestamp = Time.now();
            txHash = null; // Will be set when actual token transfer is implemented
        };

        // Update state
        campaigns.put(campaignId, updatedCampaign);
        donations.put(donationId, donation);

        // INTERACTIONS: External calls would go here (token transfers, etc.)
        // For now we're just simulating, but in real implementation this would be:
        // let transferResult = await tokenCanister.transferFrom(msg.caller, address, amount);
        
        return #ok(());
      };
    }
  };

    // Get donations for a campaign
    public query func getDonations(campaignId: Text): async [Donation] {
        let allDonations = Iter.toArray(donations.vals());
        Array.filter<Donation>(allDonations, func(d: Donation): Bool {
            d.campaignId == campaignId
        })
    };

    // Get donations by donor
    public query func getDonationsByDonor(donor: Principal): async [Donation] {
        let allDonations = Iter.toArray(donations.vals());
        Array.filter<Donation>(allDonations, func(d: Donation): Bool {
            d.donor == donor
        })
    };

    // Withdraw funds (only campaign recipient)
 public shared(msg) func withdraw(campaignId: CampaignId): async Result<(), DonationError> {
    // CHECK: Validate all conditions first
    switch (campaigns.get(campaignId)) {
      case null {
        return #err(#CampaignNotFound);
      };
      case (?campaign) {
        if (msg.caller != campaign.recipient) {
          return #err(#Unauthorized);
        };
        if (not campaign.isActive) {
          return #err(#CampaignInactive);
        };
        if (not campaign.withdrawable or campaign.currentAmount == 0) {
          return #err(#InsufficientAmount);
        };

        // Store the amount to withdraw before state changes
        let withdrawAmount = campaign.currentAmount;

        // EFFECTS: Update internal state first (prevent reentrancy)
        let updatedCampaign : Campaign = {
          campaign with
          isActive = false;
          withdrawable = false;
          currentAmount = 0; // Reset saldo untuk mencegah double spending
        };
        campaigns.put(campaignId, updatedCampaign);

        // INTERACTIONS: External calls last
        let transferResult : Bool = await simulateTokenTransferTo(campaign.recipient, withdrawAmount);

        if (not transferResult) {
          // Gagal transfer, rollback state ke kondisi sebelumnya
          campaigns.put(campaignId, campaign);
          return #err(#TransferFailed);
        };

        return #ok(());
      };
    }
  };

    // Admin function to update campaign status
    public shared(msg) func updateCampaignStatus(campaignId: Text, isActive: Bool): async Result<(), Text> {
        if (msg.caller != admin) {
            return #err("Unauthorized");
        };
        
        switch (campaigns.get(campaignId)) {
            case null { #err("Campaign not found") };
            case (?campaign) {
                let updatedCampaign: Campaign = {
                    campaign with isActive = isActive;
                };
                campaigns.put(campaignId, updatedCampaign);
                #ok()
            };
        }
    };

    // Get total donation stats
    public query func getTotalStats(): async {totalDonations: Nat; totalAmount: Nat; totalCampaigns: Nat} {
        let allDonations = Iter.toArray(donations.vals());
        let totalAmount = Array.foldLeft<Donation, Nat>(allDonations, 0, func(acc, donation) {
            acc + donation.amount
        });
        
        {
            totalDonations = allDonations.size();
            totalAmount = totalAmount;
            totalCampaigns = campaigns.size();
        }
    };

    // Emergency function to pause all campaigns (admin only)
    public shared(msg) func emergencyPause(): async Result<(), Text> {
        if (msg.caller != admin) {
            return #err("Unauthorized: Only admin can pause campaigns");
        };
        
        for ((id, campaign) in campaigns.entries()) {
            let updatedCampaign: Campaign = {
                campaign with isActive = false;
            };
            campaigns.put(id, updatedCampaign);
        };
        
        #ok()
    };

    // Function to check and deactivate expired campaigns
    public func deactivateExpiredCampaigns(): async Nat {
        let currentTime = Time.now();
        var deactivatedCount = 0;
        
        for ((id, campaign) in campaigns.entries()) {
            switch (campaign.endDate) {
                case (?endTime) {
                    if (currentTime > endTime and campaign.isActive) {
                        let updatedCampaign: Campaign = {
                            campaign with isActive = false;
                        };
                        campaigns.put(id, updatedCampaign);
                        deactivatedCount += 1;
                    };
                };
                case null {};
            };
        };
        
        deactivatedCount
    };

    // Get campaign statistics
    public query func getCampaignStats(campaignId: Text): async ?{
        totalDonations: Nat;
        totalAmount: Nat;
        donorCount: Nat;
        percentageReached: Float;
        isExpired: Bool;
    } {
        switch (campaigns.get(campaignId)) {
            case null { null };
            case (?campaign) {
                let campaignDonations = Array.filter<Donation>(
                    Iter.toArray(donations.vals()), 
                    func(d: Donation): Bool { d.campaignId == campaignId }
                );
                
                let uniqueDonors = Array.size(
                    Array.foldLeft<Donation, [Principal]>(
                        campaignDonations, 
                        [], 
                        func(acc: [Principal], donation: Donation): [Principal] {
                            if (Array.find<Principal>(acc, func(p: Principal): Bool { p == donation.donor }) == null) {
                                Array.append<Principal>(acc, [donation.donor])
                            } else {
                                acc
                            }
                        }
                    )
                );
                
                let percentageReached = if (campaign.goalAmount == 0) {
                    0.0
                } else {
                    Float.fromInt(campaign.currentAmount) / Float.fromInt(campaign.goalAmount) * 100.0
                };
                
                let isExpired = switch (campaign.endDate) {
                    case (?endTime) { Time.now() > endTime };
                    case null { false };
                };
                
                ?{
                    totalDonations = Array.size(campaignDonations);
                    totalAmount = campaign.currentAmount;
                    donorCount = uniqueDonors;
                    percentageReached = percentageReached;
                    isExpired = isExpired;
                }
            };
        }
    };
}
