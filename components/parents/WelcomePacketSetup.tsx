"use client";

import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';

interface WelcomePacketItem {
  id: string;
  name: string;
  description: string;
  price: number;
  stripeProductId: string;
  emoji: string;
  category: string;
}

const WELCOME_PACKET_ITEMS: WelcomePacketItem[] = [
  {
    id: 'shirt',
    name: 'Christmas Spirit T-Shirt',
    description: 'Festive holiday shirt to spread Christmas cheer all season long',
    price: 25,
    stripeProductId: 'prod_TBOi5CZSNqWyOc',
    emoji: '👕',
    category: 'Apparel'
  },
  {
    id: 'cocoa-mug',
    name: 'Hot Cocoa Mug',
    description: 'Perfect ceramic mug for warming up with hot chocolate and marshmallows',
    price: 10,
    stripeProductId: 'prod_TBOhVuDqGuKh5O',
    emoji: '☕',
    category: 'Drinkware'
  },
  {
    id: 'santa-hat',
    name: 'Santa Hat',
    description: 'Classic red Santa hat with fluffy white trim for the holidays',
    price: 10,
    stripeProductId: 'prod_TBOhZSapyesNMe',
    emoji: '🎅',
    category: 'Accessories'
  },
  {
    id: 'cozy-hoodie',
    name: 'Cozy Holiday Hoodie',
    description: 'Warm and comfortable hoodie perfect for cold winter days',
    price: 35,
    stripeProductId: 'prod_TBOh5AD0HZGcNs',
    emoji: '🧥',
    category: 'Apparel'
  }
];

const ENROLLMENT_FEE = 10; // $10 enrollment fee

type WizardStep = 'welcome' | 'items' | 'review' | 'processing';

