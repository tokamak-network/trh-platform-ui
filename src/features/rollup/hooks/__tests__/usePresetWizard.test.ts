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
  // RED: 현재 PRESET_STEPS.length === 3 → 실패해야 함
  it("has exactly 2 steps", () => {
    expect(PRESET_STEPS).toHaveLength(2);
  });

  it("first step is preset selection", () => {
    expect(PRESET_STEPS[0].id).toBeDefined();
  });

  it("second step is credentials/basic info", () => {
    expect(PRESET_STEPS[1]).toBeDefined();
  });
});

describe("usePresetWizard — handleDeploy payload", () => {
  const generalPreset = MOCK_PRESETS[0];

  beforeEach(() => {
    mockStartPresetDeployment.mockClear();
  });

  it("deploy payload contains exactly the 5 required fields", async () => {
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
      result.current.form.setValue("presetBasicInfo.awsAccessKey", "AKIAIOSFODNN7EXAMPLE");
      result.current.form.setValue("presetBasicInfo.awsSecretKey", "secretkey123");
    });

    // Deploy 트리거
    await act(async () => {
      await result.current.handleDeploy();
    });

    expect(mockStartPresetDeployment).toHaveBeenCalledOnce();

    const calledWith = mockStartPresetDeployment.mock.calls[0][0];

    // 5 필드가 있어야 함
    expect(calledWith.presetId).toBe(generalPreset.id);
    expect(calledWith.chainName).toBe("my-chain");
    expect(calledWith.network).toBe("Testnet");
    expect(calledWith.awsAccessKey).toBe("AKIAIOSFODNN7EXAMPLE");
    expect(calledWith.awsSecretKey).toBe("secretkey123");
  });

  it("deploy payload does NOT contain seedPhrase", async () => {
    const { result } = renderHook(() => usePresetWizard(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.handleSelectPreset(generalPreset);
      result.current.form.setValue("presetBasicInfo.chainName", "my-chain");
      result.current.form.setValue("presetBasicInfo.network", "Testnet");
      result.current.form.setValue("presetBasicInfo.awsAccessKey", "AKIAIOSFODNN7EXAMPLE");
      result.current.form.setValue("presetBasicInfo.awsSecretKey", "secretkey123");
    });

    await act(async () => {
      await result.current.handleDeploy();
    });

    const calledWith = mockStartPresetDeployment.mock.calls[0][0];
    expect(calledWith.seedPhrase).toBeUndefined();
  });

  it("deploy payload does NOT contain l1RpcUrl", async () => {
    const { result } = renderHook(() => usePresetWizard(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.handleSelectPreset(generalPreset);
      result.current.form.setValue("presetBasicInfo.chainName", "my-chain");
      result.current.form.setValue("presetBasicInfo.network", "Testnet");
      result.current.form.setValue("presetBasicInfo.awsAccessKey", "AKIAIOSFODNN7EXAMPLE");
      result.current.form.setValue("presetBasicInfo.awsSecretKey", "secretkey123");
    });

    await act(async () => {
      await result.current.handleDeploy();
    });

    const calledWith = mockStartPresetDeployment.mock.calls[0][0];
    expect(calledWith.l1RpcUrl).toBeUndefined();
  });

  it("deploy payload does NOT contain feeToken", async () => {
    const { result } = renderHook(() => usePresetWizard(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.handleSelectPreset(generalPreset);
      result.current.form.setValue("presetBasicInfo.chainName", "my-chain");
      result.current.form.setValue("presetBasicInfo.network", "Testnet");
      result.current.form.setValue("presetBasicInfo.awsAccessKey", "AKIAIOSFODNN7EXAMPLE");
      result.current.form.setValue("presetBasicInfo.awsSecretKey", "secretkey123");
    });

    await act(async () => {
      await result.current.handleDeploy();
    });

    const calledWith = mockStartPresetDeployment.mock.calls[0][0];
    expect(calledWith.feeToken).toBeUndefined();
  });
});
