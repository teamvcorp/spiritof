import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { dbConnect } from "@/lib/db";
import { User } from "@/models/User";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { FaGift, FaTruck, FaBug, FaCog, FaChartBar } from "react-icons/fa";

export default async function AdminIndexPage() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">
          Manage the Spirit of Santa platform and Christmas operations.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Catalog Management */}
        <Link href="/admin/catalog-builder">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center mb-4">
              <FaGift className="text-santa text-2xl mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Catalog Manager</h2>
            </div>
            <p className="text-gray-600">
              Manage the master gift catalog, add new items, and handle toy requests from children.
            </p>
          </Card>
        </Link>

        {/* Logistics & Fulfillment */}
        <Link href="/admin/logistics">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center mb-4">
              <FaTruck className="text-evergreen text-2xl mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Logistics</h2>
            </div>
            <p className="text-gray-600">
              Review fully paid Christmas lists, approve for shipment, and track deliveries.
            </p>
          </Card>
        </Link>

        {/* Debug Tools */}
        <Link href="/admin/debug">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center mb-4">
              <FaBug className="text-blueberry text-2xl mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">Debug Tools</h2>
            </div>
            <p className="text-gray-600">
              Development tools for debugging payments, user accounts, and system status.
            </p>
          </Card>
        </Link>

        {/* User Management */}
        <Link href="/admin/make-admin">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center mb-4">
              <FaCog className="text-berryPink text-2xl mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
            </div>
            <p className="text-gray-600">
              Manage admin access and user permissions for the platform.
            </p>
          </Card>
        </Link>

        {/* Analytics (Coming Soon) */}
        <Card className="p-6 opacity-50">
          <div className="flex items-center mb-4">
            <FaChartBar className="text-gray-400 text-2xl mr-3" />
            <h2 className="text-xl font-semibold text-gray-500">Analytics</h2>
          </div>
          <p className="text-gray-400">
            Platform metrics and Christmas campaign analytics. Coming soon!
          </p>
        </Card>

        {/* Support (Coming Soon) */}
        <Card className="p-6 opacity-50">
          <div className="flex items-center mb-4">
            <FaCog className="text-gray-400 text-2xl mr-3" />
            <h2 className="text-xl font-semibold text-gray-500">Support Center</h2>
          </div>
          <p className="text-gray-400">
            Help desk and customer support tools. Coming soon!
          </p>
        </Card>
      </div>

      <div className="mt-8 p-4 bg-santa-50 rounded-lg border border-santa-200">
        <h3 className="text-lg font-semibold text-santa mb-2">🎅 Admin Quick Stats</h3>
        <p className="text-gray-700">
          Welcome to the Spirit of Santa admin dashboard. Use the tools above to manage the Christmas magic platform.
        </p>
      </div>
    </div>
  );
}