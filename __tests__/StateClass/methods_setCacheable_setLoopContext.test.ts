/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { setLoopContext } from "../../src/StateClass/methods/setLoopContext";

const raiseErrorMock = vi.fn((detail: any) => {
  const message = typeof detail === "string" ? detail : detail?.message ?? "error";
  throw new Error(message);
});
vi.mock("../../src/utils", () => ({
  raiseError: (detail: any) => raiseErrorMock(detail),
}));

type HandlerOptions = {
  refStack?: any[];
  refIndex?: number;
  lastRefStack?: any;
};

function makeHandler(options: HandlerOptions = {}) {
  const refStack = options.refStack ?? [null];
  const refIndex = options.refIndex ?? -1;
  const lastRefStack = options.lastRefStack ?? (refIndex >= 0 ? refStack[refIndex] : null);
  return {
    loopContext: null,
    refStack,
    refIndex,
    lastRefStack,
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
    const existingRef = { info: { pattern: "prev" } };
    const handler = makeHandler({ refStack: [existingRef], refIndex: 0 });
    const initialRefIndex = handler.refIndex;
    const ref = { pattern: "items.*" };
    const loopContext = { ref } as any;
    const callback = vi.fn(async () => {
      expect(handler.loopContext).toBe(loopContext);
      expect(handler.refStack[handler.refIndex]).toBe(ref);
    });

    await setLoopContext(handler, loopContext, callback);

    expect(handler.loopContext).toBeNull();
    expect(handler.refIndex).toBe(initialRefIndex);
    expect(handler.lastRefStack).toBe(existingRef);
    expect(handler.refStack[0]).toBe(existingRef);
    expect(handler.refStack[1]).toBeNull();
  });

  it("既に loopContext が設定されている場合はエラー", async () => {
    const handler = makeHandler();
    handler.loopContext = { ref: {} };

    await expect(setLoopContext(handler, null, async () => {})).rejects.toThrowError(/already in loop context/);
    expect(raiseErrorMock).toHaveBeenCalled();
  });

  it("callback が例外を投げても最後に loopContext をリセット", async () => {
    const handler = makeHandler();
    const loopContext = { ref: {} } as any;
    const error = new Error("boom");
    const callback = vi.fn(async () => {
      throw error;
    });

    await expect(setLoopContext(handler, loopContext, callback)).rejects.toThrow(error);
    expect(handler.loopContext).toBeNull();
    expect(handler.refIndex).toBe(-1);
  });
});
