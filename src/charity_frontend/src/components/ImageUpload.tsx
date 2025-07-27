import React, { useState, useRef, useCallback } from 'react';

interface ImageUploadProps {
  onImageSelect: (file: File, preview: string) => void;
  onImageRemove: () => void;
  currentImage?: string;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageSelect,
  onImageRemove,
  currentImage,
  maxSize = 5, // 5MB default
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      return `File type not supported. Please upload: ${acceptedTypes.map(type => type.split('/')[1]).join(', ')}`;
    }

    // Check file size
    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > maxSize) {
      return `File size must be less than ${maxSize}MB. Current size: ${fileSizeInMB.toFixed(2)}MB`;
    }

    return null;
  };

  const processFile = useCallback(async (file: File) => {
    setError(null);
    setIsLoading(true);

    try {
      // Validate file
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        setIsLoading(false);
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        onImageSelect(file, preview);
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Failed to process image');
      setIsLoading(false);
    }
  }, [onImageSelect, maxSize, acceptedTypes]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    onImageRemove();
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Upload Area */}
      {!currentImage ? (
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
            ${isDragging 
              ? 'border-indigo-500 bg-indigo-50' 
              : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
            }
            ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={!isLoading ? handleClick : undefined}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes.join(',')}
            onChange={handleFileSelect}
            className="hidden"
            disabled={isLoading}
          />

          {isLoading ? (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 mb-4 border-b-2 border-indigo-600 rounded-full animate-spin"></div>
              <p className="text-gray-600">Processing image...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <svg
                className="w-12 h-12 mx-auto mb-4 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="mb-2 text-lg font-medium text-gray-900">
                {isDragging ? 'Drop image here' : 'Upload campaign image'}
              </p>
              <p className="mb-4 text-sm text-gray-600">
                Drag and drop or click to select
              </p>
              <p className="text-xs text-gray-500">
                {acceptedTypes.map(type => type.split('/')[1]).join(', ').toUpperCase()} • Max {maxSize}MB
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Image Preview */
        <div className="relative">
          <div className="relative overflow-hidden bg-gray-100 rounded-lg">
            <img
              src={currentImage}
              alt="Campaign preview"
              className="object-cover w-full h-64"
            />
            
            {/* Overlay with actions */}
            <div className="absolute inset-0 flex items-center justify-center transition-all duration-200 bg-black bg-opacity-0 hover:bg-opacity-30 group">
              <div className="flex gap-2 transition-opacity duration-200 opacity-0 group-hover:opacity-100">
                <button
                  onClick={handleClick}
                  className="px-4 py-2 text-gray-700 transition-colors bg-white rounded-lg shadow-lg hover:bg-gray-50"
                  disabled={isLoading}
                >
                  📷 Change
                </button>
                <button
                  onClick={handleRemove}
                  className="px-4 py-2 text-white transition-colors bg-red-500 rounded-lg shadow-lg hover:bg-red-600"
                >
                  🗑️ Remove
                </button>
              </div>
            </div>
          </div>
          
          {/* Hidden file input for change */}
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes.join(',')}
            onChange={handleFileSelect}
            className="hidden"
            disabled={isLoading}
          />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 mt-3 border border-red-200 rounded-lg bg-red-50">
          <p className="flex items-center text-sm text-red-600">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        </div>
      )}

      {/* Upload Tips */}
      {!currentImage && !isLoading && (
        <div className="p-4 mt-4 border border-blue-200 rounded-lg bg-blue-50">
          <h4 className="mb-2 text-sm font-medium text-blue-900">📸 Image Tips:</h4>
          <ul className="space-y-1 text-xs text-blue-800">
            <li>• Use high-quality images (minimum 800x600px)</li>
            <li>• Choose images that represent your campaign well</li>
            <li>• Avoid copyrighted images</li>
            <li>• Supported formats: JPG, PNG, WebP</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
