import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { isMobileDevice } from "@/lib/mobile-utils";
import Link from "next/link";
import { dbConnect } from "@/lib/db";
import { Parent } from "@/models/Parent";
import { Types } from "mongoose";
import WalletTopup from "@/components/parents/WalletTopup";
import MobilePresentRequest from "@/app/(routes)/mobile/settings/MobilePresentRequest";

export default async function MobileSettingsPage() {
  const session = await auth();
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "";

  // Check if user is on a mobile device
  const isMobile = isMobileDevice(userAgent);

  // If not on mobile, redirect to home page
  if (!isMobile) {
    redirect("/");
  }

  // If not authenticated, redirect to mobile sign-in
  if (!session?.user?.id) {
    redirect("/mobile");
  }

  // Fetch parent data
  await dbConnect();
  const parent = await Parent.findOne({ userId: new Types.ObjectId(session.user.id) }).lean();
  
  if (!parent) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-santa to-berryPink p-6 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md">
          <p className="text-center text-gray-700">
            No parent profile found. Please complete onboarding first.
          </p>
          <Link 
            href="/onboarding"
            className="mt-4 block text-center text-blueberry hover:underline"
          >
            Go to Onboarding →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-santa to-berryPink p-4 pb-20">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
          <h1 className="text-2xl sm:text-3xl font-paytone-one text-evergreen mb-2 text-center">
            ⚙️ Settings & Wallet
          </h1>
          
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Welcome, <span className="font-semibold">{session.user.name || session.user.email}</span>
            </p>
          </div>
        </div>

        {/* Wallet Top-Up Section */}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
          <h2 className="text-xl font-paytone-one text-santa mb-4">
            💰 Wallet Top-Up
          </h2>
          <WalletTopup currentBalance={parent.walletBalanceCents || 0} />
        </div>

        {/* Present Request Section */}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
          <h2 className="text-xl font-paytone-one text-evergreen mb-2">
            📸 Request Present on the Go
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Spotted something perfect in a store? Take a picture and request it!
          </p>
          <MobilePresentRequest parentId={String(parent._id)} />
        </div>

        {/* Navigation Links */}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
          <h2 className="text-xl font-paytone-one text-blueberry mb-4">
            🔗 Quick Links
          </h2>
          <div className="space-y-3">
            <Link
              href="/mobile/vote"
              className="block w-full bg-santa text-white text-center py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors"
            >
              ← Back to Vote Page
            </Link>
            <Link
              href="/parent/dashboard"
              className="block w-full bg-evergreen text-white text-center py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
            >
              View Full Dashboard →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
