import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { CHAIN_NETWORK } from "../../const";

// ---------------------------------------------------------------------------
// Mocks — must be before import of the hook
// ---------------------------------------------------------------------------

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockUpdateFormData = vi.fn();
const mockUpdateCurrentStep = vi.fn();
const mockResetState = vi.fn();
let mockCurrentStep = 1;

vi.mock("../../context/RollupCreationContext", () => ({
  useRollupCreationContext: () => ({
    state: {
      formData: null,
      currentStep: mockCurrentStep,
      hasUnsavedChanges: false,
    },
    updateFormData: mockUpdateFormData,
    updateCurrentStep: mockUpdateCurrentStep,
    resetState: mockResetState,
    setHasUnsavedChanges: vi.fn(),
  }),
  defaultFormData: {
    networkAndChain: {
      network: "",
      chainName: "",
      l1RpcUrl: "",
      l1BeaconUrl: "",
      advancedConfig: false,
      l2BlockTime: "2",
      batchSubmissionFreq: "1440",
      outputRootFreq: "240",
      challengePeriod: "12",
      reuseDeployment: true,
      enableBackup: false,
    },
    accountAndAws: {
      seedPhrase: Array(12).fill(""),
      adminAccount: "",
      adminPrivateKey: "",
      proposerAccount: "",
      proposerPrivateKey: "",
      batchAccount: "",
      batchPrivateKey: "",
      sequencerAccount: "",
      sequencerPrivateKey: "",
      accountName: "",
      credentialId: "",
      awsAccessKey: "",
      awsSecretKey: "",
      awsRegion: "",
    },
    daoCandidate: undefined,
    confirmation: { agreedToMainnetRisks: false },
  },
}));

