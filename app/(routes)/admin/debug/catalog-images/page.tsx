"use client";

import React, { useState, useEffect } from "react";
import { FaRedo, FaImage, FaExclamationTriangle, FaCheckCircle } from "react-icons/fa";
import Image from "next/image";

interface CatalogImageData {
  title: string;
  imageUrl: string | null;
  blobUrl: string | null;
  sourceType: string;
  retailer: string;
  hasBlobUrl: boolean;
  blobUrlValid: boolean;
  needsImageUpload: boolean;
}

interface DebugResponse {
  success: boolean;
  count: number;
  items: CatalogImageData[];
  summary: {
    totalItems: number;
    withBlobUrl: number;
    withValidBlobUrl: number;
    needingImageUpload: number;
  };
}

export default function CatalogImagesDebugPage() {
  const [data, setData] = useState<DebugResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/debug/catalog-images');
      const result = await response.json();
      
      if (result.success) {
        setData(result);
      } else {
        setError(result.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError('Network error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading catalog image data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Data</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchData}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!data) {
    return <div>No data available</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Catalog Images Debug</h2>
          <p className="text-gray-600">Check catalog items and their image status</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          <FaRedo className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <FaImage className="w-8 h-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{data.summary.totalItems}</p>
              <p className="text-gray-600">Total Items</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <FaCheckCircle className="w-8 h-8 text-green-500" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{data.summary.withValidBlobUrl}</p>
              <p className="text-gray-600">Valid Blob URLs</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <FaExclamationTriangle className="w-8 h-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{data.summary.needingImageUpload}</p>
              <p className="text-gray-600">Need Upload</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-bold">%</span>
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {Math.round((data.summary.withValidBlobUrl / data.summary.totalItems) * 100)}%
              </p>
              <p className="text-gray-600">Images Complete</p>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Catalog Items</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Retailer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Preview
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.items.map((item, index) => (
                <tr key={index} className={item.needsImageUpload ? 'bg-red-50' : ''}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{item.title}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {item.blobUrlValid ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <FaCheckCircle className="w-3 h-3 mr-1" />
                          Valid Blob
                        </span>
                      ) : item.needsImageUpload ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <FaExclamationTriangle className="w-3 h-3 mr-1" />
                          Needs Upload
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          No Image
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{item.sourceType}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{item.retailer || 'N/A'}</td>
                  <td className="px-6 py-4">
                    {item.blobUrl ? (
                      <Image
                        src={item.blobUrl}
                        alt={item.title}
                        width={40}
                        height={40}
                        className="rounded object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/images/christmasMagic.png';
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                        <FaImage className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Panel */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">📋 Next Steps</h3>
        <div className="text-blue-700">
          <p className="mb-2">
            <strong>{data.summary.needingImageUpload} items</strong> need image uploads.
          </p>
          <p>
            Go to <strong>/admin/catalog-builder</strong> to upload images for items marked as "Needs Upload".
          </p>
        </div>
      </div>
    </div>
  );
}