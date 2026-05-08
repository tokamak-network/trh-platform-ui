"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle, Download, Link, Network, Zap } from "lucide-react";
import { RollupDetailTabProps } from "../../../schemas/detail-tabs";
import { TabsContent } from "@/components/ui/tabs";
import { formatDate } from "../../../utils/dateUtils";
import { downloadThanosRollupConfig } from "../../../services/rollupService";
import { useRegisterMetadataDAOQuery } from "../../../api/queries";
import { DeploymentProgressCard } from "../DeploymentProgressCard";
import toast from "react-hot-toast";

export function OverviewTab({ stack }: RollupDetailTabProps) {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  // Query to fetch metadata - must be called before any conditional returns
  const { data: metadataData } = useRegisterMetadataDAOQuery(stack?.id);

  if (!stack) return null;

  const copyToClipboard = async (text: string, itemId: string) => {
    if (text === "Not available") return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(itemId);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const rollup = {
    network: stack.network,
    l1ChainId: stack.metadata?.l1ChainId?.toString() || "Not available",
    l2ChainId: stack.metadata?.l2ChainId?.toString() || "Not available",
    rpcUrl: stack.metadata?.l2RpcUrl || "Not available",
    created: formatDate(stack.created_at),
    explorerUrl: stack.metadata?.explorerUrl || "#",
    bridgeUrl: stack.metadata?.bridgeUrl || "#",
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

  return (
    <TabsContent value="overview" className="space-y-6">
      <DeploymentProgressCard stackId={stack.id} />
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
              { label: "Layer 1", value: rollup.layer1, id: "layer1" },
              { label: "L1 Chain ID", value: rollup.l1ChainId, mono: true, id: "l1ChainId" },
              { label: "Layer 2", value: rollup.layer2, id: "layer2" },
              { label: "L2 Chain ID", value: rollup.l2ChainId, mono: true, id: "l2ChainId" },
              { label: "RPC URL", value: rollup.rpcUrl, mono: true, link: true, id: "rpcUrl" },
              { label: "Created", value: rollup.created, id: "created", noCopy: true },
            ].map((item) => {
              const canCopy = !item.noCopy && item.value !== "Not available";
              return (
                <div
                  key={item.id}
                  className={`flex justify-between items-center p-2 rounded-lg transition-colors duration-200 group ${canCopy ? "hover:bg-white/70 cursor-pointer" : "hover:bg-white/50"}`}
                  onClick={() => canCopy && copyToClipboard(item.value, item.id)}
                  title={canCopy ? "Click to copy" : undefined}
                >
                  <span className="text-sm font-medium text-slate-700">
                    {item.label}:
                  </span>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`text-sm ${item.mono ? "font-mono" : ""} ${
                        item.link ? "text-blue-600" : "text-slate-800"
                      } font-medium truncate max-w-[220px]`}
                    >
                      {item.value}
                    </span>
                    {copiedItem === item.id ? (
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                    ) : (
                      <Copy className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-opacity ${canCopy ? "opacity-0 group-hover:opacity-100" : "opacity-0 pointer-events-none"}`} />
                    )}
                  </div>
                </div>
              );
            })}
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
          <CardContent>
            {(() => {
              const links = [
                { key: "explorer", label: "Block Explorer", icon: "🔭", url: rollup.explorerUrl },
                { key: "bridge",   label: "Token Bridge",   icon: "🌉", url: rollup.bridgeUrl },
                { key: "grafana",  label: "Grafana Dashboard", icon: "📊", url: rollup.grafanaUrl },
                { key: "pr",       label: "Metadata PR",    icon: "🔀", url: rollup.metadataPrUrl },
              ].filter((l) => l.url !== "#");

              if (links.length === 0) {
                return <p className="text-center py-4 text-sm text-slate-500">No external links available for this rollup</p>;
              }

              return (
                <div className="grid grid-cols-2 gap-3">
                  {links.map((link) => (
                    <div
                      key={link.key}
                      className="group relative rounded-xl border border-white/80 bg-white/60 p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      {/* Card face */}
                      <div className="text-2xl mb-2">{link.icon}</div>
                      <p className="text-xs font-bold text-slate-700 leading-tight">{link.label}</p>

                      {/* Hover overlay — full URL + actions */}
                      <div className="absolute inset-0 rounded-xl bg-white/98 border border-cyan-200 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex flex-col justify-between p-3 shadow-lg">
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">{link.label}</p>
                          <p className="text-[11px] font-mono text-slate-700 break-all leading-relaxed">{link.url}</p>
                        </div>
                        <div className="flex gap-1.5 mt-2">
                          <button
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(link.url);
                              setCopiedItem(link.key);
                              setTimeout(() => setCopiedItem(null), 2000);
                            }}
                          >
                            {copiedItem === link.key ? (
                              <CheckCircle className="w-3 h-3 text-green-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            {copiedItem === link.key ? "Copied!" : "Copy"}
                          </button>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold text-white transition-colors"
                            style={{ background: "linear-gradient(135deg,#06b6d4,#0891b2)" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Link className="w-3 h-3" />
                            Open
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            <Button
              variant="outline"
              className="w-full justify-start mt-3 bg-white/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl hover:bg-gradient-to-r hover:from-blue-500 hover:to-cyan-400 hover:text-white transition-all duration-200"
              onClick={handleDownloadConfig}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Config
            </Button>
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  );
}
