import { describe, it, expect } from "vitest";
import { presetBasicInfoSchema } from "../create-rollup";

// ─── RED: presetBasicInfoSchema 5 필드 스키마 ───────────────────────────────
// 현재 코드에서 이 테스트들은 실패해야 한다:
//   - 현재 스키마에는 presetId 필드가 없음
//   - 현재 스키마는 l1RpcUrl, l1BeaconUrl, seedPhrase, infraProvider를 필수로 요구함

describe("presetBasicInfoSchema — 5 fields only", () => {
  const VALID_5_FIELDS = {
    presetId: "general",
    chainName: "my-chain",
    network: "Testnet",
    awsAccessKey: "AKIAIOSFODNN7EXAMPLE",
    awsSecretKey: "secretkey123",
  };

  it("accepts valid 5-field input", () => {
    const result = presetBasicInfoSchema.safeParse(VALID_5_FIELDS);
    expect(result.success).toBe(true);
  });

  it("rejects when awsAccessKey is missing", () => {
    const { awsAccessKey: _, ...without } = VALID_5_FIELDS;
    const result = presetBasicInfoSchema.safeParse(without);
    expect(result.success).toBe(false);
  });

  it("rejects when awsSecretKey is missing", () => {
    const { awsSecretKey: _, ...without } = VALID_5_FIELDS;
    const result = presetBasicInfoSchema.safeParse(without);
    expect(result.success).toBe(false);
  });

  it("rejects when network is not Testnet or Mainnet", () => {
    const result = presetBasicInfoSchema.safeParse({
      ...VALID_5_FIELDS,
      network: "devnet",
    });
    expect(result.success).toBe(false);
  });

  it("does not require seedPhrase (legacy field removed)", () => {
    // seedPhrase가 없어도 통과해야 함
    const result = presetBasicInfoSchema.safeParse(VALID_5_FIELDS);
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).seedPhrase).toBeUndefined();
    }
  });

  it("does not require l1RpcUrl (legacy field removed)", () => {
    // l1RpcUrl 없이도 통과해야 함
    const result = presetBasicInfoSchema.safeParse(VALID_5_FIELDS);
    expect(result.success).toBe(true);
  });

  it("does not require infraProvider (legacy field removed)", () => {
    // infraProvider 없이도 통과해야 함
    const result = presetBasicInfoSchema.safeParse(VALID_5_FIELDS);
    expect(result.success).toBe(true);
  });
});
