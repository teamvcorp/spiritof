"use client";

import { useState } from "react";
import { FaQrcode } from "react-icons/fa";
import Button from "@/components/ui/Button";
import QRShareModal from "@/components/ui/QRShareModal";

interface QRShareButtonProps {
  childId: string;
  childName: string;
  shareSlug: string;
}

export default function QRShareButton({ childId, childName, shareSlug }: QRShareButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Generate share URL - handle both development and production
  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/share/${shareSlug}`
    : `http://localhost:3000/share/${shareSlug}`;

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        className="text-xs px-2 py-1 text-blueberry border border-blueberry hover:bg-blueberry hover:text-white bg-white max-w-none"
      >
        <FaQrcode className="w-3 h-3 mr-1" />
        QR Share
      </Button>

      <QRShareModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        childName={childName}
        childId={childId}
        shareUrl={shareUrl}
      />
    </>
  );
}