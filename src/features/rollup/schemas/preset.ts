import { z } from "zod";

export const feeTokenSchema = z.enum(["TON", "ETH", "USDT", "USDC"]);
export type FeeToken = z.infer<typeof feeTokenSchema>;

export const FEE_TOKEN_OPTIONS = [
  { value: "TON" as const, name: "Tokamak Network Token", symbol: "TON" },
  { value: "ETH" as const, name: "Ether", symbol: "ETH" },
  { value: "USDT" as const, name: "Tether USD", symbol: "USDT" },
  { value: "USDC" as const, name: "USD Coin", symbol: "USDC" },
] as const;

export const presetKeySchema = z.enum(["general", "defi", "gaming", "full"]);
export type PresetKey = z.infer<typeof presetKeySchema>;

// ─── Backend Definition schema ──────────────────────────────────────────────
// Mirrors pkg/services/thanos/presets/types.go Definition struct

export const presetDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  modules: z.record(z.string(), z.boolean()),
  genesisPredeploys: z.array(z.string()),
  estimatedTime: z.record(z.string(), z.string()),
  chainDefaults: z.record(z.string(), z.unknown()),
  helmValues: z.record(z.string(), z.unknown()),
  overridableFields: z.array(z.string()),
  availableFeeTokens: z.array(z.string()),
});
export type PresetDefinition = z.infer<typeof presetDefinitionSchema>;

// PresetSummary and PresetDetail are both the full Definition from the backend.
// We alias them for clarity at call sites.
export type PresetSummary = PresetDefinition;
export type PresetDetail = PresetDefinition;

export const presetListResponseSchema = z.array(presetDefinitionSchema);
export type PresetListResponse = z.infer<typeof presetListResponseSchema>;

export const presetDetailResponseSchema = presetDefinitionSchema;
export type PresetDetailResponse = PresetDefinition;

// ─── UI helpers ─────────────────────────────────────────────────────────────
// Derive display metadata from preset ID since the backend does not carry
// icon/recommendedFor/key/defaultFeeToken fields.

export interface PresetUIMetadata {
  key: PresetKey;
  icon: string;
  recommendedFor: string[];
  defaultFeeToken: FeeToken;
}

const PRESET_UI_METADATA: Record<string, PresetUIMetadata> = {
  general: {
    key: "general",
    icon: "layers",
    recommendedFor: ["General dApps", "Mixed workloads", "Getting started"],
    defaultFeeToken: "TON",
  },
  defi: {
    key: "defi",
    icon: "trending-up",
    recommendedFor: ["DEX", "Lending protocols", "Yield farming"],
    defaultFeeToken: "TON",
  },
  gaming: {
    key: "gaming",
    icon: "gamepad-2",
    recommendedFor: ["GameFi", "NFT marketplaces", "Real-time apps"],
    defaultFeeToken: "TON",
  },
  full: {
    key: "full",
    icon: "building-2",
    recommendedFor: ["Enterprise apps", "Regulated industries", "High-value assets"],
    defaultFeeToken: "TON",
  },
};

const DEFAULT_UI_METADATA: PresetUIMetadata = {
  key: "general",
  icon: "layers",
  recommendedFor: [],
  defaultFeeToken: "TON",
};

export function getPresetUIMetadata(id: string): PresetUIMetadata {
  return PRESET_UI_METADATA[id] ?? DEFAULT_UI_METADATA;
}

// ─── Field override ──────────────────────────────────────────────────────────

export const presetFieldOverrideSchema = z.object({
  field: z.string(),
  value: z.union([z.string(), z.number(), z.boolean()]),
});
export type PresetFieldOverride = z.infer<typeof presetFieldOverrideSchema>;

// ─── Deploy request ──────────────────────────────────────────────────────────
// Mirrors pkg/api/dtos/thanos.go PresetDeployRequest struct

export const deployWithPresetRequestSchema = z.object({
  presetId: z.string(),
  chainName: z.string().regex(/^[a-z0-9-]{3,32}$/, "Must be 3-32 lowercase alphanumeric characters or hyphens"),
  network: z.enum(["Testnet", "Mainnet"]),
  seedPhrase: z.string().min(1),
  infraProvider: z.enum(["aws", "local"]),
  awsAccessKey: z.string().optional().default(""),
  awsSecretKey: z.string().optional().default(""),
  awsRegion: z.string().optional().default(""),
  l1RpcUrl: z.string().url(),
  l1BeaconUrl: z.string().url(),
  feeToken: feeTokenSchema,
  reuseDeployment: z.boolean().optional(),
  overrides: z.array(presetFieldOverrideSchema).optional(),
});
export type DeployWithPresetRequest = z.infer<typeof deployWithPresetRequestSchema>;

// ─── Funding status ──────────────────────────────────────────────────────────

export const fundingAccountSchema = z.object({
  role: z.enum(["admin", "sequencer", "batcher", "proposer"]),
  address: z.string(),
  requiredWei: z.string(),
  currentWei: z.string(),
  fulfilled: z.boolean(),
});
export type FundingAccount = z.infer<typeof fundingAccountSchema>;

export const fundingStatusSchema = z.enum([
  "pending",
  "funding",
  "ready",
  "deploying",
  "completed",
  "failed",
]);
export type FundingStatus = z.infer<typeof fundingStatusSchema>;

