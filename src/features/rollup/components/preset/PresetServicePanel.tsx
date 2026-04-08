"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { PresetSummary } from "../../schemas/preset";
import {
  MODULE_METADATA,
  AA_SERVICE_METADATA,
  getEnabledModules,
  hasAASupport,
  getPresetUIMetadata,
} from "../../schemas/preset";

interface PresetServicePanelProps {
  preset: PresetSummary | null;
}

const TOTAL_COVERAGE = 5;

export function PresetServicePanel({ preset }: PresetServicePanelProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // Trigger stagger float-up animation when preset changes
  useEffect(() => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll<HTMLElement>("[data-svc]");
    const timers: ReturnType<typeof setTimeout>[] = [];
    items.forEach((el, i) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(12px)";
      timers.push(
        setTimeout(() => {
          el.style.transition = "opacity 0.3s ease, transform 0.3s ease";
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
        }, i * 70)
      );
    });
    return () => timers.forEach(clearTimeout);
  }, [preset?.id]);

  if (!preset) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[340px] gap-3 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/40">
        <span className="text-4xl opacity-30">⬡</span>
        <p className="text-sm text-center leading-relaxed text-gray-400">
          Select a preset to see<br />what gets auto-installed
        </p>
      </div>
    );
  }

  const uiMeta = getPresetUIMetadata(preset.id);
  const enabledModules = getEnabledModules(preset);
  const showAA = hasAASupport(preset);

  // Extract the text color class from accentColor (e.g. "border-blue-500 text-blue-600" → "text-blue-600")
  const accentTextClass = uiMeta.accentColor.split(" ").find((c) => c.startsWith("text-")) ?? "";

  return (
    <div
      className={cn(
        "border-2 rounded-xl overflow-hidden h-full flex flex-col transition-colors duration-300",
        uiMeta.accentColor
      )}
    >
      {/* Banner */}
      <div className={cn("px-5 py-4 border-b border-gray-100 relative overflow-hidden", uiMeta.accentBg)}>
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent pointer-events-none" />

        {/* Preset header */}
        <div className="relative flex items-center gap-3 mb-3">
          <div
            className={cn(
              "w-9 h-9 rounded-lg border flex items-center justify-center text-lg flex-shrink-0",
              uiMeta.accentBg,
              uiMeta.accentColor
            )}
          >
            ◈
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-tight">
              {preset.name === "General Purpose" ? "General" : preset.name}
            </p>
            <p className="text-xs text-gray-500">{uiMeta.tagline}</p>
          </div>
        </div>

        {/* Service count */}
        <div className="relative flex items-baseline gap-2">
          <span className={cn("text-4xl font-bold leading-none", accentTextClass)}>
            {enabledModules.length}
          </span>
          <span className="text-xs text-gray-500 leading-tight">
            <strong className="text-gray-700 font-semibold">services</strong>
            <br />auto-launch with your chain
          </span>
        </div>

        {/* Coverage bar */}
        <div className="relative flex gap-1 mt-3">
          {Array.from({ length: TOTAL_COVERAGE }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "flex-1 h-1 rounded-full transition-all duration-500",
                i < enabledModules.length ? uiMeta.dotColor : "bg-gray-200"
              )}
            />
          ))}
        </div>
      </div>

      {/* Service list */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5" ref={listRef}>
        {enabledModules.map((key) => {
          const meta = MODULE_METADATA[key];
          return (
            <div
              key={key}
              data-svc=""
              className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-100 relative overflow-hidden shadow-sm"
            >
              {/* Left accent bar */}
              <div className={cn("absolute left-0 top-0 bottom-0 w-0.5", meta.accentColor)} />
              {/* Icon box */}
              <div
                className={cn(
                  "w-9 h-9 rounded-lg border flex items-center justify-center text-base flex-shrink-0",
                  meta.iconBg
                )}
              >
                {meta.icon}
              </div>
              {/* Text */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">{meta.label}</p>
                <p className="text-xs text-gray-500 leading-relaxed mt-0.5">{meta.description}</p>
              </div>
              {/* Tag pill */}
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-gray-200 text-gray-500 flex-shrink-0">
                {meta.tag}
              </span>
            </div>
          );
        })}

        {/* Smart Account conditional section */}
        {showAA && (
          <>
            <div className="flex items-center gap-2 my-0.5">
              <div className="flex-1 border-t border-dashed border-gray-200" />
              <span className="text-[10px] font-medium text-amber-600 uppercase tracking-wide whitespace-nowrap">
                ◎ if non-TON fee token
              </span>
              <div className="flex-1 border-t border-dashed border-gray-200" />
            </div>
            <div
              data-svc=""
              className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-amber-200 bg-amber-50/60 relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-amber-400" />
              <div className="w-9 h-9 rounded-lg border border-amber-200 bg-amber-50 flex items-center justify-center text-base flex-shrink-0">
                {AA_SERVICE_METADATA.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">{AA_SERVICE_METADATA.label}</p>
                <p className="text-xs text-gray-500 leading-relaxed mt-0.5">
                  {AA_SERVICE_METADATA.description}
                </p>
              </div>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-amber-200 text-amber-600 flex-shrink-0 italic">
                AA
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
