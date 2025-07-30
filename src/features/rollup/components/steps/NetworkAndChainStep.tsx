"use client";

import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Network, Database, Settings, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useFormContext } from "react-hook-form";
import type { CreateRollupFormData } from "../../schemas/create-rollup";

export function NetworkAndChainStep() {
  const {
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useFormContext<CreateRollupFormData>();

  const formData = watch();
  const advancedConfig = watch("networkAndChain.advancedConfig");

  const handleAdvancedConfigChange = (checked: boolean) => {
    setValue("networkAndChain.advancedConfig", checked);
    if (checked) {
      // Set default values for advanced fields when they become visible
      setValue("networkAndChain.l2BlockTime", "2");
      setValue("networkAndChain.batchSubmissionFreq", "1440");
      setValue("networkAndChain.outputRootFreq", "240");
      setValue("networkAndChain.challengePeriod", "12");
      // Trigger validation for advanced fields
      trigger([
        "networkAndChain.l2BlockTime",
        "networkAndChain.batchSubmissionFreq",
        "networkAndChain.outputRootFreq",
        "networkAndChain.challengePeriod",
      ] as const);
    } else {
      // Clear advanced fields when they become hidden
      setValue("networkAndChain.l2BlockTime", undefined);
      setValue("networkAndChain.batchSubmissionFreq", undefined);
      setValue("networkAndChain.outputRootFreq", undefined);
      setValue("networkAndChain.challengePeriod", undefined);
    }
  };

  const handleNetworkChange = async (value: string) => {
    setValue("networkAndChain.network", value);
    await trigger("networkAndChain.network" as const);
  };

  const handleChainNameChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setValue("networkAndChain.chainName", e.target.value);
    await trigger("networkAndChain.chainName" as const);
  };

  const handleL1RpcUrlChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setValue("networkAndChain.l1RpcUrl", e.target.value);
    await trigger("networkAndChain.l1RpcUrl" as const);
  };

  const handleL1BeaconUrlChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setValue("networkAndChain.l1BeaconUrl", e.target.value);
    await trigger("networkAndChain.l1BeaconUrl" as const);
  };

  const handleL2BlockTimeChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setValue("networkAndChain.l2BlockTime", e.target.value);
    await trigger([
      "networkAndChain.l2BlockTime",
      "networkAndChain.outputRootFreq",
    ] as const);
  };

  const handleBatchSubmissionFreqChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setValue("networkAndChain.batchSubmissionFreq", e.target.value);
    await trigger("networkAndChain.batchSubmissionFreq" as const);
  };

  const handleOutputRootFreqChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setValue("networkAndChain.outputRootFreq", e.target.value);
    await trigger("networkAndChain.outputRootFreq" as const);
  };

  const handleChallengePeriodChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setValue("networkAndChain.challengePeriod", e.target.value);
    await trigger("networkAndChain.challengePeriod" as const);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Network className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Network & Chain</h2>
          <p className="text-slate-600">Configure network and chain settings</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Network Configuration */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-800">
              Network Configuration
            </CardTitle>
            <p className="text-sm text-slate-600">
              Configure your rollup&apos;s network settings and chain
              parameters.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Network Selection */}
              <Card className="bg-slate-50 border-slate-200 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <Network className="w-4 h-4 text-blue-600" />
                    <CardTitle className="text-base font-medium">
                      Network Selection
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label
                      htmlFor="network"
                      className="text-sm font-medium text-slate-700"
                    >
                      Network <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.networkAndChain?.network}
                      onValueChange={handleNetworkChange}
                    >
                      <SelectTrigger
                        className={`mt-1 ${
                          errors.networkAndChain?.network
                            ? "border-red-500"
                            : ""
                        }`}
                      >
                        <SelectValue placeholder="Select network" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="testnet">
                          <div className="flex flex-col">
                            <span className="font-medium">Testnet</span>
                            <span className="text-xs text-slate-500">
                              For development and testing
                            </span>
                          </div>
                        </SelectItem>
                        <SelectItem value="mainnet">
                          <div className="flex flex-col">
                            <span className="font-medium">Mainnet</span>
                            <span className="text-xs text-slate-500">
                              Production environment
                            </span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.networkAndChain?.network && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.networkAndChain.network.message}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Chain Configuration */}
              <Card className="bg-slate-50 border-slate-200 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-green-600" />
                    <CardTitle className="text-base font-medium">
                      Chain Configuration
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label
                      htmlFor="chainName"
                      className="text-sm font-medium text-slate-700"
                    >
                      Chain Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="chainName"
                      placeholder="e.g. my-l2-chain"
                      value={formData.networkAndChain?.chainName}
                      onChange={handleChainNameChange}
                      className={`mt-1 ${
                        errors.networkAndChain?.chainName
                          ? "border-red-500"
                          : ""
                      }`}
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      A unique name for your L2 chain. Must start with a letter
                      and can only contain letters, numbers and spaces.
                    </p>
                    {errors.networkAndChain?.chainName && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.networkAndChain.chainName.message}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* L2 Configuration */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-800">
              L2 Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Label
                        htmlFor="l1RpcUrl"
                        className="text-sm font-medium text-slate-700 flex items-center gap-1"
                      >
                        L1 RPC URL <span className="text-red-500">*</span>
                        <Info className="w-3 h-3 text-slate-400" />
                      </Label>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>The RPC endpoint for the L1 network</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Input
                  id="l1RpcUrl"
                  placeholder="https://eth-sepolia.g.alchemy.com/v2/gLQMMAYYch413sW"
                  value={formData.networkAndChain?.l1RpcUrl}
                  onChange={handleL1RpcUrlChange}
                  className={`mt-1 ${
                    errors.networkAndChain?.l1RpcUrl ? "border-red-500" : ""
                  }`}
                />
                {errors.networkAndChain?.l1RpcUrl && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.networkAndChain.l1RpcUrl.message}
                  </p>
                )}
              </div>

              <div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Label
                        htmlFor="l1BeaconUrl"
                        className="text-sm font-medium text-slate-700 flex items-center gap-1"
                      >
                        L1 Beacon URL <span className="text-red-500">*</span>
                        <Info className="w-3 h-3 text-slate-400" />
                      </Label>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>The beacon chain endpoint for the L1 network</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Input
                  id="l1BeaconUrl"
                  placeholder="node.pro/4ed7d53b815c434c082db3eb2f49612c914afe71/"
                  value={formData.networkAndChain?.l1BeaconUrl}
                  onChange={handleL1BeaconUrlChange}
                  className={`mt-1 ${
                    errors.networkAndChain?.l1BeaconUrl ? "border-red-500" : ""
                  }`}
                />
                {errors.networkAndChain?.l1BeaconUrl && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.networkAndChain.l1BeaconUrl.message}
                  </p>
                )}
              </div>
            </div>

            {/* Advanced Configuration Toggle */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="advanced-config"
                checked={advancedConfig}
                onCheckedChange={handleAdvancedConfigChange}
              />
              <Label htmlFor="advanced-config" className="text-sm font-medium">
                Show Advanced Configuration
              </Label>
            </div>

            {advancedConfig && (
              <Card className="bg-slate-50 border-slate-200">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-purple-600" />
                    <CardTitle className="text-base font-medium">
                      Advanced Settings
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Label
                              htmlFor="l2BlockTime"
                              className="text-sm font-medium text-slate-700 flex items-center gap-1"
                            >
                              L2 Block Time{" "}
                              <span className="text-red-500">*</span>
                              <Info className="w-3 h-3 text-slate-400" />
                            </Label>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              Block time in seconds for the L2 network. Default
                              is 2 seconds.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <Input
                        id="l2BlockTime"
                        type="number"
                        min="1"
                        step="1"
                        placeholder="2"
                        value={formData.networkAndChain?.l2BlockTime}
                        onChange={handleL2BlockTimeChange}
                        className={`mt-1 ${
                          errors.networkAndChain?.l2BlockTime
                            ? "border-red-500"
                            : ""
                        }`}
                      />
                      {errors.networkAndChain?.l2BlockTime && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.networkAndChain.l2BlockTime.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Label
                              htmlFor="batchSubmissionFreq"
                              className="text-sm font-medium text-slate-700 flex items-center gap-1"
                            >
                              Batch Submission Frequency{" "}
                              <span className="text-red-500">*</span>
                              <Info className="w-3 h-3 text-slate-400" />
                            </Label>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              How often batches are submitted to L1. Default is
                              120 blocks (1440 seconds). Must be a multiple of
                              12.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <Input
                        id="batchSubmissionFreq"
                        type="number"
                        min="12"
                        step="12"
                        placeholder="1440"
                        value={formData.networkAndChain?.batchSubmissionFreq}
                        onChange={handleBatchSubmissionFreqChange}
                        className={`mt-1 ${
                          errors.networkAndChain?.batchSubmissionFreq
                            ? "border-red-500"
                            : ""
                        }`}
                      />
                      {errors.networkAndChain?.batchSubmissionFreq && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.networkAndChain.batchSubmissionFreq.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Label
                              htmlFor="outputRootFreq"
                              className="text-sm font-medium text-slate-700 flex items-center gap-1"
                            >
                              Output Root Frequency{" "}
                              <span className="text-red-500">*</span>
                              <Info className="w-3 h-3 text-slate-400" />
                            </Label>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              How often output roots are published (in seconds).
                              Must be a multiple of{" "}
                              {formData.networkAndChain?.l2BlockTime} seconds.
                              Default is 240 seconds.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <Input
                        id="outputRootFreq"
                        type="number"
                        min="1"
                        step="1"
                        placeholder="240"
                        value={formData.networkAndChain?.outputRootFreq}
                        onChange={handleOutputRootFreqChange}
                        className={`mt-1 ${
                          errors.networkAndChain?.outputRootFreq
                            ? "border-red-500"
                            : ""
                        }`}
                      />
                      {errors.networkAndChain?.outputRootFreq && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.networkAndChain.outputRootFreq.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Label
                              htmlFor="challengePeriod"
                              className="text-sm font-medium text-slate-700 flex items-center gap-1"
                            >
                              Challenge Period{" "}
                              <span className="text-red-500">*</span>
                              <Info className="w-3 h-3 text-slate-400" />
                            </Label>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              The period during which outputs can be challenged
                              (in seconds). Default is 12 seconds.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <Input
                        id="challengePeriod"
                        type="number"
                        min="1"
                        step="1"
                        placeholder="12"
                        value={formData.networkAndChain?.challengePeriod}
                        onChange={handleChallengePeriodChange}
                        className={`mt-1 ${
                          errors.networkAndChain?.challengePeriod
                            ? "border-red-500"
                            : ""
                        }`}
                      />
                      {errors.networkAndChain?.challengePeriod && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.networkAndChain.challengePeriod.message}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Configuration Summary */}
        <Card className="border-0 shadow-lg bg-blue-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600" />
              <CardTitle className="text-base font-medium text-blue-900">
                Configuration Summary
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-slate-700">Network:</span>
                <span className="ml-2 text-slate-900">
                  {formData.networkAndChain?.network || "Not selected"}
                </span>
              </div>
              <div>
                <span className="font-medium text-slate-700">Chain Name:</span>
                <span className="ml-2 text-slate-900">
                  {formData.networkAndChain?.chainName || "Not set"}
                </span>
              </div>
              {advancedConfig && (
                <>
                  <div>
                    <span className="font-medium text-slate-700">
                      L2 Block Time:
                    </span>
                    <span className="ml-2 text-slate-900">
                      {formData.networkAndChain?.l2BlockTime}s
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">
                      Batch Frequency:
                    </span>
                    <span className="ml-2 text-slate-900">
                      {formData.networkAndChain?.batchSubmissionFreq}s
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">
                      Output Root Freq:
                    </span>
                    <span className="ml-2 text-slate-900">
                      {formData.networkAndChain?.outputRootFreq}s
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">
                      Challenge Period:
                    </span>
                    <span className="ml-2 text-slate-900">
                      {formData.networkAndChain?.challengePeriod}s
                    </span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
