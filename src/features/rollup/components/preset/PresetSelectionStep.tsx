"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Loader2 } from "lucide-react";
import { usePresetsQuery } from "../../api/queries";
import { PresetCard } from "./PresetCard";
import type { PresetSummary } from "../../schemas/preset";

interface PresetSelectionStepProps {
  selectedPresetId: string | null;
  onSelect: (preset: PresetSummary) => void;
}

export function PresetSelectionStep({
  selectedPresetId,
  onSelect,
}: PresetSelectionStepProps) {
  const { data: presets, isLoading, error } = usePresetsQuery();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm">Loading presets...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="flex flex-col items-center gap-3 text-gray-500">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <p className="text-sm">Failed to load presets. Please try again.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose a Deployment Preset</CardTitle>
        <p className="text-sm text-gray-500">
          Select a preset that best matches your use case. You can fine-tune settings in
          the next step.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {presets?.map((preset) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              isSelected={selectedPresetId === preset.id}
              onClick={() => onSelect(preset)}
            />
          ))}
        </div>

        {selectedPresetId && (
          <p className="mt-4 text-sm text-green-600 font-medium">
            ✓ Preset selected. Click &quot;Next&quot; to continue.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
