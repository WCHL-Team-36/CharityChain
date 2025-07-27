import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/EnhancedWalletContext';
import { useToast } from '../contexts/ToastContext';
import { getCanisterService } from '../services/canisterService';
import { CreateCampaignData } from '../types';
import ImageUpload from '../components/ImageUpload';

const CreateCampaignPage: React.FC = () => {
  const { wallet } = useWallet();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    goalAmount: "",
    endDate: "",
    imageUrl: "",
  });

  const [imagePreview, setImagePreview] = useState<string>("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const generateCampaignId = (): string => {
    return `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleImageSelect = (file: File, preview: string) => {
    setImagePreview(preview);
    setFormData(prev => ({
      ...prev,
      imageUrl: preview
    }));
  };

  const handleImageRemove = () => {
    setImagePreview("");
    setFormData(prev => ({
      ...prev,
      imageUrl: ""
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!wallet.isConnected) {
      showToast("error", "Wallet Connection Required", "Please connect your wallet to create a campaign");
      return;
    }

    if (!formData.title.trim() || !formData.description.trim() || !formData.goalAmount) {
      showToast("error", "Missing Fields", "Please fill in all required fields");
      return;
    }

    const goalAmount = parseFloat(formData.goalAmount);
    if (goalAmount <= 0) {
      showToast("error", "Invalid Amount", "Target amount must be greater than 0");
      return;
    }

    setIsLoading(true);

    try {
      const campaignData: CreateCampaignData = {
        id: generateCampaignId(),
        title: formData.title,
        description: formData.description,
        goalAmount: BigInt(Math.round(goalAmount * 100)),
        endDate: formData.endDate ? BigInt(new Date(formData.endDate).getTime()) : undefined,
        imageUrl: formData.imageUrl || undefined,
      };

      const canisterService = getCanisterService();
      await canisterService.createCampaign(campaignData);

      showToast("success", "Campaign Created", "Your campaign has been successfully created!");
      
      setFormData({
        title: "",
        description: "",
        goalAmount: "",
        endDate: "",
        imageUrl: "",
      });
      handleImageRemove();
      
      setTimeout(() => {
        navigate('/campaigns');
      }, 2000);

    } catch (error) {
      console.error('Error creating campaign:', error);
      showToast("error", "Creation Failed", "Failed to create campaign. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!wallet.isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Wallet Connection Required</h3>
            <p className="text-sm text-gray-500 mb-6">
              Please connect your wallet to create a campaign
            </p>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-8">
            <h1 className="text-3xl font-bold text-white">🚀 Create New Campaign</h1>
            <p className="text-indigo-100 mt-2">Launch your charity campaign and make a difference</p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter campaign title"
                  required
                />
              </div>

              <div>
                <label htmlFor="goalAmount" className="block text-sm font-medium text-gray-700 mb-2">
                  Target Amount (USDT) *
                </label>
                <input
                  type="number"
                  id="goalAmount"
                  name="goalAmount"
                  value={formData.goalAmount}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={6}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Describe your campaign, its goals, and how the funds will be used..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Image
              </label>
              <ImageUpload
                onImageSelect={handleImageSelect}
                onImageRemove={handleImageRemove}
                currentImage={imagePreview}
                maxSize={5}
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                End Date (Optional)
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={() => navigate('/campaigns')}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center shadow-lg"
              >
                {isLoading ? "Creating..." : "🚀 Create Campaign"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateCampaignPage;
