"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, Database, Copy, ExternalLink, CheckCircle } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import { RollupDetailTabProps } from "../../../schemas/detail-tabs";
import { ThanosStackStatus } from "../../../schemas/thanos";
import toast from "react-hot-toast";

const PREDEPLOY_ADDRESSES: Record<string, string> = {
  EntryPoint: "0x4200000000000000000000000000000000000063",
  SimplePriceOracle: "0x4200000000000000000000000000000000000066",
  MultiTokenPaymaster: "0x4200000000000000000000000000000000000067",
};

const MARKUP_PCT: Record<string, string> = {
  ETH: "5%",
  USDT: "3%",
  USDC: "3%",
};

export function ChainDataTab({ stack }: RollupDetailTabProps) {
  const [copiedAddr, setCopiedAddr] = useState<string | null>(null);

  if (!stack) return null;

  const feeToken = stack.config.feeToken;
  const isRunning = stack.status === ThanosStackStatus.DEPLOYED;
  const explorerUrl = stack.metadata?.explorerUrl;

  const copyAddr = async (addr: string, label: string) => {
    try {
      await navigator.clipboard.writeText(addr);
      setCopiedAddr(label);
      setTimeout(() => setCopiedAddr(null), 2000);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const explorerLink = (addr: string) =>
    explorerUrl ? `${explorerUrl}/address/${addr}` : null;

  return (
    <TabsContent value="chain-data" className="space-y-6">
      {/* AA Operator status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600">
              <Zap className="h-4 w-4 text-white" />
            </div>
            AA Operator
            <Badge
              className={
                isRunning
                  ? "bg-green-100 text-green-700 border-green-300"
                  : "bg-gray-100 text-gray-600 border-gray-300"
              }
              variant="outline"
            >
              {isRunning ? "● Running" : stack.status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Oracle section */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
              Oracle Configuration
            </p>
            <div className="space-y-2">
              {[
                { label: "Fee Token", value: feeToken ?? "—" },
                { label: "Markup", value: feeToken ? (MARKUP_PCT[feeToken] ?? "—") : "—" },
                { label: "Price Source", value: "CoinGecko" },
                { label: "Update Interval", value: "Every 10 minutes" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-1">
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className="text-sm font-mono font-medium text-slate-800">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t" />

          {/* Refill section */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
              EntryPoint Auto-Refill
            </p>
            <div className="space-y-2">
              {[
                { label: "Trigger Threshold", value: "0.5 TON" },
                { label: "Refill Amount", value: "5 TON" },
                { label: "Admin Wallet", value: stack.config.adminAccount || "—" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-1">
                  <span className="text-sm text-gray-500">{label}</span>
                  <span className="text-sm font-mono font-medium text-slate-800 truncate max-w-[220px]">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Predeploy addresses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600">
              <Database className="h-4 w-4 text-white" />
            </div>
            Predeploy Addresses
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(PREDEPLOY_ADDRESSES).map(([label, addr]) => {
            const link = explorerLink(addr);
            const copied = copiedAddr === label;
            return (
              <div
                key={label}
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800">{label}</p>
                  <p className="text-xs font-mono text-gray-500">{addr}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => copyAddr(addr, label)}
                    title="Copy address"
                  >
                    {copied ? (
                      <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-gray-400" />
                    )}
                  </Button>
                  {link && (
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" asChild>
                      <a href={link} target="_blank" rel="noopener noreferrer" title="View on explorer">
                        <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
