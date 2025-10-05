"use client";

import React, { useState, useEffect } from "react";
import { FaTimes, FaCheck, FaSpinner, FaGift, FaCreditCard, FaHome, FaCalendar, FaUsers, FaDollarSign } from "react-icons/fa";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

interface ChristmasSetupProps {
  isOpen: boolean;
  onClose: () => void;
  parentId: string;
}

interface ChristmasSettings {
  // Budget & Payment
  monthlyBudgetGoal: number;
  autoContributeAmount: number;
  enableAutoContribute: boolean;
  
  // Timeline Settings
  listLockDate: string; // YYYY-MM-DD format
  finalPaymentDate: string;
  
  // Sharing & Gifts
  allowFriendGifts: boolean;
  maxFriendGiftValue: number;
  allowEarlyGifts: boolean;
  
  // Shipping Address
  shippingAddress: {
    recipientName: string;
    street: string;
    apartment?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    isDefault: boolean;
  };
  
  // Payment Method
  hasPaymentMethod: boolean;
  paymentMethodLast4?: string;
  
  // Notifications
  reminderEmails: boolean;
  weeklyBudgetUpdates: boolean;
  listLockReminders: boolean;
}

const defaultSettings: ChristmasSettings = {
  monthlyBudgetGoal: 200,
  autoContributeAmount: 50,
  enableAutoContribute: false,
  listLockDate: "2025-12-11", // December 11th
  finalPaymentDate: "2025-12-20", // December 20th
  allowFriendGifts: true,
  maxFriendGiftValue: 25,
  allowEarlyGifts: false,
  shippingAddress: {
    recipientName: "",
    street: "",
    apartment: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US",
    isDefault: true,
  },
  hasPaymentMethod: false,
  reminderEmails: true,
  weeklyBudgetUpdates: true,
  listLockReminders: true,
};

