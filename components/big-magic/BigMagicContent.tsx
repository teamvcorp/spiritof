"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, Cards } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SponsorBanner } from "@/components/big-magic/SponsorBanner";

export function BigMagicContent() {
  const searchParams = useSearchParams();
  const donationStatus = searchParams.get("donation");
  const donationAmount = searchParams.get("amount");
  const donationCompany = searchParams.get("company");
  
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "check" | "ach">("card");
  const [loading, setLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showCancelledMessage, setShowCancelledMessage] = useState(false);

  // Check for success/cancelled status on mount
  useEffect(() => {
    if (donationStatus === "success") {
      setShowSuccessMessage(true);
      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (donationStatus === "cancelled") {
      setShowCancelledMessage(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [donationStatus]);

  const suggestedAmounts = [250, 500, 1000, 2500, 5000, 10000];

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Logo must be under 2MB');
      return;
    }

    setLogoUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/big-magic/upload-logo', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok && data.url) {
        setLogoUrl(data.url);
      } else {
        throw new Error(data.error || 'Failed to upload logo');
      }
    } catch (error: any) {
      console.error('Logo upload error:', error);
      alert(`Failed to upload logo: ${error.message}`);
    } finally {
      setLogoUploading(false);
    }
  };

  const handleDonation = async () => {
    const amount = selectedAmount || parseInt(customAmount);
    
    if (!amount || amount < 100) {
      alert("Minimum donation is $100");
      return;
    }

    if (!companyName || !companyEmail) {
      alert("Please provide your company name and email");
      return;
    }

    setLoading(true);

    try {
      if (paymentMethod === "card" || paymentMethod === "ach") {
        // Create Stripe checkout session for card or ACH
        const response = await fetch("/api/big-magic/create-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: amount * 100, // Convert to cents
            companyName,
            companyEmail,
            paymentMethod,
            logoUrl: logoUrl || undefined,
          }),
        });

        const data = await response.json();
        
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        } else {
          throw new Error(data.error || "Failed to create checkout session");
        }
      } else {
        // Show payment instructions
        const response = await fetch("/api/big-magic/request-invoice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount,
            companyName,
            companyEmail,
            paymentMethod,
            logoUrl: logoUrl || undefined,
          }),
        });

        const data = await response.json();
        
        if (response.ok && data.success) {
          alert(`Thank you! Payment instructions have been sent to ${companyEmail}`);
          // Reset form
          setSelectedAmount(null);
          setCustomAmount("");
          setCompanyName("");
          setCompanyEmail("");
        } else {
          console.error("Check request failed:", data);
          throw new Error(data.error || "Failed to send payment instructions");
        }
      }
    } catch (error: any) {
      console.error("Donation error:", error);
      const errorMessage = error.message || "Failed to process donation. Please try again or contact us directly.";
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-12">
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="mb-8 bg-gradient-to-r from-evergreen to-santa text-white rounded-2xl shadow-2xl p-8 text-center animate-fade-in">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-4xl font-bold mb-4">Thank You{donationCompany ? `, ${donationCompany}` : ""}!</h2>
          <p className="text-xl mb-4">
            Your generous donation of <strong>${donationAmount ? parseFloat(donationAmount).toLocaleString() : "..."}</strong> has been received successfully!
          </p>
          <div className="bg-white/20 rounded-lg p-6 mb-4 backdrop-blur-sm">
            <p className="text-lg mb-2">
              🌟 Your contribution will help match children's good deeds<br/>
              🎅 Fund face-to-face Santa community programs<br/>
              🎁 Support hardworking families in need
            </p>
          </div>
          <p className="text-sm">
            You'll receive a tax-deductible receipt via email shortly.<br/>
            Your company will be added to our sponsor recognition program.
          </p>
          <button
            onClick={() => {
              setShowSuccessMessage(false);
              window.history.replaceState({}, '', '/big-magic');
            }}
            className="mt-6 bg-white text-evergreen px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      )}

      {/* Cancelled Message */}
      {showCancelledMessage && (
        <div className="mb-8 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">😔</div>
          <h2 className="text-3xl font-bold mb-4">Payment Cancelled</h2>
          <p className="text-lg mb-4">
            Your payment was cancelled. No charges were made to your account.
          </p>
          <p className="text-base mb-6">
            If you experienced any issues or have questions, please don't hesitate to contact us at{" "}
            <a href="mailto:partnerships@spiritofsanta.com" className="underline font-semibold">
              partnerships@spiritofsanta.com
            </a>
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                setShowCancelledMessage(false);
                window.history.replaceState({}, '', '/big-magic');
              }}
              className="bg-white text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => {
                setShowCancelledMessage(false);
                window.history.replaceState({}, '', '/big-magic');
              }}
              className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-5xl sm:text-6xl font-bold text-evergreen mb-4">
          ✨ Big Magic ✨
        </h1>
        <p className="text-2xl text-santa font-semibold mb-2">
          Corporate Giving That Creates Real Magic
        </p>
        <p className="text-lg text-gray-700 max-w-3xl mx-auto">
          Your company's contribution directly supports children's dreams, community programs, 
          and families working hard to create Christmas magic.
        </p>
      </div>

      {/* Sponsor Banner */}
      <div className="mb-12">
        <SponsorBanner />
      </div>

      {/* How It Works Section */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-center text-evergreen mb-8">
          How Your Donation Creates Magic
        </h2>
        
        <Cards gap="lg">
          <Card className="bg-gradient-to-br from-blueberry/10 to-blueberry/5">
            <div className="text-center">
              <div className="text-5xl mb-4">🌟</div>
              <h3 className="text-xl font-bold text-evergreen mb-3">
                Match Children's Good Deeds
              </h3>
              <p className="text-gray-700">
                We match the magic points earned by children doing good deeds in their neighborhoods. 
                Your donation helps reward kids for spreading kindness and helping others.
              </p>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-santa/10 to-berryPink/10">
            <div className="text-center">
              <div className="text-5xl mb-4">🎅</div>
              <h3 className="text-xl font-bold text-evergreen mb-3">
                Support Community Programs
              </h3>
              <p className="text-gray-700">
                Fund face-to-face interactions with Spirit of Santa and community events that 
                bring the magic of Christmas to life for children and families.
              </p>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-evergreen/10 to-evergreen/5">
            <div className="text-center">
              <div className="text-5xl mb-4">🎁</div>
              <h3 className="text-xl font-bold text-evergreen mb-3">
                Help Hardworking Families
              </h3>
              <p className="text-gray-700">
                Support parents who are trying their best but don't earn enough magic points. 
                Your contribution ensures every child experiences Christmas joy.
              </p>
            </div>
          </Card>
        </Cards>
      </div>

      {/* Donation Form */}
      <Card className="max-w-3xl mx-auto bg-white shadow-lg">
        <h2 className="text-3xl font-bold text-evergreen mb-6 text-center">
          Make Your Corporate Donation
        </h2>

        {/* Company Information */}
        <div className="mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name *
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-santa focus:border-transparent"
              placeholder="Your Company Name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Email *
            </label>
            <input
              type="email"
              value={companyEmail}
              onChange={(e) => setCompanyEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-santa focus:border-transparent"
              placeholder="contact@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Logo (Optional)
            </label>
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={logoUploading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-santa focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-santa file:text-white hover:file:bg-santa/90"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Upload your company logo for sponsor recognition (max 2MB, PNG/JPG)
                </p>
              </div>
              {logoUrl && (
                <div className="flex-shrink-0">
                  <img
                    src={logoUrl}
                    alt="Company logo preview"
                    className="w-24 h-24 object-contain border-2 border-gray-200 rounded-lg bg-white p-2"
                  />
                  <button
                    onClick={() => setLogoUrl("")}
                    className="text-xs text-santa hover:underline mt-1 block text-center w-full"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
            {logoUploading && (
              <p className="text-sm text-santa mt-2">Uploading logo...</p>
            )}
          </div>
        </div>

        {/* Suggested Amounts */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Donation Amount
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {suggestedAmounts.map((amount) => (
              <button
                key={amount}
                onClick={() => {
                  setSelectedAmount(amount);
                  setCustomAmount("");
                }}
                className={`py-3 px-4 rounded-lg border-2 font-semibold transition-all ${
                  selectedAmount === amount
                    ? "border-santa bg-santa text-white"
                    : "border-gray-300 hover:border-santa hover:bg-santa/5"
                }`}
              >
                ${amount.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Amount */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Or Enter Custom Amount
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">
              $
            </span>
            <input
              type="number"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                setSelectedAmount(null);
              }}
              className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-santa focus:border-transparent"
              placeholder="Enter amount"
              min="100"
            />
          </div>
          <p className="text-sm text-gray-500 mt-1">Minimum donation: $100</p>
        </div>

        {/* Payment Method */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Payment Method
          </label>
          <div className="space-y-2">
            <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="paymentMethod"
                value="card"
                checked={paymentMethod === "card"}
                onChange={(e) => setPaymentMethod(e.target.value as "card")}
                className="mr-3"
              />
              <div>
                <div className="font-medium">Credit/Debit Card</div>
                <div className="text-sm text-gray-500">Best for donations under $1,000</div>
              </div>
            </label>

            <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="paymentMethod"
                value="check"
                checked={paymentMethod === "check"}
                onChange={(e) => setPaymentMethod(e.target.value as "check")}
                className="mr-3"
              />
              <div className="flex-1">
                <div className="font-medium">Check / Money Order</div>
                <div className="text-sm text-gray-500 mb-1">We'll send you mailing instructions</div>
                <div className="text-xs bg-blue-50 text-blue-800 p-2 rounded mt-2">
                  <strong>Make payable to:</strong> The Von Der Becke Academy Corp<br/>
                  <strong>Tax ID:</strong> 46-1005883 (501(c)(3))
                </div>
              </div>
            </label>

            <label className="flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="paymentMethod"
                value="ach"
                checked={paymentMethod === "ach"}
                onChange={(e) => setPaymentMethod(e.target.value as "ach")}
                className="mr-3"
              />
              <div>
                <div className="font-medium">ACH Bank Transfer (US Only)</div>
                <div className="text-sm text-gray-500">Secure bank transfer via Stripe - ideal for $1,000+</div>
              </div>
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleDonation}
          disabled={loading || (!selectedAmount && !customAmount)}
          className="w-full max-w-full py-4 text-lg font-bold bg-santa text-white hover:bg-santa/90 shadow-lg"
        >
          {loading ? (
            "Processing..."
          ) : paymentMethod === "check" ? (
            "Request Check Payment Instructions"
          ) : (
            `Continue to Secure Payment - $${(selectedAmount || parseInt(customAmount) || 0).toLocaleString()}`
          )}
        </Button>

        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900 text-center">
            <strong>Tax-Deductible Donation</strong><br/>
            All donations are tax-deductible. The Von Der Becke Academy Corp is a registered 501(c)(3) nonprofit organization (Tax ID: 46-1005883).
            You'll receive an official receipt via email.
          </p>
        </div>
      </Card>

      {/* Impact Section */}
      <div className="mt-12 text-center">
        <h2 className="text-3xl font-bold text-evergreen mb-4">
          Your Impact
        </h2>
        <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="p-6">
            <div className="text-4xl font-bold text-santa mb-2">$250</div>
            <p className="text-gray-700">Matches 250 good deeds by children</p>
          </div>
          <div className="p-6">
            <div className="text-4xl font-bold text-santa mb-2">$1,000</div>
            <p className="text-gray-700">Funds a community Santa event</p>
          </div>
          <div className="p-6">
            <div className="text-4xl font-bold text-santa mb-2">$5,000</div>
            <p className="text-gray-700">Supports 20+ families in need</p>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="mt-12 text-center bg-evergreen/5 rounded-2xl p-8 max-w-2xl mx-auto">
        <h3 className="text-2xl font-bold text-evergreen mb-3">
          Questions About Corporate Giving?
        </h3>
        <p className="text-gray-700 mb-4">
          We'd love to discuss custom sponsorship opportunities and partnership packages.
        </p>
        <a 
          href="mailto:admin@thevacorp.com" 
          className="text-santa font-semibold hover:underline"
        >
          admin@thevacorp.com
        </a>
      </div>
    </Container>
  );
}
