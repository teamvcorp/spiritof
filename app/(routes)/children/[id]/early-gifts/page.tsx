import React from "react";
import Link from "next/link";
import Image from "next/image";
import Container from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { FaArrowLeft, FaGift, FaStar, FaClock } from "react-icons/fa";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { dbConnect } from "@/lib/db";
import { Parent } from "@/models/Parent";
import { Child } from "@/models/Child";
import { MasterCatalog } from "@/models/MasterCatalog";
import { Types } from "mongoose";
import type { IParent } from "@/types/parentTypes";
import type { IChild } from "@/types/childType";
import EarlyGiftRequestForm from "@/components/child/EarlyGiftRequestForm";

interface PageProps { params: Promise<{ id: string }> }

export default async function EarlyGiftsPage({ params }: PageProps) {
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
    .populate({
      path: 'giftList',
      model: MasterCatalog
    })
    .lean<IChild | null>();
  if (!child) redirect("/children");

  // Check if early gifts are enabled
  const christmasSettings = parent.christmasSettings;
  const allowEarlyGifts = christmasSettings?.allowEarlyGifts || false;

  // Get child's gift list
  interface PopulatedGift {
    _id: Types.ObjectId | string;
    title: string;
    price?: number;
    brand?: string;
    retailer?: string;
    blobUrl?: string;
    imageUrl?: string;
  }
  
  const populatedGifts = (child.giftList as unknown as PopulatedGift[]) || [];
  const giftList = populatedGifts.map(gift => ({
    _id: gift._id.toString(),
    title: gift.title,
    imageUrl: gift.blobUrl || gift.imageUrl || "/images/christmasMagic.png",
    price: gift.price || 0,
    brand: gift.brand,
    retailer: gift.retailer,
  }));

  // Calculate magic points
  const neighborMagicPoints = Math.floor((child.neighborBalanceCents || 0) / 100);
  const totalMagicPoints = (child.score365 || 0) + neighborMagicPoints;

  if (!allowEarlyGifts) {
    return (
      <div className="min-h-screen p-6 bg-[linear-gradient(to_bottom,_#ea1938_0%,_#ea1938_50%,_#49c5fc_50%,_#49c5fc_100%)] py-10">
        <Container className="text-center bg-white rounded-2xl px-6 py-10">
          <div className="text-6xl mb-6">🎄</div>
          <h1 className="text-3xl font-bold text-santa mb-4">Early Gifts Not Available</h1>
          <p className="text-gray-600 mb-6">
            Your parents haven't enabled early gift requests yet. 
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
            ⭐ Request Early Gift
          </h1>
          <div></div> {/* Spacer for center alignment */}
        </div>

        {/* Information Card */}
        <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 mb-8">
          <div className="p-6 text-center">
            <div className="text-4xl mb-4">🌟</div>
            <h2 className="text-xl font-bold text-orange-800 mb-2">How Early Gifts Work</h2>
            <div className="text-sm text-orange-700 space-y-2">
              <p>✨ You can request gifts early as rewards for exceptional good behavior!</p>
              <p>🎯 Each request costs magic points and requires parent approval</p>
              <p>⭐ The better your behavior, the more likely your request will be approved</p>
              <p>🎁 Early gifts come off your Christmas list when delivered</p>
            </div>
          </div>
        </Card>

        {/* Magic Points Display */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 mb-8">
          <div className="p-6 text-center">
            <h2 className="text-xl font-bold text-blue-800 mb-4">Your Magic Points</h2>
            <div className="text-4xl font-bold text-blue-600 mb-2">{totalMagicPoints}</div>
            <p className="text-sm text-blue-700">
              {neighborMagicPoints > 0 && `${neighborMagicPoints} from neighbors + `}
              {child.score365 || 0} from good behavior
            </p>
            <div className="mt-4 text-sm text-blue-600">
              💡 Early gift requests typically cost 10-50 magic points depending on the gift value
            </div>
          </div>
        </Card>

        {giftList.length > 0 ? (
          <EarlyGiftRequestForm 
            childId={childId}
            gifts={giftList}
            magicPoints={totalMagicPoints}
            childName={child.displayName}
          />
        ) : (
          <Card className="text-center py-12">
            <div className="text-6xl mb-4">🎁</div>
            <h2 className="text-xl font-bold text-gray-700 mb-2">No Gifts in Your List</h2>
            <p className="text-gray-600 mb-6">
              You need to add gifts to your Christmas list before you can request them early!
            </p>
            <Link href="/children/list">
              <Button className="bg-santa text-white">
                <FaGift className="mr-2" />
                Add Gifts to Your List
              </Button>
            </Link>
          </Card>
        )}
      </Container>
    </div>
  );
}