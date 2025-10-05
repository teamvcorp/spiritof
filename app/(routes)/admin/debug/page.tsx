import Link from "next/link";
import { FaDatabase, FaImages, FaUsers, FaShoppingCart, FaCog } from "react-icons/fa";

const debugTools = [
  {
    title: "Catalog Images",
    description: "Check catalog items and their image URLs (blob/external)",
    href: "/admin/debug/catalog-images",
    icon: FaImages,
    color: "bg-blue-500"
  },
  {
    title: "Database Stats",
    description: "View database collection counts and health",
    href: "/admin/debug/database",
    icon: FaDatabase,
    color: "bg-green-500"
  },
  {
    title: "User Analytics",
    description: "Check user onboarding, parent/child relationships",
    href: "/admin/debug/users",
    icon: FaUsers,
    color: "bg-purple-500"
  },
  {
    title: "Gift Lists",
    description: "Analyze gift list data and catalog references",
    href: "/admin/debug/gifts",
    icon: FaShoppingCart,
    color: "bg-orange-500"
  },
  {
    title: "System Health",
    description: "Check API endpoints, external services, errors",
    href: "/admin/debug/health",
    icon: FaCog,
    color: "bg-red-500"
  }
];

export default function AdminDebugPage() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Debug Tools</h2>
        <p className="text-gray-600">
          Select a debugging tool to analyze system data and troubleshoot issues.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {debugTools.map((tool) => {
          const IconComponent = tool.icon;
          return (
            <Link
              key={tool.href}
              href={tool.href}
              className="block bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow p-6"
            >
              <div className="flex items-center mb-4">
                <div className={`${tool.color} p-3 rounded-lg text-white mr-4`}>
                  <IconComponent className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">{tool.title}</h3>
              </div>
              <p className="text-gray-600">{tool.description}</p>
            </Link>
          );
        })}
      </div>

      <div className="mt-12 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ Security Notice</h3>
        <p className="text-yellow-700">
          This debug panel contains sensitive system information. Access is restricted to authorized administrators only.
          All actions are logged for security purposes.
        </p>
      </div>
    </div>
  );
}