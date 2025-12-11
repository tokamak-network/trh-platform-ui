"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, CheckCircle, ExternalLink, ArrowRightLeft } from "lucide-react";
import { IntegrationInfo } from "@/features/integrations/schemas/integration";

interface L2ChainConfigItem {
  chainId: number;
  chainName: string;
  [key: string]: unknown;
}

interface CrossTradeCardProps {
  integration: {
    info?: IntegrationInfo;
    log_path?: string;
    config?: {
      l2ChainConfig?: L2ChainConfigItem[];
      [key: string]: unknown;
    };
  };
  copiedItem: string | null;
  copyToClipboard: (text: string, itemId: string) => void;
}

export function CrossTradeCard({ integration, copiedItem, copyToClipboard }: CrossTradeCardProps) {
  // Create a mapping from chain_id to chain_name from integration.config.l2ChainConfig
  const chainNameMap = React.useMemo(() => {
    const map = new Map<number, string>();
    const l2ChainConfig = integration.config?.l2ChainConfig;
    if (Array.isArray(l2ChainConfig)) {
      l2ChainConfig.forEach((config) => {
        if (config.chainId && config.chainName) {
          map.set(config.chainId, config.chainName);
        }
      });
    }
    return map;
  }, [integration.config?.l2ChainConfig]);

  // Helper function to get chain name or fallback to chain_id
  const getChainName = (chainId: number): string => {
    return chainNameMap.get(chainId) || chainId.toString();
  };

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
          <h4 className="font-medium text-gray-900 mb-3">Contracts</h4>
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-600">Mode:</span>
              <Badge variant="secondary" className="font-semibold">
                {contracts.mode.toUpperCase()}
              </Badge>
            </div>

            <div className="rounded-lg border bg-gray-50/50 p-3 space-y-3">
              <h5 className="font-medium text-gray-700 text-xs uppercase tracking-wide">L1 Contracts</h5>
              
              <div className="space-y-2">
                <div>
                  <span className="text-xs font-medium text-gray-500 mb-1 block">Cross Trade Proxy Address</span>
                  <div className="flex items-center gap-2 bg-white rounded-md px-3 py-2 border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors">
                    <p className="text-gray-900 font-mono text-xs flex-1 break-all">
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
                      className="h-7 w-7 p-0 flex-shrink-0 hover:bg-blue-100"
                    >
                      {copiedItem === "l1_cross_trade_proxy_address" ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-medium text-gray-500 mb-1 block">Cross Trade Address</span>
                  <div className="flex items-center gap-2 bg-white rounded-md px-3 py-2 border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors">
                    <p className="text-gray-900 font-mono text-xs flex-1 break-all">
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
                      className="h-7 w-7 p-0 flex-shrink-0 hover:bg-blue-100"
                    >
                      {copiedItem === "l1_cross_trade_address" ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {Object.keys(contracts.l2_cross_trade_proxy_addresses).length > 0 && (
              <div className="rounded-lg border bg-gray-50/50 p-3 space-y-3">
                <h5 className="font-medium text-gray-700 text-xs uppercase tracking-wide">L2 Cross Trade Proxy Addresses</h5>
                <div className="space-y-2">
                  {Object.entries(contracts.l2_cross_trade_proxy_addresses).map(([rollupId, address]) => {
                    const chainId = parseInt(rollupId, 10);
                    return (
                      <div key={rollupId} className="space-y-1">
                        <Badge variant="outline" className="text-xs font-medium">
                          {getChainName(chainId)}
                        </Badge>
                        <div className="flex items-center gap-2 bg-white rounded-md px-3 py-2 border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors">
                          <p className="text-gray-900 font-mono text-xs flex-1 break-all">
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
                            className="h-7 w-7 p-0 flex-shrink-0 hover:bg-blue-100"
                          >
                            {copiedItem === `l2_cross_trade_proxy_${rollupId}` ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-500" />
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {Object.keys(contracts.l2_cross_trade_addresses).length > 0 && (
              <div className="rounded-lg border bg-gray-50/50 p-3 space-y-3">
                <h5 className="font-medium text-gray-700 text-xs uppercase tracking-wide">L2 Cross Trade Addresses</h5>
                <div className="space-y-2">
                  {Object.entries(contracts.l2_cross_trade_addresses).map(([rollupId, address]) => {
                    const chainId = parseInt(rollupId, 10);
                    return (
                      <div key={rollupId} className="space-y-1">
                        <Badge variant="outline" className="text-xs font-medium">
                          {getChainName(chainId)}
                        </Badge>
                        <div className="flex items-center gap-2 bg-white rounded-md px-3 py-2 border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors">
                          <p className="text-gray-900 font-mono text-xs flex-1 break-all">
                            {address}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              copyToClipboard(
                                address,
                                `l2_cross_trade_${rollupId}`
                              )
                            }
                            className="h-7 w-7 p-0 flex-shrink-0 hover:bg-blue-100"
                          >
                            {copiedItem === `l2_cross_trade_${rollupId}` ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-500" />
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {integration.info?.registered_tokens && integration.info.registered_tokens.length > 0 && (
          <div className="border-t pt-3">
            <h4 className="font-medium text-gray-900 mb-3">Registered Tokens</h4>
            <div className="space-y-3">
              {(() => {
                // Group tokens by token_name
                const tokensByName = new Map<string, NonNullable<IntegrationInfo['registered_tokens']>>();
                integration.info.registered_tokens.forEach((token) => {
                  const existing = tokensByName.get(token.token_name) || [];
                  tokensByName.set(token.token_name, [...existing, token]);
                });

                return Array.from(tokensByName.entries()).map(([tokenName, tokens]) => {
                  // Collect all unique chain pairs for this token
                  const chainPairs = new Set<string>();
                  const chainPairObjects: Array<{ chain1: string; chain2: string; chain1Id: number; chain2Id: number }> = [];
                  
                  tokens.forEach((token) => {
                    const chainIds = token.l2_token_inputs.map((input) => input.chain_id);
                    // Generate all pairs from the chain IDs
                    for (let i = 0; i < chainIds.length; i++) {
                      for (let j = i + 1; j < chainIds.length; j++) {
                        const pair = [chainIds[i], chainIds[j]].sort((a, b) => a - b);
                        const chain1Name = getChainName(pair[0]);
                        const chain2Name = getChainName(pair[1]);
                        const pairKey = `${chain1Name} <> ${chain2Name}`;
                        if (!chainPairs.has(pairKey)) {
                          chainPairs.add(pairKey);
                          chainPairObjects.push({
                            chain1: chain1Name,
                            chain2: chain2Name,
                            chain1Id: pair[0],
                            chain2Id: pair[1],
                          });
                        }
                      }
                    }
                  });

                  const sortedPairs = chainPairObjects.sort((a, b) => {
                    const aKey = `${a.chain1} <> ${a.chain2}`;
                    const bKey = `${b.chain1} <> ${b.chain2}`;
                    return aKey.localeCompare(bKey);
                  });

                  return (
                    <div key={tokenName} className="rounded-lg border bg-gray-50/50 p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-600 text-sm">Token Name:</span>
                        <Badge variant="secondary" className="font-semibold text-sm">
                          {tokenName}
                        </Badge>
                      </div>
                      {sortedPairs.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <ArrowRightLeft className="w-4 h-4 text-gray-500" />
                            <span className="font-medium text-gray-600 text-sm">Supported Bridges:</span>
                          </div>
                          <div className="space-y-2 pl-6">
                            {sortedPairs.map((pair, idx) => (
                              <div 
                                key={idx} 
                                className="flex items-center gap-2 text-sm bg-white rounded-md px-3 py-2 border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
                              >
                                <Badge variant="outline" className="font-medium text-xs">
                                  {pair.chain1}
                                </Badge>
                                <ArrowRightLeft className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                <Badge variant="outline" className="font-medium text-xs">
                                  {pair.chain2}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

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
