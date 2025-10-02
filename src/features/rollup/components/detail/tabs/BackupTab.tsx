"use client";

import React from "react";
import { RollupDetailTabProps } from "../../../schemas/detail-tabs";
import { 
  BackupStatus, 
  BackupActions, 
  RecentSnapshots, 
  BackupConfiguration 
} from "@/features/integrations/components/backup";

export function BackupTab({ stack }: RollupDetailTabProps) {
  if (!stack) return null;

  return (
    <div className="space-y-6">
      {/* Top row - Status and Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <BackupStatus stackId={stack.id} />
        <BackupActions stackId={stack.id} />
      </div>
      
      {/* Bottom row - Snapshots and Configuration */}
      <div className="grid gap-6 md:grid-cols-2">
        <RecentSnapshots stackId={stack.id} />
        <BackupConfiguration stackId={stack.id} />
      </div>
    </div>
  );
}
