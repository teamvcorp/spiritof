"use client";

import { useEffect } from "react";

interface PaymentDebugProps {
  searchParams?: any;
}

export default function PaymentDebug({ searchParams }: PaymentDebugProps) {
  useEffect(() => {
    console.log("=== PAYMENT DEBUG ===");
    console.log("searchParams:", searchParams);
    console.log("window.location.search:", typeof window !== 'undefined' ? window.location.search : 'SSR');
    console.log("window.location.href:", typeof window !== 'undefined' ? window.location.href : 'SSR');
    
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      console.log("payment param:", urlParams.get('payment'));
      console.log("session_id param:", urlParams.get('session_id'));
    }
    console.log("=== END DEBUG ===");
  }, [searchParams]);

  return (
    <div className="p-4 bg-yellow-100 border border-yellow-400 rounded">
      <h3 className="font-bold">Payment Debug Info</h3>
      <p>Check console for details</p>
      <p>SearchParams: {JSON.stringify(searchParams)}</p>
    </div>
  );
}