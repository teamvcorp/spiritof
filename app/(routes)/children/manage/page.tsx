import React from "react";
import Link from "next/link";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import ManageGiftList from "./ui/ManageGiftList";
import { FaPlus } from "react-icons/fa";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { dbConnect } from "@/lib/db";
import { Parent } from "@/models/Parent";
import { Child } from "@/models/Child";
import type { IChild } from "@/types/childType";

interface PageProps { 
  searchParams: Promise<{ child?: string }> 
}

export default async function ManageListPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  await dbConnect();

  // Get parent and children
  const parent = await Parent.findOne({ userId: session.user.id }).lean();
  if (!parent) {
    redirect("/onboarding");
  }

  const children = await Child.find({ parentId: parent._id })
    .select("_id displayName giftListLocked giftListLockedAt")
    .lean<IChild[]>();

  if (children.length === 0) {
    redirect("/onboarding"); // No children set up yet
  }

  // Get the selected child (from query param or default to first child)
  const params = await searchParams;
  const selectedChildId = params.child || children[0]._id.toString();
  
  // Validate the selected child belongs to this parent
  const selectedChild = children.find(child => child._id.toString() === selectedChildId);
  if (!selectedChild) {
    redirect(`/children/manage?child=${children[0]._id.toString()}`);
  }

  // Check if lists are finalized
  const listsFinalized = parent.christmasSettings?.listsFinalized || false;
  const isLocked = selectedChild.giftListLocked || false;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 py-8">
      <Container className="max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-paytone-one text-santa mb-4">
            🎁 Manage Christmas List
          </h1>
          
          {/* Child Selection */}
          {children.length > 1 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Child:
              </label>
              <div className="flex justify-center gap-2 flex-wrap">
                {children.map((child) => (
                  <Link
                    key={child._id.toString()}
                    href={`/children/manage?child=${child._id.toString()}`}
                  >
                    <Button
                      className={`text-sm max-w-none ${
                        child._id.toString() === selectedChildId
                          ? "bg-santa text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      {child.displayName}
                    </Button>
                  </Link>
                ))}
              </div>
            </div>
          )}
          
          {/* Add More Gifts Button */}
          <Link href="/children/list">
            <Button className="bg-evergreen text-white max-w-none">
              <FaPlus className="mr-2" />
              Add More Gifts
            </Button>
          </Link>
        </div>

        {/* Gift List Management */}
        <ManageGiftList 
          childId={selectedChildId} 
          childName={selectedChild.displayName}
          isLocked={isLocked}
          listsFinalized={listsFinalized}
        />
      </Container>
    </div>
  );
}