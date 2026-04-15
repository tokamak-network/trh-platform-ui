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
import { getDesktopBridge, DesktopAwsKeyInput } from "../steps/AwsConfig";
import { useState } from "react";

export function BasicInfoStep() {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<CreateRollupFormData>();

  const network = watch("presetBasicInfo.network");

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
                  <SelectItem value="Mainnet">Mainnet (Ethereum)</SelectItem>
                </SelectContent>
              </Select>
              {errors.presetBasicInfo?.network && (
                <p className="text-xs text-red-500">
                  {errors.presetBasicInfo.network.message}
                </p>
              )}
            </div>
          </div>

          {network === "Mainnet" && (
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

      {/* AWS Configuration */}
      {getDesktopBridge() ? (
        <PresetDesktopAwsConfig setValue={setValue} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>AWS Configuration</CardTitle>
            <p className="text-sm text-gray-500">
              AWS credentials for infrastructure deployment.
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PresetDesktopAwsConfig({ setValue }: { setValue: any }) {
  const [applied, setApplied] = useState(false);

  if (applied) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800 font-medium">
              AWS credentials configured via TRH Desktop.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <DesktopAwsKeyInput
      onComplete={(creds) => {
        setValue("presetBasicInfo.awsAccessKey", creds.accessKeyId, { shouldValidate: true });
        setValue("presetBasicInfo.awsSecretKey", creds.secretAccessKey, { shouldValidate: true });
        setApplied(true);
      }}
    />
  );
}
