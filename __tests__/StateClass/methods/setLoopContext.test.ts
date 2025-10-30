/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { setLoopContext } from "../../../src/StateClass/methods/setLoopContext";

const raiseErrorMock = vi.fn((detail: any) => {
  const message = typeof detail === "string" ? detail : detail?.message ?? "error";
  throw new Error(message);
});
vi.mock("../../../src/utils", () => ({
  raiseError: (detail: any) => raiseErrorMock(detail),
}));

function makeHandler() {
  return {
    loopContext: null,
    refStack: [null],
    refIndex: -1,
    lastRefStack: null,
  } as any;
}

beforeEach(() => {
  raiseErrorMock.mockReset();
});

describe("StateClass/methods setLoopContext", () => {
  it("loopContext が null の場合は callback を直接実行", async () => {
    const handler = makeHandler();
    const callback = vi.fn(async () => {});

    await setLoopContext(handler, null, callback);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(handler.loopContext).toBeNull();
    expect(handler.refIndex).toBe(-1);
  });

  it("loopContext が指定された場合はスタックを構築して実行", async () => {
    const handler = makeHandler();
    const ref = { info: { pattern: "items.*" } };
    const loopContext = { ref } as any;
    const callback = vi.fn(async () => {
      expect(handler.loopContext).toBe(loopContext);
      expect(handler.refStack[handler.refIndex]).toBe(ref);
    });

    await setLoopContext(handler, loopContext, callback);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(handler.loopContext).toBeNull();
    expect(handler.refIndex).toBe(-1);
    expect(handler.refStack[0]).toBeNull();
    expect(handler.lastRefStack).toBeNull();
  });

  it("既に loopContext が設定されている場合はエラー", async () => {
    const handler = makeHandler();
    handler.loopContext = { ref: {} };

    await expect(setLoopContext(handler, null, async () => {})).rejects.toThrowError(/already in loop context/);
    expect(raiseErrorMock).toHaveBeenCalled();
  });

  it("callback が例外を投げても最後に loopContext をリセット", async () => {
    const handler = makeHandler();
    const loopContext = { ref: { info: { pattern: "loop" } } } as any;
    const error = new Error("boom");
    const callback = vi.fn(async () => {
      expect(handler.loopContext).toBe(loopContext);
      throw error;
    });

    await expect(setLoopContext(handler, loopContext, callback)).rejects.toThrow(error);
    expect(handler.loopContext).toBeNull();
    expect(handler.lastRefStack).toBeNull();
    expect(handler.refIndex).toBe(-1);
  });

  it("loopContext が指定され refIndex が末尾の場合は push して実行", async () => {
    const handler = makeHandler();
    handler.refIndex = handler.refStack.length - 1;
    const ref = { info: { pattern: "items" } };
    const loopContext = { ref } as any;

    await setLoopContext(handler, loopContext, async () => {
      expect(handler.refStack[handler.refIndex]).toBe(ref);
    });

    expect(handler.refStack.length).toBe(2);
    expect(handler.refStack[1]).toBeNull();
    expect(handler.refIndex).toBe(0);
    expect(handler.lastRefStack).toBeNull();
  });

  it("loopContext が指定されても refStack が空なら STC-002 を投げる", async () => {
    const handler = makeHandler();
    handler.refStack = [];
    const loopContext = { ref: { info: { pattern: "items" } } } as any;

    await expect(setLoopContext(handler, loopContext, async () => {})).rejects.toThrow(/refStack is empty/);
    expect(raiseErrorMock).toHaveBeenCalledWith(expect.objectContaining({ code: "STC-002" }));
    expect(handler.loopContext).toBeNull();
  });
});
