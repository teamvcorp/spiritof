// app/parent/dashboard/PinSetupModal.tsx
"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import { setPin } from "./actions";

export default function PinSetupModal({ parentId }: { parentId: string }) {
  const [pin, setPinState] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    if (pin !== confirm) {
      setErr("PINs do not match.");
      return;
    }

    start(async () => {
      const res = await setPin(parentId, pin);
      if (!res.ok) {
        setErr(res.error ?? "Failed to set PIN.");
        return;
      }
      // Refresh to pass the gate and render dashboard
      window.location.reload();
    });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold">Create your Parent PIN</h2>
        <p className="mt-1 text-sm text-gray-600">
          Set a 4–8 digit numeric PIN to protect your dashboard.
        </p>

        <form onSubmit={onSubmit} className="mt-4 space-y-3">
          <input
            type="password"
            inputMode="numeric"
            pattern="\d*"
            maxLength={8}
            placeholder="Enter PIN"
            className="w-full rounded-lg border px-3 py-2"
            value={pin}
            onChange={(e) => setPinState(e.target.value)}
            autoFocus
          />
          <input
            type="password"
            inputMode="numeric"
            pattern="\d*"
            maxLength={8}
            placeholder="Confirm PIN"
            className="w-full rounded-lg border px-3 py-2"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {pending ? "Saving..." : "Save PIN"}
          </button>
        </form>
      </div>
    </div>
  );
}
