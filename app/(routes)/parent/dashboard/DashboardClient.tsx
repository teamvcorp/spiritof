"use client";

import React, { useState, useEffect } from "react";
import { FaCalendarAlt, FaCog } from "react-icons/fa";
import Button from "@/components/ui/Button";
import ChristmasSetup from "@/components/parents/ChristmasSetup";

interface DashboardClientProps {
  parentId: string;
  hasChristmasSetup: boolean;
  searchParams?: { 
    payment?: string; 
    session_id?: string;
    welcome_packet?: string;
  };
}

export default function DashboardClient({ parentId, hasChristmasSetup, searchParams }: DashboardClientProps) {
  const [showChristmasSetup, setShowChristmasSetup] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'cancelled'; message: string } | null>(null);

  useEffect(() => {
    console.log('DashboardClient useEffect - searchParams:', searchParams);
    let message: { type: 'success' | 'cancelled'; message: string } | null = null;

    // Check search params first (server-side), then URL params (client-side fallback)
    const payment = searchParams?.payment || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('payment') : null);
    const sessionId = searchParams?.session_id || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('session_id') : null);
    const welcomePacket = searchParams?.welcome_packet || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('welcome_packet') : null);
    
    console.log('Parsed values:', { payment, sessionId, welcomePacket });
    
    // Handle payment success/failure
    if (payment === 'success' && sessionId) {
      message = {
        type: 'success',
        message: ' Payment completed successfully! Your wallet has been topped up and welcome packet order is being processed.'
      };
    } else if (payment === 'cancelled') {
      message = {
        type: 'cancelled',
        message: '❌ Payment was cancelled. You can try again anytime.'
      };
    }
    // Handle welcome packet status
    else if (welcomePacket === 'success') {
      message = {
        type: 'success',
        message: 'Welcome packet order completed successfully! Your package will be prepared and shipped within 3-5 business days.'
      };
    } else if (welcomePacket === 'cancelled') {
      message = {
        type: 'cancelled',
        message: '❌ Welcome packet order was cancelled. You can try again anytime.'
      };
    }

    if (message) {
      console.log('Setting status message:', message);
      setStatusMessage(message);
      // Clean up URL
      if (typeof window !== 'undefined') {
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [searchParams]);

  const dismissMessage = () => {
    setStatusMessage(null);
  };

  return (
    <>
      {/* Status Message */}
      {statusMessage && (
        <div className={`mb-6 p-4 rounded-lg border ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-orange-50 border-orange-200 text-orange-800'
        }`}>
          <div className="flex items-center justify-between">
            <p className="font-medium">{statusMessage.message}</p>
            <button 
              onClick={dismissMessage}
              className="text-lg font-bold opacity-60 hover:opacity-100"
            >
              ×
            </button>
          </div>
        </div>
      )}
      {/* Header with Christmas Setup */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Parent Dashboard</h1>
        <div className="flex items-center gap-4">
          {/* Christmas Setup Button */}
          <Button
            onClick={() => setShowChristmasSetup(true)}
            className={`inline-flex items-center px-4 py-2 text-sm font-medium transition-colors ${
              hasChristmasSetup 
                ? "bg-evergreen hover:bg-green-600 text-white" 
                : "bg-santa hover:bg-red-700 text-white animate-pulse"
            }`}
          >
            <FaCalendarAlt className="mr-2" />
            {hasChristmasSetup ? "Christmas Settings" : "Setup Christmas"}
          </Button>
        </div>
      </div>

      {/* Setup Reminder Card (if not completed) */}
      {!hasChristmasSetup && (
        <div className=" border-2 border-santa-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-4xl mr-4">🎅</div>
              <div>
                <h3 className="text-lg font-semibold text-santa">Get Ready for Christmas!</h3>
                <p className="text-gray-600">
                  Complete your Christmas setup to configure budgets, shipping, and gift policies.
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowChristmasSetup(true)}
              className="bg-santa hover:bg-red-700 text-white px-6 py-3 animate-bounce"
            >
              <FaCog className="mr-2" />
              Start Setup
            </Button>
          </div>
        </div>
      )}

      {/* Christmas Setup Modal */}
      <ChristmasSetup
        isOpen={showChristmasSetup}
        onClose={() => setShowChristmasSetup(false)}
        parentId={parentId}
      />
    </>
  );
}