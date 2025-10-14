"use client";

import React, { useState } from "react";
import { FaPlus, FaSpinner, FaGift, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import Button from "@/components/ui/Button";

interface RequestNewToyProps {
  childId: string;
  childName: string;
  magicPoints: number;
  onRequestSent: () => void;
}

interface ToastMessage {
  type: 'success' | 'error';
  message: string;
}

export default function RequestNewToy({
  childId,
  childName,
  magicPoints,
  onRequestSent
}: RequestNewToyProps) {
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [formData, setFormData] = useState({
    itemTitle: '',
    itemDescription: '',
    itemUrl: ''
  });

  const canRequest = magicPoints >= 1;

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
        showToast('success', result.message || 'Your request has been sent to Santa! 🎅');
        setShowModal(false);
        setFormData({ itemTitle: '', itemDescription: '', itemUrl: '' });
        onRequestSent();
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

  return (
    <>
      <Button
        onClick={() => setShowModal(true)}
        disabled={!canRequest}
        className={`${
          canRequest 
            ? 'bg-santa text-white hover:bg-red-700' 
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        } flex items-center gap-2 px-6 py-3 max-w-none`}
        title={!canRequest ? 'You need 1 magic point to request a new toy' : 'Request Santa to add a new toy (costs 1 magic point)'}
      >
        <FaPlus />
        Request New Toy
        {!canRequest && <span className="text-sm">(Need 1 ✨)</span>}
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

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-paytone-one text-santa mb-2">
                🎅 Request New Toy for {childName}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-6 p-4 bg-santa-50 border border-santa-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FaGift className="text-santa" />
                <p className="text-sm font-medium text-santa-800">
                  Cost: 1 magic point ✨
                </p>
              </div>
              <p className="text-sm text-santa-700">
                Your current magic points: <strong>{magicPoints} ✨</strong>
              </p>
              {!canRequest && (
                <p className="text-sm text-santa-600 mt-2">
                  You need more magic points! Ask your parents to vote for you or do good deeds.
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  What toy would you like? *
                </label>
                <input
                  type="text"
                  required
                  value={formData.itemTitle}
                  onChange={(e) => setFormData({...formData, itemTitle: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-santa focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-santa focus:border-transparent"
                  rows={3}
                  placeholder="Why do you want this? What would you do with it?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link to the toy (optional)
                </label>
                <input
                  type="url"
                  value={formData.itemUrl}
                  onChange={(e) => setFormData({...formData, itemUrl: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-santa focus:border-transparent"
                  placeholder="https://..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={isLoading || !canRequest}
                  className={`flex-1 ${
                    canRequest 
                      ? 'bg-santa text-white hover:bg-red-700' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  } flex items-center justify-center gap-2 max-w-none`}
                >
                  {isLoading ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Sending to Santa...
                    </>
                  ) : (
                    <>
                      <FaGift />
                      Send to Santa (1 ✨)
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-500 text-white hover:bg-gray-600 max-w-none"
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