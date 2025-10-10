"use client";

import React, { useState, useEffect } from 'react';
import { FaEye, FaCheck, FaTimes, FaPlus, FaSpinner, FaExternalLinkAlt, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import Button from '@/components/ui/Button';
import CatalogItemForm, { CatalogFormData, emptyCatalogFormData } from '@/components/admin/CatalogItemForm';

interface ToastMessage {
  type: 'success' | 'error';
  message: string;
}

interface ToyRequest {
  _id: string;
  childName: string;
  parentEmail?: string;
  itemTitle: string;
  itemDescription?: string;
  itemUrl?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ADDED_TO_CATALOG';
  magicPointsUsed: number;
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
}

interface ToyRequestViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ToyRequestViewer({ isOpen, onClose }: ToyRequestViewerProps) {
  const [requests, setRequests] = useState<ToyRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('PENDING');
  const [selectedRequest, setSelectedRequest] = useState<ToyRequest | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCatalogForm, setShowCatalogForm] = useState(false);
  const [catalogFormData, setCatalogFormData] = useState<CatalogFormData>(emptyCatalogFormData);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000); // Auto-hide after 5 seconds
  };

  useEffect(() => {
    if (isOpen) {
      fetchRequests();
    }
  }, [isOpen, filter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/toy-requests?status=${filter}&limit=50`);
      const data = await response.json();
      
      if (data.success) {
        setRequests(data.requests);
      } else {
        console.error('Failed to fetch requests:', data.error);
        showToast('error', 'Failed to fetch requests: ' + data.error);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      showToast('error', 'Failed to fetch requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (requestId: string, action: string, reviewNotes?: string, formData?: CatalogFormData) => {
    setActionLoading(requestId);
    try {
      const body: any = { requestId, action };
      if (reviewNotes) body.reviewNotes = reviewNotes;
      if (action === 'ADD_TO_CATALOG') {
        // Use the passed form data or current form data
        const dataToUse = formData || catalogFormData;
        body.catalogData = {
          title: dataToUse.title,
          brand: dataToUse.brand || undefined,
          category: dataToUse.category || undefined,
          description: dataToUse.description || undefined,
          gender: dataToUse.gender,
          ageMin: dataToUse.ageMin === '' ? undefined : Number(dataToUse.ageMin),
          ageMax: dataToUse.ageMax === '' ? undefined : Number(dataToUse.ageMax),
          price: dataToUse.price === '' ? undefined : Number(dataToUse.price),
          retailer: dataToUse.retailer || undefined,
          productUrl: dataToUse.productUrl,
          imageUrl: dataToUse.imageUrl || undefined,
          sku: dataToUse.sku || undefined,
          tags: dataToUse.tags ? dataToUse.tags.split(',').map(t => t.trim()) : [],
          popularity: dataToUse.popularity === '' ? undefined : Number(dataToUse.popularity),
          sourceType: dataToUse.sourceType,
          isActive: dataToUse.isActive,
        };
      }

      const response = await fetch('/api/admin/toy-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      if (data.success) {
        await fetchRequests(); // Refresh list
        setSelectedRequest(null);
        setShowCatalogForm(false);
        setCatalogFormData(emptyCatalogFormData);
        showToast('success', data.message);
      } else {
        showToast('error', 'Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error updating toy request:', error);
      showToast('error', 'Failed to update request. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const openCatalogForm = (request: ToyRequest) => {
    setSelectedRequest(request);
    setCatalogFormData({
      title: request.itemTitle,
      brand: '',
      brandLogoUrl: '',
      category: '',
      description: request.itemDescription || '',
      gender: 'neutral',
      ageMin: '',
      ageMax: '',
      price: '',
      retailer: '',
      productUrl: request.itemUrl || '',
      imageUrl: '',
      sku: '',
      tags: '',
      popularity: '',
      sourceType: 'manual',
      isActive: true,
    });
    setShowCatalogForm(true);
  };

  if (!isOpen) return null;

  return (
    <>
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

      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-6 border-b bg-santa text-white">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-paytone-one">🎅 Toy Requests from Children</h2>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 text-xl"
              >
                ✕
              </button>
            </div>
            
            {/* Filter Tabs */}
            <div className="flex gap-2 mt-4">
              {['PENDING', 'APPROVED', 'REJECTED', 'ADDED_TO_CATALOG', 'ALL'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === status 
                      ? 'bg-white text-santa' 
                      : 'bg-santa-600 text-white hover:bg-santa-700'
                  }`}
                >
                  {status.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <FaSpinner className="animate-spin text-2xl text-santa" />
                <span className="ml-3">Loading requests...</span>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎁</div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  No {filter.toLowerCase()} requests
                </h3>
                <p className="text-gray-600">
                  {filter === 'PENDING' ? 'All caught up! No pending requests.' : `No ${filter.toLowerCase()} requests found.`}
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {requests.map((request) => (
                  <div
                    key={request._id}
                    className="bg-gray-50 rounded-lg p-4 border hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {request.itemTitle}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            request.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            request.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                            request.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {request.status.replace('_', ' ')}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><strong>Child:</strong> {request.childName}</p>
                          <p><strong>Requested:</strong> {new Date(request.requestedAt).toLocaleDateString()}</p>
                          {request.itemDescription && (
                            <p><strong>Description:</strong> {request.itemDescription}</p>
                          )}
                          {request.itemUrl && (
                            <p className="flex items-center gap-2">
                              <strong>URL:</strong> 
                              <a 
                                href={request.itemUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline flex items-center gap-1"
                              >
                                View Product <FaExternalLinkAlt className="text-xs" />
                              </a>
                            </p>
                          )}
                          {request.reviewNotes && (
                            <p><strong>Review Notes:</strong> {request.reviewNotes}</p>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {request.status === 'PENDING' && (
                        <div className="flex gap-2 ml-4">
                          <Button
                            onClick={() => handleAction(request._id, 'APPROVE')}
                            disabled={actionLoading === request._id}
                            className="bg-green-500 text-white text-sm px-3 py-1 max-w-none"
                          >
                            {actionLoading === request._id ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                            Approve
                          </Button>
                          <Button
                            onClick={() => openCatalogForm(request)}
                            disabled={actionLoading === request._id}
                            className="bg-blue-500 text-white text-sm px-3 py-1 max-w-none"
                          >
                            <FaPlus />
                            Add to Catalog
                          </Button>
                          <Button
                            onClick={() => setShowRejectModal(request._id)}
                            disabled={actionLoading === request._id}
                            className="bg-red-500 text-white text-sm px-3 py-1 max-w-none"
                          >
                            <FaTimes />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reject Modal */}
          {showRejectModal && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl max-w-md w-full p-6">
                <h3 className="text-xl font-semibold mb-4">Reject Request</h3>
                <p className="text-gray-600 mb-4">
                  Please provide a reason for rejecting this toy request (optional):
                </p>
                <textarea
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  rows={3}
                  placeholder="e.g., Item not age-appropriate, duplicate request, etc."
                />
                <div className="flex gap-4 mt-6">
                  <Button
                    onClick={() => {
                      handleAction(showRejectModal, 'REJECT', rejectNotes || undefined);
                      setShowRejectModal(null);
                      setRejectNotes('');
                    }}
                    className="flex-1 bg-red-500 text-white hover:bg-red-600"
                  >
                    Reject Request
                  </Button>
                  <Button
                    onClick={() => {
                      setShowRejectModal(null);
                      setRejectNotes('');
                    }}
                    className="flex-1 bg-gray-500 text-white hover:bg-gray-600"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Catalog Form Modal */}
          {showCatalogForm && selectedRequest && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">Add "{selectedRequest.itemTitle}" to Catalog</h3>
                  <Button
                    onClick={() => setShowCatalogForm(false)}
                    className="bg-gray-500 hover:bg-gray-600"
                  >
                    <FaTimes />
                  </Button>
                </div>
                
                <CatalogItemForm
                  formData={catalogFormData}
                  onSubmit={(data) => {
                    handleAction(selectedRequest._id, 'ADD_TO_CATALOG', undefined, data);
                  }}
                  loading={actionLoading === selectedRequest._id}
                  submitLabel="Add to Catalog"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}