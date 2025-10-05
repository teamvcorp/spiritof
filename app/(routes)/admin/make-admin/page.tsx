"use client";

import { useState } from "react";

export default function MakeAdminPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const makeAdmin = async () => {
    if (!email) {
      alert("Please enter an email");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/make-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: "Network error: " + (error instanceof Error ? error.message : "Unknown") });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Make User Admin</h1>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="user@example.com"
          />
        </div>

        <button
          onClick={makeAdmin}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Processing..." : "Make Admin"}
        </button>

        {result && (
          <div className={`mt-4 p-4 rounded-md ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {result.success ? (
              <div>
                <p className="font-medium">✅ Success!</p>
                <p>{result.message}</p>
                <p className="text-sm mt-2">
                  <strong>Next step:</strong> Do a full page refresh (Ctrl+F5) or{' '}
                  <button 
                    onClick={() => window.location.reload()} 
                    className="underline hover:no-underline"
                  >
                    click here to refresh
                  </button>
                  {' '}to update your session.
                </p>
              </div>
            ) : (
              <div>
                <p className="font-medium">❌ Error</p>
                <p>{result.error}</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 text-sm text-gray-600">
          <p className="font-medium">Instructions:</p>
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>Enter the email of the user you want to make admin</li>
            <li>Click "Make Admin" to update their admin status</li>
            <li>The user must already exist in the database</li>
            <li>After success, they can access /admin/debug routes</li>
          </ol>
        </div>
      </div>
    </div>
  );
}