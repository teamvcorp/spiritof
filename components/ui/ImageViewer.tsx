"use client";

import React, { useState } from "react";
import { FaTimes, FaDownload, FaSpinner, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import Image from "next/image";
import Button from "./Button";

interface ImageViewerProps {
  gift: {
    _id: string;
    title: string;
    imageUrl?: string;
    blobUrl?: string;
    originalImageUrl?: string;
    productUrl?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onImageUploaded?: (giftId: string, blobUrl: string) => void;
}

export default function ImageViewer({ gift, isOpen, onClose, onImageUploaded }: ImageViewerProps) {
  const [uploading, setUploading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  if (!isOpen) return null;

  // Get all available image URLs for this gift
  const availableImages = [
    gift.blobUrl,
    gift.imageUrl,
    gift.originalImageUrl
  ].filter(Boolean) as string[];

  // Remove duplicates and placeholder images
  const uniqueImages = availableImages.filter((url, index, arr) => 
    arr.indexOf(url) === index && 
    !url.includes('/images/christmasMagic.png') &&
    !url.includes('/images/') // Filter out all local placeholder images
  );

  const hasRealImages = uniqueImages.length > 0;
  const currentImageUrl = hasRealImages ? uniqueImages[currentImageIndex] : "/images/christmasMagic.png";

  const handleUploadToBlob = async () => {
    if (!currentImageUrl || currentImageUrl === "/images/christmasMagic.png") return;
    
    setUploading(true);
    setUploadSuccess(false);

    try {
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: currentImageUrl,
          giftId: gift._id,
          filename: `${gift.title.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}`
        })
      });

      const result = await response.json();

      if (result.success) {
        setUploadSuccess(true);
        if (onImageUploaded) {
          onImageUploaded(gift._id, result.blobUrl);
        }
        setTimeout(() => {
          setUploadSuccess(false);
          onClose();
        }, 2000);
      } else {
        alert(`Upload failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % uniqueImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + uniqueImages.length) % uniqueImages.length);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full overflow-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {gift.title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            <FaTimes />
          </button>
        </div>

        {/* Image Display */}
        <div className="p-4">
          {!hasRealImages && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <div className="text-orange-500 text-lg mr-2">⚠️</div>
                <div>
                  <h4 className="font-medium text-orange-800">No Real Product Images Available</h4>
                  <p className="text-sm text-orange-600 mt-1">
                    This item was added from a curated list and doesn&apos;t have actual product photos yet. 
                    You can search for this product online to find images, or try adding it again from a search result that includes photos.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="relative bg-gray-100 rounded-lg overflow-hidden mb-4">
            <div className="aspect-video flex items-center justify-center">
              <Image
                src={currentImageUrl}
                alt={gift.title}
                width={800}
                height={450}
                className="max-h-full max-w-full object-contain"
                unoptimized={!currentImageUrl.includes('vercel-storage')}
                onError={(e) => {
                  e.currentTarget.src = "/images/christmasMagic.png";
                }}
              />
            </div>

            {/* Image Navigation */}
            {uniqueImages.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
                >
                  <FaChevronLeft />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
                >
                  <FaChevronRight />
                </button>
                
                {/* Image Counter */}
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} / {uniqueImages.length}
                </div>
              </>
            )}
          </div>

          {/* Image Info */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="text-sm text-gray-600 space-y-1">
              <div><strong>Current Image URL:</strong></div>
              <div className="font-mono text-xs bg-white p-2 rounded border break-all">
                {currentImageUrl}
              </div>
              
              {gift.blobUrl && (
                <div className="text-green-600 font-medium">
                  ✅ Already stored in Vercel Blob
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            {gift.productUrl && (
              <Button
                onClick={() => { 
                  if (gift.productUrl) {
                    window.open(gift.productUrl, "_blank");
                  }
                }}
                className="bg-blueberry text-white max-w-none"
              >
                View Product Page
              </Button>
            )}

            <Button
              onClick={handleUploadToBlob}
              disabled={uploading || uploadSuccess || !hasRealImages || !!gift.blobUrl}
              className={`max-w-none ${
                uploadSuccess 
                  ? "bg-green-500 text-white" 
                  : gift.blobUrl 
                    ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                    : !hasRealImages
                      ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                      : "bg-santa text-white"
              }`}
            >
              {uploading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Uploading...
                </>
              ) : uploadSuccess ? (
                "✅ Uploaded Successfully!"
              ) : gift.blobUrl ? (
                "Already in Blob Storage"
              ) : !hasRealImages ? (
                "No Images to Upload"
              ) : (
                <>
                  <FaDownload className="mr-2" />
                  Save to Vercel Blob
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}