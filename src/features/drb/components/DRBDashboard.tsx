"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dices, Server, RefreshCw, Copy, Check, Circle, ArrowUpRight } from "lucide-react";

interface NetworkConfig {
  rpcUrl: string;
  chainId: number;
  name: string;
  explorerUrl?: string;
}

interface DRBContractInfo {
  contractAddress: string;
  contractName: "CommitReveal2" | "CommitReveal2L2";
  chainId: number;
}

interface DRBApplicationInfo {
  leaderNodeUrl: string;
  regularNodeUrls: string[];
}

interface DRBDeploymentInfo {
  contract: DRBContractInfo;
  application: DRBApplicationInfo;
  databaseType: "rds" | "local";
}

interface DRBDashboardProps {
  stackId: string;
  chainName: string;
  networkConfig?: NetworkConfig;
  deploymentInfo?: DRBDeploymentInfo;
}

type RoundState = "IDLE" | "COMMIT" | "REVEAL" | "COMPLETED" | "HALTED";

const roundData = {
  number: 847,
  state: "COMPLETED" as RoundState,
  randomness: "0x7f3a8b2c9d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a",
  timestamp: "2 min ago",
};

const logs = [
  { time: "19:45:23", msg: "Round #847: Randomness generated successfully" },
  { time: "19:45:20", msg: "All nodes revealed, computing final value" },
  { time: "19:45:15", msg: "Commit phase complete, starting reveal" },
  { time: "19:45:08", msg: "Round #847: Commit phase started" },
  { time: "19:45:05", msg: "New randomness request received" },
];

const defaultDeployment = (chainId: number): DRBDeploymentInfo => ({
  contract: {
    contractAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    contractName: "CommitReveal2L2",
    chainId,
  },
  application: {
    leaderNodeUrl: "https://drb-leader.thanos-sepolia.tokamak.network",
    regularNodeUrls: [
      "https://drb-node-1.thanos-sepolia.tokamak.network",
      "https://drb-node-2.thanos-sepolia.tokamak.network",
      "https://drb-node-3.thanos-sepolia.tokamak.network",
    ],
  },
  databaseType: "local",
});

