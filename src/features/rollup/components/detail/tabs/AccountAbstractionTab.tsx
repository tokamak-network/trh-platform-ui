"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, Database, Copy, ExternalLink, CheckCircle, History, RefreshCw, AlertTriangle, TrendingDown, Wallet } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import { RollupDetailTabProps } from "../../../schemas/detail-tabs";
import { ThanosStackStatus } from "../../../schemas/thanos";
import { useEntryPointRefill, REFILL_TRIGGER_THRESHOLD, WARN_THRESHOLD, REFILL_AMOUNT, RefillStatus } from "../../../hooks/useEntryPointRefill";
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

const MAX_DISPLAY_BALANCE = 10; // TON — full bar width

function formatEta(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  if (seconds < 86400) return `${(seconds / 3600).toFixed(1)}h`;
  return `${(seconds / 86400).toFixed(1)}d`;
}

function formatTimestamp(unix?: number): string {
  if (!unix) return "—";
  const d = new Date(unix * 1000);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function statusConfig(status: RefillStatus) {
  switch (status) {
    case "critical":
      return {
        label: "Critical",
        barColor: "bg-red-500",
        badgeClass: "bg-red-100 text-red-700 border-red-300",
        icon: <AlertTriangle className="h-3.5 w-3.5" />,
      };
    case "warning":
      return {
        label: "Warning",
        barColor: "bg-yellow-500",
        badgeClass: "bg-yellow-100 text-yellow-700 border-yellow-300",
        icon: <TrendingDown className="h-3.5 w-3.5" />,
      };
    case "healthy":
      return {
        label: "Healthy",
        barColor: "bg-green-500",
        badgeClass: "bg-green-100 text-green-700 border-green-300",
        icon: <Zap className="h-3.5 w-3.5" />,
      };
    default:
      return {
        label: "Unknown",
        barColor: "bg-gray-300",
        badgeClass: "bg-gray-100 text-gray-500 border-gray-300",
        icon: <RefreshCw className="h-3.5 w-3.5" />,
      };
  }
}

export function AccountAbstractionTab({ stack }: RollupDetailTabProps) {
  const [copiedAddr, setCopiedAddr] = useState<string | null>(null);

  const refill = useEntryPointRefill(stack ?? undefined);

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

  // Refill data
  const rd = refill.data;
  const refillStatus = rd?.status ?? "unknown";
  const sc = statusConfig(refillStatus);
  const balanceNum = rd?.balanceNum ?? 0;
  const barPct = Math.min(100, (balanceNum / MAX_DISPLAY_BALANCE) * 100);
  const warnPct = (WARN_THRESHOLD / MAX_DISPLAY_BALANCE) * 100;
  const triggerPct = (REFILL_TRIGGER_THRESHOLD / MAX_DISPLAY_BALANCE) * 100;
  // Estimate remaining full refills
  const estimatedRefills = rd && rd.adminBalanceNum > 0
    ? Math.floor(rd.adminBalanceNum / REFILL_AMOUNT)
    : null;

  return (
    <TabsContent value="account-abstraction" className="space-y-6">
      {/* Smart Wallet Service status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600">
              <Zap className="h-4 w-4 text-white" />
            </div>
            Smart Wallet Service
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

          {/* EntryPoint Auto-Refill section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                EntryPoint Auto-Refill
              </p>
              {isRunning && (
                <div className="flex items-center gap-2">
                  {refill.isLoading && (
                    <RefreshCw className="h-3.5 w-3.5 text-gray-400 animate-spin" />
                  )}
                  {rd && (
                    <Badge variant="outline" className={`text-xs flex items-center gap-1 ${sc.badgeClass}`}>
                      {sc.icon}
                      {sc.label}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {!isRunning ? (
              <p className="text-sm text-gray-400 italic">Stack is not running</p>
            ) : refill.isLoading && !rd ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
              </div>
            ) : refill.isError ? (
              <p className="text-sm text-red-500">Failed to load balance data</p>
            ) : rd ? (
              <div className="space-y-4">
                {/* Balance display */}
                <div>
                  <div className="flex items-end justify-between mb-1.5">
                    <span className="text-2xl font-bold text-slate-800 leading-none">
                      {rd.balance}
                    </span>
                    <span className="text-sm text-gray-500 mb-0.5">TON</span>
                  </div>

                  {/* Progress bar */}
                  <div className="relative h-3 bg-gray-100 rounded-full overflow-visible">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${sc.barColor}`}
                      style={{ width: `${barPct}%` }}
                    />
                    {/* Warn threshold tick */}
                    <div
                      className="absolute top-0 bottom-0 w-px bg-yellow-400 opacity-70"
                      style={{ left: `${warnPct}%` }}
                      title={`Warn threshold: ${WARN_THRESHOLD} TON`}
                    />
                    {/* Trigger threshold tick */}
                    <div
                      className="absolute top-0 bottom-0 w-px bg-red-400 opacity-80"
                      style={{ left: `${triggerPct}%` }}
                      title={`Trigger threshold: ${REFILL_TRIGGER_THRESHOLD} TON`}
                    />
                  </div>

                  {/* Threshold labels */}
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                    <span>0</span>
                    <span
                      className="relative text-yellow-500"
                      style={{ marginLeft: `calc(${warnPct}% - 16px)` }}
                    >
                      {WARN_THRESHOLD}
                    </span>
                    <span>{MAX_DISPLAY_BALANCE} TON</span>
                  </div>
                </div>

                {/* Config rows */}
                <div className="space-y-2">
                  {[
                    { label: "Trigger Threshold", value: `${REFILL_TRIGGER_THRESHOLD} TON` },
                    { label: "Refill Amount", value: `${REFILL_AMOUNT} TON` },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center py-1">
                      <span className="text-sm text-gray-500">{label}</span>
                      <span className="text-sm font-mono font-medium text-slate-800">{value}</span>
                    </div>
                  ))}

                  {/* ETA */}
                  {rd.etaSeconds !== null && refillStatus === "healthy" && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-sm text-gray-500">ETA until refill trigger</span>
                      <span className="text-sm font-mono font-medium text-slate-800">
                        ~{formatEta(rd.etaSeconds)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Admin wallet */}
                <div className="rounded-lg border bg-gray-50 p-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <Wallet className="h-3.5 w-3.5" />
                    Admin Wallet
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono text-gray-500 truncate max-w-[180px]">
                      {stack.config.adminAccount || "—"}
                    </span>
                    <span className="text-sm font-mono font-semibold text-slate-800">
                      {rd.adminBalance} TON
                    </span>
                  </div>
                  {estimatedRefills !== null && (
                    <p className="text-[11px] text-gray-400">
                      ≈ {estimatedRefills} refill{estimatedRefills !== 1 ? "s" : ""} remaining
                    </p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* Refill History */}
      {isRunning && rd && rd.recentRefills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600">
                <History className="h-4 w-4 text-white" />
              </div>
              Refill History
              <span className="text-xs text-gray-400 font-normal ml-auto">last ~1h</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {rd.recentRefills.map((ev) => (
                <div
                  key={ev.transactionHash}
                  className="flex items-center justify-between rounded-lg border p-3 bg-green-50 border-green-100"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-mono text-green-700 font-medium">
                      +{ev.amount} TON
                    </p>
                    <p className="text-[11px] text-gray-400 font-mono truncate max-w-[200px]">
                      {ev.transactionHash.slice(0, 10)}…{ev.transactionHash.slice(-6)}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-xs text-gray-500">
                      {ev.timestamp ? formatTimestamp(ev.timestamp) : `block ${ev.blockNumber}`}
                    </p>
                    {explorerUrl && (
                      <a
                        href={`${explorerUrl}/tx/${ev.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-blue-500 hover:underline"
                      >
                        view tx
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
