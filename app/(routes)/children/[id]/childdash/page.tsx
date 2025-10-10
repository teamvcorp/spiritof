import React from "react";
import Link from "next/link";
import Image from "next/image";
import Container from "@/components/ui/Container";
import { Cards, Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import NaughtyNiceMeter from "@/components/child/NaughtyNiceMeter";
import EarnMagicButton from "@/components/child/EarnMagicButton";
import { GameButton } from "@/components/games/GameButton";
import { FaThumbsUp, FaEdit, FaGift, FaPlus } from "react-icons/fa";
import { ImMagicWand, ImEye, ImPieChart } from "react-icons/im";
import { MdOutlineGroup } from "react-icons/md";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { dbConnect } from "@/lib/db";
import { Parent } from "@/models/Parent";
import { Child } from "@/models/Child";
import { MasterCatalog } from "@/models/MasterCatalog"; // Import MasterCatalog model
import { Types } from "mongoose";
import type { IParent } from "@/types/parentTypes";
import type { IChild } from "@/types/childType";

interface PageProps { params: Promise<{ id: string }> }

export default async function ChildDashPage({ params }: PageProps) {

const {id: childId} = await params;

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

  // Get child's gift list from populated master catalog items
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

  // Calculate magic points from neighbor donations (stored in cents) and parent votes (score365)
  const neighborMagicPoints = Math.floor((child.neighborBalanceCents || 0) / 100);
  const totalMagicPoints = (child.score365 || 0) + neighborMagicPoints;

  // Calculate naughty/nice percentage based on magic score out of 365 days
  // The score365 represents days of good behavior, max 365 for the full year
  const baseScore = child.score365 || 0;
  const nicenessPercentage = Math.min(100, Math.round((baseScore / 365) * 100));

  // Get top 5 gifts for display
  const topGifts = giftList.slice(0, 5);

  // Check parent settings for special features
  const christmasSettings = parent.christmasSettings;
  const allowEarlyGifts = christmasSettings?.allowEarlyGifts === true;
  const allowFriendGifts = christmasSettings?.allowFriendGifts !== false; // Default to true

  return (
    <div className="min-h-screen p-6 bg-[linear-gradient(to_bottom,_#ea1938_0%,_#ea1938_50%,_#49c5fc_50%,_#49c5fc_100%)] py-10">
      <Container className="text-center bg-white rounded-2xl  sm:px-6 md:px-10">
        <h1 className='text-evergreen text-2xl sm:text-3xl md:text-4xl uppercase font-bold pt-10'>Welcome back, {child.displayName}! </h1>

        <Cards className="mt-10 mb-10">
          <Card className="flex flex-col justify-between p-6 text-center text-center bg-santa border-0 text-white md:flex-row flex-wrap ">
          <div className="flex-1 space-y-2 md:items-start md:justify-center">
            <h2 className="text-xl sm:text-2xl uppercase font-semibold">My Naughty Nice Meter</h2>
            <p className="text-md opacity-90 mb-10">
              {nicenessPercentage >= 80 
                ? "You're being amazing! Santa is very impressed!" 
                : nicenessPercentage >= 50 
                ? "You're doing great! Keep up the good behavior."
                : "Keep working on being good - you can do it!"}
            </p>
          </div>
            <div className='flex w-full md:w-auto flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10'>
              <div className="relative">
                {/* Animated Naughty Nice Meter */}
                <NaughtyNiceMeter percentage={nicenessPercentage} />
              </div>
              <div className='flex flex-col items-center  gap-3 sm:gap-4'>
                <h3 className='text-lg sm:text-xl'>Latest Vote</h3>
                <FaThumbsUp className="shrink-0" size={36} />
              </div>
            </div>
          </Card>

          <Card className="flex flex-col justify-between  text-center bg-evergreen border-0 text-white">
            <h2 className="text-2xl uppercase font-semibold">My Christmas Magic</h2>
            <div className='flex justify-center gap-x-20 items-center '>
              <Image
                src="/images/christmasMagic.png"
                alt="Spirit of Santa"
                width={200}
                height={200}
                className=""
              />
              <div className=' w-fit p-4 bg-white rounded-xl'>
                <h2 className='text-santa text-base sm:text-lg md:text-xl'>You Have</h2>
                <h2 className='text-evergreen font-bold text-xl sm:text-2xl md:text-3xl'>{totalMagicPoints}</h2>
                <h2 className='text-santa text-base sm:text-lg md:text-xl'>Magic Points</h2>
                {neighborMagicPoints > 0 && (
                  <div className="text-xs text-gray-600 mt-1">
                    ({neighborMagicPoints} from neighbors + {child.score365 || 0} from good behavior)
                  </div>
                )}
              </div>
            </div>
            <div className='flex justify-center'>
              <EarnMagicButton 
                childId={String(child._id)}
                childName={child.displayName}
                shareSlug={child.shareSlug}
              />
            </div>
          </Card>
        </Cards>

        <Cards>
          <Card className="flex flex-col justify-between text-center bg-berryPink border-0 text-white">
            <h2 className="text-2xl font-semibold uppercase pb-6 ">My Christmas List</h2>
            
            {giftList.length > 0 ? (
              <>
                <div className=" bg-white rounded-xl pb-5">
                  <p className='text-evergreen text-lg font-bold my-6'>My Top {Math.min(5, topGifts.length)}</p>
                  <div className='flex justify-evenly py-6 flex-wrap gap-4'>
                    {topGifts.map((gift) => (
                      <div key={gift._id.toString()} className="flex flex-col items-center">
                        <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-lg overflow-hidden">
                          {gift.imageUrl ? (
                            <Image
                              src={gift.imageUrl}
                              alt={gift.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <FaGift className="text-gray-400 text-2xl" />
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-600 mt-2 text-center max-w-32 truncate">
                          {gift.title}
                        </div>
                        <div className="text-xs text-gray-500">${gift.price}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className='flex justify-evenly items-start pt-6 flex-wrap'>
                  <div className='flex flex-col items-center' >
                    <p className='text-xl '># of Gifts in List</p>
                    <p className='text-4xl font-bold'>{giftList.length}</p>
                  </div>
                  <div className='flex flex-col items-center' >
                    <p className='text-xl '>{nicenessPercentage}% Earned</p>
                    <ImPieChart size={40} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Link href="/children/list">
                      <Button className='bg-santa min-w-40 '><FaPlus className="mr-1" /> Add Gifts</Button>
                    </Link>
                    <Link href={`/children/manage?child=${String(child._id)}`}>
                      <Button className='bg-evergreen min-w-40 '><FaEdit className="mr-1" /> Manage List</Button>
                    </Link>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className=" bg-white rounded-xl pb-5">
                  <div className='flex flex-col items-center justify-center py-12'>
                    <FaGift className="text-gray-300 text-6xl mb-4" />
                    <p className='text-evergreen text-lg font-bold mb-2'>No gifts yet!</p>
                    <p className='text-gray-600 text-sm'>Start building your Christmas list</p>
                  </div>
                </div>
                <div className='flex justify-center items-center pt-6'>
                  <Link href="/children/list">
                    <Button className='link-btn santa-btn'>
                      <FaPlus className="mr-2" />
                      Add Your First Gift
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </Card>
        </Cards>

        {/* Fun Games Section */}
        <Cards className="mt-6">
          <Card className="bg-blueberry border-0 text-white ">
            <div className="text-center p-6 flex flex-col items-center justify-center">
              <h2 className="text-2xl font-semibold mb-4 uppercase">Christmas Games</h2>
              <p className="text-white/90 mb-6">
                Take a break and play some fun Christmas games while you wait for Santa!
              </p>
              
              <GameButton 
                showAllGames={true}
                variant="button"
                className="link-btn santa-btn hover:bg-gray-100 font-bold px-8 py-3 text-lg"
              />
            </div>
          </Card>
        </Cards>

        {/* Special Christmas Features */}
        {(allowEarlyGifts || allowFriendGifts) && (
          <Cards className="mt-6">
            <Card className="bg-gradient-to-r from-yellow-400 to-orange-400 border-0 text-white">
              <div className="text-center p-6">
                <h2 className="text-2xl font-semibold mb-4">🎁 Special Christmas Features</h2>
                <div className={`grid gap-4 ${(allowEarlyGifts && allowFriendGifts) ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 place-items-center'}`}>
                  {allowEarlyGifts && (
                    <Link href={`/children/${String(child._id)}/early-gifts`}>
                      <Button className='bg-white text-orange-600 hover:bg-gray-100 w-full p-4 text-lg font-semibold rounded-xl'>
                        ⭐ Request Early Gift
                        <div className="text-sm font-normal mt-1">
                          Ask for a gift as a reward for good behavior!
                        </div>
                      </Button>
                    </Link>
                  )}
                  {allowFriendGifts && (
                    <Link href={`/children/${String(child._id)}/friend-gifts`}>
                      <Button className='bg-white text-orange-600 hover:bg-gray-100 w-full p-4 text-lg font-semibold rounded-xl'>
                        💝 Send Friend Gift
                        <div className="text-sm font-normal mt-1">
                          Share the Christmas spirit with friends!
                        </div>
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          </Cards>
        )}
        <Link href="/parent/dashboard">
          <Button className='bg-frostyBlue max-w-full my-6 text-white'><MdOutlineGroup/> Parent Portal</Button>
        </Link>
      </Container>

      {/* Add your page content here */}
    </div>
  );
}