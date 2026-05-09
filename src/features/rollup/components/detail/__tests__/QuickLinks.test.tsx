import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { QuickLinks } from "../QuickLinks";
import { ThanosStack, ThanosStackStatus, ThanosStackMetadata } from "../../../schemas/thanos";
import { RollupType } from "../../../schemas/rollup";
import { MOCK_PRESETS } from "../../../schemas/preset";

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const mockUsePresetDetailQuery = vi.fn();
vi.mock("../../../api/queries", () => ({
  usePresetDetailQuery: (...args: unknown[]) => mockUsePresetDetailQuery(...args),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

const ALL_URLS: ThanosStackMetadata = {
  explorerUrl: "https://explorer.example.com",
  bridgeUrl: "https://bridge.example.com",
  monitoringUrl: "https://grafana.example.com",
  crossTradeUrl: "https://crosstrade.example.com",
  uptimeServiceUrl: "https://uptime.example.com",
};

function makeStack(presetId: string, metadata: ThanosStackMetadata | null = ALL_URLS): ThanosStack {
  return {
    id: "test-stack-id",
    name: "test-chain",
    type: "optimistic-rollup",
    network: "Testnet",
    status: ThanosStackStatus.DEPLOYED,
    config: {
      network: "Testnet",
      type: RollupType.OPTIMISTIC_ROLLUP,
      l1RpcUrl: "",
      awsRegion: "us-east-1",
      chainName: "test-chain",
      l1BeaconUrl: "",
      l2BlockTime: 2,
      adminAccount: "",
      awsAccessKey: "",
      batcherAccount: "",
      deploymentPath: "",
      challengePeriod: 10,
      challengerAccount: "",
      proposerAccount: "",
      sequencerAccount: "",
      awsSecretAccessKey: "",
      outputRootFrequency: 1800,
      batchSubmissionFrequency: 1800,
      presetId,
    },
    deployment_path: "",
    metadata,
    created_at: "",
    updated_at: "",
    deleted_at: null,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("QuickLinks — general preset", () => {
  beforeEach(() => {
    const generalPreset = MOCK_PRESETS.find((p) => p.id === "general")!;
    mockUsePresetDetailQuery.mockReturnValue({ data: generalPreset, isLoading: false, isError: false });
  });

  it("shows only Block Explorer and Bridge cards (2 cards)", () => {
    render(<QuickLinks stack={makeStack("general")} />, { wrapper: createWrapper() });
    expect(screen.getByText("Block Explorer")).toBeInTheDocument();
    expect(screen.getByText("Token Bridge")).toBeInTheDocument();
    expect(screen.queryByText("Monitoring")).not.toBeInTheDocument();
    expect(screen.queryByText("CrossTrade")).not.toBeInTheDocument();
    expect(screen.queryByText("Uptime Service")).not.toBeInTheDocument();
  });

  it("renders links as <a> elements with target=_blank and rel=noopener", () => {
    render(<QuickLinks stack={makeStack("general")} />, { wrapper: createWrapper() });
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThanOrEqual(2);
    links.forEach((link) => {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });
  });
});

describe("QuickLinks — full preset", () => {
  beforeEach(() => {
    const fullPreset = MOCK_PRESETS.find((p) => p.id === "full")!;
    mockUsePresetDetailQuery.mockReturnValue({ data: fullPreset, isLoading: false, isError: false });
  });

  it("shows all 5 service cards when all URLs are available", () => {
    render(<QuickLinks stack={makeStack("full")} />, { wrapper: createWrapper() });
    expect(screen.getByText("Block Explorer")).toBeInTheDocument();
    expect(screen.getByText("Token Bridge")).toBeInTheDocument();
    expect(screen.getByText("Monitoring")).toBeInTheDocument();
    expect(screen.getByText("CrossTrade")).toBeInTheDocument();
    expect(screen.getByText("Uptime Service")).toBeInTheDocument();
  });

  it("all 5 cards are <a> links", () => {
    render(<QuickLinks stack={makeStack("full")} />, { wrapper: createWrapper() });
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(5);
  });
});

describe("QuickLinks — defi preset with missing monitoringUrl", () => {
  beforeEach(() => {
    const defiPreset = MOCK_PRESETS.find((p) => p.id === "defi")!;
    mockUsePresetDetailQuery.mockReturnValue({ data: defiPreset, isLoading: false, isError: false });
  });

  it("shows Monitoring as Provisioning… when URL is absent", () => {
    const metadataWithoutMonitoring: ThanosStackMetadata = {
      ...ALL_URLS,
      monitoringUrl: undefined,
      grafanaUrl: undefined,
    };
    render(
      <QuickLinks stack={makeStack("defi", metadataWithoutMonitoring)} />,
      { wrapper: createWrapper() }
    );
    expect(screen.getByText("Monitoring")).toBeInTheDocument();
    expect(screen.getByText("Provisioning…")).toBeInTheDocument();
  });

  it("Monitoring card is not an <a> when URL is absent", () => {
    const metadataWithoutMonitoring: ThanosStackMetadata = {
      ...ALL_URLS,
      monitoringUrl: undefined,
      grafanaUrl: undefined,
    };
    render(
      <QuickLinks stack={makeStack("defi", metadataWithoutMonitoring)} />,
      { wrapper: createWrapper() }
    );
    // Links with href should not include a Monitoring link
    const links = screen.getAllByRole("link");
    const monitoringLink = links.find((l) => l.textContent?.includes("Monitoring"));
    expect(monitoringLink).toBeUndefined();
  });
});

describe("QuickLinks — preset loading failure fallback", () => {
  beforeEach(() => {
    mockUsePresetDetailQuery.mockReturnValue({ data: undefined, isLoading: false, isError: true });
  });

  it("shows cards for all modules that have URLs when preset fails to load", () => {
    render(<QuickLinks stack={makeStack("full")} />, { wrapper: createWrapper() });
    // All URLs present → all relevant cards should be shown as links
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThanOrEqual(1);
  });
});

describe("QuickLinks — loading state", () => {
  it("renders skeletons while preset is loading", () => {
    mockUsePresetDetailQuery.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    const { container } = render(<QuickLinks stack={makeStack("full")} />, { wrapper: createWrapper() });
    const skeletons = container.querySelectorAll("[aria-label='Loading...']");
    expect(skeletons.length).toBeGreaterThan(0);
  });
});

describe("QuickLinks — metadataPrUrl", () => {
  beforeEach(() => {
    const generalPreset = MOCK_PRESETS.find((p) => p.id === "general")!;
    mockUsePresetDetailQuery.mockReturnValue({ data: generalPreset, isLoading: false, isError: false });
  });

  it("shows Metadata PR card when metadataPrUrl is provided", () => {
    render(
      <QuickLinks stack={makeStack("general")} metadataPrUrl="https://github.com/pr/123" />,
      { wrapper: createWrapper() }
    );
    expect(screen.getByText("Metadata PR")).toBeInTheDocument();
  });

  it("does not show Metadata PR card when metadataPrUrl is '#'", () => {
    render(
      <QuickLinks stack={makeStack("general")} metadataPrUrl="#" />,
      { wrapper: createWrapper() }
    );
    expect(screen.queryByText("Metadata PR")).not.toBeInTheDocument();
  });
});
