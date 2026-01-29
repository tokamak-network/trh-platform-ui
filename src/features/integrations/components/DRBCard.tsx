"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle, ExternalLink, Server, Database, FileCode } from "lucide-react";
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
  const leaderInfo = info?.leaderInfo;
  const contract = info?.contract;

  if (!contract && !leaderInfo) {
    return (
      <div className="text-sm text-gray-600">
        No additional information available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Leader Node Information */}
      {leaderInfo && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Server className="w-4 h-4 text-amber-600" />
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
      {(contract || leaderInfo) && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileCode className="w-4 h-4 text-amber-600" />
            <h4 className="font-semibold text-gray-900">Smart Contracts</h4>
          </div>
          <div className="space-y-1">
            <InfoRow
              label="CommitReveal2L2"
              value={leaderInfo?.commitReveal2L2Address || contract?.contractAddress || ""}
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
              value={String(leaderInfo?.chainId || contract?.chainId)}
              itemId="chain-id"
              copiedItem={copiedItem}
              copyToClipboard={copyToClipboard}
            />
            {leaderInfo?.rpcUrl && (
              <InfoRow
                label="RPC URL"
                value={leaderInfo.rpcUrl}
                itemId="rpc-url"
                copiedItem={copiedItem}
                copyToClipboard={copyToClipboard}
                link
              />
            )}
          </div>
        </div>
      )}

      {/* Infrastructure Information */}
      {leaderInfo && (
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
  const leaderInfo = info?.leaderInfo;
  const contract = info?.contract;

  if (!contract && !leaderInfo && !info?.application) {
    return (
      <div className="text-sm text-gray-600">
        No additional information available
      </div>
    );
  }

  const leaderUrl = leaderInfo?.leaderUrl || info?.application?.leaderNodeUrl;
  const contractAddress = leaderInfo?.commitReveal2L2Address || contract?.contractAddress;
  const chainId = leaderInfo?.chainId || contract?.chainId;

  return (
    <div className="space-y-2 text-sm">
      {leaderUrl && (
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-amber-500" />
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
