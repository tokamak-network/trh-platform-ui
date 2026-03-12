import { describe, it, expect } from "vitest";
import {
  networkAndChainSchema,
  accountAndAwsSchema,
  convertFormToDeploymentRequest,
} from "../create-rollup";
import type { CreateRollupFormData } from "../create-rollup";
import { CHAIN_NETWORK } from "../../const";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const baseNetworkAndChain = {
  network: CHAIN_NETWORK.TESTNET,
  chainName: "TestChain",
  l1RpcUrl: "https://eth-sepolia.example.com/v2/key",
  l1BeaconUrl: "https://beacon.example.com/key",
  advancedConfig: false,
  enableBackup: false,
  reuseDeployment: false,
} as const;

const localNetworkAndChain = {
  ...baseNetworkAndChain,
  network: CHAIN_NETWORK.LOCAL_TESTNET,
  kubeconfigPath: "/home/user/.kube/config",
};

const mainnetNetworkAndChain = {
  ...baseNetworkAndChain,
  network: CHAIN_NETWORK.MAINNET,
};

const baseAccountAndAws = {
  seedPhrase: Array(12).fill("word"),
  adminAccount: "0x1111111111111111111111111111111111111111",
  adminPrivateKey: "0xaaa1",
  proposerAccount: "0x2222222222222222222222222222222222222222",
  proposerPrivateKey: "0xbbb2",
  batchAccount: "0x3333333333333333333333333333333333333333",
  batchPrivateKey: "0xccc3",
  sequencerAccount: "0x4444444444444444444444444444444444444444",
  sequencerPrivateKey: "0xddd4",
  accountName: "test-account",
  credentialId: "cred-123",
  awsAccessKey: "AKIAIOSFODNN7EXAMPLE",
  awsSecretKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  awsRegion: "us-east-1",
};

const buildFormData = (
  overrides: Partial<{
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    networkAndChain: Record<string, any>;
    accountAndAws: Partial<typeof baseAccountAndAws>;
    daoCandidate: { amount: string; memo: string; nameInfo?: string } | undefined;
    confirmation: { agreedToMainnetRisks?: boolean };
  }> = {}
): CreateRollupFormData => {
  const nc = { ...baseNetworkAndChain, ...overrides.networkAndChain };
  return {
    networkAndChain: nc,
    accountAndAws: { ...baseAccountAndAws, ...overrides.accountAndAws },
    daoCandidate: overrides.daoCandidate,
    confirmation: overrides.confirmation ?? {},
  } as CreateRollupFormData;
};

// ---------------------------------------------------------------------------
// networkAndChainSchema
// ---------------------------------------------------------------------------

