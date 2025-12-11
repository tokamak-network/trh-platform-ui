"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ethers } from "ethers";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiGet } from "@/lib/api";
import { DeployNewL2ChainRequest } from "../services/integrationService";

// Block Explorer Types
type BlockExplorerType = "etherscan" | "blockscout";

// Schema definitions
const blockExplorerConfigSchema = z
  .object({
    apiKey: z.string().optional(),
    url: z.string().url({ message: "Valid URL is required" }),
    type: z.enum(["etherscan", "blockscout"]),
  })
  .refine(
    (data) => {
      if (data.type === "etherscan") {
        return !!data.apiKey && data.apiKey.trim().length > 0;
      }
      return true;
    },
    {
      message: "API key is required for Etherscan",
      path: ["apiKey"],
    }
  );

// Helper to validate Ethereum address
const ethAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, {
  message: "Invalid Ethereum address format",
});

const l2CrossTradeChainInputSchema = z.object({
  rpc: z.string().min(1, { message: "RPC URL is required" }).refine(
    (val) => {
      try {
        new URL(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: "Valid URL is required" }
  ),
  chainId: z
    .number({ message: "Chain ID must be a number" })
    .int({ message: "Chain ID must be an integer" })
    .min(1, { message: "Chain ID must be greater than 0" }),
  chain_name: z.string().min(1, { message: "Chain name is required" }),
  privateKey: z.string().min(1, { message: "Private key is required" }),
  isDeployedNew: z.boolean(),
  deploymentScriptPath: z.string().optional(),
  contractName: z.string().optional(),
  blockExplorerConfig: blockExplorerConfigSchema.optional().nullable(),
  crossTradeProxyAddress: z.string().optional(),
  crossTradeAddress: z.string().optional(),
  crossDomainMessenger: ethAddressSchema,
  nativeTokenAddress: ethAddressSchema,
  l1StandardBridgeAddress: ethAddressSchema,
  l1UsdcBridgeAddress: ethAddressSchema,
  l1CrossDomainMessenger: ethAddressSchema,
}).refine((data) => {
  if (!data.isDeployedNew) {
    return !!data.crossTradeProxyAddress && data.crossTradeProxyAddress.length > 0;
  }
  return true;
}, {
  message: "Proxy address is required when using existing contract",
  path: ["crossTradeProxyAddress"],
}).refine((data) => {
  if (!data.isDeployedNew) {
    return !!data.crossTradeAddress && data.crossTradeAddress.length > 0;
  }
  return true;
}, {
  message: "Trade address is required when using existing contract",
  path: ["crossTradeAddress"],
});

const addChainSchema = z.object({
  l2ChainConfig: l2CrossTradeChainInputSchema,
});

export type AddChainFormData = z.infer<typeof addChainSchema>;

interface AddChainDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: DeployNewL2ChainRequest) => void;
  isPending?: boolean;
  mode: "l2_to_l1" | "l2_to_l2";
  stackId: string;
}

const defaultL2Config = {
  rpc: "",
  chainId: 0,
  chain_name: "",
  privateKey: "",
  isDeployedNew: true,
  deploymentScriptPath: "",
  contractName: "",
  blockExplorerConfig: null,
  crossTradeProxyAddress: "",
  crossTradeAddress: "",
  crossDomainMessenger: "",
  nativeTokenAddress: "",
  l1StandardBridgeAddress: "",
  l1UsdcBridgeAddress: "",
  l1CrossDomainMessenger: "",
};

