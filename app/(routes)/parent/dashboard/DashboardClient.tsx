"use client";

import React, { useState } from "react";
import { FaCalendarAlt, FaCog } from "react-icons/fa";
import Button from "@/components/ui/Button";
import ChristmasSetup from "@/components/parents/ChristmasSetup";

interface DashboardClientProps {
  parentId: string;
  hasChristmasSetup: boolean;
}

export default function DashboardClient({ parentId, hasChristmasSetup }: DashboardClientProps) {
  const [showChristmasSetup, setShowChristmasSetup] = useState(false);

  return (
    <>
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
            {hasChristmasSetup ? "🎄 Christmas Settings" : "🎅 Setup Christmas"}
          </Button>
        </div>
      </div>

      {/* Setup Reminder Card (if not completed) */}
      {!hasChristmasSetup && (
        <div className="bg-gradient-to-r from-santa-50 to-evergreen-50 border-2 border-santa-200 rounded-xl p-6 mb-6">
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