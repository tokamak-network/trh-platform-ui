"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, Info, Cloud, Monitor, Zap } from "lucide-react";
import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import type { CreateRollupFormData } from "../../schemas/create-rollup";
import { FEE_TOKEN_OPTIONS } from "../../schemas/preset";
import { useRollupCreationContext } from "../../context/RollupCreationContext";
import { AccountSetup } from "../steps/AccountSetup";
import { getDesktopBridge, DesktopAwsKeyInput } from "../steps/AwsConfig";
import { useState } from "react";

const AWS_REGIONS = [
  { value: "us-east-1", label: "US East (N. Virginia)" },
  { value: "us-east-2", label: "US East (Ohio)" },
  { value: "us-west-1", label: "US West (N. California)" },
  { value: "us-west-2", label: "US West (Oregon)" },
  { value: "ap-northeast-1", label: "Asia Pacific (Tokyo)" },
  { value: "ap-northeast-2", label: "Asia Pacific (Seoul)" },
  { value: "ap-southeast-1", label: "Asia Pacific (Singapore)" },
  { value: "eu-west-1", label: "Europe (Ireland)" },
  { value: "eu-central-1", label: "Europe (Frankfurt)" },
];

export function BasicInfoStep() {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<CreateRollupFormData>();

  const network = watch("presetBasicInfo.network");
  const feeToken = watch("presetBasicInfo.feeToken");
  const infraProvider = watch("presetBasicInfo.infraProvider") ?? "aws";

  const { state: rollupState } = useRollupCreationContext();
  const selectedPresetId = rollupState.selectedPreset?.id ?? null;

  const isAAPreset = selectedPresetId ? ["gaming", "full"].includes(selectedPresetId) : false;
  const showAANotice = isAAPreset && !!feeToken && feeToken !== "TON";
  const showNativeGasNotice = !isAAPreset && !!feeToken && feeToken !== "TON";

  const TESTNET_DEFAULT_BEACON_URL = "https://ethereum-sepolia-beacon-api.publicnode.com";

  useEffect(() => {
    if (network === "Testnet") {
      setValue("presetBasicInfo.l1BeaconUrl", TESTNET_DEFAULT_BEACON_URL);
    }
  }, [network, setValue]);

  return (
    <div className="space-y-6">
      {/* Infrastructure Provider */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-blue-500" />
            Infrastructure Provider
          </CardTitle>
          <p className="text-sm text-gray-500">
            Choose where your L2 nodes will run. Local Docker runs on your machine; AWS deploys to the cloud.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() =>
                setValue("presetBasicInfo.infraProvider", "aws", { shouldValidate: true })
              }
              className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                infraProvider === "aws"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <Cloud className={`h-8 w-8 ${infraProvider === "aws" ? "text-blue-500" : "text-gray-400"}`} />
              <span className="text-sm font-medium">AWS Cloud</span>
              <span className="text-xs text-gray-500 text-center">Deploy to AWS EKS (production-ready)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setValue("presetBasicInfo.infraProvider", "local", { shouldValidate: true });
                if (network === "Mainnet") {
                  setValue("presetBasicInfo.network", "Testnet", { shouldValidate: true });
                }
              }}
              className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                infraProvider === "local"
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <Monitor className={`h-8 w-8 ${infraProvider === "local" ? "text-blue-500" : "text-gray-400"}`} />
              <span className="text-sm font-medium">Local Docker</span>
              <span className="text-xs text-gray-500 text-center">Run on your machine via Docker Compose</span>
            </button>
          </div>
          {errors.presetBasicInfo?.infraProvider && (
            <p className="mt-2 text-xs text-red-500">
              {errors.presetBasicInfo.infraProvider.message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Chain Identity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-500" />
            Chain Identity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Chain Name */}
            <div className="space-y-2">
              <Label htmlFor="chainName">
                Chain Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="chainName"
                placeholder="my-rollup"
                {...register("presetBasicInfo.chainName")}
              />
              <p className="text-xs text-gray-500">
                Lowercase letters, numbers, and hyphens only (3-32 characters)
              </p>
              {errors.presetBasicInfo?.chainName && (
                <p className="text-xs text-red-500">
                  {errors.presetBasicInfo.chainName.message}
                </p>
              )}
            </div>

            {/* Network */}
            <div className="space-y-2">
              <Label htmlFor="network">
                Network <span className="text-red-500">*</span>
              </Label>
              <Select
                value={network}
                onValueChange={(val) =>
                  setValue("presetBasicInfo.network", val as "Testnet" | "Mainnet", {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select network" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Testnet">Testnet (Sepolia)</SelectItem>
                  <SelectItem value="Mainnet" disabled={infraProvider === "local"}>
                    Mainnet (Ethereum){infraProvider === "local" ? " — not available for local" : ""}
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.presetBasicInfo?.network && (
                <p className="text-xs text-red-500">
                  {errors.presetBasicInfo.network.message}
                </p>
              )}
            </div>

            {/* Fee Token */}
            <div className="space-y-2">
              <Label htmlFor="feeToken">
                Fee Token <span className="text-red-500">*</span>
              </Label>
              <Select
                value={feeToken ?? "TON"}
                onValueChange={(val) =>
                  setValue("presetBasicInfo.feeToken", val as "TON" | "ETH" | "USDT" | "USDC", {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger id="feeToken">
                  <SelectValue placeholder="Select fee token" />
                </SelectTrigger>
                <SelectContent>
                  {FEE_TOKEN_OPTIONS.map((token) => (
                    <SelectItem key={token.value} value={token.value}>
                      {token.symbol} - {token.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Native gas token for the rollup
              </p>
            </div>
          </div>

          {showAANotice && (
            <Alert className="border-purple-200 bg-purple-50">
              <Zap className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-sm text-purple-700">
                <strong>Account Abstraction Enabled</strong> — Using a non-TON fee token enables
                Account Abstraction. TON will be pre-deposited to fund the EntryPoint on your
                behalf. Your admin account must maintain a{" "}
                <strong>minimum TON balance</strong> to cover this deposit.
              </AlertDescription>
            </Alert>
          )}
          {showNativeGasNotice && (
            <Alert className="border-amber-200 bg-amber-50">
              <Info className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-sm text-amber-700">
                <strong>{feeToken}</strong> will be set as the native L2 gas token at genesis. All
                users pay transaction fees directly in <strong>{feeToken}</strong> — no paymaster or
                token conversion required.
              </AlertDescription>
            </Alert>
          )}
          {network === "Mainnet" && (
            <>
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  You are deploying to <strong>Mainnet</strong>. This involves real assets and
                  irreversible costs. Ensure all settings are correct before proceeding.
                </AlertDescription>
              </Alert>
              <div className="flex items-center space-x-2 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <Checkbox
                  id="preset-reuse-deployment"
                  checked={watch("presetBasicInfo.reuseDeployment") ?? true}
                  onCheckedChange={(checked) =>
                    setValue("presetBasicInfo.reuseDeployment", !!checked)
                  }
                />
                <div className="flex flex-col">
                  <Label
                    htmlFor="preset-reuse-deployment"
                    className="text-sm font-medium text-slate-900"
                  >
                    Reuse Existing Deployment
                  </Label>
                  <p className="text-xs text-slate-500">
                    Uses existing implementation contracts. Uncheck to deploy both implementation and proxy contracts from scratch.
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* L1 Connection */}
      <Card>
        <CardHeader>
          <CardTitle>L1 Connection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`grid grid-cols-1 ${network === "Mainnet" ? "md:grid-cols-2" : ""} gap-4`}>
            <div className="space-y-2">
              <Label htmlFor="l1RpcUrl">
                L1 RPC URL <span className="text-red-500">*</span>
              </Label>
              <Input
                id="l1RpcUrl"
                placeholder={
                  network === "Mainnet"
                    ? "https://eth-mainnet.g.alchemy.com/v2/..."
                    : "https://eth-sepolia.g.alchemy.com/v2/..."
                }
                {...register("presetBasicInfo.l1RpcUrl")}
              />
              {errors.presetBasicInfo?.l1RpcUrl && (
                <p className="text-xs text-red-500">
                  {errors.presetBasicInfo.l1RpcUrl.message}
                </p>
              )}
            </div>
            {network === "Mainnet" && (
              <div className="space-y-2">
                <Label htmlFor="l1BeaconUrl">
                  L1 Beacon URL <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="l1BeaconUrl"
                  placeholder="https://eth-mainnet.g.alchemy.com/v2/..."
                  {...register("presetBasicInfo.l1BeaconUrl")}
                />
                {errors.presetBasicInfo?.l1BeaconUrl && (
                  <p className="text-xs text-red-500">
                    {errors.presetBasicInfo.l1BeaconUrl.message}
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Account Setup — preset mode: seed phrase only, backend derives accounts */}
      <AccountSetup mode="preset" />

      {/* AWS Configuration */}
      {infraProvider === "aws" && (
        getDesktopBridge() ? (
          <PresetDesktopAwsConfig setValue={setValue} register={register} errors={errors} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>AWS Configuration</CardTitle>
              <p className="text-sm text-gray-500">
                AWS credentials for infrastructure deployment. These will be used to provision
                your rollup nodes.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="awsAccessKey">
                    Access Key ID <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="awsAccessKey"
                    placeholder="AKIA..."
                    {...register("presetBasicInfo.awsAccessKey")}
                  />
                  {errors.presetBasicInfo?.awsAccessKey && (
                    <p className="text-xs text-red-500">
                      {errors.presetBasicInfo.awsAccessKey.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="awsSecretKey">
                    Secret Access Key <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="awsSecretKey"
                    type="password"
                    placeholder="Enter secret key"
                    {...register("presetBasicInfo.awsSecretKey")}
                  />
                  {errors.presetBasicInfo?.awsSecretKey && (
                    <p className="text-xs text-red-500">
                      {errors.presetBasicInfo.awsSecretKey.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="awsRegion">
                  Region <span className="text-red-500">*</span>
                </Label>
                <Select
                  onValueChange={(val) =>
                    setValue("presetBasicInfo.awsRegion", val, { shouldValidate: true })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select AWS region" />
                  </SelectTrigger>
                  <SelectContent>
                    {AWS_REGIONS.map((region) => (
                      <SelectItem key={region.value} value={region.value}>
                        {region.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.presetBasicInfo?.awsRegion && (
                  <p className="text-xs text-red-500">
                    {errors.presetBasicInfo.awsRegion.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )
      )}

      {selectedPresetId && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            The selected preset will fill in advanced parameters (block time, batch
            frequency, etc.). You can review and adjust these in the next step.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PresetDesktopAwsConfig({ setValue, register, errors }: { setValue: any; register: any; errors: any }) {
  const [appliedRegion, setAppliedRegion] = useState<string | null>(null);

  if (appliedRegion) {
    const regionLabel = AWS_REGIONS.find((r) => r.value === appliedRegion)?.label ?? appliedRegion;
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800 font-medium">
              AWS credentials configured. Region: {regionLabel}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <DesktopAwsKeyInput
      onComplete={(creds) => {
        setValue("presetBasicInfo.awsAccessKey", creds.accessKeyId);
        setValue("presetBasicInfo.awsSecretKey", creds.secretAccessKey);
        // Extract region from source (format: "manual:<region>")
        const region = creds.source.startsWith("manual:") ? creds.source.slice(7) : "us-east-1";
        setValue("presetBasicInfo.awsRegion", region, { shouldValidate: true });
        setAppliedRegion(region);
      }}
    />
  );
}
