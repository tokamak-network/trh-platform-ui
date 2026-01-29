// Backup API request and response types matching backend DTOs

export interface BackupStatus {
  Region: string;
  Namespace: string;
  AccountID: string;
  EFSID: string;
  ARN: string;
  IsProtected: boolean;
  LatestRecoveryPoint: string;
  ExpectedExpiryDate: string;
  BackupVaults: string[];
  BackupSchedule: string;
  NextBackupTime: string;
}

export interface RecoveryPoint {
  RecoveryPointARN: string;
  Vault: string;
  Created: string;
  Expiry: string;
  Status: string;
}

export interface BackupConfigureRequest {
  daily?: string;
  keep?: string;
  reset?: boolean;
}

export interface BackupAttachRequest {
  efsId?: string;
  pvcs?: string;
  stss?: string;
}

export interface BackupRestoreRequest {
  recoveryPointID: string;
  attach?: boolean; // Automatically attach workloads to restored EFS
  pvcs?: string;
  stss?: string;
  awsAccessKey?: string;
  awsSecretAccessKey?: string;
  awsRegion?: string;
}

export interface BackupStatusResponse {
  status: number;
  message: string;
  data: BackupStatus;
}

export interface BackupCheckpointsResponse {
  status: number;
  message: string;
  data: RecoveryPoint[];
}

export interface BackupOperationResponse {
  status: number;
  message: string;
  data: { task_id: string } | null;
}
