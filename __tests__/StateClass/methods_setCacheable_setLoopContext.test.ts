/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { setCacheable } from "../../src/StateClass/methods/setCacheable";
import { setLoopContext } from "../../src/StateClass/methods/setLoopContext";

vi.mock("../../src/StateClass/methods/asyncSetStatePropertyRef", () => ({
  asyncSetStatePropertyRef: async (_handler:any, _ref:any, cb:() => Promise<void>) => { await cb(); }
}));

function makeHandler() {
  return {
    cache: null,
    loopContext: null,
  } as any;
}

describe("StateClass/methods setCacheable/setLoopContext", () => {
  it("setCacheable: callback 実行中のみ handler.cache を Map にし、終了後は null に戻す", () => {
    const handler = makeHandler();
    const cb = vi.fn(() => {
      expect(handler.cache).toBeInstanceOf(Map);
      (handler.cache as Map<any, any>).set({} as any, 1);
    });

    expect(handler.cache).toBeNull();
    setCacheable(handler, cb);
    expect(cb).toHaveBeenCalled();
    expect(handler.cache).toBeNull();
  });

  it("setLoopContext: loopContext が null のときはそのまま callback、非 null なら asyncSetStatePropertyRef 経由", async () => {
    const handler = makeHandler();
    const cb = vi.fn(async () => {});

    // null のとき
    await setLoopContext(handler, null, cb);
    expect(cb).toHaveBeenCalledTimes(1);

    // 非 null のとき
    const ref = { path: "a.b" } as any;
    const loopContext = { ref } as any;
    await setLoopContext(handler, loopContext, cb);
    expect(cb).toHaveBeenCalledTimes(2);
  });

  it("setLoopContext: すでに loopContext が設定されている場合はエラー", async () => {
    const handler = makeHandler();
    handler.loopContext = {} as any; // 既に設定
    await expect(setLoopContext(handler, null, async () => {})).rejects.toThrowError(/already in loop context/);
  });
});
