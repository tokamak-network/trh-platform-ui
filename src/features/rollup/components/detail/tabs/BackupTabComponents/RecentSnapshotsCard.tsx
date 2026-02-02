"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Info, RefreshCw } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BackupStatus } from "../../../../schemas/backup";
import { RecoveryPoint } from "../../../../schemas/backup";

interface RecentSnapshotsCardProps {
  backupStatus: BackupStatus | undefined;
  checkpoints: RecoveryPoint[] | undefined;
  isLoading: boolean;
  error: Error | null;
}

export function RecentSnapshotsCard({
  backupStatus,
  checkpoints,
  isLoading,
  error,
}: RecentSnapshotsCardProps) {
  return (
    <Card className="border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Recent Snapshots
          {!backupStatus?.IsProtected && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent side="right" align="start">
                  <p className="max-w-xs text-xs">
                    To see recent checkpoints, configure backup for this chain.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </CardTitle>
        <CardDescription>
          Recent backup checkpoints and recovery points
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : checkpoints && checkpoints.length > 0 ? (
          <div className="space-y-2">
            {checkpoints.map((checkpoint) => (
              <div
                key={checkpoint.RecoveryPointARN}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium">{checkpoint.Vault}</div>
                  <div className="text-xs text-muted-foreground">{checkpoint.RecoveryPointARN}</div>
                  <div className="text-xs text-muted-foreground">{checkpoint.Created}</div>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  {checkpoint.Status}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {error ? "Failed to load checkpoints" : "No snapshots available"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