export default function ChristmasSetup({ isOpen, onClose, parentId }: ChristmasSetupProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [settings, setSettings] = useState<ChristmasSettings>(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [addingPayment, setAddingPayment] = useState(false);

  const totalSteps = 5;

  useEffect(() => {
    if (isOpen) {
      loadExistingSettings();
      // Check if returning from payment setup
      const urlParams = new URLSearchParams(window.location.search);
      const paymentSetup = urlParams.get('payment_setup');
      
      if (paymentSetup === 'success') {
        // Payment method was added successfully
        setTimeout(() => {
          loadExistingSettings(); // Reload to get updated payment method
        }, 1000);
        
        // Clean URL
        const url = new URL(window.location.href);
        url.searchParams.delete('payment_setup');
        window.history.replaceState({}, '', url.toString());
      } else if (paymentSetup === 'cancelled') {
        setError('Payment setup was cancelled. You can try again later.');
        
        // Clean URL
        const url = new URL(window.location.href);
        url.searchParams.delete('payment_setup');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [isOpen]);

  const loadExistingSettings = async () => {
    try {
      const response = await fetch('/api/parent/christmas-settings');
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setSettings({ ...defaultSettings, ...data.settings });
        }
      }
    } catch (error) {
      console.error('Failed to load existing settings:', error);
    }
  };

  const updateSettings = (updates: Partial<ChristmasSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const updateShippingAddress = (updates: Partial<ChristmasSettings['shippingAddress']>) => {
    setSettings(prev => ({
      ...prev,
      shippingAddress: { ...prev.shippingAddress, ...updates }
    }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch('/api/parent/christmas-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        onClose();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save settings');
      }
    } catch (error) {
      setError('Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPaymentMethod = async () => {
    setAddingPayment(true);
    setError("");

    try {
      // Create Stripe checkout session for setup
      const response = await fetch('/api/stripe/setup-payment-method', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnUrl: window.location.href,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          // Redirect to Stripe checkout
          window.location.href = data.url;
        } else {
          setError('Failed to create payment setup session');
        }
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to setup payment method');
      }
    } catch (error) {
      setError('Failed to setup payment method. Please try again.');
    } finally {
      setAddingPayment(false);
    }
  };

  if (!isOpen) return null;

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <FaDollarSign className="mx-auto text-4xl text-evergreen mb-4" />
              <h3 className="text-xl font-semibold mb-2">Budget & Auto-Contribute</h3>
              <p className="text-gray-600">Set your Christmas budget goals and automatic contributions</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Budget Goal
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={settings.monthlyBudgetGoal}
                    onChange={(e) => updateSettings({ monthlyBudgetGoal: Number(e.target.value) })}
                    className="pl-8 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-evergreen"
                    min="0"
                    step="10"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">How much do you want to budget for Christmas gifts each month?</p>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="enableAutoContribute"
                  checked={settings.enableAutoContribute}
                  onChange={(e) => updateSettings({ enableAutoContribute: e.target.checked })}
                  className="rounded border-gray-300 text-evergreen focus:ring-evergreen"
                />
                <label htmlFor="enableAutoContribute" className="text-sm font-medium text-gray-700">
                  Enable automatic monthly contributions
                </label>
              </div>

              {settings.enableAutoContribute && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Auto-Contribute Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={settings.autoContributeAmount}
                      onChange={(e) => updateSettings({ autoContributeAmount: Number(e.target.value) })}
                      className="pl-8 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-evergreen"
                      min="0"
                      max={settings.monthlyBudgetGoal}
                      step="5"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Amount to automatically add to your wallet each month</p>
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <FaCalendar className="mx-auto text-4xl text-blueberry mb-4" />
              <h3 className="text-xl font-semibold mb-2">Christmas Timeline</h3>
              <p className="text-gray-600">Set important dates for your Christmas planning</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  List Lock Date
                </label>
                <input
                  type="date"
                  value={settings.listLockDate}
                  onChange={(e) => updateSettings({ listLockDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blueberry"
                  min="2025-11-01"
                  max="2025-12-24"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Last day children can modify their Christmas lists (recommended: December 11th)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Final Payment Date
                </label>
                <input
                  type="date"
                  value={settings.finalPaymentDate}
                  onChange={(e) => updateSettings({ finalPaymentDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blueberry"
                  min={settings.listLockDate}
                  max="2025-12-24"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Final date to complete payment for all Christmas gifts
                </p>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <FaGift className="mx-auto text-4xl text-berryPink mb-4" />
              <h3 className="text-xl font-semibold mb-2">Gift Sharing & Early Gifts</h3>
              <p className="text-gray-600">Configure gift sharing and early gift policies</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="allowFriendGifts"
                  checked={settings.allowFriendGifts}
                  onChange={(e) => updateSettings({ allowFriendGifts: e.target.checked })}
                  className="rounded border-gray-300 text-berryPink focus:ring-berryPink"
                />
                <label htmlFor="allowFriendGifts" className="text-sm font-medium text-gray-700">
                  Allow children to send gifts to friends
                </label>
              </div>

              {settings.allowFriendGifts && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Friend Gift Value
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      value={settings.maxFriendGiftValue}
                      onChange={(e) => updateSettings({ maxFriendGiftValue: Number(e.target.value) })}
                      className="pl-8 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-berryPink"
                      min="5"
                      max="100"
                      step="5"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="allowEarlyGifts"
                  checked={settings.allowEarlyGifts}
                  onChange={(e) => updateSettings({ allowEarlyGifts: e.target.checked })}
                  className="rounded border-gray-300 text-berryPink focus:ring-berryPink"
                />
                <label htmlFor="allowEarlyGifts" className="text-sm font-medium text-gray-700">
                  Allow early gift deliveries throughout the year
                </label>
              </div>
              
              <p className="text-xs text-gray-500">
                When enabled, children can receive gifts as rewards for good behavior year-round
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <FaHome className="mx-auto text-4xl text-santa mb-4" />
              <h3 className="text-xl font-semibold mb-2">Shipping Address</h3>
              <p className="text-gray-600">Where should gifts be delivered?</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient Name
                </label>
                <input
                  type="text"
                  value={settings.shippingAddress.recipientName}
                  onChange={(e) => updateShippingAddress({ recipientName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-santa"
                  placeholder="The Smith Family"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address
                </label>
                <input
                  type="text"
                  value={settings.shippingAddress.street}
                  onChange={(e) => updateShippingAddress({ street: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-santa"
                  placeholder="123 Christmas Lane"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apartment/Unit (Optional)
                </label>
                <input
                  type="text"
                  value={settings.shippingAddress.apartment || ""}
                  onChange={(e) => updateShippingAddress({ apartment: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-santa"
                  placeholder="Apt 2B"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={settings.shippingAddress.city}
                    onChange={(e) => updateShippingAddress({ city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-santa"
                    placeholder="North Pole"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    value={settings.shippingAddress.state}
                    onChange={(e) => updateShippingAddress({ state: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-santa"
                    placeholder="AK"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP Code
                </label>
                <input
                  type="text"
                  value={settings.shippingAddress.zipCode}
                  onChange={(e) => updateShippingAddress({ zipCode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-santa"
                  placeholder="00001"
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <FaCreditCard className="mx-auto text-4xl text-evergreen mb-4" />
              <h3 className="text-xl font-semibold mb-2">Payment & Notifications</h3>
              <p className="text-gray-600">Finalize payment method and notification preferences</p>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Payment Method</h4>
                {settings.hasPaymentMethod ? (
                  <div className="flex items-center text-green-600">
                    <FaCheck className="mr-2" />
                    <span>Payment method ending in {settings.paymentMethodLast4}</span>
                  </div>
                ) : (
                  <div className="text-amber-600">
                    <p className="text-sm mb-2">No payment method on file</p>
                    <Button 
                      onClick={handleAddPaymentMethod}
                      disabled={addingPayment}
                      className="bg-blueberry text-white text-sm"
                    >
                      {addingPayment ? (
                        <>
                          <FaSpinner className="mr-2 animate-spin" />
                          Setting up...
                        </>
                      ) : (
                        "Add Payment Method"
                      )}
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Notification Preferences</h4>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="reminderEmails"
                    checked={settings.reminderEmails}
                    onChange={(e) => updateSettings({ reminderEmails: e.target.checked })}
                    className="rounded border-gray-300 text-evergreen focus:ring-evergreen"
                  />
                  <label htmlFor="reminderEmails" className="text-sm text-gray-700">
                    Important deadline reminders
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="weeklyBudgetUpdates"
                    checked={settings.weeklyBudgetUpdates}
                    onChange={(e) => updateSettings({ weeklyBudgetUpdates: e.target.checked })}
                    className="rounded border-gray-300 text-evergreen focus:ring-evergreen"
                  />
                  <label htmlFor="weeklyBudgetUpdates" className="text-sm text-gray-700">
                    Weekly budget and spending updates
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="listLockReminders"
                    checked={settings.listLockReminders}
                    onChange={(e) => updateSettings({ listLockReminders: e.target.checked })}
                    className="rounded border-gray-300 text-evergreen focus:ring-evergreen"
                  />
                  <label htmlFor="listLockReminders" className="text-sm text-gray-700">
                    Christmas list lock date reminders
                  </label>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4 mt-6">
                <h4 className="font-medium text-green-800 mb-2">Setup Summary</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Monthly budget: ${settings.monthlyBudgetGoal}</li>
                  <li>• List locks: {new Date(settings.listLockDate).toLocaleDateString()}</li>
                  <li>• Final payment: {new Date(settings.finalPaymentDate).toLocaleDateString()}</li>
                  <li>• Friend gifts: {settings.allowFriendGifts ? 'Enabled' : 'Disabled'}</li>
                  <li>• Shipping to: {settings.shippingAddress.city}, {settings.shippingAddress.state}</li>
                </ul>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-paytone-one text-santa">
                🎄 Christmas Setup
              </h2>
              <p className="text-gray-600">
                Step {currentStep} of {totalSteps}: Get ready for the perfect Christmas
              </p>
            </div>
            <Button
              onClick={onClose}
              className="bg-gray-500 hover:bg-gray-600 p-2"
            >
              <FaTimes />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div
                  key={i + 1}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    i + 1 <= currentStep
                      ? "bg-evergreen text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {i + 1 < currentStep ? <FaCheck /> : i + 1}
                </div>
              ))}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-evergreen h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Step Content */}
          <div className="mb-8">
            {renderStepContent()}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="bg-gray-500 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </Button>
            
            <div className="flex gap-2">
              {currentStep < totalSteps ? (
                <Button
                  onClick={handleNext}
                  className="bg-evergreen hover:bg-green-600"
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleFinish}
                  disabled={loading}
                  className="bg-santa hover:bg-red-700"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaCheck className="mr-2" />
                      Complete Setup
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}