export default function AddChainDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending = false,
  mode,
  stackId,
}: AddChainDialogProps) {
  const [l2ExplorerEnabled, setL2ExplorerEnabled] = React.useState(false);
  const [l2FetchingChainId, setL2FetchingChainId] = React.useState(false);
  const [l2ChainIdError, setL2ChainIdError] = React.useState(false);
  const [l2BalanceError, setL2BalanceError] = React.useState<string | null>(null);
  const [l2AutoFilledFields, setL2AutoFilledFields] = React.useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pendingData, setPendingData] = React.useState<DeployNewL2ChainRequest | null>(null);

  const form = useForm<AddChainFormData>({
    resolver: zodResolver(addChainSchema),
    defaultValues: {
      l2ChainConfig: defaultL2Config,
    },
  });

  // Function to fetch chainId from RPC
  const fetchChainIdFromRpc = async (
    rpcUrl: string,
    setLoading: (loading: boolean) => void,
    setChainId: (chainId: number) => void,
    setError: (error: boolean) => void
  ) => {
    if (!rpcUrl || !rpcUrl.trim()) {
      setError(false);
      return;
    }

    try {
      setLoading(true);
      setError(false);
      const formattedRpcUrl = rpcUrl.startsWith("http")
        ? rpcUrl
        : `https://${rpcUrl}`;
      const provider = new ethers.JsonRpcProvider(formattedRpcUrl);
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      if (chainId > 0) {
        setChainId(chainId);
        setError(false);
      } else {
        setError(true);
      }
    } catch (error) {
      console.error("Error fetching chain ID:", error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // Function to check balance
  const checkBalance = async (
    rpcUrl: string,
    privateKey: string,
    setError: (error: string | null) => void
  ) => {
    if (!rpcUrl || !privateKey || !rpcUrl.trim() || !privateKey.trim()) {
      setError(null);
      return;
    }

    try {
      const formattedRpcUrl = rpcUrl.startsWith("http")
        ? rpcUrl
        : `https://${rpcUrl}`;
      const provider = new ethers.JsonRpcProvider(formattedRpcUrl);
      const wallet = new ethers.Wallet(privateKey, provider);
      const balance = await provider.getBalance(wallet.address);
      const balanceBigInt = BigInt(balance.toString());

      if (balanceBigInt === BigInt(0)) {
        setError("Account balance is 0. Please fund this account before proceeding.");
      } else {
        setError(null);
      }
    } catch (error) {
      console.error("Error checking balance:", error);
      setError(null);
    }
  };

  // Function to fetch default contract addresses by chain ID
  const fetchDefaultContractAddresses = async (chainId: number) => {
    try {
      const response = await apiGet<any>("stacks/thanos/default-contract-addresses");
      let apiData: Record<string, any> | undefined;
      
      if (response.data?.data && typeof response.data.data === 'object' && !Array.isArray(response.data.data)) {
        apiData = response.data.data;
      } else if (response.data && typeof response.data === 'object' && !Array.isArray(response.data) && !response.data.status) {
        apiData = response.data;
      } else if (response && typeof response === 'object' && !Array.isArray(response) && response.data) {
        apiData = response.data;
      }

      const chainIdStr = chainId.toString();
      
      if (apiData && apiData[chainIdStr]) {
        const contractData = apiData[chainIdStr];
        return {
          l2CrossDomainMessenger: contractData.l2_cross_domain_messenger_address,
          nativeTokenAddress: contractData.native_token_address,
          l1StandardBridgeAddress: contractData.l1_standard_bridge_address,
          l1UsdcBridgeAddress: contractData.l1_usdc_bridge_address,
          l1CrossDomainMessenger: contractData.l1_cross_domain_messenger_address,
        };
      }
      return null;
    } catch (error) {
      console.error("Error fetching default contract addresses:", error);
      return null;
    }
  };

  // Watch L2 RPC and fetch chainId
  const l2Rpc = form.watch("l2ChainConfig.rpc");
  const l2ChainId = form.watch("l2ChainConfig.chainId");
  React.useEffect(() => {
    if (l2Rpc && l2Rpc.trim()) {
      setL2ChainIdError(false);
      const timeoutId = setTimeout(() => {
        fetchChainIdFromRpc(
          l2Rpc,
          setL2FetchingChainId,
          (chainId) => {
            form.setValue("l2ChainConfig.chainId", chainId);
            // Fetch default contract addresses when chainId is available
            if (chainId > 0) {
              fetchDefaultContractAddresses(chainId)
                .then((contractAddresses) => {
                  if (contractAddresses) {
                    const updatedAutoFilledFields = new Set<string>();
                    
                    // Only auto-fill if fields are empty (not manually edited)
                    const currentCrossDomainMessenger = form.getValues("l2ChainConfig.crossDomainMessenger");
                    if (!currentCrossDomainMessenger || currentCrossDomainMessenger.trim() === "") {
                      form.setValue("l2ChainConfig.crossDomainMessenger", contractAddresses.l2CrossDomainMessenger);
                      updatedAutoFilledFields.add('crossDomainMessenger');
                    }
                    
                    const currentNativeToken = form.getValues("l2ChainConfig.nativeTokenAddress");
                    if ((!currentNativeToken || currentNativeToken.trim() === "") && contractAddresses.nativeTokenAddress) {
                      form.setValue("l2ChainConfig.nativeTokenAddress", contractAddresses.nativeTokenAddress);
                      updatedAutoFilledFields.add('nativeTokenAddress');
                    }
                    
                    const currentL1StandardBridge = form.getValues("l2ChainConfig.l1StandardBridgeAddress");
                    if ((!currentL1StandardBridge || currentL1StandardBridge.trim() === "") && contractAddresses.l1StandardBridgeAddress) {
                      form.setValue("l2ChainConfig.l1StandardBridgeAddress", contractAddresses.l1StandardBridgeAddress);
                      updatedAutoFilledFields.add('l1StandardBridgeAddress');
                    }
                    
                    const currentL1UsdcBridge = form.getValues("l2ChainConfig.l1UsdcBridgeAddress");
                    if ((!currentL1UsdcBridge || currentL1UsdcBridge.trim() === "") && contractAddresses.l1UsdcBridgeAddress) {
                      form.setValue("l2ChainConfig.l1UsdcBridgeAddress", contractAddresses.l1UsdcBridgeAddress);
                      updatedAutoFilledFields.add('l1UsdcBridgeAddress');
                    }
                    
                    const currentL1CrossDomainMessenger = form.getValues("l2ChainConfig.l1CrossDomainMessenger");
                    if ((!currentL1CrossDomainMessenger || currentL1CrossDomainMessenger.trim() === "") && contractAddresses.l1CrossDomainMessenger) {
                      form.setValue("l2ChainConfig.l1CrossDomainMessenger", contractAddresses.l1CrossDomainMessenger);
                      updatedAutoFilledFields.add('l1CrossDomainMessenger');
                    }
                    
                    setL2AutoFilledFields(prev => {
                      const combined = new Set(prev);
                      updatedAutoFilledFields.forEach(field => combined.add(field));
                      return combined;
                    });
                  }
                })
                .catch((error) => {
                  console.error("Failed to fetch default contract addresses:", error);
                });
            }
          },
          setL2ChainIdError
        );
      }, 500);

      return () => clearTimeout(timeoutId);
    } else {
      // Clear chain ID and auto-filled fields when RPC is cleared
      setL2ChainIdError(false);
      form.setValue("l2ChainConfig.chainId", 0);
      // Clear auto-filled contract addresses when RPC is cleared
      setL2AutoFilledFields(prev => {
        const clearedFields = new Set<string>();
        prev.forEach(field => {
          if (field === 'crossDomainMessenger') {
            form.setValue("l2ChainConfig.crossDomainMessenger", "");
          } else if (field === 'nativeTokenAddress') {
            form.setValue("l2ChainConfig.nativeTokenAddress", "");
          } else if (field === 'l1StandardBridgeAddress') {
            form.setValue("l2ChainConfig.l1StandardBridgeAddress", "");
          } else if (field === 'l1UsdcBridgeAddress') {
            form.setValue("l2ChainConfig.l1UsdcBridgeAddress", "");
          } else if (field === 'l1CrossDomainMessenger') {
            form.setValue("l2ChainConfig.l1CrossDomainMessenger", "");
          }
        });
        return clearedFields;
      });
    }
  }, [l2Rpc, form]);

  // Watch L2 private key and RPC, check balance
  const l2PrivateKey = form.watch("l2ChainConfig.privateKey");
  React.useEffect(() => {
    if (l2Rpc && l2PrivateKey && l2Rpc.trim() && l2PrivateKey.trim()) {
      const timeoutId = setTimeout(() => {
        checkBalance(l2Rpc, l2PrivateKey, setL2BalanceError);
      }, 500);

      return () => clearTimeout(timeoutId);
    } else {
      setL2BalanceError(null);
    }
  }, [l2Rpc, l2PrivateKey]);

  const handleSubmit = form.handleSubmit((data) => {
    if (l2BalanceError) {
      return;
    }
    if (l2ChainIdError || data.l2ChainConfig.chainId <= 0) {
      return;
    }

    const transformedData: DeployNewL2ChainRequest = {
      mode,
      l2ChainConfig: {
        rpc: data.l2ChainConfig.rpc,
        chainId: data.l2ChainConfig.chainId,
        chainName: data.l2ChainConfig.chain_name,
        privateKey: data.l2ChainConfig.privateKey,
        isDeployedNew: data.l2ChainConfig.isDeployedNew,
        blockExplorerConfig: data.l2ChainConfig.blockExplorerConfig ? {
          url: data.l2ChainConfig.blockExplorerConfig.url,
          type: data.l2ChainConfig.blockExplorerConfig.type,
          ...(data.l2ChainConfig.blockExplorerConfig.apiKey && {
            apiKey: data.l2ChainConfig.blockExplorerConfig.apiKey,
          }),
        } : null,
        crossDomainMessenger: data.l2ChainConfig.crossDomainMessenger,
        ...(data.l2ChainConfig.crossTradeProxyAddress && {
          crossTradeProxyAddress: data.l2ChainConfig.crossTradeProxyAddress,
        }),
        ...(data.l2ChainConfig.crossTradeAddress && {
          crossTradeAddress: data.l2ChainConfig.crossTradeAddress,
        }),
        nativeTokenAddress: data.l2ChainConfig.nativeTokenAddress,
        l1StandardBridgeAddress: data.l2ChainConfig.l1StandardBridgeAddress,
        l1USDCBridgeAddress: data.l2ChainConfig.l1UsdcBridgeAddress, // Map to capital USDC for backend
        l1CrossDomainMessenger: data.l2ChainConfig.l1CrossDomainMessenger,
      },
    };
    
    setPendingData(transformedData);
    setConfirmOpen(true);
  });

  const hasBalanceErrors = l2BalanceError !== null;
  const isFetchingChainIds = l2FetchingChainId;
  const l2ChainIdValid = !l2Rpc || !l2Rpc.trim() || l2ChainId > 0;
  const hasChainIdErrors = l2ChainIdError || !l2ChainIdValid;
  
  const shouldDisableSubmit =
    isPending ||
    form.formState.isSubmitting ||
    hasBalanceErrors ||
    isFetchingChainIds ||
    hasChainIdErrors;

  const handleConfirm = () => {
    if (!pendingData) return;
    onSubmit(pendingData);
  };

  const handleDialogChange = (next: boolean) => {
    if (!next) {
      form.reset({
        l2ChainConfig: defaultL2Config,
      });
      setL2ExplorerEnabled(false);
      setL2FetchingChainId(false);
      setL2ChainIdError(false);
      setL2BalanceError(null);
      setL2AutoFilledFields(new Set());
    }
    onOpenChange(next);
  };

  const toggleL2Explorer = (enabled: boolean) => {
    setL2ExplorerEnabled(enabled);
    if (enabled) {
      form.setValue("l2ChainConfig.blockExplorerConfig", {
        apiKey: "",
        url: "",
        type: "etherscan" as BlockExplorerType,
      });
    } else {
      form.setValue("l2ChainConfig.blockExplorerConfig", null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New L2 Chain</DialogTitle>
            <DialogDescription>
              Configure a new L2 chain for the cross-chain bridge.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="l2ChainName">Chain Name</Label>
                <Input
                  id="l2ChainName"
                  placeholder="Enter chain name"
                  disabled={isPending}
                  {...form.register("l2ChainConfig.chain_name")}
                  className={
                    form.formState.errors.l2ChainConfig?.chain_name
                      ? "border-destructive"
                      : ""
                  }
                />
                {form.formState.errors.l2ChainConfig?.chain_name && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.l2ChainConfig.chain_name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="l2Rpc">RPC URL</Label>
                <Input
                  id="l2Rpc"
                  placeholder="https://..."
                  disabled={isPending}
                  {...form.register("l2ChainConfig.rpc")}
                  className={
                    form.formState.errors.l2ChainConfig?.rpc
                      ? "border-destructive"
                      : ""
                  }
                />
                {form.formState.errors.l2ChainConfig?.rpc && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.l2ChainConfig.rpc.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="l2ChainId">
                  Chain ID {l2FetchingChainId && "(Fetching...)"}
                </Label>
                <Input
                  id="l2ChainId"
                  type="number"
                  placeholder="Auto-fetched from RPC"
                  disabled={true}
                  value={
                    form.watch("l2ChainConfig.chainId") &&
                    form.watch("l2ChainConfig.chainId") > 0
                      ? form.watch("l2ChainConfig.chainId")
                      : ""
                  }
                  className={
                    form.formState.errors.l2ChainConfig?.chainId
                      ? "border-destructive"
                      : ""
                  }
                />
                {form.formState.errors.l2ChainConfig?.chainId && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.l2ChainConfig.chainId.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="l2PrivateKey">Private Key</Label>
                <Input
                  id="l2PrivateKey"
                  type="password"
                  placeholder="0x..."
                  disabled={isPending}
                  {...form.register("l2ChainConfig.privateKey")}
                  className={
                    form.formState.errors.l2ChainConfig?.privateKey
                      ? "border-destructive"
                      : ""
                  }
                />
                {form.formState.errors.l2ChainConfig?.privateKey && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.l2ChainConfig.privateKey.message}
                  </p>
                )}
                {l2BalanceError && (
                  <p className="text-sm text-destructive">{l2BalanceError}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="l2IsDeployedNew"
                  checked={form.watch("l2ChainConfig.isDeployedNew")}
                  onCheckedChange={(checked) =>
                    form.setValue("l2ChainConfig.isDeployedNew", checked)
                  }
                  disabled={isPending}
                />
                <Label htmlFor="l2IsDeployedNew">Deploy New Contract</Label>
              </div>

              {!form.watch("l2ChainConfig.isDeployedNew") && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="l2CrossTradeProxyAddress">
                      L1 Cross Trade Proxy Address
                    </Label>
                    <Input
                      id="l2CrossTradeProxyAddress"
                      placeholder="0x..."
                      disabled={isPending}
                      {...form.register("l2ChainConfig.crossTradeProxyAddress")}
                      className={
                        form.formState.errors.l2ChainConfig
                          ?.crossTradeProxyAddress
                          ? "border-destructive"
                          : ""
                      }
                    />
                    {form.formState.errors.l2ChainConfig
                      ?.crossTradeProxyAddress && (
                      <p className="text-sm text-destructive">
                        {
                          form.formState.errors.l2ChainConfig
                            .crossTradeProxyAddress?.message
                        }
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="l2CrossTradeAddress">
                      L1 Cross Trade Address
                    </Label>
                    <Input
                      id="l2CrossTradeAddress"
                      placeholder="0x..."
                      disabled={isPending}
                      {...form.register("l2ChainConfig.crossTradeAddress")}
                      className={
                        form.formState.errors.l2ChainConfig?.crossTradeAddress
                          ? "border-destructive"
                          : ""
                      }
                    />
                    {form.formState.errors.l2ChainConfig?.crossTradeAddress && (
                      <p className="text-sm text-destructive">
                        {
                          form.formState.errors.l2ChainConfig.crossTradeAddress
                            ?.message
                        }
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Required L2 fields */}
              <div className="space-y-2">
                <Label htmlFor="l2CrossDomainMessenger">
                  Cross Domain Messenger <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="l2CrossDomainMessenger"
                  placeholder="0x..."
                  disabled={isPending || l2AutoFilledFields.has('crossDomainMessenger')}
                  {...form.register("l2ChainConfig.crossDomainMessenger")}
                  className={
                    form.formState.errors.l2ChainConfig?.crossDomainMessenger
                      ? "border-destructive"
                      : ""
                  }
                />
                {form.formState.errors.l2ChainConfig?.crossDomainMessenger && (
                  <p className="text-sm text-destructive">
                    {
                      form.formState.errors.l2ChainConfig.crossDomainMessenger
                        ?.message
                    }
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="l2NativeTokenAddress">
                  Native Token Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="l2NativeTokenAddress"
                  placeholder="0x..."
                  disabled={isPending || l2AutoFilledFields.has('nativeTokenAddress')}
                  {...form.register("l2ChainConfig.nativeTokenAddress")}
                  className={
                    form.formState.errors.l2ChainConfig?.nativeTokenAddress
                      ? "border-destructive"
                      : ""
                  }
                />
                {form.formState.errors.l2ChainConfig?.nativeTokenAddress && (
                  <p className="text-sm text-destructive">
                    {
                      form.formState.errors.l2ChainConfig.nativeTokenAddress
                        ?.message
                    }
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="l2L1StandardBridgeAddress">
                  L1 Standard Bridge Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="l2L1StandardBridgeAddress"
                  placeholder="0x..."
                  disabled={isPending || l2AutoFilledFields.has('l1StandardBridgeAddress')}
                  {...form.register("l2ChainConfig.l1StandardBridgeAddress")}
                  className={
                    form.formState.errors.l2ChainConfig?.l1StandardBridgeAddress
                      ? "border-destructive"
                      : ""
                  }
                />
                {form.formState.errors.l2ChainConfig?.l1StandardBridgeAddress && (
                  <p className="text-sm text-destructive">
                    {
                      form.formState.errors.l2ChainConfig.l1StandardBridgeAddress
                        ?.message
                    }
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="l2L1UsdcBridgeAddress">
                  L1 USDC Bridge Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="l2L1UsdcBridgeAddress"
                  placeholder="0x..."
                  disabled={isPending || l2AutoFilledFields.has('l1UsdcBridgeAddress')}
                  {...form.register("l2ChainConfig.l1UsdcBridgeAddress")}
                  className={
                    form.formState.errors.l2ChainConfig?.l1UsdcBridgeAddress
                      ? "border-destructive"
                      : ""
                  }
                />
                {form.formState.errors.l2ChainConfig?.l1UsdcBridgeAddress && (
                  <p className="text-sm text-destructive">
                    {
                      form.formState.errors.l2ChainConfig.l1UsdcBridgeAddress
                        ?.message
                    }
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="l2L1CrossDomainMessenger">
                  L1 Cross Domain Messenger <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="l2L1CrossDomainMessenger"
                  placeholder="0x..."
                  disabled={isPending || l2AutoFilledFields.has('l1CrossDomainMessenger')}
                  {...form.register("l2ChainConfig.l1CrossDomainMessenger")}
                  className={
                    form.formState.errors.l2ChainConfig?.l1CrossDomainMessenger
                      ? "border-destructive"
                      : ""
                  }
                />
                {form.formState.errors.l2ChainConfig?.l1CrossDomainMessenger && (
                  <p className="text-sm text-destructive">
                    {
                      form.formState.errors.l2ChainConfig.l1CrossDomainMessenger
                        ?.message
                    }
                  </p>
                )}
              </div>

              {/* Block Explorer Config for L2 */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="l2ExplorerEnabled"
                  checked={l2ExplorerEnabled}
                  onCheckedChange={toggleL2Explorer}
                  disabled={isPending}
                />
                <Label htmlFor="l2ExplorerEnabled">
                  Verify Contracts on Block Explorer (Optional)
                </Label>
              </div>

              {l2ExplorerEnabled && (
                <div className="ml-6 space-y-4 rounded-md border p-4">
                  <div className="space-y-2">
                    <Label htmlFor="l2ExplorerType">Explorer Type</Label>
                    <Select
                      value={
                        form.watch("l2ChainConfig.blockExplorerConfig.type") ||
                        "etherscan"
                      }
                      onValueChange={(value: BlockExplorerType) => {
                        form.setValue(
                          "l2ChainConfig.blockExplorerConfig.type",
                          value
                        );
                        if (value === "blockscout") {
                          form.setValue(
                            "l2ChainConfig.blockExplorerConfig.apiKey",
                            ""
                          );
                        }
                      }}
                      disabled={isPending}
                    >
                      <SelectTrigger id="l2ExplorerType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="etherscan">Etherscan</SelectItem>
                        <SelectItem value="blockscout">Blockscout</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {form.watch("l2ChainConfig.blockExplorerConfig.type") ===
                    "etherscan" && (
                    <div className="space-y-2">
                      <Label htmlFor="l2ExplorerApiKey">API Key *</Label>
                      <Input
                        id="l2ExplorerApiKey"
                        placeholder="API key"
                        disabled={isPending}
                        {...form.register(
                          "l2ChainConfig.blockExplorerConfig.apiKey"
                        )}
                      />
                      {form.formState.errors.l2ChainConfig?.blockExplorerConfig
                        ?.apiKey && (
                        <p className="text-sm text-destructive">
                          {
                            form.formState.errors.l2ChainConfig
                              .blockExplorerConfig?.apiKey?.message
                          }
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="l2ExplorerUrl">URL</Label>
                    <Input
                      id="l2ExplorerUrl"
                      placeholder="https://..."
                      disabled={isPending}
                      {...form.register(
                        "l2ChainConfig.blockExplorerConfig.url"
                      )}
                    />
                    {form.formState.errors.l2ChainConfig?.blockExplorerConfig
                      ?.url && (
                      <p className="text-sm text-destructive">
                        {
                          form.formState.errors.l2ChainConfig
                            .blockExplorerConfig?.url?.message
                        }
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={shouldDisableSubmit}>
                Continue
              </Button>
              {hasBalanceErrors && (
                <p className="text-sm text-destructive mt-2">
                  Cannot submit: Account has zero balance. Please fund the account
                  before proceeding.
                </p>
              )}
              {!hasBalanceErrors && hasChainIdErrors && (
                <p className="text-sm text-destructive mt-2">
                  Cannot submit: RPC endpoint is not working or ChainID could not
                  be fetched. Please check your RPC URL.
                </p>
              )}
              {!hasBalanceErrors && !hasChainIdErrors && isFetchingChainIds && (
                <p className="text-sm text-muted-foreground mt-2">
                  Fetching Chain ID from RPC endpoint...
                </p>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Add Chain</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to add this new L2 chain to the cross-chain
              bridge? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isPending}
              onClick={handleConfirm}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

