# TRH Platform Architecture

Describes the integration structure between trh-platform-ui, trh-sdk, and trh-backend.

## System Overall Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              TRH Platform                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌───────────────────┐                      ┌───────────────────┐          │
│   │                   │    REST API          │                   │          │
│   │  trh-platform-ui  │◄────────────────────►│   trh-backend     │          │
│   │    (Next.js)      │   /api/v1/*          │   (FastAPI)       │          │
│   │                   │                      │                   │          │
│   └───────────────────┘                      └─────────┬─────────┘          │
│           │                                            │                    │
│           │                                            │                    │
│           │ ethers.js                                  │ trh-sdk           │
│           ▼                                            ▼                    │
│   ┌───────────────────┐                      ┌───────────────────┐          │
│   │                   │                      │                   │          │
│   │  Wallet/Keys      │                      │  Thanos Stack     │          │
│   │  (Client-side)    │                      │  (L2 Deployment)  │          │
│   │                   │                      │                   │          │
│   └───────────────────┘                      └───────────────────┘          │
│                                                        │                    │
│                                                        ▼                    │
│                                              ┌───────────────────┐          │
│                                              │                   │          │
│                                              │   AWS / K8s       │          │
│                                              │   Infrastructure  │          │
│                                              │                   │          │
│                                              └───────────────────┘          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Component Roles

| Component | Role | Tech Stack |
|---------|------|----------|
| **trh-platform-ui** | User Interface, Rollup Management Dashboard | Next.js 15, React, TanStack Query |
| **trh-backend** | API Server, Business Logic, Infrastructure Orchestration | FastAPI (Python) |
| **trh-sdk** | L2 Rollup Deployment and Management SDK | TypeScript/Python |

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         trh-platform-ui Internal Structure                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│   │             │    │   TanStack  │    │             │    │             │  │
│   │    Pages    │───►│   Query     │───►│  Services   │───►│  API Client │  │
│   │   (app/)    │    │   Hooks     │    │             │    │  (axios)    │  │
│   │             │    │             │    │             │    │             │  │
│   └─────────────┘    └─────────────┘    └─────────────┘    └──────┬──────┘  │
│                                                                   │         │
│                                                                   ▼         │
└───────────────────────────────────────────────────────────────────┼─────────┘
                                                                    │
                                                          HTTP (REST API)
                                                                    │
                                                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           trh-backend Internal Structure                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│   │             │    │             │    │             │    │             │  │
│   │  API Routes │───►│  Services   │───►│   trh-sdk   │───►│  K8s/AWS    │  │
│   │  /api/v1/*  │    │             │    │             │    │  Resources  │  │
│   │             │    │             │    │             │    │             │  │
│   └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## API Communication Structure

```
┌──────────────────┐                              ┌──────────────────┐
│                  │                              │                  │
│  trh-platform-ui │                              │   trh-backend    │
│                  │                              │                  │
└────────┬─────────┘                              └────────┬─────────┘
         │                                                 │
         │  ┌─────────────────────────────────────────┐    │
         │  │           Authentication                │    │
         ├──┼─────────────────────────────────────────┼───►│
         │  │  POST /api/v1/auth/login                │    │
         │  │  GET  /api/v1/auth/profile              │    │
         │  └─────────────────────────────────────────┘    │
         │                                                 │
         │  ┌─────────────────────────────────────────┐    │
         │  │           Stack Management              │    │
         ├──┼─────────────────────────────────────────┼───►│
         │  │  GET    /api/v1/stacks/thanos           │    │
         │  │  POST   /api/v1/stacks/thanos           │    │
         │  │  PUT    /api/v1/stacks/thanos/{id}      │    │
         │  │  DELETE /api/v1/stacks/thanos/{id}      │    │
         │  └─────────────────────────────────────────┘    │
         │                                                 │
         │  ┌─────────────────────────────────────────┐    │
         │  │           Integrations                  │    │
         ├──┼─────────────────────────────────────────┼───►│
         │  │  GET  /api/v1/stacks/thanos/{id}/integrations        │
         │  │  POST /api/v1/stacks/thanos/{id}/integrations/bridge │
         │  │  POST /api/v1/stacks/thanos/{id}/integrations/backup │
         │  └─────────────────────────────────────────┘    │
         │                                                 │
         │  ┌─────────────────────────────────────────┐    │
         │  │           Configuration                 │    │
         ├──┼─────────────────────────────────────────┼───►│
         │  │  CRUD /api/v1/configuration/api-key     │    │
         │  │  CRUD /api/v1/configuration/aws-credentials  │
         │  │  CRUD /api/v1/configuration/rpc-url     │    │
         │  └─────────────────────────────────────────┘    │
         │                                                 │
         ▼                                                 ▼
```

## Authentication Flow

```
┌──────────┐         ┌──────────────────┐         ┌─────────────┐
│          │         │                  │         │             │
│  User    │         │  trh-platform-ui │         │ trh-backend │
│          │         │                  │         │             │
└────┬─────┘         └────────┬─────────┘         └──────┬──────┘
     │                        │                          │
     │  1. Login Request      │                          │
     │───────────────────────►│                          │
     │                        │  2. POST /auth/login     │
     │                        │─────────────────────────►│
     │                        │                          │
     │                        │  3. JWT Token            │
     │                        │◄─────────────────────────│
     │                        │                          │
     │                        │  4. Store Token          │
     │                        │  (Cookie + localStorage) │
     │                        │                          │
     │  5. Access Dashboard   │                          │
     │───────────────────────►│                          │
     │                        │  6. API Request          │
     │                        │  (Authorization Header)  │
     │                        │─────────────────────────►│
     │                        │                          │
     │  7. Response           │  8. Response             │
     │◄───────────────────────│◄─────────────────────────│
     │                        │                          │
     ▼                        ▼                          ▼
```

## Rollup Deployment Flow

```
┌──────────┐     ┌──────────────────┐     ┌─────────────┐     ┌─────────┐
│          │     │                  │     │             │     │         │
│   User   │     │  trh-platform-ui │     │ trh-backend │     │ trh-sdk │
│          │     │                  │     │             │     │         │
└────┬─────┘     └────────┬─────────┘     └──────┬──────┘     └────┬────┘
     │                    │                      │                 │
     │ 1. Input Config    │                      │                 │
     │───────────────────►│                      │                 │
     │                    │                      │                 │
     │                    │ 2. POST /stacks/thanos                 │
     │                    │  (DeploymentRequest) │                 │
     │                    │─────────────────────►│                 │
     │                    │                      │                 │
     │                    │                      │ 3. Deploy Stack │
     │                    │                      │────────────────►│
     │                    │                      │                 │
     │                    │                      │                 │ 4. Create K8s
     │                    │                      │                 │    Resources
     │                    │                      │                 │────────────►
     │                    │                      │                 │
     │                    │                      │ 5. Stack ID     │
     │                    │                      │◄────────────────│
     │                    │                      │                 │
     │                    │ 6. ThanosStack       │                 │
     │                    │◄─────────────────────│                 │
     │                    │                      │                 │
     │ 7. Display Status  │                      │                 │
     │◄───────────────────│                      │                 │
     │                    │                      │                 │
     │                    │ 8. Polling Status    │                 │
     │                    │─────────────────────►│                 │
     │                    │                      │                 │
     ▼                    ▼                      ▼                 ▼
```

## Key Data Models

### DeploymentRequest (UI → Backend)

```typescript
{
  network: "mainnet" | "testnet",
  l1RpcUrl: string,
  l1BeaconUrl: string,
  l2BlockTime: number,
  batchSubmissionFrequency: number,
  outputRootFrequency: number,
  challengePeriod: number,          // Mainnet: 604800 (7 days) fixed
  adminAccount: string,
  sequencerAccount: string,
  batcherAccount: string,
  proposerAccount: string,
  awsAccessKey: string,
  awsSecretAccessKey: string,
  awsRegion: string,
  chainName: string,
  registerCandidate: boolean,
  reuseDeployment: boolean,         // Default: true (reuse existing implementation contracts)
  mainnetConfirmation?: {           // Required for mainnet deployments
    acknowledgedIrreversibility: boolean,
    acknowledgedCosts: boolean,
    acknowledgedRisks: boolean,
    confirmationTimestamp: string
  }
}
```

### ThanosStack (Backend → UI)

```typescript
{
  id: string,
  name: string,
  status: "pending" | "running" | "stopped" | "failed",
  network: "mainnet" | "testnet",
  chainId: number,
  rpcUrl: string,
  explorerUrl: string,
  deployments: Deployment[],
  integrations: Integration[],
  createdAt: string,
  updatedAt: string
}
```

## Mainnet Fixed Parameters

The following parameters are enforced for security and stability during Mainnet deployment:

| Parameter | Mainnet Value | Testnet Default | Description |
|---------|----------|---------------|------|
| `challengePeriod` | 604800 (Fixed) | 12 | Output root challenge period (seconds). 7 days mandatory for Mainnet |
| `reuseDeployment` | true (Default) | false | Reuse existing implementation contracts |

### Validation Logic

1. **Schema Level Validation** (`create-rollup.ts`):
   - Blocks form submission if `challengePeriod !== 604800` when Mainnet is selected.

2. **UI Level Control** (`NetworkAndChainStep.tsx`):
   - Automatically sets and disables Challenge Period input field when Mainnet is selected.
   - Automatically sets appropriate defaults when network changes.

3. **Pre-Deployment Check** (`PreDeploymentChecklistDialog`):
   - Forces checklist dialog display during Mainnet deployment.
   - Deployment allowed only after confirming all items.

## Environment Variables

| Variable Name | Description | Default |
|-------|------|--------|
| `NEXT_PUBLIC_API_BASE_URL` | trh-backend API URL | `http://localhost:8000` |

## Related File Locations

```
trh-platform-ui/
├── src/
│   ├── lib/
│   │   └── api.ts                    # API Client (axios)
│   ├── features/
│   │   ├── auth/
│   │   │   └── services/authService.ts
│   │   ├── rollup/
│   │   │   ├── services/rollupService.ts
│   │   │   ├── api/queries.ts
│   │   │   ├── api/mutations.ts
│   │   │   └── schemas/thanos.ts
│   │   ├── integrations/
│   │   │   └── services/integrationService.ts
│   │   └── configuration/
│   │       ├── api-keys/services/
│   │       ├── aws-credentials/services/
│   │       └── rpc-management/services/
│   └── providers/
│       ├── query-provider.tsx        # TanStack Query Config
│       └── auth-provider.tsx         # Auth Context
└── .env.example
```
