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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
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

const monitoringSchema = z.object({
  grafanaPassword: z
    .string()
    .min(8, { message: "Grafana password must be at least 8 characters" }),
  loggingEnabled: z.boolean(),
  alertManager: z.object({
    telegram: z.object({
      enabled: z.boolean(),
      apiToken: z.string().optional(),
      criticalReceiver: z.object({
        chatId: z.string().min(1, { message: "Chat ID is required" })
      }).optional()
    }),
    email: z.object({
      enabled: z.boolean(),
      smtpSmarthost: z.string().optional(),
      smtpFrom: z.string().optional(),
      smtpAuthPassword: z.string().optional(),
      alertReceivers: z.array(z.string().email({ message: "Invalid email address" })).optional()
    })
  })
}).refine((data) => {
  // If telegram is enabled, validate API token
  if (data.alertManager.telegram.enabled) {
    if (!data.alertManager.telegram.apiToken || data.alertManager.telegram.apiToken.trim() === "") {
      return false;
    }
  }
  return true;
}, {
  message: "Telegram API token is required when Telegram alerts are enabled",
  path: ["alertManager", "telegram", "apiToken"]
}).refine((data) => {
  // If email is enabled, validate SMTP server
  if (data.alertManager.email.enabled) {
    if (!data.alertManager.email.smtpSmarthost || data.alertManager.email.smtpSmarthost.trim() === "") {
      return false;
    }
  }
  return true;
}, {
  message: "SMTP server is required when Email alerts are enabled",
  path: ["alertManager", "email", "smtpSmarthost"]
}).refine((data) => {
  // If email is enabled, validate from email
  if (data.alertManager.email.enabled) {
    if (!data.alertManager.email.smtpFrom || data.alertManager.email.smtpFrom.trim() === "") {
      return false;
    }
    // Validate email format for smtpFrom
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.alertManager.email.smtpFrom)) {
      return false;
    }
  }
  return true;
}, {
  message: "Valid from email address is required when Email alerts are enabled",
  path: ["alertManager", "email", "smtpFrom"]
}).refine((data) => {
  // If email is enabled, validate SMTP password
  if (data.alertManager.email.enabled) {
    if (!data.alertManager.email.smtpAuthPassword || data.alertManager.email.smtpAuthPassword.trim() === "") {
      return false;
    }
  }
  return true;
}, {
  message: "SMTP password is required when Email alerts are enabled",
  path: ["alertManager", "email", "smtpAuthPassword"]
});

type InternalMonitoringFormData = z.infer<typeof monitoringSchema>;

export type MonitoringFormData = Omit<InternalMonitoringFormData, 'alertManager'> & {
  alertManager: {
    telegram: {
      enabled: boolean;
      apiToken?: string;
      criticalReceivers: Array<{ chatId: string }>;
    };
    email: {
      enabled: boolean;
      smtpSmarthost?: string;
      smtpFrom?: string;
      smtpAuthPassword?: string;
      alertReceivers?: string[];
    };
  };
};

interface InstallMonitoringDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSubmit: (data: MonitoringFormData) => void;
  readonly isPending?: boolean;
}

