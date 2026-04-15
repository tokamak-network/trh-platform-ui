import { describe, it, expect } from "vitest";
import { deployWithPresetRequestSchema } from "../preset";

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
