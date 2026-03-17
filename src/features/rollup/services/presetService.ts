import { ethers } from "ethers";
import * as bip39 from "bip39";
import { apiGet, apiPost } from "@/lib/api";
import type {
  PresetSummary,
  PresetDetail,
  FeeToken,
  DeployWithPresetRequest,
  FundingStatusResponse,
} from "../schemas/preset";
import { PRESET_UI_METADATA } from "../schemas/preset";

// Backend Definition shape (matches backend presets/types.go after JSON tag addition)
interface BackendDefinition {
  id: string;
  name: string;
  description: string;
  modules: Record<string, boolean>;
  chainDefaults: Record<string, unknown>;
  overridableFields: string[];
  availableFeeTokens: string[];
}

function transformToPresetSummary(def: BackendDefinition): PresetSummary {
  const meta = PRESET_UI_METADATA[def.id] ?? { icon: "layers", recommendedFor: [] };
  return {
    id: def.id,
    key: def.id as PresetSummary["key"],
    name: def.name,
    description: def.description,
    icon: meta.icon,
    recommendedFor: meta.recommendedFor,
    defaultFeeToken: (def.availableFeeTokens?.[0] ?? "TON") as FeeToken,
  };
}

function transformToPresetDetail(def: BackendDefinition): PresetDetail {
  const meta = PRESET_UI_METADATA[def.id] ?? { icon: "layers", recommendedFor: [] };
  const cd = def.chainDefaults;
  return {
    id: def.id,
    key: def.id as PresetDetail["key"],
    name: def.name,
    description: def.description,
    icon: meta.icon,
    recommendedFor: meta.recommendedFor,
    defaults: {
      l2BlockTime: Number(cd.l2BlockTime ?? 2),
      batchSubmissionFrequency: Number(cd.batchSubmissionFrequency ?? 1800),
      outputRootFrequency: Number(cd.outputRootFrequency ?? 1800),
      challengePeriod: Number(cd.challengePeriod ?? 86400),
      enableBackup: Boolean(cd.backupEnabled ?? false),
      registerCandidateDefault: Boolean(cd.registerCandidate ?? false),
      feeToken: (def.availableFeeTokens?.[0] ?? "TON") as FeeToken,
    },
    editableFields: def.overridableFields ?? [],
    modules: def.modules,
  };
}

export const getPresets = async (): Promise<PresetSummary[]> => {
  const response = await apiGet<BackendDefinition[]>("stacks/thanos/presets");
  return response.data.map(transformToPresetSummary);
};

export const getPresetDetail = async (id: string): Promise<PresetDetail> => {
  const response = await apiGet<BackendDefinition>(`stacks/thanos/presets/${id}`);
  return transformToPresetDetail(response.data);
};

async function deriveAccountAddresses(seedPhraseWords: string[]): Promise<string[]> {
  const mnemonic = seedPhraseWords.filter(Boolean).join(" ").trim();
  if (!bip39.validateMnemonic(mnemonic)) {
    throw new Error("Invalid seed phrase. Please check your words and try again.");
  }
  const seed = await bip39.mnemonicToSeed(mnemonic);
  const node = ethers.HDNodeWallet.fromSeed(seed);
  // Standard OP stack account derivation: admin=0, sequencer=1, batcher=2, proposer=3
  return [0, 1, 2, 3].map((i) => node.derivePath(`m/44'/60'/0'/0/${i}`).address);
}

export const startPresetDeployment = async (
  request: DeployWithPresetRequest
): Promise<{ deploymentId: string }> => {
  const seedWords = request.seedPhrase
    ? Array.isArray(request.seedPhrase)
      ? (request.seedPhrase as string[])
      : (request.seedPhrase as string).split(" ")
    : [];

  const accounts = await deriveAccountAddresses(seedWords);
  const [adminAccount, sequencerAccount, batcherAccount, proposerAccount] = accounts;

  // Fetch preset details to get chain defaults
  const preset = await getPresetDetail(request.presetId);

  // Apply overrides on top of preset defaults
  const defaults = { ...preset.defaults } as Record<string, unknown>;
  for (const override of request.overrides ?? []) {
    defaults[override.field] = override.value;
  }

  const network = request.network === "mainnet" ? "Mainnet" : "Testnet";

  const deployRequest = {
    network,
    l1RpcUrl: request.l1RpcUrl,
    l1BeaconUrl: request.l1BeaconUrl,
    l2BlockTime: Number(defaults.l2BlockTime),
    batchSubmissionFrequency: Number(defaults.batchSubmissionFrequency),
    outputRootFrequency: Number(defaults.outputRootFrequency),
    challengePeriod: Number(defaults.challengePeriod),
    adminAccount,
    sequencerAccount,
    batcherAccount,
    proposerAccount,
    awsAccessKey: request.awsAccessKey,
    awsSecretAccessKey: request.awsSecretKey,
    awsRegion: request.awsRegion,
    chainName: request.chainName,
    presetId: request.presetId,
    feeToken: request.feeToken,
    seedPhrase: seedWords.join(" "),
    registerCandidate: Boolean(defaults.registerCandidateDefault),
    backupConfig: {
      enabled: Boolean(defaults.enableBackup),
    },
  };

  const response = await apiPost<{ stackId: string }>("stacks/thanos", deployRequest, {
    timeout: 30000,
  });

  return { deploymentId: response.data.stackId };
};

export const getFundingStatus = async (
  deploymentId: string
): Promise<FundingStatusResponse> => {
  const response = await apiGet<FundingStatusResponse>(
    `stacks/thanos/preset-deploy/${deploymentId}/funding`
  );
  return response.data;
};
