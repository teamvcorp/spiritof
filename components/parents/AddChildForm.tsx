"use client";

import { useState } from "react";
import Image from "next/image";
import ImageUpload from "@/components/ui/ImageUpload";

interface AddChildFormProps {
  onSubmit: (formData: FormData) => Promise<{ 
    success?: boolean; 
    requiresPayment?: boolean; 
    error?: string; 
    message?: string; 
  } | void>;
}

interface WelcomePacketItem {
  id: string;
  name: string;
  description: string;
  price: number;
}

const WELCOME_PACKET_ITEMS: WelcomePacketItem[] = [
  {
    id: 'shirt',
    name: 'Christmas Spirit T-Shirt',
    description: 'Festive holiday shirt to spread Christmas cheer',
    price: 25,
  },
  {
    id: 'cocoa-mug',
    name: 'Hot Cocoa Mug',
    description: 'Perfect for warming up with hot chocolate',
    price: 10,
  },
  {
    id: 'santa-hat',
    name: 'Santa Hat',
    description: 'Classic red Santa hat for the holidays',
    price: 10,
  },
  {
    id: 'cozy-hoodie',
    name: 'Cozy Holiday Hoodie',
    description: 'Warm and comfortable hoodie for cold winter days',
    price: 35,
  }
];

const ENROLLMENT_FEE = 5;

