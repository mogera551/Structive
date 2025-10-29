import { describe, it, expect } from "vitest";
import { setStatePropertyRef } from "../../../src/StateClass/methods/setStatePropertyRef";
import { asyncSetStatePropertyRef } from "../../../src/StateClass/methods/asyncSetStatePropertyRef";

describe("StateClass/methods: setStatePropertyRef & asyncSetStatePropertyRef", () => {
  it("setStatePropertyRef: push/pop が正しく動作し、スコープ内で ref が参照される", () => {
    const handler: any = { refStack: [], refIndex: -1 };
    const ref: any = { info: { pattern: "foo" } };

    let seenInCallback: any = null;
    setStatePropertyRef(handler, ref, () => {
      // コールバック中は現在の ref が参照できる
      seenInCallback = handler.refStack[handler.refIndex];
      expect(seenInCallback).toBe(ref);
    });

    // コールバック後は必ずpopされ、refIndexが戻る
    expect(handler.refIndex).toBe(-1);
    expect(handler.refStack[0]).toBeNull();
  });

  it("asyncSetStatePropertyRef: 非同期コールバックでも push/pop が保証される", async () => {
    const handler: any = { refStack: [], refIndex: -1 };
    const ref: any = { info: { pattern: "bar" } };
    let seenInCallback: any = null;

    await asyncSetStatePropertyRef(handler, ref, async () => {
      await Promise.resolve();
      seenInCallback = handler.refStack[handler.refIndex];
      expect(seenInCallback).toBe(ref);
    });

    expect(handler.refIndex).toBe(-1);
    expect(handler.refStack[0]).toBeNull();
  });

  it("asyncSetStatePropertyRef: 例外時でも finally でクリーンアップされる", async () => {
    const handler: any = { refStack: [], refIndex: -1 };
    const ref: any = { info: { pattern: "baz" } };
    const error = new Error("BOOM");

    await expect(asyncSetStatePropertyRef(handler, ref, async () => {
      throw error;
    })).rejects.toThrow("BOOM");

    // 例外でも後始末される
    expect(handler.refIndex).toBe(-1);
    expect(handler.refStack[0]).toBeNull();
  });
});
