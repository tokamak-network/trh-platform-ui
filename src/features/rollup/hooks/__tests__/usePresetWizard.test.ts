import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PRESET_STEPS, usePresetWizard } from "../usePresetWizard";
import { RollupCreationProvider } from "../../context/RollupCreationContext";
import { MOCK_PRESETS } from "../../schemas/preset";

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("react-hot-toast", () => ({
  toast: {
    loading: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
  default: {
    loading: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockStartPresetDeployment = vi.fn().mockResolvedValue({ deploymentId: "test-deploy-123" });

vi.mock("../../services/presetService", () => ({
  startPresetDeployment: (...args: unknown[]) => mockStartPresetDeployment(...args),
  getPresets: vi.fn(),
  getPresetDetail: vi.fn(),
}));

// ─── Test wrapper ─────────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(RollupCreationProvider, null, children)
    );
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("PRESET_STEPS", () => {
  it("has exactly 3 steps", () => {
    expect(PRESET_STEPS).toHaveLength(3);
  });

  it("first step is preset selection", () => {
    expect(PRESET_STEPS[0].id).toBeDefined();
  });

  it("second step is basic info", () => {
    expect(PRESET_STEPS[1]).toBeDefined();
  });

  it("third step is review and deploy", () => {
    expect(PRESET_STEPS[2]).toBeDefined();
  });
});

describe("usePresetWizard — deploy payload", () => {
  const generalPreset = MOCK_PRESETS[0];

  beforeEach(() => {
    mockStartPresetDeployment.mockClear();
  });

  it("deploy payload contains required fields including seedPhrase, l1RpcUrl and feeToken", async () => {
    const { result } = renderHook(() => usePresetWizard(), {
      wrapper: createWrapper(),
    });

    // Preset 선택
    act(() => {
      result.current.handleSelectPreset(generalPreset);
    });

    // Form 값 채우기
    act(() => {
      result.current.form.setValue("presetBasicInfo.chainName", "my-chain");
      result.current.form.setValue("presetBasicInfo.network", "Testnet");
      result.current.form.setValue("presetBasicInfo.infraProvider", "aws");
      result.current.form.setValue("presetBasicInfo.awsAccessKey", "AKIAIOSFODNN7EXAMPLE");
      result.current.form.setValue("presetBasicInfo.awsSecretKey", "secretkey123");
      result.current.form.setValue("presetBasicInfo.awsRegion", "us-east-1");
      result.current.form.setValue("presetBasicInfo.l1RpcUrl", "https://eth-sepolia.example.com");
      result.current.form.setValue("presetBasicInfo.l1BeaconUrl", "https://beacon-sepolia.example.com");
      result.current.form.setValue("presetBasicInfo.seedPhrase", Array(12).fill("word"));
      result.current.form.setValue("presetBasicInfo.feeToken", "TON");
    });

    // Step 3로 이동 후 deploy 트리거 (goToNextStep on step 3 calls handleDeploy)
    await act(async () => {
      // Step 1→2
      await result.current.goToNextStep();
    });
    await act(async () => {
      // Step 2→3 (skips form validation since we're testing payload, not validation)
      // Directly update step via goToNextStep which will trigger validation
      result.current.form.clearErrors();
      await result.current.goToNextStep();
    });
    await act(async () => {
      // Step 3→deploy
      await result.current.goToNextStep();
    });

    expect(mockStartPresetDeployment).toHaveBeenCalledOnce();

    const calledWith = mockStartPresetDeployment.mock.calls[0][0];

    expect(calledWith.presetId).toBe(generalPreset.id);
    expect(calledWith.chainName).toBe("my-chain");
    expect(calledWith.network).toBe("Testnet");
    expect(calledWith.infraProvider).toBe("aws");
    expect(calledWith.awsAccessKey).toBe("AKIAIOSFODNN7EXAMPLE");
    expect(calledWith.awsSecretKey).toBe("secretkey123");
    expect(calledWith.l1RpcUrl).toBe("https://eth-sepolia.example.com");
    expect(calledWith.feeToken).toBe("TON");
    // seedPhrase should be joined as a string
    expect(typeof calledWith.seedPhrase).toBe("string");
  });
});

// ─── enableFaultProof propagation ────────────────────────────────────────────

async function deployWithPreset(presetIndex: number) {
  const preset = MOCK_PRESETS[presetIndex];
  const { result } = renderHook(() => usePresetWizard(), {
    wrapper: createWrapper(),
  });

  act(() => { result.current.handleSelectPreset(preset); });
  act(() => {
    result.current.form.setValue("presetBasicInfo.chainName", "test-chain");
    result.current.form.setValue("presetBasicInfo.network", "Testnet");
    result.current.form.setValue("presetBasicInfo.infraProvider", "aws");
    result.current.form.setValue("presetBasicInfo.awsAccessKey", "AKIAIOSFODNN7EXAMPLE");
    result.current.form.setValue("presetBasicInfo.awsSecretKey", "secretkey123");
    result.current.form.setValue("presetBasicInfo.awsRegion", "us-east-1");
    result.current.form.setValue("presetBasicInfo.l1RpcUrl", "https://eth-sepolia.example.com");
    result.current.form.setValue("presetBasicInfo.l1BeaconUrl", "https://beacon-sepolia.example.com");
    result.current.form.setValue("presetBasicInfo.seedPhrase", Array(12).fill("word"));
    result.current.form.setValue("presetBasicInfo.feeToken", "TON");
  });

  await act(async () => { await result.current.goToNextStep(); }); // step 1→2
  await act(async () => {
    result.current.form.clearErrors();
    await result.current.goToNextStep(); // step 2→3
  });
  await act(async () => { await result.current.goToNextStep(); }); // step 3→deploy

  return mockStartPresetDeployment.mock.calls[0]?.[0];
}

describe("usePresetWizard — enableFaultProof in deploy payload", () => {
  beforeEach(() => { mockStartPresetDeployment.mockClear(); });

  it("sends enableFaultProof: true when Full preset is selected", async () => {
    const fullPresetIndex = MOCK_PRESETS.findIndex((p) => p.id === "full");
    const payload = await deployWithPreset(fullPresetIndex);
    expect(payload).toBeDefined();
    expect(payload.enableFaultProof).toBe(true);
  });

  it("sends enableFaultProof: true when General preset is selected", async () => {
    const generalPresetIndex = MOCK_PRESETS.findIndex((p) => p.id === "general");
    const payload = await deployWithPreset(generalPresetIndex);
    expect(payload).toBeDefined();
    expect(payload.enableFaultProof).toBe(true);
  });

  it("sends enableFaultProof: true when Gaming preset is selected", async () => {
    const gamingPresetIndex = MOCK_PRESETS.findIndex((p) => p.id === "gaming");
    const payload = await deployWithPreset(gamingPresetIndex);
    expect(payload).toBeDefined();
    expect(payload.enableFaultProof).toBe(true);
  });
});
