"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { L2ChainConfig, RegisterTokensAPIRequest } from "../services/integrationService";
import { Integration } from "../schemas/integration";

// Helper to validate Ethereum address
const ethAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, {
  message: "Invalid Ethereum address format",
});

// Chain selection schema: { chainId, tokenAddress }
const chainSelectionSchema = z.object({
  chainId: z.number().min(1, "Please select a chain"),
  tokenAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, {
    message: "Invalid L2 token address format",
  }),
});

// Token schema: { tokenName, l1TokenAddress, chainSelections }
const tokenSchema = z.object({
  tokenName: z.string().min(1, "Token name is required"),
  l1TokenAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, {
    message: "Invalid L1 token address format",
  }),
  chainSelections: z.array(chainSelectionSchema).min(2, "At least 2 chains must be registered"),
});

const registerTokensSchema = z.object({
  tokens: z.array(tokenSchema).min(1, "At least one token is required"),
});

export type RegisterTokensFormData = z.infer<typeof registerTokensSchema>;

interface RegisterTokensDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: RegisterTokensAPIRequest) => void;
  isPending?: boolean;
  mode: "l2_to_l1" | "l2_to_l2";
  integration: Integration;
}

export default function RegisterTokensDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending = false,
  mode,
  integration,
}: RegisterTokensDialogProps) {
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pendingData, setPendingData] = React.useState<RegisterTokensAPIRequest | null>(null);

  const form = useForm<RegisterTokensFormData>({
    resolver: zodResolver(registerTokensSchema),
    defaultValues: {
      tokens: [],
    },
  });

  // Transform integration.config.l2ChainConfig to L2ChainConfig format
  const l2ChainConfigs = React.useMemo(() => {
    const l2ChainConfig = integration.config?.l2ChainConfig;
    if (!Array.isArray(l2ChainConfig)) {
      return [];
    }
    
    // Transform from camelCase (chainId, chainName) to snake_case (chain_id, chain_name)
    return l2ChainConfig
      .filter((config: any) => config.chainId && config.chainName)
      .map((config: any): L2ChainConfig => ({
        chain_id: config.chainId,
        chain_name: config.chainName,
        rpc: config.rpc || "",
        private_key: config.privateKey || "",
        is_deployed_new: config.isDeployedNew ?? false,
        block_explorer_config: config.blockExplorerConfig || undefined,
        cross_domain_messenger: config.crossDomainMessenger || "",
        deployment_script_path: config.deploymentScriptPath,
        contract_name: config.contractName,
        native_token_address: config.nativeTokenAddress || "",
        l1_standard_bridge_address: config.l1StandardBridgeAddress || "",
        l1_usdc_bridge_address: config.l1USDCBridgeAddress || "",
        l1_cross_domain_messenger: config.l1CrossDomainMessenger || "",
        cross_trade_proxy_address: config.crossTradeProxyAddress,
        cross_trade_address: config.crossTradeAddress,
      }));
  }, [integration.config?.l2ChainConfig]);

  // Initialize form when dialog opens and chain configs are available
  React.useEffect(() => {
    if (open && l2ChainConfigs.length > 0) {
      form.reset({
        tokens: [
          {
            tokenName: "",
            l1TokenAddress: "",
            chainSelections: [
              { chainId: 0, tokenAddress: "" },
              { chainId: 0, tokenAddress: "" },
            ],
          },
        ],
      });
    } else if (!open) {
      // Reset when dialog closes
      form.reset({
        tokens: [],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, l2ChainConfigs.length]);

  const handleSubmit = form.handleSubmit((data) => {
    // Transform form data to API format
    const tokens = data.tokens.map((token) => ({
      tokenName: token.tokenName,
      l1TokenAddress: token.l1TokenAddress,
      l2TokenInputs: token.chainSelections.map((selection) => ({
        chainId: selection.chainId,
        tokenAddress: selection.tokenAddress,
      })),
    }));
    
    const transformedData: RegisterTokensAPIRequest = {
      mode,
      tokens,
    };
    
    setPendingData(transformedData);
    setConfirmOpen(true);
  });

  const handleConfirm = () => {
    if (!pendingData) return;
    onSubmit(pendingData);
  };

  const handleDialogChange = (next: boolean) => {
    if (!next) {
      form.reset({
        tokens: [],
      });
    }
    onOpenChange(next);
  };

  const formTokens = form.watch("tokens") || [];

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Register Tokens</DialogTitle>
            <DialogDescription>
              Register tokens for the cross-chain bridge. {mode === "l2_to_l2" && "All tokens must be registered across all L2 chains."}
            </DialogDescription>
          </DialogHeader>

          {l2ChainConfigs.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">No chain configurations found.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center justify-between">
                <Label>Tokens</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const currentTokens = form.getValues("tokens") || [];
                    form.setValue("tokens", [
                      ...currentTokens,
                      {
                        tokenName: "",
                        l1TokenAddress: "",
                        chainSelections: [
                          { chainId: 0, tokenAddress: "" },
                          { chainId: 0, tokenAddress: "" },
                        ],
                      },
                    ], { shouldValidate: false, shouldDirty: true });
                  }}
                  disabled={isPending}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Token
                </Button>
              </div>

              {formTokens.map((token, tokenIndex) => {
                const tokenKey = `token-${tokenIndex}`;
                const chainSelections = token.chainSelections || [];
                // For "Add Chain" button, check if there are chains available beyond the first two
                const firstChainId = chainSelections[0]?.chainId || 0;
                const secondChainId = chainSelections[1]?.chainId || 0;
                const availableChains = l2ChainConfigs.filter(
                  (chain) =>
                    chain.chain_id !== firstChainId && chain.chain_id !== secondChainId
                );

                return (
                  <div key={tokenKey} className="space-y-4 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Token {tokenIndex + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const currentTokens = form.getValues("tokens") || [];
                          form.setValue(
                            "tokens",
                            currentTokens.filter((_, idx) => idx !== tokenIndex)
                          );
                          form.trigger("tokens");
                        }}
                        disabled={isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor={`tokenName-${tokenKey}`}>Token Name</Label>
                        <Input
                          id={`tokenName-${tokenKey}`}
                          placeholder="e.g., USDC, USDT"
                          disabled={isPending}
                          value={token.tokenName || ""}
                          onChange={(e) => {
                            const currentTokens = form.getValues("tokens") || [];
                            const upperValue = e.target.value.toUpperCase();
                            form.setValue(`tokens.${tokenIndex}.tokenName`, upperValue, {
                              shouldValidate: true,
                              shouldDirty: true,
                            });
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.currentTarget.blur();
                            }
                          }}
                        />
                        {form.formState.errors.tokens?.[tokenIndex]?.tokenName && (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.tokens[tokenIndex]?.tokenName?.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`l1TokenAddress-${tokenKey}`}>L1 Token Address</Label>
                        <Input
                          id={`l1TokenAddress-${tokenKey}`}
                          placeholder="0x..."
                          disabled={isPending}
                          value={token.l1TokenAddress || ""}
                          onChange={(e) => {
                            form.setValue(`tokens.${tokenIndex}.l1TokenAddress`, e.target.value, {
                              shouldValidate: true,
                              shouldDirty: true,
                            });
                          }}
                        />
                        {form.formState.errors.tokens?.[tokenIndex]?.l1TokenAddress && (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.tokens[tokenIndex]?.l1TokenAddress?.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label>Chain Selections (At least 2 required)</Label>
                          {chainSelections.length >= 2 &&
                            chainSelections[0]?.chainId > 0 &&
                            chainSelections[1]?.chainId > 0 &&
                            availableChains.length > 0 && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const currentTokens = form.getValues("tokens") || [];
                                  const currentSelections = currentTokens[tokenIndex]?.chainSelections || [];
                                  form.setValue(
                                    `tokens.${tokenIndex}.chainSelections`,
                                    [
                                      ...currentSelections,
                                      { chainId: 0, tokenAddress: "" },
                                    ],
                                    { shouldValidate: false, shouldDirty: true }
                                  );
                                }}
                                disabled={isPending}
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Chain
                              </Button>
                            )}
                        </div>

                        {chainSelections.map((selection, selectionIndex) => {
                          const selectionKey = `selection-${tokenIndex}-${selectionIndex}`;
                          const isFirstOrSecond = selectionIndex < 2;
                          const canRemove = chainSelections.length > 2;

                          return (
                            <div key={selectionKey} className="space-y-3 rounded-md border p-3">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex-1 space-y-2">
                                  <Label htmlFor={`chainSelect-${selectionKey}`}>
                                    {selectionIndex === 0
                                      ? "First Chain"
                                      : selectionIndex === 1
                                      ? "Second Chain"
                                      : `Chain ${selectionIndex + 1}`}
                                  </Label>
                                  <Select
                                    value={selection.chainId > 0 ? selection.chainId.toString() : ""}
                                    onValueChange={(value) => {
                                      const currentTokens = form.getValues("tokens") || [];
                                      const currentSelections = currentTokens[tokenIndex]?.chainSelections || [];
                                      const updatedSelections = [...currentSelections];
                                      updatedSelections[selectionIndex] = {
                                        ...updatedSelections[selectionIndex],
                                        chainId: parseInt(value, 10),
                                      };
                                      form.setValue(
                                        `tokens.${tokenIndex}.chainSelections`,
                                        updatedSelections,
                                        { shouldValidate: true, shouldDirty: true }
                                      );
                                    }}
                                    disabled={isPending}
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Select a chain" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {l2ChainConfigs
                                        .filter((chain) => {
                                          // For first and second selections, show all chains
                                          if (isFirstOrSecond) return true;
                                          // For additional selections (3rd, 4th, etc.), exclude the first two selected chains
                                          const firstChainId = chainSelections[0]?.chainId || 0;
                                          const secondChainId = chainSelections[1]?.chainId || 0;
                                          return (
                                            chain.chain_id !== firstChainId &&
                                            chain.chain_id !== secondChainId
                                          );
                                        })
                                        .map((chain) => (
                                          <SelectItem
                                            key={chain.chain_id}
                                            value={chain.chain_id.toString()}
                                          >
                                            {chain.chain_name}
                                          </SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                  {form.formState.errors.tokens?.[tokenIndex]?.chainSelections?.[selectionIndex]?.chainId && (
                                    <p className="text-sm text-destructive">
                                      {form.formState.errors.tokens[tokenIndex]?.chainSelections?.[selectionIndex]?.chainId?.message}
                                    </p>
                                  )}
                                </div>
                                {canRemove && !isFirstOrSecond && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="mt-6"
                                    onClick={() => {
                                      const currentTokens = form.getValues("tokens") || [];
                                      const currentSelections = currentTokens[tokenIndex]?.chainSelections || [];
                                      const updatedSelections = currentSelections.filter(
                                        (_, idx) => idx !== selectionIndex
                                      );
                                      form.setValue(
                                        `tokens.${tokenIndex}.chainSelections`,
                                        updatedSelections,
                                        { shouldValidate: true, shouldDirty: true }
                                      );
                                    }}
                                    disabled={isPending}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                )}
                              </div>

                              {selection.chainId > 0 && (
                                <div className="space-y-2">
                                  <Label htmlFor={`l2TokenAddress-${selectionKey}`}>
                                    L2 Token Address
                                  </Label>
                                  <Input
                                    id={`l2TokenAddress-${selectionKey}`}
                                    placeholder="0x..."
                                    disabled={isPending}
                                    value={selection.tokenAddress || ""}
                                    onChange={(e) => {
                                      const currentTokens = form.getValues("tokens") || [];
                                      const currentSelections = currentTokens[tokenIndex]?.chainSelections || [];
                                      const updatedSelections = [...currentSelections];
                                      updatedSelections[selectionIndex] = {
                                        ...updatedSelections[selectionIndex],
                                        tokenAddress: e.target.value,
                                      };
                                      form.setValue(
                                        `tokens.${tokenIndex}.chainSelections`,
                                        updatedSelections,
                                        { shouldValidate: true, shouldDirty: true }
                                      );
                                    }}
                                  />
                                  {form.formState.errors.tokens?.[tokenIndex]?.chainSelections?.[selectionIndex]?.tokenAddress && (
                                    <p className="text-sm text-destructive">
                                      {form.formState.errors.tokens[tokenIndex]?.chainSelections?.[selectionIndex]?.tokenAddress?.message}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {form.formState.errors.tokens?.[tokenIndex]?.chainSelections && (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.tokens[tokenIndex]?.chainSelections?.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

            {form.formState.errors.root && (
              <p className="text-sm text-destructive">
                {form.formState.errors.root.message}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || form.formState.isSubmitting}>
                Continue
              </Button>
            </DialogFooter>
          </form>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Token Registration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to register these tokens for the cross-chain
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

