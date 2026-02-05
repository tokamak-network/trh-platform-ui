"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Info } from "lucide-react";
import { RecoveryPoint } from "../../../../schemas/backup";

interface RestoreBackupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checkpoints: RecoveryPoint[] | undefined;
  selectedRecoveryPoint: string;
  onRecoveryPointChange: (point: string) => void;
  attachWorkloads: boolean;
  onAttachWorkloadsChange: (attach: boolean) => void;
  onRestore: () => void;
  isPending: boolean;
}

export function RestoreBackupDialog({
  open,
  onOpenChange,
  checkpoints,
  selectedRecoveryPoint,
  onRecoveryPointChange,
  attachWorkloads,
  onAttachWorkloadsChange,
  onRestore,
  isPending,
}: RestoreBackupDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Restore from Backup</DialogTitle>
          <DialogDescription>
            Select a recovery point to restore your rollup data
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="recoveryPoint">Recovery Point</Label>
            <Select
              value={selectedRecoveryPoint}
              onValueChange={onRecoveryPointChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a recovery point" />
              </SelectTrigger>
              <SelectContent>
                {checkpoints?.map((checkpoint) => (
                  <SelectItem
                    key={checkpoint.RecoveryPointARN}
                    value={checkpoint.RecoveryPointARN}
                  >
                    {checkpoint.Vault} - {checkpoint.Created}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="attachWorkloads"
              checked={attachWorkloads}
              onCheckedChange={(checked) => onAttachWorkloadsChange(!!checked)}
            />
            <Label htmlFor="attachWorkloads" className="text-sm font-normal cursor-pointer">
              Automatically attach workloads to restored EFS
            </Label>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            If enabled, the restored EFS will be automatically attached to your workloads (op-geth, op-node) after restoration completes.
          </p>
          {attachWorkloads && (
            <Alert className="mt-3 border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-xs text-blue-800">
                <strong>Note:</strong> When auto-attach is enabled, your current PV/PVC configurations will be automatically backed up before switching to the restored EFS. This ensures you can recover your previous storage configuration if needed.
              </AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={onRestore}
            disabled={!selectedRecoveryPoint || isPending}
          >
            {isPending ? "Restoring..." : "Restore"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

