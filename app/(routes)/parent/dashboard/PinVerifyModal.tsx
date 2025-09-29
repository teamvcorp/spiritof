// app/parent/dashboard/PinVerifyModal.tsx
"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import { verifyPin } from "./actions";

export default function PinVerifyModal({ parentId }: { parentId: string }) {
  const [pin, setPinState] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    start(async () => {
      const res = await verifyPin(parentId, pin);
      if (!res.ok) {
        setErr(res.error ?? "Verification failed.");
        return;
      }
      window.location.reload();
    });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold">Enter PIN</h2>
        <p className="mt-1 text-sm text-gray-600">
          This dashboard is protected. Please verify your 4–8 digit PIN.
        </p>

        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <input
            type="password"
            inputMode="numeric"
            pattern="\d*"
            maxLength={8}
            placeholder="PIN"
            className="w-full rounded-lg border px-3 py-2"
            value={pin}
            onChange={(e) => setPinState(e.target.value)}
            autoFocus
          />
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {pending ? "Verifying..." : "Verify"}
          </button>
        </form>
      </div>
    </div>
  );
}
