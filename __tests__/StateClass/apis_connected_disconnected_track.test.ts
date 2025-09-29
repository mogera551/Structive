/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { connectedCallback } from "../../src/StateClass/apis/connectedCallback";
import { disconnectedCallback } from "../../src/StateClass/apis/disconnectedCallback";
import { trackDependency } from "../../src/StateClass/apis/trackDependency";

function makeHandler() {
  const refStack = [ { info: { pattern: "a.b" } } ];
  return {
    lastRefStack: refStack[0],
    refStack,
    refIndex: 0,
    engine: {
      pathManager: {
        getters: new Set(["a.b"]),
        setters: new Set(),
        addDynamicDependency: vi.fn(),
      }
    }
  } as any;
}

describe("StateClass/apis connected/disconnected/trackDependency", () => {
  it("connectedCallback: target に $connectedCallback があれば呼ぶ", async () => {
    const receiver = {} as any;
    const called = vi.fn();
    const target = { $connectedCallback: called } as any;
    await connectedCallback(target, "$connectedCallback", receiver, {} as any);
    expect(called).toHaveBeenCalled();
  });

  it("disconnectedCallback: target に $disconnectedCallback があれば呼ぶ", async () => {
    const receiver = {} as any;
    const called = vi.fn();
    const target = { $disconnectedCallback: called } as any;
    await disconnectedCallback(target, "$disconnectedCallback", receiver, {} as any);
    expect(called).toHaveBeenCalled();
  });

  it("trackDependency: 異なるパターンを追加依存として登録する", () => {
    const handler = makeHandler();
    const fn = trackDependency({}, "$trackDependency", {} as any, handler);

    fn("x.y"); // lastInfo.pattern("a.b") とは異なる
    expect(handler.engine.pathManager.addDynamicDependency).toHaveBeenCalledWith("a.b", "x.y");
  });
});
