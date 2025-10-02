"use client";

import React from "react";
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
import { Camera, AlertTriangle } from "lucide-react";

interface CreateSnapshotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function CreateSnapshotDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: CreateSnapshotDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-400">
              <Camera className="h-5 w-5 text-white" />
            </div>
            <AlertDialogTitle className="text-lg font-semibold">
              Create Backup Snapshot
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left space-y-3">
            <div>
              This will create a manual backup snapshot of your current rollup state.
            </div>
            
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <div className="font-medium mb-1">Please note:</div>
                <ul className="space-y-1 text-xs">
                  <li>• The snapshot process may take several minutes</li>
                  <li>• This will create a new recovery point</li>
                  <li>• The snapshot will be stored in your backup vault</li>
                </ul>
              </div>
            </div>
            
            <div className="text-sm text-slate-600">
              Are you sure you want to proceed with creating a backup snapshot?
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500"
          >
            {isLoading ? "Creating..." : "Create Snapshot"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
