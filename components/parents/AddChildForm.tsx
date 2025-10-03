"use client";

import { useState } from "react";
import Image from "next/image";
import ImageUpload from "@/components/ui/ImageUpload";

interface AddChildFormProps {
  onSubmit: (formData: FormData) => void;
}

export default function AddChildForm({ onSubmit }: AddChildFormProps) {
  const [childName, setChildName] = useState("");
  const [percentAllocation, setPercentAllocation] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  // Handle image upload
  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setAvatarUrl(result.url);
      } else {
        alert('Failed to upload image');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      alert('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    const formData = new FormData();
    formData.append('displayName', childName);
    formData.append('percentAllocation', percentAllocation.toString());
    formData.append('avatarUrl', avatarUrl);
    
    onSubmit(formData);
    
    // Reset form
    setChildName("");
    setPercentAllocation(0);
    setAvatarUrl("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Child Name */}
        <div className="space-y-2">
          <label className="flex items-center text-sm font-medium text-gray-700">
            <span className="text-santa mr-2">👤</span>
            Child&apos;s Name
          </label>
          <input 
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            required 
            placeholder="e.g. Sarah, Tommy, Alex..." 
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-santa focus:border-santa bg-white/90 transition-all duration-200 placeholder-gray-400"
          />
          <p className="text-xs text-gray-500">This is how their name will appear on their Christmas list</p>
        </div>

        {/* Budget Allocation */}
        <div className="space-y-2">
          <label className="flex items-center text-sm font-medium text-gray-700">
            <span className="text-evergreen mr-2">💰</span>
            Budget Share (%)
          </label>
          <input 
            value={percentAllocation}
            onChange={(e) => setPercentAllocation(Number(e.target.value))}
            type="number" 
            min={0} 
            max={100}
            placeholder="25"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-evergreen focus:border-evergreen bg-white/90 transition-all duration-200"
          />
          <p className="text-xs text-gray-500">Percentage of your monthly magic budget for this child</p>
        </div>
      </div>

      {/* Profile Picture Upload */}
      <div className="space-y-2">
        <label className="flex items-center text-sm font-medium text-gray-700">
          <span className="text-blueberry mr-2">📸</span>
          Profile Picture
        </label>
        <div className="bg-white/60 rounded-lg p-4 border-2 border-dashed border-gray-300">
          <ImageUpload
            currentImage={avatarUrl}
            onUpload={handleImageUpload}
            uploading={uploadingImage}
          />
        </div>
        <p className="text-xs text-gray-500">Upload a photo to personalize their profile</p>
      </div>

      {/* Preview Section */}
      <div className="bg-white/80 rounded-lg p-4 border border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
          <span className="text-santa mr-2">👀</span>
          Preview
        </h4>
        <div className="flex items-center space-x-3 text-sm text-gray-600">
          {avatarUrl ? (
            <div className="w-12 h-12 relative rounded-full overflow-hidden border-2 border-santa-200">
              <Image src={avatarUrl} alt="Preview" fill className="object-cover" />
            </div>
          ) : (
            <div className="w-12 h-12 bg-santa-100 rounded-full flex items-center justify-center">
              <span className="text-santa font-bold text-lg">
                {childName ? childName[0].toUpperCase() : "?"}
              </span>
            </div>
          )}
          <div>
            <div className="font-medium">
              {childName || "Child's name will appear here"}
            </div>
            <div className="text-xs">
              Will receive {percentAllocation}% of monthly budget
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-center pt-4">
        <button 
          type="submit" 
          disabled={uploadingImage || !displayName.trim()}
          className="bg-gradient-to-r from-santa to-santa-600 hover:from-santa-600 hover:to-santa-700 text-white font-paytone-one px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          <span className="text-xl">🎄</span>
          <span>
            {uploadingImage ? "Uploading Image..." : "Add Child to Christmas List"}
          </span>
          <span className="text-xl">✨</span>
        </button>
      </div>
    </form>
  );
}