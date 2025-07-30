"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFormContext } from "react-hook-form";
import type { CreateRollupFormData } from "../../schemas/create-rollup";

const AWS_REGIONS = [
  { value: "us-east-1", label: "US East (N. Virginia)" },
  { value: "us-east-2", label: "US East (Ohio)" },
  { value: "us-west-1", label: "US West (N. California)" },
  { value: "us-west-2", label: "US West (Oregon)" },
  { value: "eu-west-1", label: "EU (Ireland)" },
  { value: "eu-central-1", label: "EU (Frankfurt)" },
  { value: "ap-northeast-1", label: "Asia Pacific (Tokyo)" },
];

export function AwsConfig() {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<CreateRollupFormData>();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">AWS Configuration</h2>
        <p className="text-slate-600 mt-1">
          Configure your AWS credentials and region for deployment.
        </p>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Label className="text-lg font-semibold text-slate-800">
              AWS Credentials <span className="text-red-500">*</span>
            </Label>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Account Name */}
          <div className="space-y-2">
            <Label
              htmlFor="accountName"
              className="text-sm font-medium text-slate-700"
            >
              Account Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="accountName"
              type="text"
              placeholder="Enter account name"
              {...register("accountAndAws.accountName")}
            />
            {errors.accountAndAws?.accountName && (
              <p className="text-sm text-red-500">
                {errors.accountAndAws.accountName.message}
              </p>
            )}
          </div>

          {/* AWS Access Key */}
          <div className="space-y-2">
            <Label
              htmlFor="awsAccessKey"
              className="text-sm font-medium text-slate-700"
            >
              AWS Access Key <span className="text-red-500">*</span>
            </Label>
            <Input
              id="awsAccessKey"
              type="text"
              placeholder="Enter AWS access key"
              {...register("accountAndAws.awsAccessKey")}
            />
            {errors.accountAndAws?.awsAccessKey && (
              <p className="text-sm text-red-500">
                {errors.accountAndAws.awsAccessKey.message}
              </p>
            )}
          </div>

          {/* AWS Secret Key */}
          <div className="space-y-2">
            <Label
              htmlFor="awsSecretKey"
              className="text-sm font-medium text-slate-700"
            >
              AWS Secret Key <span className="text-red-500">*</span>
            </Label>
            <Input
              id="awsSecretKey"
              type="password"
              placeholder="Enter AWS secret key"
              {...register("accountAndAws.awsSecretKey")}
            />
            {errors.accountAndAws?.awsSecretKey && (
              <p className="text-sm text-red-500">
                {errors.accountAndAws.awsSecretKey.message}
              </p>
            )}
          </div>

          {/* AWS Region */}
          <div className="space-y-2">
            <Label
              htmlFor="awsRegion"
              className="text-sm font-medium text-slate-700"
            >
              AWS Region <span className="text-red-500">*</span>
            </Label>
            <Select
              value={watch("accountAndAws.awsRegion")}
              onValueChange={(value) =>
                setValue("accountAndAws.awsRegion", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a region" />
              </SelectTrigger>
              <SelectContent>
                {AWS_REGIONS.map((region) => (
                  <SelectItem key={region.value} value={region.value}>
                    {region.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.accountAndAws?.awsRegion && (
              <p className="text-sm text-red-500">
                {errors.accountAndAws.awsRegion.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info Message */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          Your AWS credentials will be used to deploy and manage your rollup
          infrastructure. Make sure you have the necessary permissions.
        </p>
      </div>
    </div>
  );
}
