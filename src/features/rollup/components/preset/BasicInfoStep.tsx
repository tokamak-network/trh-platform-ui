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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, AlertCircle, ExternalLink, Info, Cloud, Monitor, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import type { CreateRollupFormData } from "../../schemas/create-rollup";
import { FEE_TOKEN_OPTIONS } from "../../schemas/preset";
import { useRollupCreationContext } from "../../context/RollupCreationContext";
import { AccountSetup } from "../steps/AccountSetup";
import { getDesktopBridge, DesktopAwsKeyInput } from "../steps/AwsConfig";
import { RpcUrlSelector } from "@/components/molecules/RpcUrlSelector";
import { useRpcUrls } from "@/features/configuration/rpc-management/hooks/useRpcUrls";
import { useAwsCredentials } from "@/features/configuration/aws-credentials/hooks/useAwsCredentials";

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
  const infraProvider = watch("presetBasicInfo.infraProvider");

  const { state: rollupState } = useRollupCreationContext();
  const selectedPresetId = rollupState.selectedPreset?.id ?? null;

  const showAANotice = !!feeToken && feeToken !== "TON";

  const { rpcUrls } = useRpcUrls();
  const { awsCredentials, isLoading: isLoadingCredentials } = useAwsCredentials();

  const TESTNET_DEFAULT_BEACON_URL = "https://ethereum-sepolia-beacon-api.publicnode.com";

  const prevNetworkRef = useRef(network);
  useEffect(() => {
    if (network === "Testnet") {
      setValue("presetBasicInfo.l1BeaconUrl", TESTNET_DEFAULT_BEACON_URL);
    } else if (network === "Mainnet" && prevNetworkRef.current === "Testnet") {
      // Clear testnet default when switching to Mainnet so user selects a Mainnet beacon URL
      setValue("presetBasicInfo.l1BeaconUrl", "");
    }
    prevNetworkRef.current = network;
  }, [network, setValue]);

  useEffect(() => {
    if (infraProvider === "local" && network === "Mainnet") {
      setValue("presetBasicInfo.network", "Testnet", { shouldValidate: true });
    }
  }, [infraProvider, network, setValue]);

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
          {!infraProvider && (
            <p className="text-xs text-amber-600 mt-1">
              Please choose one to continue.
            </p>
          )}
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
                onValueChange={(val) => {
                  const next = val as "Testnet" | "Mainnet";
                  if (infraProvider === "local" && next === "Mainnet") return;
                  setValue("presetBasicInfo.network", next, {
                    shouldValidate: true,
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select network" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Testnet">Testnet (Sepolia)</SelectItem>
                  {infraProvider !== "local" && (
                    <SelectItem value="Mainnet">Mainnet (Ethereum)</SelectItem>
                  )}
                </SelectContent>
              </Select>
              {infraProvider === "local" && (
                <p className="text-xs text-gray-500">
                  Mainnet is not available for local deployments.
                </p>
              )}
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
                <p><strong>Account Abstraction Enabled</strong> — Using a non-TON fee token enables Account Abstraction. TON will be pre-deposited to fund the EntryPoint on your behalf. Your admin account must maintain a <strong>minimum TON balance</strong> to cover this deposit.</p>
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
            <RpcUrlSelector
              id="l1RpcUrl"
              label="L1 RPC URL"
              required
              placeholder={
                network === "Mainnet"
                  ? "https://eth-mainnet.g.alchemy.com/v2/..."
                  : "https://eth-sepolia.g.alchemy.com/v2/..."
              }
              value={watch("presetBasicInfo.l1RpcUrl") ?? ""}
              onChange={(val) => setValue("presetBasicInfo.l1RpcUrl", val, { shouldValidate: true })}
              rpcUrls={rpcUrls}
              urlType="ExecutionLayer"
              network={network}
              error={errors.presetBasicInfo?.l1RpcUrl?.message}
            />
            {network === "Mainnet" && (
              <RpcUrlSelector
                id="l1BeaconUrl"
                label="L1 Beacon URL"
                required
                placeholder="https://eth-mainnet.g.alchemy.com/v2/..."
                value={watch("presetBasicInfo.l1BeaconUrl") ?? ""}
                onChange={(val) => setValue("presetBasicInfo.l1BeaconUrl", val, { shouldValidate: true })}
                rpcUrls={rpcUrls}
                urlType="BeaconChain"
                network={network}
                error={errors.presetBasicInfo?.l1BeaconUrl?.message}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Account Setup — preset mode: seed phrase only, backend derives accounts */}
      <AccountSetup mode="preset" />

      {/* AWS Configuration */}
      {infraProvider === "aws" && (
        getDesktopBridge() ? (
          <PresetDesktopAwsConfig
            setValue={setValue}
            register={register}
            errors={errors}
            awsCredentials={awsCredentials}
          />
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
              {awsCredentials && awsCredentials.length > 0 ? (
                <>
                  <div className="space-y-2">
                    <Label>
                      AWS Credentials <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={
                        awsCredentials.find(
                          (c) => c.accessKeyId === watch("presetBasicInfo.awsAccessKey")
                        )?.id ?? ""
                      }
                      onValueChange={(credId) => {
                        const cred = awsCredentials.find((c) => c.id === credId);
                        if (cred) {
                          setValue("presetBasicInfo.awsAccessKey", cred.accessKeyId, { shouldValidate: true });
                          setValue("presetBasicInfo.awsSecretKey", cred.secretAccessKey, { shouldValidate: true });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingCredentials ? "Loading..." : "Select saved credentials"} />
                      </SelectTrigger>
                      <SelectContent>
                        {awsCredentials.map((cred) => (
                          <SelectItem key={cred.id} value={cred.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{cred.name}</span>
                              <span className="text-xs text-muted-foreground">{cred.accessKeyId}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.presetBasicInfo?.awsAccessKey && (
                      <p className="text-xs text-red-500">
                        {errors.presetBasicInfo.awsAccessKey.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="awsRegion">
                      Region <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={watch("presetBasicInfo.awsRegion") ?? ""}
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
                </>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No AWS credentials found</AlertTitle>
                  <AlertDescription className="flex items-center justify-between">
                    <span>Please add AWS credentials in the Configuration section first.</span>
                    <a
                      href="/configuration"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                    >
                      Go to Configuration <ExternalLink className="w-3 h-3" />
                    </a>
                  </AlertDescription>
                </Alert>
              )}
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

import type { AWSCredential } from "@/features/configuration/schemas";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PresetDesktopAwsConfig({ setValue, register, errors, awsCredentials }: { setValue: any; register: any; errors: any; awsCredentials: AWSCredential[] }) {
  const [appliedRegion, setAppliedRegion] = useState<string | null>(null);
  const [useManual, setUseManual] = useState(false);
  const [selectedCredId, setSelectedCredId] = useState<string>("");

  const applyAndFinish = (accessKeyId: string, secretAccessKey: string, region: string) => {
    setValue("presetBasicInfo.awsAccessKey", accessKeyId);
    setValue("presetBasicInfo.awsSecretKey", secretAccessKey);
    setValue("presetBasicInfo.awsRegion", region, { shouldValidate: true });
    setAppliedRegion(region);
  };

  if (appliedRegion) {
    const regionLabel = AWS_REGIONS.find((r) => r.value === appliedRegion)?.label ?? appliedRegion;
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
            <p className="text-sm text-green-800 font-medium">
              AWS credentials configured. Region: {regionLabel}
            </p>
            <button
              type="button"
              className="text-xs text-green-700 underline"
              onClick={() => { setAppliedRegion(null); setSelectedCredId(""); setUseManual(false); }}
            >
              Change
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (awsCredentials.length > 0 && !useManual) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AWS Configuration</CardTitle>
          <p className="text-sm text-gray-500">Select saved credentials or enter manually.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Saved Credentials</Label>
            <Select value={selectedCredId} onValueChange={setSelectedCredId}>
              <SelectTrigger>
                <SelectValue placeholder="Select saved credentials" />
              </SelectTrigger>
              <SelectContent>
                {awsCredentials.map((cred) => (
                  <SelectItem key={cred.id} value={cred.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{cred.name}</span>
                      <span className="text-xs text-muted-foreground">{cred.accessKeyId}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedCredId && (
            <div className="space-y-2">
              <Label>Region</Label>
              <Select
                onValueChange={(region) => {
                  const cred = awsCredentials.find((c) => c.id === selectedCredId);
                  if (cred) applyAndFinish(cred.accessKeyId, cred.secretAccessKey, region);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {AWS_REGIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <button
            type="button"
            className="text-xs text-blue-600 underline"
            onClick={() => setUseManual(true)}
          >
            Enter credentials manually instead
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <DesktopAwsKeyInput
      onComplete={(creds) => {
        const region = creds.source.startsWith("manual:") ? creds.source.slice(7) : "us-east-1";
        applyAndFinish(creds.accessKeyId, creds.secretAccessKey, region);
      }}
    />
  );
}
