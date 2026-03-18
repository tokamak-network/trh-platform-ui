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

export const presetSummarySchema = z.object({
  id: z.string(),
  key: presetKeySchema,
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  recommendedFor: z.array(z.string()),
  defaultFeeToken: feeTokenSchema.optional(),
});
export type PresetSummary = z.infer<typeof presetSummarySchema>;

export const presetDefaultsSchema = z.object({
  l2BlockTime: z.number(),
  batchSubmissionFrequency: z.number(),
  outputRootFrequency: z.number(),
  challengePeriod: z.number(),
  enableBackup: z.boolean(),
  registerCandidateDefault: z.boolean(),
  feeToken: feeTokenSchema,
});
export type PresetDefaults = z.infer<typeof presetDefaultsSchema>;

export const presetDetailSchema = z.object({
  id: z.string(),
  key: presetKeySchema,
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  recommendedFor: z.array(z.string()),
  defaults: presetDefaultsSchema,
  editableFields: z.array(z.string()),
});
export type PresetDetail = z.infer<typeof presetDetailSchema>;

export const presetDetailResponseSchema = z.object({
  preset: presetDetailSchema,
});
export type PresetDetailResponse = z.infer<typeof presetDetailResponseSchema>;

export const presetListResponseSchema = z.object({
  presets: z.array(presetSummarySchema),
});
export type PresetListResponse = z.infer<typeof presetListResponseSchema>;

export const presetFieldOverrideSchema = z.object({
  field: z.string(),
  value: z.union([z.string(), z.number(), z.boolean()]),
});
export type PresetFieldOverride = z.infer<typeof presetFieldOverrideSchema>;

export const fundingAccountSchema = z.object({
  role: z.enum(["deployer", "batcher", "proposer", "challenger"]),
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

export const deployWithPresetRequestSchema = z.object({
  presetId: z.string(),
  chainName: z.string().regex(/^[a-z0-9-]{3,32}$/, "Must be 3-32 lowercase alphanumeric characters or hyphens"),
  network: z.enum(["Testnet", "Mainnet"]),
  seedPhrase: z.string().min(1),
  awsAccessKey: z.string(),
  awsSecretKey: z.string(),
  awsRegion: z.string(),
  l1RpcUrl: z.string().url(),
  l1BeaconUrl: z.string().url(),
  feeToken: feeTokenSchema,
  overrides: z.array(presetFieldOverrideSchema).optional(),
});
export type DeployWithPresetRequest = z.infer<typeof deployWithPresetRequestSchema>;

// Mock preset data for development (before backend is ready)
export const MOCK_PRESETS: PresetSummary[] = [
  {
    id: "general",
    key: "general",
    name: "General Purpose",
    description: "Baseline rollup preset for standard application workloads.",
    icon: "layers",
    recommendedFor: ["General dApps", "Mixed workloads", "Getting started"],
    defaultFeeToken: "TON",
  },
  {
    id: "defi",
    key: "defi",
    name: "DeFi",
    description: "Preset for exchange, liquidity, and settlement-heavy workloads.",
    icon: "trending-up",
    recommendedFor: ["DEX", "Lending protocols", "Yield farming"],
    defaultFeeToken: "TON",
  },
  {
    id: "gaming",
    key: "gaming",
    name: "Gaming",
    description: "Preset optimized for higher throughput and player-facing observability.",
    icon: "gamepad-2",
    recommendedFor: ["GameFi", "NFT marketplaces", "Real-time apps"],
    defaultFeeToken: "TON",
  },
  {
    id: "full",
    key: "full",
    name: "Full Suite",
    description: "All recommended modules enabled for demos, staging, or high-touch managed environments.",
    icon: "building-2",
    recommendedFor: ["Enterprise apps", "Regulated industries", "High-value assets"],
    defaultFeeToken: "TON",
  },
];

export const MOCK_PRESET_DETAILS: Record<string, PresetDetail> = {
  "general": {
    id: "general",
    key: "general",
    name: "General Purpose",
    description: "Baseline rollup preset for standard application workloads.",
    icon: "layers",
    recommendedFor: ["General dApps", "Mixed workloads", "Getting started"],
    defaults: {
      l2BlockTime: 2,
      batchSubmissionFrequency: 1800,
      outputRootFrequency: 1800,
      challengePeriod: 86400,
      enableBackup: false,
      registerCandidateDefault: false,
      feeToken: "TON",
    },
    editableFields: ["l2BlockTime", "batchSubmissionFrequency", "outputRootFrequency", "challengePeriod", "feeToken"],
  },
  "defi": {
    id: "defi",
    key: "defi",
    name: "DeFi",
    description: "Preset for exchange, liquidity, and settlement-heavy workloads.",
    icon: "trending-up",
    recommendedFor: ["DEX", "Lending protocols", "Yield farming"],
    defaults: {
      l2BlockTime: 2,
      batchSubmissionFrequency: 900,
      outputRootFrequency: 900,
      challengePeriod: 86400,
      enableBackup: true,
      registerCandidateDefault: false,
      feeToken: "TON",
    },
    editableFields: ["batchSubmissionFrequency", "outputRootFrequency", "challengePeriod", "feeToken"],
  },
  "gaming": {
    id: "gaming",
    key: "gaming",
    name: "Gaming",
    description: "Preset optimized for higher throughput and player-facing observability.",
    icon: "gamepad-2",
    recommendedFor: ["GameFi", "NFT marketplaces", "Real-time apps"],
    defaults: {
      l2BlockTime: 2,
      batchSubmissionFrequency: 300,
      outputRootFrequency: 600,
      challengePeriod: 86400,
      enableBackup: true,
      registerCandidateDefault: false,
      feeToken: "TON",
    },
    editableFields: ["l2BlockTime", "batchSubmissionFrequency", "outputRootFrequency", "feeToken"],
  },
  "full": {
    id: "full",
    key: "full",
    name: "Full Suite",
    description: "All recommended modules enabled for demos, staging, or high-touch managed environments.",
    icon: "building-2",
    recommendedFor: ["Enterprise apps", "Regulated industries", "High-value assets"],
    defaults: {
      l2BlockTime: 2,
      batchSubmissionFrequency: 600,
      outputRootFrequency: 600,
      challengePeriod: 86400,
      enableBackup: true,
      registerCandidateDefault: true,
      feeToken: "TON",
    },
    editableFields: ["l2BlockTime", "batchSubmissionFrequency", "outputRootFrequency", "challengePeriod", "feeToken"],
  },
};
