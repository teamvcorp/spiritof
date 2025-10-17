// components/Providers.client.tsx
"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";
import { SnowProvider } from "./effects/SnowControls";
import PageTransitionSnow from "./effects/PageTransitionSnow";
import { ToastProvider } from "./ui/Toast";

export default function Providers({ children }: { children: React.ReactNode }) {
  // You can pass a session prop here if you hydrate server session into the client:
  // <SessionProvider session={pageProps.session}>{children}</SessionProvider>
  return (
    <SessionProvider>
      <ToastProvider>
        <SnowProvider>
          <PageTransitionSnow enabled={true}>
            {children}
          </PageTransitionSnow>
        </SnowProvider>
      </ToastProvider>
    </SessionProvider>
  );
}
