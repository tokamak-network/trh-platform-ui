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
import { AlertTriangle, Info } from "lucide-react";
import { useFormContext } from "react-hook-form";
import type { CreateRollupFormData } from "../../schemas/create-rollup";
import { FEE_TOKEN_OPTIONS } from "../../schemas/preset";
import { AccountSetup } from "../steps/AccountSetup";

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
  const presetId = watch("presetId");

  return (
    <div className="space-y-6">
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
                  setValue("presetBasicInfo.network", val as "testnet" | "mainnet", {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select network" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="testnet">Testnet (Sepolia)</SelectItem>
                  <SelectItem value="mainnet">Mainnet (Ethereum)</SelectItem>
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

          {network === "mainnet" && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You are deploying to <strong>Mainnet</strong>. This involves real assets and
                irreversible costs. Ensure all settings are correct before proceeding.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* L1 Connection */}
      <Card>
        <CardHeader>
          <CardTitle>L1 Connection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="l1RpcUrl">
                L1 RPC URL <span className="text-red-500">*</span>
              </Label>
              <Input
                id="l1RpcUrl"
                placeholder={
                  network === "mainnet"
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
            <div className="space-y-2">
              <Label htmlFor="l1BeaconUrl">
                L1 Beacon URL <span className="text-red-500">*</span>
              </Label>
              <Input
                id="l1BeaconUrl"
                placeholder={
                  network === "mainnet"
                    ? "https://eth-mainnet.g.alchemy.com/v2/..."
                    : "https://ethereum-sepolia-beacon-api.publicnode.com"
                }
                {...register("presetBasicInfo.l1BeaconUrl")}
              />
              {errors.presetBasicInfo?.l1BeaconUrl && (
                <p className="text-xs text-red-500">
                  {errors.presetBasicInfo.l1BeaconUrl.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Setup (reuse existing component) */}
      <AccountSetup />

      {/* AWS Configuration */}
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

      {presetId && (
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
