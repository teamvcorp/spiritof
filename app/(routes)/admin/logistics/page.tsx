import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import LogisticsTabs from "@/components/admin/LogisticsTabs";

export default async function AdminLogisticsPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  await dbConnect();

  // Check if user is admin
  const user = await User.findById(session.user.id).lean();
  if (!user?.admin) {
    redirect("/");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Christmas Logistics</h1>
        <p className="text-gray-600">
          Manage Christmas orders, special requests, and fulfillment operations.
        </p>
      </div>
      
      <LogisticsTabs />
    </div>
  );
}