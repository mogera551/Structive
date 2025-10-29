import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkDependency } from "../../../src/StateClass/methods/checkDependency";

function createHandler(overrides: Partial<any> = {}) {
  const engine = {
    pathManager: {
      onlyGetters: new Set<string>(),
      addDynamicDependency: vi.fn(),
    },
  } as any;
  const base = {
    engine,
    refStack: [],
    refIndex: -1,
    lastRefStack: null,
  };
  const result = Object.assign(base, overrides);
  // lastRefStackがovverridesにない場合は、refStackとrefIndexから設定
  if (!overrides.lastRefStack && result.refIndex >= 0 && result.refStack[result.refIndex]) {
    result.lastRefStack = result.refStack[result.refIndex];
  }
  return result;
}

function refOf(pattern: string) {
  return { info: { pattern } } as any;
}

describe("StateClass/methods: checkDependency", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("refIndex < 0 の場合は何もしない", () => {
    const handler = createHandler();
    const ref = refOf("a.b");
    checkDependency(handler as any, ref as any);
    expect(handler.engine.pathManager.addDynamicDependency).not.toHaveBeenCalled();
  });

  it("lastInfo が null の場合は何もしない", () => {
    const handler = createHandler({ refIndex: 0, refStack: [ { info: null } ] });
    const ref = refOf("a.b");
    checkDependency(handler as any, ref as any);
    expect(handler.engine.pathManager.addDynamicDependency).not.toHaveBeenCalled();
  });

  it("onlyGetters に含まれない場合は何もしない", () => {
    const lastInfo = { pattern: "x.y" };
    const handler = createHandler({ refIndex: 0, refStack: [ { info: lastInfo } ] });
    const ref = refOf("a.b");
    // getters には含まれない、setters にも含まれない
    checkDependency(handler as any, ref as any);
    expect(handler.engine.pathManager.addDynamicDependency).not.toHaveBeenCalled();
  });

  it("同一パターンの場合は何もしない", () => {
    const lastInfo = { pattern: "x.y" };
    const handler = createHandler({ refIndex: 0, refStack: [ { info: lastInfo } ] });
    handler.engine.pathManager.onlyGetters.add("x.y");
    const ref = refOf("x.y");
    checkDependency(handler as any, ref as any);
    expect(handler.engine.pathManager.addDynamicDependency).not.toHaveBeenCalled();
  });

  it("onlyGetters にあり、異なるパターンなら addDynamicDependency を呼ぶ", () => {
    const lastInfo = { pattern: "x.y" };
    const handler = createHandler({ refIndex: 0, refStack: [ { info: lastInfo } ] });
    handler.engine.pathManager.onlyGetters.add("x.y");
    const ref = refOf("a.b");
    checkDependency(handler as any, ref as any);
    expect(handler.engine.pathManager.addDynamicDependency).toHaveBeenCalledTimes(1);
    expect(handler.engine.pathManager.addDynamicDependency).toHaveBeenCalledWith("x.y", "a.b");
  });
});
