"use client";

import { useState } from "react";
import { FaTruck, FaGift, FaHeart } from "react-icons/fa";
import LogisticsManager from "./LogisticsManager";
import SpecialRequestsManager from "./SpecialRequestsManager";

type TabType = "orders" | "special";

export default function LogisticsTabs() {
  const [activeTab, setActiveTab] = useState<TabType>("orders");

  const tabs = [
    {
      id: "orders" as TabType,
      label: "Regular Orders",
      icon: FaTruck,
      description: "Manage fully paid Christmas lists ready for shipment"
    },
    {
      id: "special" as TabType,
      label: "Special Requests",
      icon: FaGift,
      description: "Handle early gifts and friend gift requests"
    }
  ];

  return (
    <div>
      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className={`mr-2 h-5 w-5 ${
                    isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "orders" && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Regular Christmas Orders</h2>
              <p className="text-gray-600">
                Manage fully paid Christmas lists ready for shipment and fulfillment.
              </p>
            </div>
            <LogisticsManager />
          </div>
        )}

        {activeTab === "special" && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2 flex items-center">
                <FaGift className="mr-2 text-orange-500" />
                <FaHeart className="mr-3 text-pink-500" />
                Special Requests
              </h2>
              <p className="text-gray-600">
                Handle early gift requests and friend gift requests from children. All requests require approval and manual fulfillment.
              </p>
            </div>
            <SpecialRequestsManager />
          </div>
        )}
      </div>
    </div>
  );
}