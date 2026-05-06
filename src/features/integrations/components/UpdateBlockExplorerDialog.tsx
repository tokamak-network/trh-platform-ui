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
import { ApiKeySelector } from "@/components/molecules";
import {
  useApiKeys,
  useCreateApiKey,
} from "@/features/configuration/api-keys/hooks/useApiKeys";
import { useBlockExplorerConfigQuery } from "../api/queries";

// All fields are optional. Behavior on empty:
//   - CMC API key OR Token ID empty: generate-blockscout.sh sets
//     EXCHANGE_RATES_ENABLED=false (exchange rates disabled).
//   - WalletConnect ID empty: passes through as an empty env var; the Blockscout
//     frontend simply runs without a configured WC project (no error).
// DB credentials are intentionally absent: they remain whatever was set at install.
const updateBlockExplorerSchema = z.object({
  coinmarketcapKey: z.string(),
  coinmarketcapTokenId: z.string(),
  walletConnectId: z.string(),
});

export type UpdateBlockExplorerFormData = z.infer<
  typeof updateBlockExplorerSchema
>;

interface UpdateBlockExplorerDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSubmit: (data: UpdateBlockExplorerFormData) => void;
  readonly stackId: string;
  readonly isPending?: boolean;
}

export default function UpdateBlockExplorerDialog({
  open,
  onOpenChange,
  onSubmit,
  stackId,
  isPending = false,
}: UpdateBlockExplorerDialogProps) {
  const { data: currentConfig, isLoading: isLoadingConfig } =
    useBlockExplorerConfigQuery(stackId, open);

  const form = useForm<UpdateBlockExplorerFormData>({
    resolver: zodResolver(updateBlockExplorerSchema),
    defaultValues: {
      coinmarketcapKey: "",
      coinmarketcapTokenId: "",
      walletConnectId: "",
    },
  });

  // Prefill form once config loads.
  React.useEffect(() => {
    if (open && currentConfig) {
      form.reset({
        coinmarketcapKey: currentConfig.coinmarketcapKey ?? "",
        coinmarketcapTokenId: currentConfig.coinmarketcapTokenId ?? "",
        walletConnectId: currentConfig.walletConnectId ?? "",
      });
    }
  }, [open, currentConfig, form]);

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pendingData, setPendingData] =
    React.useState<UpdateBlockExplorerFormData | null>(null);

  const { apiKeys } = useApiKeys();
  const createApiKeyMutation = useCreateApiKey();

  const handleSubmit = form.handleSubmit((data) => {
    setPendingData(data);
    setConfirmOpen(true);
  });

  const handleConfirm = () => {
    if (!pendingData) return;
    onSubmit(pendingData);
  };

  const handleDialogChange = (next: boolean) => {
    if (!next) {
      form.reset();
    }
    onOpenChange(next);
  };

  const handleSaveApiKey = async (data: { apiKey: string; type: string }) => {
    await createApiKeyMutation.mutateAsync(data);
  };

  const handleCoinMarketCapKeyChange = (value: string) => {
    form.setValue("coinmarketcapKey", value);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Update Block Explorer Settings</DialogTitle>
            <DialogDescription>
              Change CoinMarketCap or WalletConnect settings for this Block
              Explorer. Database credentials are preserved automatically.
              Empty CMC key or token ID disables exchange rates. Empty
              WalletConnect ID leaves the explorer running without WC.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <ApiKeySelector
              id="coinmarketcapKey"
              label="CoinMarketCap API Key"
              placeholder="c291ce7b-... (leave blank to disable exchange rates)"
              value={form.watch("coinmarketcapKey")}
              onChange={handleCoinMarketCapKeyChange}
              apiKeys={apiKeys}
              error={form.formState.errors.coinmarketcapKey?.message}
              tooltip="Your CoinMarketCap API key for cryptocurrency data"
              keyType="CMC"
              onSaveKey={handleSaveApiKey}
              allowSave={true}
            />

            <div className="space-y-2">
              <Label htmlFor="coinmarketcapTokenId">
                CoinMarketCap Token ID
              </Label>
              <Input
                id="coinmarketcapTokenId"
                placeholder="ton-station"
                disabled={isPending || isLoadingConfig}
                {...form.register("coinmarketcapTokenId")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="walletConnectId">WalletConnect Project ID</Label>
              <Input
                id="walletConnectId"
                placeholder="881053b0dbae8bdf9ba4b67cf6ef9e70 (optional)"
                disabled={isPending || isLoadingConfig}
                {...form.register("walletConnectId")}
              />
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
                disabled={
                  isPending || isLoadingConfig || form.formState.isSubmitting
                }
              >
                {isLoadingConfig ? "Loading..." : "Continue"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Update</AlertDialogTitle>
            <AlertDialogDescription>
              This will run `helm upgrade` on the running Block Explorer
              releases. Pods may briefly restart. Continue?
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
