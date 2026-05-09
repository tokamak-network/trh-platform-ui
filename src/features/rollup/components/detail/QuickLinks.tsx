"use client";

import React, { useState } from "react";
import { Copy, CheckCircle } from "lucide-react";
import { usePresetDetailQuery } from "../../api/queries";
import { getEnabledModules, MODULE_DISPLAY_ORDER, ModuleKey } from "../../schemas/preset";
import { ThanosStack, ThanosStackMetadata } from "../../schemas/thanos";

interface Props {
  stack: ThanosStack;
  metadataPrUrl?: string;
}

interface LinkConfig {
  label: string;
  icon: string;
  getUrl: (m: ThanosStackMetadata) => string | undefined;
}

const MODULE_LINK_CONFIG: Partial<Record<ModuleKey, LinkConfig>> = {
  blockExplorer: { label: "Block Explorer", icon: "🔭", getUrl: (m) => m.explorerUrl },
  bridge:        { label: "Token Bridge",   icon: "🌉", getUrl: (m) => m.bridgeUrl },
  monitoring:    { label: "Monitoring",     icon: "📊", getUrl: (m) => m.monitoringUrl ?? m.grafanaUrl },
  crossTrade:    { label: "CrossTrade",     icon: "🔁", getUrl: (m) => m.crossTradeUrl },
  uptimeService: { label: "Uptime Service", icon: "💚", getUrl: (m) => m.uptimeServiceUrl },
  // drb: no public URL — excluded from Quick Links
};

const FALLBACK_MODULES = MODULE_DISPLAY_ORDER.filter((key) => key in MODULE_LINK_CONFIG) as ModuleKey[];

export function QuickLinks({ stack, metadataPrUrl }: Props) {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const presetId = stack.config.presetId ?? stack.config.preset;
  const { data: presetDetail, isLoading, isError } = usePresetDetailQuery(presetId);

  const metadata: ThanosStackMetadata = stack.metadata ?? {};

  const moduleKeys: ModuleKey[] = !presetDetail || isError
    ? FALLBACK_MODULES
    : getEnabledModules(presetDetail).filter((key) => key in MODULE_LINK_CONFIG) as ModuleKey[];

  const cards = moduleKeys.map((key) => {
    const config = MODULE_LINK_CONFIG[key]!;
    return { key, label: config.label, icon: config.icon, url: config.getUrl(metadata) };
  });

  const prCard =
    metadataPrUrl && metadataPrUrl !== "#"
      ? { key: "pr", label: "Metadata PR", icon: "🔀", url: metadataPrUrl }
      : null;

  const allCards = prCard ? [...cards, prCard] : cards;

  const handleCopy = (e: React.MouseEvent, key: string, url: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedItem(key);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {Array(5).fill(null).map((_, i) => (
          <div
            key={i}
            aria-label="Loading..."
            className="rounded-xl border border-white/80 bg-white/40 p-3.5 animate-pulse h-16"
          />
        ))}
      </div>
    );
  }

  if (allCards.length === 0) {
    return (
      <p className="text-center py-4 text-sm text-slate-500">
        No external links available for this rollup
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {allCards.map((card) => {
        if (!card.url) {
          return (
            <div
              key={card.key}
              role="status"
              aria-disabled="true"
              className="relative rounded-xl border border-white/50 bg-white/30 p-3.5 opacity-60 cursor-not-allowed"
            >
              <div className="text-2xl mb-2 grayscale">{card.icon}</div>
              <p className="text-xs font-bold text-slate-500 leading-tight">{card.label}</p>
              <p className="text-[10px] text-slate-400 mt-1">Provisioning…</p>
            </div>
          );
        }

        return (
          <a
            key={card.key}
            href={card.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative rounded-xl border border-white/80 bg-white/60 p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg block"
          >
            <div className="text-2xl mb-2">{card.icon}</div>
            <p className="text-xs font-bold text-slate-700 leading-tight">{card.label}</p>
            <button
              className="absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-white"
              onClick={(e) => handleCopy(e, card.key, card.url!)}
              aria-label={`Copy ${card.label} URL`}
            >
              {copiedItem === card.key ? (
                <CheckCircle className="w-3 h-3 text-green-500" />
              ) : (
                <Copy className="w-3 h-3 text-slate-400" />
              )}
            </button>
          </a>
        );
      })}
    </div>
  );
}
