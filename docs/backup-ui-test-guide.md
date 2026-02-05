# Backup Functionality UI Test Guide

> Test guide for backup UI features implemented in PR #23: Backup Functionality Integration

## Table of Contents

1. [Test Environment Setup](#1-test-environment-setup)
2. [Backup Tab Access](#2-backup-tab-access)
3. [Backup Status Card Test](#3-backup-status-card-test)
4. [Backup Actions Card Test](#4-backup-actions-card-test)
5. [Recent Snapshots Card Test](#5-recent-snapshots-card-test)
6. [Backup Configuration Card Test](#6-backup-configuration-card-test)
7. [Restore Backup Dialog Test](#7-restore-backup-dialog-test)
8. [Attach Storage Dialog Test](#8-attach-storage-dialog-test)
9. [Task Progress Dialog Test](#9-task-progress-dialog-test)
10. [Error and Success Notification Test](#10-error-and-success-notification-test)

---

## 1. Test Environment Setup

### Prerequisites

- [ ] Verify that the backend API server is running
- [ ] Confirm that a test rollup (stack) has been created
- [ ] Verify that EFS is connected to the rollup

### Test Data Scenarios

| Scenario | Condition | Expected Behavior |
|----------|-----------|-------------------|
| Backup Not Configured | `IsProtected: false` | Most features disabled |
| Backup Configured | `IsProtected: true` | All features enabled |
| No Snapshots | `checkpoints: []` | "Restore from Backup" button disabled |
| Snapshots Exist | `checkpoints.length > 0` | Restore feature available |

---

## 2. Backup Tab Access

### Test Steps

1. Navigate to the rollup list page
2. Click on the rollup to be tested to enter the detail page
3. Click the **"Backup"** tab in the tab menu

### Validation Items

- [ ] Backup tab is displayed in the tab menu
- [ ] Backup-related UI loads when the tab is clicked
- [ ] Spinner (RefreshCw icon) is displayed during loading

---

## 3. Backup Status Card Test

### Location
Top-left card on the screen

### Test Items

#### 3.1 Protection Status Badge

| Status | Badge Color | Text |
|--------|-------------|------|
| Protected | Green (`bg-green-100`) | "Protected" |
| Not Protected | Red (`bg-red-100`) | "Not Protected" |

- [ ] Green "Protected" badge is displayed when `IsProtected: true`
- [ ] Red "Not Protected" badge is displayed when `IsProtected: false`

#### 3.2 Status Information Display

Verify that the following fields are displayed correctly:

- [ ] Region
- [ ] Namespace
- [ ] Account ID
- [ ] EFS ARN
- [ ] Protected
- [ ] Latest Recovery Point
- [ ] Next Backup
- [ ] Schedule
- [ ] Vaults
- [ ] Expiry

#### 3.3 Error State

- [ ] "Failed to load backup status" message is displayed on API error
- [ ] "No backup configured" message is displayed when data is unavailable

---

## 4. Backup Actions Card Test

### Location
Top-right card on the screen

### Test Items

#### 4.1 Create Snapshots Button

- [ ] Snapshot creation request is sent when the button is clicked
- [ ] Button is disabled with "Creating..." text during snapshot creation
- [ ] Task progress dialog is displayed on success
- [ ] Success notification is displayed when complete

#### 4.2 Restore from Backup Button

| Condition | Button State |
|-----------|--------------|
| `checkpoints.length === 0` | Disabled |
| `checkpoints.length > 0` | Enabled |

- [ ] Button is disabled when no snapshots exist
- [ ] Restore dialog opens on click

#### 4.3 Attach to New Storage Button

| Condition | Button State |
|-----------|--------------|
| `IsProtected: false` | Disabled |
| `IsProtected: true` | Enabled |

- [ ] Button is disabled when backup is not protected
- [ ] Storage attachment dialog opens on click

---

## 5. Recent Snapshots Card Test

### Location
Below the Backup Status/Actions cards

### Test Items

#### 5.1 Snapshot List Display

Verify each snapshot item shows:

- [ ] Vault name is displayed
- [ ] Recovery Point ARN is displayed
- [ ] Creation date is displayed
- [ ] Status badge (green) is displayed

#### 5.2 Empty State

- [ ] "No snapshots available" message is displayed when no snapshots exist
- [ ] "Failed to load checkpoints" message is displayed on loading failure

#### 5.3 Tooltip

- [ ] Tooltip is displayed when hovering over Info icon when `IsProtected: false`
- [ ] Tooltip content: "To see recent checkpoints, configure backup for this chain."

---

## 6. Backup Configuration Card Test

### Location
Below the Recent Snapshots card

### Test Items

#### 6.1 Auto Backup Status

| Status | Badge Style | Text |
|--------|-------------|------|
| Enabled | `default` | "Enabled" |
| Disabled | `secondary` | "Disabled" |

#### 6.2 Backup Time Input

- [ ] Editable only when `IsProtected: true`
- [ ] Time format (HH:MM) input is accepted
- [ ] Existing schedule time is auto-loaded

#### 6.3 Retention Period Input

- [ ] Editable only when `IsProtected: true`
- [ ] Numeric input (range 1-365) is accepted
- [ ] Existing retention days are auto-loaded

#### 6.4 Configure Backup Button

| Condition | Button State |
|-----------|--------------|
| `IsProtected: false` | Disabled |
| Configuration updating | Disabled, "Updating..." displayed |
| Normal | Enabled |

- [ ] Backup configuration API is called on click
- [ ] "Backup configuration updated!" notification is displayed on success

---

## 7. Restore Backup Dialog Test

### Opening
Click the "Restore from Backup" button

### Test Items

#### 7.1 Recovery Point Selection

- [ ] Available recovery points list is displayed in dropdown
- [ ] Each item in format: `{Vault} - {Created}`
- [ ] Restore button is disabled when no point is selected

#### 7.2 Attach Workloads Checkbox

- [ ] Checkbox toggle functionality works
- [ ] Blue notification box is displayed when checked
- [ ] Notification content: guidance on EFS attachment after auto backup

#### 7.3 Button Behavior

| Button | Action |
|--------|--------|
| Cancel | Close dialog |
| Restore | Execute restore request |

- [ ] "Restoring..." is displayed and button is disabled during restore
- [ ] Dialog closes and task progress dialog opens on success

---

## 8. Attach Storage Dialog Test

### Opening
Click the "Attach to New Storage" button

### Test Items

#### 8.1 Input Fields

| Field | Placeholder | Description |
|-------|-------------|-------------|
| EFS ID | `fs-xxxxxxxxxx` | EFS file system ID |
| PVCs | `pvc-name-1,pvc-name-2` | Persistent Volume Claim list |
| STSs | `sts-name-1,sts-name-2` | StatefulSet list |

- [ ] Verify that suggested values from restore result are auto-populated

#### 8.2 PV/PVC Backup Option

- [ ] "Back up PV/PVC definitions before attach" checkbox is checked by default
- [ ] Backup download section is displayed when checked

#### 8.3 Backup Download Section

| Status | Badge | Button Text |
|--------|-------|------------|
| Not Downloaded | "Recommended" (secondary) | "Generate & Download Backup" |
| Downloading | - | "Generating..." (disabled) |
| Downloaded | "Downloaded" (default) | "Download Again" |

- [ ] YAML file is downloaded when download button is clicked
- [ ] Instruction message changes after download completes

#### 8.4 Attach Button

- [ ] Confirmation dialog is displayed when Attach is clicked without backup downloaded
- [ ] Attach executes immediately after backup is downloaded

---

## 9. Task Progress Dialog Test

### Common Behavior

Same dialog is used for three types of tasks:

1. **Snapshot Creation** - "Snapshot in Progress"
2. **Restore** - "Restore in Progress"
3. **Storage Attachment** - "Attach in Progress"

### Test Items

- [ ] Dialog opens automatically when task starts
- [ ] Progress status is displayed
- [ ] Success notification is shown and dialog auto-closes (after 2 seconds) on completion
- [ ] Error message is displayed on failure
- [ ] Dialog can be manually closed

### Additional Behavior After Restore Completion

- [ ] RestoreOutputDialog is displayed when `attachWorkloads: false`
- [ ] SyncWarningDialog is displayed when `attachWorkloads: true`

---

## 10. Error and Success Notification Test

### Notification Location
Top of the Backup tab

### Test Items

#### 10.1 Error Notification

- [ ] Red background (`bg-red-50`)
- [ ] AlertCircle icon is displayed
- [ ] Error message text is displayed
- [ ] Auto-dismisses after a certain time (for some errors)

#### 10.2 Success Notification

- [ ] Green background (`bg-green-50`)
- [ ] CheckCircle icon is displayed
- [ ] Success message text is displayed
- [ ] Auto-dismisses after 3 seconds

### Expected Messages

| Task | Success Message | Error Message |
|------|-----------------|---------------|
| Refresh | "Backup data refreshed successfully!" | "Failed to refresh backup data" |
| Snapshot Creation | "Snapshot created successfully!" | "Snapshot failed: {error}" |
| Restore | "Restore completed successfully!" | "Restore failed: {error}" |
| Storage Attachment | "Storage attached successfully!" | "Attach failed: {error}" |
| Configuration Update | "Backup configuration updated!" | "Failed to configure backup" |
| PV/PVC Download | "PV/PVC backup downloaded." | "Failed to download PV/PVC backup" |

---

## 11. Refresh Button Test

### Location
Top-right of the screen

### Test Items

- [ ] Backup status and checkpoint data are refreshed on click
- [ ] Spinner animation is displayed during refresh
- [ ] "Refreshing..." text is displayed
- [ ] Button is disabled during refresh
- [ ] "Backup data refreshed successfully!" notification is displayed on completion

---

## 12. Additional Dialog Test

### 12.1 AttachBackupReminderDialog

**Trigger**: Click Attach button without backup downloaded

- [ ] Dialog is displayed
- [ ] Backup is downloaded and dialog closes when "Download" button is clicked
- [ ] Server-side backup is executed and attach continues when "Continue" button is clicked

### 12.2 RestoreOutputDialog

**Trigger**: Restore completed (attachWorkloads: false)

- [ ] Suggested EFS ID, PVCs, STSs are displayed
- [ ] Copy button functionality for each value is verified
- [ ] AttachStorageDialog opens with auto-populated values when "Open Attach Form" button is clicked

### 12.3 SyncWarningDialog

**Trigger**: Attach completed or restore completed (attachWorkloads: true)

- [ ] Synchronization warning message is displayed
- [ ] Dialog close functionality is verified

---

## Checklist Summary

### Essential Test Items

- [ ] Backup tab access and loading
- [ ] Backup status display (Protected/Not Protected)
- [ ] Complete snapshot creation flow
- [ ] Complete backup restore flow
- [ ] Complete storage attachment flow
- [ ] Backup configuration changes
- [ ] Error/success notifications

### Edge Cases

- [ ] UI verification when backup is not configured
- [ ] Restore button is disabled when no snapshots exist
- [ ] Appropriate error message is displayed on API error
- [ ] Duplicate requests are prevented during task execution

---

## Reference Files

| Component | Path |
|-----------|------|
| BackupTab | `src/features/rollup/components/detail/tabs/BackupTab.tsx` |
| BackupStatusCard | `src/features/rollup/components/detail/tabs/BackupTabComponents/BackupStatusCard.tsx` |
| BackupActionsCard | `src/features/rollup/components/detail/tabs/BackupTabComponents/BackupActionsCard.tsx` |
| BackupConfigurationCard | `src/features/rollup/components/detail/tabs/BackupTabComponents/BackupConfigurationCard.tsx` |
| RecentSnapshotsCard | `src/features/rollup/components/detail/tabs/BackupTabComponents/RecentSnapshotsCard.tsx` |
| RestoreBackupDialog | `src/features/rollup/components/detail/tabs/BackupTabComponents/RestoreBackupDialog.tsx` |
| AttachStorageDialog | `src/features/rollup/components/detail/tabs/BackupTabComponents/AttachStorageDialog.tsx` |
| backup schema | `src/features/rollup/schemas/backup.ts` |
