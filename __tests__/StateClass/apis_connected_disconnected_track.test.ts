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

  it("trackDependency: lastRefStack が null の場合は例外を投げる", () => {
    const handler = makeHandler();
    handler.lastRefStack = null; // lastRefStack を null に設定
    const fn = trackDependency({}, "$trackDependency", {} as any, handler);

    expect(() => {
      fn("x.y");
    }).toThrowError(/Internal error: lastRefStack is null/);
  });

  it("trackDependency: getters に含まれない場合は依存登録しない", () => {
    const handler = makeHandler();
    handler.engine.pathManager.getters.clear(); // getters から除外
    const fn = trackDependency({}, "$trackDependency", {} as any, handler);

    fn("x.y");
    expect(handler.engine.pathManager.addDynamicDependency).not.toHaveBeenCalled();
  });

  it("trackDependency: 同一パターンの場合は依存登録しない", () => {
    const handler = makeHandler();
    const fn = trackDependency({}, "$trackDependency", {} as any, handler);

    fn("a.b"); // lastInfo.pattern("a.b") と同一
    expect(handler.engine.pathManager.addDynamicDependency).not.toHaveBeenCalled();
  });
});