export default function InstallMonitoringDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending = false,
}: InstallMonitoringDialogProps) {
  const form = useForm<InternalMonitoringFormData>({
    resolver: zodResolver(monitoringSchema),
    defaultValues: {
      grafanaPassword: "",
      loggingEnabled: true,
      alertManager: {
        telegram: {
          enabled: false,
          apiToken: "",
          criticalReceiver: { chatId: "" }
        },
        email: {
          enabled: false,
          smtpSmarthost: "smtp.gmail.com:587",
          smtpFrom: "",
          smtpAuthPassword: "",
          alertReceivers: []
        }
      }
    },
  });

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pendingData, setPendingData] =
    React.useState<MonitoringFormData | null>(null);

  const handleSubmit = form.handleSubmit((data) => {
    // Check for custom validation errors before proceeding
    const emailError = getEmailReceiversError();
    
    if (emailError) {
      // Don't proceed if there are validation errors
      return;
    }
    
    // Convert single telegram receiver to array format for API compatibility
    const apiData = {
      ...data,
      alertManager: {
        ...data.alertManager,
        telegram: {
          ...data.alertManager.telegram,
          criticalReceivers: data.alertManager.telegram.criticalReceiver?.chatId 
            ? [{ chatId: data.alertManager.telegram.criticalReceiver.chatId }]
            : []
        }
      }
    };
    
    setPendingData(apiData);
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


  const addEmailReceiver = () => {
    const currentReceivers = form.getValues("alertManager.email.alertReceivers") || [];
    form.setValue("alertManager.email.alertReceivers", [...currentReceivers, ""]);
    // Clear any array-level error when adding a receiver
    form.clearErrors("alertManager.email.alertReceivers");
  };

  const removeEmailReceiver = (index: number) => {
    const currentReceivers = form.getValues("alertManager.email.alertReceivers") || [];
    form.setValue("alertManager.email.alertReceivers", 
      currentReceivers.filter((_, i) => i !== index)
    );
  };

  // Custom validation helpers

  const getEmailReceiversError = () => {
    const emailEnabled = form.watch("alertManager.email.enabled");
    const receivers = form.watch("alertManager.email.alertReceivers");
    
    if (emailEnabled && (!receivers || receivers.length === 0)) {
      return "At least one email receiver is required when Email alerts are enabled";
    }
    return null;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Install Monitoring</DialogTitle>
            <DialogDescription>
              Configure monitoring settings including Grafana password, logging, and alert manager.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto flex-1">
            {/* Grafana Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Grafana Configuration</h3>
              <div className="space-y-2">
                <Label htmlFor="grafanaPassword">Grafana Password</Label>
                <Input
                  id="grafanaPassword"
                  type="password"
                  placeholder="********"
                  disabled={isPending}
                  {...form.register("grafanaPassword")}
                  className={
                    form.formState.errors.grafanaPassword
                      ? "border-destructive"
                      : ""
                  }
                />
                {form.formState.errors.grafanaPassword && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.grafanaPassword.message}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Logging Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Logging Configuration</h3>
              <div className="flex items-center space-x-2">
                <Switch
                  id="loggingEnabled"
                  checked={form.watch("loggingEnabled")}
                  onCheckedChange={(checked) => form.setValue("loggingEnabled", checked)}
                  disabled={isPending}
                />
                <Label htmlFor="loggingEnabled">Enable logging</Label>
              </div>
            </div>

            <Separator />

            {/* Alert Manager Configuration */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Alert Manager Configuration</h3>
              
              {/* Telegram Configuration */}
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="telegramEnabled"
                    checked={form.watch("alertManager.telegram.enabled")}
                    onCheckedChange={(checked) => form.setValue("alertManager.telegram.enabled", checked)}
                    disabled={isPending}
                  />
                  <Label htmlFor="telegramEnabled" className="text-base font-medium">Telegram Alerts</Label>
                </div>
                
                {form.watch("alertManager.telegram.enabled") && (
                  <div className="space-y-3 ml-6">
                    <div className="space-y-2">
                      <Label htmlFor="telegramApiToken">Telegram Bot API Token</Label>
                      <Input
                        id="telegramApiToken"
                        placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                        disabled={isPending}
                        {...form.register("alertManager.telegram.apiToken")}
                        className={
                          form.formState.errors.alertManager?.telegram?.apiToken
                            ? "border-destructive"
                            : ""
                        }
                      />
                      {form.formState.errors.alertManager?.telegram?.apiToken && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.alertManager.telegram.apiToken.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Critical Receiver (Chat ID)</Label>
                      <Input
                        placeholder="123456789"
                        disabled={isPending}
                        {...form.register("alertManager.telegram.criticalReceiver.chatId")}
                        className={
                          form.formState.errors.alertManager?.telegram?.criticalReceiver?.chatId
                            ? "border-destructive"
                            : ""
                        }
                      />
                      {form.formState.errors.alertManager?.telegram?.criticalReceiver?.chatId && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.alertManager.telegram.criticalReceiver.chatId.message}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Email Configuration */}
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="emailEnabled"
                    checked={form.watch("alertManager.email.enabled")}
                    onCheckedChange={(checked) => form.setValue("alertManager.email.enabled", checked)}
                    disabled={isPending}
                  />
                  <Label htmlFor="emailEnabled" className="text-base font-medium">Email Alerts</Label>
                </div>
                
                {form.watch("alertManager.email.enabled") && (
                  <div className="space-y-3 ml-6">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="smtpServer">SMTP Server</Label>
                        <Input
                          id="smtpServer"
                          placeholder="smtp.gmail.com:587"
                          disabled={isPending}
                          {...form.register("alertManager.email.smtpSmarthost")}
                          className={
                            form.formState.errors.alertManager?.email?.smtpSmarthost
                              ? "border-destructive"
                              : ""
                          }
                        />
                        {form.formState.errors.alertManager?.email?.smtpSmarthost && (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.alertManager.email.smtpSmarthost.message}
                          </p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="smtpFrom">From Email</Label>
                        <Input
                          id="smtpFrom"
                          type="email"
                          placeholder="alerts@company.com"
                          disabled={isPending}
                          {...form.register("alertManager.email.smtpFrom")}
                          className={
                            form.formState.errors.alertManager?.email?.smtpFrom
                              ? "border-destructive"
                              : ""
                          }
                        />
                        {form.formState.errors.alertManager?.email?.smtpFrom && (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.alertManager.email.smtpFrom.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="smtpPassword">SMTP Password</Label>
                      <Input
                        id="smtpPassword"
                        type="password"
                        placeholder="********"
                        disabled={isPending}
                        {...form.register("alertManager.email.smtpAuthPassword")}
                        className={
                          form.formState.errors.alertManager?.email?.smtpAuthPassword
                            ? "border-destructive"
                            : ""
                        }
                      />
                      {form.formState.errors.alertManager?.email?.smtpAuthPassword && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.alertManager.email.smtpAuthPassword.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Alert Receivers</Label>
                      {(form.watch("alertManager.email.alertReceivers") || []).map((email, index) => (
                        <div key={`email-${index}`} className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Input
                              type="email"
                              placeholder="user@company.com"
                              disabled={isPending}
                              {...form.register(`alertManager.email.alertReceivers.${index}`)}
                              className={
                                form.formState.errors.alertManager?.email?.alertReceivers?.[index]
                                  ? "border-destructive"
                                  : ""
                              }
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeEmailReceiver(index)}
                              disabled={isPending}
                            >
                              Remove
                            </Button>
                          </div>
                          {form.formState.errors.alertManager?.email?.alertReceivers?.[index] && (
                            <p className="text-sm text-destructive">
                              {form.formState.errors.alertManager.email.alertReceivers[index]?.message}
                            </p>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addEmailReceiver}
                        disabled={isPending}
                      >
                        Add Receiver
                      </Button>
                      {getEmailReceiversError() && (
                        <p className="text-sm text-destructive">
                          {getEmailReceiversError()}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </form>
          
          <DialogFooter className="flex-shrink-0">
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
              onClick={handleSubmit}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Installation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to install Monitoring with the provided
              configuration?
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
