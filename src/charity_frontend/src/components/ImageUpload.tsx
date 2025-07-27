import React, { useCallback, useRef, useState } from "react";
import imageCompression from "browser-image-compression";

export interface ImageUploadProps {
  onImageSelect: (file: File, preview: string) => void;
  onImageRemove: () => void;
  currentImage?: string;
  maxSize?: number;
  acceptedTypes?: string[];
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onImageSelect, onImageRemove, currentImage, maxSize = 10, acceptedTypes = ["image/jpeg", "image/png", "image/webp"], className = "" }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return "Invalid file type. Please select a " + acceptedTypes.map((type) => type.split("/")[1]).join(", ") + " file.";
    }

    const fileSizeKB = file.size / 1024;
    if (fileSizeKB > maxSize * 1024) {
      return "File is too large. Maximum size is " + maxSize + "MB.";
    }

    return null;
  };

  const compressImage = async (file: File): Promise<File> => {
    console.log("🚀 COMPRESSION START: Processing file", file.name);
    console.log("🚀 ORIGINAL SIZE:", (file.size / 1024 / 1024).toFixed(2), "MB");

    const options = {
      maxSizeMB: 0.8,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
      fileType: "image/jpeg",
      quality: 0.6,
    };

    try {
      console.log("🔧 COMPRESSION OPTIONS:", options);
      const compressedFile = await imageCompression(file, options);

      const originalMB = (file.size / 1024 / 1024).toFixed(2);
      const compressedMB = (compressedFile.size / 1024 / 1024).toFixed(2);

      console.log("✅ COMPRESSION SUCCESS:", originalMB, "MB →", compressedMB, "MB");
      console.log("✅ FINAL SIZE (bytes):", compressedFile.size);

      if (compressedFile.size > 700 * 1024) {
        console.log("⚠️ STILL TOO LARGE, APPLYING ULTRA COMPRESSION...");
        const ultraOptions = {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 800,
          useWebWorker: true,
          fileType: "image/jpeg",
          quality: 0.4,
        };

        const finalFile = await imageCompression(compressedFile, ultraOptions);
        const finalMB = (finalFile.size / 1024 / 1024).toFixed(2);
        console.log("🔥 ULTRA COMPRESSION RESULT:", finalMB, "MB");
        console.log("🔥 ULTRA FINAL SIZE (bytes):", finalFile.size);
        return finalFile;
      }

      return compressedFile;
    } catch (error) {
      console.error("❌ COMPRESSION ERROR:", error);
      throw new Error("Failed to compress image: " + error);
    }
  };

  const processFile = useCallback(
    async (file: File) => {
      console.log("🎯 PROCESS FILE START:", file.name, "Size:", (file.size / 1024 / 1024).toFixed(2), "MB");

      setError(null);
      setIsLoading(true);

      try {
        const validationError = validateFile(file);
        if (validationError) {
          console.log("❌ VALIDATION ERROR:", validationError);
          setError(validationError);
          setIsLoading(false);
          return;
        }

        let processedFile = file;
        const fileSizeKB = file.size / 1024;
        const fileSizeMB = fileSizeKB / 1024;

        if (fileSizeKB > 1024) {
          console.log("🔄 COMPRESSION TRIGGERED! File is", fileSizeMB.toFixed(2), "MB, threshold is 1MB");
          processedFile = await compressImage(file);
          const newSizeKB = processedFile.size / 1024;
          const newSizeMB = newSizeKB / 1024;
          console.log("🎉 COMPRESSION COMPLETED:", fileSizeMB.toFixed(2), "MB →", newSizeMB.toFixed(2), "MB");
        } else {
          console.log("ℹ️ NO COMPRESSION NEEDED: File size", fileSizeMB.toFixed(2), "MB is under 1MB threshold");
        }

        console.log("📁 CREATING FILE PREVIEW...");
        const reader = new FileReader();
        reader.onload = (e) => {
          const preview = e.target?.result as string;
          console.log("✅ PREVIEW CREATED, CALLING onImageSelect");
          onImageSelect(processedFile, preview);
          setIsLoading(false);
        };
        reader.readAsDataURL(processedFile);
      } catch (err) {
        console.error("❌ IMAGE PROCESSING ERROR:", err);
        setError("Failed to process image: " + err);
        setIsLoading(false);
      }
    },
    [onImageSelect, maxSize, acceptedTypes]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("📤 FILE SELECTED:", file.name);
      processFile(file);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        console.log("📤 FILE DROPPED:", file.name);
        processFile(file);
      }
    },
    [processFile]
  );

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
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={"w-full " + className}>
      {!currentImage ? (
        <div
          className={
            "relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 " +
            (isDragging ? "border-indigo-500 bg-indigo-50" : "border-gray-300 hover:border-indigo-400 hover:bg-gray-50") +
            " " +
            (isLoading ? "opacity-50 cursor-not-allowed" : "")
          }
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={!isLoading ? handleClick : undefined}
        >
          <input ref={fileInputRef} type="file" accept={acceptedTypes.join(",")} onChange={handleFileSelect} className="hidden" disabled={isLoading} />

          {isLoading ? (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 mb-4 border-b-2 border-indigo-600 rounded-full animate-spin"></div>
              <p className="text-gray-600">🔄 Processing image...</p>
              <p className="mt-1 text-xs text-gray-500">Auto-compressing for optimal upload</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="mb-2 text-lg font-medium text-gray-900">{isDragging ? "Drop image here" : "Upload campaign image"}</p>
              <p className="mb-4 text-sm text-gray-600">Drag and drop or click to select</p>
              <p className="text-xs text-gray-500">
                {acceptedTypes
                  .map((type) => type.split("/")[1])
                  .join(", ")
                  .toUpperCase()}{" "}
                • Max {maxSize}MB
                <span className="block mt-1 text-green-600">✅ Auto-compression for files &gt; 1MB</span>
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="relative">
          <div className="relative overflow-hidden bg-gray-100 rounded-lg">
            <img src={currentImage} alt="Campaign preview" className="object-cover w-full h-64" />

            <div className="absolute inset-0 flex items-center justify-center transition-all duration-200 bg-black bg-opacity-0 hover:bg-opacity-30 group">
              <div className="flex gap-2 transition-opacity duration-200 opacity-0 group-hover:opacity-100">
                <button onClick={handleClick} className="px-4 py-2 text-gray-700 transition-colors bg-white rounded-lg shadow-lg hover:bg-gray-50" disabled={isLoading}>
                  Change
                </button>
                <button onClick={handleRemove} className="px-4 py-2 text-white transition-colors bg-red-500 rounded-lg shadow-lg hover:bg-red-600">
                  Remove
                </button>
              </div>
            </div>
          </div>

          <input ref={fileInputRef} type="file" accept={acceptedTypes.join(",")} onChange={handleFileSelect} className="hidden" disabled={isLoading} />
        </div>
      )}

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

      {!currentImage && !isLoading && (
        <div className="p-4 mt-4 border border-blue-200 rounded-lg bg-blue-50">
          <h4 className="mb-2 text-sm font-medium text-blue-900">💡 Image Compression Info:</h4>
          <ul className="space-y-1 text-xs text-blue-800">
            <li>• ✅ Files &gt; 1MB auto-compressed to ~800KB</li>
            <li>• ✅ Professional compression library ensures quality</li>
            <li>• ✅ Optimized for Internet Computer canister limits</li>
            <li>• ✅ Supports JPG, PNG, WebP formats</li>
            <li>• ✅ No more 413 Payload Too Large errors!</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
