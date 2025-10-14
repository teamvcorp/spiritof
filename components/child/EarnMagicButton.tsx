"use client";

import { useState } from "react";
import { ImMagicWand } from "react-icons/im";
import Button from "@/components/ui/Button";
import QRShareModal from "@/components/ui/QRShareModal";

interface EarnMagicButtonProps {
  childId: string;
  childName: string;
  shareSlug: string;
}

export default function EarnMagicButton({ childId, childName, shareSlug }: EarnMagicButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Generate share URL - handle both development and production
  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/share/${shareSlug}`
    : `http://localhost:3000/share/${shareSlug}`;

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        className="bg-santa p-2 min-w-40"
      >
        <span><ImMagicWand /></span>Earn Magic
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