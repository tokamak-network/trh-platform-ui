"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HardDrive, RefreshCw, Shield, Upload } from "lucide-react";
import { BackupStatus } from "../../../../schemas/backup";
import { RecoveryPoint } from "../../../../schemas/backup";

interface BackupActionsCardProps {
  backupStatus: BackupStatus | undefined;
  checkpoints: RecoveryPoint[] | undefined;
  onCreateSnapshot: () => void;
  onRestore: () => void;
  onAttach: () => void;
  isCreatingSnapshot: boolean;
}

export function BackupActionsCard({
  backupStatus,
  checkpoints,
  onCreateSnapshot,
  onRestore,
  onAttach,
  isCreatingSnapshot,
}: BackupActionsCardProps) {
  return (
    <Card className="border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Backup Actions
        </CardTitle>
        <CardDescription>Manage your rollup backups</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          onClick={onCreateSnapshot}
          disabled={isCreatingSnapshot}
          className="w-full"
          variant="outline"
        >
          <Upload className="w-4 h-4 mr-2" />
          {isCreatingSnapshot ? "Creating..." : "Create Snapshots"}
        </Button>
        <Button
          onClick={onRestore}
          disabled={!checkpoints || checkpoints.length === 0}
          className="w-full"
          variant="outline"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Restore from Backup
        </Button>
        <Button
          onClick={onAttach}
          disabled={!backupStatus?.IsProtected}
          className="w-full"
          variant="outline"
        >
          <HardDrive className="w-4 h-4 mr-2" />
          Attach to New Storage
        </Button>
      </CardContent>
    </Card>
  );
}

