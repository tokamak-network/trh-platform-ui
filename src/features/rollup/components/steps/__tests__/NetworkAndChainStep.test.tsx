import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NetworkAndChainStep } from "../NetworkAndChainStep";
import {
  createFormWrapper,
  testnetFormData,
  localTestnetFormData,
  mainnetFormData,
} from "../../../test-utils";

// Mock RPCSelector — it has complex internal state we don't need to test here
vi.mock("@/components/molecules", () => ({
  RPCSelector: ({
    id,
    label,
    error,
  }: {
    id: string;
    label: string;
    error?: string;
  }) => (
    <div data-testid={`rpc-selector-${id}`}>
      <label>{label}</label>
      {error && <span role="alert">{error}</span>}
    </div>
  ),
}));

// Mock useRpcUrls
vi.mock(
  "@/features/configuration/rpc-management/hooks/useRpcUrls",
  () => ({
    useRpcUrls: () => ({
      rpcUrls: [],
      addRpcUrl: vi.fn(),
    }),
  })
);

describe("NetworkAndChainStep", () => {
  describe("testnet", () => {
    it("renders L1 RPC and Beacon URL selectors", () => {
      render(<NetworkAndChainStep />, {
        wrapper: createFormWrapper(testnetFormData()),
      });

      expect(screen.getByTestId("rpc-selector-l1RpcUrl")).toBeInTheDocument();
      expect(screen.getByTestId("rpc-selector-l1BeaconUrl")).toBeInTheDocument();
    });

    it("does not render kubeconfigPath input", () => {
      render(<NetworkAndChainStep />, {
        wrapper: createFormWrapper(testnetFormData()),
      });

      expect(screen.queryByLabelText(/kubeconfig path/i)).not.toBeInTheDocument();
    });

    it("does not render local testnet info banner", () => {
      render(<NetworkAndChainStep />, {
        wrapper: createFormWrapper(testnetFormData()),
      });

      expect(
        screen.queryByText("Local Testnet Deployment")
      ).not.toBeInTheDocument();
    });

    it("shows L1 RPC URL in configuration summary", () => {
      render(<NetworkAndChainStep />, {
        wrapper: createFormWrapper(testnetFormData()),
      });

      expect(screen.getByText("L1 RPC URL:")).toBeInTheDocument();
      expect(screen.getByText("L1 Beacon URL:")).toBeInTheDocument();
    });

    it("does not show Kubeconfig in configuration summary", () => {
      render(<NetworkAndChainStep />, {
        wrapper: createFormWrapper(testnetFormData()),
      });

      expect(screen.queryByText("Kubeconfig:")).not.toBeInTheDocument();
    });
  });

  describe("local testnet", () => {
    it("does not render L1 RPC and Beacon URL selectors", () => {
      render(<NetworkAndChainStep />, {
        wrapper: createFormWrapper(localTestnetFormData()),
      });

      expect(
        screen.queryByTestId("rpc-selector-l1RpcUrl")
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("rpc-selector-l1BeaconUrl")
      ).not.toBeInTheDocument();
    });

    it("renders kubeconfigPath input", () => {
      render(<NetworkAndChainStep />, {
        wrapper: createFormWrapper(localTestnetFormData()),
      });

      expect(screen.getByLabelText(/kubeconfig path/i)).toBeInTheDocument();
    });

    it("renders local testnet info banner", () => {
      render(<NetworkAndChainStep />, {
        wrapper: createFormWrapper(localTestnetFormData()),
      });

      expect(
        screen.getByText("Local Testnet Deployment")
      ).toBeInTheDocument();
    });

    it("does not render mainnet warning", () => {
      render(<NetworkAndChainStep />, {
        wrapper: createFormWrapper(localTestnetFormData()),
      });

      expect(
        screen.queryByText("Mainnet Production Environment")
      ).not.toBeInTheDocument();
    });

    it("shows Kubeconfig in configuration summary", () => {
      render(<NetworkAndChainStep />, {
        wrapper: createFormWrapper(localTestnetFormData()),
      });

      expect(screen.getByText("Kubeconfig:")).toBeInTheDocument();
    });

    it("does not show L1 URLs in configuration summary", () => {
      render(<NetworkAndChainStep />, {
        wrapper: createFormWrapper(localTestnetFormData()),
      });

      expect(screen.queryByText("L1 RPC URL:")).not.toBeInTheDocument();
      expect(screen.queryByText("L1 Beacon URL:")).not.toBeInTheDocument();
    });
  });

  describe("advanced configuration", () => {
    it("does not show advanced settings by default", () => {
      render(<NetworkAndChainStep />, {
        wrapper: createFormWrapper(testnetFormData()),
      });

      expect(screen.queryByText("Advanced Settings")).not.toBeInTheDocument();
      expect(screen.queryByLabelText("L2 Block Time")).not.toBeInTheDocument();
    });

    it("shows advanced settings when advancedConfig is true", () => {
      const data = testnetFormData();
      data.networkAndChain.advancedConfig = true;
      data.networkAndChain.l2BlockTime = "2";
      data.networkAndChain.batchSubmissionFreq = "1440";
      data.networkAndChain.outputRootFreq = "240";
      data.networkAndChain.challengePeriod = "12";

      render(<NetworkAndChainStep />, {
        wrapper: createFormWrapper(data),
      });

      expect(screen.getByText("Advanced Settings")).toBeInTheDocument();
    });

    it("shows advanced values in configuration summary when enabled", () => {
      const data = testnetFormData();
      data.networkAndChain.advancedConfig = true;
      data.networkAndChain.l2BlockTime = "2";
      data.networkAndChain.batchSubmissionFreq = "1440";
      data.networkAndChain.outputRootFreq = "240";
      data.networkAndChain.challengePeriod = "12";

      render(<NetworkAndChainStep />, {
        wrapper: createFormWrapper(data),
      });

      expect(screen.getByText("L2 Block Time:")).toBeInTheDocument();
      expect(screen.getByText("Batch Frequency:")).toBeInTheDocument();
      expect(screen.getByText("Output Root Freq:")).toBeInTheDocument();
      expect(screen.getByText("Challenge Period:")).toBeInTheDocument();
    });

    it("does not show advanced values in summary when disabled", () => {
      render(<NetworkAndChainStep />, {
        wrapper: createFormWrapper(testnetFormData()),
      });

      expect(screen.queryByText("L2 Block Time:")).not.toBeInTheDocument();
      expect(screen.queryByText("Batch Frequency:")).not.toBeInTheDocument();
    });
  });

  describe("common elements", () => {
    it("renders chain name input", () => {
      render(<NetworkAndChainStep />, {
        wrapper: createFormWrapper(testnetFormData()),
      });

      expect(screen.getByPlaceholderText("e.g. my-l2-chain")).toBeInTheDocument();
    });

    it("renders Network & Chain heading", () => {
      render(<NetworkAndChainStep />, {
        wrapper: createFormWrapper(testnetFormData()),
      });

      expect(screen.getByText("Network & Chain")).toBeInTheDocument();
    });

    it("renders Configuration Summary section", () => {
      render(<NetworkAndChainStep />, {
        wrapper: createFormWrapper(testnetFormData()),
      });

      expect(screen.getByText("Configuration Summary")).toBeInTheDocument();
    });

    it("shows network and chain name in summary", () => {
      render(<NetworkAndChainStep />, {
        wrapper: createFormWrapper(testnetFormData()),
      });

      expect(screen.getByText("Network:")).toBeInTheDocument();
      expect(screen.getByText("Chain Name:")).toBeInTheDocument();
    });

    it("shows Show Advanced Configuration checkbox", () => {
      render(<NetworkAndChainStep />, {
        wrapper: createFormWrapper(testnetFormData()),
      });

      expect(
        screen.getByLabelText("Show Advanced Configuration")
      ).toBeInTheDocument();
    });
  });

  describe("mainnet-specific", () => {
    it("shows Reuse Existing Deployment checkbox", () => {
      const data = mainnetFormData();
      render(<NetworkAndChainStep />, {
        wrapper: createFormWrapper(data),
      });

      expect(
        screen.getByText("Reuse Existing Deployment")
      ).toBeInTheDocument();
    });

    it("does not show Reuse Existing Deployment for testnet", () => {
      render(<NetworkAndChainStep />, {
        wrapper: createFormWrapper(testnetFormData()),
      });

      expect(
        screen.queryByText("Reuse Existing Deployment")
      ).not.toBeInTheDocument();
    });

    it("shows fixed challenge period note when mainnet advanced config is on", () => {
      const data = mainnetFormData();
      data.networkAndChain.advancedConfig = true;
      data.networkAndChain.l2BlockTime = "2";
      data.networkAndChain.batchSubmissionFreq = "1440";
      data.networkAndChain.outputRootFreq = "240";
      data.networkAndChain.challengePeriod = "604800";

      render(<NetworkAndChainStep />, {
        wrapper: createFormWrapper(data),
      });

      expect(
        screen.getByText(/Fixed to 7 days.*for mainnet security/)
      ).toBeInTheDocument();
    });
  });

  describe("mainnet", () => {
    it("renders mainnet warning banner", () => {
      render(<NetworkAndChainStep />, {
        wrapper: createFormWrapper(mainnetFormData()),
      });

      expect(
        screen.getByText("Mainnet Production Environment")
      ).toBeInTheDocument();
    });

    it("renders L1 RPC and Beacon URL selectors", () => {
      render(<NetworkAndChainStep />, {
        wrapper: createFormWrapper(mainnetFormData()),
      });

      expect(screen.getByTestId("rpc-selector-l1RpcUrl")).toBeInTheDocument();
      expect(screen.getByTestId("rpc-selector-l1BeaconUrl")).toBeInTheDocument();
    });

    it("does not render kubeconfigPath input", () => {
      render(<NetworkAndChainStep />, {
        wrapper: createFormWrapper(mainnetFormData()),
      });

      expect(screen.queryByLabelText(/kubeconfig path/i)).not.toBeInTheDocument();
    });

    it("does not render local testnet info banner", () => {
      render(<NetworkAndChainStep />, {
        wrapper: createFormWrapper(mainnetFormData()),
      });

      expect(
        screen.queryByText("Local Testnet Deployment")
      ).not.toBeInTheDocument();
    });
  });

  describe("user interactions", () => {
    it("toggles advanced configuration on click", async () => {
      const user = userEvent.setup();

      render(<NetworkAndChainStep />, {
        wrapper: createFormWrapper(testnetFormData()),
      });

      // Advanced settings should not be visible
      expect(screen.queryByText("Advanced Settings")).not.toBeInTheDocument();

      // Click checkbox
      const checkbox = screen.getByLabelText("Show Advanced Configuration");
      await user.click(checkbox);

      // Advanced settings should now be visible
      expect(screen.getByText("Advanced Settings")).toBeInTheDocument();
    });

    it("toggles advanced configuration off on second click", async () => {
      const user = userEvent.setup();
      const data = testnetFormData();
      data.networkAndChain.advancedConfig = true;
      data.networkAndChain.l2BlockTime = "2";
      data.networkAndChain.batchSubmissionFreq = "1440";
      data.networkAndChain.outputRootFreq = "240";
      data.networkAndChain.challengePeriod = "12";

      render(<NetworkAndChainStep />, {
        wrapper: createFormWrapper(data),
      });

      // Advanced settings should be visible
      expect(screen.getByText("Advanced Settings")).toBeInTheDocument();

      // Click checkbox to turn off
      const checkbox = screen.getByLabelText("Show Advanced Configuration");
      await user.click(checkbox);

      // Advanced settings should be hidden
      expect(screen.queryByText("Advanced Settings")).not.toBeInTheDocument();
    });

    it("updates chain name on typing", async () => {
      const user = userEvent.setup();

      render(<NetworkAndChainStep />, {
        wrapper: createFormWrapper({
          ...testnetFormData(),
          networkAndChain: {
            ...testnetFormData().networkAndChain,
            chainName: "",
          },
        }),
      });

      const input = screen.getByPlaceholderText("e.g. my-l2-chain");
      await user.type(input, "NewChain");

      expect(input).toHaveValue("NewChain");
    });

    it("updates kubeconfig path input for local testnet", async () => {
      const user = userEvent.setup();
      const data = localTestnetFormData();
      data.networkAndChain.kubeconfigPath = "";

      render(<NetworkAndChainStep />, {
        wrapper: createFormWrapper(data),
      });

      const input = screen.getByLabelText(/kubeconfig path/i);
      await user.type(input, "/custom/kube/config");

      expect(input).toHaveValue("/custom/kube/config");
    });

    it("allows editing advanced config fields", async () => {
      const user = userEvent.setup();
      const data = testnetFormData();
      data.networkAndChain.advancedConfig = true;
      data.networkAndChain.l2BlockTime = "";
      data.networkAndChain.batchSubmissionFreq = "";
      data.networkAndChain.outputRootFreq = "";
      data.networkAndChain.challengePeriod = "";

      render(<NetworkAndChainStep />, {
        wrapper: createFormWrapper(data),
      });

      const blockTimeInput = screen.getByPlaceholderText("2");
      await user.type(blockTimeInput, "3");
      expect(blockTimeInput).toHaveValue(3);

      const batchFreqInput = screen.getByPlaceholderText("1440");
      await user.type(batchFreqInput, "720");
      expect(batchFreqInput).toHaveValue(720);

      const outputRootInput = screen.getByPlaceholderText("240");
      await user.type(outputRootInput, "120");
      expect(outputRootInput).toHaveValue(120);
    });

    it("challenge period is disabled for mainnet", () => {
      const data = mainnetFormData();
      data.networkAndChain.advancedConfig = true;
      data.networkAndChain.l2BlockTime = "2";
      data.networkAndChain.batchSubmissionFreq = "1440";
      data.networkAndChain.outputRootFreq = "240";
      data.networkAndChain.challengePeriod = "604800";

      render(<NetworkAndChainStep />, {
        wrapper: createFormWrapper(data),
      });

      const challengeInput = screen.getByPlaceholderText("604800");
      expect(challengeInput).toBeDisabled();
    });

    it("challenge period is enabled for testnet", () => {
      const data = testnetFormData();
      data.networkAndChain.advancedConfig = true;
      data.networkAndChain.l2BlockTime = "2";
      data.networkAndChain.batchSubmissionFreq = "1440";
      data.networkAndChain.outputRootFreq = "240";
      data.networkAndChain.challengePeriod = "12";

      render(<NetworkAndChainStep />, {
        wrapper: createFormWrapper(data),
      });

      const challengeInput = screen.getByPlaceholderText("12");
      expect(challengeInput).not.toBeDisabled();
    });
  });
});
