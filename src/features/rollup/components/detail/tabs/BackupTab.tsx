"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, AlertCircle, CheckCircle } from "lucide-react";
import { RollupDetailTabProps } from "../../../schemas/detail-tabs";
import { downloadThanosPvPvcBackup } from "../../../services/rollupService";
import {
  useBackupStatusQuery,
  useBackupCheckpointsQuery,
} from "../../../api/queries";
import {
  useCreateSnapshotMutation,
  useRestoreBackupMutation,
  useConfigureBackupMutation,
  useAttachStorageMutation,
} from "../../../api/mutations";
import { BackupConfigureRequest, BackupAttachRequest } from "../../../schemas/backup";
import {
  BackupStatusCard,
  BackupActionsCard,
  RecentSnapshotsCard,
  BackupConfigurationCard,
  RestoreBackupDialog,
  AttachStorageDialog,
  AttachBackupReminderDialog,
  RestoreOutputDialog,
  TaskProgressDialog,
  SyncWarningDialog,
} from "./BackupTabComponents";

export function BackupTab({ stack }: RollupDetailTabProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [attachDialogOpen, setAttachDialogOpen] = useState(false);
  const [attachConfirmOpen, setAttachConfirmOpen] = useState(false);
  const [selectedRecoveryPoint, setSelectedRecoveryPoint] = useState<string>("");
  const [restoreTaskId, setRestoreTaskId] = useState<string | null>(null);
  const [restoreResult, setRestoreResult] = useState<Record<string, unknown> | null>(null);
  const [snapshotTaskId, setSnapshotTaskId] = useState<string | null>(null);
  const [attachTaskId, setAttachTaskId] = useState<string | null>(null);
  const [attachWorkloads, setAttachWorkloads] = useState<boolean>(false);
  const [backupPvPvc, setBackupPvPvc] = useState<boolean>(true);
  const [backupDownloadPending, setBackupDownloadPending] = useState(false);
  const [backupDownloaded, setBackupDownloaded] = useState(false);
  const [showSyncWarning, setShowSyncWarning] = useState(false);

  // Backup configuration state
  const [backupTime, setBackupTime] = useState("02:30");
  const [retentionDays, setRetentionDays] = useState("30");

  // Attach storage state
  const [efsId, setEfsId] = useState("");
  const [pvcs, setPvcs] = useState("");
  const [stss, setStss] = useState("");

  // Query hooks
  const {
    data: backupStatus,
    isLoading: isLoadingStatus,
    error: statusError,
    refetch: refetchStatus,
    isFetching: isFetchingStatus,
  } = useBackupStatusQuery(stack?.id);

  useEffect(() => {
    if (!backupStatus) return;
    const nextTime = backupStatus.NextBackupTime?.split(" ")[1];
    if (nextTime) {
      setBackupTime(nextTime || "02:30");
    }

    const retentionMatch = backupStatus.ExpectedExpiryDate?.match(/\((\d+)\s+days?/i);
    if (retentionMatch?.[1]) {
      setRetentionDays(retentionMatch[1] || "30");
    }
  }, [backupStatus]);

  useEffect(() => {
    if (!backupPvPvc) {
      setBackupDownloaded(false);
      setBackupDownloadPending(false);
    }
  }, [backupPvPvc]);

  useEffect(() => {
    if (attachDialogOpen) {
      setBackupDownloaded(false);
      setBackupDownloadPending(false);
    }
  }, [attachDialogOpen]);

  const {
    data: checkpoints,
    isLoading: isLoadingCheckpoints,
    error: checkpointsError,
    refetch: refetchCheckpoints,
    isFetching: isFetchingCheckpoints,
  } = useBackupCheckpointsQuery(stack?.id, "20");

  // Refresh all backup data
  const handleRefresh = async () => {
    setError(null);
    try {
      await Promise.all([refetchStatus(), refetchCheckpoints()]);
      setSuccess("Backup data refreshed successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to refresh backup data");
    }
  };

  const isRefreshing = isFetchingStatus || isFetchingCheckpoints;

  // Mutation hooks
  const createSnapshotMutation = useCreateSnapshotMutation({
    onSuccess: (data) => {
      if (data && data.task_id) {
        setSnapshotTaskId(data.task_id);
      }
      setSuccess("Backup snapshot creation initiated!");
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to create snapshot");
      setSuccess(null);
    },
  });

  const restoreBackupMutation = useRestoreBackupMutation({
    onSuccess: (data) => {
      if (data && data.task_id) {
        setRestoreTaskId(data.task_id);
      }
      setSuccess("Backup restore initiated successfully!");
      setError(null);
      setRestoreDialogOpen(false);
      setSelectedRecoveryPoint("");
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to restore backup");
      setSuccess(null);
    },
  });

  const configureBackupMutation = useConfigureBackupMutation({
    onSuccess: () => {
      setSuccess("Backup configuration updated!");
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to configure backup");
      setSuccess(null);
    },
  });

  const attachStorageMutation = useAttachStorageMutation({
    onSuccess: (data) => {
      if (data && (data as { task_id?: string }).task_id) {
        setAttachTaskId((data as { task_id?: string }).task_id!);
      }
      setSuccess("Attach started successfully!");
      setError(null);
      setAttachDialogOpen(false);
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to attach storage");
      setSuccess(null);
    },
  });

  const handleCreateSnapshot = () => {
    if (!stack?.id) return;
    setError(null);
    setSuccess(null);

    createSnapshotMutation.mutate({
      id: stack.id,
    });
  };

  const handleRestoreBackup = () => {
    if (!stack?.id || !selectedRecoveryPoint) return;
    setError(null);
    setSuccess(null);
    setRestoreResult(null);

    restoreBackupMutation.mutate({
      id: stack.id,
      request: {
        recoveryPointID: selectedRecoveryPoint,
        attach: attachWorkloads,
      },
    });
  };

  const handleConfigureBackup = () => {
    if (!stack?.id) return;
    setError(null);
    setSuccess(null);

    const request: BackupConfigureRequest = {
      daily: backupTime,
      keep: retentionDays,
    };

    configureBackupMutation.mutate({ id: stack.id, request });
  };

  const startAttachStorage = (serverBackupOverride?: boolean) => {
    if (!stack?.id) return;
    setError(null);
    setSuccess(null);

    const shouldRunServerBackup =
      serverBackupOverride ?? (backupPvPvc && !backupDownloaded);
    const request: BackupAttachRequest = {
      efsId: efsId || undefined,
      pvcs: pvcs || undefined,
      stss: stss || undefined,
      backupPvPvc: shouldRunServerBackup,
    };

    attachStorageMutation.mutate({ id: stack.id, request });
  };

  const handleAttachStorage = () => {
    if (backupPvPvc && !backupDownloaded) {
      setAttachConfirmOpen(true);
      return;
    }
    startAttachStorage();
  };

  const handleDownloadPvPvcBackup = async () => {
    if (!stack?.id) return;
    setError(null);
    setSuccess(null);
    setBackupDownloadPending(true);
    try {
      await downloadThanosPvPvcBackup(stack.id);
      setBackupDownloaded(true);
      setSuccess("PV/PVC backup downloaded.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to download PV/PVC backup";
      setError(message);
      setTimeout(() => setError(null), 5000);
    } finally {
      setBackupDownloadPending(false);
    }
  };

  if (isLoadingStatus) {
    return (
      <div className="space-y-6">
        <Card className="border-0 shadow-xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getSuggested = (key: string, fallback: string) => {
    const value = (restoreResult as Record<string, unknown>)?.[key];
    if (typeof value === "string" && value.trim() !== "") return value;
    return fallback;
  };

  const suggestedEfs =
    getSuggested("SuggestedEFSID", ((restoreResult as Record<string, unknown>)?.NewEFSID as string) || "");
  const suggestedPvcs = getSuggested("SuggestedPVCs", "op-geth,op-node");
  const suggestedStss = getSuggested("SuggestedSTSs", "op-geth,op-node");

  const copyField = async (label: string, value: string) => {
    if (!value) {
      setError(`No ${label} to copy.`);
      setTimeout(() => setError(null), 3000);
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      setSuccess(`${label} copied to clipboard.`);
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Failed to copy to clipboard.");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleOpenAttachForm = () => {
    setEfsId(suggestedEfs);
    setPvcs(suggestedPvcs);
    setStss(suggestedStss);
    setAttachDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Refreshing..." : "Refresh Backup Data"}
        </Button>
      </div>

      {/* Top row: Backup Status and Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BackupStatusCard
          backupStatus={backupStatus}
          statusError={statusError}
        />
        <BackupActionsCard
          backupStatus={backupStatus}
          checkpoints={checkpoints}
          onCreateSnapshot={handleCreateSnapshot}
          onRestore={() => setRestoreDialogOpen(true)}
          onAttach={() => setAttachDialogOpen(true)}
          isCreatingSnapshot={createSnapshotMutation.isPending}
        />
      </div>

      {/* Recent Snapshots Section */}
      <RecentSnapshotsCard
        backupStatus={backupStatus}
        checkpoints={checkpoints}
        isLoading={isLoadingCheckpoints}
        error={checkpointsError}
      />

      {/* Backup Configuration Section */}
      <BackupConfigurationCard
        backupStatus={backupStatus}
        backupTime={backupTime}
        retentionDays={retentionDays}
        onBackupTimeChange={setBackupTime}
        onRetentionDaysChange={setRetentionDays}
        onConfigure={handleConfigureBackup}
        isPending={configureBackupMutation.isPending}
      />

      {/* Restore Dialog */}
      <RestoreBackupDialog
        open={restoreDialogOpen}
        onOpenChange={setRestoreDialogOpen}
        checkpoints={checkpoints}
        selectedRecoveryPoint={selectedRecoveryPoint}
        onRecoveryPointChange={setSelectedRecoveryPoint}
        attachWorkloads={attachWorkloads}
        onAttachWorkloadsChange={setAttachWorkloads}
        onRestore={handleRestoreBackup}
        isPending={restoreBackupMutation.isPending}
      />

      {/* Attach Storage Dialog */}
      <AttachStorageDialog
        open={attachDialogOpen}
        onOpenChange={setAttachDialogOpen}
        efsId={efsId}
        pvcs={pvcs}
        stss={stss}
        onEfsIdChange={setEfsId}
        onPvcsChange={setPvcs}
        onStssChange={setStss}
        backupPvPvc={backupPvPvc}
        onBackupPvPvcChange={setBackupPvPvc}
        backupDownloaded={backupDownloaded}
        backupDownloadPending={backupDownloadPending}
        onDownloadBackup={handleDownloadPvPvcBackup}
        onAttach={handleAttachStorage}
        isPending={attachStorageMutation.isPending}
      />

      {/* Attach Backup Reminder Dialog */}
      <AttachBackupReminderDialog
        open={attachConfirmOpen}
        onOpenChange={setAttachConfirmOpen}
        onDownload={async () => {
          await handleDownloadPvPvcBackup();
          setAttachConfirmOpen(false);
        }}
        onContinue={() => {
          setAttachConfirmOpen(false);
          startAttachStorage();
        }}
        isDownloadPending={backupDownloadPending}
      />
      {/* Restore Progress Dialog */}
      <TaskProgressDialog
        open={!!restoreTaskId}
        onOpenChange={(open) => !open && setRestoreTaskId(null)}
        taskId={restoreTaskId}
        title="Restore in Progress"
        description="Please wait while the backup is being restored."
        onComplete={(data) => {
          setSuccess("Restore completed successfully!");
          setTimeout(() => setRestoreTaskId(null), 2000);
          setTimeout(() => setSuccess(null), 5000);
          refetchStatus();
          if (data && typeof data === "object" && "result" in data) {
            setRestoreResult(data.result as Record<string, unknown>);
          }
          if (attachWorkloads) {
            setShowSyncWarning(true);
          }
        }}
        onError={(err) => {
          setError(`Restore failed: ${err}`);
        }}
      />

      {/* Attach Progress Dialog */}
      <TaskProgressDialog
        open={!!attachTaskId}
        onOpenChange={(open) => !open && setAttachTaskId(null)}
        taskId={attachTaskId}
        title="Attach in Progress"
        description="Please wait while the storage is being attached."
        onComplete={() => {
          setSuccess("Storage attached successfully!");
          setTimeout(() => setAttachTaskId(null), 2000);
          setTimeout(() => setSuccess(null), 5000);
          refetchStatus();
          setShowSyncWarning(true);
        }}
        onError={(err) => {
          setError(`Attach failed: ${err}`);
        }}
      />

      {/* Restore Output Dialog */}
      <RestoreOutputDialog
        open={!!restoreResult && !attachWorkloads}
        onOpenChange={(open) => !open && setRestoreResult(null)}
        suggestedEfs={suggestedEfs}
        suggestedPvcs={suggestedPvcs}
        suggestedStss={suggestedStss}
        onCopy={copyField}
        onOpenAttachForm={handleOpenAttachForm}
      />

      {/* Snapshot Progress Dialog */}
      <TaskProgressDialog
        open={!!snapshotTaskId}
        onOpenChange={(open) => !open && setSnapshotTaskId(null)}
        taskId={snapshotTaskId}
        title="Snapshot in Progress"
        description="Please wait while the backup snapshot is being created."
        onComplete={() => {
          setSuccess("Snapshot created successfully!");
          setTimeout(() => setSnapshotTaskId(null), 2000);
          setTimeout(() => setSuccess(null), 5000);
          refetchCheckpoints();
          refetchStatus();
        }}
        onError={(err) => {
          setError(`Snapshot failed: ${err}`);
        }}
      />

      {/* Sync Warning Dialog */}
      <SyncWarningDialog
        open={showSyncWarning}
        onOpenChange={setShowSyncWarning}
      />
    </div>
  );
}
