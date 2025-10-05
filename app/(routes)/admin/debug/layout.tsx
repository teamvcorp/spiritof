import { auth } from "@/auth";
import { redirect } from "next/navigation";

interface AdminDebugLayoutProps {
  children: React.ReactNode;
}

export default async function AdminDebugLayout({ children }: AdminDebugLayoutProps) {
  const session = await auth();
  
  if (!session?.user?.id) {
    console.log("No session found, redirecting to auth");
    redirect("/auth/signin");
  }

  console.log("Session user:", session.user);
  console.log("Session admin field:", session.admin);
  
  // Check admin status from session (already includes latest DB data)
  const isAdmin = session.admin === true || session.user.admin === true;
  
  console.log("Is admin:", isAdmin);
  
  if (!isAdmin) {
    console.log("User is not admin, redirecting to home");
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-red-600 text-white p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold">🔧 Admin Debug Panel</h1>
          <p className="text-red-100">Internal troubleshooting tools - Production use only</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto p-6">
        {children}
      </div>
    </div>
  );
}