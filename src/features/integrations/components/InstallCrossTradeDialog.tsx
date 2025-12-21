"use client";

import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
import { Separator } from "@/components/ui/separator";
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
import { Plus, Trash2 } from "lucide-react";
import { InstallCrossChainBridgeRequestBody } from "../services/integrationService";
import { getThanosStackById, getThanosDeployConfig, getThanosL1Contracts } from "../../rollup/services/rollupService";
import { apiGet } from "@/lib/api";

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
      // API key is required only for Etherscan
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


const l1CrossTradeChainInputSchema = z.object({
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
  // New required fields for L2
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

const installCrossChainBridgeSchema = z
  .object({
    mode: z.enum(["l2_to_l1", "l2_to_l2"], {
      message: "Mode is required",
    }),
    projectId: z.string().min(1, { message: "Project ID is required" }),
    l1ChainConfig: l1CrossTradeChainInputSchema,
    l2ChainConfig: z.array(l2CrossTradeChainInputSchema),
  })
  .refine(
    (data) => {
      if (data.mode === "l2_to_l1") {
        return data.l2ChainConfig.length === 1;
      }
      return data.l2ChainConfig.length >= 2;
    },
    {
      message: "L2 chain configuration count does not match mode requirements",
      path: ["l2ChainConfig"],
    }
  )
  .superRefine((data, ctx) => {
    if (data.mode === "l2_to_l1" && data.l2ChainConfig.length !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "L2 to L1 mode requires exactly one L2 chain configuration",
        path: ["l2ChainConfig"],
      });
    }
    if (data.mode === "l2_to_l2" && data.l2ChainConfig.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "L2 to L2 mode requires at least two L2 chain configurations",
        path: ["l2ChainConfig"],
      });
    }
  });

export type InstallCrossChainBridgeFormData = z.infer<
  typeof installCrossChainBridgeSchema
>;

interface InstallCrossTradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: InstallCrossChainBridgeRequestBody) => void;
  isPending?: boolean;
  mode?: "l2_to_l1" | "l2_to_l2";
  currentChainRpcUrl?: string;
  currentChainId?: number;
  stackId?: string;
}

const defaultL1Config = {
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
};

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

