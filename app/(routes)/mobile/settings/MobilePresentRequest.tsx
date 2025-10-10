"use client";

import { useState, useRef } from 'react';
import Button from '@/components/ui/Button';
import { FaCamera, FaUpload, FaSpinner, FaCheckCircle, FaExclamationTriangle, FaTimes } from 'react-icons/fa';
import Image from 'next/image';

interface MobilePresentRequestProps {
  parentId: string;
}

interface ToastMessage {
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function MobilePresentRequest({ parentId }: MobilePresentRequestProps) {
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    itemTitle: '',
    itemDescription: '',
    itemUrl: '',
    estimatedPrice: ''
  });

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        showToast('error', 'Image must be less than 10MB');
        return;
      }
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.itemTitle.trim()) {
      showToast('error', 'Please enter an item title');
      return;
    }

    setIsLoading(true);

    try {
      let imageUrl = '';
      
      // Upload image if provided
      if (imageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('image', imageFile);
        
        const uploadResponse = await fetch('/api/upload-image', {
          method: 'POST',
          body: uploadFormData
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload image');
        }
        
        const uploadData = await uploadResponse.json();
        imageUrl = uploadData.url;
      }

      // Submit present request
      const response = await fetch('/api/catalog/request-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parentId,
          itemTitle: formData.itemTitle,
          itemDescription: formData.itemDescription,
          itemUrl: formData.itemUrl || imageUrl, // Use uploaded image URL if no URL provided
          estimatedPrice: formData.estimatedPrice ? parseFloat(formData.estimatedPrice) : undefined,
          imageUrl,
          requestedBy: 'parent', // Flag to indicate parent request
          requestType: 'mobile-photo'
        })
      });

      const result = await response.json();

      if (response.ok) {
        showToast('success', 'Present request sent successfully! 🎁');
        setShowModal(false);
        // Reset form
        setFormData({ itemTitle: '', itemDescription: '', itemUrl: '', estimatedPrice: '' });
        removeImage();
      } else {
        showToast('error', result.error || 'Failed to send request');
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      showToast('error', 'Failed to send request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-3">
        <Button
          onClick={() => setShowModal(true)}
          className="w-full bg-santa text-white hover:bg-red-700 flex items-center justify-center gap-2 py-4 text-lg"
        >
          <FaCamera className="text-xl" />
          Request Present with Photo
        </Button>
        
        <p className="text-xs text-gray-500 text-center">
          Perfect for when you&apos;re out shopping and spot something great!
        </p>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 left-4 sm:left-auto sm:right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm mx-auto sm:mx-0 ${
          toast.type === 'success' 
            ? 'bg-green-500 text-white' 
            : toast.type === 'error'
            ? 'bg-red-500 text-white'
            : 'bg-blue-500 text-white'
        } flex items-center gap-3 animate-slide-in`}>
          {toast.type === 'success' ? (
            <FaCheckCircle className="text-xl flex-shrink-0" />
          ) : toast.type === 'error' ? (
            <FaExclamationTriangle className="text-xl flex-shrink-0" />
          ) : (
            <FaSpinner className="text-xl flex-shrink-0 animate-spin" />
          )}
          <div className="flex-1">
            <p className="font-medium text-sm">{toast.message}</p>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-white hover:text-gray-200 text-lg ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-md w-full p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-evergreen">
                📸 Request Present
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  removeImage();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                Take a photo of the item in the store or upload an existing image!
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Image Upload/Camera Section */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Product Photo
                </label>
                
                {imagePreview ? (
                  <div className="relative">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      width={400}
                      height={400}
                      className="w-full h-48 object-cover rounded-lg border-2 border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-santa hover:bg-red-50 transition-colors"
                    >
                      <FaCamera className="text-3xl text-santa" />
                      <span className="text-sm font-medium text-gray-700">Take Photo</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-evergreen hover:bg-green-50 transition-colors"
                    >
                      <FaUpload className="text-3xl text-evergreen" />
                      <span className="text-sm font-medium text-gray-700">Upload Photo</span>
                    </button>
                  </div>
                )}
                
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  What is it? *
                </label>
                <input
                  type="text"
                  required
                  value={formData.itemTitle}
                  onChange={(e) => setFormData({...formData, itemTitle: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-evergreen focus:border-transparent"
                  placeholder="e.g., LEGO Star Wars Set"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={formData.itemDescription}
                  onChange={(e) => setFormData({...formData, itemDescription: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-evergreen focus:border-transparent"
                  rows={3}
                  placeholder="Tell us more about this item..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product URL (optional)
                </label>
                <input
                  type="url"
                  value={formData.itemUrl}
                  onChange={(e) => setFormData({...formData, itemUrl: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-evergreen focus:border-transparent"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Price (optional)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.estimatedPrice}
                  onChange={(e) => setFormData({...formData, estimatedPrice: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-evergreen focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-santa text-white hover:bg-red-700 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <FaCheckCircle />
                      Send Request
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    removeImage();
                  }}
                  className="flex-1 bg-gray-500 text-white hover:bg-gray-600"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
