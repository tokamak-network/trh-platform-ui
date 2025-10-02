"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, RotateCcw, HardDrive, Settings } from "lucide-react";
import toast from "react-hot-toast";
import { useCreateBackupSnapshotMutation } from "../../api/mutations";
import { CreateSnapshotDialog } from "./CreateSnapshotDialog";

interface BackupActionsProps {
  stackId?: string;
}

export function BackupActions({ stackId }: BackupActionsProps) {
  const [showCreateSnapshotDialog, setShowCreateSnapshotDialog] = useState(false);
  
  const createSnapshotMutation = useCreateBackupSnapshotMutation({
    onSuccess: () => {
      setShowCreateSnapshotDialog(false);
    },
  });

  const handleCreateSnapshot = () => {
    setShowCreateSnapshotDialog(true);
  };

  const handleConfirmCreateSnapshot = () => {
    if (!stackId) {
      toast.error("Stack ID is required");
      return;
    }
    createSnapshotMutation.mutate({ stackId });
  };

  const handleRestoreFromBackup = () => {
    toast.success("Restore process initiated");
    // TODO: Implement actual restore API call
  };

  const handleAttachToNewStorage = () => {
    toast.success("Storage attachment process initiated");
    // TODO: Implement actual storage attachment API call
  };

  const handleBackupConfiguration = () => {
    toast.success("Opening backup configuration");
    // TODO: Implement navigation to backup configuration
  };

  const actions = [
    {
      title: "Create Snapshots",
      description: "Create a manual backup snapshot",
      icon: Camera,
      onClick: handleCreateSnapshot,
      variant: "default" as const,
      gradient: "from-blue-500 to-cyan-400",
    },
    {
      title: "Restore from Backup",
      description: "Restore data from a previous backup",
      icon: RotateCcw,
      onClick: handleRestoreFromBackup,
      variant: "outline" as const,
      gradient: "from-green-500 to-emerald-400",
    },
    {
      title: "Attach to New Storage",
      description: "Connect to a different storage location",
      icon: HardDrive,
      onClick: handleAttachToNewStorage,
      variant: "outline" as const,
      gradient: "from-purple-500 to-pink-400",
    },
  ];

  return (
    <Card className="border-0 shadow-xl bg-gradient-to-br from-cyan-50 to-blue-100">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-800">
          <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600">
            <Settings className="h-4 w-4 text-white" />
          </div>
          Backup Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant}
            className={`w-full justify-start p-4 h-auto ${
              action.variant === "outline"
                ? "bg-white/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl hover:bg-gradient-to-r hover:" + action.gradient + " hover:text-white"
                : "bg-gradient-to-r " + action.gradient + " text-white shadow-lg hover:shadow-xl"
            } transition-all duration-200`}
            onClick={action.onClick}
          >
            <div className="flex items-center gap-3 w-full">
              <action.icon className="w-5 h-5 flex-shrink-0" />
              <div className="text-left">
                <div className="font-medium">{action.title}</div>
                <div className="text-xs opacity-80 mt-1">
                  {action.description}
                </div>
              </div>
            </div>
          </Button>
        ))}
        
        <div className="pt-2 border-t border-slate-200/50">
          <p className="text-xs text-slate-600 text-center">
            Backup actions will be logged and can be monitored in the activity feed
          </p>
        </div>
      </CardContent>

      <CreateSnapshotDialog
        open={showCreateSnapshotDialog}
        onOpenChange={setShowCreateSnapshotDialog}
        onConfirm={handleConfirmCreateSnapshot}
        isLoading={createSnapshotMutation.isPending}
      />
    </Card>
  );
}
