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
import { FaArrowLeft, FaHeart, FaGraduationCap, FaHandsHelping } from "react-icons/fa";

type PageProps = {
  params: Promise<{ id: string }>;
};

async function recordMagicEarn(formData: FormData) {
  "use server";
  
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const childId = String(formData.get("childId") ?? "");
  const magicPoints = Number(formData.get("magicPoints") ?? 0);
  // Note: reason could be used for logging/audit trail
  // const reason = String(formData.get("reason") ?? "");

  if (!Types.ObjectId.isValid(childId) || magicPoints < 1 || magicPoints > 10) {
    return;
  }

  await dbConnect();
  const parent = await Parent.findOne({ userId: new Types.ObjectId(session.user.id) });
  if (!parent) redirect("/onboarding");

  const child = await Child.findOne({ 
    _id: new Types.ObjectId(childId), 
    parentId: parent._id 
  });
  
  if (!child) redirect("/children");

  // Add magic points for community good deed (these don't cost wallet balance)
  await Child.findByIdAndUpdate(child._id, {
    $inc: { score365: magicPoints }
  });

  redirect(`/children/${childId}/childdash`);
}

export default async function AddMagicPage({ params }: PageProps) {
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

  const magicOptions = [
    { 
      points: 2, 
      icon: <FaHeart className="text-2xl" />, 
      title: "Good Deed", 
      description: "Helped someone in need",
      color: "bg-berryPink hover:bg-pink-600"
    },
    { 
      points: 5, 
      icon: <FaGraduationCap className="text-2xl" />, 
      title: "Great Grades", 
      description: "Got an A on a test or assignment",
      color: "bg-blueberry hover:bg-blue-600"
    },
    { 
      points: 3, 
      icon: <FaHandsHelping className="text-2xl" />, 
      title: "Volunteering", 
      description: "Helped in the community",
      color: "bg-evergreen hover:bg-green-600"
    },
  ];

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
              <h1 className="text-2xl font-bold text-white">Add Magic Points</h1>
              <p className="text-white/80">for {child.displayName}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-evergreen mb-2">What good thing did you do?</h2>
              <p className="text-gray-600">Earn magic points by doing good deeds and working hard!</p>
            </div>

            <div className="grid gap-4">
              {magicOptions.map((option) => (
                <form key={option.title} action={recordMagicEarn} className="w-full">
                  <input type="hidden" name="childId" value={childId} />
                  <input type="hidden" name="magicPoints" value={option.points} />
                  <input type="hidden" name="reason" value={option.title} />
                  
                  <button 
                    type="submit"
                    className={`w-full ${option.color} text-white p-4 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        {option.icon}
                      </div>
                      <div className="text-left flex-1">
                        <h3 className="font-semibold text-lg">{option.title}</h3>
                        <p className="text-sm text-white/90">{option.description}</p>
                        <p className="text-xs text-white/70 mt-1">+{option.points} magic points</p>
                      </div>
                    </div>
                  </button>
                </form>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">Current Magic Score</h3>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-evergreen">{child.score365}/365</span>
                <span className="text-sm text-gray-600">days until Christmas</span>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}