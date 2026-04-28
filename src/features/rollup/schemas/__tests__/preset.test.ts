import { describe, it, expect } from "vitest";
import { deployWithPresetRequestSchema, hasFaultProofSupport, MOCK_PRESETS } from "../preset";

// ─── RED: DeployWithPresetRequest — 5+1 필드 스키마 ─────────────────────────
// 현재 코드에서 이 테스트들은 실패해야 한다:
//   - 현재 스키마는 seedPhrase를 필수(min(1))로 요구함
//   - 현재 스키마는 l1RpcUrl, l1BeaconUrl, infraProvider, feeToken을 필수로 요구함

describe("deployWithPresetRequestSchema — simplified 5+1 fields", () => {
  const MINIMAL_PAYLOAD = {
    presetId: "general",
    chainName: "my-chain",
    network: "Testnet",
    awsAccessKey: "AKIAIOSFODNN7EXAMPLE",
    awsSecretKey: "secretkey123",
  };

  it("accepts minimal payload without seedPhrase", () => {
    const result = deployWithPresetRequestSchema.safeParse(MINIMAL_PAYLOAD);
    expect(result.success).toBe(true);
  });

  it("accepts optional awsRegion", () => {
    const result = deployWithPresetRequestSchema.safeParse({
      ...MINIMAL_PAYLOAD,
      awsRegion: "ap-northeast-2",
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional awsSessionToken for STS credentials", () => {
    const result = deployWithPresetRequestSchema.safeParse({
      ...MINIMAL_PAYLOAD,
      awsSessionToken: "AQoXnyc4lcK4w==",
    });
    expect(result.success).toBe(true);
  });

  it("does not require seedPhrase", () => {
    // seedPhrase 없이 성공해야 함
    const result = deployWithPresetRequestSchema.safeParse(MINIMAL_PAYLOAD);
    expect(result.success).toBe(true);
  });

  it("does not require l1RpcUrl", () => {
    const result = deployWithPresetRequestSchema.safeParse(MINIMAL_PAYLOAD);
    expect(result.success).toBe(true);
  });

  it("does not require infraProvider", () => {
    const result = deployWithPresetRequestSchema.safeParse(MINIMAL_PAYLOAD);
    expect(result.success).toBe(true);
  });

  it("does not require feeToken", () => {
    const result = deployWithPresetRequestSchema.safeParse(MINIMAL_PAYLOAD);
    expect(result.success).toBe(true);
  });

  it("rejects when presetId is missing", () => {
    const { presetId: _, ...without } = MINIMAL_PAYLOAD;
    const result = deployWithPresetRequestSchema.safeParse(without);
    expect(result.success).toBe(false);
  });

  it("rejects when chainName is missing", () => {
    const { chainName: _, ...without } = MINIMAL_PAYLOAD;
    const result = deployWithPresetRequestSchema.safeParse(without);
    expect(result.success).toBe(false);
  });
});

// ─── enableFaultProof field ───────────────────────────────────────────────────

describe("deployWithPresetRequestSchema — enableFaultProof", () => {
  const BASE = {
    presetId: "full",
    chainName: "my-chain",
    network: "Testnet",
    seedPhrase: "word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12",
    infraProvider: "aws",
    awsAccessKey: "AKIAIOSFODNN7EXAMPLE",
    awsSecretKey: "secretkey123",
    awsRegion: "us-east-1",
    l1RpcUrl: "https://eth-sepolia.example.com",
    l1BeaconUrl: "https://beacon-sepolia.example.com",
    feeToken: "TON",
  };

  it("accepts payload without enableFaultProof (optional field)", () => {
    const result = deployWithPresetRequestSchema.safeParse(BASE);
    expect(result.success).toBe(true);
  });

  it("accepts enableFaultProof: true", () => {
    const result = deployWithPresetRequestSchema.safeParse({ ...BASE, enableFaultProof: true });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.enableFaultProof).toBe(true);
  });

  it("accepts enableFaultProof: false", () => {
    const result = deployWithPresetRequestSchema.safeParse({ ...BASE, enableFaultProof: false });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.enableFaultProof).toBe(false);
  });
});

// ─── hasFaultProofSupport ─────────────────────────────────────────────────────

describe("hasFaultProofSupport", () => {
  const byId = (id: string) => MOCK_PRESETS.find((p) => p.id === id)!;

  it("returns true for full preset", () => {
    expect(hasFaultProofSupport(byId("full"))).toBe(true);
  });

  it("returns false for general preset", () => {
    expect(hasFaultProofSupport(byId("general"))).toBe(false);
  });

  it("returns false for defi preset", () => {
    expect(hasFaultProofSupport(byId("defi"))).toBe(false);
  });

  it("returns false for gaming preset", () => {
    expect(hasFaultProofSupport(byId("gaming"))).toBe(false);
  });

  it("returns false for unknown preset id (default fallback)", () => {
    expect(hasFaultProofSupport({ ...byId("general"), id: "nonexistent" })).toBe(false);
  });
});
