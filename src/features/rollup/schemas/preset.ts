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
  modules: z.record(z.string(), z.boolean()).optional(),
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
  network: z.enum(["testnet", "mainnet"]),
  seedPhrase: z.string().optional(),
  awsAccessKey: z.string(),
  awsSecretKey: z.string(),
  awsRegion: z.string(),
  l1RpcUrl: z.string().url(),
  l1BeaconUrl: z.string().url(),
  feeToken: feeTokenSchema,
  overrides: z.array(presetFieldOverrideSchema).optional(),
});
export type DeployWithPresetRequest = z.infer<typeof deployWithPresetRequestSchema>;

// Frontend-only visual metadata for each preset (icon, use cases, etc.)
// These fields are not returned by the backend and are maintained here for UI display.
export const PRESET_UI_METADATA: Record<string, { icon: string; recommendedFor: string[] }> = {
  general: {
    icon: "layers",
    recommendedFor: ["General dApps", "Mixed workloads", "Getting started"],
  },
  defi: {
    icon: "trending-up",
    recommendedFor: ["DEX", "Lending protocols", "Yield farming"],
  },
  gaming: {
    icon: "gamepad-2",
    recommendedFor: ["GameFi", "NFT marketplaces", "Real-time apps"],
  },
  full: {
    icon: "building-2",
    recommendedFor: ["Enterprise apps", "Regulated industries", "High-value assets"],
  },
};
