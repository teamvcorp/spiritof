import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import WelcomePacketManager from "@/components/admin/WelcomePacketManager";

export default async function AdminWelcomePacketsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  await dbConnect();
  
  // Check if user is admin
  const user = await User.findById(session.user.id).select("admin").lean();
  if (!user?.admin) {
    redirect("/");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-paytone-one text-santa-600 mb-2">
          📦 Welcome Packet Management
        </h1>
        <p className="text-gray-600">
          Manage and ship welcome packets for new families
        </p>
      </div>

      <WelcomePacketManager />
    </div>
  );
}