describe("networkAndChainSchema", () => {
  it("accepts valid testnet data", () => {
    const result = networkAndChainSchema.safeParse(baseNetworkAndChain);
    expect(result.success).toBe(true);
  });

  it("accepts valid local testnet data with kubeconfigPath", () => {
    const result = networkAndChainSchema.safeParse(localNetworkAndChain);
    expect(result.success).toBe(true);
  });

  it("rejects local testnet without kubeconfigPath", () => {
    const data = { ...localNetworkAndChain, kubeconfigPath: undefined };
    const result = networkAndChainSchema.safeParse(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("kubeconfigPath");
    }
  });

  it("rejects local testnet with empty kubeconfigPath", () => {
    const data = { ...localNetworkAndChain, kubeconfigPath: "" };
    const result = networkAndChainSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("does not require kubeconfigPath for testnet", () => {
    const data = { ...baseNetworkAndChain, kubeconfigPath: undefined };
    const result = networkAndChainSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("does not require kubeconfigPath for mainnet", () => {
    const data = { ...mainnetNetworkAndChain, kubeconfigPath: undefined };
    const result = networkAndChainSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("rejects mainnet with wrong challenge period", () => {
    const data = {
      ...mainnetNetworkAndChain,
      advancedConfig: true,
      challengePeriod: "100",
    };
    const result = networkAndChainSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("accepts mainnet with correct challenge period (604800)", () => {
    const data = {
      ...mainnetNetworkAndChain,
      advancedConfig: true,
      challengePeriod: "604800",
    };
    const result = networkAndChainSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("rejects non-integer l2BlockTime", () => {
    const data = { ...baseNetworkAndChain, l2BlockTime: "2.5" };
    const result = networkAndChainSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects batchSubmissionFreq not multiple of 12", () => {
    const data = { ...baseNetworkAndChain, batchSubmissionFreq: "13" };
    const result = networkAndChainSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("rejects outputRootFreq not multiple of l2BlockTime", () => {
    const data = {
      ...baseNetworkAndChain,
      l2BlockTime: "3",
      outputRootFreq: "10",
    };
    const result = networkAndChainSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("accepts outputRootFreq that is multiple of l2BlockTime", () => {
    const data = {
      ...baseNetworkAndChain,
      l2BlockTime: "3",
      outputRootFreq: "12",
    };
    const result = networkAndChainSchema.safeParse(data);
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// accountAndAwsSchema
// ---------------------------------------------------------------------------

describe("accountAndAwsSchema", () => {
  it("accepts valid data with unique accounts", () => {
    const result = accountAndAwsSchema.safeParse(baseAccountAndAws);
    expect(result.success).toBe(true);
  });

  it("rejects duplicate account addresses", () => {
    const data = {
      ...baseAccountAndAws,
      proposerAccount: baseAccountAndAws.adminAccount,
    };
    const result = accountAndAwsSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it("requires all AWS fields", () => {
    const data = { ...baseAccountAndAws, awsAccessKey: "" };
    const result = accountAndAwsSchema.safeParse(data);
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// convertFormToDeploymentRequest
// ---------------------------------------------------------------------------

describe("convertFormToDeploymentRequest", () => {
  describe("testnet deployment", () => {
    it("includes l1 URLs and AWS credentials", () => {
      const formData = buildFormData();
      const result = convertFormToDeploymentRequest(formData);

      expect(result.l1RpcUrl).toBe(baseNetworkAndChain.l1RpcUrl);
      expect(result.l1BeaconUrl).toBe(baseNetworkAndChain.l1BeaconUrl);
      expect(result.awsAccessKey).toBe(baseAccountAndAws.awsAccessKey);
      expect(result.awsSecretAccessKey).toBe(baseAccountAndAws.awsSecretKey);
      expect(result.awsRegion).toBe(baseAccountAndAws.awsRegion);
    });

    it("sets kubeconfigPath to undefined", () => {
      const formData = buildFormData();
      const result = convertFormToDeploymentRequest(formData);

      expect(result.kubeconfigPath).toBeUndefined();
    });

    it("uses default values for advanced config when not provided", () => {
      const formData = buildFormData();
      const result = convertFormToDeploymentRequest(formData);

      expect(result.l2BlockTime).toBe(6);
      expect(result.batchSubmissionFrequency).toBe(1440);
      expect(result.outputRootFrequency).toBe(240);
      expect(result.challengePeriod).toBe(12);
    });

    it("parses advanced config values when provided", () => {
      const formData = buildFormData({
        networkAndChain: {
          advancedConfig: true,
          l2BlockTime: "3",
          batchSubmissionFreq: "720",
          outputRootFreq: "120",
          challengePeriod: "24",
        },
      });
      const result = convertFormToDeploymentRequest(formData);

      expect(result.l2BlockTime).toBe(3);
      expect(result.batchSubmissionFrequency).toBe(720);
      expect(result.outputRootFrequency).toBe(120);
      expect(result.challengePeriod).toBe(24);
    });
  });

  describe("local testnet deployment", () => {
    it("sets l1 URLs to undefined", () => {
      const formData = buildFormData({
        networkAndChain: {
          ...localNetworkAndChain,
        },
      });
      const result = convertFormToDeploymentRequest(formData);

      expect(result.l1RpcUrl).toBeUndefined();
      expect(result.l1BeaconUrl).toBeUndefined();
    });

    it("sets AWS credentials to undefined", () => {
      const formData = buildFormData({
        networkAndChain: {
          ...localNetworkAndChain,
        },
      });
      const result = convertFormToDeploymentRequest(formData);

      expect(result.awsAccessKey).toBeUndefined();
      expect(result.awsSecretAccessKey).toBeUndefined();
      expect(result.awsRegion).toBeUndefined();
    });

    it("includes kubeconfigPath from form data", () => {
      const formData = buildFormData({
        networkAndChain: {
          ...localNetworkAndChain,
          kubeconfigPath: "/custom/path/config",
        },
      });
      const result = convertFormToDeploymentRequest(formData);

      expect(result.kubeconfigPath).toBe("/custom/path/config");
    });

    it("defaults kubeconfigPath to ~/.kube/config when empty", () => {
      const formData = buildFormData({
        networkAndChain: {
          ...localNetworkAndChain,
          kubeconfigPath: "",
        },
      });
      const result = convertFormToDeploymentRequest(formData);

      expect(result.kubeconfigPath).toBe("~/.kube/config");
    });

    it("does not register DAO candidate", () => {
      const formData = buildFormData({
        networkAndChain: { ...localNetworkAndChain },
        daoCandidate: undefined,
      });
      const result = convertFormToDeploymentRequest(formData);

      expect(result.registerCandidate).toBe(false);
      expect(result.registerCandidateParams).toBeUndefined();
    });
  });

  describe("mainnet deployment", () => {
    it("includes l1 URLs and AWS credentials", () => {
      const formData = buildFormData({
        networkAndChain: { ...mainnetNetworkAndChain },
      });
      const result = convertFormToDeploymentRequest(formData);

      expect(result.l1RpcUrl).toBe(baseNetworkAndChain.l1RpcUrl);
      expect(result.awsAccessKey).toBe(baseAccountAndAws.awsAccessKey);
      expect(result.kubeconfigPath).toBeUndefined();
    });

    it("forces backup enabled", () => {
      const formData = buildFormData({
        networkAndChain: { ...mainnetNetworkAndChain, enableBackup: false },
      });
      const result = convertFormToDeploymentRequest(formData);

      expect(result.backupConfig?.enabled).toBe(true);
    });

    it("includes mainnet confirmation when agreed", () => {
      const formData = buildFormData({
        networkAndChain: { ...mainnetNetworkAndChain },
        confirmation: { agreedToMainnetRisks: true },
      });
      const result = convertFormToDeploymentRequest(formData);

      expect(result.mainnetConfirmation).toBeDefined();
      expect(result.mainnetConfirmation?.acknowledgedIrreversibility).toBe(true);
      expect(result.mainnetConfirmation?.acknowledgedCosts).toBe(true);
      expect(result.mainnetConfirmation?.acknowledgedRisks).toBe(true);
    });

    it("excludes mainnet confirmation when not agreed", () => {
      const formData = buildFormData({
        networkAndChain: { ...mainnetNetworkAndChain },
        confirmation: { agreedToMainnetRisks: false },
      });
      const result = convertFormToDeploymentRequest(formData);

      expect(result.mainnetConfirmation).toBeUndefined();
    });
  });

  describe("account private key handling", () => {
    it("strips 0x prefix from private keys", () => {
      const formData = buildFormData();
      const result = convertFormToDeploymentRequest(formData);

      expect(result.adminAccount).toBe("aaa1");
      expect(result.proposerAccount).toBe("bbb2");
      expect(result.batcherAccount).toBe("ccc3");
      expect(result.sequencerAccount).toBe("ddd4");
    });

    it("trims whitespace from private keys", () => {
      const formData = buildFormData({
        accountAndAws: {
          adminPrivateKey: "  0xaaa1  ",
        },
      });
      const result = convertFormToDeploymentRequest(formData);

      expect(result.adminAccount).toBe("aaa1");
    });
  });

  describe("DAO candidate", () => {
    it("includes registration params when daoCandidate is set", () => {
      const formData = buildFormData({
        daoCandidate: {
          amount: "1500.5",
          memo: "test memo",
          nameInfo: "Test DAO",
        },
      });
      const result = convertFormToDeploymentRequest(formData);

      expect(result.registerCandidate).toBe(true);
      expect(result.registerCandidateParams).toEqual({
        amount: 1500.5,
        memo: "test memo",
        nameInfo: "Test DAO",
      });
    });

    it("excludes registration params when daoCandidate is undefined", () => {
      const formData = buildFormData({ daoCandidate: undefined });
      const result = convertFormToDeploymentRequest(formData);

      expect(result.registerCandidate).toBe(false);
      expect(result.registerCandidateParams).toBeUndefined();
    });
  });
});
