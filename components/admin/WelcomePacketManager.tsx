"use client";

import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface WelcomePacketOrder {
  parentId: string;
  parentName: string;
  parentEmail: string;
  order: {
    orderId: string;
    selectedItems: string[];
    totalAmount: number;
    createdAt: string;
    status: 'pending' | 'completed';
    shipped: boolean;
    shippedAt?: string;
    trackingNumber?: string;
    shippingAddress?: {
      recipientName?: string;
      street?: string;
      apartment?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
    childId?: string;
    childName?: string;
    isForSpecificChild?: boolean;
  };
  children: Array<{
    childId: string;
    name: string;
    avatarUrl?: string;
    addedAt: string;
  }>;
  childrenCount: number;
}

interface WelcomePacketData {
  data: WelcomePacketOrder[];
  summary: {
    totalOrders: number;
    pendingOrders: number;
    shippedOrders: number;
    totalRevenue: number;
    uniqueParents: number;
    oldestPendingOrder: string | null;
    newestOrder: string | null;
  };
}

const WELCOME_PACKET_ITEMS: Record<string, { name: string; description: string; price: number }> = {
  'shirt': { name: 'Christmas Spirit T-Shirt', description: 'Festive holiday shirt', price: 25 },
  'cocoa-mug': { name: 'Hot Cocoa Mug', description: 'Perfect for hot chocolate', price: 10 },
  'santa-hat': { name: 'Santa Hat', description: 'Classic red Santa hat', price: 10 },
  'cozy-hoodie': { name: 'Cozy Holiday Hoodie', description: 'Warm winter hoodie', price: 35 }
};

type StatusFilter = 'all' | 'pending' | 'shipped';

export default function WelcomePacketManager() {
  const [data, setData] = useState<WelcomePacketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shippingOrder, setShippingOrder] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'priority'>('priority');

  useEffect(() => {
    fetchWelcomePackets();
  }, []);

  const fetchWelcomePackets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/welcome-packets');
      
      if (!response.ok) {
        throw new Error('Failed to fetch welcome packets');
      }
      
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const markAsShipped = async (parentId: string, orderId: string, trackingNumber?: string) => {
    try {
      setShippingOrder(orderId);
      
      const response = await fetch('/api/admin/welcome-packets', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parentId,
          orderId,
          trackingNumber: trackingNumber || undefined,
          carrier: 'USPS' // Default carrier
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark as shipped');
      }

      // Refresh the data
      await fetchWelcomePackets();
      alert('Welcome packet marked as shipped successfully!');
    } catch (err) {
      alert('Error marking as shipped: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setShippingOrder(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAddress = (address?: WelcomePacketOrder['order']['shippingAddress']) => {
    if (!address) return 'No address provided';
    
    const parts = [
      address.recipientName,
      address.street,
      address.apartment,
      `${address.city}, ${address.state} ${address.zipCode}`,
      address.country
    ].filter(Boolean);
    
    return parts.join('\\n');
  };

  // Filter and sort data based on current selections
  const getFilteredAndSortedData = () => {
    if (!data) return [];
    
    // Filter by status
    let filtered = data.data.filter(item => {
      switch (statusFilter) {
        case 'pending':
          return !item.order.shipped;
        case 'shipped':
          return item.order.shipped;
        case 'all':
        default:
          return true;
      }
    });
    
    // Sort the data
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(a.order.createdAt).getTime() - new Date(b.order.createdAt).getTime();
        case 'amount':
          return b.order.totalAmount - a.order.totalAmount;
        case 'priority':
        default:
          // Priority: unshipped orders by age, then shipped orders
          const aShipped = a.order.shipped;
          const bShipped = b.order.shipped;
          
          if (aShipped && !bShipped) return 1;
          if (!aShipped && bShipped) return -1;
          
          // Both same shipping status, sort by age
          const aDays = Math.ceil((Date.now() - new Date(a.order.createdAt).getTime()) / (1000 * 60 * 60 * 24));
          const bDays = Math.ceil((Date.now() - new Date(b.order.createdAt).getTime()) / (1000 * 60 * 60 * 24));
          return bDays - aDays; // Oldest first for unshipped
      }
    });
    
    return filtered;
  };

  const filteredData = getFilteredAndSortedData();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-santa-600"></div>
        <span className="ml-3 text-gray-600">Loading welcome packets...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-semibold mb-2">Error Loading Data</h3>
        <p className="text-red-600">{error}</p>
        <Button 
          onClick={fetchWelcomePackets}
          className="mt-3 bg-red-600 hover:bg-red-700 text-white"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <Card className="text-center py-12">
        <div className="text-6xl mb-4">📦</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Pending Welcome Packets</h3>
        <p className="text-gray-500">All welcome packets have been shipped!</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter and Sort Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Status:</label>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-santa-500 focus:border-santa-500"
              >
                <option value="all">All Orders</option>
                <option value="pending">Pending Shipment</option>
                <option value="shipped">Shipped</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Sort by:</label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value as 'date' | 'amount' | 'priority')}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-santa-500 focus:border-santa-500"
              >
                <option value="priority">Priority</option>
                <option value="date">Order Date</option>
                <option value="amount">Order Amount</option>
              </select>
            </div>
          </div>
          <Button 
            onClick={fetchWelcomePackets}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
          >
            🔄 Refresh Data
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card className="bg-santa-50 border-santa-200">
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-santa-600">{data.summary.pendingOrders}</div>
            <div className="text-sm text-santa-700">Pending Orders</div>
          </div>
        </Card>
        <Card className="bg-evergreen-50 border-evergreen-200">
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-evergreen-600">{data.summary.shippedOrders}</div>
            <div className="text-sm text-evergreen-700">Shipped Orders</div>
          </div>
        </Card>
        <Card className="bg-blueberry-50 border-blueberry-200">
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-blueberry-600">{data.summary.uniqueParents}</div>
            <div className="text-sm text-blueberry-700">Unique Parents</div>
          </div>
        </Card>
        <Card className="bg-berryPink-50 border-berryPink-200">
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-berryPink-600">${data.summary.totalRevenue}</div>
            <div className="text-sm text-berryPink-700">Total Revenue</div>
          </div>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200">
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {data.summary.oldestPendingOrder ? 
                Math.ceil((Date.now() - new Date(data.summary.oldestPendingOrder).getTime()) / (1000 * 60 * 60 * 24))
                : 0
              }
            </div>
            <div className="text-sm text-yellow-700">Days Since Oldest</div>
          </div>
        </Card>
      </div>

      {/* Welcome Packet Orders */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">
            {statusFilter === 'pending' && 'Pending Welcome Packets'}
            {statusFilter === 'shipped' && 'Shipped Welcome Packets'}
            {statusFilter === 'all' && 'All Welcome Packets'}
            <span className="ml-2 text-sm font-normal text-gray-500">({filteredData.length} orders)</span>
          </h2>
        </div>
        
        {filteredData.length === 0 ? (
          <Card className="text-center py-12">
            <div className="text-6xl mb-4">
              {statusFilter === 'pending' && '📦'}
              {statusFilter === 'shipped' && '✅'}
              {statusFilter === 'all' && '📋'}
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {statusFilter === 'pending' && 'No Pending Welcome Packets'}
              {statusFilter === 'shipped' && 'No Shipped Welcome Packets Yet'}
              {statusFilter === 'all' && 'No Welcome Packets Found'}
            </h3>
            <p className="text-gray-500">
              {statusFilter === 'pending' && 'All welcome packets have been shipped!'}
              {statusFilter === 'shipped' && 'Start shipping some welcome packets to see them here.'}
              {statusFilter === 'all' && 'No welcome packet orders found in the system.'}
            </p>
          </Card>
        ) : (
          filteredData.map((item) => (
            <Card key={item.order.orderId} className={`border-l-4 ${
              item.order.shipped 
                ? 'border-l-green-400 bg-green-50/30' 
                : item.order.isForSpecificChild 
                  ? 'border-l-blueberry-400' 
                  : 'border-l-santa-400'
            }`}>
              <div className="p-6">
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                  {/* Order Information */}
                  <div className="xl:col-span-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">{item.parentName}</h3>
                        <p className="text-sm text-gray-600">{item.parentEmail}</p>
                        <p className="text-xs text-gray-500">ID: {item.order.orderId?.slice(-8)}</p>
                        
                        {/* Status Badge */}
                        <div className="mt-2 flex flex-wrap gap-1">
                          {item.order.shipped ? (
                            <div className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              ✅ Shipped {item.order.shippedAt && `on ${formatDate(item.order.shippedAt).split(',')[0]}`}
                            </div>
                          ) : (
                            <div className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                              📦 Pending Shipment
                            </div>
                          )}
                          
                          {item.order.isForSpecificChild ? (
                            <div className="inline-flex items-center px-2 py-1 bg-blueberry-100 text-blueberry-800 text-xs rounded-full">
                              👶 For: {item.order.childName}
                            </div>
                          ) : (
                            <div className="inline-flex items-center px-2 py-1 bg-santa-100 text-santa-800 text-xs rounded-full">
                              🎁 Initial Setup
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-santa-600">${item.order.totalAmount}</div>
                        <div className="text-xs text-gray-500">{formatDate(item.order.createdAt)}</div>
                      </div>
                    </div>

                    {/* Selected Items */}
                    <div className="mb-4">
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Package Contents:</h4>
                      <div className="space-y-1 bg-gray-50 p-3 rounded border">
                        <div className="text-sm text-gray-600 font-medium">• Welcome Letter + Site Access ($10)</div>
                        {item.order.selectedItems.map(itemId => {
                          const itemInfo = WELCOME_PACKET_ITEMS[itemId];
                          return itemInfo ? (
                            <div key={itemId} className="text-sm text-gray-600">
                              • {itemInfo.name} (${itemInfo.price})
                            </div>
                          ) : null;
                        })}
                        <div className="text-sm font-semibold text-santa-600 pt-1 border-t border-gray-200">
                          Total: ${item.order.totalAmount}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Shipping Info */}
                  <div className="xl:col-span-1">
                    <div className="mb-4">
                      <h4 className="font-medium text-sm text-gray-700 mb-2">Shipping Address:</h4>
                      <div className="text-sm text-gray-600 whitespace-pre-line bg-gray-50 p-3 rounded border">
                        {formatAddress(item.order.shippingAddress)}
                      </div>
                    </div>

                    {item.order.shipped && item.order.trackingNumber && (
                      <div className="mb-4">
                        <h4 className="font-medium text-sm text-gray-700 mb-2">Tracking:</h4>
                        <div className="text-sm text-green-600 bg-green-50 p-3 rounded border border-green-200">
                          {item.order.trackingNumber}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Family Info */}
                  <div className="xl:col-span-1">
                    <div>
                      <h4 className="font-medium text-sm text-gray-700 mb-2">
                        Family ({item.childrenCount} {item.childrenCount === 1 ? 'child' : 'children'}):
                      </h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {item.children.map(child => (
                          <div key={child.childId} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                            {child.avatarUrl ? (
                              <img 
                                src={child.avatarUrl} 
                                alt={child.name}
                                className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-santa-200 flex items-center justify-center text-sm">
                                👶
                              </div>
                            )}
                            <div>
                              <span className="text-sm font-medium text-gray-700">{child.name}</span>
                              {item.order.isForSpecificChild && item.order.childName === child.name && (
                                <div className="text-xs text-blueberry-600">📦 This packet</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Priority */}
                  <div className="xl:col-span-1 flex flex-col justify-between">
                    {!item.order.shipped ? (
                      <div className="mb-4">
                        <h4 className="font-medium text-sm text-gray-700 mb-3">Ship This Order:</h4>
                        
                        {/* Tracking Number Input */}
                        <div className="mb-3">
                          <input
                            id={`tracking-${item.order.orderId}`}
                            type="text"
                            placeholder="Tracking number (optional)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-evergreen-500 focus:border-evergreen-500"
                          />
                        </div>

                        {/* Ship Button */}
                        <Button
                          onClick={() => {
                            const trackingInput = document.getElementById(`tracking-${item.order.orderId}`) as HTMLInputElement;
                            const trackingNumber = trackingInput?.value.trim();
                            
                            const confirmMessage = item.order.isForSpecificChild 
                              ? `Mark this welcome packet as shipped?\\n\\nParent: ${item.parentName}\\nFor Child: ${item.order.childName}\\nValue: $${item.order.totalAmount}`
                              : `Mark this welcome packet as shipped?\\n\\nParent: ${item.parentName}\\nFamily: ${item.childrenCount} children\\nValue: $${item.order.totalAmount}`;
                            
                            if (confirm(confirmMessage)) {
                              markAsShipped(item.parentId, item.order.orderId!, trackingNumber);
                            }
                          }}
                          disabled={shippingOrder === item.order.orderId}
                          className="w-full bg-evergreen-600 hover:bg-evergreen-700 text-white transition-all duration-200 hover:shadow-lg"
                        >
                          {shippingOrder === item.order.orderId ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Shipping...
                            </>
                          ) : (
                            <>📦 Mark as Shipped</>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="mb-4 text-center">
                        <div className="text-green-600 text-4xl mb-2">✅</div>
                        <div className="text-sm font-medium text-green-700">Shipped Successfully</div>
                        {item.order.shippedAt && (
                          <div className="text-xs text-green-600">{formatDate(item.order.shippedAt)}</div>
                        )}
                      </div>
                    )}

                    {/* Priority Indicator */}
                    <div className="text-center">
                      {(() => {
                        const daysSinceOrder = Math.ceil((Date.now() - new Date(item.order.createdAt).getTime()) / (1000 * 60 * 60 * 24));
                        if (item.order.shipped) {
                          return <span className="text-green-600 font-medium text-sm">✅ Completed</span>;
                        }
                        if (daysSinceOrder > 5) return <span className="text-red-600 font-semibold text-sm">🚨 High Priority ({daysSinceOrder} days old)</span>;
                        if (daysSinceOrder > 3) return <span className="text-yellow-600 font-semibold text-sm">⚠️ Medium Priority ({daysSinceOrder} days old)</span>;
                        return <span className="text-green-600 text-sm">✅ Normal Priority ({daysSinceOrder} days old)</span>;
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}