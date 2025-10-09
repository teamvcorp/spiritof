import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { dbConnect } from "@/lib/db";
import { Parent } from "@/models/Parent";
import { Child } from "@/models/Child";
import { User } from "@/models/User";
import Container from "@/components/ui/Container";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Vote from "@/components/parents/Vote";
import Image from "next/image";
import { FaArrowLeft } from "react-icons/fa";

export default async function VotePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await dbConnect();

  // Get user's parentId first
  const user = await User.findById(session.user.id).select("parentId").lean();
  if (!user?.parentId) redirect("/onboarding");

  const parent = await Parent.findById(user.parentId).lean();
  if (!parent) redirect("/onboarding");

  const children = await Child.find({ parentId: parent._id }).lean();

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-santa-100 via-evergreen-50 to-blueberry-100">
      <Container className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/parent/dashboard">
              <Button className="bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center gap-2">
                <FaArrowLeft /> Back to Dashboard
              </Button>
            </Link>
          </div>
          
          <div className="text-center">
            <h1 className="text-3xl font-paytone-one text-santa mb-2">
              🗳️ Vote for Good Behavior
            </h1>
            <p className="text-gray-600">
              Reward your children's good behavior with magic points! You can vote once per day for each child.
            </p>
            <div className="mt-3 p-3 bg-blueberry-50 rounded-lg">
              <p className="text-sm text-blueberry-800">
                <strong>Your Wallet Balance:</strong> ${((parent.walletBalanceCents || 0) / 100).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Children Voting List */}
        {children.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">👥</div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">No Children Yet</h2>
            <p className="text-gray-600 mb-6">
              Add children to your account to start voting for their good behavior!
            </p>
            <Link href="/parent/dashboard">
              <Button className="bg-santa hover:bg-red-700 text-white">
                Add Your First Child
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {children.map((child) => {
              const id = String(child._id);
              const nicePercentage = Math.round((child.score365 / 365) * 100);
              
              return (
                <div key={id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  {/* Child Header */}
                  <div className="bg-gradient-to-r from-evergreen to-blueberry p-6 text-white">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        {child.avatarUrl ? (
                          <Image 
                            src={child.avatarUrl} 
                            alt={child.displayName}
                            width={80} 
                            height={80} 
                            className="w-20 h-20 rounded-full object-cover border-4 border-white"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-2xl">
                            👶
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold">{child.displayName}</h2>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span>✨ Magic Score:</span>
                            <span className="font-semibold">{child.score365}/365</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>😇 Nice Level:</span>
                            <span className="font-semibold">{nicePercentage}%</span>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="mt-3 bg-white/20 rounded-full h-2">
                          <div 
                            className="bg-white rounded-full h-2 transition-all duration-300"
                            style={{ width: `${nicePercentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Voting Section */}
                  <div className="p-6">
                    <Vote
                      child={{
                        _id: id,
                        displayName: child.displayName,
                        score365: child.score365,
                        avatarUrl: child.avatarUrl
                      }}
                      parentWalletBalance={parent.walletBalanceCents || 0}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
          <h3 className="text-xl font-semibold text-evergreen mb-4">How Voting Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center p-4 bg-berryPink-50 rounded-lg">
              <div className="text-2xl mb-2">❤️</div>
              <h4 className="font-semibold text-berryPink-800">Good Deed</h4>
              <p className="text-berryPink-600">+1 magic point for $1.00</p>
              <p className="text-xs text-gray-600 mt-1">Perfect for small acts of kindness</p>
            </div>
            <div className="text-center p-4 bg-blueberry-50 rounded-lg">
              <div className="text-2xl mb-2">⭐</div>
              <h4 className="font-semibold text-blueberry-800">Great Day</h4>
              <p className="text-blueberry-600">+5 magic points for $5.00</p>
              <p className="text-xs text-gray-600 mt-1">For consistently good behavior</p>
            </div>
            <div className="text-center p-4 bg-santa-50 rounded-lg">
              <div className="text-2xl mb-2">🎁</div>
              <h4 className="font-semibold text-santa-800">Amazing Week</h4>
              <p className="text-santa-600">+10 magic points for $10.00</p>
              <p className="text-xs text-gray-600 mt-1">For exceptional behavior all week</p>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h4 className="font-semibold text-yellow-800 mb-2">🔔 Important Notes:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• You can vote once per day for each child</li>
              <li>• Votes cost money from your wallet balance</li>
              <li>• Magic points help determine Christmas gift eligibility</li>
              <li>• Higher scores mean your child has been extra good this year!</li>
            </ul>
          </div>
        </div>
      </Container>
    </div>
  );
}