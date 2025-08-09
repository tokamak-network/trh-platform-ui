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

const monitoringSchema = z.object({
  grafanaPassword: z
    .string()
    .min(8, { message: "Grafana password must be at least 8 characters" }),
});

export type MonitoringFormData = z.infer<typeof monitoringSchema>;

interface InstallMonitoringDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: MonitoringFormData) => void;
  isPending?: boolean;
}

export default function InstallMonitoringDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending = false,
}: InstallMonitoringDialogProps) {
  const form = useForm<MonitoringFormData>({
    resolver: zodResolver(monitoringSchema),
    defaultValues: { grafanaPassword: "" },
  });

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pendingData, setPendingData] =
    React.useState<MonitoringFormData | null>(null);

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
            <DialogTitle>Install Monitoring</DialogTitle>
            <DialogDescription>
              Provide configuration to install the Monitoring integration.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
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
