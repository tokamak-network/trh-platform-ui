"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, CheckCircle, ExternalLink, Server, Database, FileCode, Crown, Cpu } from "lucide-react";
import { Integration } from "../schemas";

interface DRBCardProps {
  integration: Integration;
  copiedItem: string | null;
  copyToClipboard: (text: string, itemId: string) => void;
}

function CopyButton({ value, itemId, copiedItem, copyToClipboard }: { value: string; itemId: string; copiedItem: string | null; copyToClipboard: (text: string, itemId: string) => void }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => copyToClipboard(value, itemId)}
      className="h-6 w-6 p-0"
    >
      {copiedItem === itemId ? (
        <CheckCircle className="w-3 h-3 text-green-500" />
      ) : (
        <Copy className="w-3 h-3" />
      )}
    </Button>
  );
}

function InfoRow({ label, value, itemId, copiedItem, copyToClipboard, link }: {
  label: string;
  value: string;
  itemId: string;
  copiedItem: string | null;
  copyToClipboard: (text: string, itemId: string) => void;
  link?: boolean;
}) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-mono text-gray-900 max-w-[300px] truncate" title={value}>
          {value}
        </span>
        <CopyButton value={value} itemId={itemId} copiedItem={copiedItem} copyToClipboard={copyToClipboard} />
        {link && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(value, "_blank")}
            className="h-6 w-6 p-0"
          >
            <ExternalLink className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function DRBCard({ integration, copiedItem, copyToClipboard }: DRBCardProps) {
  const info = integration.info;
  const nodeType = info?.nodeType || "leader";
  const leaderInfo = info?.leaderInfo;
  const regularNodeInfo = info?.regularNodeInfo;
  const contract = info?.contract;
  const isRegularNode = nodeType === "regular";

  if (!contract && !leaderInfo && !regularNodeInfo) {
    return (
      <div className="text-sm text-gray-600">
        No additional information available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        {isRegularNode ? (
          <Badge className="bg-primary-100 text-primary-700">
            <Server className="w-3 h-3 mr-1" />
            Regular Node
          </Badge>
        ) : (
          <Badge className="bg-success-100 text-success-700">
            <Crown className="w-3 h-3 mr-1" />
            Leader Node
          </Badge>
        )}
      </div>

      {regularNodeInfo && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Server className="w-4 h-4 text-primary-600" />
            <h4 className="font-semibold text-gray-900">Regular Node</h4>
          </div>
          <div className="space-y-1">
            <InfoRow
              label="Node URL"
              value={regularNodeInfo.nodeUrl}
              itemId="node-url"
              copiedItem={copiedItem}
              copyToClipboard={copyToClipboard}
              link
            />
            <InfoRow
              label="Node IP"
              value={regularNodeInfo.nodeIp}
              itemId="node-ip"
              copiedItem={copiedItem}
              copyToClipboard={copyToClipboard}
            />
            <InfoRow
              label="Node Port"
              value={String(regularNodeInfo.nodePort)}
              itemId="node-port"
              copiedItem={copiedItem}
              copyToClipboard={copyToClipboard}
            />
            {regularNodeInfo.nodePeerId && (
              <InfoRow
                label="Node Peer ID"
                value={regularNodeInfo.nodePeerId}
                itemId="node-peer-id"
                copiedItem={copiedItem}
                copyToClipboard={copyToClipboard}
              />
            )}
            <InfoRow
              label="Node EOA"
              value={regularNodeInfo.nodeEoa}
              itemId="node-eoa"
              copiedItem={copiedItem}
              copyToClipboard={copyToClipboard}
            />
          </div>
        </div>
      )}

      {/* Connected Leader Info for regular nodes */}
      {regularNodeInfo && (
        <div className="bg-amber-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Crown className="w-4 h-4 text-amber-600" />
            <h4 className="font-semibold text-gray-900">Connected Leader</h4>
          </div>
          <div className="space-y-1">
            <InfoRow
              label="Leader IP"
              value={regularNodeInfo.leaderIp}
              itemId="connected-leader-ip"
              copiedItem={copiedItem}
              copyToClipboard={copyToClipboard}
            />
            <InfoRow
              label="Leader Port"
              value={String(regularNodeInfo.leaderPort)}
              itemId="connected-leader-port"
              copiedItem={copiedItem}
              copyToClipboard={copyToClipboard}
            />
            <InfoRow
              label="Leader Peer ID"
              value={regularNodeInfo.leaderPeerId}
              itemId="connected-leader-peer-id"
              copiedItem={copiedItem}
              copyToClipboard={copyToClipboard}
            />
            <InfoRow
              label="Leader EOA"
              value={regularNodeInfo.leaderEoa}
              itemId="connected-leader-eoa"
              copiedItem={copiedItem}
              copyToClipboard={copyToClipboard}
            />
            <InfoRow
              label="Contract Address"
              value={regularNodeInfo.contractAddress}
              itemId="connected-contract"
              copiedItem={copiedItem}
              copyToClipboard={copyToClipboard}
            />
          </div>
        </div>
      )}

      {/* Leader Node Info for leader nodes */}
      {leaderInfo && !isRegularNode && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Crown className="w-4 h-4 text-amber-600" />
            <h4 className="font-semibold text-gray-900">Leader Node</h4>
          </div>
          <div className="space-y-1">
            <InfoRow
              label="URL"
              value={leaderInfo.leaderUrl}
              itemId="leader-url"
              copiedItem={copiedItem}
              copyToClipboard={copyToClipboard}
              link
            />
            <InfoRow
              label="Peer ID"
              value={leaderInfo.leaderPeerId}
              itemId="leader-peer-id"
              copiedItem={copiedItem}
              copyToClipboard={copyToClipboard}
            />
            <InfoRow
              label="EOA Address"
              value={leaderInfo.leaderEoa}
              itemId="leader-eoa"
              copiedItem={copiedItem}
              copyToClipboard={copyToClipboard}
            />
            <InfoRow
              label="IP"
              value={leaderInfo.leaderIp}
              itemId="leader-ip"
              copiedItem={copiedItem}
              copyToClipboard={copyToClipboard}
            />
            <InfoRow
              label="Port"
              value={String(leaderInfo.leaderPort)}
              itemId="leader-port"
              copiedItem={copiedItem}
              copyToClipboard={copyToClipboard}
            />
          </div>
        </div>
      )}

      {/* Smart Contract Information */}
      {(contract || leaderInfo || regularNodeInfo) && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileCode className="w-4 h-4 text-amber-600" />
            <h4 className="font-semibold text-gray-900">Smart Contracts</h4>
          </div>
          <div className="space-y-1">
            <InfoRow
              label="CommitReveal2L2"
              value={leaderInfo?.commitReveal2L2Address || contract?.contractAddress || regularNodeInfo?.contractAddress || ""}
              itemId="contract-address"
              copiedItem={copiedItem}
              copyToClipboard={copyToClipboard}
            />
            {(leaderInfo?.consumerExampleV2Address || contract?.consumerExampleV2Address) && (
              <InfoRow
                label="ConsumerExampleV2"
                value={leaderInfo?.consumerExampleV2Address || contract?.consumerExampleV2Address || ""}
                itemId="consumer-address"
                copiedItem={copiedItem}
                copyToClipboard={copyToClipboard}
              />
            )}
            <InfoRow
              label="Chain ID"
              value={String(leaderInfo?.chainId || contract?.chainId || regularNodeInfo?.chainId)}
              itemId="chain-id"
              copiedItem={copiedItem}
              copyToClipboard={copyToClipboard}
            />
            {(leaderInfo?.rpcUrl || regularNodeInfo?.rpcUrl) && (
              <InfoRow
                label="RPC URL"
                value={leaderInfo?.rpcUrl || regularNodeInfo?.rpcUrl || ""}
                itemId="rpc-url"
                copiedItem={copiedItem}
                copyToClipboard={copyToClipboard}
                link
              />
            )}
          </div>
        </div>
      )}

      {/* Infra Info  Leader Node */}
      {leaderInfo && !isRegularNode && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Database className="w-4 h-4 text-amber-600" />
            <h4 className="font-semibold text-gray-900">Infrastructure</h4>
          </div>
          <div className="space-y-1">
            <InfoRow
              label="Cluster"
              value={leaderInfo.clusterName}
              itemId="cluster-name"
              copiedItem={copiedItem}
              copyToClipboard={copyToClipboard}
            />
            <InfoRow
              label="Namespace"
              value={leaderInfo.namespace}
              itemId="namespace"
              copiedItem={copiedItem}
              copyToClipboard={copyToClipboard}
            />
            <InfoRow
              label="Deployed At"
              value={new Date(leaderInfo.deploymentTimestamp).toLocaleString()}
              itemId="deployment-timestamp"
              copiedItem={copiedItem}
              copyToClipboard={copyToClipboard}
            />
            {info?.databaseType && (
              <InfoRow
                label="Database"
                value={info.databaseType.toUpperCase()}
                itemId="database-type"
                copiedItem={copiedItem}
                copyToClipboard={copyToClipboard}
              />
            )}
          </div>
        </div>
      )}

      {/* Infra Info  Regular Node */}
      {regularNodeInfo && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Cpu className="w-4 h-4 text-primary-600" />
            <h4 className="font-semibold text-gray-900">EC2 Instance</h4>
          </div>
          <div className="space-y-1">
            {regularNodeInfo.instanceId && (
              <InfoRow
                label="Instance ID"
                value={regularNodeInfo.instanceId}
                itemId="instance-id"
                copiedItem={copiedItem}
                copyToClipboard={copyToClipboard}
              />
            )}
            {regularNodeInfo.instanceType && (
              <InfoRow
                label="Instance Type"
                value={regularNodeInfo.instanceType}
                itemId="instance-type"
                copiedItem={copiedItem}
                copyToClipboard={copyToClipboard}
              />
            )}
            <InfoRow
              label="Region"
              value={regularNodeInfo.region}
              itemId="region"
              copiedItem={copiedItem}
              copyToClipboard={copyToClipboard}
            />
            <InfoRow
              label="Deployed At"
              value={new Date(regularNodeInfo.deploymentTimestamp).toLocaleString()}
              itemId="regular-deployment-timestamp"
              copiedItem={copiedItem}
              copyToClipboard={copyToClipboard}
            />
            {info?.databaseType && (
              <InfoRow
                label="Database"
                value={info.databaseType.toUpperCase()}
                itemId="database-type"
                copiedItem={copiedItem}
                copyToClipboard={copyToClipboard}
              />
            )}
          </div>
        </div>
      )}

      {/* Log Path */}
      {integration.log_path && (
        <div className="pt-2">
          <InfoRow
            label="Log Path"
            value={integration.log_path}
            itemId="log-path"
            copiedItem={copiedItem}
            copyToClipboard={copyToClipboard}
          />
        </div>
      )}
    </div>
  );
}