export default function AddChildForm({ onSubmit }: AddChildFormProps) {
  const [childName, setChildName] = useState("");
  const [percentAllocation, setPercentAllocation] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Toggle item selection
  const toggleItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  // Calculate total
  const calculateTotal = () => {
    const itemsTotal = selectedItems.reduce((total, itemId) => {
      const item = WELCOME_PACKET_ITEMS.find(i => i.id === itemId);
      return total + (item?.price || 0);
    }, 0);
    return ENROLLMENT_FEE + itemsTotal;
  };

  // Validation helpers
  const isNameValid = childName.trim().length > 0;
  const isBudgetValid = percentAllocation > 0 && percentAllocation <= 100;
  const isFormValid = isNameValid && isBudgetValid && !uploadingImage;

  // Get validation message for button
  const getValidationMessage = () => {
    if (uploadingImage) return "Uploading Image...";
    if (!isNameValid) return "Please enter child's name";
    if (!isBudgetValid) return "Please set budget share (1-100%)";
    return "Add Child to Christmas List";
  };

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
    formData.append('selectedItems', JSON.stringify(selectedItems));
    
    const result = await onSubmit(formData);
    
    // Check if this child requires payment (additional child)
    if (result?.requiresPayment) {
      // Make the payment-required API call
      try {
        const response = await fetch('/api/parent/add-child-with-welcome-packet', {
          method: 'POST',
          body: formData,
        });
        
        const paymentResult = await response.json();
        
        if (!response.ok) {
          console.error("Failed to create child with welcome packet:", paymentResult.error);
          alert('Failed to set up welcome packet for this child. Please try again.');
          return;
        }
        
        // Redirect to Stripe checkout for the welcome packet payment
        if (paymentResult.checkoutUrl) {
          window.location.href = paymentResult.checkoutUrl;
          return;
        }
      } catch (error) {
        console.error('Error setting up welcome packet payment:', error);
        alert('Failed to set up welcome packet payment. Please try again.');
        return;
      }
    }
    
    // For first child or successful creation, reset form
    if (result?.success) {
      setChildName("");
      setPercentAllocation(0);
      setAvatarUrl("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Child Name */}
        <div className="space-y-2">
          <label className="flex items-center text-sm font-medium text-gray-700">
            <span className="text-santa mr-2">👤</span>
            Child&apos;s Name
            <span className="text-santa ml-1">*</span>
          </label>
          <input 
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            required 
            placeholder="e.g. Sarah, Tommy, Alex..." 
            className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 bg-white/90 transition-all duration-200 placeholder-gray-400 ${
              childName.length > 0 
                ? isNameValid 
                  ? 'border-green-300 focus:ring-green-500 focus:border-green-500' 
                  : 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-200 focus:ring-santa focus:border-santa'
            }`}
          />
          {childName.length > 0 && !isNameValid && (
            <p className="text-xs text-red-600 flex items-center">
              <span className="mr-1">⚠️</span>
              Please enter a valid name
            </p>
          )}
          {childName.length > 0 && isNameValid && (
            <p className="text-xs text-green-600 flex items-center">
              <span className="mr-1">✅</span>
              Great choice!
            </p>
          )}
          <p className="text-xs text-gray-500">This is how their name will appear on their Christmas list</p>
        </div>

        {/* Budget Allocation */}
        <div className="space-y-2">
          <label className="flex items-center text-sm font-medium text-gray-700">
            <span className="text-evergreen mr-2">💰</span>
            Budget Share (%)
            <span className="text-santa ml-1">*</span>
          </label>
          <input 
            value={percentAllocation}
            onChange={(e) => setPercentAllocation(Number(e.target.value))}
            type="number" 
            min={1} 
            max={100}
            placeholder="25"
            className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 bg-white/90 transition-all duration-200 ${
              percentAllocation > 0 
                ? isBudgetValid 
                  ? 'border-green-300 focus:ring-green-500 focus:border-green-500' 
                  : 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-200 focus:ring-evergreen focus:border-evergreen'
            }`}
          />
          {percentAllocation > 0 && !isBudgetValid && (
            <p className="text-xs text-red-600 flex items-center">
              <span className="mr-1">⚠️</span>
              Budget must be between 1% and 100%
            </p>
          )}
          {percentAllocation > 0 && isBudgetValid && (
            <p className="text-xs text-green-600 flex items-center">
              <span className="mr-1">✅</span>
              Perfect! ${percentAllocation}% allocated
            </p>
          )}
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

      {/* Welcome Packet Items Selection */}
      <div className="space-y-3">
        <label className="flex items-center text-sm font-medium text-gray-700">
          <span className="text-santa mr-2">🎁</span>
          Welcome Packet Items
        </label>
        <div className="bg-white/80 rounded-lg p-4 border border-gray-200 space-y-3">
          {/* Required Welcome Letter */}
          <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center h-5">
              <input
                type="checkbox"
                checked={true}
                disabled={true}
                className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-not-allowed"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-green-900">
                  Welcome Letter Package
                  <span className="ml-2 text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">Required</span>
                </p>
                <p className="text-sm font-bold text-green-900">${ENROLLMENT_FEE}</p>
              </div>
              <p className="text-xs text-green-700 mt-1">
                Personalized welcome letter and login instructions for {childName || 'your child'}
              </p>
            </div>
          </div>

          {/* Optional Items */}
          {WELCOME_PACKET_ITEMS.map((item) => (
            <div
              key={item.id}
              className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-all ${
                selectedItems.includes(item.id)
                  ? 'bg-santa-50 border-santa-300'
                  : 'bg-white hover:bg-gray-50 border-gray-200'
              }`}
              onClick={() => toggleItem(item.id)}
            >
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item.id)}
                  onChange={() => toggleItem(item.id)}
                  className="w-5 h-5 text-santa border-gray-300 rounded focus:ring-santa cursor-pointer"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                  <p className="text-sm font-bold text-gray-900">${item.price}</p>
                </div>
                <p className="text-xs text-gray-600 mt-1">{item.description}</p>
              </div>
            </div>
          ))}

          {/* Total */}
          <div className="pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-base font-bold text-gray-900">Total Welcome Packet Cost:</p>
              <p className="text-xl font-bold text-santa">${calculateTotal()}</p>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {selectedItems.length === 0 
                ? "Select additional items to customize the welcome packet"
                : `${selectedItems.length} additional item${selectedItems.length === 1 ? '' : 's'} selected`
              }
            </p>
          </div>
        </div>
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

      {/* Validation Summary */}
      {(!isFormValid && (childName.length > 0 || percentAllocation > 0)) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-yellow-800 mb-2 flex items-center">
            <span className="mr-2">📝</span>
            Please complete the required fields:
          </h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            {!isNameValid && (
              <li className="flex items-center">
                <span className="mr-2">•</span>
                Enter your child's name
              </li>
            )}
            {!isBudgetValid && (
              <li className="flex items-center">
                <span className="mr-2">•</span>
                Set a budget share between 1% and 100%
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-center pt-4">
        <button 
          type="submit" 
          disabled={!isFormValid}
          className={`font-paytone-one px-8 py-4 rounded-xl shadow-lg transition-all duration-200 flex items-center space-x-2 ${
            isFormValid
              ? 'bg-santa hover:bg-santa-600 text-white hover:shadow-xl transform hover:scale-105 active:scale-95'
              : 'bg-gray-300 text-gray-400 cursor-not-allowed'
          }`}
        >
         
          <span>{getValidationMessage()}</span>
         
        </button>
      </div>
    </form>
  );
}