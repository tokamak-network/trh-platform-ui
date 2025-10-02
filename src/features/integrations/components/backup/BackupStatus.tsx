"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, Clock, HardDrive, Shield, Loader2 } from "lucide-react";
import { useBackupStatusQuery } from "../../api/queries";

interface BackupStatusProps {
  stackId?: string;
}

interface BackupStatusItem {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  mono?: boolean;
  badge?: boolean;
  badgeColor?: string;
}

export function BackupStatus({ stackId }: BackupStatusProps) {
  const { data: backupData, isLoading, error } = useBackupStatusQuery(stackId || "");

  if (isLoading) {
    return (
      <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-emerald-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600">
              <Shield className="h-4 w-4 text-white" />
            </div>
            Backup Status
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-slate-600" />
          <span className="ml-2 text-slate-600">Loading backup status...</span>
        </CardContent>
      </Card>
    );
  }

  if (error || !backupData) {
    return (
      <Card className="border-0 shadow-xl bg-gradient-to-br from-red-50 to-rose-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <div className="p-2 rounded-lg bg-gradient-to-r from-red-500 to-rose-600">
              <Shield className="h-4 w-4 text-white" />
            </div>
            Backup Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-700">Failed to load backup status</p>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC",
        timeZoneName: "short"
      });
    } catch {
      return dateString;
    }
  };

  const backupStatus = {
    lastBackup: formatDate(backupData.details.LatestRecoveryPoint),
    status: backupData.details.IsProtected ? "Protected" : "Not Protected",
    overallStatus: backupData.status,
    storageLocation: `AWS EFS (${backupData.details.Region})`,
    backupVault: backupData.details.BackupVaults.join(", "),
    namespace: backupData.details.Namespace,
    accountId: backupData.details.AccountID,
    efsId: backupData.details.EFSID,
    arn: backupData.details.ARN,
    expiryDate: backupData.details.ExpectedExpiryDate ? formatDate(backupData.details.ExpectedExpiryDate) : "N/A",
  };

  return (
    <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-emerald-100">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-800">
          <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600">
            <Shield className="h-4 w-4 text-white" />
          </div>
          Backup Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center p-3 rounded-lg bg-white/60 backdrop-blur-sm">
          <span className="text-sm font-medium text-slate-700">
            Backup Status:
          </span>
          <Badge 
            variant="secondary" 
            className={`${
              backupData.details.IsProtected 
                ? "bg-green-100 text-green-800 hover:bg-green-200" 
                : "bg-red-100 text-red-800 hover:bg-red-200"
            }`}
          >
            {backupStatus.status}
          </Badge>
        </div>

        {([
          { 
            label: "Overall Status", 
            value: backupStatus.overallStatus, 
            icon: Shield,
            badge: true,
            badgeColor: backupStatus.overallStatus === "active" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
          },
          { 
            label: "Last Recovery Point", 
            value: backupStatus.lastBackup, 
            icon: Clock 
          },
          { 
            label: "Storage Location", 
            value: backupStatus.storageLocation, 
            icon: HardDrive 
          },
          { 
            label: "Backup Vault", 
            value: backupStatus.backupVault, 
            icon: Database,
            mono: true 
          },
          { 
            label: "Namespace", 
            value: backupStatus.namespace, 
            icon: Database,
            mono: true 
          },
          { 
            label: "EFS ID", 
            value: backupStatus.efsId, 
            icon: HardDrive,
            mono: true 
          },
          { 
            label: "Account ID", 
            value: backupStatus.accountId, 
            icon: Database,
            mono: true 
          },
          ...(backupStatus.expiryDate !== "N/A" ? [{ 
            label: "Expected Expiry", 
            value: backupStatus.expiryDate, 
            icon: Clock 
          }] : []),
        ] as BackupStatusItem[]).map((item, index) => (
          <div
            key={index}
            className="flex justify-between items-center p-3 rounded-lg hover:bg-white/50 transition-colors duration-200"
          >
            <div className="flex items-center gap-2">
              <item.icon className="h-4 w-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">
                {item.label}:
              </span>
            </div>
            {item.badge ? (
              <Badge 
                variant="secondary" 
                className={`${item.badgeColor} capitalize`}
              >
                {item.value}
              </Badge>
            ) : (
              <span
                className={`text-sm ${item.mono ? "font-mono" : ""} text-slate-800 font-medium`}
              >
                {item.value}
              </span>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
