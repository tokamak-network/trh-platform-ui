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
import { Plus, Trash2, Eye, EyeOff } from "lucide-react";

const emailAlertSchema = z.object({
  smtpFrom: z
    .string()
    .min(1, { message: "From email is required" })
    .email({ message: "Invalid email address" }),
  smtpAuthPassword: z
    .string()
    .min(1, { message: "SMTP password is required" }),
});

type EmailAlertFormFields = z.infer<typeof emailAlertSchema>;

export type EmailAlertFormData = EmailAlertFormFields & {
  smtpSmarthost: string;
  alertReceivers: string[];
};

interface ConfigureEmailAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: EmailAlertFormData) => void;
  isPending?: boolean;
  initialData?: {
    smtpFrom?: string;
    smtpAuthPassword?: string;
    alertReceivers?: string[];
  };
}

export default function ConfigureEmailAlertDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending = false,
  initialData,
}: ConfigureEmailAlertDialogProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingData, setPendingData] = useState<EmailAlertFormData | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<EmailAlertFormFields>({
    resolver: zodResolver(emailAlertSchema),
    defaultValues: {
      smtpFrom: initialData?.smtpFrom || "",
      smtpAuthPassword: initialData?.smtpAuthPassword || "",
    },
  });

  const [emailFields, setEmailFields] = useState<string[]>(
    initialData?.alertReceivers?.length ? initialData.alertReceivers : [""]
  );

  const handleSubmit = form.handleSubmit((data) => {
    // Validate email fields
    const validEmails = emailFields.filter(email => email.trim() !== "");
    if (validEmails.length === 0) {
      // Handle validation error
      return;
    }

    // Filter out empty email addresses
    const filteredData: EmailAlertFormData = {
      ...data,
      smtpSmarthost: "smtp.gmail.com:587",
      alertReceivers: validEmails,
    };
    setPendingData(filteredData);
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
      setShowPassword(false);
      onOpenChange(false);
    }
  };

  const addEmail = () => {
    setEmailFields([...emailFields, ""]);
  };

  const removeEmail = (index: number) => {
    if (emailFields.length > 1) {
      const newFields = emailFields.filter((_, i) => i !== index);
      setEmailFields(newFields);
    }
  };

  const updateEmail = (index: number, value: string) => {
    const newFields = [...emailFields];
    newFields[index] = value;
    setEmailFields(newFields);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Configure Email Alerts</DialogTitle>
            <DialogDescription>
              Set up email notifications for alerts from your monitoring system.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              SMTP Server: <span className="font-mono">smtp.gmail.com:587</span> (Only Gmail SMTP is supported)
            </p>

            <div className="space-y-2">
              <Label htmlFor="smtpFrom">From Email Address</Label>
              <Input
                id="smtpFrom"
                type="email"
                placeholder="alerts@yourcompany.com"
                disabled={isPending}
                {...form.register("smtpFrom")}
                className={
                  form.formState.errors.smtpFrom ? "border-destructive" : ""
                }
              />
              {form.formState.errors.smtpFrom && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.smtpFrom.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtpAuthPassword">SMTP Password</Label>
              <div className="relative">
                <Input
                  id="smtpAuthPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Your SMTP password or app password"
                  disabled={isPending}
                  {...form.register("smtpAuthPassword")}
                  className={
                    form.formState.errors.smtpAuthPassword ? "border-destructive" : ""
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isPending}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {form.formState.errors.smtpAuthPassword && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.smtpAuthPassword.message}
                </p>
              )}
              <p className="text-xs text-gray-500">
                For Gmail, use an App Password instead of your regular password
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Alert Recipients</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addEmail}
                  disabled={isPending}
                  className="h-8"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Email
                </Button>
              </div>

              <div className="space-y-2">
                {emailFields.map((email, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        type="email"
                        placeholder="recipient@example.com"
                        disabled={isPending}
                        value={email}
                        onChange={(e) => updateEmail(index, e.target.value)}
                      />
                    </div>
                    {emailFields.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeEmail(index)}
                        disabled={isPending}
                        className="h-10 w-10 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {emailFields.filter(email => email.trim() !== "").length === 0 && (
                <p className="text-sm text-destructive">
                  At least one recipient email is required
                </p>
              )}
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
            <AlertDialogTitle>Configure Email Alerts</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to configure email alerts with these settings? 
              This will update your monitoring system to send alerts to the specified email addresses.
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
