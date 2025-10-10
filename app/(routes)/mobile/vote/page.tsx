import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { isMobileDevice } from "@/lib/mobile-utils";
import { dbConnect } from "@/lib/db";
import { Parent } from "@/models/Parent";
import { Child } from "@/models/Child";
import { Types } from "mongoose";
import Vote from "@/components/parents/Vote";
import Link from "next/link";

export default async function MobileVotePage() {
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

  // Fetch parent and children data
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

  const children = await Child.find({ parentId: parent._id }).lean();

  return (
    <div className="min-h-screen bg-gradient-to-b from-santa to-berryPink p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
          <h1 className="text-2xl sm:text-3xl font-paytone-one text-evergreen mb-2 text-center">
            Vote for Magic! ✨
          </h1>
          
          <div className="text-center mb-6">
            <p className="text-sm text-gray-600">
              Welcome, <span className="font-semibold">{session.user.name || session.user.email}</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Wallet: ${((parent.walletBalanceCents || 0) / 100).toFixed(2)}
            </p>
          </div>

          <div className="space-y-6">
            {children.length === 0 ? (
              <div className="p-6 bg-gray-50 rounded-lg text-center">
                <p className="text-gray-600 mb-2">No children added yet!</p>
                <p className="text-sm text-gray-500">
                  Add children from the parent dashboard to start voting.
                </p>
              </div>
            ) : (
              children.map((child) => (
                <Vote
                  key={String(child._id)}
                  child={{
                    _id: String(child._id),
                    displayName: child.displayName,
                    score365: child.score365 || 0,
                    avatarUrl: child.avatarUrl,
                  }}
                  parentWalletBalance={parent.walletBalanceCents || 0}
                />
              ))
            )}
          </div>

          <div className="mt-6 pt-4 border-t space-y-2">
            <Link 
              href="/mobile/settings"
              className="block text-center text-blueberry hover:underline text-sm"
            >
              Go to Settings →
            </Link>
            <Link 
              href="/parent/dashboard"
              className="block text-center text-evergreen hover:underline text-sm"
            >
              View Full Dashboard →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
