import { dbConnect } from "@/lib/db";
import { Child } from "@/models/Child";
import { redirect } from "next/navigation";
import type { IChild } from "@/types/childType";
import Container from "@/components/ui/Container";
import Image from "next/image";
import { FaShare, FaStar } from "react-icons/fa";
import DonationForm from "./DonationForm";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ donation?: string; session_id?: string }>;
};

export default async function ShareChildPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { donation } = await searchParams;

  await dbConnect();
  const child = await Child.findOne({ shareSlug: slug }).lean<IChild | null>();
  
  if (!child) {
    redirect("/");
  }

  // Calculate progress
  const magicPercentage = Math.round((child.score365 / 365) * 100);
  const daysUntilChristmas = Math.max(0, 365 - child.score365);

  return (
    <main className="min-h-[100dvh] bg-gradient-to-b from-evergreen to-santa p-4">
      <Container className="py-8">
        <div className="max-w-2xl mx-auto">
          
          {/* Success Message */}
          {donation === 'success' && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-green-800 font-semibold">Thank you for your donation! 🎅</h3>
              <p className="text-green-700 text-sm">
                Your contribution has been added to {child.displayName}&apos;s Christmas magic!
              </p>
            </div>
          )}

          {/* Cancelled Message */}
          {donation === 'cancelled' && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="text-yellow-800 font-semibold">Donation Cancelled</h3>
              <p className="text-yellow-700 text-sm">
                No worries! You can still help {child.displayName} earn Christmas magic.
              </p>
            </div>
          )}

          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            
            {/* Header Section */}
            <div className="bg-gradient-to-r from-santa to-evergreen text-white p-6 text-center">
              {child.avatarUrl ? (
                <Image 
                  src={child.avatarUrl} 
                  alt={child.displayName}
                  width={100}
                  height={100}
                  className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-white"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-white/20 mx-auto mb-4 flex items-center justify-center text-3xl font-bold">
                  {child.displayName[0]?.toUpperCase() || "?"}
                </div>
              )}
              
              <h1 className="text-2xl font-bold mb-2">{child.displayName}</h1>
              <p className="text-white/90">is working hard to be on Santa&apos;s nice list!</p>
            </div>

            {/* Magic Progress Section */}
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <FaStar className="text-yellow-500" />
                  <span className="text-lg font-semibold text-gray-700">Christmas Magic Progress</span>
                  <FaStar className="text-yellow-500" />
                </div>
                
                <div className="text-3xl font-bold text-evergreen mb-2">
                  {child.score365}/365
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-4 mb-3">
                  <div 
                    className="bg-gradient-to-r from-santa to-evergreen h-4 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(magicPercentage, 100)}%` }}
                  ></div>
                </div>
                
                <p className="text-gray-600">
                  {magicPercentage}% of the way to Christmas! {daysUntilChristmas} days to go.
                </p>
              </div>

              {/* Community Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blueberry">
                    ${((child.neighborBalanceCents || 0) / 100).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">Community Support</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-evergreen">
                    {child.donorTotals?.count || 0}
                  </div>
                  <div className="text-sm text-gray-600">Supporters</div>
                </div>
              </div>

              {/* Donation Section */}
              {child.donationsEnabled ? (
                <div>
                  <h3 className="text-lg font-semibold text-center mb-4 text-gray-800">
                    Help {child.displayName} Earn Christmas Magic! 🎁
                  </h3>
                  <DonationForm 
                    childId={child._id.toString()} 
                    childName={child.displayName}
                  />
                </div>
              ) : (
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">
                    Donations are currently disabled for {child.displayName}.
                  </p>
                </div>
              )}

              {/* Share Section */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <h4 className="font-semibold text-gray-800 mb-2">Spread the Christmas Spirit!</h4>
                  <div className="flex justify-center gap-3">
                    <button 
                      onClick={() => {
                        if (typeof window !== 'undefined' && navigator.share) {
                          navigator.share({
                            title: `Help ${child.displayName} earn Christmas magic!`,
                            text: `${child.displayName} is working hard to be on Santa's nice list. Help spread some Christmas magic!`,
                            url: window.location.href
                          }).catch(() => {
                            navigator.clipboard.writeText(window.location.href);
                            alert('Link copied to clipboard!');
                          });
                        } else if (typeof window !== 'undefined') {
                          navigator.clipboard.writeText(window.location.href);
                          alert('Link copied to clipboard!');
                        }
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blueberry text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <FaShare className="text-sm" />
                      Share
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-6 text-white/80 text-sm">
            <p>Powered by Spirit of Santa 🎅</p>
          </div>
        </div>
      </Container>
    </main>
  );
}