import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/EnhancedWalletContext';
import { useToast } from '../contexts/ToastContext';
import { getCanisterService } from '../services/canisterService';
import type { Campaign } from '../types';

const CampaignsPage: React.FC = () => {
  const { wallet } = useWallet();
  const { showToast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadCampaigns = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Loading campaigns...');

      // Get canister service (can use anonymous identity for reading)
      const canisterService = getCanisterService();
      const campaignList = await canisterService.getCampaigns();
      
      console.log('📋 Campaigns loaded:', campaignList);
            setCampaigns(campaignList || []);
      
      if (campaignList && campaignList.length > 0) {
        showToast('success', 'Campaigns Loaded', `Found ${campaignList.length} campaign(s)`);
      } else {
        showToast('info', 'No Campaigns', 'No campaigns found. Create the first one!');
      }
    } catch (error) {
      console.error('❌ Error loading campaigns:', error);
      showToast('error', 'Loading Failed', 'Failed to load campaigns');
      setCampaigns([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const formatAmount = (amount: bigint): string => {
    // Convert from smallest unit back to display format
    return (Number(amount) / 100).toFixed(2);
  };

  const formatDate = (timestamp?: bigint): string => {
    if (!timestamp) return 'No end date';
    
    try {
      // Convert nanoseconds to milliseconds
      const date = new Date(Number(timestamp) / 1000000);
      return date.toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  const calculateProgress = (current: bigint, target: bigint): number => {
    if (target === 0n) return 0;
    return Math.min((Number(current) / Number(target)) * 100, 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-4 text-xl text-gray-600">Loading campaigns...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">All Campaigns</h1>
          <p className="text-xl text-gray-600 mb-8">
            Discover and support amazing causes in our community
          </p>
          <button
            onClick={loadCampaigns}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition duration-200"
          >
            🔄 Refresh Campaigns
          </button>
        </div>

        {/* Campaigns Grid */}
        {campaigns.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white rounded-lg shadow-xl p-12 max-w-2xl mx-auto">
              <div className="text-6xl mb-6">📝</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No Campaigns Yet</h3>
              <p className="text-gray-600 mb-8">
                Be the first to create a campaign and make a difference!
              </p>
              <a
                href="/create-campaign"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg transition duration-200 inline-block"
              >
                Create First Campaign
              </a>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="bg-white rounded-lg shadow-xl overflow-hidden hover:shadow-2xl transition-shadow duration-300">
                {/* Campaign Header */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6">
                  <h3 className="text-xl font-bold text-white truncate">{campaign.title}</h3>
                  <div className="flex items-center mt-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      campaign.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {campaign.isActive ? '🟢 Active' : '🔴 Inactive'}
                    </span>
                  </div>
                </div>

                {/* Campaign Content */}
                <div className="p-6">
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {campaign.description}
                  </p>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Progress</span>
                      <span>{calculateProgress(campaign.currentAmount, campaign.goalAmount).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${calculateProgress(campaign.currentAmount, campaign.goalAmount)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Amounts */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Raised</p>
                      <p className="text-lg font-bold text-green-600">
                        ${formatAmount(campaign.currentAmount)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Target</p>
                      <p className="text-lg font-bold text-indigo-600">
                        ${formatAmount(campaign.goalAmount)}
                      </p>
                    </div>
                  </div>

                  {/* Campaign Info */}
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-sm text-gray-500 mb-2">
                      <span>End Date:</span>
                      <span>{formatDate(campaign.endDate)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Campaign ID:</span>
                      <span className="font-mono truncate ml-2">{campaign.id.slice(0, 12)}...</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-6">
                    <button
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200"
                      onClick={() => {
                        showToast('info', 'Coming Soon', 'Donation functionality will be implemented soon!');
                      }}
                    >
                      💝 Donate Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        {campaigns.length > 0 && (
          <div className="mt-16 bg-white rounded-lg shadow-xl p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Platform Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-600">{campaigns.length}</div>
                <div className="text-gray-600">Total Campaigns</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {campaigns.filter(c => c.isActive).length}
                </div>
                <div className="text-gray-600">Active Campaigns</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  ${campaigns.reduce((sum, c) => sum + Number(formatAmount(c.goalAmount)), 0).toFixed(2)}
                </div>
                <div className="text-gray-600">Total Target</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  ${campaigns.reduce((sum, c) => sum + Number(formatAmount(c.currentAmount)), 0).toFixed(2)}
                </div>
                <div className="text-gray-600">Total Raised</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignsPage; 