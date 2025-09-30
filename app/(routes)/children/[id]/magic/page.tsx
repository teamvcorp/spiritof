import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { dbConnect } from "@/lib/db";
import { Parent } from "@/models/Parent";
import { Child } from "@/models/Child";
import { Types } from "mongoose";
import type { IParent } from "@/types/parentTypes";
import type { IChild } from "@/types/childType";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import Link from "next/link";
import Image from "next/image";
import { FaArrowLeft, FaStar, FaGift, FaCalendarAlt } from "react-icons/fa";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function MagicDetailsPage({ params }: PageProps) {
  const { id: childId } = await params;

  const session = await auth();
  if (!session?.user?.id) redirect("/");

  if (!Types.ObjectId.isValid(childId)) redirect("/children");

  await dbConnect();
  const parent = await Parent.findOne({ userId: new Types.ObjectId(session.user.id) }).lean<IParent>();
  if (!parent) redirect("/onboarding");

  const child = await Child.findOne({ 
    _id: new Types.ObjectId(childId), 
    parentId: parent._id 
  }).lean<IChild | null>();
  
  if (!child) redirect("/children");

  // Calculate magic percentage
  const magicPercentage = Math.round((child.score365 / 365) * 100);
  const daysUntilChristmas = 365 - child.score365;
  
  // Determine status based on score
  let status = "Keep Working!";
  let statusColor = "text-santa";
  let statusIcon = <FaStar className="text-santa" />;
  
  if (child.score365 >= 300) {
    status = "Almost Perfect!";
    statusColor = "text-evergreen";
    statusIcon = <FaGift className="text-evergreen" />;
  } else if (child.score365 >= 200) {
    status = "Very Nice!";
    statusColor = "text-blueberry";
  } else if (child.score365 >= 100) {
    status = "Getting Better!";
    statusColor = "text-berryPink";
  }

  return (
    <main className="min-h-[100dvh] bg-gradient-to-b from-evergreen to-santa p-4">
      <Container className="py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Link href={`/children/${childId}/childdash`}>
              <Button className="bg-white text-evergreen p-2">
                <FaArrowLeft />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Magic Details</h1>
              <p className="text-white/80">for {child.displayName}</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Main Magic Score Card */}
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
              <div className="mb-4">
                <Image
                  src="/images/christmasMagic.png"
                  alt="Christmas Magic"
                  width={120}
                  height={120}
                  className="mx-auto"
                />
              </div>
              
              <div className="mb-4">
                <h2 className="text-3xl font-bold text-evergreen mb-2">{child.score365}</h2>
                <p className="text-lg text-gray-600">Magic Points Earned</p>
              </div>

              <div className="mb-6">
                <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                  <div 
                    className="bg-gradient-to-r from-santa to-evergreen h-4 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(magicPercentage, 100)}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600">{magicPercentage}% of the way to Christmas!</p>
              </div>

              <div className={`flex items-center justify-center gap-2 text-lg font-semibold ${statusColor}`}>
                {statusIcon}
                {status}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl p-4 text-center">
                <FaCalendarAlt className="text-2xl text-santa mx-auto mb-2" />
                <h3 className="font-semibold text-gray-800">Days to Christmas</h3>
                <p className="text-2xl font-bold text-santa">{Math.max(0, daysUntilChristmas)}</p>
              </div>

              <div className="bg-white rounded-xl p-4 text-center">
                <FaGift className="text-2xl text-evergreen mx-auto mb-2" />
                <h3 className="font-semibold text-gray-800">Neighbor Donations</h3>
                <p className="text-2xl font-bold text-evergreen">${(child.neighborBalanceCents / 100).toFixed(2)}</p>
              </div>
            </div>

            {/* How to Earn More */}
            <div className="bg-white rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">How to Earn More Magic</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-berryPink/10 rounded-lg">
                  <div className="w-8 h-8 bg-berryPink rounded-full flex items-center justify-center text-white text-sm font-bold">
                    2
                  </div>
                  <span className="text-gray-700">Do a good deed for someone</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-blueberry/10 rounded-lg">
                  <div className="w-8 h-8 bg-blueberry rounded-full flex items-center justify-center text-white text-sm font-bold">
                    5
                  </div>
                  <span className="text-gray-700">Get great grades in school</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-evergreen/10 rounded-lg">
                  <div className="w-8 h-8 bg-evergreen rounded-full flex items-center justify-center text-white text-sm font-bold">
                    3
                  </div>
                  <span className="text-gray-700">Volunteer in your community</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-santa/10 rounded-lg">
                  <div className="w-8 h-8 bg-santa rounded-full flex items-center justify-center text-white text-sm font-bold">
                    ?
                  </div>
                  <span className="text-gray-700">Ask your parents to vote for you!</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link href={`/children/${childId}/add-magic`}>
                <Button className="w-full bg-santa text-white py-3">
                  + Add Magic Points
                </Button>
              </Link>
              <Link href={`/children/${childId}/list`}>
                <Button className="w-full bg-evergreen text-white py-3">
                  View My List
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}