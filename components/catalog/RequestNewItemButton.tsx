"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Button from '@/components/ui/Button';
import { FaPlus, FaSpinner, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

interface RequestNewItemButtonProps {
  childId: string;
  childName: string;
  magicPoints: number;
  onRequestSent?: () => void;
}

interface ToastMessage {
  type: 'success' | 'error';
  message: string;
}

export default function RequestNewItemButton({ 
  childId, 
  childName, 
  magicPoints,
  onRequestSent 
}: RequestNewItemButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    itemTitle: '',
    itemDescription: '',
    itemUrl: ''
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000); // Auto-hide after 5 seconds
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.itemTitle.trim()) {
      showToast('error', 'Please enter an item title');
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
        showToast('success', result.message || 'Your request has been sent to Santa!' );
        setShowModal(false);
        setFormData({ itemTitle: '', itemDescription: '', itemUrl: '' });
        onRequestSent?.();
      } else {
        showToast('error', result.error || 'Failed to send request');
      }
    } catch (error) {
      console.error('Error requesting item:', error);
      showToast('error', 'Failed to send request. Please try again.');
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

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
          toast.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        } flex items-center gap-3 animate-slide-in`}>
          {toast.type === 'success' ? (
            <FaCheckCircle className="text-xl flex-shrink-0" />
          ) : (
            <FaExclamationTriangle className="text-xl flex-shrink-0" />
          )}
          <div className="flex-1">
            <p className="font-medium">{toast.message}</p>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-white hover:text-gray-200 text-lg ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {mounted && showModal && createPortal(
        <div className="fixed inset-0 bg-[#001a33] bg-opacity-80 flex items-center justify-center z-[9999] p-4">
          <div className="relative z-[10000] bg-white rounded-xl max-w-md w-full p-6">
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
        </div>,
        document.body
      )}
    </>
  );
}