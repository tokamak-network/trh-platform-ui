"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Users,
  Activity,
  Clock,
  RefreshCw,
  ExternalLink,
  Copy,
  Server,
} from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import { ethers } from "ethers";
import { useDRBContract } from "../hooks/useDRBContract";
import { THANOS_SEPOLIA_CHAIN } from "../contracts/abis";
import toast from "react-hot-toast";

interface MonitoringTabProps {
  commitReveal2Address?: string;
  consumerExampleAddress?: string;
  rpcUrl?: string;
}

export function MonitoringTab({
  commitReveal2Address,
  consumerExampleAddress,
  rpcUrl,
}: MonitoringTabProps) {
  const contract = useDRBContract({
    commitReveal2Address,
    consumerExampleAddress,
    rpcUrl,
  });

  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      contract.fetchContractState();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, contract.fetchContractState]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const formatAddress = (address: string) =>
    `${address.slice(0, 8)}...${address.slice(-6)}`;

  const getExplorerAddressUrl = (address: string) =>
    `${THANOS_SEPOLIA_CHAIN.explorerUrl}/address/${address}`;

  const formatTimestamp = (timestamp: bigint) => {
    if (timestamp === BigInt(0)) return "N/A";
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleString();
  };

  const isRoundActive = contract.currentRound > 0 && contract.roundStartTime > 0;

  return (
    <TabsContent value="monitoring" className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-slate-800">DRB Network Status</h2>
          <Badge
            variant={contract.operatorCount >= 2 ? "default" : "secondary"}
            className={contract.operatorCount >= 2 ? "bg-green-500" : "bg-amber-500"}
          >
            {contract.operatorCount >= 2 ? "Ready" : "Needs Operators"}
          </Badge>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Auto-refresh</span>
            <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={contract.fetchContractState}
            disabled={contract.isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${contract.isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-3 text-slate-800">
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg">Activated Operators</span>
              <Badge variant="outline" className="ml-auto">
                {contract.operatorCount} / 2+ required
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {contract.operators.length === 0 ? (
              <div className="text-center py-6 text-slate-500">
                <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No activated operators yet</p>
                <p className="text-xs mt-1">
                  DRB requires at least 2 operators to function
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {contract.operators.map((operator, index) => (
                  <div
                    key={operator}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/60 hover:bg-white/80 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-blue-500 flex items-center justify-center text-white text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <code className="text-sm font-mono text-slate-700">
                          {formatAddress(operator)}
                        </code>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => copyToClipboard(operator, "Operator address")}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <a
                        href={getExplorerAddressUrl(operator)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-50 to-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-3 text-slate-800">
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg">Current Round</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            <div className="flex justify-between items-center p-3 rounded-lg bg-white/60">
              <span className="text-sm text-slate-600">Round Number</span>
              <span className="text-2xl font-bold text-emerald-600">
                {contract.currentRound.toString()}
              </span>
            </div>

            <div className="flex justify-between items-center p-3 rounded-lg bg-white/40">
              <span className="text-sm text-slate-600">Status</span>
              <Badge
                variant={isRoundActive ? "default" : "secondary"}
                className={isRoundActive ? "bg-emerald-500" : ""}
              >
                {isRoundActive ? "Active" : "Idle"}
              </Badge>
            </div>

            {isRoundActive && (
              <div className="flex justify-between items-center p-3 rounded-lg bg-white/40">
                <span className="text-sm text-slate-600">Started At</span>
                <span className="text-sm font-mono">
                  {formatTimestamp(contract.roundStartTime)}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center p-3 rounded-lg bg-white/40">
              <span className="text-sm text-slate-600">Flat Fee</span>
              <span className="text-sm font-mono">
                {ethers.formatEther(contract.flatFee)} TON
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-xl bg-gradient-to-br from-slate-50 to-slate-100">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-3 text-slate-800">
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-slate-500 to-slate-600 shadow-lg">
              <Server className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg">Contract Addresses</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="grid gap-3 md:grid-cols-2">
            {commitReveal2Address && (
              <div className="p-3 rounded-lg bg-white/60">
                <p className="text-xs text-slate-500 mb-1">CommitReveal2L2</p>
                <div className="flex items-center justify-between">
                  <code className="text-sm font-mono text-slate-700">
                    {formatAddress(commitReveal2Address)}
                  </code>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => copyToClipboard(commitReveal2Address, "Contract address")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <a
                      href={getExplorerAddressUrl(commitReveal2Address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-slate-600 p-1"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            )}

            {consumerExampleAddress && (
              <div className="p-3 rounded-lg bg-white/60">
                <p className="text-xs text-slate-500 mb-1">ConsumerExampleV2</p>
                <div className="flex items-center justify-between">
                  <code className="text-sm font-mono text-slate-700">
                    {formatAddress(consumerExampleAddress)}
                  </code>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => copyToClipboard(consumerExampleAddress, "Contract address")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <a
                      href={getExplorerAddressUrl(consumerExampleAddress)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-slate-600 p-1"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Operators"
          value={contract.operatorCount.toString()}
          color="blue"
        />
        <StatCard
          icon={<Activity className="h-5 w-5" />}
          label="Current Round"
          value={contract.currentRound.toString()}
          color="emerald"
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="Total Requests"
          value={contract.requestCount.toString()}
          color="purple"
        />
        <StatCard
          icon={<Server className="h-5 w-5" />}
          label="Flat Fee"
          value={`${parseFloat(ethers.formatEther(contract.flatFee)).toFixed(4)} TON`}
          color="amber"
        />
      </div>
    </TabsContent>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "blue" | "emerald" | "purple" | "amber";
}) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    emerald: "from-emerald-500 to-emerald-600",
    purple: "from-purple-500 to-purple-600",
    amber: "from-amber-500 to-amber-600",
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-gradient-to-r ${colorClasses[color]} text-white`}>
            {icon}
          </div>
          <div>
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-lg font-bold text-slate-800">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