export default function InstallCrossTradeDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending = false,
  mode: propMode,
  currentChainRpcUrl,
  currentChainId,
  stackId,
}: InstallCrossTradeDialogProps) {
  const defaultMode = propMode || "l2_to_l1";
  
  // State for loading stack data
  const [isLoadingStack, setIsLoadingStack] = React.useState(false);
  
  // Create the first L2 config with current chain defaults if available
  const firstL2Config = currentChainRpcUrl || currentChainId
    ? {
        ...defaultL2Config,
        rpc: currentChainRpcUrl || "",
        chainId: currentChainId || 0,
      }
    : defaultL2Config;
  
  const initialL2Configs = defaultMode === "l2_to_l2" 
    ? [firstL2Config, defaultL2Config] 
    : [firstL2Config];
  
  const form = useForm<InstallCrossChainBridgeFormData>({
    resolver: zodResolver(installCrossChainBridgeSchema),
    defaultValues: {
      mode: defaultMode,
      projectId: "",
      l1ChainConfig: defaultL1Config,
      l2ChainConfig: initialL2Configs,
    },
  });

  // Fetch L1 configuration from stack when dialog opens
  React.useEffect(() => {
    if (open && stackId) {
      setIsLoadingStack(true);
      Promise.all([
        getThanosStackById(stackId),
        getThanosDeployConfig(stackId).catch((error) => {
          console.error("Failed to fetch deploy config:", error);
          return null;
        }),
        getThanosL1Contracts(stackId).catch((error) => {
          console.error("Failed to fetch L1 contracts:", error);
          return null;
        }),
      ])
        .then(([stack, deployConfig, l1Contracts]) => {
          // Fill L1 RPC from stack config
          if (stack.config?.l1RpcUrl) {
            form.setValue("l1ChainConfig.rpc", stack.config.l1RpcUrl);
          }
          
          // Fill L1 private key from adminAccount
          if (stack.config?.adminAccount) {
            form.setValue("l1ChainConfig.privateKey", stack.config.adminAccount);
          }

          // Fill L2 chain configuration (first chain only)
          const currentL2Configs = form.getValues("l2ChainConfig");
          if (currentL2Configs.length > 0) {
            const firstL2Config = { ...currentL2Configs[0] };
            const autoFilledFields = new Set<string>();
            
            // Set Native Token Address from deploy config
            if (deployConfig?.nativeTokenAddress) {
              firstL2Config.nativeTokenAddress = deployConfig.nativeTokenAddress;
              autoFilledFields.add('nativeTokenAddress');
            }
            
            // Set L1 contract addresses from contracts API
            if (l1Contracts) {
              if (l1Contracts.L2CrossDomainMessengerProxy) {
                firstL2Config.crossDomainMessenger = l1Contracts.L2CrossDomainMessengerProxy;
                autoFilledFields.add('crossDomainMessenger');
              }
              if (l1Contracts.L1CrossDomainMessengerProxy) {
                firstL2Config.l1CrossDomainMessenger = l1Contracts.L1CrossDomainMessengerProxy;
                autoFilledFields.add('l1CrossDomainMessenger');
              }
              if (l1Contracts.L1StandardBridgeProxy) {
                firstL2Config.l1StandardBridgeAddress = l1Contracts.L1StandardBridgeProxy;
                autoFilledFields.add('l1StandardBridgeAddress');
              }
              if (l1Contracts.L1UsdcBridgeProxy) {
                firstL2Config.l1UsdcBridgeAddress = l1Contracts.L1UsdcBridgeProxy;
                autoFilledFields.add('l1UsdcBridgeAddress');
              }
            }
            
            // Update the first L2 chain config
            const updatedConfigs = [firstL2Config, ...currentL2Configs.slice(1)];
            form.setValue("l2ChainConfig", updatedConfigs);
            
            // Get chainId from deployConfig, currentChainId, or firstL2Config
            const chainId = deployConfig?.l2ChainID || currentChainId || firstL2Config.chainId || 0;
            
            // Fetch crossDomainMessenger from default-contract-addresses API if chainId is available
            if (chainId > 0) {
              fetchDefaultContractAddresses(chainId)
                .then((contractAddresses) => {
                  if (contractAddresses) {
                    const updatedConfigs = form.getValues("l2ChainConfig");
                    if (updatedConfigs.length > 0) {
                      const updatedFirstConfig = { ...updatedConfigs[0] };
                      const updatedAutoFilledFields = new Set(autoFilledFields);
                      
                      // Set crossDomainMessenger from API
                      updatedFirstConfig.crossDomainMessenger = contractAddresses.l2CrossDomainMessenger;
                      updatedAutoFilledFields.add('crossDomainMessenger');
                      
                      // Also update other fields if they weren't set from stack config
                      if (!updatedFirstConfig.nativeTokenAddress && contractAddresses.nativeTokenAddress) {
                        updatedFirstConfig.nativeTokenAddress = contractAddresses.nativeTokenAddress;
                        updatedAutoFilledFields.add('nativeTokenAddress');
                      }
                      if (!updatedFirstConfig.l1StandardBridgeAddress && contractAddresses.l1StandardBridgeAddress) {
                        updatedFirstConfig.l1StandardBridgeAddress = contractAddresses.l1StandardBridgeAddress;
                        updatedAutoFilledFields.add('l1StandardBridgeAddress');
                      }
                      if (!updatedFirstConfig.l1UsdcBridgeAddress && contractAddresses.l1UsdcBridgeAddress) {
                        updatedFirstConfig.l1UsdcBridgeAddress = contractAddresses.l1UsdcBridgeAddress;
                        updatedAutoFilledFields.add('l1UsdcBridgeAddress');
                      }
                      if (!updatedFirstConfig.l1CrossDomainMessenger && contractAddresses.l1CrossDomainMessenger) {
                        updatedFirstConfig.l1CrossDomainMessenger = contractAddresses.l1CrossDomainMessenger;
                        updatedAutoFilledFields.add('l1CrossDomainMessenger');
                      }
                      
                      form.setValue("l2ChainConfig", [updatedFirstConfig, ...updatedConfigs.slice(1)]);
                      
                      // Update auto-filled fields state
                      setL2AutoFilledFields(prev => ({
                        ...prev,
                        0: updatedAutoFilledFields,
                      }));
                    }
                  }
                })
                .catch((error) => {
                  console.error("Failed to fetch default contract addresses for first chain:", error);
                });
            }
            
            // Mark fields as auto-filled for the first chain (index 0) - will be updated when API call completes
            if (autoFilledFields.size > 0) {
              setL2AutoFilledFields(prev => ({
                ...prev,
                0: autoFilledFields,
              }));
            }
          }
        })
        .catch((error) => {
          console.error("Failed to fetch stack data:", error);
        })
        .finally(() => {
          setIsLoadingStack(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, stackId]);

  // Update first L2 chain with current chain values when dialog opens
  React.useEffect(() => {
    if (open && (currentChainRpcUrl || currentChainId !== undefined)) {
      const currentL2Configs = form.getValues("l2ChainConfig");
      if (currentL2Configs.length > 0) {
        // Preserve existing values and only update RPC and chainId
        const updatedFirstConfig = {
          ...currentL2Configs[0],
          rpc: currentChainRpcUrl || currentL2Configs[0].rpc || "",
          chainId: currentChainId !== undefined ? currentChainId : currentL2Configs[0].chainId || 0,
        };
        // Update the first L2 chain config
        const updatedConfigs = [
          updatedFirstConfig,
          ...currentL2Configs.slice(1)
        ];
        form.setValue("l2ChainConfig", updatedConfigs);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentChainRpcUrl, currentChainId]);

  // Set form mode when propMode is provided (on mount or when propMode changes)
  React.useEffect(() => {
    if (propMode) {
      form.setValue("mode", propMode);
      const currentL2Configs = form.getValues("l2ChainConfig");
      if (propMode === "l2_to_l1") {
        // L2 to L1 requires exactly 1 chain
        if (currentL2Configs.length !== 1) {
          const updatedFirstConfig = currentChainRpcUrl || currentChainId !== undefined
            ? {
                ...defaultL2Config,
                rpc: currentChainRpcUrl || "",
                chainId: currentChainId || 0,
              }
            : defaultL2Config;
          const firstConfig = currentL2Configs[0] || updatedFirstConfig;
          form.setValue("l2ChainConfig", [firstConfig]);
          // Update state arrays to match
          setL2ExplorerEnabled([l2ExplorerEnabled[0] ?? false]);
          setL2FetchingChainId([l2FetchingChainId[0] ?? false]);
          setL2BalanceErrors([l2BalanceErrors[0] ?? null]);
        }
      } else if (propMode === "l2_to_l2") {
        // L2 to L2 requires at least 2 chains
        if (currentL2Configs.length < 2) {
          const updatedFirstConfig = currentChainRpcUrl || currentChainId !== undefined
            ? {
                ...defaultL2Config,
                rpc: currentChainRpcUrl || "",
                chainId: currentChainId || 0,
              }
            : defaultL2Config;
          const newConfigs = currentL2Configs.length === 0
            ? [updatedFirstConfig, defaultL2Config]
            : [...currentL2Configs, defaultL2Config];
          form.setValue("l2ChainConfig", newConfigs);
          // Update state arrays to match
          setL2ExplorerEnabled(prev => [...prev, false].slice(0, newConfigs.length));
          setL2FetchingChainId(prev => [...prev, false].slice(0, newConfigs.length));
          setL2BalanceErrors(prev => [...prev, null].slice(0, newConfigs.length));
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propMode]);

  const {
    fields: l2Fields,
    append: appendL2,
    remove: removeL2,
  } = useFieldArray({
    control: form.control,
    name: "l2ChainConfig",
  });

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pendingData, setPendingData] =
    React.useState<InstallCrossChainBridgeRequestBody | null>(null);

  const [l1ExplorerEnabled, setL1ExplorerEnabled] = React.useState(false);
  const [l2ExplorerEnabled, setL2ExplorerEnabled] = React.useState<boolean[]>(
    []
  );

  // State for chainId fetching and balance checking
  const [l1FetchingChainId, setL1FetchingChainId] = React.useState(false);
  const [l2FetchingChainId, setL2FetchingChainId] = React.useState<boolean[]>(
    []
  );
  const [l1ChainIdError, setL1ChainIdError] = React.useState<boolean>(false);
  const [l2ChainIdErrors, setL2ChainIdErrors] = React.useState<boolean[]>([]);
  const [l1BalanceError, setL1BalanceError] = React.useState<string | null>(
    null
  );
  const [l2BalanceErrors, setL2BalanceErrors] = React.useState<
    (string | null)[]
  >([]);

  // State to track which fields are auto-filled for each L2 chain (for index >= 1)
  const [l2AutoFilledFields, setL2AutoFilledFields] = React.useState<
    Record<number, Set<string>>
  >({});

  React.useEffect(() => {
    if (l2Fields.length !== l2ExplorerEnabled.length) {
      setL2ExplorerEnabled(new Array(l2Fields.length).fill(false));
      setL2FetchingChainId(new Array(l2Fields.length).fill(false));
      setL2ChainIdErrors(new Array(l2Fields.length).fill(false));
      setL2BalanceErrors(new Array(l2Fields.length).fill(null));
    }
  }, [l2Fields.length]);

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
      // Don't show error for invalid private key or network issues
      setError(null);
    }
  };

  // Type for default contract addresses
  type DefaultContractAddresses = {
    l2CrossDomainMessenger: string;
    nativeTokenAddress: string;
    l1StandardBridgeAddress: string;
    l1UsdcBridgeAddress: string;
    l1CrossDomainMessenger: string;
  };

  // Type for the fetch function
  type FetchDefaultContractAddresses = (
    chainId: number
  ) => Promise<DefaultContractAddresses | null>;

  // Function to fetch default contract addresses by chain ID
  const fetchDefaultContractAddresses: FetchDefaultContractAddresses = async (chainId: number) => {
    try {
      // The API returns: { status: 200, message: "Success", data: { "10": {...}, "11155420": {...} } }
      // apiGet wraps it: { data: { status, message, data }, success, message? }
      const response = await apiGet<any>("stacks/thanos/default-contract-addresses");

      console.log("Default Contract Addresses API Full Response:", JSON.stringify(response, null, 2));
      console.log("Looking for chain ID:", chainId);

      // Extract the actual data object from the response
      // The backend returns: { status: 200, message: "Success", data: {...} }
      // apiGet wraps it, so response.data contains the backend response
      let apiData: Record<string, any> | undefined;
      
      // Try to find the data object in various possible locations
      if (response.data?.data && typeof response.data.data === 'object' && !Array.isArray(response.data.data)) {
        // Case: response.data = { status: 200, message: "Success", data: {...} }
        apiData = response.data.data;
      } else if (response.data && typeof response.data === 'object' && !Array.isArray(response.data) && !response.data.status) {
        // Case: response.data is directly the data object
        apiData = response.data;
      } else if (response && typeof response === 'object' && !Array.isArray(response) && response.data) {
        // Case: response itself has the structure
        apiData = response.data;
      }

      const chainIdStr = chainId.toString();
      
      console.log("Extracted API Data:", apiData);
      console.log("Chain ID string:", chainIdStr);
      console.log("Available chain IDs in data:", apiData ? Object.keys(apiData) : 'none');
      console.log("Matching data for chain ID", chainIdStr, ":", apiData?.[chainIdStr]);
      
      if (apiData && apiData[chainIdStr]) {
        const contractData = apiData[chainIdStr];
        console.log("✓ Found contract data for chain ID", chainIdStr, ":", contractData);
        return {
          l2CrossDomainMessenger: contractData.l2_cross_domain_messenger_address,
          nativeTokenAddress: contractData.native_token_address,
          l1StandardBridgeAddress: contractData.l1_standard_bridge_address,
          l1UsdcBridgeAddress: contractData.l1_usdc_bridge_address,
          l1CrossDomainMessenger: contractData.l1_cross_domain_messenger_address,
        };
      }
      console.warn("✗ No contract data found for chain ID:", chainIdStr);
      return null;
    } catch (error) {
      console.error("Error fetching default contract addresses:", error);
      return null;
    }
  };

  // Watch L1 RPC and fetch chainId
  const l1Rpc = form.watch("l1ChainConfig.rpc");
  React.useEffect(() => {
    if (l1Rpc && l1Rpc.trim()) {
      // Reset error state when RPC changes
      setL1ChainIdError(false);
      const timeoutId = setTimeout(() => {
        fetchChainIdFromRpc(
          l1Rpc,
          setL1FetchingChainId,
          (chainId) => form.setValue("l1ChainConfig.chainId", chainId),
          setL1ChainIdError
        );
      }, 500); // Debounce

      return () => clearTimeout(timeoutId);
    } else {
      // Reset error and chainId when RPC is cleared
      setL1ChainIdError(false);
      form.setValue("l1ChainConfig.chainId", 0);
    }
  }, [l1Rpc, form]);

  // Watch L1 private key and RPC, check balance
  const l1PrivateKey = form.watch("l1ChainConfig.privateKey");
  React.useEffect(() => {
    if (l1Rpc && l1PrivateKey && l1Rpc.trim() && l1PrivateKey.trim()) {
      const timeoutId = setTimeout(() => {
        checkBalance(l1Rpc, l1PrivateKey, setL1BalanceError);
      }, 500); // Debounce

      return () => clearTimeout(timeoutId);
    } else {
      setL1BalanceError(null);
    }
  }, [l1Rpc, l1PrivateKey]);

  // Watch L2 RPCs and fetch chainIds
  const l2Rpcs = form.watch("l2ChainConfig")?.map((config) => config.rpc) || [];
  React.useEffect(() => {
    l2Rpcs.forEach((rpc, index) => {
      if (rpc && rpc.trim()) {
        // Reset error state when RPC changes
        setL2ChainIdErrors(prev => {
          const newErrors = [...prev];
          newErrors[index] = false;
          return newErrors;
        });
        const timeoutId = setTimeout(() => {
          fetchChainIdFromRpc(
            rpc,
            (loading) => {
              setL2FetchingChainId(prev => {
                const newFetching = [...prev];
                newFetching[index] = loading;
                return newFetching;
              });
            },
            async (chainId) => {
              form.setValue(`l2ChainConfig.${index}.chainId`, chainId);
              
              // Fetch and fill default contract addresses for all chains when chainId is available
              if (chainId > 0) {
                console.log(`Fetching default contract addresses for L2 chain ${index} with chain ID:`, chainId);
                const contractAddresses = await fetchDefaultContractAddresses(chainId);
                if (contractAddresses) {
                  console.log(`Setting default contract addresses for L2 chain ${index}:`, contractAddresses);
                  form.setValue(`l2ChainConfig.${index}.crossDomainMessenger`, contractAddresses.l2CrossDomainMessenger);
                  form.setValue(`l2ChainConfig.${index}.nativeTokenAddress`, contractAddresses.nativeTokenAddress);
                  form.setValue(`l2ChainConfig.${index}.l1StandardBridgeAddress`, contractAddresses.l1StandardBridgeAddress);
                  form.setValue(`l2ChainConfig.${index}.l1UsdcBridgeAddress`, contractAddresses.l1UsdcBridgeAddress);
                  form.setValue(`l2ChainConfig.${index}.l1CrossDomainMessenger`, contractAddresses.l1CrossDomainMessenger);
                  
                  // Mark these fields as auto-filled
                  setL2AutoFilledFields(prev => ({
                    ...prev,
                    [index]: new Set([
                      'crossDomainMessenger',
                      'nativeTokenAddress',
                      'l1StandardBridgeAddress',
                      'l1UsdcBridgeAddress',
                      'l1CrossDomainMessenger',
                    ]),
                  }));
                  
                  // Verify the values were set
                  const updatedConfig = form.getValues(`l2ChainConfig.${index}`);
                  console.log(`Verified L2 chain ${index} config after setting:`, {
                    crossDomainMessenger: updatedConfig.crossDomainMessenger,
                    nativeTokenAddress: updatedConfig.nativeTokenAddress,
                    l1StandardBridgeAddress: updatedConfig.l1StandardBridgeAddress,
                    l1UsdcBridgeAddress: updatedConfig.l1UsdcBridgeAddress,
                    l1CrossDomainMessenger: updatedConfig.l1CrossDomainMessenger,
                  });
                } else {
                  console.warn(`No contract addresses found for chain ID ${chainId}, clearing fields`);
                  // Clear contract address fields if not found
                  form.setValue(`l2ChainConfig.${index}.crossDomainMessenger`, "");
                  form.setValue(`l2ChainConfig.${index}.nativeTokenAddress`, "");
                  form.setValue(`l2ChainConfig.${index}.l1StandardBridgeAddress`, "");
                  form.setValue(`l2ChainConfig.${index}.l1UsdcBridgeAddress`, "");
                  form.setValue(`l2ChainConfig.${index}.l1CrossDomainMessenger`, "");
                  
                  // Clear auto-filled fields tracking
                  setL2AutoFilledFields(prev => {
                    const updated = { ...prev };
                    delete updated[index];
                    return updated;
                  });
                }
              }
            },
            (error) => {
              setL2ChainIdErrors(prev => {
                const newErrors = [...prev];
                newErrors[index] = error;
                return newErrors;
              });
            }
          );
        }, 500); // Debounce

        return () => clearTimeout(timeoutId);
      } else {
        // Reset error and chainId when RPC is cleared
        setL2ChainIdErrors(prev => {
          const newErrors = [...prev];
          newErrors[index] = false;
          return newErrors;
        });
        form.setValue(`l2ChainConfig.${index}.chainId`, 0);
        // Clear contract address fields when RPC is cleared
        form.setValue(`l2ChainConfig.${index}.crossDomainMessenger`, "");
        form.setValue(`l2ChainConfig.${index}.nativeTokenAddress`, "");
        form.setValue(`l2ChainConfig.${index}.l1StandardBridgeAddress`, "");
        form.setValue(`l2ChainConfig.${index}.l1UsdcBridgeAddress`, "");
        form.setValue(`l2ChainConfig.${index}.l1CrossDomainMessenger`, "");
        // Clear auto-filled fields tracking
        setL2AutoFilledFields(prev => {
          const updated = { ...prev };
          delete updated[index];
          return updated;
        });
      }
    });
  }, [l2Rpcs.join(","), form]);

  // Watch L2 private keys and RPCs, check balances
  const l2PrivateKeys =
    form.watch("l2ChainConfig")?.map((config) => config.privateKey) || [];
  React.useEffect(() => {
    l2PrivateKeys.forEach((privateKey, index) => {
      const rpc = l2Rpcs[index];
      if (rpc && privateKey && rpc.trim() && privateKey.trim()) {
        const timeoutId = setTimeout(() => {
          checkBalance(rpc, privateKey, (error) => {
            const newErrors = [...l2BalanceErrors];
            newErrors[index] = error;
            setL2BalanceErrors(newErrors);
          });
        }, 500); // Debounce

        return () => clearTimeout(timeoutId);
      } else {
        const newErrors = [...l2BalanceErrors];
        newErrors[index] = null;
        setL2BalanceErrors(newErrors);
      }
    });
  }, [l2PrivateKeys.join(","), l2Rpcs.join(",")]);

  const handleSubmit = form.handleSubmit((data) => {
    // Check for balance errors
    if (l1BalanceError) {
      return; // Don't submit if L1 balance is 0
    }
    if (l2BalanceErrors.some((error) => error !== null)) {
      return; // Don't submit if any L2 balance is 0
    }
    
    // Check for ChainID validation errors
    if (l1ChainIdError || data.l1ChainConfig.chainId <= 0) {
      return; // Don't submit if L1 ChainID is invalid
    }
    if (l2ChainIdErrors.some((error) => error === true) || 
        data.l2ChainConfig.some((config) => config.chainId <= 0)) {
      return; // Don't submit if any L2 ChainID is invalid
    }

    // Transform data to match backend expectations
    // Both L1 and L2 use camelCase
    const transformedData = {
      mode: data.mode,
      projectId: data.projectId,
      l1ChainConfig: {
        rpc: data.l1ChainConfig.rpc,
        chainId: data.l1ChainConfig.chainId,
        chainName: data.l1ChainConfig.chain_name,
        privateKey: data.l1ChainConfig.privateKey,
        isDeployedNew: data.l1ChainConfig.isDeployedNew,
        ...(data.l1ChainConfig.deploymentScriptPath && {
          deploymentScriptPath: data.l1ChainConfig.deploymentScriptPath,
        }),
        ...(data.l1ChainConfig.contractName && {
          contractName: data.l1ChainConfig.contractName,
        }),
        ...(data.l1ChainConfig.blockExplorerConfig && {
          blockExplorerConfig: {
            url: data.l1ChainConfig.blockExplorerConfig.url,
            type: data.l1ChainConfig.blockExplorerConfig.type,
            ...(data.l1ChainConfig.blockExplorerConfig.apiKey && {
              apiKey: data.l1ChainConfig.blockExplorerConfig.apiKey,
            }),
          },
        }),
        ...(data.l1ChainConfig.crossTradeProxyAddress && {
          crossTradeProxyAddress: data.l1ChainConfig.crossTradeProxyAddress,
        }),
        ...(data.l1ChainConfig.crossTradeAddress && {
          crossTradeAddress: data.l1ChainConfig.crossTradeAddress,
        }),
      },
      l2ChainConfig: data.l2ChainConfig.map((config) => ({
        rpc: config.rpc,
        chainId: config.chainId,
        chainName: config.chain_name,
        privateKey: config.privateKey,
        isDeployedNew: config.isDeployedNew,
        ...(config.deploymentScriptPath && {
          deploymentScriptPath: config.deploymentScriptPath,
        }),
        ...(config.contractName && {
          contractName: config.contractName,
        }),
        ...(config.blockExplorerConfig && {
          blockExplorerConfig: {
            url: config.blockExplorerConfig.url,
            type: config.blockExplorerConfig.type,
            ...(config.blockExplorerConfig.apiKey && {
              apiKey: config.blockExplorerConfig.apiKey,
            }),
          },
        }),
        crossDomainMessenger: config.crossDomainMessenger, // required
        ...(config.crossTradeProxyAddress && {
          crossTradeProxyAddress: config.crossTradeProxyAddress,
        }),
        ...(config.crossTradeAddress && {
          crossTradeAddress: config.crossTradeAddress,
        }),
        nativeTokenAddress: config.nativeTokenAddress, // required
        l1StandardBridgeAddress: config.l1StandardBridgeAddress, // required
        l1UsdcBridgeAddress: config.l1UsdcBridgeAddress, // required
        l1CrossDomainMessenger: config.l1CrossDomainMessenger, // required
      })),
    };
    
    setPendingData(transformedData);
    setConfirmOpen(true);
  });

  // Check if submit should be disabled
  const hasBalanceErrors =
    l1BalanceError !== null ||
    l2BalanceErrors.some((error) => error !== null);
  
  // Check if ChainID fetching is in progress
  const isFetchingChainIds =
    l1FetchingChainId ||
    l2FetchingChainId.some((fetching) => fetching === true);
  
  // Check if any ChainID fetch failed or ChainID is invalid
  // Only validate ChainID if RPC is provided
  const l1RpcValue = form.watch("l1ChainConfig.rpc");
  const l1ChainIdValue = form.watch("l1ChainConfig.chainId");
  const l1ChainIdValid = !l1RpcValue || !l1RpcValue.trim() || l1ChainIdValue > 0;
  
  const l2Configs = form.watch("l2ChainConfig") || [];
  const allL2ChainIdsValid = l2Configs.every((config) => {
    // If RPC is provided, ChainID must be > 0
    if (config.rpc && config.rpc.trim()) {
      return config.chainId > 0;
    }
    // If RPC is not provided, skip ChainID validation (schema will catch missing RPC)
    return true;
  });
  
  const hasChainIdErrors =
    l1ChainIdError ||
    l2ChainIdErrors.some((error) => error === true) ||
    !l1ChainIdValid ||
    !allL2ChainIdsValid;
  
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
      const resetMode = propMode || "l2_to_l1";
      const resetFirstConfig = currentChainRpcUrl || currentChainId !== undefined
        ? {
            ...defaultL2Config,
            rpc: currentChainRpcUrl || "",
            chainId: currentChainId || 0,
          }
        : defaultL2Config;
      const resetL2Configs = resetMode === "l2_to_l2" 
        ? [resetFirstConfig, defaultL2Config] 
        : [resetFirstConfig];
      form.reset({
        mode: resetMode,
        projectId: "",
        l1ChainConfig: defaultL1Config,
        l2ChainConfig: resetL2Configs,
      });
      setL1ExplorerEnabled(false);
      setL2ExplorerEnabled(resetMode === "l2_to_l2" ? [false, false] : [false]);
      setL2FetchingChainId(resetMode === "l2_to_l2" ? [false, false] : [false]);
      setL2ChainIdErrors(resetMode === "l2_to_l2" ? [false, false] : [false]);
      setL2BalanceErrors(resetMode === "l2_to_l2" ? [null, null] : [null]);
      setL1ChainIdError(false);
      setL2AutoFilledFields({});
    }
    onOpenChange(next);
  };

  const toggleL1Explorer = (enabled: boolean) => {
    setL1ExplorerEnabled(enabled);
    if (enabled) {
      form.setValue("l1ChainConfig.blockExplorerConfig", {
        apiKey: "",
        url: "",
        type: "etherscan" as BlockExplorerType,
      });
    } else {
      form.setValue("l1ChainConfig.blockExplorerConfig", null);
    }
  };

  const toggleL2Explorer = (index: number, enabled: boolean) => {
    const newEnabled = [...l2ExplorerEnabled];
    newEnabled[index] = enabled;
    setL2ExplorerEnabled(newEnabled);
    if (enabled) {
      form.setValue(`l2ChainConfig.${index}.blockExplorerConfig`, {
        apiKey: "",
        url: "",
        type: "etherscan" as BlockExplorerType,
      });
    } else {
      form.setValue(`l2ChainConfig.${index}.blockExplorerConfig`, null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Install Cross-Chain Bridge {propMode === "l2_to_l1" ? "(L2 to L1)" : propMode === "l2_to_l2" ? "(L2 to L2)" : ""}
            </DialogTitle>
            <DialogDescription>
              Configure cross-chain bridge deployment settings for L1 and L2
              chains.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mode and Project ID */}
            <div className="space-y-4">
              {!propMode && (
                <div className="space-y-2">
                  <Label htmlFor="mode">Mode</Label>
                  <Select
                    value={form.watch("mode")}
                    onValueChange={(value: "l2_to_l1" | "l2_to_l2") => {
                      form.setValue("mode", value);
                      const currentL2Configs = form.getValues("l2ChainConfig");
                      
                      if (value === "l2_to_l1") {
                        // If switching to l2_to_l1, ensure only one L2 chain
                        if (currentL2Configs.length !== 1) {
                          const updatedFirstConfig = currentChainRpcUrl || currentChainId !== undefined
                            ? {
                                ...defaultL2Config,
                                rpc: currentChainRpcUrl || "",
                                chainId: currentChainId || 0,
                              }
                            : defaultL2Config;
                          const firstConfig = currentL2Configs[0] || updatedFirstConfig;
                          form.setValue("l2ChainConfig", [firstConfig]);
                          // Update state arrays
                          setL2ExplorerEnabled([l2ExplorerEnabled[0] ?? false]);
                          setL2FetchingChainId([l2FetchingChainId[0] ?? false]);
                          setL2BalanceErrors([l2BalanceErrors[0] ?? null]);
                        }
                      } else if (value === "l2_to_l2") {
                        // If switching to l2_to_l2, ensure at least two L2 chains
                        if (currentL2Configs.length < 2) {
                          const updatedFirstConfig = currentChainRpcUrl || currentChainId !== undefined
                            ? {
                                ...defaultL2Config,
                                rpc: currentChainRpcUrl || "",
                                chainId: currentChainId || 0,
                              }
                            : defaultL2Config;
                          const newConfigs = currentL2Configs.length === 0
                            ? [updatedFirstConfig, defaultL2Config]
                            : [...currentL2Configs, defaultL2Config];
                          form.setValue("l2ChainConfig", newConfigs);
                          // Update state arrays
                          const newLength = newConfigs.length;
                          setL2ExplorerEnabled(prev => {
                            const updated = [...prev];
                            while (updated.length < newLength) updated.push(false);
                            return updated.slice(0, newLength);
                          });
                          setL2FetchingChainId(prev => {
                            const updated = [...prev];
                            while (updated.length < newLength) updated.push(false);
                            return updated.slice(0, newLength);
                          });
                          setL2BalanceErrors(prev => {
                            const updated = [...prev];
                            while (updated.length < newLength) updated.push(null);
                            return updated.slice(0, newLength);
                          });
                        }
                      }
                    }}
                    disabled={isPending}
                  >
                    <SelectTrigger id="mode">
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="l2_to_l1">L2 to L1</SelectItem>
                      <SelectItem value="l2_to_l2">L2 to L2</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.mode && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.mode.message}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="projectId">Project ID</Label>
                <Input
                  id="projectId"
                  placeholder="Enter project ID"
                  disabled={isPending}
                  {...form.register("projectId")}
                  className={
                    form.formState.errors.projectId
                      ? "border-destructive"
                      : ""
                  }
                />
                {form.formState.errors.projectId && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.projectId.message}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* L1 Chain Config */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">L1 Chain Configuration</h3>

                <div className="space-y-2">
                  <Label htmlFor="l1ChainName">Chain Name</Label>
                  <Input
                    id="l1ChainName"
                    placeholder="Enter chain name"
                    disabled={isPending}
                    {...form.register("l1ChainConfig.chain_name")}
                    className={
                      form.formState.errors.l1ChainConfig?.chain_name
                        ? "border-destructive"
                        : ""
                    }
                  />
                  {form.formState.errors.l1ChainConfig?.chain_name && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.l1ChainConfig.chain_name.message}
                    </p>
                  )}
                </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="l1Rpc">RPC URL</Label>
                  <Input
                    id="l1Rpc"
                    placeholder="https://..."
                    disabled={isPending}
                    {...form.register("l1ChainConfig.rpc")}
                    className={
                      form.formState.errors.l1ChainConfig?.rpc
                        ? "border-destructive"
                        : ""
                    }
                  />
                  {form.formState.errors.l1ChainConfig?.rpc && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.l1ChainConfig.rpc.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="l1ChainId">
                    Chain ID {l1FetchingChainId && "(Fetching...)"}
                  </Label>
              <Input
                    id="l1ChainId"
                type="number"
                    placeholder="Auto-fetched from RPC"
                    disabled={true}
                    value={
                      form.watch("l1ChainConfig.chainId") &&
                      form.watch("l1ChainConfig.chainId") > 0
                        ? form.watch("l1ChainConfig.chainId")
                        : ""
                    }
                    className={
                      form.formState.errors.l1ChainConfig?.chainId
                        ? "border-destructive"
                        : ""
                    }
                  />
                  {form.formState.errors.l1ChainConfig?.chainId && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.l1ChainConfig.chainId.message}
                    </p>
                  )}
                </div>

                

                <div className="space-y-2">
                  <Label htmlFor="l1PrivateKey">Private Key</Label>
                  <Input
                    id="l1PrivateKey"
                    type="password"
                    placeholder="0x..."
                    disabled={isPending}
                    {...form.register("l1ChainConfig.privateKey")}
                    className={
                      form.formState.errors.l1ChainConfig?.privateKey
                        ? "border-destructive"
                        : ""
                    }
                  />
                  {form.formState.errors.l1ChainConfig?.privateKey && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.l1ChainConfig.privateKey.message}
                    </p>
                  )}
                  {l1BalanceError && (
                    <p className="text-sm text-destructive">{l1BalanceError}</p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="l1IsDeployedNew"
                    checked={form.watch("l1ChainConfig.isDeployedNew")}
                    onCheckedChange={(checked) =>
                      form.setValue("l1ChainConfig.isDeployedNew", checked)
                    }
                    disabled={isPending}
                  />
                  <Label htmlFor="l1IsDeployedNew">Deploy New Contract</Label>
                </div>

                {!form.watch("l1ChainConfig.isDeployedNew") && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="l1CrossTradeProxyAddress">
                        Cross Trade Proxy Address
                      </Label>
                      <Input
                        id="l1CrossTradeProxyAddress"
                        placeholder="0x..."
                        disabled={isPending}
                        {...form.register("l1ChainConfig.crossTradeProxyAddress")}
                        className={
                          form.formState.errors.l1ChainConfig
                            ?.crossTradeProxyAddress
                            ? "border-destructive"
                            : ""
                        }
                      />
                      {form.formState.errors.l1ChainConfig
                        ?.crossTradeProxyAddress && (
                        <p className="text-sm text-destructive">
                          {
                            form.formState.errors.l1ChainConfig
                              .crossTradeProxyAddress.message
                          }
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="l1CrossTradeAddress">
                        Cross Trade Address
                      </Label>
                      <Input
                        id="l1CrossTradeAddress"
                        placeholder="0x..."
                disabled={isPending}
                        {...form.register("l1ChainConfig.crossTradeAddress")}
                className={
                          form.formState.errors.l1ChainConfig?.crossTradeAddress
                            ? "border-destructive"
                            : ""
                        }
                      />
                      {form.formState.errors.l1ChainConfig?.crossTradeAddress && (
                        <p className="text-sm text-destructive">
                          {
                            form.formState.errors.l1ChainConfig.crossTradeAddress
                              .message
                          }
                        </p>
                      )}
                    </div>
                  </>
                )}

                {/* Block Explorer Config for L1 */}
                <div className="flex items-center space-x-2">
                  <Switch
                    id="l1ExplorerEnabled"
                    checked={l1ExplorerEnabled}
                    onCheckedChange={toggleL1Explorer}
                    disabled={isPending}
                  />
                  <Label htmlFor="l1ExplorerEnabled">
                    Verify Contracts on Block Explorer (Optional)
                  </Label>
                </div>

                {l1ExplorerEnabled && (
                  <div className="ml-6 space-y-4 rounded-md border p-4">
                    <div className="space-y-2">
                      <Label htmlFor="l1ExplorerType">Explorer Type</Label>
                      <Select
                        value={
                          form.watch("l1ChainConfig.blockExplorerConfig.type") ||
                          "etherscan"
                        }
                        onValueChange={(value: BlockExplorerType) => {
                          form.setValue(
                            "l1ChainConfig.blockExplorerConfig.type",
                            value
                          );
                          // Clear API key when switching to Blockscout
                          if (value === "blockscout") {
                            form.setValue(
                              "l1ChainConfig.blockExplorerConfig.apiKey",
                              ""
                            );
                          }
                        }}
                        disabled={isPending}
                      >
                        <SelectTrigger id="l1ExplorerType">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="etherscan">Etherscan</SelectItem>
                          <SelectItem value="blockscout">Blockscout</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {form.watch("l1ChainConfig.blockExplorerConfig.type") ===
                      "etherscan" && (
                      <div className="space-y-2">
                        <Label htmlFor="l1ExplorerApiKey">API Key *</Label>
                        <Input
                          id="l1ExplorerApiKey"
                          placeholder="API key"
                          disabled={isPending}
                          {...form.register(
                            "l1ChainConfig.blockExplorerConfig.apiKey"
                          )}
                        />
                        {form.formState.errors.l1ChainConfig?.blockExplorerConfig
                          ?.apiKey && (
                <p className="text-sm text-destructive">
                            {
                              form.formState.errors.l1ChainConfig
                                .blockExplorerConfig?.apiKey?.message
                            }
                </p>
              )}
            </div>
                    )}

            <div className="space-y-2">
                      <Label htmlFor="l1ExplorerUrl">URL</Label>
                      <Input
                        id="l1ExplorerUrl"
                        placeholder="https://..."
                        disabled={isPending}
                        {...form.register(
                          "l1ChainConfig.blockExplorerConfig.url"
                        )}
                      />
                      {form.formState.errors.l1ChainConfig?.blockExplorerConfig
                        ?.url && (
                        <p className="text-sm text-destructive">
                          {
                            form.formState.errors.l1ChainConfig
                              .blockExplorerConfig?.url?.message
                          }
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* L2 Chain Configs */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">L2 Chain Configuration</h3>
                {(propMode === "l2_to_l2" || (!propMode && form.watch("mode") === "l2_to_l2")) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      appendL2(defaultL2Config);
                      setL2ExplorerEnabled([...l2ExplorerEnabled, false]);
                      setL2FetchingChainId([...l2FetchingChainId, false]);
                      setL2BalanceErrors([...l2BalanceErrors, null]);
                    }}
                    disabled={isPending}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add L2 Chain
                  </Button>
                )}
              </div>

              {l2Fields.map((field, index) => (
                <div
                  key={field.id}
                  className="rounded-lg border p-4 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">L2 Chain {index + 1}</h4>
                    {(propMode === "l2_to_l2" || (!propMode && form.watch("mode") === "l2_to_l2")) &&
                      l2Fields.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            removeL2(index);
                            const newEnabled = [...l2ExplorerEnabled];
                            newEnabled.splice(index, 1);
                            setL2ExplorerEnabled(newEnabled);
                            const newFetching = [...l2FetchingChainId];
                            newFetching.splice(index, 1);
                            setL2FetchingChainId(newFetching);
                            const newErrors = [...l2BalanceErrors];
                            newErrors.splice(index, 1);
                            setL2BalanceErrors(newErrors);
                            // Clear all auto-filled fields since indices will shift
                            setL2AutoFilledFields({});
                          }}
                          disabled={isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                  </div>

                    <div className="space-y-2">
                      <Label htmlFor={`l2ChainName-${index}`}>
                        Chain Name
                      </Label>
                      <Input
                        id={`l2ChainName-${index}`}
                        placeholder="Enter chain name"
                        disabled={isPending}
                        {...form.register(`l2ChainConfig.${index}.chain_name`)}
                        className={
                          form.formState.errors.l2ChainConfig?.[index]?.chain_name
                            ? "border-destructive"
                            : ""
                        }
                      />
                      {form.formState.errors.l2ChainConfig?.[index]?.chain_name && (
                        <p className="text-sm text-destructive">
                          {
                            form.formState.errors.l2ChainConfig[index]?.chain_name
                              ?.message
                          }
                        </p>
                      )}
                    </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`l2Rpc-${index}`}>RPC URL</Label>
                      <Input
                        id={`l2Rpc-${index}`}
                        placeholder="https://..."
                        disabled={isPending}
                        {...form.register(`l2ChainConfig.${index}.rpc`)}
                        className={
                          form.formState.errors.l2ChainConfig?.[index]?.rpc
                            ? "border-destructive"
                            : ""
                        }
                      />
                      {form.formState.errors.l2ChainConfig?.[index]?.rpc && (
                        <p className="text-sm text-destructive">
                          {
                            form.formState.errors.l2ChainConfig[index]?.rpc
                              ?.message
                          }
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`l2ChainId-${index}`}>
                        Chain ID{" "}
                        {l2FetchingChainId[index] && "(Fetching...)"}
                      </Label>
                      <Input
                        id={`l2ChainId-${index}`}
                        type="number"
                        placeholder="Auto-fetched from RPC"
                        disabled={true}
                        value={
                          form.watch(`l2ChainConfig.${index}.chainId`) &&
                          form.watch(`l2ChainConfig.${index}.chainId`) > 0
                            ? form.watch(`l2ChainConfig.${index}.chainId`)
                            : ""
                        }
                        className={
                          form.formState.errors.l2ChainConfig?.[index]?.chainId
                            ? "border-destructive"
                            : ""
                        }
                      />
                      {form.formState.errors.l2ChainConfig?.[index]?.chainId && (
                        <p className="text-sm text-destructive">
                          {
                            form.formState.errors.l2ChainConfig[index]?.chainId
                              ?.message
                          }
                        </p>
                      )}
                    </div>

                    

                    <div className="space-y-2">
                      <Label htmlFor={`l2PrivateKey-${index}`}>
                        Private Key
                      </Label>
                      <Input
                        id={`l2PrivateKey-${index}`}
                        type="password"
                        placeholder="0x..."
                        disabled={isPending}
                        {...form.register(`l2ChainConfig.${index}.privateKey`)}
                        className={
                          form.formState.errors.l2ChainConfig?.[index]
                            ?.privateKey
                            ? "border-destructive"
                            : ""
                        }
                      />
                      {form.formState.errors.l2ChainConfig?.[index]
                        ?.privateKey && (
                        <p className="text-sm text-destructive">
                          {
                            form.formState.errors.l2ChainConfig[index]
                              ?.privateKey?.message
                          }
                        </p>
                      )}
                      {l2BalanceErrors[index] && (
                        <p className="text-sm text-destructive">
                          {l2BalanceErrors[index]}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`l2IsDeployedNew-${index}`}
                        checked={form.watch(
                          `l2ChainConfig.${index}.isDeployedNew`
                        )}
                        onCheckedChange={(checked) =>
                          form.setValue(
                            `l2ChainConfig.${index}.isDeployedNew`,
                            checked
                          )
                        }
                        disabled={isPending}
                      />
                      <Label htmlFor={`l2IsDeployedNew-${index}`}>
                        Deploy New Contract
                      </Label>
                    </div>

                    {!form.watch(`l2ChainConfig.${index}.isDeployedNew`) && (
                      <>
                        <div className="space-y-2">
                          <Label
                            htmlFor={`l2CrossTradeProxyAddress-${index}`}
                          >
                            L1 Cross Trade Proxy Address
                          </Label>
                          <Input
                            id={`l2CrossTradeProxyAddress-${index}`}
                            placeholder="0x..."
                            disabled={isPending}
                            {...form.register(
                              `l2ChainConfig.${index}.crossTradeProxyAddress`
                            )}
                            className={
                              form.formState.errors.l2ChainConfig?.[index]
                                ?.crossTradeProxyAddress
                                ? "border-destructive"
                                : ""
                            }
                          />
                          {form.formState.errors.l2ChainConfig?.[index]
                            ?.crossTradeProxyAddress && (
                            <p className="text-sm text-destructive">
                              {
                                form.formState.errors.l2ChainConfig[index]
                                  ?.crossTradeProxyAddress?.message
                              }
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`l2CrossTradeAddress-${index}`}>
                            L1 Cross Trade Address
                          </Label>
                          <Input
                            id={`l2CrossTradeAddress-${index}`}
                            placeholder="0x..."
                            disabled={isPending}
                            {...form.register(
                              `l2ChainConfig.${index}.crossTradeAddress`
                            )}
                            className={
                              form.formState.errors.l2ChainConfig?.[index]
                                ?.crossTradeAddress
                                ? "border-destructive"
                                : ""
                            }
                          />
                          {form.formState.errors.l2ChainConfig?.[index]
                            ?.crossTradeAddress && (
                            <p className="text-sm text-destructive">
                              {
                                form.formState.errors.l2ChainConfig[index]
                                  ?.crossTradeAddress?.message
                              }
                            </p>
                          )}
                        </div>
                      </>
                    )}

                    {/* Required L2 fields */}
                    <div className="space-y-2">
                      <Label htmlFor={`l2CrossDomainMessenger-${index}`}>
                        Cross Domain Messenger <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`l2CrossDomainMessenger-${index}`}
                        placeholder="0x..."
                        disabled={isPending}
                        {...form.register(`l2ChainConfig.${index}.crossDomainMessenger`)}
                        className={
                          form.formState.errors.l2ChainConfig?.[index]
                            ?.crossDomainMessenger
                            ? "border-destructive"
                            : ""
                        }
                      />
                      {form.formState.errors.l2ChainConfig?.[index]
                        ?.crossDomainMessenger && (
                        <p className="text-sm text-destructive">
                          {
                            form.formState.errors.l2ChainConfig[index]
                              ?.crossDomainMessenger?.message
                          }
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`l2NativeTokenAddress-${index}`}>
                        Native Token Address <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`l2NativeTokenAddress-${index}`}
                        placeholder="0x..."
                        disabled={isPending}
                        {...form.register(`l2ChainConfig.${index}.nativeTokenAddress`)}
                        className={
                          form.formState.errors.l2ChainConfig?.[index]
                            ?.nativeTokenAddress
                            ? "border-destructive"
                            : ""
                        }
                      />
                      {form.formState.errors.l2ChainConfig?.[index]
                        ?.nativeTokenAddress && (
                        <p className="text-sm text-destructive">
                          {
                            form.formState.errors.l2ChainConfig[index]
                              ?.nativeTokenAddress?.message
                          }
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`l2L1StandardBridgeAddress-${index}`}>
                        L1 Standard Bridge Address <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`l2L1StandardBridgeAddress-${index}`}
                        placeholder="0x..."
                        disabled={isPending}
                        {...form.register(`l2ChainConfig.${index}.l1StandardBridgeAddress`)}
                        className={
                          form.formState.errors.l2ChainConfig?.[index]
                            ?.l1StandardBridgeAddress
                            ? "border-destructive"
                            : ""
                        }
                      />
                      {form.formState.errors.l2ChainConfig?.[index]
                        ?.l1StandardBridgeAddress && (
                        <p className="text-sm text-destructive">
                          {
                            form.formState.errors.l2ChainConfig[index]
                              ?.l1StandardBridgeAddress?.message
                          }
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`l2L1UsdcBridgeAddress-${index}`}>
                        L1 USDC Bridge Address <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`l2L1UsdcBridgeAddress-${index}`}
                        placeholder="0x..."
                        disabled={isPending}
                        {...form.register(`l2ChainConfig.${index}.l1UsdcBridgeAddress`)}
                        className={
                          form.formState.errors.l2ChainConfig?.[index]
                            ?.l1UsdcBridgeAddress
                            ? "border-destructive"
                            : ""
                        }
                      />
                      {form.formState.errors.l2ChainConfig?.[index]
                        ?.l1UsdcBridgeAddress && (
                        <p className="text-sm text-destructive">
                          {
                            form.formState.errors.l2ChainConfig[index]
                              ?.l1UsdcBridgeAddress?.message
                          }
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`l2L1CrossDomainMessenger-${index}`}>
                        L1 Cross Domain Messenger <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`l2L1CrossDomainMessenger-${index}`}
                        placeholder="0x..."
                        disabled={isPending}
                        {...form.register(`l2ChainConfig.${index}.l1CrossDomainMessenger`)}
                        className={
                          form.formState.errors.l2ChainConfig?.[index]
                            ?.l1CrossDomainMessenger
                            ? "border-destructive"
                            : ""
                        }
                      />
                      {form.formState.errors.l2ChainConfig?.[index]
                        ?.l1CrossDomainMessenger && (
                        <p className="text-sm text-destructive">
                          {
                            form.formState.errors.l2ChainConfig[index]
                              ?.l1CrossDomainMessenger?.message
                          }
                        </p>
                      )}
                    </div>

                    

                    {/* Block Explorer Config for L2 */}
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`l2ExplorerEnabled-${index}`}
                        checked={l2ExplorerEnabled[index] || false}
                        onCheckedChange={(checked) =>
                          toggleL2Explorer(index, checked)
                        }
                        disabled={isPending}
                      />
                      <Label htmlFor={`l2ExplorerEnabled-${index}`}>
                        Verify Contracts on Block Explorer (Optional)
                      </Label>
                    </div>

                    {l2ExplorerEnabled[index] && (
                      <div className="ml-6 space-y-4 rounded-md border p-4">
                        <div className="space-y-2">
                          <Label htmlFor={`l2ExplorerType-${index}`}>
                            Explorer Type
                          </Label>
                          <Select
                            value={
                              form.watch(
                                `l2ChainConfig.${index}.blockExplorerConfig.type`
                              ) || "etherscan"
                            }
                            onValueChange={(value: BlockExplorerType) => {
                              form.setValue(
                                `l2ChainConfig.${index}.blockExplorerConfig.type`,
                                value
                              );
                              // Clear API key when switching to Blockscout
                              if (value === "blockscout") {
                                form.setValue(
                                  `l2ChainConfig.${index}.blockExplorerConfig.apiKey`,
                                  ""
                                );
                              }
                            }}
                            disabled={isPending}
                          >
                            <SelectTrigger id={`l2ExplorerType-${index}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="etherscan">Etherscan</SelectItem>
                              <SelectItem value="blockscout">Blockscout</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {form.watch(
                          `l2ChainConfig.${index}.blockExplorerConfig.type`
                        ) === "etherscan" && (
                          <div className="space-y-2">
                            <Label htmlFor={`l2ExplorerApiKey-${index}`}>
                              API Key *
                            </Label>
                            <Input
                              id={`l2ExplorerApiKey-${index}`}
                              placeholder="API key"
                              disabled={isPending}
                              {...form.register(
                                `l2ChainConfig.${index}.blockExplorerConfig.apiKey`
                              )}
                            />
                            {form.formState.errors.l2ChainConfig?.[index]
                              ?.blockExplorerConfig?.apiKey && (
                              <p className="text-sm text-destructive">
                                {
                                  form.formState.errors.l2ChainConfig[index]
                                    ?.blockExplorerConfig?.apiKey?.message
                                }
                              </p>
                            )}
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label htmlFor={`l2ExplorerUrl-${index}`}>URL</Label>
                          <Input
                            id={`l2ExplorerUrl-${index}`}
                            placeholder="https://..."
                            disabled={isPending}
                            {...form.register(
                              `l2ChainConfig.${index}.blockExplorerConfig.url`
                            )}
                          />
                          {form.formState.errors.l2ChainConfig?.[index]
                            ?.blockExplorerConfig?.url && (
                            <p className="text-sm text-destructive">
                              {
                                form.formState.errors.l2ChainConfig[index]
                                  ?.blockExplorerConfig?.url?.message
                              }
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
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
              <Button
                type="submit"
                disabled={shouldDisableSubmit}
              >
                Continue
              </Button>
              {hasBalanceErrors && (
                <p className="text-sm text-destructive mt-2">
                  Cannot submit: One or more accounts have zero balance. Please
                  fund the accounts before proceeding.
                </p>
              )}
              {!hasBalanceErrors && hasChainIdErrors && (
                <p className="text-sm text-destructive mt-2">
                  Cannot submit: One or more RPC endpoints are not working or ChainID could not be fetched. Please check your RPC URLs.
                </p>
              )}
              {!hasBalanceErrors && !hasChainIdErrors && isFetchingChainIds && (
                <p className="text-sm text-muted-foreground mt-2">
                  Fetching Chain IDs from RPC endpoints...
                </p>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Installation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to install the cross-chain bridge with the
              provided configuration? This action cannot be undone.
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