export function DRBCompactInfo({ integration }: { integration: Integration }) {
  const info = integration.info;
  const nodeType = info?.nodeType || "leader";
  const leaderInfo = info?.leaderInfo;
  const regularNodeInfo = info?.regularNodeInfo;
  const contract = info?.contract;
  const isRegularNode = nodeType === "regular";

  if (!contract && !leaderInfo && !regularNodeInfo && !info?.application) {
    return (
      <div className="text-sm text-gray-600">
        No additional information available
      </div>
    );
  }

  const leaderUrl = leaderInfo?.leaderUrl || info?.application?.leaderNodeUrl;
  const nodeUrl = regularNodeInfo?.nodeUrl;
  const contractAddress = leaderInfo?.commitReveal2L2Address || contract?.contractAddress || regularNodeInfo?.contractAddress;
  const chainId = leaderInfo?.chainId || contract?.chainId || regularNodeInfo?.chainId;

  return (
    <div className="space-y-2 text-sm">
      {/* Node Type Badge */}
      <div className="flex items-center gap-2 mb-2">
        {isRegularNode ? (
          <Badge className="bg-primary-100 text-primary-700 text-xs">
            <Server className="w-3 h-3 mr-1" />
            Regular Node
          </Badge>
        ) : (
          <Badge className="bg-success-100 text-success-700 text-xs">
            <Crown className="w-3 h-3 mr-1" />
            Leader Node
          </Badge>
        )}
      </div>

      {/* Regular Node URL */}
      {nodeUrl && (
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-primary-500" />
          <span className="text-gray-500">Node:</span>
          <a
            href={nodeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline font-mono truncate max-w-[250px]"
          >
            {nodeUrl}
          </a>
        </div>
      )}

      {/* Leader URL for leader nodes */}
      {leaderUrl && !isRegularNode && (
        <div className="flex items-center gap-2">
          <Crown className="w-4 h-4 text-amber-500" />
          <span className="text-gray-500">Leader:</span>
          <a
            href={leaderUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline font-mono truncate max-w-[250px]"
          >
            {leaderUrl}
          </a>
        </div>
      )}

      {contractAddress && (
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-amber-500" />
          <span className="text-gray-500">Contract:</span>
          <span className="font-mono text-gray-900 truncate max-w-[250px]" title={contractAddress}>
            {contractAddress.slice(0, 10)}...{contractAddress.slice(-8)}
          </span>
        </div>
      )}
      {chainId && (
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-amber-500" />
          <span className="text-gray-500">Chain ID:</span>
          <span className="font-mono text-gray-900">{chainId}</span>
        </div>
      )}
    </div>
  );
}
