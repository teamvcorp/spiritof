"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

export default function SetAdminPage() {
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const setAdminStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/debug/set-admin", {
        method: "POST",
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setStatus(`✅ Success: ${data.message} for ${data.email}`);
      } else {
        setStatus(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setStatus(`❌ Network error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-green-50 p-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          Set Admin Status
        </h1>
        
        <p className="text-gray-600 mb-6">
          Click the button below to set your current user as an admin.
          This will allow you to access the ToyRequestViewer in the catalog-builder.
        </p>
        
        <Button 
          onClick={setAdminStatus}
          disabled={loading}
          className="w-full mb-4"
        >
          {loading ? "Setting Admin..." : "Make Me Admin"}
        </Button>
        
        {status && (
          <div className="p-3 rounded bg-gray-100 text-sm">
            {status}
          </div>
        )}
        
        <div className="mt-6 text-sm text-gray-500">
          <p><strong>Next steps after becoming admin:</strong></p>
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>Refresh your session (reload page)</li>
            <li>Go to /admin/catalog-builder</li>
            <li>The ToyRequestViewer should now work</li>
          </ol>
        </div>
      </div>
    </div>
  );
}