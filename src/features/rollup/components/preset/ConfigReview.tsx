"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Settings2, Info, Monitor, Zap } from "lucide-react";
import type { PresetDetail, PresetFieldOverride } from "../../schemas/preset";

interface ConfigReviewProps {
  preset: PresetDetail;
  network: "Testnet" | "Mainnet";
  onOverridesChange: (overrides: PresetFieldOverride[]) => void;
  feeToken?: string;
  infraProvider?: "aws" | "local";
}

const FIELD_LABELS: Record<string, { label: string; unit: string; description: string }> = {
  l2BlockTime: {
    label: "L2 Block Time",
    unit: "seconds",
    description: "Time between L2 blocks",
  },
  batchSubmissionFrequency: {
    label: "Batch Submission Frequency",
    unit: "seconds",
    description: "How often batches are submitted to L1",
  },
  outputRootFrequency: {
    label: "Output Root Frequency",
    unit: "seconds",
    description: "How often output roots are proposed",
  },
  challengePeriod: {
    label: "Challenge Period",
    unit: "seconds",
    description: "Time window for challenging invalid state (fixed for mainnet)",
  },
  backupEnabled: {
    label: "Enable Backup",
    unit: "",
    description: "Automatically backup rollup state",
  },
  registerCandidate: {
    label: "Register as DAO Candidate",
    unit: "",
    description: "Automatically register as a sequencer candidate in DAO",
  },
  feeToken: {
    label: "Fee Token",
    unit: "",
    description: "Native gas token for the rollup",
  },
};

export function ConfigReview({
  preset,
  network,
  onOverridesChange,
  feeToken,
  infraProvider = "aws",
}: ConfigReviewProps) {
  const [expertMode, setExpertMode] = useState(false);
  const [overrideValues, setOverrideValues] = useState<Record<string, string | number | boolean>>({});

  const handleFieldChange = (
    field: string,
    value: string | number | boolean
  ) => {
    const defaultValue = preset.chainDefaults[field];
    const updatedOverrides = { ...overrideValues };

    if (value === defaultValue || value === "") {
      delete updatedOverrides[field];
    } else {
      updatedOverrides[field] = value;
    }

    setOverrideValues(updatedOverrides);

    const overrideArray: PresetFieldOverride[] = Object.entries(updatedOverrides).map(
      ([f, v]) => ({ field: f, value: v })
    );
    onOverridesChange(overrideArray);
  };

  const changedFields = Object.keys(overrideValues);
  const isMainnet = network === "Mainnet";
  const MAINNET_CHALLENGE_PERIOD = 6048000;

  const isNonTonFeeToken = feeToken != null && feeToken !== "TON";

  return (
    <div className="space-y-4">
      {/* Local deployment info */}
      {infraProvider === "local" && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Monitor className="h-5 w-5" />
              Local Docker Deployment
            </CardTitle>
            <p className="text-sm text-blue-600">
              L2 nodes will run on your machine via Docker Compose. L1 contracts deploy to Sepolia.
            </p>
          </CardHeader>
        </Card>
      )}

      {/* AA paymaster notice — any preset with non-TON fee token */}
      {isNonTonFeeToken && (
        <Alert className="border-purple-200 bg-purple-50">
          <Zap className="h-4 w-4 text-purple-600" />
          <AlertDescription className="text-sm text-purple-700">
            <p><strong>Account Abstraction Enabled</strong> — Using a non-TON fee token enables Account Abstraction. TON will be pre-deposited to fund the EntryPoint on your behalf. Your admin account must maintain a <strong>minimum TON balance</strong> to cover this deposit.</p>
          </AlertDescription>
        </Alert>
      )}

      {/* Preset summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-500" />
              Preset Configuration Review
            </CardTitle>
            <Badge variant="outline" className="capitalize">
              {preset.name === "General Purpose" ? "General" : preset.name} Preset
            </Badge>
          </div>
          <p className="text-sm text-gray-500">{preset.description}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Expert Mode Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-3 bg-gray-50">
            <div className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Expert Mode</p>
                <p className="text-xs text-gray-500">
                  Customize editable parameters set by the preset
                </p>
              </div>
            </div>
            <Switch
              checked={expertMode}
              onCheckedChange={setExpertMode}
            />
          </div>

          <Separator />

          {/* Parameters */}
          <div className="space-y-3">
            {Object.entries(preset.chainDefaults).map(([field, defaultValue]) => {
              const meta = FIELD_LABELS[field];
              const isEditable = preset.overridableFields.includes(field);
              const isLockedOnMainnet = field === "challengePeriod" && isMainnet;
              // feeToken is set in Basic Info step — always read-only here
              const isFeeToken = field === "feeToken";
              // registerCandidate is under development — always read-only
              const isRegisterCandidate = field === "registerCandidate";
              const currentValue = isFeeToken
                ? (feeToken ?? defaultValue)
                : isLockedOnMainnet
                  ? MAINNET_CHALLENGE_PERIOD
                  : (overrideValues[field] ?? defaultValue);
              const isChanged = !isFeeToken && field in overrideValues;

              if (!meta) return null;

              return (
                <div
                  key={field}
                  className={`flex items-center justify-between rounded-lg border p-3 ${
                    isChanged ? "border-blue-200 bg-blue-50" : "bg-white"
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{meta.label}</p>
                      {isChanged && (
                        <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
                          Modified
                        </Badge>
                      )}
                      {isLockedOnMainnet && (
                        <Badge variant="secondary" className="text-xs">
                          Fixed (Mainnet)
                        </Badge>
                      )}
                      {isRegisterCandidate && (
                        <Badge variant="secondary" className="text-xs">
                          Coming Soon
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{meta.description}</p>
                  </div>

                  <div className="ml-4 flex items-center gap-2">
                    {expertMode && isEditable && !isLockedOnMainnet && !isFeeToken && !isRegisterCandidate ? (
                      typeof defaultValue === "boolean" ? (
                        <Switch
                          checked={Boolean(currentValue)}
                          onCheckedChange={(v) => handleFieldChange(field, v)}
                        />
                      ) : (
                        <div className="flex items-center gap-1">
                          <Input
                            className="w-24 h-8 text-sm text-right"
                            value={String(currentValue)}
                            onChange={(e) =>
                              handleFieldChange(field, e.target.value)
                            }
                          />
                          {meta.unit && (
                            <span className="text-xs text-gray-400">{meta.unit}</span>
                          )}
                        </div>
                      )
                    ) : (
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium tabular-nums">
                          {typeof defaultValue === "boolean"
                            ? Boolean(currentValue)
                              ? "Enabled"
                              : "Disabled"
                            : String(currentValue)}
                        </span>
                        {meta.unit && (
                          <span className="text-xs text-gray-400">{meta.unit}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {changedFields.length > 0 && (
            <Alert>
              <Settings2 className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {changedFields.length} parameter{changedFields.length > 1 ? "s" : ""}{" "}
                overridden from preset defaults:{" "}
                <strong>
                  {changedFields
                    .map((f) => FIELD_LABELS[f]?.label ?? f)
                    .join(", ")}
                </strong>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
