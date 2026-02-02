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

interface AttachBackupReminderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload: () => void;
  onContinue: () => void;
  isDownloadPending: boolean;
}

export function AttachBackupReminderDialog({
  open,
  onOpenChange,
  onDownload,
  onContinue,
  isDownloadPending,
}: AttachBackupReminderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>PV/PVC Backup Recommended</DialogTitle>
          <DialogDescription>
            You enabled PV/PVC backup but have not downloaded it. You can download now or continue without downloading.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={onDownload}
            disabled={isDownloadPending}
          >
            {isDownloadPending ? "Generating..." : "Download Backup"}
          </Button>
          <Button onClick={onContinue}>
            Continue Without Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

