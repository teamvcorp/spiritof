"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Button from "@/components/ui/Button";

interface ImageUploadProps {
  currentImageUrl?: string;
  onImageUploaded: (url: string) => void;
  onImageRemoved?: () => void;
  className?: string;
}

export default function ImageUpload({ 
  currentImageUrl, 
  onImageUploaded, 
  onImageRemoved,
  className = "" 
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
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

    try {
      setUploading(true);

      // Create FormData
      const formData = new FormData();
      formData.append('file', file);

      // Upload to our API endpoint
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      
      if (data.url) {
        setPreviewUrl(data.url);
        onImageUploaded(data.url);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    onImageRemoved?.();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current/Preview Image */}
      {previewUrl && (
        <div className="relative inline-block">
          <div className="w-24 h-24 relative rounded-full overflow-hidden border-4 border-white shadow-lg">
            <Image
              src={previewUrl}
              alt="Profile preview"
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
            {uploading ? '📤 Uploading...' : previewUrl ? '📷 Change Photo' : '📷 Upload Photo'}
          </Button>
          
          {previewUrl && (
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
          <p>• Square images work best for profiles</p>
        </div>
      </div>
    </div>
  );
}