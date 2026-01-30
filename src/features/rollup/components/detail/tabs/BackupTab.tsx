"use client";

import React, { useEffect, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Database,
  HardDrive,
  RefreshCw,
  Upload,
  AlertCircle,
  CheckCircle,
  Clock,
  Server,
  Shield,
  Info,
  Copy,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { TaskProgress } from "@/components/TaskProgress";

export function BackupTab({ stack }: RollupDetailTabProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [attachDialogOpen, setAttachDialogOpen] = useState(false);
  const [attachConfirmOpen, setAttachConfirmOpen] = useState(false);
  const [selectedRecoveryPoint, setSelectedRecoveryPoint] = useState<string>("");
  const [restoreTaskId, setRestoreTaskId] = useState<string | null>(null);
  const [restoreResult, setRestoreResult] = useState<any | null>(null);
  const [snapshotTaskId, setSnapshotTaskId] = useState<string | null>(null);
  const [attachTaskId, setAttachTaskId] = useState<string | null>(null);
  const [attachWorkloads, setAttachWorkloads] = useState<boolean>(false);
  const [backupPvPvc, setBackupPvPvc] = useState<boolean>(true);
  const [backupDownloadPending, setBackupDownloadPending] = useState(false);
  const [backupDownloaded, setBackupDownloaded] = useState(false);

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
      if (data && (data as any).task_id) {
        setAttachTaskId((data as any).task_id);
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

    const awsCreds = getAwsCredentials();
    createSnapshotMutation.mutate({
      id: stack.id,
      request: awsCreds,
    });
  };

  // Extract AWS credentials from stack config
  const getAwsCredentials = () => {
    console.log("stack.config", stack?.config);
    if (!stack?.config) return {};

    return {
      awsAccessKey: stack.config.awsAccessKey || undefined,
      awsSecretAccessKey: stack.config.awsSecretAccessKey || undefined,
      awsRegion: stack.config.awsRegion || undefined,
    };
  };

  const handleRestoreBackup = () => {
    if (!stack?.id || !selectedRecoveryPoint) return;
    setError(null);
    setSuccess(null);
    setRestoreResult(null);

    const awsCreds = getAwsCredentials();
    restoreBackupMutation.mutate({
      id: stack.id,
      request: {
        recoveryPointID: selectedRecoveryPoint,
        attach: attachWorkloads,
        ...awsCreds,
      },
    });
  };

  const handleConfigureBackup = () => {
    if (!stack?.id) return;
    setError(null);
    setSuccess(null);

    const awsCreds = getAwsCredentials();
    const request: BackupConfigureRequest = {
      daily: backupTime,
      keep: retentionDays,
      ...awsCreds,
    };

    configureBackupMutation.mutate({ id: stack.id, request });
  };

  const startAttachStorage = (serverBackupOverride?: boolean) => {
    if (!stack?.id) return;
    setError(null);
    setSuccess(null);

    const awsCreds = getAwsCredentials();
    const shouldRunServerBackup =
      serverBackupOverride ?? (backupPvPvc && !backupDownloaded);
    const request: BackupAttachRequest = {
      efsId: efsId || undefined,
      pvcs: pvcs || undefined,
      stss: stss || undefined,
      backupPvPvc: shouldRunServerBackup,
      ...awsCreds,
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
    const value = (restoreResult as any)?.[key];
    if (typeof value === "string" && value.trim() !== "") return value;
    return fallback;
  };

  const suggestedEfs =
    getSuggested("SuggestedEFSID", (restoreResult as any)?.NewEFSID || "");
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
        {/* Backup Status Card */}
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

        {/* Backup Actions Card */}
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
              onClick={handleCreateSnapshot}
              disabled={createSnapshotMutation.isPending}
              className="w-full"
              variant="outline"
            >
              <Upload className="w-4 h-4 mr-2" />
              {createSnapshotMutation.isPending ? "Creating..." : "Create Snapshots"}
            </Button>
            <Button
              onClick={() => setRestoreDialogOpen(true)}
              disabled={!checkpoints || checkpoints.length === 0}
              className="w-full"
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Restore from Backup
            </Button>
            <Button
              onClick={() => setAttachDialogOpen(true)}
              disabled={!backupStatus?.IsProtected}
              className="w-full"
              variant="outline"
            >
              <HardDrive className="w-4 h-4 mr-2" />
              Attach to New Storage
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Snapshots Section */}
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
          {isLoadingCheckpoints ? (
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
              {checkpointsError ? "Failed to load checkpoints" : "No snapshots available"}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Backup Configuration Section */}
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
              onChange={(e) => setBackupTime(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="retentionPeriod">Retention Period (days)</Label>
            <Input
              id="retentionPeriod"
              type="number"
              value={retentionDays}
              disabled={!backupStatus?.IsProtected}
              onChange={(e) => setRetentionDays(e.target.value)}
              min="1"
              max="365"
            />
          </div>
          <Button
            onClick={handleConfigureBackup}
            disabled={configureBackupMutation.isPending || !backupStatus?.IsProtected}
            className="w-full"
          >
            {configureBackupMutation.isPending ? "Updating..." : "Configure Backup"}
          </Button>
        </CardContent>
      </Card>

      {/* Restore Dialog */}
      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore from Backup</DialogTitle>
            <DialogDescription>
              Select a recovery point to restore your rollup data
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="recoveryPoint">Recovery Point</Label>
              <Select
                value={selectedRecoveryPoint}
                onValueChange={setSelectedRecoveryPoint}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a recovery point" />
                </SelectTrigger>
                <SelectContent>
                  {checkpoints?.map((checkpoint) => (
                    <SelectItem
                      key={checkpoint.RecoveryPointARN}
                      value={checkpoint.RecoveryPointARN}
                    >
                      {checkpoint.Vault} - {checkpoint.Created}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="attachWorkloads"
                checked={attachWorkloads}
                onCheckedChange={(checked) => setAttachWorkloads(!!checked)}
              />
              <Label htmlFor="attachWorkloads" className="text-sm font-normal cursor-pointer">
                Automatically attach workloads to restored EFS
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              If enabled, the restored EFS will be automatically attached to your workloads (op-geth, op-node) after restoration completes.
            </p>
            {attachWorkloads && (
              <Alert className="mt-3 border-blue-200 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-xs text-blue-800">
                  <strong>Note:</strong> When auto-attach is enabled, your current PV/PVC configurations will be automatically backed up before switching to the restored EFS. This ensures you can recover your previous storage configuration if needed.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRestoreDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRestoreBackup}
              disabled={!selectedRecoveryPoint || restoreBackupMutation.isPending}
            >
              {restoreBackupMutation.isPending ? "Restoring..." : "Restore"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Attach Storage Dialog */}
      <Dialog open={attachDialogOpen} onOpenChange={setAttachDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Attach to New Storage</DialogTitle>
            <DialogDescription>
              Configure storage attachment for backup
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="efsId">EFS ID</Label>
              <Input
                id="efsId"
                placeholder="fs-xxxxxxxxxx"
                value={efsId}
                onChange={(e) => setEfsId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pvcs">Persistent Volume Claims (PVCs)</Label>
              <Input
                id="pvcs"
                placeholder="pvc-name-1,pvc-name-2"
                value={pvcs}
                onChange={(e) => setPvcs(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stss">StatefulSets (STSs)</Label>
              <Input
                id="stss"
                placeholder="sts-name-1,sts-name-2"
                value={stss}
                onChange={(e) => setStss(e.target.value)}
              />
            </div>
            <div className="flex items-start space-x-2">
              <Checkbox
                id="backupPvPvc"
                checked={backupPvPvc}
                onCheckedChange={(checked) => setBackupPvPvc(Boolean(checked))}
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="backupPvPvc">Back up PV/PVC definitions before attach</Label>
                <p className="text-xs text-muted-foreground">
                  Runs the PV/PVC backup script before updating volume handles.
                </p>
              </div>
            </div>
            {backupPvPvc && (
              <div className="space-y-2 rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">PV/PVC Backup</span>
                  <Badge variant={backupDownloaded ? "default" : "secondary"}>
                    {backupDownloaded ? "Downloaded" : "Recommended"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Generate the YAML backup and download it before attaching storage.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleDownloadPvPvcBackup}
                  disabled={backupDownloadPending}
                >
                  {backupDownloadPending
                    ? "Generating..."
                    : backupDownloaded
                    ? "Download Again"
                    : "Generate & Download Backup"}
                </Button>
                {backupDownloaded && (
                  <p className="text-xs text-muted-foreground">
                    Backup downloaded. Attach will skip server-side backup.
                  </p>
                )}
                {!backupDownloaded && (
                  <p className="text-xs text-muted-foreground">
                    You can continue without downloading, but a backup is recommended.
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAttachDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAttachStorage}
              disabled={
                attachStorageMutation.isPending || backupDownloadPending
              }
            >
              {attachStorageMutation.isPending ? "Attaching..." : "Attach"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Attach Backup Reminder Dialog */}
      <Dialog open={attachConfirmOpen} onOpenChange={setAttachConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>PV/PVC Backup Recommended</DialogTitle>
            <DialogDescription>
              You enabled PV/PVC backup but have not downloaded it. You can download now or continue without downloading.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAttachConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                await handleDownloadPvPvcBackup();
                setAttachConfirmOpen(false);
              }}
              disabled={backupDownloadPending}
            >
              {backupDownloadPending ? "Generating..." : "Download Backup"}
            </Button>
            <Button
              onClick={() => {
                setAttachConfirmOpen(false);
                startAttachStorage();
              }}
            >
              Continue Without Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Progress Dialog */}
      <Dialog open={!!restoreTaskId} onOpenChange={(open) => !open && setRestoreTaskId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore in Progress</DialogTitle>
            <DialogDescription>
              Please wait while the backup is being restored.
            </DialogDescription>
          </DialogHeader>
          {restoreTaskId && (
            <TaskProgress
              taskId={restoreTaskId}
              title="Restoring Backup"
              onComplete={(data) => {
                setSuccess("Restore completed successfully!");
                setTimeout(() => setRestoreTaskId(null), 2000);
                setTimeout(() => setSuccess(null), 5000);
                refetchStatus();
                if (data?.result) {
                  setRestoreResult(data.result);
                }
              }}
              onError={(err) => {
                setError(`Restore failed: ${err}`);
                // keep dialog open or close?
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Attach Progress Dialog */}
      <Dialog open={!!attachTaskId} onOpenChange={(open) => !open && setAttachTaskId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Attach in Progress</DialogTitle>
            <DialogDescription>
              Please wait while the storage is being attached.
            </DialogDescription>
          </DialogHeader>
          {attachTaskId && (
            <TaskProgress
              taskId={attachTaskId}
              title="Attaching Storage"
              onComplete={() => {
                setSuccess("Storage attached successfully!");
                setTimeout(() => setAttachTaskId(null), 2000);
                setTimeout(() => setSuccess(null), 5000);
                refetchStatus();
              }}
              onError={(err) => {
                setError(`Attach failed: ${err}`);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Restore Output Dialog */}
      <Dialog
        open={!!restoreResult && !attachWorkloads}
        onOpenChange={(open) => !open && setRestoreResult(null)}
      >
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
                  onClick={() => copyField("EFS ID", suggestedEfs)}
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
                  onClick={() => copyField("PVCs", suggestedPvcs)}
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
                  onClick={() => copyField("STSs", suggestedStss)}
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
              onClick={() => {
                setEfsId(suggestedEfs);
                setPvcs(suggestedPvcs);
                setStss(suggestedStss);
                setAttachDialogOpen(true);
              }}
            >
              Open Attach Form
            </Button>
            <Button variant="outline" onClick={() => setRestoreResult(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Snapshot Progress Dialog */}
      <Dialog open={!!snapshotTaskId} onOpenChange={(open) => !open && setSnapshotTaskId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Snapshot in Progress</DialogTitle>
            <DialogDescription>
              Please wait while the backup snapshot is being created.
            </DialogDescription>
          </DialogHeader>
          {snapshotTaskId && (
            <TaskProgress
              taskId={snapshotTaskId}
              title="Creating Snapshot"
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
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
