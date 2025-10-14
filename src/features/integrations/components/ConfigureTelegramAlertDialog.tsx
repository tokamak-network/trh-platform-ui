"use client";

import React, { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const telegramAlertSchema = z.object({
  apiToken: z
    .string()
    .min(1, { message: "API Token is required" })
    .regex(/^\d+:[A-Za-z0-9_-]+$/, { message: "Invalid Telegram Bot API Token format" }),
});

type TelegramAlertFormFields = z.infer<typeof telegramAlertSchema>;

export type TelegramAlertFormData = TelegramAlertFormFields & {
  criticalReceivers: Array<{ ChatId: string }>;
};

interface ConfigureTelegramAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TelegramAlertFormData) => void;
  isPending?: boolean;
  initialData?: {
    apiToken?: string;
    criticalReceivers?: Array<{ ChatId: string }>;
  };
}

export default function ConfigureTelegramAlertDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending = false,
  initialData,
}: ConfigureTelegramAlertDialogProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingData, setPendingData] = useState<TelegramAlertFormData | null>(null);

  const form = useForm<TelegramAlertFormFields>({
    resolver: zodResolver(telegramAlertSchema),
    defaultValues: {
      apiToken: initialData?.apiToken || "",
    },
  });

  const [chatId, setChatId] = useState<string>(
    initialData?.criticalReceivers?.length 
      ? initialData.criticalReceivers[0].ChatId
      : ""
  );

  const handleSubmit = form.handleSubmit((data) => {
    // Validate chat ID field
    if (chatId.trim() === "") {
      // Handle validation error
      return;
    }

    const formData: TelegramAlertFormData = {
      ...data,
      criticalReceivers: [{ ChatId: chatId.trim() }],
    };
    setPendingData(formData);
    setShowConfirmDialog(true);
  });

  const handleConfirm = () => {
    if (pendingData) {
      onSubmit(pendingData);
      setShowConfirmDialog(false);
      setPendingData(null);
    }
  };

  const handleDialogChange = (newOpen: boolean) => {
    if (!newOpen && !isPending) {
      form.reset();
      onOpenChange(false);
    }
  };

  const updateChatId = (value: string) => {
    setChatId(value);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Configure Telegram Alerts</DialogTitle>
            <DialogDescription>
              Set up Telegram notifications for critical alerts from your monitoring system.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiToken">Bot API Token</Label>
              <Input
                id="apiToken"
                placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                disabled={isPending}
                {...form.register("apiToken")}
                className={
                  form.formState.errors.apiToken ? "border-destructive" : ""
                }
              />
              {form.formState.errors.apiToken && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.apiToken.message}
                </p>
              )}
              <p className="text-xs text-gray-500">
                Get your bot token from @BotFather on Telegram
              </p>
            </div>

            <div className="space-y-2">
              <Label>Critical Alert Recipient</Label>
              <Input
                placeholder="Chat ID (e.g., 123456789 or -987654321)"
                disabled={isPending}
                value={chatId}
                onChange={(e) => updateChatId(e.target.value)}
              />

              {chatId.trim() === "" && (
                <p className="text-sm text-destructive">
                  Chat ID is required
                </p>
              )}

              <p className="text-xs text-gray-500">
                Get chat ID by messaging your bot and checking the updates via Telegram Bot API
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDialogChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Configuring..." : "Configure Alerts"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Configure Telegram Alerts</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to configure Telegram alerts with these settings? 
              This will update your monitoring system to send critical alerts to the specified chat IDs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              Configure Alerts
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
