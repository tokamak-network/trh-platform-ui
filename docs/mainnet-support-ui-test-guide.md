# Mainnet Support UI Test Guide

> UI Test Guide for Mainnet Safety Features implemented in PR #24: Feat: Support mainnet

## Table of Contents

1. [Test Environment Setup](#1-test-environment-setup)
2. [Network & Chain Step Test](#2-network--chain-step-test)
3. [Account Setup Step Test](#3-account-setup-step-test)
4. [Review & Deploy Step Test](#4-review--deploy-step-test)
5. [Pre-Deployment Checklist Dialog Test](#5-pre-deployment-checklist-dialog-test)
6. [Rollup Deletion (Mainnet Safety Guard) Test](#6-rollup-deletion-mainnet-safety-guard-test)
7. [Deployment Validation Test](#7-deployment-validation-test)
8. [Error and Warning Message Test](#8-error-and-warning-message-test)

---

## 1. Test Environment Setup

### Prerequisites

- [ ] Verify backend API server is running
- [ ] Prepare valid Mainnet RPC URL (ChainID: 1)
- [ ] Prepare valid Testnet (Sepolia) RPC URL (ChainID: 11155111)
- [ ] Verify AWS credentials are configured
- [ ] Prepare test seed phrase (12 words)

### Test Scenarios

| Scenario | Network | Expected Behavior |
|----------|---------|-------------------|
| Testnet Deployment | `testnet` | Default flow, Challenge Period 12 seconds |
| Mainnet Deployment | `mainnet` | Enhanced safety checks, Challenge Period fixed at 7 days |
| Invalid RPC | Any | Chain ID mismatch error |
| Duplicate Account Selection | Any | Account uniqueness error |

---

## 2. Network & Chain Step Test

### Location
`/rollup/create` page - Step 1

### Test Items

#### 2.1 Network Selection

| Network | Expected Behavior After Selection |
|---------|-----------------------------------|
| Testnet | Default UI displayed |
| Mainnet | Warning banner displayed |

- [ ] Testnet/Mainnet selectable from network dropdown
- [ ] Red warning banner displayed when Mainnet is selected

#### 2.2 Mainnet Warning Banner

**Location**: Top of Network Configuration card

**Verification Items**:
- [ ] Red background (`bg-red-50`)
- [ ] AlertTriangle icon displayed
- [ ] Title: "Mainnet Production Environment"
- [ ] Content: "You are deploying to the mainnet production environment. This operation will consume real assets and cannot be undone."

```
┌─────────────────────────────────────────────────────────┐
│ ⚠️ Mainnet Production Environment                       │
│ You are deploying to the mainnet production environment.│
│ This operation will consume real assets and cannot be   │
│ undone. Please double-check all configurations.         │
└─────────────────────────────────────────────────────────┘
```

#### 2.3 Reuse Deployment Option

**Condition**: Only displayed when Mainnet is selected

| State | Description |
|-------|-------------|
| Checked (default) | Reuse existing implementation contracts |
| Unchecked | Deploy new implementation + proxy contracts |

- [ ] "Reuse Existing Deployment" checkbox displayed when Mainnet is selected
- [ ] Verify default state is checked
- [ ] Description text: "Uses existing implementation contracts..."

#### 2.4 RPC URL Validation (On Next Button Click)

| Network | Expected Chain ID | Error Message |
|---------|-------------------|---------------|
| Mainnet | 1 | "Chain ID mismatch: Got {actual}, expected 1 (Mainnet)" |
| Testnet | 11155111 | "Chain ID mismatch: Got {actual}, expected 11155111 (Sepolia)" |

- [ ] "Verifying RPC connection..." toast message displayed
- [ ] "RPC Connection Verified" toast displayed on success
- [ ] Error toast displayed and Next button blocked on Chain ID mismatch
- [ ] "Network Error (CORS or Invalid URL)" message on network error

#### 2.5 Advanced Configuration - Challenge Period

**Condition**: When "Show Advanced Configuration" is checked

| Network | Challenge Period | Editable |
|---------|------------------|----------|
| Testnet | 12 (seconds) | Yes |
| Mainnet | 604800 (7 days) | **No** |

- [ ] Testnet: Challenge Period input field enabled
- [ ] Mainnet: Challenge Period input field disabled (gray background)
- [ ] Mainnet: "Fixed to 7 days (604800 seconds) for mainnet security." notice text (orange)

---

## 3. Account Setup Step Test

### Location
`/rollup/create` page - Step 2

### Test Items

#### 3.1 Account Uniqueness Validation

| Condition | Expected Behavior |
|-----------|-------------------|
| All roles have different accounts | Validation passes |
| Same account used for 2+ roles | Error message displayed |

- [ ] Select Admin, Proposer, Batch, Sequencer accounts
- [ ] "Each role must have a unique account address" error message when duplicate account is selected

#### 3.2 Network-Specific Notice Messages

| Network | Background Color | Icon | Message |
|---------|------------------|------|---------|
| Testnet | `bg-blue-50` | None | Default notice message |
| Mainnet | `bg-red-50` | AlertTriangle (red) | Emphasized notice message |

**Mainnet Message**:
- [ ] "For mainnet deployment, ensure each account (Admin, Proposer, Batcher) has sufficient ETH for gas fees and operations."

**Testnet Message**:
- [ ] "Make sure each selected account has sufficient ETH balance for their operations."

#### 3.3 Guidelines Link

- [ ] Verify different links are connected per network
- [ ] Guide document opens in new tab when link is clicked

---

## 4. Review & Deploy Step Test

### Location
`/rollup/create` page - Step 4

### Test Items

#### 4.1 Configuration Summary

- [ ] Network & Chain section: Network, Chain Name, L1 RPC URL displayed
- [ ] Account Setup section: Admin, Proposer, Batch, Sequencer accounts displayed
- [ ] AWS Configuration section: Account Name, Access Key, Region displayed
- [ ] AWS Secret Key: Masked by default (••••••••), toggle with Eye icon

#### 4.2 Estimated Deployment Cost

**Condition**: Displayed on deployment validation success

- [ ] Blue background card displayed (`border-blue-200 bg-blue-50/30`)
- [ ] Title: "Estimated Deployment Cost"
- [ ] Deployment Gas (in ETH) displayed
- [ ] "One-time cost" label

#### 4.3 Mainnet Deployment Warning

**Condition**: When Network is Mainnet

```
┌─────────────────────────────────────────────────────────┐
│ ⚠️ Mainnet Deployment WARNING                           │
│ You are about to deploy to MAINNET. This involves real  │
│ assets and costs. This action is IRREVERSIBLE.          │
│                                                         │
│ [ ] I acknowledge the risks and agree to proceed with   │
│     this Mainnet deployment.                            │
└─────────────────────────────────────────────────────────┘
```

- [ ] Red background (`bg-red-50`)
- [ ] AlertCircle icon (red)
- [ ] "Mainnet Deployment WARNING" title (bold)
- [ ] Consent checkbox displayed
- [ ] **Deployment not possible without checkbox checked**

#### 4.4 Testnet Deployment Notice

**Condition**: When Network is Testnet

- [ ] Blue background (`bg-blue-50`)
- [ ] AlertCircle icon (blue)
- [ ] "Deployment Notice" title
- [ ] Default notice message displayed

---

## 5. Pre-Deployment Checklist Dialog Test

### Opening
Click Deploy button in Review Step (Mainnet only)

### Test Items

#### 5.1 Dialog Header

- [ ] Title: "Pre-Deployment Checklist" (orange)
- [ ] AlertTriangle icon displayed
- [ ] Network name displayed: "You are deploying to **{network}**."

#### 5.2 Warning Message Box

- [ ] Orange background (`bg-amber-50`)
- [ ] Content: "This is the final check. Once deployment starts, resources will be provisioned and costs incurred."

#### 5.3 Checklist Items (4 items)

| ID | Label | Description |
|----|-------|-------------|
| rpc-check | RPC Connection Verified | Confirmed connection to L1 RPC and Beacon nodes. |
| balance-check | Account Balances Sufficient | Admin, Proposer, and Batcher accounts have sufficient ETH. |
| aws-check | AWS Credentials Validated | AWS permissions for EFS and EC2 are confirmed. |
| config-check | Configuration Reviewed | All rollup parameters including blocked time are final. |

- [ ] Checkbox displayed for each item
- [ ] State changes on checkbox click
- [ ] Background color changes on hover

#### 5.4 Button States

| Condition | Confirm & Deploy Button |
|-----------|-------------------------|
| All items unchecked | Disabled |
| Only some items checked | Disabled |
| **All items checked** | **Enabled** |
| Deployment in progress | Disabled, shows "Deploying..." + spinner |

- [ ] All checkboxes reset when dialog opens
- [ ] Dialog closes on Cancel button click
- [ ] Actual deployment proceeds on Confirm & Deploy button click

---

## 6. Rollup Deletion (Mainnet Safety Guard) Test

### Location
Trash icon on the right side of each Rollup item in Rollup list page

### Test Items

#### 6.1 Delete Button State

| Condition | Button State |
|-----------|--------------|
| DEPLOYING, UPDATING, TERMINATING, TERMINATED, PENDING | Disabled |
| Other states | Enabled |

- [ ] Trash2 icon displayed
- [ ] Confirmation dialog displayed on click

#### 6.2 Delete Dialog - Testnet

- [ ] Title: "Destroy Rollup"
- [ ] Content: "Are you sure you want to destroy {chainName}? This action cannot be undone."
- [ ] Dialog closes on Cancel button click
- [ ] Deletion executes on Delete button click

#### 6.3 Delete Dialog - Mainnet (Enhanced Confirmation)

**Mainnet-Only Additional UI**:

```
┌─────────────────────────────────────────────────────────┐
│ ⚠️ Destroy Rollup (red title + AlertTriangle icon)      │
│                                                         │
│ Are you sure you want to destroy {chainName}?           │
│ This action cannot be undone.                           │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ This is a Mainnet environment.                      │ │
│ │ To confirm, please type the rollup name: {name}     │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Rollup Name: [_________________________]                │
│                                                         │
│                        [Cancel] [Delete]                │
└─────────────────────────────────────────────────────────┘
```

- [ ] AlertTriangle icon displayed in title (red)
- [ ] Red warning box (`bg-red-50`) displayed
- [ ] Rollup name input field displayed
- [ ] **Delete button only enabled when input matches actual rollup name (`stack.name`)**
- [ ] Delete button disabled on name mismatch
- [ ] Input value reset when dialog closes

#### 6.4 Deletion Execution Result

| Result | Behavior |
|--------|----------|
| Success | Rollup list refreshed |
| Failure | Error toast displayed |

---

## 7. Deployment Validation Test

### Trigger
Automatically executed when Deploy button is clicked in Review Step

### Test Items

#### 7.1 Validation In Progress

- [ ] "Validating deployment parameters..." loading toast displayed
- [ ] Deployment blocked until validation completes

#### 7.2 Validation Success

- [ ] "Validation passed!" success toast displayed
- [ ] Estimated Cost card updated
- [ ] Pre-Deployment Checklist dialog opens (Mainnet)
- [ ] Or deployment proceeds immediately (Testnet)

#### 7.3 Validation Failure

Validation Items:
- Balance check (Admin, Proposer, Batcher account balances)
- AWS credentials check
- Other backend validations

- [ ] "Validation Failed:" error toast displayed
- [ ] List of failed validation items displayed
- [ ] Deployment blocked

#### 7.4 Validation Service Unavailable

- [ ] "Validation service unavailable. Proceeding with caution..." warning toast
- [ ] Deployment can still proceed

---

## 8. Error and Warning Message Test

### 8.1 Form Validation Errors

| Field | Condition | Error Message |
|-------|-----------|---------------|
| Network | Not selected | "Network is required" |
| Chain Name | Empty | "Chain name is required" |
| Chain Name | Over 14 characters | "Chain name must be 14 characters or less" |
| Chain Name | Invalid format | "Must start with a letter and can only contain letters, numbers and spaces" |
| L1 RPC URL | Empty | "L1 RPC URL is required" |
| L1 RPC URL | Invalid URL | "Must be a valid URL" |
| Challenge Period (Mainnet) | Not 604800 | "Mainnet requires Challenge Period to be exactly 604800 seconds (7 days)" |
| Account | Duplicate selection | "Each role must have a unique account address" |

### 8.2 Toast Message Types

| Type | Style | Use Case |
|------|-------|----------|
| loading | Loading spinner | RPC validation in progress, deployment validation in progress |
| success | Green check | RPC validation success, deployment success |
| error | Red X | RPC validation failure, deployment failure, validation failure |

---

## Checklist Summary

### Required Test Items

#### Mainnet Safety Guards
- [ ] Warning banner displayed on network selection
- [ ] RPC Chain ID validation (Mainnet: 1, Testnet: 11155111)
- [ ] Challenge Period fixed at 7 days (Mainnet)
- [ ] Reuse Deployment default true (Mainnet)
- [ ] Mainnet deployment consent checkbox required

#### Pre-Deployment Checklist
- [ ] Deployment only possible when all 4 items are checked
- [ ] Checkboxes reset when dialog opens

#### Rollup Deletion (Mainnet Safety Guard)
- [ ] Rollup name input required on Mainnet
- [ ] Delete button disabled on name mismatch

#### Deployment Validation
- [ ] Automatic validation before deployment
- [ ] Deployment blocked on validation failure
- [ ] Estimated cost displayed

### Edge Cases

- [ ] Attempting Mainnet deployment with Testnet RPC → Chain ID error
- [ ] Attempting Testnet deployment with Mainnet RPC → Chain ID error
- [ ] Invalid URL input → Network error
- [ ] Duplicate account selection → Uniqueness error
- [ ] Only partial Pre-Deployment checklist checked → Button disabled
- [ ] Wrong name input on Mainnet deletion → Delete button disabled

---

## Reference Files

| Component | Path |
|-----------|------|
| NetworkAndChainStep | `src/features/rollup/components/steps/NetworkAndChainStep.tsx` |
| AccountSetup | `src/features/rollup/components/steps/AccountSetup.tsx` |
| ReviewAndDeployStep | `src/features/rollup/components/steps/ReviewAndDeployStep.tsx` |
| PreDeploymentChecklistDialog | `src/features/rollup/components/PreDeploymentChecklistDialog.tsx` |
| RollupItem (Delete Dialog) | `src/features/rollup/components/RollupItem.tsx` |
| useCreateRollup Hook | `src/features/rollup/hooks/useCreateRollup.ts` |
| create-rollup Schema | `src/features/rollup/schemas/create-rollup.ts` |
| rollupService | `src/features/rollup/services/rollupService.ts` |

---

## Test Flow Diagram

### Mainnet Deployment Full Flow

```
Step 1: Network & Chain
    │
    ├─ Select Mainnet
    │   ├─ Warning banner displayed
    │   └─ Reuse Deployment option displayed
    │
    └─ Click Next
        └─ RPC Chain ID validation (verify ID=1)
            │
Step 2: Account Setup
    │
    ├─ Account selection (uniqueness validation)
    └─ Mainnet-style notice message
        │
Step 3: DAO Candidate (Optional)
        │
Step 4: Review & Deploy
    │
    ├─ Verify Configuration Summary
    ├─ Mainnet Warning + consent checkbox ✓
    │
    └─ Click Deploy
        │
        ├─ Deployment Validation API call
        │   ├─ Success → Pre-Deployment Checklist opens
        │   └─ Failure → Error toast, deployment blocked
        │
        └─ Pre-Deployment Checklist
            ├─ Check all 4 items ✓
            └─ Confirm & Deploy → Actual deployment executes
```

### Testnet Deployment Flow

```
Step 1: Network & Chain
    │
    ├─ Select Testnet (default UI)
    └─ Click Next
        └─ RPC Chain ID validation (verify ID=11155111)
            │
Step 2-3: (Same)
            │
Step 4: Review & Deploy
    │
    ├─ Verify Configuration Summary
    ├─ Default Deployment Notice
    │
    └─ Click Deploy
        │
        ├─ Deployment Validation API call
        │   └─ Success → Deployment proceeds immediately (no checklist)
        │
        └─ Deployment proceeds
```
