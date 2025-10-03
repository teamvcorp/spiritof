"use client";

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { FaPlus, FaSpinner } from 'react-icons/fa';

interface RequestNewItemButtonProps {
  childId: string;
  childName: string;
  magicPoints: number;
  onRequestSent?: () => void;
}

export default function RequestNewItemButton({ 
  childId, 
  childName, 
  magicPoints,
  onRequestSent 
}: RequestNewItemButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    itemTitle: '',
    itemDescription: '',
    itemUrl: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.itemTitle.trim()) {
      alert('Please enter an item title');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/catalog/request-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          childId,
          ...formData
        })
      });

      const result = await response.json();

      if (response.ok) {
        alert(`✨ ${result.message}`);
        setShowModal(false);
        setFormData({ itemTitle: '', itemDescription: '', itemUrl: '' });
        onRequestSent?.();
      } else {
        alert(`❌ ${result.error}`);
      }
    } catch (error) {
      console.error('Error requesting item:', error);
      alert('Failed to send request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const canRequest = magicPoints >= 5;

  return (
    <>
      <Button
        onClick={() => setShowModal(true)}
        disabled={!canRequest}
        className={`${
          canRequest 
            ? 'bg-santa text-white hover:bg-red-700' 
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        } flex items-center gap-2`}
        title={!canRequest ? 'You need 5 magic points to request a new item' : 'Request a new item from Santa (costs 5 magic points)'}
      >
        <FaPlus />
        Request New Item {!canRequest && '(Need 5 ✨)'}
      </Button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-evergreen mb-4">
              🎅 Request New Item for {childName}
            </h2>
            
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Cost:</strong> 5 magic points ✨
              </p>
              <p className="text-sm text-blue-700">
                Your current magic points: <strong>{magicPoints} ✨</strong>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  What would you like? *
                </label>
                <input
                  type="text"
                  required
                  value={formData.itemTitle}
                  onChange={(e) => setFormData({...formData, itemTitle: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-evergreen focus:border-transparent"
                  placeholder="e.g., LEGO Hogwarts Castle"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tell Santa more about it (optional)
                </label>
                <textarea
                  value={formData.itemDescription}
                  onChange={(e) => setFormData({...formData, itemDescription: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-evergreen focus:border-transparent"
                  rows={3}
                  placeholder="Why do you want this? What would you do with it?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link to the item (optional)
                </label>
                <input
                  type="url"
                  value={formData.itemUrl}
                  onChange={(e) => setFormData({...formData, itemUrl: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-evergreen focus:border-transparent"
                  placeholder="https://..."
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
                      Sending to Santa...
                    </>
                  ) : (
                    <>
                      Send to Santa (5 ✨)
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowModal(false)}
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