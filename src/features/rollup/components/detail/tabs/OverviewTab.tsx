"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Eye, Link, Network, Zap, GitPullRequest, ArrowLeftRight, Dices, Server, Database, Copy, ExternalLink } from "lucide-react";
import { RollupDetailTabProps } from "../../../schemas/detail-tabs";
import { TabsContent } from "@/components/ui/tabs";
import { formatDate } from "../../../utils/dateUtils";
import { downloadThanosRollupConfig } from "../../../services/rollupService";
import { useRegisterMetadataDAOQuery } from "../../../api/queries";
import { useDRBDeploymentInfo } from "@/features/drb/api/queries";
import toast from "react-hot-toast";

export function OverviewTab({ stack }: RollupDetailTabProps) {
  const { data: metadataData } = useRegisterMetadataDAOQuery(stack?.id);
  const isSystemStack = stack?.name?.includes("(System)") || false;
  const { deploymentInfo, isCompleted: isDRBCompleted, nodeType } = useDRBDeploymentInfo(stack?.id || "");

  if (!stack) return null;

  if (isSystemStack && isDRBCompleted && deploymentInfo) {
    return <DRBOverview stack={stack} deploymentInfo={deploymentInfo} nodeType={nodeType} />;
  }

  const rollup = {
    network: stack.network,
    l1ChainId: stack.metadata?.l1ChainId?.toString() || "Not available",
    l2ChainId: stack.metadata?.l2ChainId?.toString() || "Not available",
    rpcUrl: stack.metadata?.l2RpcUrl || "Not available",
    created: formatDate(stack.created_at),
    explorerUrl: stack.metadata?.explorerUrl || "#",
    bridgeUrl: stack.metadata?.bridgeUrl || "#",
    l2L1CrossTradeUrl: stack.metadata?.l2L1CrossTradeUrl || "#",
    l2L2CrossTradeUrl: stack.metadata?.l2L2CrossTradeUrl || "#",
    grafanaUrl: stack.metadata?.grafanaUrl || "#",
    layer1: stack.metadata?.layer1 || "Not available",
    layer2: stack.metadata?.layer2 || "Not available",
    metadataPrUrl: metadataData?.info?.pr_link || "#",
  };

  const handleDownloadConfig = async () => {
    if (!stack.id) return;

    try {
      await downloadThanosRollupConfig(stack.id);
    } catch (error) {
      console.error("Failed to download rollup config:", error);
      toast.error("Failed to download rollup config");
    }
  };

  // Helper function to build explorer URL with contract address
  const getContractExplorerUrl = (address: string) => {
    if (rollup.explorerUrl === "#" || !address) return "#";
    // Remove trailing slash if present and append address path
    const baseUrl = rollup.explorerUrl.replace(/\/$/, "");
    return `${baseUrl}/address/${address}`;
  };

  return (
    <TabsContent value="overview" className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600">
                <Network className="h-4 w-4 text-white" />
              </div>
              Network Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Layer 1", value: rollup.layer1 },
              { label: "L1 Chain ID", value: rollup.l1ChainId, mono: true },
              { label: "Layer 2", value: rollup.layer2 },
              { label: "L2 Chain ID", value: rollup.l2ChainId, mono: true },
              {
                label: "RPC URL",
                value: rollup.rpcUrl,
                mono: true,
                link: true,
              },
              { label: "Created", value: rollup.created },
            ].map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-2 rounded-lg hover:bg-white/50 transition-colors duration-200"
              >
                <span className="text-sm font-medium text-slate-700">
                  {item.label}:
                </span>
                <span
                  className={`text-sm ${item.mono ? "font-mono" : ""} ${
                    item.link
                      ? "text-blue-600 hover:text-cyan-400"
                      : "text-slate-800"
                  } font-medium`}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-cyan-50 to-cyan-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600">
                <Zap className="h-4 w-4 text-white" />
              </div>
              Quick Links
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {rollup.explorerUrl !== "#" && (
              <Button
                variant="outline"
                className="w-full justify-start bg-white/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl hover:bg-gradient-to-r hover:from-blue-500 hover:to-cyan-400 hover:text-white transition-all duration-200"
                asChild
              >
                <a
                  href={rollup.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Block Explorer
                </a>
              </Button>
            )}
            {rollup.bridgeUrl !== "#" && (
              <Button
                variant="outline"
                className="w-full justify-start bg-white/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl hover:bg-gradient-to-r hover:from-blue-500 hover:to-cyan-400 hover:text-white transition-all duration-200"
                asChild
              >
                <a
                  href={rollup.bridgeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Link className="w-4 h-4 mr-2" />
                  Token Bridge
                </a>
              </Button>
            )}
            {rollup.explorerUrl !== "#" && (
              <Button
                variant="outline"
                className="w-full justify-start bg-white/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl hover:bg-gradient-to-r hover:from-blue-500 hover:to-cyan-400 hover:text-white transition-all duration-200"
                asChild
              >
                <a
                  href={rollup.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ArrowLeftRight className="w-4 h-4 mr-2" />
                  Block Explorer
                </a>
              </Button>
            )}
            {rollup.l2L1CrossTradeUrl !== "#" && (
              <Button
                variant="outline"
                className="w-full justify-start bg-white/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl hover:bg-gradient-to-r hover:from-blue-500 hover:to-cyan-400 hover:text-white transition-all duration-200"
                asChild
              >
                <a
                  href={rollup.l2L1CrossTradeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ArrowLeftRight className="w-4 h-4 mr-2" />
                  L2-L1 Cross Trade
                </a>
              </Button>
            )}
            {rollup.l2L2CrossTradeUrl !== "#" && (
              <Button
                variant="outline"
                className="w-full justify-start bg-white/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl hover:bg-gradient-to-r hover:from-blue-500 hover:to-cyan-400 hover:text-white transition-all duration-200"
                asChild
              >
                <a
                  href={rollup.l2L2CrossTradeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ArrowLeftRight className="w-4 h-4 mr-2" />
                  L2-L2 Cross Trade
                </a>
              </Button>
            )}
            {rollup.grafanaUrl !== "#" && (
              <Button
                variant="outline"
                className="w-full justify-start bg-white/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl hover:bg-gradient-to-r hover:from-blue-500 hover:to-cyan-400 hover:text-white transition-all duration-200"
                asChild
              >
                <a
                  href={rollup.grafanaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Network className="h-4 w-4 mr-2" />
                  Grafana Dashboard
                </a>
              </Button>
            )}
            {rollup.metadataPrUrl !== "#" && (
              <Button
                variant="outline"
                className="w-full justify-start bg-white/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl hover:bg-gradient-to-r hover:from-blue-500 hover:to-cyan-400 hover:text-white transition-all duration-200"
                asChild
              >
                <a
                  href={rollup.metadataPrUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <GitPullRequest className="h-4 w-4 mr-2" />
                  Metadata PR
                </a>
              </Button>
            )}
            <Button
              variant="outline"
              className="w-full justify-start bg-white/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl hover:bg-gradient-to-r hover:from-blue-500 hover:to-cyan-400 hover:text-white transition-all duration-200"
              onClick={handleDownloadConfig}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Config
            </Button>
            {rollup.explorerUrl === "#" &&
              rollup.bridgeUrl === "#" &&
              rollup.l2L1CrossTradeUrl === "#" &&
              rollup.l2L2CrossTradeUrl === "#" &&
              rollup.grafanaUrl === "#" &&
              rollup.metadataPrUrl === "#" && (
                <div className="text-center py-4 text-slate-600">
                  No external links available for this rollup
                </div>
              )}
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  );
}

import { ThanosStack } from "../../../schemas/thanos";
import { DRBDeploymentInfo, DRBNodeType } from "@/features/drb/services/drbService";

interface DRBOverviewProps {
  stack: ThanosStack;
  deploymentInfo: DRBDeploymentInfo;
  nodeType?: DRBNodeType;
}

function DRBOverview({ stack, deploymentInfo, nodeType }: DRBOverviewProps) {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const { leaderInfo, regularNodeInfo } = deploymentInfo;
  const isLeader = nodeType === "leader";

  return (
    <TabsContent value="overview" className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 to-purple-100">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-3 text-slate-800">
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 shadow-lg">
                <Dices className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg">DRB {isLeader ? "Leader" : "Regular"} Node</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-2">
            {isLeader && leaderInfo && (
              <>
                <InfoRow
                  label="Leader URL"
                  value={leaderInfo.leaderUrl}
                  mono
                  copyable
                  onCopy={() => copyToClipboard(leaderInfo.leaderUrl, "Leader URL")}
                />
                <InfoRow
                  label="Leader IP"
                  value={leaderInfo.leaderIp}
                  mono
                  copyable
                  onCopy={() => copyToClipboard(leaderInfo.leaderIp, "Leader IP")}
                />
                <InfoRow
                  label="Leader Port"
                  value={leaderInfo.leaderPort.toString()}
                  mono
                />
                <InfoRow
                  label="Peer ID"
                  value={leaderInfo.leaderPeerId}
                  mono
                  copyable
                  truncate
                  onCopy={() => copyToClipboard(leaderInfo.leaderPeerId, "Peer ID")}
                />
                <InfoRow
                  label="Leader EOA"
                  value={leaderInfo.leaderEoa}
                  mono
                  copyable
                  truncate
                  onCopy={() => copyToClipboard(leaderInfo.leaderEoa, "Leader EOA")}
                />
              </>
            )}
            {!isLeader && regularNodeInfo && (
              <>
                <InfoRow
                  label="Node URL"
                  value={regularNodeInfo.nodeUrl}
                  mono
                  copyable
                  onCopy={() => copyToClipboard(regularNodeInfo.nodeUrl, "Node URL")}
                />
                <InfoRow
                  label="Node IP"
                  value={regularNodeInfo.nodeIp}
                  mono
                  copyable
                  onCopy={() => copyToClipboard(regularNodeInfo.nodeIp, "Node IP")}
                />
                <InfoRow
                  label="Node Port"
                  value={regularNodeInfo.nodePort.toString()}
                  mono
                />
                {regularNodeInfo.nodePeerId && (
                  <InfoRow
                    label="Peer ID"
                    value={regularNodeInfo.nodePeerId}
                    mono
                    copyable
                    truncate
                    onCopy={() => copyToClipboard(regularNodeInfo.nodePeerId!, "Peer ID")}
                  />
                )}
                <InfoRow
                  label="Node EOA"
                  value={regularNodeInfo.nodeEoa}
                  mono
                  copyable
                  truncate
                  onCopy={() => copyToClipboard(regularNodeInfo.nodeEoa, "Node EOA")}
                />
              </>
            )}
            <InfoRow
              label="Database"
              value={deploymentInfo.databaseType === "rds" ? "Amazon RDS (PostgreSQL)" : "Local PostgreSQL"}
            />
            <InfoRow
              label="Deployed"
              value={formatDate(isLeader ? leaderInfo?.deploymentTimestamp : regularNodeInfo?.deploymentTimestamp)}
            />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-3 text-slate-800">
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg">
                <Network className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg">Contract & Network</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-2">
            {isLeader && leaderInfo && (
              <>
                <InfoRow
                  label="Contract"
                  value={leaderInfo.commitReveal2L2Address}
                  mono
                  copyable
                  truncate
                  onCopy={() => copyToClipboard(leaderInfo.commitReveal2L2Address, "Contract Address")}
                />
                {leaderInfo.consumerExampleV2Address && (
                  <InfoRow
                    label="Consumer Example"
                    value={leaderInfo.consumerExampleV2Address}
                    mono
                    copyable
                    truncate
                    onCopy={() => copyToClipboard(leaderInfo.consumerExampleV2Address!, "Consumer Example")}
                  />
                )}
                <InfoRow
                  label="Chain ID"
                  value={leaderInfo.chainId.toString()}
                  mono
                />
                <InfoRow
                  label="RPC URL"
                  value={leaderInfo.rpcUrl}
                  mono
                  copyable
                  onCopy={() => copyToClipboard(leaderInfo.rpcUrl, "RPC URL")}
                />
                <InfoRow
                  label="EKS Cluster"
                  value={leaderInfo.clusterName}
                  mono
                />
                <InfoRow
                  label="Namespace"
                  value={leaderInfo.namespace}
                  mono
                />
              </>
            )}
            {!isLeader && regularNodeInfo && (
              <>
                <InfoRow
                  label="Contract"
                  value={regularNodeInfo.contractAddress}
                  mono
                  copyable
                  truncate
                  onCopy={() => copyToClipboard(regularNodeInfo.contractAddress, "Contract Address")}
                />
                <InfoRow
                  label="Chain ID"
                  value={regularNodeInfo.chainId.toString()}
                  mono
                />
                <InfoRow
                  label="RPC URL"
                  value={regularNodeInfo.rpcUrl}
                  mono
                  copyable
                  onCopy={() => copyToClipboard(regularNodeInfo.rpcUrl, "RPC URL")}
                />
                <InfoRow
                  label="Leader IP"
                  value={regularNodeInfo.leaderIp}
                  mono
                  copyable
                  onCopy={() => copyToClipboard(regularNodeInfo.leaderIp, "Leader IP")}
                />
                <InfoRow
                  label="Leader Peer ID"
                  value={regularNodeInfo.leaderPeerId}
                  mono
                  copyable
                  truncate
                  onCopy={() => copyToClipboard(regularNodeInfo.leaderPeerId, "Leader Peer ID")}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-xl bg-gradient-to-br from-cyan-50 to-cyan-100">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-3 text-slate-800">
            <div className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 shadow-lg">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg">Quick Links</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 pt-2">
          <Button
            variant="outline"
            className="bg-white/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl hover:bg-gradient-to-r hover:from-purple-500 hover:to-purple-400 hover:text-white transition-all duration-200"
            asChild
          >
            <a
              href="https://github.com/tokamak-network/Commit-Reveal2"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Documentation
            </a>
          </Button>
          {isLeader && leaderInfo && (
            <Button
              variant="outline"
              className="bg-white/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl hover:bg-gradient-to-r hover:from-blue-500 hover:to-cyan-400 hover:text-white transition-all duration-200"
              onClick={() => copyToClipboard(
                `Leader IP: ${leaderInfo.leaderIp}\nLeader Port: ${leaderInfo.leaderPort}\nPeer ID: ${leaderInfo.leaderPeerId}\nLeader EOA: ${leaderInfo.leaderEoa}\nContract: ${leaderInfo.commitReveal2L2Address}`,
                "Leader connection info"
              )}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Connection Info
            </Button>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}

interface InfoRowProps {
  label: string;
  value?: string;
  mono?: boolean;
  copyable?: boolean;
  truncate?: boolean;
  onCopy?: () => void;
}

function InfoRow({ label, value, mono, copyable, truncate, onCopy }: InfoRowProps) {
  if (!value) return null;

  return (
    <div className="flex flex-col gap-1 p-3 rounded-lg bg-white/40 hover:bg-white/60 transition-colors duration-200 group">
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
      <div className="flex items-center justify-between gap-2">
        <span
          className={`text-sm text-slate-800 font-semibold break-all ${mono ? "font-mono text-xs" : ""}`}
          title={value}
        >
          {truncate && value.length > 42 ? `${value.slice(0, 20)}...${value.slice(-18)}` : value}
        </span>
        {copyable && onCopy && (
          <button
            onClick={onCopy}
            className="shrink-0 p-1.5 hover:bg-white rounded-md transition-colors border border-transparent hover:border-slate-200"
            title="Copy to clipboard"
          >
            <Copy className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600" />
          </button>
        )}
      </div>
    </div>
  );
}
