"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database } from "lucide-react";
import { BackupStatus } from "../../../../schemas/backup";

interface BackupStatusCardProps {
  backupStatus: BackupStatus | undefined;
  statusError: Error | null;
}

export function BackupStatusCard({
  backupStatus,
  statusError,
}: BackupStatusCardProps) {
  return (
    <Card className="border-0 shadow-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Backup Status
          </CardTitle>
          {backupStatus?.IsProtected ? (
            <Badge className="bg-green-100 text-green-800">Protected</Badge>
          ) : (
            <Badge className="bg-red-100 text-red-800">Not Protected</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {backupStatus ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Region:</span>
              <span className="text-sm font-medium">{backupStatus.Region}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Namespace:</span>
              <span className="text-sm font-medium">{backupStatus.Namespace}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Account ID:</span>
              <span className="text-sm font-medium">{backupStatus.AccountID}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">EFS ARN:</span>
              <span className="text-sm font-medium truncate ml-2">{backupStatus.ARN}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Protected:</span>
              <span className="text-sm font-medium">{backupStatus.IsProtected ? "Yes" : "No"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Latest Recovery Point:</span>
              <span className="text-sm font-medium">{backupStatus.LatestRecoveryPoint}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Next Backup:</span>
              <span className="text-sm font-medium">{backupStatus.NextBackupTime}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Schedule:</span>
              <span className="text-sm font-medium">{backupStatus.BackupSchedule}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Vaults:</span>
              <span className="text-sm font-medium truncate ml-2">
                {backupStatus.BackupVaults?.join(", ")}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Expiry:</span>
              <span className="text-sm font-medium">{backupStatus.ExpectedExpiryDate}</span>
            </div>
          </>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            {statusError ? "Failed to load backup status" : "No backup configured"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

