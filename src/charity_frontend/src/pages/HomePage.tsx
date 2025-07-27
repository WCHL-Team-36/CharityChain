import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useWallet } from "../contexts/EnhancedWalletContext";
import { getCanisterService } from "../services/canisterService";
import { Campaign, CampaignStats } from "../types";

const HomePage: React.FC = () => {
  const { wallet } = useWallet();
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [featuredCampaigns, setFeaturedCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Use canister service (can work without wallet for reading)
      const canisterService = getCanisterService();

      try {
        const [statsData, campaigns] = await Promise.all([canisterService.getTotalStats(), canisterService.getCampaigns()]);

        setStats(statsData);
        // Show top 3 campaigns by progress
        const sortedCampaigns = campaigns
          .filter((c) => c.isActive)
          .sort((a, b) => {
            const progressA = Number(a.currentAmount) / Number(a.goalAmount);
            const progressB = Number(b.currentAmount) / Number(b.goalAmount);
            return progressB - progressA;
          })
          .slice(0, 3);

        setFeaturedCampaigns(sortedCampaigns);
      } catch (backendError) {
        console.log("Backend not ready or no campaigns yet:", backendError);
        // Set default data for UI testing
        setStats({
          totalDonations: BigInt(0),
          totalAmount: BigInt(0),
          totalCampaigns: BigInt(0),
        });
        setFeaturedCampaigns([]);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAmount = (amount: bigint) => {
    return (Number(amount) / 1000000).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getProgress = (current: bigint, target: bigint) => {
    return (Number(current) / Number(target)) * 100;
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section - Saweria Style */}
      <section className="py-16 text-white bg-gradient-to-br from-orange-400 via-red-400 to-pink-500">
        <div className="max-w-4xl px-4 mx-auto text-center sm:px-6 lg:px-8">
          <h1 className="mb-4 text-3xl font-bold md:text-5xl">Support creators you love ❤️</h1>
          <p className="max-w-2xl mx-auto mb-8 text-lg md:text-xl text-white/90">Send crypto donations to creators with ckUSDT on Internet Computer. 100% transparent, low fees, instant delivery.</p>
          <div className="flex flex-col justify-center max-w-md gap-3 mx-auto sm:flex-row">
            <Link to="/campaigns" className="px-6 py-3 font-semibold text-orange-500 transition-colors bg-white rounded-full shadow-lg hover:bg-gray-100">
              ✨ Discover Campaigns
            </Link>
            <Link to="/create-campaign" className="px-6 py-3 font-semibold transition-colors border rounded-full bg-white/20 hover:bg-white/30 backdrop-blur border-white/30">
              🚀 Start Receiving
            </Link>
          </div>
        </div>
      </section>

      {/* Wallet Setup Guide - Show only if wallet not connected */}
      {!wallet?.isConnected && (
        <section className="py-12 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="max-w-4xl px-4 mx-auto sm:px-6 lg:px-8">
            <div className="mb-8 text-center">
              <h2 className="mb-3 text-2xl font-bold text-gray-900">🔗 Get Started</h2>
              <p className="text-gray-600">Connect your Plug Wallet to start donating or creating campaigns</p>
            </div>

            <div className="p-6 bg-white shadow-lg rounded-xl md:p-8">
              <div className="grid items-center gap-8 md:grid-cols-2">
                <div>
                  <h3 className="mb-4 text-xl font-semibold text-gray-900">Quick Setup Guide</h3>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</span>
                      <div>
                        <p className="font-medium text-gray-900">Install Plug Wallet</p>
                        <p className="text-sm text-gray-600">
                          Download the browser extension from{" "}
                          <a href="https://plugwallet.ooo/" target="_blank" className="text-blue-600 underline">
                            plugwallet.ooo
                          </a>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</span>
                      <div>
                        <p className="font-medium text-gray-900">Open in Browser</p>
                        <p className="text-sm text-gray-600">Use Chrome or Firefox (not VS Code browser) for best experience</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</span>
                      <div>
                        <p className="font-medium text-gray-900">Connect & Start</p>
                        <p className="text-sm text-gray-600">Click "Connect Wallet" in the navigation to get started</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-blue-500">
                    <span className="text-4xl font-bold text-white">P</span>
                  </div>
                  <p className="mb-4 text-gray-600">Wallet Status</p>
                  {typeof window !== "undefined" && window.ic?.plug ? <div className="font-medium text-green-600">✅ Plug Wallet detected!</div> : <div className="font-medium text-orange-600">⚠️ Extension not found</div>}

                  <div className="p-3 mt-4 text-xs text-gray-500 rounded-lg bg-gray-50">
                    <strong>💡 Developer Note:</strong>
                    <br />
                    This app is running on local development.
                    <br />
                    URL: ucwa4-rx777-77774-qaada-cai.localhost:4943
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900">Making a Difference Together</h2>
            <p className="max-w-2xl mx-auto text-gray-600">Join thousands of donors who are creating positive change through transparent blockchain donations.</p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-8 text-center card">
                  <div className="w-12 h-12 mx-auto mb-4 bg-gray-200 rounded-full loading-pulse"></div>
                  <div className="h-8 mb-2 bg-gray-200 rounded loading-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded loading-pulse"></div>
                </div>
              ))}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="p-8 text-center card">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-charity-100">
                  <svg className="w-6 h-6 text-charity-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h3 className="mb-2 text-3xl font-bold text-gray-900">{formatAmount(stats.totalAmount)} ckUSDT</h3>
                <p className="text-gray-600">Total Donated</p>
              </div>

              <div className="p-8 text-center card">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-primary-100">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h3 className="mb-2 text-3xl font-bold text-gray-900">{Number(stats.totalDonations).toLocaleString()}</h3>
                <p className="text-gray-600">Total Donations</p>
              </div>

              <div className="p-8 text-center card">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-yellow-100 rounded-full">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="mb-2 text-3xl font-bold text-gray-900">{Number(stats.totalCampaigns).toLocaleString()}</h3>
                <p className="text-gray-600">Active Campaigns</p>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* Featured Creators */}
      <section className="py-12">
        <div className="max-w-6xl px-4 mx-auto sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h2 className="mb-3 text-2xl font-bold text-gray-900 md:text-3xl">✨ Featured Campaigns</h2>
            <p className="max-w-xl mx-auto text-gray-600">Support amazing campaigns that are making a difference</p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-6 card">
                  <div className="h-48 mb-4 bg-gray-200 rounded loading-pulse"></div>
                  <div className="h-6 mb-2 bg-gray-200 rounded loading-pulse"></div>
                  <div className="h-4 mb-4 bg-gray-200 rounded loading-pulse"></div>
                  <div className="h-2 bg-gray-200 rounded loading-pulse"></div>
                </div>
              ))}
            </div>
          ) : featuredCampaigns.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredCampaigns.map((campaign) => (
                <div key={campaign.id} className="p-6 transition-all duration-200 bg-white border border-gray-100 shadow-lg rounded-2xl hover:shadow-xl hover:-translate-y-1">
                  {/* Creator Avatar */}
                  <div className="flex items-center mb-4">
                    <div className="flex items-center justify-center w-12 h-12 text-lg font-bold text-white rounded-full bg-gradient-to-br from-orange-400 to-pink-500">{campaign.title.charAt(0)}</div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-gray-900">{campaign.title}</h3>
                      <p className="text-sm text-gray-500">Campaign</p>
                    </div>
                  </div>

                  <p className="mb-4 text-sm leading-relaxed text-gray-600 line-clamp-2">{campaign.description}</p>

                  {/* Stats */}
                  <div className="p-3 mb-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Raised</span>
                      <span className="font-semibold text-gray-900">{formatAmount(campaign.currentAmount)} ckUSDT</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full">
                      <div className="h-2 transition-all duration-300 rounded-full bg-gradient-to-r from-orange-400 to-pink-500" style={{ width: `${Math.min(getProgress(campaign.currentAmount, campaign.goalAmount), 100)}%` }}></div>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">Goal: {formatAmount(campaign.goalAmount)} ckUSDT</div>
                  </div>

                  <Link
                    to={`/campaigns/${campaign.id}`}
                    className="block w-full px-4 py-3 font-semibold text-center text-white transition-all duration-200 bg-gradient-to-r from-orange-400 to-pink-500 rounded-xl hover:from-orange-500 hover:to-pink-600"
                  >
                    💝 Support Campaign
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="mb-4 text-gray-500">No campaigns available yet.</p>
              <Link to="/create-campaign" className="btn-primary">
                Create the First Campaign
              </Link>
            </div>
          )}

          {featuredCampaigns.length > 0 && (
            <div className="mt-12 text-center">
              <Link to="/campaigns" className="btn-secondary">
                View All Campaigns
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features Section - Saweria Style */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-4xl px-4 mx-auto sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="mb-3 text-2xl font-bold text-gray-900 md:text-3xl">� HOMEPAGE TEST BERHASIL! 🚨</h2>
            <p className="max-w-xl mx-auto text-gray-600">The easiest way to support causes you care about</p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="p-6 bg-white border border-gray-100 rounded-2xl">
              <div className="flex items-start">
                <div className="flex items-center justify-center w-12 h-12 mr-4 bg-orange-100 rounded-xl">
                  <span className="text-2xl">⚡</span>
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">Instant & Transparent</h3>
                  <p className="text-sm text-gray-600">Every donation is recorded on blockchain. No hidden fees, no delays.</p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white border border-gray-100 rounded-2xl">
              <div className="flex items-start">
                <div className="flex items-center justify-center w-12 h-12 mr-4 bg-pink-100 rounded-xl">
                  <span className="text-2xl">💎</span>
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">NFT Receipts</h3>
                  <p className="text-sm text-gray-600">Supporters get unique NFTs as proof of their contribution.</p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white border border-gray-100 rounded-2xl">
              <div className="flex items-start">
                <div className="flex items-center justify-center w-12 h-12 mr-4 bg-green-100 rounded-xl">
                  <span className="text-2xl">🌍</span>
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">Global Payments</h3>
                  <p className="text-sm text-gray-600">Receive support from anywhere in the world with ckUSDT.</p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white border border-gray-100 rounded-2xl">
              <div className="flex items-start">
                <div className="flex items-center justify-center w-12 h-12 mr-4 bg-purple-100 rounded-xl">
                  <span className="text-2xl">🔒</span>
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">Secure & Reliable</h3>
                  <p className="text-sm text-gray-600">Built on Internet Computer with enterprise-grade security.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Saweria Style */}
      <section className="py-16 text-white gradient-bg">
        <div className="max-w-3xl px-4 mx-auto text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-2xl font-bold md:text-4xl">Ready to make a difference? 🚀</h2>
          <p className="mb-8 text-lg text-white/90">Join thousands of people supporting meaningful causes through CharityChain</p>
          <div className="flex flex-col justify-center max-w-lg gap-4 mx-auto sm:flex-row">
            {wallet && wallet.isConnected ? (
              <>
                <Link to="/campaigns" className="px-6 py-3 font-semibold text-orange-500 transition-colors bg-white rounded-full shadow-lg hover:bg-gray-100">
                  ✨ Explore Campaigns
                </Link>
                <Link to="/create-campaign" className="px-6 py-3 font-semibold transition-colors border rounded-full bg-white/20 hover:bg-white/30 backdrop-blur border-white/30">
                  🎯 Start My Page
                </Link>
              </>
            ) : (
              <div className="px-6 py-3 font-semibold border rounded-full bg-white/20 backdrop-blur border-white/30">Connect your wallet to get started ⭐</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
