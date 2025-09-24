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
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-10">
      <h1 className="text-3xl sm:text-4xl font-semibold mb-8">Who is playing?</h1>

      {children.length === 0 ? (
        <div className="text-sm text-muted-foreground border rounded-lg p-6">
          No children found yet. Add children from your <Link href="/parent/dashboard" className="underline">Parent Dashboard</Link>.
        </div>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 max-w-5xl w-full">
          {children.map((c) => {
            const id = String(c._id);
            return (
              <li key={id} className="flex flex-col items-center gap-3">
                <Link href={`/children/${id}/childdash`} className="group focus:outline-none">
                  <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-lg overflow-hidden ring-2 ring-transparent group-hover:ring-primary transition shadow-md">
                    {c.avatarUrl ? (
                      <img src={c.avatarUrl} alt={c.displayName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-muted flex items-center justify-center text-3xl font-semibold">
                        {c.displayName?.[0]?.toUpperCase() ?? "?"}
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-center text-sm sm:text-base font-medium group-hover:opacity-90">
                    {c.displayName}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}