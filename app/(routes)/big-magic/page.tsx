import { Suspense } from "react";
import { BigMagicContent } from "@/components/big-magic/BigMagicContent";

export const metadata = {
  title: "Big Magic - Corporate Giving | Spirit of Santa",
  description: "Make a corporate donation to support children's Christmas dreams and community programs. Your contribution creates magic for families in need.",
};

export default function BigMagicPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-evergreen/10 to-white">
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
        <BigMagicContent />
      </Suspense>
    </main>
  );
}
