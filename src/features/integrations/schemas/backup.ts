export interface BackupStatusDetails {
  ARN: string;
  AccountID: string;
  BackupVaults: string[];
  EFSID: string;
  ExpectedExpiryDate: string;
  IsProtected: boolean;
  LatestRecoveryPoint: string;
  Namespace: string;
  Region: string;
}

export interface BackupStatusData {
  status: string;
  details: BackupStatusDetails;
}

export interface BackupStatusResponse {
  status: number;
  message: string;
  data: BackupStatusData;
}

export interface BackupCheckpoint {
  Vault: string;
  Expiry: string;
  Status: string;
  Created: string;
}

export interface BackupCheckpointsResponse {
  status: number;
  message: string;
  data: BackupCheckpoint[];
}

export interface GetBackupStatusResponse {
  data: BackupStatusData;
}

export interface GetBackupCheckpointsResponse {
  data: BackupCheckpoint[];
}
