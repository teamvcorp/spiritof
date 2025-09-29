import React from "react";
import Link from "next/link";
import Image from "next/image";
import Container from "@/components/ui/Container";
import { Cards, Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { FaThumbsUp, FaEdit } from "react-icons/fa";
import { ImMagicWand, ImEye, ImPieChart } from "react-icons/im";
import { MdOutlineGroup } from "react-icons/md";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { dbConnect } from "@/lib/db";
import { Parent } from "@/models/Parent";
import { Child } from "@/models/Child";
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
    .lean<IChild | null>();
  if (!child) redirect("/children");

  // Map your balance to whatever "Magic Points" represents in your design
  const magicPoints = child.neighborBalanceCents ?? 0;

  return (
    <div className="min-h-screen bg-[linear-gradient(to_bottom,_#49c5fc_0%,_#49c5fc_50%,_#ea1938_50%,_#EA1938_100%)] py-10">
      <Container className="py-10  text-center bg-white rounded-2xl text-white sm:px-8">
        <h1 className='text-evergreen text-4xl uppercase font-bold'>Welcome back, {child.displayName}! </h1>

        <Cards className="mt-10 mb-10 ">
          <Card className="flex flex-col justify-between p-6 text-center text-center bg-santa border-0 text-white md:flex-row flex-wrap  md:gap-8 mx-0 md:mx-10">
            <h2 className=" text-2xl font-semibold">My Naughty Nice Meter</h2>
            <div className='flex justify-center gap-x-20 items-center'>
              <Image
                src="/images/meter.png"
                alt="Naughty Nice Meter"
                width={300}
                height={300}
                className="mx-auto"
              />
              <div className='flex flex-col justify-center items-center gap-y-6'>
                <h2 className='text-xl'>Latest Vote</h2>
                <FaThumbsUp size={40} />
                <Link href={`/children/${String(child._id)}/child`}>
                  <Button className='bg-evergreen min-w-40'><span><ImEye /></span>Details</Button>
                </Link>
              </div>
            </div>
          </Card>

          <Card className="flex flex-col justify-between p-6 text-center bg-evergreen border-0 text-white">
            <h2 className="text-2xl font-semibold">My Christmas Magic</h2>
            <div className='flex justify-center gap-x-20 items-center'>
              <Image
                src="/images/christmasMagic.png"
                alt="Spirit of Santa"
                width={200}
                height={200}
                className=""
              />
              <div className='w-fit p-4 bg-white rounded-xl'>
                <h2 className='text-santa text-xl'>You Have</h2>
                <h2 className='text-evergreen font-bold text-2xl'>{magicPoints}</h2>
                <h2 className='text-santa text-xl'>Magic Points</h2>
              </div>
            </div>
            <div className='flex justify-center gap-x-10'>
              <Link href={`/children/${String(child._id)}/add-magic`}>
                <Button className='bg-santa min-w-40'><span><ImMagicWand /></span>Add Magic</Button>
              </Link>
              <Link href={`/children/${String(child._id)}/magic`}>
                <Button className='bg-santa min-w-40'><span><ImEye /></span>Details</Button>
              </Link>
            </div>
          </Card>
        </Cards>

        <Cards>
          <Card className="flex flex-col justify-between text-center bg-berryPink border-0 text-white">
            <h1 className="text-2xl font-semibold pb-6 ">My Christmas List</h1>
            <div className=" bg-white rounded-xl pb-5">
              <p className='text-evergreen text-lg font-bold my-6'>My Top 5</p>
              <div className='flex justify-evenly py-6'>
                <Image
                  src="/images/airbrush.jpg"
                  alt="marker airbrush set"
                  width={150}
                  height={150}
                  className=""
                />
                <Image
                  src="/images/panda.jpg"
                  alt="Little live pets Panda"
                  width={150}
                  height={150}
                  className=""
                />
                <Image
                  src="/images/truck.jpg"
                  alt="Sit in truck"
                  height={100}
                  width={200}
                  className=""
                />
                <Image
                  src="/images/mickey.jpg"
                  alt="Mickey Mouse Club House play set"
                  width={200}
                  height={150}
                  className=""
                />
                <Image
                  src="/images/walle.jpg"
                  alt="Walle and Eve lego set"
                  width={200}
                  height={150}
                  className=""
                />
              </div>
            </div>
            <div className='flex justify-evenly items-start pt-6'>
              <div className='flex flex-col items-center' >
                <p className='text-xl '># of Gifts in List</p>
                <p className='text-4xl font-bold'>23</p>
              </div>
              <div className='flex flex-col items-center' >
                <p className='text-xl '>60% Earned</p>
                <ImPieChart size={40} />
              </div>

              <Link href={`/children/${String(child._id)}/gifts`}>
                <Button className='bg-santa min-w-40 '><FaEdit/> Edit List</Button>
              </Link>
            </div>
          </Card>
        </Cards>
        <Link href="/parent/dashboard">
          <Button className='bg-frostyBlue max-w-full mt-6'><MdOutlineGroup/> Parent Portal</Button>
        </Link>
      </Container>

      {/* Add your page content here */}
    </div>
  );
}
