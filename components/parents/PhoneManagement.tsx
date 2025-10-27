"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { FaPhone, FaEdit, FaClock, FaBell } from "react-icons/fa";

interface PhoneManagementProps {
  initialPhone?: string;
  initialNotificationTime?: string;
  initialNotificationsEnabled?: boolean;
  initialTimezone?: string;
}

export default function PhoneManagement({ 
  initialPhone,
  initialNotificationTime = "17:00",
  initialNotificationsEnabled = true,
  initialTimezone = "America/New_York"
}: PhoneManagementProps) {
  const [isEditing, setIsEditing] = useState(!initialPhone);
  const [phone, setPhone] = useState(initialPhone || "");
  const [notificationTime, setNotificationTime] = useState(initialNotificationTime);
  const [notificationsEnabled, setNotificationsEnabled] = useState(initialNotificationsEnabled);
  const [timezone, setTimezone] = useState(initialTimezone);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();

  const handleSave = async () => {
    if (!phone.trim()) {
      setMessage({ type: 'error', text: 'Phone number is required' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/parent/update-phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          phone: phone.trim(),
          smsNotificationTime: notificationTime,
          smsNotificationsEnabled: notificationsEnabled,
          timezone: timezone
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Phone number saved!' });
        setIsEditing(false);
        
        // Refresh the page data
        router.refresh();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save phone number' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-lg p-6 shadow-[0_4px_12px_rgba(0,0,0,0.15)] space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FaPhone className="text-blueberry" />
          <h2 className="text-xl font-semibold text-gray-800">SMS Voting Alerts</h2>
        </div>
        {!isEditing && phone && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-blueberry hover:text-blue-600 text-sm flex items-center gap-1"
          >
            <FaEdit /> Edit
          </button>
        )}
      </div>

      <p className="text-sm text-gray-600">
        Get quick voting links sent to your phone to track your children's behavior throughout the day.
      </p>

      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cell Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
              className="w-full rounded-md border px-3 py-2 text-sm bg-background"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <FaClock className="text-blueberry" />
                Daily Reminder Time
              </label>
              <input
                type="time"
                value={notificationTime}
                onChange={(e) => setNotificationTime(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm bg-background"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm bg-background"
              >
                <option value="America/New_York">Eastern (ET)</option>
                <option value="America/Chicago">Central (CT)</option>
                <option value="America/Denver">Mountain (MT)</option>
                <option value="America/Phoenix">Arizona (MST)</option>
                <option value="America/Los_Angeles">Pacific (PT)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-blueberry/5 rounded-lg">
            <input
              type="checkbox"
              id="smsEnabled"
              checked={notificationsEnabled}
              onChange={(e) => setNotificationsEnabled(e.target.checked)}
              className="w-4 h-4 text-blueberry rounded"
            />
            <label htmlFor="smsEnabled" className="text-sm text-gray-700 flex items-center gap-1">
              <FaBell className="text-blueberry" />
              Enable daily SMS voting reminders
            </label>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-blueberry hover:bg-blue-600 text-white disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>
            {initialPhone && (
              <Button
                onClick={() => {
                  setPhone(initialPhone);
                  setNotificationTime(initialNotificationTime);
                  setNotificationsEnabled(initialNotificationsEnabled);
                  setTimezone(initialTimezone);
                  setIsEditing(false);
                  setMessage(null);
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700"
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-blueberry/10 rounded-lg p-4 border border-blueberry/20">
            <div className="space-y-2">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Phone:</span> {phone}
              </p>
              <p className="text-sm text-gray-700 flex items-center gap-1">
                <FaClock className="text-blueberry" />
                <span className="font-medium">Daily Reminder:</span> {notificationTime} ({timezone.split('/')[1]})
              </p>
              <p className="text-sm text-gray-700 flex items-center gap-1">
                <FaBell className="text-blueberry" />
                <span className="font-medium">Status:</span> {notificationsEnabled ? '✅ Enabled' : '❌ Disabled'}
              </p>
            </div>
          </div>
          {notificationsEnabled && (
            <p className="text-xs text-gray-500">
              💬 You'll receive a voting link daily at {notificationTime}
            </p>
          )}
        </div>
      )}

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
