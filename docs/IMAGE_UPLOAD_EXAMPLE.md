// Contoh penggunaan ImageUpload di CreateCampaignPage.tsx
// Tambahkan di bagian import:
import ImageUpload from '../components/ImageUpload';

// Tambahkan di state formData:
const [formData, setFormData] = useState({
  id: "",
  title: "",
  description: "",
  goalAmount: "",
  endDate: "",
  imageUrl: "", // Tambahkan ini
});

// Tambahkan state untuk image:
const [selectedImage, setSelectedImage] = useState<File | null>(null);
const [imagePreview, setImagePreview] = useState<string>("");

// Handler untuk image upload:
const handleImageSelect = (file: File, preview: string) => {
  setSelectedImage(file);
  setImagePreview(preview);
  setFormData(prev => ({
    ...prev,
    imageUrl: preview // Atau URL yang akan diupload ke storage
  }));
};

const handleImageRemove = () => {
  setSelectedImage(null);
  setImagePreview("");
  setFormData(prev => ({
    ...prev,
    imageUrl: ""
  }));
};

// Di bagian JSX form, tambahkan setelah description:
{/* Campaign Image */}
<div className="mb-6">
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

// Update fungsi createCampaign untuk include image:
const campaignData: CreateCampaignData = {
  id: formData.id,
  title: formData.title,
  description: formData.description,
  goalAmount: BigInt(Math.round(parseFloat(formData.goalAmount) * 100)),
  endDate: formData.endDate ? BigInt(new Date(formData.endDate).getTime()) : undefined,
  imageUrl: formData.imageUrl // Tambahkan ini
};
