import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AccountAndAwsStep } from "../AccountAndAwsStep";
import {
  createFormWrapper,
  testnetFormData,
  localTestnetFormData,
} from "../../../test-utils";

// Mock child components to isolate conditional rendering logic
vi.mock("../AccountSetup", () => ({
  AccountSetup: () => <div data-testid="account-setup">AccountSetup</div>,
}));

vi.mock("../AwsConfig", () => ({
  AwsConfig: () => <div data-testid="aws-config">AwsConfig</div>,
}));

describe("AccountAndAwsStep", () => {
  it("renders AccountSetup for all networks", () => {
    render(<AccountAndAwsStep />, {
      wrapper: createFormWrapper(testnetFormData()),
    });

    expect(screen.getByTestId("account-setup")).toBeInTheDocument();
  });

  describe("testnet", () => {
    it("renders AwsConfig", () => {
      render(<AccountAndAwsStep />, {
        wrapper: createFormWrapper(testnetFormData()),
      });

      expect(screen.getByTestId("aws-config")).toBeInTheDocument();
    });
  });

  describe("local testnet", () => {
    it("does not render AwsConfig", () => {
      render(<AccountAndAwsStep />, {
        wrapper: createFormWrapper(localTestnetFormData()),
      });

      expect(screen.queryByTestId("aws-config")).not.toBeInTheDocument();
    });

    it("still renders AccountSetup", () => {
      render(<AccountAndAwsStep />, {
        wrapper: createFormWrapper(localTestnetFormData()),
      });

      expect(screen.getByTestId("account-setup")).toBeInTheDocument();
    });
  });
});
