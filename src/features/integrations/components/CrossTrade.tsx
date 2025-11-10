"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle, ExternalLink } from "lucide-react";
import { IntegrationInfo } from "@/features/integrations/schemas/integration";

interface CrossTradeCardProps {
  integration: {
    info?: IntegrationInfo;
    log_path?: string;
  };
  copiedItem: string | null;
  copyToClipboard: (text: string, itemId: string) => void;
}

export function CrossTradeCard({ integration, copiedItem, copyToClipboard }: CrossTradeCardProps) {
  if (integration.info?.contracts) {
    const contracts = integration.info.contracts;
    return (
      <div className="space-y-3">
        {integration.info?.url && (
          <div>
            <span className="font-medium text-gray-600">URL:</span>
            <div className="flex items-start gap-2 mt-1">
              <p className="text-gray-900 font-mono text-sm break-all flex-1">
                {integration.info.url}
              </p>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(integration.info?.url || "", "url")
                  }
                  className="h-6 w-6 p-0"
                >
                  {copiedItem === "url" ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(integration.info?.url || "", "_blank")}
                  className="h-6 w-6 p-0"
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        )}
        
        <div className="border-t pt-3">
          <h4 className="font-medium text-gray-900 mb-2">Contracts</h4>
          <div className="space-y-3 text-sm">
            <div>
              <span className="font-medium text-gray-600">Mode:</span>
              <p className="text-gray-900 mt-1">
                <span className="inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs font-medium">
                  {contracts.mode.toUpperCase()}
                </span>
              </p>
            </div>

            <div>
              <span className="font-medium text-gray-600">L1 Cross Trade Proxy Address:</span>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-gray-900 font-mono text-xs truncate flex-1">
                  {contracts.l1_cross_trade_proxy_address}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(
                      contracts.l1_cross_trade_proxy_address,
                      "l1_cross_trade_proxy_address"
                    )
                  }
                  className="h-6 w-6 p-0"
                >
                  {copiedItem === "l1_cross_trade_proxy_address" ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </div>

            <div>
              <span className="font-medium text-gray-600">L1 Cross Trade Address:</span>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-gray-900 font-mono text-xs truncate flex-1">
                  {contracts.l1_cross_trade_address}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(
                      contracts.l1_cross_trade_address,
                      "l1_cross_trade_address"
                    )
                  }
                  className="h-6 w-6 p-0"
                >
                  {copiedItem === "l1_cross_trade_address" ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </div>

            {Object.keys(contracts.l2_cross_trade_proxy_addresses).length > 0 && (
              <div>
                <span className="font-medium text-gray-600">L2 Cross Trade Proxy Addresses:</span>
                <div className="space-y-2 mt-1">
                  {Object.entries(contracts.l2_cross_trade_proxy_addresses).map(([rollupId, address]) => (
                    <div key={rollupId} className="flex items-center gap-2">
                      <span className="text-gray-600 text-xs">Rollup {rollupId}:</span>
                      <p className="text-gray-900 font-mono text-xs truncate flex-1">
                        {address}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(
                            address,
                            `l2_cross_trade_proxy_${rollupId}`
                          )
                        }
                        className="h-6 w-6 p-0"
                      >
                        {copiedItem === `l2_cross_trade_proxy_${rollupId}` ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Object.keys(contracts.l2_l2_cross_trade_addresses).length > 0 && (
              <div>
                <span className="font-medium text-gray-600">L2-L2 Cross Trade Addresses:</span>
                <div className="space-y-2 mt-1">
                  {Object.entries(contracts.l2_l2_cross_trade_addresses).map(([rollupId, address]) => (
                    <div key={rollupId} className="flex items-center gap-2">
                      <span className="text-gray-600 text-xs">Rollup {rollupId}:</span>
                      <p className="text-gray-900 font-mono text-xs truncate flex-1">
                        {address}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(
                            address,
                            `l2_l2_cross_trade_${rollupId}`
                          )
                        }
                        className="h-6 w-6 p-0"
                      >
                        {copiedItem === `l2_l2_cross_trade_${rollupId}` ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {integration.log_path && (
          <div className="border-t pt-3">
            <span className="font-medium text-gray-600">Log Path:</span>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-gray-900 font-mono text-xs break-all flex-1">
                {integration.log_path}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(integration.log_path || "", "log")}
                className="h-6 w-6 p-0"
              >
                {copiedItem === "log" ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="text-sm text-gray-600">
      No additional information available
    </div>
  );
}

export function RegisterCandidateCompactInfo({ integration }: { 
  integration: { 
    info?: { 
      candidate_registration?: {
        candidate_name: string;
        staking_amount: number;
      };
    }; 
  }; 
}) {
  if (
    integration.info?.candidate_registration
  ) {
    const reg = integration.info?.candidate_registration;
    return (
      <div className="text-sm text-gray-600">
        <p>
          <span className="font-medium">Candidate:</span> {reg.candidate_name}
        </p>
        <p>
          <span className="font-medium">Stake:</span> {reg.staking_amount} TON
        </p>
      </div>
    );
  }

  return (
    <div className="text-sm text-gray-600">
      No additional information available
    </div>
  );
}
