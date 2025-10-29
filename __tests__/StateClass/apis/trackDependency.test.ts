/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { trackDependency } from "../../../src/StateClass/apis/trackDependency";

function makeHandler() {
  const refStack = [{ info: { pattern: "a.b" } }];
  return {
    lastRefStack: refStack[0],
    refStack,
    refIndex: 0,
    engine: {
      pathManager: {
        getters: new Set(["a.b"]),
        setters: new Set(),
        onlyGetters: new Set(["a.b"]),
        addDynamicDependency: vi.fn(),
      },
    },
  } as any;
}

describe("trackDependency", () => {
  it("異なるパターンを追加依存として登録する", () => {
    const handler = makeHandler();
    const fn = trackDependency({}, "$trackDependency", {} as any, handler);

    fn("x.y");
    expect(handler.engine.pathManager.addDynamicDependency).toHaveBeenCalledWith("a.b", "x.y");
  });

  it("lastRefStack が null の場合は例外を投げる", () => {
    const handler = makeHandler();
    handler.lastRefStack = null;
    const fn = trackDependency({}, "$trackDependency", {} as any, handler);
    expect(() => fn("x.y")).toThrowError(/Internal error: lastRefStack is null/);
  });

  it("getters に含まれない場合は依存登録しない", () => {
    const handler = makeHandler();
    handler.engine.pathManager.getters.clear();
    const fn = trackDependency({}, "$trackDependency", {} as any, handler);
    fn("x.y");
    expect(handler.engine.pathManager.addDynamicDependency).not.toHaveBeenCalled();
  });
});
