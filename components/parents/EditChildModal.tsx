"use client";

import { useState } from "react";
import Image from "next/image";
import ImageUpload from "@/components/ui/ImageUpload";

interface EditChildModalProps {
  child: {
    _id: string;
    displayName: string;
    percentAllocation: number;
    avatarUrl?: string;
    donationsEnabled?: boolean;
  };
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
}

export default function EditChildModal({ child, isOpen, onClose, onSubmit }: EditChildModalProps) {
  const [displayName, setDisplayName] = useState(child.displayName);
  const [percentAllocation, setPercentAllocation] = useState(child.percentAllocation);
  const [avatarUrl, setAvatarUrl] = useState(child.avatarUrl || "");
  const [donationsEnabled, setDonationsEnabled] = useState(child.donationsEnabled ?? true);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('childId', child._id);
    formData.append('displayName', displayName);
    formData.append('percentAllocation', percentAllocation.toString());
    formData.append('avatarUrl', avatarUrl);
    formData.append('donationsEnabled', donationsEnabled ? 'true' : 'false');
    
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="w-full max-w-lg rounded-xl border bg-white shadow-xl mx-4" role="dialog" aria-modal="true">
        <div className="bg-gradient-to-r from-santa-50 to-evergreen-50 px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-paytone-one text-santa">
              Edit {child.displayName}
            </h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Profile Picture Upload */}
          <div className="space-y-3">
            <label className="flex items-center text-sm font-medium text-gray-700">
              <span className="text-blueberry mr-2">📸</span>
              Profile Picture
            </label>
            <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
              <ImageUpload
                currentImage={avatarUrl}
                onUpload={handleImageUpload}
                uploading={uploadingImage}
              />
            </div>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-gray-700">
              <span className="text-santa mr-2">👤</span>
              Display Name
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-santa focus:border-santa bg-white transition-all duration-200"
            />
          </div>

          {/* Percent Allocation */}
          <div className="space-y-2">
            <label className="flex items-center text-sm font-medium text-gray-700">
              <span className="text-evergreen mr-2">💰</span>
              Budget Share (0–100%)
            </label>
            <input
              value={percentAllocation}
              onChange={(e) => setPercentAllocation(Number(e.target.value))}
              type="number"
              min={0}
              max={100}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-evergreen focus:border-evergreen bg-white transition-all duration-200"
            />
          </div>

          {/* Donations Enabled */}
          <div className="flex items-center space-x-3">
            <input
              id="donationsEnabled"
              type="checkbox"
              checked={donationsEnabled}
              onChange={(e) => setDonationsEnabled(e.target.checked)}
              className="w-4 h-4 text-blueberry bg-gray-100 border-gray-300 rounded focus:ring-blueberry focus:ring-2"
            />
            <label htmlFor="donationsEnabled" className="text-sm font-medium text-gray-700">
              Allow neighbor donations
            </label>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <span className="text-santa mr-2">👀</span>
              Preview
            </h4>
            <div className="flex items-center space-x-3">
              {avatarUrl ? (
                <div className="w-12 h-12 relative rounded-full overflow-hidden border-2 border-santa-200">
                  <Image src={avatarUrl} alt="Preview" fill className="object-cover" />
                </div>
              ) : (
                <div className="w-12 h-12 bg-santa-100 rounded-full flex items-center justify-center">
                  <span className="text-santa font-bold text-lg">
                    {displayName ? displayName[0].toUpperCase() : "?"}
                  </span>
                </div>
              )}
              <div>
                <div className="font-medium text-gray-800">{displayName}</div>
                <div className="text-sm text-gray-600">
                  {percentAllocation}% budget share
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-santa to-santa-600 hover:from-santa-600 hover:to-santa-700 text-white rounded-lg transition-all duration-200 font-medium"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}