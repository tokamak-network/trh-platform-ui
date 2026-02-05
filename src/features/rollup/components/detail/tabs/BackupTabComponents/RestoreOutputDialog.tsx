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
import { Copy } from "lucide-react";

interface RestoreOutputDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestedEfs: string;
  suggestedPvcs: string;
  suggestedStss: string;
  onCopy: (label: string, value: string) => void;
  onOpenAttachForm: () => void;
}

export function RestoreOutputDialog({
  open,
  onOpenChange,
  suggestedEfs,
  suggestedPvcs,
  suggestedStss,
  onCopy,
  onOpenAttachForm,
}: RestoreOutputDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Restore Output (Attach Later)</DialogTitle>
          <DialogDescription>
            Copy these values and keep them for attaching later.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">EFS ID:</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {suggestedEfs || "-"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCopy("EFS ID", suggestedEfs)}
                aria-label="Copy EFS ID"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">PVCs:</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {suggestedPvcs || "-"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCopy("PVCs", suggestedPvcs)}
                aria-label="Copy PVCs"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">STSs:</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {suggestedStss || "-"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCopy("STSs", suggestedStss)}
                aria-label="Copy STSs"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onOpenAttachForm}
          >
            Open Attach Form
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

