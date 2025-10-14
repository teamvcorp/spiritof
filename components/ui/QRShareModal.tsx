"use client";

import { useState, useEffect } from "react";
import { X, Download, Printer, Mail, Eye, Copy, Check } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Image from "next/image";

interface QRShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  childName: string;
  childId: string;
  shareUrl: string;
  qrCodeDataURL?: string;
}

export default function QRShareModal({ 
  isOpen, 
  onClose, 
  childName, 
  childId, 
  shareUrl,
  qrCodeDataURL 
}: QRShareModalProps) {
  const [activeTab, setActiveTab] = useState<"view" | "email">("view");
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(qrCodeDataURL || null);
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  
  // Email form state
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [emailMessage, setEmailMessage] = useState("");

  // Auto-generate QR code when modal opens
  useEffect(() => {
    if (!isOpen || qrCode || isGeneratingQR) return;
    
    const generateQR = async () => {
      setIsGeneratingQR(true);
      setQrError(null);
      try {
        const response = await fetch("/api/qrcode/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ childId, size: 300 }),
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.qrCodeDataURL) {
            setQrCode(data.data.qrCodeDataURL);
          } else {
            setQrError("Invalid QR code response format");
          }
        } else {
          const errorData = await response.json();
          setQrError(errorData.error || "Failed to generate QR code");
        }
      } catch (error) {
        setQrError("Network error while generating QR code");
        console.error("QR generation error:", error);
      } finally {
        setIsGeneratingQR(false);
      }
    };
    
    generateQR();
  }, [isOpen, qrCode, isGeneratingQR, childId]);

  if (!isOpen) return null;

  const generateQRCode = async () => {
    if (qrCode) return; // Already have QR code
    
    setIsGeneratingQR(true);
    setQrError(null);
    try {
      const response = await fetch("/api/qrcode/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId, size: 300 }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.qrCodeDataURL) {
          setQrCode(data.data.qrCodeDataURL);
        } else {
          setQrError("Invalid QR code response format");
        }
      } else {
        const errorData = await response.json();
        setQrError(errorData.error || "Failed to generate QR code");
        console.error("QR generation error:", errorData);
      }
    } catch (error) {
      setQrError("Network error while generating QR code");
      console.error("QR generation error:", error);
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const handlePrint = () => {
    if (!qrCode) return;
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>QR Code - ${childName}</title>
        <style>
          body { 
            margin: 0; 
            padding: 40px; 
            font-family: Arial, sans-serif; 
            text-align: center; 
          }
          .qr-container { 
            max-width: 400px; 
            margin: 0 auto; 
            border: 2px solid #0F4A3C;
            padding: 30px;
            border-radius: 10px;
          }
          h1 { 
            color: #EA1938; 
            margin-bottom: 20px; 
            font-size: 24px;
          }
          .qr-code { 
            margin: 20px 0; 
          }
          .url { 
            font-size: 14px; 
            color: #666; 
            word-break: break-all;
            margin-top: 20px;
          }
          .instructions {
            margin-top: 30px;
            font-size: 16px;
            color: #333;
          }
          @media print {
            body { padding: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="qr-container">
          <h1>🎅 Help ${childName} Earn Christmas Magic! 🎁</h1>
          <div class="qr-code">
            <img src="${qrCode}" alt="QR Code for ${childName}" style="max-width: 300px; height: auto;">
          </div>
          <div class="instructions">
            <p><strong>Scan this QR code to visit ${childName}'s Christmas magic page!</strong></p>
            <p>Every dollar donated = 1 Christmas magic point ⭐</p>
          </div>
          <div class="url">
            ${shareUrl}
          </div>
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const handleDownload = () => {
    if (!qrCode) return;
    
    const link = document.createElement("a");
    link.download = `${childName}-qr-code.png`;
    link.href = qrCode;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy URL:", error);
    }
  };

  const handleSendEmail = async () => {
    if (!recipientEmail || !recipientName) return;
    
    setIsEmailSending(true);
    try {
      const response = await fetch("/api/qrcode/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId,
          recipientEmail,
          recipientName,
          message: emailMessage,
        }),
      });
      
      if (response.ok) {
        setEmailSent(true);
        setRecipientEmail("");
        setRecipientName("");
        setEmailMessage("");
      } else {
        console.error("Failed to send email");
      }
    } catch (error) {
      console.error("Email sending error:", error);
    } finally {
      setIsEmailSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[200]">
      <Card className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto relative z-[201]">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-paytone-one text-santa">
              Share {childName}&apos;s Christmas Magic
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("view")}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                activeTab === "view"
                  ? "bg-white text-santa shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <Eye className="w-4 h-4 inline mr-2" />
              View & Share
            </button>
            <button
              onClick={() => setActiveTab("email")}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                activeTab === "email"
                  ? "bg-white text-santa shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <Mail className="w-4 h-4 inline mr-2" />
              Send Email
            </button>
          </div>

          {/* View Tab */}
          {activeTab === "view" && (
            <div className="space-y-6">
              {/* QR Code Display */}
              <div className="text-center">
                {qrError ? (
                  <div className="border-2 border-red-300 bg-red-50 rounded-lg p-8">
                    <div className="text-red-600 mb-4">
                      <p className="font-medium">QR Code Generation Failed</p>
                      <p className="text-sm">{qrError}</p>
                    </div>
                    <Button
                      onClick={generateQRCode}
                      disabled={isGeneratingQR}
                      className="bg-santa hover:bg-santa/90"
                    >
                      {isGeneratingQR ? "Generating..." : "Try Again"}
                    </Button>
                  </div>
                ) : !qrCode ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                    <Button
                      onClick={generateQRCode}
                      disabled={isGeneratingQR}
                      className="bg-santa hover:bg-santa/90"
                    >
                      {isGeneratingQR ? "Generating..." : "Generate QR Code"}
                    </Button>
                  </div>
                ) : (
                  <div className="bg-white border-2 border-evergreen rounded-lg p-6 inline-block">
                    <Image
                      src={qrCode}
                      alt={`QR Code for ${childName}`}
                      width={300}
                      height={300}
                      className="max-w-[300px] h-auto"
                    />
                  </div>
                )}
              </div>

              {/* Share URL */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Share Link:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-mono bg-gray-50"
                  />
                  <Button
                    onClick={copyToClipboard}
                    className="px-3 border border-gray-300 hover:bg-gray-50 bg-white max-w-none"
                  >
                    {urlCopied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              {qrCode && (
                <div className="flex flex-wrap gap-3 justify-center">
                  <Button
                    onClick={handleDownload}
                    className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 bg-white max-w-none"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                  <Button
                    onClick={handlePrint}
                    className="flex items-center gap-2 border border-gray-300 hover:bg-gray-50 bg-white max-w-none"
                  >
                    <Printer className="w-4 h-4" />
                    Print
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Email Tab */}
          {activeTab === "email" && (
            <div className="space-y-4">
              {emailSent ? (
                <div className="text-center py-8">
                  <div className="text-green-600 text-6xl mb-4">✓</div>
                  <h3 className="text-xl font-paytone-one text-evergreen mb-2">
                    Email Sent Successfully!
                  </h3>
                  <p className="text-gray-600">
                    The QR code has been sent to the recipient.
                  </p>
                  <Button
                    onClick={() => setEmailSent(false)}
                    className="mt-4 border border-gray-300 hover:bg-gray-50 bg-white max-w-none"
                  >
                    Send Another Email
                  </Button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Recipient Email *
                    </label>
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="friend@example.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-santa focus:border-santa"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Recipient Name *
                    </label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="Friend's Name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-santa focus:border-santa"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Personal Message (Optional)
                    </label>
                    <textarea
                      value={emailMessage}
                      onChange={(e) => setEmailMessage(e.target.value)}
                      placeholder="Add a personal note to your email..."
                      maxLength={500}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-santa focus:border-santa"
                    />
                    <div className="text-right text-xs text-gray-500 mt-1">
                      {emailMessage.length}/500 characters
                    </div>
                  </div>

                  <Button
                    onClick={handleSendEmail}
                    disabled={!recipientEmail || !recipientName || isEmailSending}
                    className="w-full bg-santa hover:bg-santa/90 flex items-center justify-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    {isEmailSending ? "Sending..." : "Send QR Code Email"}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}