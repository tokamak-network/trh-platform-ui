import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReviewAndDeployStep } from "../ReviewAndDeployStep";
import {
  createFormWrapper,
  testnetFormData,
  localTestnetFormData,
  mainnetFormData,
} from "../../../test-utils";

describe("ReviewAndDeployStep", () => {
  describe("testnet", () => {
    it("shows AWS Configuration section", () => {
      render(<ReviewAndDeployStep />, {
        wrapper: createFormWrapper(testnetFormData()),
      });

      expect(screen.getByText("AWS Configuration")).toBeInTheDocument();
    });

    it("does not show Local Deployment section", () => {
      render(<ReviewAndDeployStep />, {
        wrapper: createFormWrapper(testnetFormData()),
      });

      expect(screen.queryByText("Local Deployment")).not.toBeInTheDocument();
    });

    it("shows L1 RPC URL in Network & Chain section", () => {
      render(<ReviewAndDeployStep />, {
        wrapper: createFormWrapper(testnetFormData()),
      });

      expect(screen.getByText("L1 RPC URL")).toBeInTheDocument();
    });

    it("shows Deployment Notice (blue)", () => {
      render(<ReviewAndDeployStep />, {
        wrapper: createFormWrapper(testnetFormData()),
      });

      expect(screen.getByText("Deployment Notice")).toBeInTheDocument();
    });

    it("shows Backup Configuration option", () => {
      render(<ReviewAndDeployStep />, {
        wrapper: createFormWrapper(testnetFormData()),
      });

      expect(screen.getByText("Backup Configuration")).toBeInTheDocument();
    });
  });

  describe("local testnet", () => {
    it("does not show AWS Configuration section", () => {
      render(<ReviewAndDeployStep />, {
        wrapper: createFormWrapper(localTestnetFormData()),
      });

      expect(screen.queryByText("AWS Configuration")).not.toBeInTheDocument();
    });

    it("shows Local Deployment section with kubeconfig path", () => {
      render(<ReviewAndDeployStep />, {
        wrapper: createFormWrapper(localTestnetFormData()),
      });

      const localDeploymentElements = screen.getAllByText("Local Deployment");
      expect(localDeploymentElements).toHaveLength(2);
      expect(screen.getByText("Kubeconfig Path")).toBeInTheDocument();
    });

    it("does not show L1 RPC URL in Network & Chain section", () => {
      render(<ReviewAndDeployStep />, {
        wrapper: createFormWrapper(localTestnetFormData()),
      });

      expect(screen.queryByText("L1 RPC URL")).not.toBeInTheDocument();
    });

    it("shows local deployment notice (green)", () => {
      render(<ReviewAndDeployStep />, {
        wrapper: createFormWrapper(localTestnetFormData()),
      });

      expect(
        screen.getByText((content) => content.includes("local Kubernetes cluster"))
      ).toBeInTheDocument();
    });

    it("does not show Backup Configuration", () => {
      render(<ReviewAndDeployStep />, {
        wrapper: createFormWrapper(localTestnetFormData()),
      });

      expect(screen.queryByText("Backup Configuration")).not.toBeInTheDocument();
    });

    it("does not show DAO Candidate section when undefined", () => {
      render(<ReviewAndDeployStep />, {
        wrapper: createFormWrapper(localTestnetFormData()),
      });

      expect(screen.queryByText("DAO Candidate")).not.toBeInTheDocument();
    });
  });

  describe("mainnet", () => {
    it("shows AWS Configuration section", () => {
      render(<ReviewAndDeployStep />, {
        wrapper: createFormWrapper(mainnetFormData()),
      });

      expect(screen.getByText("AWS Configuration")).toBeInTheDocument();
    });

    it("shows mainnet deployment warning (red)", () => {
      render(<ReviewAndDeployStep />, {
        wrapper: createFormWrapper(mainnetFormData()),
      });

      expect(
        screen.getByText("Mainnet Deployment WARNING")
      ).toBeInTheDocument();
    });

    it("shows mainnet risk acknowledgement checkbox", () => {
      render(<ReviewAndDeployStep />, {
        wrapper: createFormWrapper(mainnetFormData()),
      });

      expect(
        screen.getByText((content) =>
          content.includes("acknowledge the risks")
        )
      ).toBeInTheDocument();
    });

    it("does not show Backup Configuration (always forced on for mainnet)", () => {
      render(<ReviewAndDeployStep />, {
        wrapper: createFormWrapper(mainnetFormData()),
      });

      expect(screen.queryByText("Backup Configuration")).not.toBeInTheDocument();
    });

    it("does not show Local Deployment section", () => {
      render(<ReviewAndDeployStep />, {
        wrapper: createFormWrapper(mainnetFormData()),
      });

      expect(screen.queryByText("Local Deployment")).not.toBeInTheDocument();
    });
  });

  describe("estimated cost", () => {
    it("shows estimated cost when provided", () => {
      render(
        <ReviewAndDeployStep
          estimatedCost={{ deploymentGasEth: "0.05" }}
        />,
        { wrapper: createFormWrapper(testnetFormData()) }
      );

      expect(
        screen.getByText("Estimated Deployment Cost")
      ).toBeInTheDocument();
      expect(screen.getByText("0.05 ETH")).toBeInTheDocument();
    });

    it("does not show estimated cost when not provided", () => {
      render(<ReviewAndDeployStep />, {
        wrapper: createFormWrapper(testnetFormData()),
      });

      expect(
        screen.queryByText("Estimated Deployment Cost")
      ).not.toBeInTheDocument();
    });
  });
});
