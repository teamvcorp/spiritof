"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { FaSms } from "react-icons/fa";

export default function SendVotingSMSButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSendSMS = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/parent/send-voting-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message || 'Voting link sent!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to send SMS' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handleSendSMS}
        disabled={loading}
        className="inline-flex items-center px-4 py-2 bg-blueberry hover:bg-blue-600 text-white disabled:opacity-50"
      >
        <FaSms className="mr-2" />
        {loading ? 'Sending...' : 'Send Voting Link via SMS'}
      </Button>
      
      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  );
}
