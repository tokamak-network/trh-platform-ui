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

const blockExplorerSchema = z.object({
  databaseUsername: z
    .string()
    .min(1, { message: "Database username is required" }),
  databasePassword: z
    .string()
    .min(9, { message: "Database password must be greater than 8 characters" }),
  coinmarketcapKey: z
    .string()
    .min(1, { message: "CoinMarketCap API key is required" }),
  walletConnectId: z
    .string()
    .min(1, { message: "WalletConnect project ID is required" }),
});

export type BlockExplorerFormData = z.infer<typeof blockExplorerSchema>;

interface InstallBlockExplorerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: BlockExplorerFormData) => void;
  isPending?: boolean;
}

export default function InstallBlockExplorerDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending = false,
}: InstallBlockExplorerDialogProps) {
  const form = useForm<BlockExplorerFormData>({
    resolver: zodResolver(blockExplorerSchema),
    defaultValues: {
      databaseUsername: "",
      databasePassword: "",
      coinmarketcapKey: "",
      walletConnectId: "",
    },
  });

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pendingData, setPendingData] =
    React.useState<BlockExplorerFormData | null>(null);

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

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Install Block Explorer</DialogTitle>
            <DialogDescription>
              Provide configuration to install the Block Explorer integration.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="databaseUsername">Database Username</Label>
              <Input
                id="databaseUsername"
                placeholder="explorer_db"
                disabled={isPending}
                {...form.register("databaseUsername")}
                className={
                  form.formState.errors.databaseUsername
                    ? "border-destructive"
                    : ""
                }
              />
              {form.formState.errors.databaseUsername && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.databaseUsername.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="databasePassword">Database Password</Label>
              <Input
                id="databasePassword"
                type="password"
                placeholder="********"
                disabled={isPending}
                {...form.register("databasePassword")}
                className={
                  form.formState.errors.databasePassword
                    ? "border-destructive"
                    : ""
                }
              />
              {form.formState.errors.databasePassword && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.databasePassword.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="coinmarketcapKey">CoinMarketCap API Key</Label>
              <Input
                id="coinmarketcapKey"
                placeholder="c291ce7b-..."
                disabled={isPending}
                {...form.register("coinmarketcapKey")}
                className={
                  form.formState.errors.coinmarketcapKey
                    ? "border-destructive"
                    : ""
                }
              />
              {form.formState.errors.coinmarketcapKey && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.coinmarketcapKey.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="walletConnectId">WalletConnect Project ID</Label>
              <Input
                id="walletConnectId"
                placeholder="881053b0dbae8bdf9ba4b67cf6ef9e70"
                disabled={isPending}
                {...form.register("walletConnectId")}
                className={
                  form.formState.errors.walletConnectId
                    ? "border-destructive"
                    : ""
                }
              />
              {form.formState.errors.walletConnectId && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.walletConnectId.message}
                </p>
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
              <Button
                type="submit"
                disabled={isPending || form.formState.isSubmitting}
              >
                Continue
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Installation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to install the Block Explorer with the
              provided configuration?
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
