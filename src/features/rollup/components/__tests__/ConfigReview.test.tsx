import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { ConfigReview } from "../preset/ConfigReview";
import { MOCK_PRESETS } from "../../schemas/preset";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const fullPreset = MOCK_PRESETS.find((p) => p.id === "full")!;
const gamingPreset = MOCK_PRESETS.find((p) => p.id === "gaming")!;
const generalPreset = MOCK_PRESETS.find((p) => p.id === "general")!;
const defiPreset = MOCK_PRESETS.find((p) => p.id === "defi")!;

const baseProps = {
  network: "Testnet" as const,
  onOverridesChange: vi.fn(),
  feeToken: "TON",
  infraProvider: "aws" as const,
};

// ─── Fault Proof card visibility ──────────────────────────────────────────────

describe("ConfigReview — Fault Proof card", () => {
  it("shows Fault Proof Enabled card for Full preset", () => {
    render(<ConfigReview {...baseProps} preset={fullPreset} />);
    expect(screen.getByText("Fault Proof Enabled")).toBeInTheDocument();
  });

  it("does not show Fault Proof card for Gaming preset", () => {
    render(<ConfigReview {...baseProps} preset={gamingPreset} />);
    expect(screen.queryByText("Fault Proof Enabled")).not.toBeInTheDocument();
  });

  it("does not show Fault Proof card for General preset", () => {
    render(<ConfigReview {...baseProps} preset={generalPreset} />);
    expect(screen.queryByText("Fault Proof Enabled")).not.toBeInTheDocument();
  });

  it("does not show Fault Proof card for DeFi preset", () => {
    render(<ConfigReview {...baseProps} preset={defiPreset} />);
    expect(screen.queryByText("Fault Proof Enabled")).not.toBeInTheDocument();
  });
});

// ─── Local deployment card visibility ────────────────────────────────────────

describe("ConfigReview — Local deployment card", () => {
  it("shows local deployment notice when infraProvider is local", () => {
    render(<ConfigReview {...baseProps} preset={generalPreset} infraProvider="local" />);
    expect(screen.getByText("Local Docker Deployment")).toBeInTheDocument();
  });

  it("does not show local deployment notice when infraProvider is aws", () => {
    render(<ConfigReview {...baseProps} preset={generalPreset} infraProvider="aws" />);
    expect(screen.queryByText("Local Docker Deployment")).not.toBeInTheDocument();
  });
});
