"use client";

import { useRouter } from "next/navigation";

export function SkipButton() {
  const router = useRouter();

  const handleSkip = async () => {
    try {
      const response = await fetch('/api/onboarding/skip', {
        method: 'POST',
      });
      
      if (response.ok) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error skipping onboarding:', error);
    }
  };

  return (
    <button 
      type="button" 
      onClick={handleSkip}
      className="text-sm underline"
    >
      Skip (I&apos;m not a parent)
    </button>
  );
}