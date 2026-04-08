"use client";

import { cn } from "@/lib/utils";
import { Layers, TrendingUp, Gamepad2, Building2, CheckCircle2 } from "lucide-react";
import type { PresetSummary } from "../../schemas/preset";
import { getPresetUIMetadata, getEnabledModules } from "../../schemas/preset";

const PRESET_ICONS: Record<string, React.ReactNode> = {
  layers: <Layers className="h-5 w-5" />,
  "trending-up": <TrendingUp className="h-5 w-5" />,
  "gamepad-2": <Gamepad2 className="h-5 w-5" />,
  "building-2": <Building2 className="h-5 w-5" />,
};

const TOTAL_DOTS = 6;

interface PresetCardProps {
  preset: PresetSummary;
  isSelected: boolean;
  onClick: () => void;
}

export function PresetCard({
  preset,
  isSelected,
  onClick,
}: PresetCardProps) {
  const uiMeta = getPresetUIMetadata(preset.id);
  const enabledCount = getEnabledModules(preset).length;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className={cn(
        "relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200",
        "hover:-translate-y-px hover:shadow-sm",
        isSelected
          ? cn("ring-2 ring-offset-2", uiMeta.accentColor, uiMeta.accentBg)
          : "border-gray-200 bg-white hover:border-gray-300"
      )}
    >
      {/* Selected checkmark */}
      {isSelected && (
        <div className="absolute top-3 right-3 text-green-500">
          <CheckCircle2 className="h-4 w-4" />
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Icon box */}
        <div
          className={cn(
            "w-9 h-9 rounded-lg border flex items-center justify-center flex-shrink-0",
            isSelected
              ? cn(uiMeta.accentBg, uiMeta.accentColor)
              : "bg-gray-50 text-gray-500 border-gray-200"
          )}
        >
          {PRESET_ICONS[uiMeta.icon] ?? <Layers className="h-5 w-5" />}
        </div>

        {/* Name + subtitle + dots */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 leading-tight">
            {preset.name === "General Purpose" ? "General" : preset.name}
          </p>
          <p className="text-xs text-gray-500 mt-0.5 leading-snug">{uiMeta.subtitle}</p>

          {/* Dot indicators */}
          <div className="flex gap-1 mt-2">
            {Array.from({ length: TOTAL_DOTS }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-colors duration-200",
                  i < enabledCount ? uiMeta.dotColor : "bg-gray-200"
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
