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

const USE_MOCK = true; // Toggle to false when backend is ready

export const getPresets = async (): Promise<PresetSummary[]> => {
  if (USE_MOCK) {
    return MOCK_PRESETS;
  }
  const response = await apiGet<{ presets: PresetSummary[] }>("stacks/thanos/presets");
  return response.data.presets;
};

export const getPresetDetail = async (id: string): Promise<PresetDetail> => {
  if (USE_MOCK) {
    const detail = MOCK_PRESET_DETAILS[id];
    if (!detail) throw new Error(`Preset not found: ${id}`);
    return detail;
  }
  const response = await apiGet<{ preset: PresetDetail }>(`stacks/thanos/presets/${id}`);
  return response.data.preset;
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
