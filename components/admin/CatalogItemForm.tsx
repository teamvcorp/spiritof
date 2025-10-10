"use client";

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import ImageUpload from '@/components/ui/ImageUpload';
import { CatalogGender } from '@/models/MasterCatalog';
import { FaSave } from 'react-icons/fa';

const ADMIN_PASSWORD = 'admin123'; // In production, this should be from env or secure auth

export interface CatalogFormData {
  title: string;
  brand: string;
  brandLogoUrl: string; // NEW: Brand logo URL
  category: string;
  description: string;
  gender: CatalogGender;
  ageMin: number | '';
  ageMax: number | '';
  price: number | '';
  retailer: string;
  productUrl: string;
  imageUrl: string;
  sku: string;
  tags: string;
  popularity: number | '';
  sourceType: 'manual' | 'curated' | 'live_search' | 'trending';
  isActive: boolean;
}

export const emptyCatalogFormData: CatalogFormData = {
  title: '',
  brand: '',
  brandLogoUrl: '', // NEW: Empty default
  category: '',
  description: '',
  gender: 'neutral',
  ageMin: '',
  ageMax: '',
  price: '',
  retailer: '',
  productUrl: '',
  imageUrl: '',
  sku: '',
  tags: '',
  popularity: '',
  sourceType: 'manual',
  isActive: true,
};

interface CatalogItemFormProps {
  formData: CatalogFormData;
  onSubmit: (data: CatalogFormData) => void;
  loading: boolean;
  submitLabel?: string;
  includeBrandLogoUpload?: boolean; // NEW: Optional flag to show/hide brand logo upload
}

export default function CatalogItemForm({
  formData,
  onSubmit,
  loading,
  submitLabel = "Save Item",
  includeBrandLogoUpload = false // NEW: Default to false for backward compatibility
}: CatalogItemFormProps) {
  const [data, setData] = useState<CatalogFormData>(formData);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingBrandLogo, setUploadingBrandLogo] = useState(false); // NEW: Brand logo upload state

  // NEW: Sync internal state with incoming formData prop
  useEffect(() => {
    setData(formData);
  }, [formData]);

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        headers: {
          'X-Admin-Password': ADMIN_PASSWORD,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setData(prev => ({ ...prev, imageUrl: result.url }));
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

  // NEW: Handle brand logo upload
  const handleBrandLogoUpload = async (file: File) => {
    setUploadingBrandLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        headers: {
          'X-Admin-Password': ADMIN_PASSWORD,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setData(prev => ({ ...prev, brandLogoUrl: result.url }));
      } else {
        alert('Failed to upload brand logo');
      }
    } catch (error) {
      console.error('Brand logo upload error:', error);
      alert('Failed to upload brand logo');
    } finally {
      setUploadingBrandLogo(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.title || !data.productUrl) {
      alert('Title and Product URL are required');
      return;
    }
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title *</label>
          <input
            type="text"
            value={data.title}
            onChange={(e) => setData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-evergreen"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Brand</label>
          <input
            type="text"
            value={data.brand}
            onChange={(e) => setData(prev => ({ ...prev, brand: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-evergreen"
            placeholder="e.g., LEGO, Barbie, Hot Wheels"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <input
            type="text"
            value={data.category}
            onChange={(e) => setData(prev => ({ ...prev, category: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-evergreen"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Gender *</label>
          <select
            value={data.gender}
            onChange={(e) => setData(prev => ({ ...prev, gender: e.target.value as CatalogGender }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-evergreen"
          >
            <option value="neutral">Neutral</option>
            <option value="boy">Boy</option>
            <option value="girl">Girl</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Age Min</label>
          <input
            type="number"
            value={data.ageMin}
            onChange={(e) => setData(prev => ({ ...prev, ageMin: e.target.value === '' ? '' : Number(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-evergreen"
            min="0"
            max="18"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Age Max</label>
          <input
            type="number"
            value={data.ageMax}
            onChange={(e) => setData(prev => ({ ...prev, ageMax: e.target.value === '' ? '' : Number(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-evergreen"
            min="0"
            max="18"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Price ($)</label>
          <input
            type="number"
            value={data.price}
            onChange={(e) => setData(prev => ({ ...prev, price: e.target.value === '' ? '' : Number(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-evergreen"
            min="0"
            step="0.01"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Retailer</label>
          <input
            type="text"
            value={data.retailer}
            onChange={(e) => setData(prev => ({ ...prev, retailer: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-evergreen"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">SKU</label>
          <input
            type="text"
            value={data.sku}
            onChange={(e) => setData(prev => ({ ...prev, sku: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-evergreen"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Popularity (0-100)</label>
          <input
            type="number"
            value={data.popularity}
            onChange={(e) => setData(prev => ({ ...prev, popularity: e.target.value === '' ? '' : Number(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-evergreen"
            min="0"
            max="100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Source Type</label>
          <select
            value={data.sourceType}
            onChange={(e) => setData(prev => ({ ...prev, sourceType: e.target.value as CatalogFormData['sourceType'] }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-evergreen"
          >
            <option value="manual">Manual</option>
            <option value="curated">Curated</option>
            <option value="live_search">Live Search</option>
            <option value="trending">Trending</option>
          </select>
        </div>

        <div className="flex items-center">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={data.isActive}
              onChange={(e) => setData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="form-checkbox text-evergreen"
            />
            <span className="text-sm font-medium">Active</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Product URL *</label>
        <input
          type="url"
          value={data.productUrl}
          onChange={(e) => setData(prev => ({ ...prev, productUrl: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-evergreen"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={data.description}
          onChange={(e) => setData(prev => ({ ...prev, description: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-evergreen"
          rows={3}
          placeholder="Describe the product features, age appropriateness, etc."
        />
      </div>

      {/* NEW: Brand Logo Upload Section */}
      {includeBrandLogoUpload && (
        <div>
          <label className="block text-sm font-medium mb-1">Brand Logo (Optional)</label>
          <div className="space-y-2">
            <input
              type="url"
              value={data.brandLogoUrl}
              onChange={(e) => setData(prev => ({ ...prev, brandLogoUrl: e.target.value }))}
              placeholder="Brand logo URL or upload below..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-evergreen"
            />
            <ImageUpload
              onUpload={handleBrandLogoUpload}
              uploading={uploadingBrandLogo}
              currentImage={data.brandLogoUrl}
              isAdminMode={true}
            />
            {data.brandLogoUrl && (
              <div className="mt-2 p-2 border rounded-lg bg-gray-50">
                <p className="text-xs text-gray-600 mb-2">Brand Logo Preview:</p>
                <img
                  src={data.brandLogoUrl}
                  alt="Brand logo"
                  className="h-12 w-auto object-contain"
                />
              </div>
            )}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Product Image</label>
        <div className="space-y-2">
          <input
            type="url"
            value={data.imageUrl}
            onChange={(e) => setData(prev => ({ ...prev, imageUrl: e.target.value }))}
            placeholder="Image URL or upload below..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-evergreen"
          />
          <ImageUpload
            onUpload={handleImageUpload}
            uploading={uploadingImage}
            currentImage={data.imageUrl}
            isAdminMode={true}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
        <input
          type="text"
          value={data.tags}
          onChange={(e) => setData(prev => ({ ...prev, tags: e.target.value }))}
          placeholder="toy, educational, electronic"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-evergreen"
        />
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={loading || uploadingImage || uploadingBrandLogo}
          className="bg-evergreen hover:bg-green-600"
        >
          <FaSave className="mr-2" />
          {loading ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}