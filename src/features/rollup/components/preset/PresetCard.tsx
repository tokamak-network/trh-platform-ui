"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Layers,
  TrendingUp,
  Gamepad2,
  Building2,
  CheckCircle2,
} from "lucide-react";
import type { PresetSummary } from "../../schemas/preset";
import { getPresetUIMetadata } from "../../schemas/preset";

const PRESET_ICONS: Record<string, React.ReactNode> = {
  layers: <Layers className="h-8 w-8" />,
  "trending-up": <TrendingUp className="h-8 w-8" />,
  "gamepad-2": <Gamepad2 className="h-8 w-8" />,
  "building-2": <Building2 className="h-8 w-8" />,
};

const PRESET_COLORS: Record<string, string> = {
  general: "text-blue-500 bg-blue-50 border-blue-200",
  defi: "text-green-500 bg-green-50 border-green-200",
  gaming: "text-purple-500 bg-purple-50 border-purple-200",
  full: "text-orange-500 bg-orange-50 border-orange-200",
};

const PRESET_SELECTED_COLORS: Record<string, string> = {
  general: "border-blue-500 ring-2 ring-blue-500 ring-offset-2",
  defi: "border-green-500 ring-2 ring-green-500 ring-offset-2",
  gaming: "border-purple-500 ring-2 ring-purple-500 ring-offset-2",
  full: "border-orange-500 ring-2 ring-orange-500 ring-offset-2",
};

interface PresetCardProps {
  preset: PresetSummary;
  isSelected: boolean;
  onClick: () => void;
}

export function PresetCard({ preset, isSelected, onClick }: PresetCardProps) {
  const uiMeta = getPresetUIMetadata(preset.id);
  const iconColors = PRESET_COLORS[preset.id] ?? "text-gray-500 bg-gray-50 border-gray-200";
  const selectedRing =
    PRESET_SELECTED_COLORS[preset.id] ?? "border-gray-500 ring-2 ring-gray-500 ring-offset-2";

  return (
    <Card
      className={cn(
        "relative cursor-pointer transition-all duration-200 hover:shadow-md border-2",
        isSelected ? selectedRing : "border-transparent hover:border-gray-200"
      )}
      onClick={onClick}
    >
      {isSelected && (
        <div className="absolute top-3 right-3 text-green-500">
          <CheckCircle2 className="h-5 w-5" />
        </div>
      )}
      <CardContent className="p-6">
        <div className="flex flex-col gap-4">
          {/* Icon */}
          <div
            className={cn(
              "w-14 h-14 rounded-xl flex items-center justify-center border",
              iconColors
            )}
          >
            {PRESET_ICONS[uiMeta.icon] ?? <Layers className="h-8 w-8" />}
          </div>

          {/* Name & Description */}
          <div>
            <h3 className="text-lg font-semibold">{preset.name === "General Purpose" ? "General" : preset.name}</h3>
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">
              {preset.description}
            </p>
          </div>

          {/* Recommended for */}
          <div className="flex flex-wrap gap-1.5">
            {uiMeta.recommendedFor.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-xs font-normal"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
