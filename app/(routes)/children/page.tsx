import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { dbConnect } from "@/lib/db";
import { Parent } from "@/models/Parent";
import { Child } from "@/models/Child";
import { Types } from "mongoose";
import type { IParent } from "@/types/parentTypes";
import type { IChild } from "@/types/childType";

export default async function ChildrenPickerPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  await dbConnect();
  const parent = await Parent
    .findOne({ userId: new Types.ObjectId(session.user.id) })
    .lean<IParent>();

  if (!parent) redirect("/onboarding");

  const children = await Child
    .find({ parentId: parent._id })
    .lean<IChild[]>();

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#005574] via-[#032255] to-[#001a33] flex flex-col items-center justify-center px-4 py-16">
      {/* Ice sheet container */}
      <div className="relative bg-gray-200 backdrop-blur-sm rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.15)] p-8 sm:p-12 max-w-6xl w-full">
        {/* Light reflection overlay */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/20 to-transparent transform -skew-y-3"></div>
        </div>

        {/* Content */}
        <div className="relative z-10">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-paytone-one text-center mb-12 text-gray-800">
            🎄 Choose Your Little Elf 🎄
          </h1>
          
          {children.length === 0 ? (
            <div className="text-center bg-blueberry border-2 border-blueberry rounded-lg p-8 text-gray-700">
              <p className="text-lg mb-2">No children found yet.</p>
              <p className="text-sm">Add children from your <Link href="/parent/dashboard" className="text-santa font-semibold hover:underline">Parent Dashboard</Link>.</p>
            </div>
          ) : (
            <ul className="flex justify-center flex-wrap gap-12 sm:gap-16 lg:gap-20">
              {children.map((c) => {
                const id = String(c._id);
                return (
                  <li key={id} className="flex flex-col items-center gap-4">
                    <Link href={`/children/${id}/childdash`} className="group focus:outline-none">
                      <div className="relative h-32 w-32 sm:h-40 sm:w-40 rounded-full overflow-hidden ring-4 ring-white shadow-[0_4px_12px_rgba(0,0,0,0.2)] group-hover:ring-santa transition-all duration-300 transform hover:scale-110 bg-gradient-to-br from-santa/20 to-evergreen/20">
                        {c.avatarUrl ? (
                          <img src={c.avatarUrl} alt={c.displayName} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-santa to-berryPink flex items-center justify-center text-6xl font-bold text-white">
                            {c.displayName?.[0]?.toUpperCase() ?? "?"}
                          </div>
                        )}
                        {/* Hover glow effect */}
                        <div className="absolute inset-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      <div className="mt-3 text-center text-base sm:text-lg font-semibold text-evergreen group-hover:text-evergreen transition-colors duration-300">
                        {c.displayName}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}