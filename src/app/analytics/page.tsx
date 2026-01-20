"use client";

import { AuthenticatedLayout } from "@/components/layout";
import { DRBDashboard } from "@/features/drb";

// Demo data matching the explore page deployment
const DEMO_NETWORK_CONFIG = {
  rpcUrl: "https://rpc.thanos-sepolia.tokamak.network",
  chainId: 111551119090,
  name: "Thanos Sepolia",
  explorerUrl: "https://explorer.thanos-sepolia.tokamak.network",
};

const DEMO_DEPLOYMENT_INFO = {
  contract: {
    contractAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    contractName: "CommitReveal2L2" as const,
    chainId: 111551119090,
  },
  application: {
    leaderNodeUrl: "https://drb-leader.thanos-sepolia.tokamak.network",
    regularNodeUrls: [
      "https://drb-node-1.thanos-sepolia.tokamak.network",
      "https://drb-node-2.thanos-sepolia.tokamak.network",
      "https://drb-node-3.thanos-sepolia.tokamak.network",
    ],
  },
  databaseType: "local" as const,
};

function AnalyticsPage() {
  return (
    <AuthenticatedLayout>
      <main className="flex-1 p-6 px-16">
        <DRBDashboard
          stackId="demo-stack-id"
          chainName="Thanos Sepolia"
          networkConfig={DEMO_NETWORK_CONFIG}
          deploymentInfo={DEMO_DEPLOYMENT_INFO}
        />
      </main>
    </AuthenticatedLayout>
  );
}

export default AnalyticsPage;
