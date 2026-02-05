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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Info, Server } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BackupStatus } from "../../../../schemas/backup";

interface BackupConfigurationCardProps {
  backupStatus: BackupStatus | undefined;
  backupTime: string;
  retentionDays: string;
  onBackupTimeChange: (time: string) => void;
  onRetentionDaysChange: (days: string) => void;
  onConfigure: () => void;
  isPending: boolean;
}

export function BackupConfigurationCard({
  backupStatus,
  backupTime,
  retentionDays,
  onBackupTimeChange,
  onRetentionDaysChange,
  onConfigure,
  isPending,
}: BackupConfigurationCardProps) {
  return (
    <Card className="border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="w-5 h-5" />
          Backup Configuration
          {!backupStatus?.IsProtected && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent side="right" align="start">
                  <p className="max-w-xs text-xs">
                    Backups are not yet protected. Configure backup for this
                    chain to enable automatic scheduling and recovery points.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </CardTitle>
        <CardDescription>Configure automatic backup settings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Auto Backup</Label>
          <Badge variant={backupStatus?.IsProtected ? "default" : "secondary"}>
            {backupStatus?.IsProtected ? "Enabled" : "Disabled"}
          </Badge>
        </div>
        <div className="space-y-2">
          <Label htmlFor="backupTime">Backup Time (UTC)</Label>
          <Input
            id="backupTime"
            type="time"
            value={backupTime}
            disabled={!backupStatus?.IsProtected}
            onChange={(e) => onBackupTimeChange(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="retentionPeriod">Retention Period (days)</Label>
          <Input
            id="retentionPeriod"
            type="number"
            value={retentionDays}
            disabled={!backupStatus?.IsProtected}
            onChange={(e) => onRetentionDaysChange(e.target.value)}
            min="1"
            max="365"
          />
        </div>
        <Button
          onClick={onConfigure}
          disabled={isPending || !backupStatus?.IsProtected}
          className="w-full"
        >
          {isPending ? "Updating..." : "Configure Backup"}
        </Button>
      </CardContent>
    </Card>
  );
}