const mockMutateAsync = vi.fn();
vi.mock("../../api", () => ({
  useDeployRollupMutation: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

vi.mock("react-hot-toast", () => ({
  toast: {
    loading: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    dismiss: vi.fn(),
  },
}));

const mockGetNetwork = vi.fn();
vi.mock("ethers", () => ({
  ethers: {
    JsonRpcProvider: class MockJsonRpcProvider {
      getNetwork = mockGetNetwork;
    },
  },
}));

// Import after mocks
import { useCreateRollup, STEPS } from "../useCreateRollup";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useCreateRollup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCurrentStep = 1;
  });

  it("returns expected shape", () => {
    const { result } = renderHook(() => useCreateRollup());

    expect(result.current.form).toBeDefined();
    expect(result.current.currentStep).toBe(1);
    expect(result.current.steps).toEqual(STEPS);
    expect(typeof result.current.goToNextStep).toBe("function");
    expect(typeof result.current.goToPreviousStep).toBe("function");
    expect(typeof result.current.onBack).toBe("function");
    expect(result.current.isDeploying).toBe(false);
  });

  it("has 4 steps", () => {
    expect(STEPS).toHaveLength(4);
    expect(STEPS.map((s) => s.id)).toEqual([1, 2, 3, 4]);
  });

  describe("progress", () => {
    it.each([
      [1, 25],
      [2, 50],
      [3, 75],
      [4, 100],
    ])("step %i gives %i%% progress", (step, expected) => {
      mockCurrentStep = step;
      const { result } = renderHook(() => useCreateRollup());
      expect(result.current.progress).toBe(expected);
    });
  });

  describe("onBack", () => {
    it("navigates to /rollup", () => {
      const { result } = renderHook(() => useCreateRollup());
      result.current.onBack();
      expect(mockPush).toHaveBeenCalledWith("/rollup");
    });
  });

  describe("goToPreviousStep", () => {
    it("decrements step when above 1", () => {
      mockCurrentStep = 2;
      const { result } = renderHook(() => useCreateRollup());
      result.current.goToPreviousStep();
      expect(mockUpdateCurrentStep).toHaveBeenCalledWith(1);
    });

    it("does not go below step 1", () => {
      mockCurrentStep = 1;
      const { result } = renderHook(() => useCreateRollup());
      result.current.goToPreviousStep();
      expect(mockUpdateCurrentStep).not.toHaveBeenCalled();
    });
  });

  describe("goToNextStep — step 1 validation", () => {
    it("validates network and chainName for all networks", async () => {
      const { result } = renderHook(() => useCreateRollup());

      // Set minimal valid testnet data
      result.current.form.setValue(
        "networkAndChain.network",
        CHAIN_NETWORK.TESTNET
      );
      result.current.form.setValue("networkAndChain.chainName", "TestChain");
      result.current.form.setValue(
        "networkAndChain.l1RpcUrl",
        "https://rpc.example.com"
      );
      result.current.form.setValue(
        "networkAndChain.l1BeaconUrl",
        "https://beacon.example.com"
      );

      // The RPC check will fail (ethers mock), but trigger() should pass
      // We just verify the form fields are validated
      const triggerSpy = vi.spyOn(result.current.form, "trigger");
      await act(async () => {
        await result.current.goToNextStep();
      });

      expect(triggerSpy).toHaveBeenCalled();
    });

    it("validates kubeconfigPath for local testnet", async () => {
      const { result } = renderHook(() => useCreateRollup());

      result.current.form.setValue(
        "networkAndChain.network",
        CHAIN_NETWORK.LOCAL_TESTNET
      );
      result.current.form.setValue("networkAndChain.chainName", "LocalChain");
      result.current.form.setValue(
        "networkAndChain.kubeconfigPath",
        "/home/user/.kube/config"
      );
      // Need valid L1 URLs for schema (even though unused for local)
      result.current.form.setValue(
        "networkAndChain.l1RpcUrl",
        "https://rpc.example.com"
      );
      result.current.form.setValue(
        "networkAndChain.l1BeaconUrl",
        "https://beacon.example.com"
      );

      await act(async () => {
        await result.current.goToNextStep();
      });

      // Local testnet should skip RPC check and go to next step
      expect(mockUpdateCurrentStep).toHaveBeenCalledWith(2);
    });

    it("blocks step transition when kubeconfigPath is missing for local", async () => {
      const { result } = renderHook(() => useCreateRollup());

      result.current.form.setValue(
        "networkAndChain.network",
        CHAIN_NETWORK.LOCAL_TESTNET
      );
      result.current.form.setValue("networkAndChain.chainName", "LocalChain");
      result.current.form.setValue(
        "networkAndChain.l1RpcUrl",
        "https://rpc.example.com"
      );
      result.current.form.setValue(
        "networkAndChain.l1BeaconUrl",
        "https://beacon.example.com"
      );
      // kubeconfigPath not set

      await act(async () => {
        await result.current.goToNextStep();
      });

      expect(mockUpdateCurrentStep).not.toHaveBeenCalled();
    });
  });

  describe("goToNextStep — step 2 validation", () => {
    beforeEach(() => {
      mockCurrentStep = 2;
    });

    it("skips AWS fields for local testnet", async () => {
      const { result } = renderHook(() => useCreateRollup());
      const triggerSpy = vi.spyOn(result.current.form, "trigger");

      result.current.form.setValue(
        "networkAndChain.network",
        CHAIN_NETWORK.LOCAL_TESTNET
      );

      await act(async () => {
        await result.current.goToNextStep();
      });

      // Check that trigger was called and AWS fields were NOT included
      const triggerArgs = triggerSpy.mock.calls[0]?.[0] as string[] | undefined;
      expect(triggerArgs).toBeDefined();
      expect(triggerArgs).not.toContain("accountAndAws.awsAccessKey");
      expect(triggerArgs).not.toContain("accountAndAws.awsSecretKey");
      expect(triggerArgs).not.toContain("accountAndAws.awsRegion");
      expect(triggerArgs).not.toContain("accountAndAws.accountName");
      expect(triggerArgs).not.toContain("accountAndAws.credentialId");
    });

    it("includes AWS fields for testnet", async () => {
      const { result } = renderHook(() => useCreateRollup());
      const triggerSpy = vi.spyOn(result.current.form, "trigger");

      result.current.form.setValue(
        "networkAndChain.network",
        CHAIN_NETWORK.TESTNET
      );

      await act(async () => {
        await result.current.goToNextStep();
      });

      const triggerArgs = triggerSpy.mock.calls[0]?.[0] as string[] | undefined;
      expect(triggerArgs).toBeDefined();
      expect(triggerArgs).toContain("accountAndAws.awsAccessKey");
      expect(triggerArgs).toContain("accountAndAws.awsSecretKey");
      expect(triggerArgs).toContain("accountAndAws.awsRegion");
    });
  });

  describe("goToNextStep — step 3 DAO candidate", () => {
    beforeEach(() => {
      mockCurrentStep = 3;
    });

    it("auto-skips DAO step for local testnet", async () => {
      const { result } = renderHook(() => useCreateRollup());
      const setValueSpy = vi.spyOn(result.current.form, "setValue");

      result.current.form.setValue(
        "networkAndChain.network",
        CHAIN_NETWORK.LOCAL_TESTNET
      );

      await act(async () => {
        await result.current.goToNextStep();
      });

      expect(setValueSpy).toHaveBeenCalledWith("daoCandidate", undefined);
      expect(mockUpdateCurrentStep).toHaveBeenCalledWith(4);
    });

    it("does not auto-skip DAO step for testnet", async () => {
      const { result } = renderHook(() => useCreateRollup());
      const setValueSpy = vi.spyOn(result.current.form, "setValue");

      result.current.form.setValue(
        "networkAndChain.network",
        CHAIN_NETWORK.TESTNET
      );

      await act(async () => {
        await result.current.goToNextStep();
      });

      // Should not force daoCandidate to undefined
      const daoCandidateCalls = setValueSpy.mock.calls.filter(
        (call) => call[0] === "daoCandidate" && call[1] === undefined
      );
      expect(daoCandidateCalls).toHaveLength(0);
    });
  });

  describe("handleDeployRollup", () => {
    it("skips validation for local testnet", async () => {
      mockCurrentStep = 4;
      const { result } = renderHook(() => useCreateRollup());

      result.current.form.setValue(
        "networkAndChain.network",
        CHAIN_NETWORK.LOCAL_TESTNET
      );

      await act(async () => {
        await result.current.handleDeployRollup();
      });

      // Should call mutateAsync directly without validation toast
      expect(mockMutateAsync).toHaveBeenCalled();
    });

    it("calls validateAndEstimateDeployment for non-local testnet", async () => {
      mockCurrentStep = 4;
      const { result } = renderHook(() => useCreateRollup());

      result.current.form.setValue(
        "networkAndChain.network",
        CHAIN_NETWORK.TESTNET
      );

      // trigger() returns false → validation fails → mutateAsync should NOT be called
      vi.spyOn(result.current.form, "trigger").mockResolvedValue(false);

      await act(async () => {
        await result.current.handleDeployRollup();
      });

      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it("handles deploy mutation failure gracefully", async () => {
      mockCurrentStep = 4;
      const { result } = renderHook(() => useCreateRollup());

      result.current.form.setValue(
        "networkAndChain.network",
        CHAIN_NETWORK.LOCAL_TESTNET
      );

      mockMutateAsync.mockRejectedValue(new Error("Deploy failed"));

      await act(async () => {
        await result.current.handleDeployRollup().catch(() => {});
      });

      expect(mockMutateAsync).toHaveBeenCalled();
    });
  });

  describe("progress — default case", () => {
    it("returns 0 for invalid step", () => {
      mockCurrentStep = 99;
      const { result } = renderHook(() => useCreateRollup());
      expect(result.current.progress).toBe(0);
    });
  });

  describe("goToNextStep — step 4 (last step)", () => {
    beforeEach(() => {
      mockCurrentStep = 4;
    });

    it("shows checklist for mainnet when form is valid", async () => {
      const { result } = renderHook(() => useCreateRollup());

      result.current.form.setValue(
        "networkAndChain.network",
        "mainnet"
      );

      // Make trigger pass
      vi.spyOn(result.current.form, "trigger").mockResolvedValue(true);

      await act(async () => {
        await result.current.goToNextStep();
      });

      // Should show checklist, NOT deploy
      expect(result.current.showChecklist).toBe(true);
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it("does not show checklist for mainnet when form is invalid", async () => {
      const { result } = renderHook(() => useCreateRollup());

      result.current.form.setValue(
        "networkAndChain.network",
        "mainnet"
      );

      vi.spyOn(result.current.form, "trigger").mockResolvedValue(false);

      await act(async () => {
        await result.current.goToNextStep();
      });

      expect(result.current.showChecklist).toBe(false);
    });

    it("deploys directly for testnet on step 4", async () => {
      const { result } = renderHook(() => useCreateRollup());

      result.current.form.setValue(
        "networkAndChain.network",
        CHAIN_NETWORK.TESTNET
      );

      // validateAndEstimateDeployment will fail (trigger returns false)
      vi.spyOn(result.current.form, "trigger").mockResolvedValue(false);

      await act(async () => {
        await result.current.goToNextStep();
      });

      // Should attempt deploy (handleDeployRollup), not show checklist
      expect(result.current.showChecklist).toBe(false);
    });
  });

  describe("goToNextStep — step 3 DAO candidate with data", () => {
    beforeEach(() => {
      mockCurrentStep = 3;
    });

    it("validates DAO fields when daoCandidate is set", async () => {
      const { result } = renderHook(() => useCreateRollup());
      const triggerSpy = vi.spyOn(result.current.form, "trigger");

      result.current.form.setValue(
        "networkAndChain.network",
        CHAIN_NETWORK.TESTNET
      );
      result.current.form.setValue("daoCandidate", {
        amount: "100",
        memo: "test",
        nameInfo: "test-dao",
      });

      triggerSpy.mockResolvedValue(true);

      await act(async () => {
        await result.current.goToNextStep();
      });

      const triggerArgs = triggerSpy.mock.calls[0]?.[0] as string[] | undefined;
      expect(triggerArgs).toBeDefined();
      expect(triggerArgs).toContain("daoCandidate.amount");
      expect(triggerArgs).toContain("daoCandidate.memo");
      expect(triggerArgs).toContain("daoCandidate.nameInfo");
    });

    it("skips DAO validation when daoCandidate is undefined", async () => {
      const { result } = renderHook(() => useCreateRollup());

      result.current.form.setValue(
        "networkAndChain.network",
        CHAIN_NETWORK.TESTNET
      );
      // daoCandidate stays undefined (default)

      await act(async () => {
        await result.current.goToNextStep();
      });

      // Should proceed to step 4 since isValid = true for no daoCandidate
      expect(mockUpdateCurrentStep).toHaveBeenCalledWith(4);
    });
  });

  describe("goToNextStep — step 1 advanced config", () => {
    it("validates advanced fields when advancedConfig is enabled", async () => {
      const { result } = renderHook(() => useCreateRollup());
      const triggerSpy = vi.spyOn(result.current.form, "trigger");

      result.current.form.setValue(
        "networkAndChain.network",
        CHAIN_NETWORK.TESTNET
      );
      result.current.form.setValue("networkAndChain.chainName", "TestChain");
      result.current.form.setValue(
        "networkAndChain.l1RpcUrl",
        "https://rpc.example.com"
      );
      result.current.form.setValue(
        "networkAndChain.l1BeaconUrl",
        "https://beacon.example.com"
      );
      result.current.form.setValue("networkAndChain.advancedConfig", true);

      await act(async () => {
        await result.current.goToNextStep();
      });

      const triggerArgs = triggerSpy.mock.calls[0]?.[0] as string[] | undefined;
      expect(triggerArgs).toBeDefined();
      expect(triggerArgs).toContain("networkAndChain.l2BlockTime");
      expect(triggerArgs).toContain("networkAndChain.batchSubmissionFreq");
      expect(triggerArgs).toContain("networkAndChain.outputRootFreq");
      expect(triggerArgs).toContain("networkAndChain.challengePeriod");
    });
  });

  describe("goToNextStep — step 1 RPC validation", () => {
    it("proceeds when RPC returns correct chainId for testnet (Sepolia)", async () => {
      const { result } = renderHook(() => useCreateRollup());

      result.current.form.setValue(
        "networkAndChain.network",
        CHAIN_NETWORK.TESTNET
      );
      result.current.form.setValue("networkAndChain.chainName", "TestChain");
      result.current.form.setValue(
        "networkAndChain.l1RpcUrl",
        "https://rpc.example.com"
      );
      result.current.form.setValue(
        "networkAndChain.l1BeaconUrl",
        "https://beacon.example.com"
      );

      mockGetNetwork.mockResolvedValue({ chainId: BigInt(11155111) });

      await act(async () => {
        await result.current.goToNextStep();
      });

      expect(mockUpdateCurrentStep).toHaveBeenCalledWith(2);
    });

    it("blocks when RPC returns wrong chainId for testnet", async () => {
      const { result } = renderHook(() => useCreateRollup());

      result.current.form.setValue(
        "networkAndChain.network",
        CHAIN_NETWORK.TESTNET
      );
      result.current.form.setValue("networkAndChain.chainName", "TestChain");
      result.current.form.setValue(
        "networkAndChain.l1RpcUrl",
        "https://rpc.example.com"
      );
      result.current.form.setValue(
        "networkAndChain.l1BeaconUrl",
        "https://beacon.example.com"
      );

      // Return mainnet chainId for testnet network — mismatch
      mockGetNetwork.mockResolvedValue({ chainId: BigInt(1) });

      await act(async () => {
        await result.current.goToNextStep();
      });

      expect(mockUpdateCurrentStep).not.toHaveBeenCalled();
    });

    it("proceeds when RPC returns chainId 1 for mainnet", async () => {
      const { result } = renderHook(() => useCreateRollup());

      result.current.form.setValue("networkAndChain.network", "mainnet");
      result.current.form.setValue("networkAndChain.chainName", "MainChain");
      result.current.form.setValue(
        "networkAndChain.l1RpcUrl",
        "https://mainnet-rpc.example.com"
      );
      result.current.form.setValue(
        "networkAndChain.l1BeaconUrl",
        "https://mainnet-beacon.example.com"
      );

      mockGetNetwork.mockResolvedValue({ chainId: BigInt(1) });

      await act(async () => {
        await result.current.goToNextStep();
      });

      expect(mockUpdateCurrentStep).toHaveBeenCalledWith(2);
    });

    it("blocks when RPC connection fails with NETWORK_ERROR", async () => {
      const { result } = renderHook(() => useCreateRollup());

      result.current.form.setValue(
        "networkAndChain.network",
        CHAIN_NETWORK.TESTNET
      );
      result.current.form.setValue("networkAndChain.chainName", "TestChain");
      result.current.form.setValue(
        "networkAndChain.l1RpcUrl",
        "https://rpc.example.com"
      );
      result.current.form.setValue(
        "networkAndChain.l1BeaconUrl",
        "https://beacon.example.com"
      );

      const networkError = new Error("Connection refused");
      (networkError as unknown as { code: string }).code = "NETWORK_ERROR";
      mockGetNetwork.mockRejectedValue(networkError);

      await act(async () => {
        await result.current.goToNextStep();
      });

      expect(mockUpdateCurrentStep).not.toHaveBeenCalled();
    });
  });

  describe("showChecklist and setShowChecklist", () => {
    it("showChecklist defaults to false", () => {
      const { result } = renderHook(() => useCreateRollup());
      expect(result.current.showChecklist).toBe(false);
    });

    it("setShowChecklist updates the value", () => {
      const { result } = renderHook(() => useCreateRollup());
      act(() => {
        result.current.setShowChecklist(true);
      });
      expect(result.current.showChecklist).toBe(true);
    });
  });
});
