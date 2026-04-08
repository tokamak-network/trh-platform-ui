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
  subtitle: string;
  tagline: string;
  accentColor: string;   // border/text Tailwind color classes
  accentBg: string;      // bg Tailwind class (subtle)
  dotColor: string;      // Tailwind bg class for dot indicators
  aaEnabled: boolean;    // whether Smart Account section shows
}

const PRESET_UI_METADATA: Record<string, PresetUIMetadata> = {
  general: {
    key: "general",
    icon: "layers",
    recommendedFor: ["General dApps", "Mixed workloads", "Getting started"],
    defaultFeeToken: "TON",
    subtitle: "Baseline L2 + essentials",
    tagline: "The essentials, nothing extra.",
    accentColor: "border-blue-500 text-blue-600",
    accentBg: "bg-blue-50",
    dotColor: "bg-blue-500",
    aaEnabled: false,
  },
  defi: {
    key: "defi",
    icon: "trending-up",
    recommendedFor: ["DEX", "Lending protocols", "Yield farming"],
    defaultFeeToken: "TON",
    subtitle: "For defi app builders",
    tagline: "Built for traders and liquidity.",
    accentColor: "border-green-600 text-green-700",
    accentBg: "bg-green-50",
    dotColor: "bg-green-600",
    aaEnabled: false,
  },
  gaming: {
    key: "gaming",
    icon: "gamepad-2",
    recommendedFor: ["GameFi", "NFT marketplaces", "Real-time apps"],
    defaultFeeToken: "TON",
    subtitle: "For gaming app builders",
    tagline: "Fast chain, gasless UX for players.",
    accentColor: "border-purple-600 text-purple-700",
    accentBg: "bg-purple-50",
    dotColor: "bg-purple-600",
    aaEnabled: true,
  },
  full: {
    key: "full",
    icon: "building-2",
    recommendedFor: ["Enterprise apps", "Regulated industries", "High-value assets"],
    defaultFeeToken: "TON",
    subtitle: "Are you a builder who wants to have everything?",
    tagline: "Every service, ready to go.",
    accentColor: "border-orange-500 text-orange-600",
    accentBg: "bg-orange-50",
    dotColor: "bg-orange-500",
    aaEnabled: true,
  },
};

const DEFAULT_UI_METADATA: PresetUIMetadata = {
  key: "general",
  icon: "layers",
  recommendedFor: [],
  defaultFeeToken: "TON",
  subtitle: "",
  tagline: "",
  accentColor: "border-gray-400 text-gray-600",
  accentBg: "bg-gray-50",
  dotColor: "bg-gray-400",
  aaEnabled: false,
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

// ─── Module metadata ─────────────────────────────────────────────────────────

export const MODULE_DISPLAY_ORDER = [
  "bridge",
  "blockExplorer",
  "crossTrade",
  "monitoring",
  "uptimeService",
  "drb",
] as const;

export type ModuleKey = typeof MODULE_DISPLAY_ORDER[number];

export const MODULE_METADATA: Record<ModuleKey, {
  label: string;
  description: string;
  icon: string;
  accentColor: string;   // Tailwind bg class for left accent bar
  iconBg: string;        // Tailwind bg+text+border classes for icon box
  tag: string;
}> = {
  bridge: {
    label: "Token Bridge",
    description: "Your users can move tokens freely between Ethereum and your chain.",
    icon: "🌉",
    accentColor: "bg-blue-500",
    iconBg: "bg-blue-50 text-blue-600 border-blue-200",
    tag: "Essential",
  },
  blockExplorer: {
    label: "Block Explorer",
    description: "Browse every transaction, block, and contract on-chain.",
    icon: "🔭",
    accentColor: "bg-purple-500",
    iconBg: "bg-purple-50 text-purple-600 border-purple-200",
    tag: "Transparency",
  },
  crossTrade: {
    label: "Cross Trade",
    description: "Move tokens across chains and withdraw to L1 instantly — no waiting for the challenge period.",
    icon: "↔",
    accentColor: "bg-green-500",
    iconBg: "bg-green-50 text-green-600 border-green-200",
    tag: "DeFi",
  },
  monitoring: {
    label: "Monitoring",
    description: "Appchain live dashboard for TVL, transaction volume, and node health.",
    icon: "📊",
    accentColor: "bg-amber-500",
    iconBg: "bg-amber-50 text-amber-600 border-amber-200",
    tag: "Ops",
  },
  uptimeService: {
    label: "Uptime Service",
    description: "Instantly alerts your team if any node or service goes offline.",
    icon: "🟢",
    accentColor: "bg-teal-500",
    iconBg: "bg-teal-50 text-teal-600 border-teal-200",
    tag: "Reliability",
  },
  drb: {
    label: "Distributed Random Beacon",
    description: "On-chain verifiable randomness via a distributed randomness generation protocol — no single point of trust.",
    icon: "🎲",
    accentColor: "bg-indigo-500",
    iconBg: "bg-indigo-50 text-indigo-600 border-indigo-200",
    tag: "Randomness",
  },
};

export const AA_SERVICE_METADATA = {
  label: "Smart Account",
  description: "Programmable accounts for players — the game sets the rules. Sponsor gas, accept any fee token, no wallet setup required.",
  icon: "🪪",
};

// Returns true if the preset's UI metadata declares AA support
export function hasAASupport(preset: PresetSummary): boolean {
  return getPresetUIMetadata(preset.id).aaEnabled;
}

// Returns ordered list of enabled module keys
export function getEnabledModules(preset: PresetSummary): ModuleKey[] {
  return MODULE_DISPLAY_ORDER.filter((key) => preset.modules[key] === true);
}

// ─── Legacy mock data (kept for reference, not used when USE_MOCK = false) ──

export const MOCK_PRESETS: PresetSummary[] = [
  {
    id: "general",
    name: "General Purpose",
    description: "Baseline rollup preset for standard application workloads.",
    modules: {
      bridge: true,
      blockExplorer: true,
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
      crossTrade: true,   // UI-01: DeFi has crossTrade
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
      "crossTrade.enabled": true,   // UI-01: DeFi has crossTrade
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
      crossTrade: false,   // UI-02: Gaming has no crossTrade
      uptimeService: true,
      drb: true,
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
      "crossTrade.enabled": false,   // UI-02: Gaming has no crossTrade
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
      drb: true,
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
    ],
    availableFeeTokens: ["TON", "ETH", "USDT", "USDC"],
  },
];

export const MOCK_PRESET_DETAILS: Record<string, PresetDetail> = Object.fromEntries(
  MOCK_PRESETS.map((p) => [p.id, p])
);
