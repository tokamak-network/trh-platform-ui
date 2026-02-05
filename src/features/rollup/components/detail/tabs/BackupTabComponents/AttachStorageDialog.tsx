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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

interface AttachStorageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  efsId: string;
  pvcs: string;
  stss: string;
  onEfsIdChange: (value: string) => void;
  onPvcsChange: (value: string) => void;
  onStssChange: (value: string) => void;
  backupPvPvc: boolean;
  onBackupPvPvcChange: (value: boolean) => void;
  backupDownloaded: boolean;
  backupDownloadPending: boolean;
  onDownloadBackup: () => void;
  onAttach: () => void;
  isPending: boolean;
}

export function AttachStorageDialog({
  open,
  onOpenChange,
  efsId,
  pvcs,
  stss,
  onEfsIdChange,
  onPvcsChange,
  onStssChange,
  backupPvPvc,
  onBackupPvPvcChange,
  backupDownloaded,
  backupDownloadPending,
  onDownloadBackup,
  onAttach,
  isPending,
}: AttachStorageDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Attach to New Storage</DialogTitle>
          <DialogDescription>
            Configure storage attachment for backup
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="efsId">EFS ID</Label>
            <Input
              id="efsId"
              placeholder="fs-xxxxxxxxxx"
              value={efsId}
              onChange={(e) => onEfsIdChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pvcs">Persistent Volume Claims (PVCs)</Label>
            <Input
              id="pvcs"
              placeholder="pvc-name-1,pvc-name-2"
              value={pvcs}
              onChange={(e) => onPvcsChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stss">StatefulSets (STSs)</Label>
            <Input
              id="stss"
              placeholder="sts-name-1,sts-name-2"
              value={stss}
              onChange={(e) => onStssChange(e.target.value)}
            />
          </div>
          <div className="flex items-start space-x-2">
            <Checkbox
              id="backupPvPvc"
              checked={backupPvPvc}
              onCheckedChange={(checked) => onBackupPvPvcChange(Boolean(checked))}
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="backupPvPvc">Back up PV/PVC definitions before attach</Label>
              <p className="text-xs text-muted-foreground">
                Runs the PV/PVC backup script before updating volume handles.
              </p>
            </div>
          </div>
          {backupPvPvc && (
            <div className="space-y-2 rounded-md border p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">PV/PVC Backup</span>
                <Badge variant={backupDownloaded ? "default" : "secondary"}>
                  {backupDownloaded ? "Downloaded" : "Recommended"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Generate the YAML backup and download it before attaching storage.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={onDownloadBackup}
                disabled={backupDownloadPending}
              >
                {backupDownloadPending
                  ? "Generating..."
                  : backupDownloaded
                    ? "Download Again"
                    : "Generate & Download Backup"}
              </Button>
              {backupDownloaded && (
                <p className="text-xs text-muted-foreground">
                  Backup downloaded. Attach will skip server-side backup.
                </p>
              )}
              {!backupDownloaded && (
                <p className="text-xs text-muted-foreground">
                  You can continue without downloading, but a backup is recommended.
                </p>
              )}
            </div>
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
            onClick={onAttach}
            disabled={isPending || backupDownloadPending}
          >
            {isPending ? "Attaching..." : "Attach"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

