/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { registerStateClass, getStateClassById } from "../../src/StateClass/registerStateClass";

describe("StateClass/registerStateClass", () => {
  it("登録した stateClass を取得できる", () => {
    class S {}
    registerStateClass(101, S as any);
    const got = getStateClassById(101);
    expect(got).toBe(S);
  });

  it("未登録IDでエラーを投げる", () => {
    expect(() => getStateClassById(999999)).toThrowError(/stateclass not found/i);
  });
});
