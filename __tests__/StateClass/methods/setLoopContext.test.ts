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

const asyncSetStatePropertyRefMock = vi.fn(async (_handler: any, _ref: any, cb: () => Promise<void>) => {
  await cb();
});
vi.mock("../../../src/StateClass/methods/asyncSetStatePropertyRef", () => ({
  asyncSetStatePropertyRef: (handler: any, ref: any, cb: () => Promise<void>) => asyncSetStatePropertyRefMock(handler, ref, cb),
}));

function makeHandler() {
  return {
    loopContext: null,
  } as any;
}

beforeEach(() => {
  raiseErrorMock.mockReset();
  asyncSetStatePropertyRefMock.mockClear();
});

describe("StateClass/methods setLoopContext", () => {
  it("loopContext が null の場合は callback を直接実行", async () => {
    const handler = makeHandler();
    const callback = vi.fn(async () => {});

    await setLoopContext(handler, null, callback);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(asyncSetStatePropertyRefMock).not.toHaveBeenCalled();
    expect(handler.loopContext).toBeNull();
  });

  it("loopContext が指定された場合は asyncSetStatePropertyRef 経由で実行", async () => {
    const handler = makeHandler();
    const ref = { pattern: "items.*" };
    const loopContext = { ref } as any;
    const callback = vi.fn(async () => {});

    await setLoopContext(handler, loopContext, callback);

    expect(asyncSetStatePropertyRefMock).toHaveBeenCalledWith(handler, ref, callback);
    expect(handler.loopContext).toBeNull();
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
  });
});
