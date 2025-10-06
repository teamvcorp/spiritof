import React from "react";
import Link from "next/link";
import Container from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { FaArrowLeft, FaUsers, FaHeart } from "react-icons/fa";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { dbConnect } from "@/lib/db";
import { Parent } from "@/models/Parent";
import { Child } from "@/models/Child";
import { MasterCatalog } from "@/models/MasterCatalog";
import { Types } from "mongoose";
import type { IParent } from "@/types/parentTypes";
import type { IChild } from "@/types/childType";
import FriendGiftForm from "@/components/child/FriendGiftForm";

interface PageProps { params: Promise<{ id: string }> }

export default async function FriendGiftsPage({ params }: PageProps) {
  const { id: childId } = await params;

  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  if (!Types.ObjectId.isValid(childId)) redirect("/children");

  await dbConnect();
  const parent = await Parent
    .findOne({ userId: new Types.ObjectId(session.user.id) })
    .lean<IParent>();
  if (!parent) redirect("/onboarding");

  const child = await Child
    .findOne({ _id: new Types.ObjectId(childId), parentId: parent._id })
    .lean<IChild | null>();
  if (!child) redirect("/children");

  // Check if friend gifts are enabled
  const christmasSettings = parent.christmasSettings;
  const allowFriendGifts = christmasSettings?.allowFriendGifts !== false; // Default to true
  const maxFriendGiftValue = christmasSettings?.maxFriendGiftValue || 25;

  // Calculate magic points
  const neighborMagicPoints = Math.floor((child.neighborBalanceCents || 0) / 100);
  const totalMagicPoints = (child.score365 || 0) + neighborMagicPoints;

  // Get available gifts from master catalog (limited by friend gift value)
  const allGifts = await MasterCatalog.find({ 
    price: { $lte: maxFriendGiftValue },
    isActive: true
  }).lean();

  const giftList = allGifts.map(gift => ({
    _id: gift._id.toString(),
    title: gift.title,
    imageUrl: gift.blobUrl || gift.imageUrl || "/images/christmasMagic.png",
    price: gift.price || 0,
    brand: gift.brand,
    retailer: gift.retailer,
  }));

  if (!allowFriendGifts) {
    return (
      <div className="min-h-screen p-6 bg-[linear-gradient(to_bottom,_#ea1938_0%,_#ea1938_50%,_#49c5fc_50%,_#49c5fc_100%)] py-10">
        <Container className="text-center bg-white rounded-2xl px-6 py-10">
          <div className="text-6xl mb-6">💝</div>
          <h1 className="text-3xl font-bold text-santa mb-4">Friend Gifts Not Available</h1>
          <p className="text-gray-600 mb-6">
            Your parents haven't enabled friend gift sending yet. 
            Ask them to turn on this feature in their Christmas settings!
          </p>
          <Link href={`/children/${childId}/childdash`}>
            <Button className="bg-santa text-white">
              <FaArrowLeft className="mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-[linear-gradient(to_bottom,_#ea1938_0%,_#ea1938_50%,_#49c5fc_50%,_#49c5fc_100%)] py-10">
      <Container className="bg-white rounded-2xl px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <Link href={`/children/${childId}/childdash`}>
            <Button className="bg-gray-500 hover:bg-gray-600 text-white">
              <FaArrowLeft className="mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-santa text-center flex-1">
            💝 Send Friend Gift
          </h1>
          <div></div> {/* Spacer for center alignment */}
        </div>

        {/* Information Card */}
        <Card className="bg-gradient-to-r from-pink-50 to-purple-50 border-2 border-pink-200 mb-8">
          <div className="p-6 text-center">
            <div className="text-4xl mb-4">🤝</div>
            <h2 className="text-xl font-bold text-pink-800 mb-2">Share the Christmas Spirit!</h2>
            <div className="text-sm text-pink-700 space-y-2">
              <p>💝 Send gifts to your friends to spread Christmas joy!</p>
              <p>💰 Maximum gift value: ${maxFriendGiftValue}</p>
              <p>✨ Friend gifts cost magic points and require parent approval</p>
              <p>🎄 Your friend will get a surprise gift delivery!</p>
              <p>💖 Giving to friends makes Christmas even more magical</p>
            </div>
          </div>
        </Card>

        {/* Magic Points Display */}
        <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200 mb-8">
          <div className="p-6 text-center">
            <h2 className="text-xl font-bold text-blue-800 mb-4">Your Magic Points</h2>
            <div className="text-4xl font-bold text-blue-600 mb-2">{totalMagicPoints}</div>
            <p className="text-sm text-blue-700">
              {neighborMagicPoints > 0 && `${neighborMagicPoints} from neighbors + `}
              {child.score365 || 0} from good behavior
            </p>
            <div className="mt-4 text-sm text-blue-600">
              💡 Friend gifts typically cost 5-25 magic points depending on the gift value
            </div>
          </div>
        </Card>

        {/* Friend Gift Form */}
        <FriendGiftForm 
          childId={childId}
          gifts={giftList}
          childName={child.displayName}
          magicPoints={totalMagicPoints}
          maxGiftValue={maxFriendGiftValue}
        />
      </Container>
    </div>
  );
}