export function DRBDashboard({ chainName, networkConfig, deploymentInfo }: DRBDashboardProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "logs">("overview");

  const network = networkConfig ?? {
    chainId: 111551119090,
    name: chainName || "Thanos Sepolia",
    rpcUrl: "",
    explorerUrl: "https://explorer.thanos-sepolia.tokamak.network",
  };

  const deployment = deploymentInfo ?? defaultDeployment(network.chainId);
  const explorerUrl = network.explorerUrl ?? "https://etherscan.io";

  const nodes = useMemo(() => [
    { name: "Leader", url: deployment.application.leaderNodeUrl, isLeader: true },
    ...deployment.application.regularNodeUrls.map((url, i) => ({ name: `Node ${i + 1}`, url, isLeader: false })),
  ], [deployment.application]);

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const refresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-neutral-900">
            <Dices className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">Randomness Beacon</h1>
            <p className="text-sm text-neutral-500">{network.name} · Chain {network.chainId}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} className="text-neutral-600">
          <RefreshCw className={cn("mr-2 h-3.5 w-3.5", isRefreshing && "animate-spin")} />
          Refresh
        </Button>
      </header>

      <div className="mb-6 flex items-center gap-6 border-b border-neutral-200 pb-6">
        <StatusItem label="Status">
          <span className="flex items-center gap-1.5 text-success-600">
            <Circle className="h-2 w-2 fill-current" />
            Healthy
          </span>
        </StatusItem>
        <StatusItem label="Nodes"><span>4/4 online</span></StatusItem>
        <StatusItem label="Round"><span className="font-mono">#{roundData.number}</span></StatusItem>
        <StatusItem label="State">
          <span className={cn(
            "rounded px-1.5 py-0.5 text-xs font-medium",
            roundData.state === "COMPLETED" && "bg-success-50 text-success-700",
            roundData.state === "COMMIT" && "bg-primary-50 text-primary-700",
            roundData.state === "REVEAL" && "bg-amber-50 text-amber-700",
          )}>
            {roundData.state}
          </span>
        </StatusItem>
        <StatusItem label="Database">
          <span>{deployment.databaseType === "rds" ? "AWS RDS" : "Local"}</span>
        </StatusItem>
      </div>

      <div className="mb-4 flex gap-1">
        <TabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")}>Overview</TabButton>
        <TabButton active={activeTab === "logs"} onClick={() => setActiveTab("logs")}>Logs</TabButton>
      </div>

      {activeTab === "overview" && (
        <div className="space-y-6">
          <section>
            <SectionHeader>Contract</SectionHeader>
            <div className="rounded-lg border border-neutral-200 bg-white">
              <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-neutral-500">{deployment.contract.contractName}</span>
                  <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600">
                    {deployment.contract.contractName === "CommitReveal2" ? "L1" : "L2"}
                  </span>
                </div>
                <a
                  href={`${explorerUrl}/address/${deployment.contract.contractAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-primary-600 hover:underline"
                >
                  View on Explorer
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <code className="text-sm text-neutral-700">{deployment.contract.contractAddress}</code>
                <CopyBtn onClick={() => copy(deployment.contract.contractAddress, "contract")} copied={copied === "contract"} />
              </div>
            </div>
          </section>

          <section>
            <SectionHeader>Node Network</SectionHeader>
            <div className="rounded-lg border border-neutral-200 bg-white">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-100 text-left text-xs text-neutral-500">
                    <th className="px-4 py-2.5 font-medium">Node</th>
                    <th className="px-4 py-2.5 font-medium">Endpoint</th>
                    <th className="px-4 py-2.5 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {nodes.map((node, i) => (
                    <tr key={i} className={cn("border-b border-neutral-50 last:border-0", node.isLeader && "bg-primary-50/30")}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Server className="h-4 w-4 text-neutral-400" />
                          <span className="text-sm font-medium text-neutral-900">{node.name}</span>
                          {node.isLeader && (
                            <span className="rounded bg-primary-100 px-1.5 py-0.5 text-[10px] font-medium text-primary-700">Leader</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-xs text-neutral-500">{node.url}</code>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center gap-1.5 text-xs text-success-600">
                          <Circle className="h-1.5 w-1.5 fill-current" />
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <SectionHeader>Last Generated Randomness</SectionHeader>
            <div className="rounded-lg border border-neutral-200 bg-white px-4 py-3">
              <div className="flex items-start justify-between gap-4">
                <code className="break-all text-sm text-neutral-700">{roundData.randomness}</code>
                <CopyBtn onClick={() => copy(roundData.randomness, "random")} copied={copied === "random"} />
              </div>
              <p className="mt-2 text-xs text-neutral-400">Generated {roundData.timestamp} · Round #{roundData.number}</p>
            </div>
          </section>
        </div>
      )}

      {activeTab === "logs" && (
        <section>
          <div className="rounded-lg border border-neutral-200 bg-neutral-900 p-4">
            <div className="space-y-1 font-mono text-sm">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-4">
                  <span className="text-neutral-500">{log.time}</span>
                  <span className="text-neutral-300">{log.msg}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-3 text-xs text-neutral-400">Showing last 5 log entries. Connect to Grafana for full logs.</p>
        </section>
      )}
    </div>
  );
}

function StatusItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-neutral-400">{label}</p>
      <p className="text-sm font-medium text-neutral-900">{children}</p>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-400">{children}</h2>;
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        active ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"
      )}
    >
      {children}
    </button>
  );
}

function CopyBtn({ onClick, copied }: { onClick: () => void; copied: boolean }) {
  return (
    <button
      onClick={onClick}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}
