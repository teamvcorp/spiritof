"use client";

import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import { WelcomePacketSetup } from './WelcomePacketSetup';

interface WelcomePacketButtonProps {
  hasCompletedWelcomePacket: boolean;
  className?: string;
}

export function WelcomePacketButton({ hasCompletedWelcomePacket, className }: WelcomePacketButtonProps) {
  const [showSetup, setShowSetup] = useState(false);

  if (showSetup) {
    return (
      <WelcomePacketSetup
        onComplete={() => {
          setShowSetup(false);
          // Refresh the page to show updated status
          window.location.reload();
        }}
        onCancel={() => setShowSetup(false)}
      />
    );
  }

  if (hasCompletedWelcomePacket) {
    return (
      <div className={`p-4 bg-evergreen-50 border border-evergreen-200 rounded-xl ${className}`}>
        <div className="flex items-center gap-3">
          <div className="text-2xl">✅</div>
          <div>
            <h3 className="font-semibold text-evergreen-800">Welcome Packet Ordered</h3>
            <p className="text-sm text-evergreen-600">
              Your welcome packet is being prepared for shipment
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-xl ${className}`}>
      <div className="text-center flex flex-col items-center">
        <div className="text-4xl mb-3">🎁</div>
        <h3 className="text-xl font-paytone-one text-santa-700 mb-2">
          Welcome Packet Required
        </h3>
        <p className="text-gray-700 mb-4 w-3/4 my-5 ">
          Before adding children, you need to set up a welcome packet. Your child will receive a personalized welcome letter and instructions in the mail.
        </p>
        <Button
          onClick={() => setShowSetup(true)}
          className="link-btn santa-btn"
        >
          Set Up
        </Button>
        <p className="text-sm text-gray-500 mt-2">
          $5 enrollment fee + optional add-ons
        </p>
      </div>
    </div>
  );
}