export const fundingStatusResponseSchema = z.object({
  deploymentId: z.string(),
  status: fundingStatusSchema,
  accounts: z.array(fundingAccountSchema),
  allFulfilled: z.boolean(),
  txHash: z.string().optional(),
  message: z.string().optional(),
});
export type FundingStatusResponse = z.infer<typeof fundingStatusResponseSchema>;

// ─── Legacy mock data (kept for reference, not used when USE_MOCK = false) ──

export const MOCK_PRESETS: PresetSummary[] = [
  {
    id: "general",
    name: "General Purpose",
    description: "Baseline rollup preset for standard application workloads.",
    modules: {
      bridge: true,
      blockExplorer: false,
      monitoring: false,
      crossTrade: false,
      uptimeService: false,
    },
    genesisPredeploys: [
      "L2StandardBridge",
      "L2CrossDomainMessenger",
      "OptimismMintableERC20Factory",
    ],
    estimatedTime: { deploy: "20-30m", fundingWait: "5-15m" },
    chainDefaults: {
      l2BlockTime: 2,
      batchSubmissionFrequency: 1800,
      outputRootFrequency: 1800,
      challengePeriod: 10,
      registerCandidate: false,
      backupEnabled: false,
    },
    helmValues: {
      "bridge.enabled": true,
      "monitoring.enabled": false,
      "blockscout.enabled": false,
      "crossTrade.enabled": false,
      "uptimeService.enabled": false,
    },
    overridableFields: [
      "l2BlockTime",
      "batchSubmissionFrequency",
      "outputRootFrequency",
      "challengePeriod",
      "backupEnabled",
    ],
    availableFeeTokens: ["TON", "ETH", "USDT", "USDC"],
  },
  {
    id: "defi",
    name: "DeFi",
    description: "Preset for exchange, liquidity, and settlement-heavy workloads.",
    modules: {
      bridge: true,
      blockExplorer: true,
      monitoring: true,
      crossTrade: false,
      uptimeService: true,
    },
    genesisPredeploys: [
      "L2StandardBridge",
      "L2CrossDomainMessenger",
      "OptimismMintableERC20Factory",
    ],
    estimatedTime: { deploy: "30-40m", fundingWait: "5-15m" },
    chainDefaults: {
      l2BlockTime: 2,
      batchSubmissionFrequency: 900,
      outputRootFrequency: 900,
      challengePeriod: 10,
      registerCandidate: false,
      backupEnabled: true,
    },
    helmValues: {
      "bridge.enabled": true,
      "monitoring.enabled": true,
      "blockscout.enabled": true,
      "crossTrade.enabled": false,
      "uptimeService.enabled": true,
    },
    overridableFields: [
      "batchSubmissionFrequency",
      "outputRootFrequency",
      "challengePeriod",
    ],
    availableFeeTokens: ["TON", "ETH", "USDT", "USDC"],
  },
  {
    id: "gaming",
    name: "Gaming",
    description: "Preset optimized for higher throughput and player-facing observability.",
    modules: {
      bridge: true,
      blockExplorer: true,
      monitoring: true,
      crossTrade: true,
      uptimeService: true,
    },
    genesisPredeploys: [
      "L2StandardBridge",
      "L2CrossDomainMessenger",
      "OptimismMintableERC20Factory",
    ],
    estimatedTime: { deploy: "35-45m", fundingWait: "5-15m" },
    chainDefaults: {
      l2BlockTime: 2,
      batchSubmissionFrequency: 300,
      outputRootFrequency: 600,
      challengePeriod: 10,
      registerCandidate: false,
      backupEnabled: true,
    },
    helmValues: {
      "bridge.enabled": true,
      "monitoring.enabled": true,
      "blockscout.enabled": true,
      "crossTrade.enabled": true,
      "uptimeService.enabled": true,
    },
    overridableFields: [
      "l2BlockTime",
      "batchSubmissionFrequency",
      "outputRootFrequency",
    ],
    availableFeeTokens: ["TON", "ETH", "USDT", "USDC"],
  },
  {
    id: "full",
    name: "Full Suite",
    description:
      "All recommended modules enabled for demos, staging, or high-touch managed environments.",
    modules: {
      bridge: true,
      blockExplorer: true,
      monitoring: true,
      crossTrade: true,
      uptimeService: true,
    },
    genesisPredeploys: [
      "L2StandardBridge",
      "L2CrossDomainMessenger",
      "OptimismMintableERC20Factory",
    ],
    estimatedTime: { deploy: "40-50m", fundingWait: "5-15m" },
    chainDefaults: {
      l2BlockTime: 2,
      batchSubmissionFrequency: 600,
      outputRootFrequency: 600,
      challengePeriod: 10,
      registerCandidate: true,
      backupEnabled: true,
    },
    helmValues: {
      "bridge.enabled": true,
      "monitoring.enabled": true,
      "blockscout.enabled": true,
      "crossTrade.enabled": true,
      "uptimeService.enabled": true,
    },
    overridableFields: [
      "l2BlockTime",
      "batchSubmissionFrequency",
      "outputRootFrequency",
      "challengePeriod",
      "registerCandidate",
    ],
    availableFeeTokens: ["TON", "ETH", "USDT", "USDC"],
  },
];

export const MOCK_PRESET_DETAILS: Record<string, PresetDetail> = Object.fromEntries(
  MOCK_PRESETS.map((p) => [p.id, p])
);
