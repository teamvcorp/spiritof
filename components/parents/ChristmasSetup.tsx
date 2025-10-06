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
          const loadedSettings = { ...defaultSettings, ...data.settings };
          
          // Auto-populate address from welcome packet if not already set
          if (data.welcomePacketAddress && 
              (!loadedSettings.shippingAddress.street || 
               !loadedSettings.shippingAddress.city || 
               !loadedSettings.shippingAddress.state)) {
            loadedSettings.shippingAddress = {
              ...loadedSettings.shippingAddress,
              recipientName: loadedSettings.shippingAddress.recipientName || data.welcomePacketAddress.recipientName || data.parentName,
              street: loadedSettings.shippingAddress.street || data.welcomePacketAddress.street,
              apartment: loadedSettings.shippingAddress.apartment || data.welcomePacketAddress.apartment,
              city: loadedSettings.shippingAddress.city || data.welcomePacketAddress.city,
              state: loadedSettings.shippingAddress.state || data.welcomePacketAddress.state,
              zipCode: loadedSettings.shippingAddress.zipCode || data.welcomePacketAddress.zipCode,
              country: loadedSettings.shippingAddress.country || data.welcomePacketAddress.country || "US",
            };
          }
          
          // Auto-populate recipient name with parent name if still not set
          if (!loadedSettings.shippingAddress.recipientName && data.parentName) {
            loadedSettings.shippingAddress.recipientName = data.parentName;
          }
          
          setSettings(loadedSettings);
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
            <div className="text-center  text-evergreen  rounded-2xl p-6  ">
              <div className="text-6xl mb-4">💰</div>
              <h3 className="text-2xl font-paytone-one text-santa-600 mb-2">Budget & Auto-Contribute</h3>
              <p className="text-gray-700 font-medium">Set your Christmas budget goals and automatic contributions</p>
            </div>
            
            <div className="space-y-6">
              <div className="bg-gray-100 rounded-xl p-4 border border-gray-200 shadow-sm">
                <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center">
                  Monthly Budget Goal
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 font-bold text-lg">$</span>
                  <input
                    type="number"
                    value={settings.monthlyBudgetGoal}
                    onChange={(e) => updateSettings({ monthlyBudgetGoal: Number(e.target.value) })}
                    className="bg-white pl-8 w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 text-lg font-medium transition-all duration-200"
                    min="0"
                    step="10"
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2 flex items-center">
                  <span className="mr-2">💡</span>
                  How much do you want to budget for Christmas gifts each month?
                </p>
              </div>

              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <input
                    type="checkbox"
                    id="enableAutoContribute"
                    checked={settings.enableAutoContribute}
                    onChange={(e) => updateSettings({ enableAutoContribute: e.target.checked })}
                    className="w-5 h-5  hover:cursor-pointer hover:scale-103 "
                  />
                  <label htmlFor="enableAutoContribute" className="text-sm font-bold text-gray-800 flex items-center">
                    
                    Enable automatic monthly contributions
                  </label>
                </div>

                {settings.enableAutoContribute && (
                  <div className="bg-gray-100 rounded-xl p-4 border border-gray-200 shadow-sm">
                    <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center">
                      
                      Monthly Auto-Contribute Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-evergreen font-bold text-lg">$</span>
                      <input
                        type="number"
                        value={settings.autoContributeAmount}
                        onChange={(e) => updateSettings({ autoContributeAmount: Number(e.target.value) })}
                        className="bg-white pl-8 w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-evergreen-500 focus:border-evergreen-500 text-lg font-medium"
                        min="0"
                        max={settings.monthlyBudgetGoal}
                        step="5"
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-2 flex items-center">
                      <span className="mr-2">💡</span>
                      Amount to automatically add to your wallet each month
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center  rounded-2xl p-6 ">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-2xl font-paytone-one text-blueberry-600 mb-2">Christmas Timeline</h3>
              <p className="text-gray-700 font-medium">Set important dates for your Christmas planning</p>
            </div>
            
            <div className="space-y-6">
              <div className="bg-gray-100 rounded-xl p-4 border border-gray-200 shadow-sm">
                <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center">
             
                  List Lock Date
                </label>
                <input
                  type="date"
                  value={settings.listLockDate}
                  onChange={(e) => updateSettings({ listLockDate: e.target.value })}
                  className="bg-white w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 text-lg font-medium transition-all duration-200 "
                  min="2025-11-01"
                  max="2025-12-24"
                />
                <p className="text-sm text-gray-600 mt-2 flex items-center">
                  <span className="mr-2">💡</span>
                  Last day children can modify their Christmas lists (recommended: December 11th)
                </p>
              </div>

              <div className="bg-gray-100 rounded-xl p-4 border border-gray-200 shadow-sm">
                <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center">
                 
                  Final Payment Date
                </label>
                <input
                  type="date"
                  value={settings.finalPaymentDate}
                  onChange={(e) => updateSettings({ finalPaymentDate: e.target.value })}
                  className="bg-white w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blueberry-500 focus:border-blueberry-500 text-lg font-medium transition-all duration-200"
                  min={settings.listLockDate}
                  max="2025-12-24"
                />
                <p className="text-sm text-gray-600 mt-2 flex items-center">
                  <span className="mr-2">💡</span>
                  Final date to complete payment for all Christmas gifts
                </p>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center rounded-2xl p-6 ">
              <div className="text-6xl mb-4">🎁</div>
              <h3 className="text-2xl font-paytone-one text-berryPink-600 mb-2">Gift Sharing & Early Gifts</h3>
              <p className="text-gray-700 font-medium">Configure gift sharing and early gift policies</p>
            </div>
            
            <div className="space-y-6">
              <div className=" rounded-xl p-4 bg-gray-100 rounded-xl p-4 border border-gray-200 shadow-sm ">
                <div className="flex items-center space-x-3 mb-4">
                  <input
                    type="checkbox"
                    id="allowFriendGifts"
                    checked={settings.allowFriendGifts}
                    onChange={(e) => updateSettings({ allowFriendGifts: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300  hover:cursor-pointer hover:scale-103 "
                  />
                  <label htmlFor="allowFriendGifts" className="text-sm font-bold text-gray-800 flex items-center">
                   
                    Allow children to send gifts to friends
                  </label>
                </div>

                {settings.allowFriendGifts && (
                  <div className="">
                    <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center">
                     
                      Maximum Friend Gift Value
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-berryPink-600 font-bold text-lg">$</span>
                      <input
                        type="number"
                        value={settings.maxFriendGiftValue}
                        onChange={(e) => updateSettings({ maxFriendGiftValue: Number(e.target.value) })}
                        className="bg-white pl-8 w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-berryPink-500 focus:border-berryPink-500 text-lg font-medium"
                        min="5"
                        max="100"
                        step="5"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gray-100 rounded-xl p-4 border border-gray-200 shadow-sm rounded-xl p-4 ">
                <div className="flex items-center space-x-3 mb-3">
                  <input
                    type="checkbox"
                    id="allowEarlyGifts"
                    checked={settings.allowEarlyGifts}
                    onChange={(e) => updateSettings({ allowEarlyGifts: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300  hover:cursor-pointer hover:scale-103 "
                  />
                  <label htmlFor="allowEarlyGifts" className="text-sm font-bold text-gray-800 flex items-center">
                    
                    Allow early gift deliveries throughout the year
                  </label>
                </div>
                
                <p className="text-sm text-gray-600 flex items-center">
                  <span className="mr-2">💡</span>
                  When enabled, children can receive gifts as rewards for good behavior year-round
                </p>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center rounded-2xl p-6">
              <div className="text-6xl mb-4">🏠</div>
              <h3 className="text-2xl font-paytone-one text-santa-600 mb-2">Shipping Address</h3>
              <p className="text-gray-700 font-medium">Where should Santa deliver the gifts?</p>
            </div>
            
            <div className="space-y-4 bg-gray-100 rounded-xl p-4 border border-gray-200 shadow-sm">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center">
                 
                  Recipient Name
                </label>
                <input
                  type="text"
                  value={settings.shippingAddress.recipientName}
                  onChange={(e) => updateShippingAddress({ recipientName: e.target.value })}
                  className="bg-white w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-santa-500 focus:border-santa-500 text-lg font-medium transition-all duration-200"
                  placeholder="The Smith Family"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center">
                 
                  Street Address
                </label>
                <input
                  type="text"
                  value={settings.shippingAddress.street}
                  onChange={(e) => updateShippingAddress({ street: e.target.value })}
                  className="bg-white w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-santa-500 focus:border-santa-500 text-lg font-medium transition-all duration-200"
                  placeholder="123 Christmas Lane"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center">
                 
                  Apartment/Unit (Optional)
                </label>
                <input
                  type="text"
                  value={settings.shippingAddress.apartment || ""}
                  onChange={(e) => updateShippingAddress({ apartment: e.target.value })}
                  className="bg-white w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-santa-500 focus:border-santa-500 text-lg font-medium transition-all duration-200"
                  placeholder="Apt 2B"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center">
                    
                    City
                  </label>
                  <input
                    type="text"
                    value={settings.shippingAddress.city}
                    onChange={(e) => updateShippingAddress({ city: e.target.value })}
                    className="bg-white w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-santa-500 focus:border-santa-500 text-lg font-medium transition-all duration-200"
                    placeholder="North Pole"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center">
                   
                    State
                  </label>
                  <input
                    type="text"
                    value={settings.shippingAddress.state}
                    onChange={(e) => updateShippingAddress({ state: e.target.value })}
                    className="bg-white w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-santa-500 focus:border-santa-500 text-lg font-medium transition-all duration-200"
                    placeholder="AK"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center">
                 
                  ZIP Code
                </label>
                <input
                  type="text"
                  value={settings.shippingAddress.zipCode}
                  onChange={(e) => updateShippingAddress({ zipCode: e.target.value })}
                  className="bg-white w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-santa-500 focus:border-santa-500 text-lg font-medium transition-all duration-200"
                  placeholder="00001"
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center rounded-2xl p-6">
              <div className="text-6xl mb-4">💳</div>
              <h3 className="text-2xl font-paytone-one text-evergreen-600 mb-2">Payment & Notifications</h3>
              <p className="text-gray-700 font-medium">Finalize payment method and notification preferences</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
                  
                  Payment Method
                </h4>
                {settings.hasPaymentMethod ? (
                  <div className="flex items-center text-green-600 bg-green-50 rounded-lg p-4 border border-green-200">
                    <FaCheck className="mr-3 text-xl" />
                    <div>
                      <span className="font-medium">Payment method ending in {settings.paymentMethodLast4}</span>
                      <p className="text-sm text-green-700">Ready for Christmas magic! 🎄</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                    <div className="flex items-center text-amber-700 mb-3">
                      <span className="text-2xl mr-3">⚠️</span>
                      <span className="font-medium">No payment method on file</span>
                    </div>
                    <Button 
                      onClick={handleAddPaymentMethod}
                      disabled={addingPayment}
                      className="bg-gradient-to-r from-blueberry-500 to-blueberry-600 hover:from-blueberry-600 hover:to-blueberry-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105"
                    >
                      {addingPayment ? (
                        <>
                          <FaSpinner className="mr-2 animate-spin" />
                          🎄 Setting up Christmas payments...
                        </>
                      ) : (
                        <>
                          <span className="mr-2">🔐</span>
                          Add Payment Method
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">🔔</span>
                  Notification Preferences
                </h4>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      id="reminderEmails"
                      checked={settings.reminderEmails}
                      onChange={(e) => updateSettings({ reminderEmails: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-evergreen-600 focus:ring-evergreen-500"
                    />
                    <label htmlFor="reminderEmails" className="text-sm font-medium text-gray-700 flex items-center">
                     
                      Important deadline reminders
                    </label>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      id="weeklyBudgetUpdates"
                      checked={settings.weeklyBudgetUpdates}
                      onChange={(e) => updateSettings({ weeklyBudgetUpdates: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-evergreen-600 focus:ring-evergreen-500"
                    />
                    <label htmlFor="weeklyBudgetUpdates" className="text-sm font-medium text-gray-700 flex items-center">
                     
                      Weekly budget and spending updates
                    </label>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      id="listLockReminders"
                      checked={settings.listLockReminders}
                      onChange={(e) => updateSettings({ listLockReminders: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-evergreen-600 focus:ring-evergreen-500"
                    />
                    <label htmlFor="listLockReminders" className="text-sm font-medium text-gray-700 flex items-center">
                      
                      Christmas list lock date reminders
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-santa-50 rounded-xl p-6 border-2 border-green-200">
                <h4 className="font-bold text-lg text-green-800 mb-4 flex items-center">
                  
                  Setup Summary
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ul className="text-sm text-green-700 space-y-2">
                    <li className="flex items-center">
                      <span className="mr-2">💰</span>
                      Monthly budget: <strong className="ml-1">${settings.monthlyBudgetGoal}</strong>
                    </li>
                    <li className="flex items-center">
                      <span className="mr-2">🔒</span>
                      List locks: <strong className="ml-1">{new Date(settings.listLockDate).toLocaleDateString()}</strong>
                    </li>
                    <li className="flex items-center">
                      <span className="mr-2">💳</span>
                      Final payment: <strong className="ml-1">{new Date(settings.finalPaymentDate).toLocaleDateString()}</strong>
                    </li>
                  </ul>
                  <ul className="text-sm text-green-700 space-y-2">
                    <li className="flex items-center">
                      <span className="mr-2">👫</span>
                      Friend gifts: <strong className="ml-1">{settings.allowFriendGifts ? 'Enabled' : 'Disabled'}</strong>
                    </li>
                    <li className="flex items-center">
                      <span className="mr-2">🏠</span>
                      Shipping to: <strong className="ml-1">{settings.shippingAddress.city}, {settings.shippingAddress.state}</strong>
                    </li>
                    <li className="flex items-center">
                      <span className="mr-2">🎄</span>
                      Ready for Christmas magic!
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center p-20 z-50 ">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-santa shadow-2xl">
        <div className="p-6 bg-white backdrop-blur-sm rounded-lg">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-3xl font-paytone-one bg-gradient-to-r from-santa-600 to-evergreen-600 bg-clip-text text-transparent">
                Christmas Setup Wizard
              </h2>
              <p className="text-gray-700 font-medium">
                Step {currentStep} of {totalSteps}: Get ready for the perfect Christmas! 
              </p>
            </div>
            <Button
              onClick={onClose}
              className="bg-santa hover:cursor-pointer text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110"
            >
              <FaTimes className="text-lg" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-4">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div
                  key={i + 1}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 transform ${
                    i + 1 <= currentStep
                      ? "bg-frostyBlue text-white shadow-lg scale-110"
                      : "bg-gray-200 text-gray-500 hover:bg-gray-300"
                  }`}
                >
                  {i + 1 < currentStep ? <FaCheck className="text-lg" /> : i + 1}
                </div>
              ))}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
              <div
                className="bg-mint h-3 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-s text-gray-600 font-medium">
              <span>Budget</span>
              <span>Timeline</span>
              <span>Gifts</span>
              <span>Shipping</span>
              <span>Payment</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-santa  rounded-xl p-4 mb-6 shadow-lg">
              <div className="flex items-center">
                <span className="text-2xl mr-3">🎅</span>
                <p className="text-white text-sm font-medium">Ho ho ho! {error}</p>
              </div>
            </div>
          )}

          {/* Step Content */}
          <div className="mb-8">
            {renderStepContent()}
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-6 border-t border-gray-200">
            <Button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="bg-frostyBlue hover:bg-blueberry  hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 disabled:transform-none"
            >
              ⬅ Back
            </Button>
            
            <div className="flex gap-3">
              {currentStep < totalSteps ? (
                <Button
                  onClick={handleNext}
                  className="bg-mint hover:bg-mint text-white px-8 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  Next ➡
                </Button>
              ) : (
                <Button
                  onClick={handleFinish}
                  disabled={loading}
                  className="bg-mint text-white px-8 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-70 disabled:transform-none"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="mr-2 animate-spin" />
                      🎁 Saving Christmas Magic...
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