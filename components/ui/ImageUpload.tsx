"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";

interface ImageUploadProps {
  currentImage?: string;
  onUpload: (file: File) => void;
  uploading?: boolean;
  className?: string;
  isAdminMode?: boolean;
}

export default function ImageUpload({ 
  currentImage, 
  onUpload, 
  uploading = false,
  className = "",
  isAdminMode = false
}: ImageUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB');
      return;
    }

    // Create preview URL
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Call the parent's upload handler
    onUpload(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current/Preview Image */}
      {(previewUrl || currentImage) && (
        <div className="relative inline-block">
          <div className={`relative rounded overflow-hidden border shadow-lg ${
            isAdminMode ? 'w-32 h-32' : 'w-24 h-24 rounded-full border-4 border-white'
          }`}>
            <Image
              src={previewUrl || currentImage || ''}
              alt="Image preview"
              fill
              className="object-cover"
            />
          </div>
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute -top-2 -right-2 w-6 h-6 bg-santa text-white rounded-full text-xs hover:bg-santa-600 transition-colors flex items-center justify-center"
          >
            ×
          </button>
        </div>
      )}

      {/* Upload Controls */}
      <div className="space-y-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-blueberry hover:bg-blueberry-600 text-white text-sm"
          >
            {uploading ? '📤 Uploading...' : (previewUrl || currentImage) ? '📷 Change Image' : '📷 Upload Image'}
          </Button>
          
          {(previewUrl || currentImage) && (
            <Button
              type="button"
              onClick={handleRemoveImage}
              className="bg-gray-400 hover:bg-gray-500 text-white text-sm"
            >
              🗑️ Remove
            </Button>
          )}
        </div>

        <div className="text-xs text-gray-500">
          <p>• Supports JPG, PNG, GIF up to 5MB</p>
          <p>• Images are securely stored on Vercel</p>
          {!isAdminMode && <p>• Square images work best for profiles</p>}
        </div>
      </div>
    </div>
  );
}