interface WelcomePacketSetupProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function WelcomePacketSetup({ onComplete, onCancel }: WelcomePacketSetupProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('welcome');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const toggleItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const calculateTotal = () => {
    const itemsTotal = selectedItems.reduce((total, itemId) => {
      const item = WELCOME_PACKET_ITEMS.find(i => i.id === itemId);
      return total + (item?.price || 0);
    }, 0);
    return ENROLLMENT_FEE + itemsTotal;
  };

  const handleCreateWelcomePacket = async () => {
    setCurrentStep('processing');
    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/parent/welcome-packet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedItems,
          totalAmount: calculateTotal()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create welcome packet order');
      }

      const data = await response.json();
      
      // Redirect to Stripe checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (error) {
      console.error('Error creating welcome packet:', error);
      alert('Failed to process welcome packet order. Please try again.');
      setCurrentStep('review');
    } finally {
      setIsProcessing(false);
    }
  };

  const nextStep = () => {
    if (currentStep === 'welcome') setCurrentStep('items');
    else if (currentStep === 'items') setCurrentStep('review');
    else if (currentStep === 'review') handleCreateWelcomePacket();
  };

  const prevStep = () => {
    if (currentStep === 'items') setCurrentStep('welcome');
    else if (currentStep === 'review') setCurrentStep('items');
  };

  const getStepNumber = (step: WizardStep) => {
    switch (step) {
      case 'welcome': return 1;
      case 'items': return 2;
      case 'review': return 3;
      case 'processing': return 4;
      default: return 1;
    }
  };

  const renderProgressBar = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        {['welcome', 'items', 'review', 'processing'].map((step, index) => {
          const stepNum = index + 1;
          const isActive = getStepNumber(currentStep) === stepNum;
          const isCompleted = getStepNumber(currentStep) > stepNum;
          
          return (
            <div key={step} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                isActive 
                  ? 'bg-santa-500 text-white ring-4 ring-santa-200 scale-110' 
                  : isCompleted 
                    ? 'bg-evergreen-500 text-white' 
                    : 'bg-gray-200 text-gray-600'
              }`}>
                {isCompleted ? '✓' : stepNum}
              </div>
              {index < 3 && (
                <div className={`w-16 h-1 mx-2 transition-all duration-300 ${
                  isCompleted ? 'bg-evergreen-300' : 'bg-gray-200'
                }`} />
              )}
            </div>
          );
        })}
      </div>
      <div className="text-center">
        <div className="text-lg font-semibold text-gray-800">
          {currentStep === 'welcome' && 'Welcome to Your Christmas Journey!'}
          {currentStep === 'items' && 'Choose Your Add-ons'}
          {currentStep === 'review' && 'Review Your Order'}
          {currentStep === 'processing' && 'Processing Your Order'}
        </div>
        <div className="text-sm text-gray-600 mt-1">
          Step {getStepNumber(currentStep)} of 4
        </div>
      </div>
    </div>
  );

  const renderWelcomeStep = () => (
    <div className="text-center space-y-6">
      <div className="text-8xl mb-6">🎁</div>
      <h2 className="text-3xl font-paytone-one text-santa-600 mb-4">
        Welcome to the Magic!
      </h2>
      <div className="max-w-2xl mx-auto space-y-4 text-lg text-gray-700">
        <p>
          Your child is about to embark on a magical Christmas journey! Before we can add them to the platform, 
          we need to send them a special welcome packet in the mail.
        </p>
        <p>
          This includes a personalized welcome letter with their login instructions and how to use the Christmas magic site.
        </p>
      </div>
      
      <Card className="max-w-xl mx-auto bg-gradient-to-r from-santa-50 to-evergreen-50 border-2 border-santa-200">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <h3 className="text-xl font-semibold text-santa-700 mb-2">
                📮 Welcome Letter Package
              </h3>
              <p className="text-gray-600 text-sm">
                • Personalized welcome letter<br/>
                • Login instructions & tutorial<br/>
                • Christmas magic guide<br/>
                • Site navigation help
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-santa-600">${ENROLLMENT_FEE}</div>
              <div className="text-sm text-gray-600">Required</div>
            </div>
          </div>
        </div>
      </Card>

      <div className="bg-blueberry-50 rounded-lg p-4 max-w-xl mx-auto">
        <p className="text-sm text-blueberry-800">
          <span className="font-semibold">📦 Shipping:</span> Your welcome packet will be prepared and mailed within 3-5 business days
        </p>
      </div>
    </div>
  );

  const renderItemsStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-paytone-one text-evergreen-600 mb-2">
          🎄 Make It Extra Special
        </h2>
        <p className="text-gray-600 max-w-xl mx-auto">
          Choose from our festive add-ons to make your child's welcome packet even more magical!
          These are completely optional but add to the Christmas excitement.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {WELCOME_PACKET_ITEMS.map((item) => {
          const isSelected = selectedItems.includes(item.id);
          
          return (
            <Card 
              key={item.id}
              className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                isSelected 
                  ? 'border-evergreen-400 bg-evergreen-50 shadow-lg ring-2 ring-evergreen-200' 
                  : 'border-gray-200 hover:border-evergreen-300'
              }`}
              onClick={() => toggleItem(item.id)}
            >
              <div className="p-6">
                <div className="text-center mb-4">
                  <div className="text-5xl mb-3">{item.emoji}</div>
                  <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-1">
                    {item.category}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {item.name}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="text-2xl font-bold text-evergreen-600">
                    ${item.price}
                  </div>
                  <div className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    isSelected 
                      ? 'bg-evergreen-500 text-white' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {isSelected ? '✓ Added' : 'Add to Order'}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {selectedItems.length > 0 && (
        <div className="text-center">
          <div className="inline-flex items-center px-4 py-2 bg-evergreen-100 rounded-full">
            <span className="text-evergreen-800 font-medium">
              {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
            </span>
          </div>
        </div>
      )}
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-paytone-one text-blueberry-600 mb-2">
          📋 Review Your Order
        </h2>
        <p className="text-gray-600">
          Please review your welcome packet contents before proceeding to checkout
        </p>
      </div>

      <Card className="max-w-2xl mx-auto bg-gradient-to-r from-blueberry-50 to-berryPink-50 border-2 border-blueberry-200">
        <div className="p-6">
          <h3 className="text-xl font-semibold text-blueberry-700 mb-4 flex items-center">
            🛍️ Order Summary
          </h3>
          
          <div className="space-y-3">
            {/* Required Item */}
            <div className="flex justify-between items-center py-2 border-b border-blueberry-100">
              <div className="flex items-center">
                <span className="text-2xl mr-3">📮</span>
                <div>
                  <div className="font-medium text-gray-900">Welcome Letter Package</div>
                  <div className="text-sm text-gray-600">Required • Login instructions & tutorial</div>
                </div>
              </div>
              <div className="font-semibold text-gray-900">${ENROLLMENT_FEE}</div>
            </div>
            
            {/* Selected Add-ons */}
            {selectedItems.map(itemId => {
              const item = WELCOME_PACKET_ITEMS.find(i => i.id === itemId);
              if (!item) return null;
              
              return (
                <div key={itemId} className="flex justify-between items-center py-2">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{item.emoji}</span>
                    <div>
                      <div className="font-medium text-gray-900">{item.name}</div>
                      <div className="text-sm text-gray-600">{item.category}</div>
                    </div>
                  </div>
                  <div className="font-semibold text-gray-900">${item.price}</div>
                </div>
              );
            })}
            
            {selectedItems.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                No add-ons selected
              </div>
            )}
            
            {/* Total */}
            <div className="border-t-2 border-blueberry-200 pt-3 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-blueberry-800">Total</span>
                <span className="text-2xl font-bold text-blueberry-800">${calculateTotal()}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="text-center">
        <div className="bg-emerald-50 rounded-lg p-4 max-w-xl mx-auto mb-4">
          <p className="text-sm text-emerald-800">
            <span className="font-semibold">🚚 Shipping:</span> Your welcome packet will be prepared and mailed within 3-5 business days to the address you provide at checkout.
          </p>
        </div>
        <p className="text-xs text-gray-500">
          You'll be redirected to secure checkout to complete your order
        </p>
      </div>
    </div>
  );

  const renderProcessingStep = () => (
    <div className="text-center space-y-6">
      <div className="text-8xl mb-6">🎁</div>
      <h2 className="text-2xl font-paytone-one text-santa-600 mb-4">
        Processing Your Order...
      </h2>
      <div className="flex items-center justify-center space-x-2">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-santa-600"></div>
        <span className="text-gray-600">Redirecting to secure checkout...</span>
      </div>
    </div>
  );

  return (
    <Container className="max-w-6xl mx-auto p-6 min-h-screen bg-gradient-to-br from-red-50 via-green-50 to-blue-50">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-santa-500 to-evergreen-500 p-6 text-white text-center">
          <h1 className="text-3xl font-paytone-one mb-2">
            🎄 Welcome Packet Setup
          </h1>
          <p className="text-santa-100">
            Let's create something magical for your child!
          </p>
        </div>

        <div className="p-8">
          {renderProgressBar()}

          <div className="min-h-[400px]">
            {currentStep === 'welcome' && renderWelcomeStep()}
            {currentStep === 'items' && renderItemsStep()}
            {currentStep === 'review' && renderReviewStep()}
            {currentStep === 'processing' && renderProcessingStep()}
          </div>

          {currentStep !== 'processing' && (
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              <Button
                onClick={currentStep === 'welcome' ? onCancel : prevStep}
                disabled={isProcessing}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
              >
                {currentStep === 'welcome' ? 'Cancel' : '← Back'}
              </Button>
              
              <Button
                onClick={nextStep}
                disabled={isProcessing}
                className="bg-gradient-to-r from-santa-500 to-santa-600 hover:from-santa-600 hover:to-santa-700 text-white font-semibold px-8"
              >
                {currentStep === 'review' ? (
                  <>🎁 Complete Order - ${calculateTotal()}</>
                ) : (
                  'Continue →'
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}