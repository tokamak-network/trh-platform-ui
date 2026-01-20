"use client";

import { AuthenticatedLayout } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";
import { DRBServiceCard } from "@/features/drb";

// Demo deployed network configuration (simulates stack's L2 chain)
const DEMO_DEPLOYED_NETWORK = {
  rpcUrl: "https://rpc.thanos-sepolia.tokamak.network",
  chainId: 111551119090,
  name: "Thanos Sepolia",
};

function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <AuthenticatedLayout>
      <main className="flex-1 p-6 px-16">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Explore Services</h1>
          <p className="text-gray-600">
            Deploy add-on services to enhance your L2 chain
          </p>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <DRBServiceCard
            stackId="mock-stack-id"
            chainName="My Thanos L2"
            status="Available"
            deployedNetwork={DEMO_DEPLOYED_NETWORK}
          />
        </div>
      </main>
    </AuthenticatedLayout>
  );
}

export default ExplorePage;
