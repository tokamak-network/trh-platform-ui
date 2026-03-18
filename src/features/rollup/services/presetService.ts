import { apiGet, apiPost } from "@/lib/api";
import type {
  PresetSummary,
  PresetDetail,
  FundingStatusResponse,
  DeployWithPresetRequest,
} from "../schemas/preset";
import {
  MOCK_PRESETS,
  MOCK_PRESET_DETAILS,
} from "../schemas/preset";

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export const getPresets = async (): Promise<PresetSummary[]> => {
  if (USE_MOCK) {
    return MOCK_PRESETS;
  }
  const response = await apiGet<PresetSummary[]>("stacks/thanos/presets");
  // TODO: Validate response against presetListResponseSchema (z.array(presetDefinitionSchema))
  // to catch backend schema drift at runtime. Currently relies on TypeScript generics only.
  return response.data;
};

export const getPresetDetail = async (id: string): Promise<PresetDetail> => {
  if (USE_MOCK) {
    const detail = MOCK_PRESET_DETAILS[id];
    if (!detail) throw new Error(`Preset not found: ${id}`);
    return detail;
  }
  const response = await apiGet<PresetDetail>(`stacks/thanos/presets/${id}`);
  // TODO: Validate response against presetDefinitionSchema to catch backend schema drift at runtime.
  return response.data;
};

export const startPresetDeployment = async (
  request: DeployWithPresetRequest
): Promise<{ deploymentId: string }> => {
  const response = await apiPost<{ deploymentId: string }>(
    "stacks/thanos/preset-deploy",
    request
  );
  return response.data;
};

export const getFundingStatus = async (
  deploymentId: string
): Promise<FundingStatusResponse> => {
  const response = await apiGet<FundingStatusResponse>(
    `stacks/thanos/preset-deploy/${deploymentId}/funding`
  );
  return response.data;
};
