"use client";

import { AuthenticatedLayout } from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";
import { DRBServiceCard, THANOS_SEPOLIA } from "@/features/drb";

function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("");

  // For Alpha: DRB deploys to Thanos Sepolia (public testnet)
  const thanosSepolia = {
    rpcUrl: THANOS_SEPOLIA.rpcUrl,
    chainId: THANOS_SEPOLIA.chainId,
    name: THANOS_SEPOLIA.name,
    explorerUrl: THANOS_SEPOLIA.explorerUrl,
    nativeToken: THANOS_SEPOLIA.nativeToken,
  };

  return (
    <AuthenticatedLayout>
      <main className="flex-1 p-6 px-16">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Explore Services</h1>
          <p className="text-gray-600">
            Deploy services on Thanos Sepolia testnet
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

        <div className="flex flex-wrap gap-6">
          <DRBServiceCard
            chainName={THANOS_SEPOLIA.name}
            deployedNetwork={thanosSepolia}
          />
        </div>
      </main>
    </AuthenticatedLayout>
  );
}

export default ExplorePage;
