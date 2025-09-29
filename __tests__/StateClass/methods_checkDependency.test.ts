import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkDependency } from "../../src/StateClass/methods/checkDependency";

function createHandler(overrides: Partial<any> = {}) {
  const engine = {
    pathManager: {
      getters: new Set<string>(),
      setters: new Set<string>(),
      addDynamicDependency: vi.fn(),
    },
  } as any;
  const base = {
    engine,
    refStack: [],
    refIndex: -1,
  };
  return Object.assign(base, overrides);
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

  it("getters に含まれない場合は何もしない", () => {
    const lastInfo = { pattern: "x.y" };
    const handler = createHandler({ refIndex: 0, refStack: [ { info: lastInfo } ] });
    const ref = refOf("a.b");
    // getters には含まれない、setters にも含まれない
    checkDependency(handler as any, ref as any);
    expect(handler.engine.pathManager.addDynamicDependency).not.toHaveBeenCalled();
  });

  it("setters に含まれる場合は何もしない", () => {
    const lastInfo = { pattern: "x.y" };
    const handler = createHandler({ refIndex: 0, refStack: [ { info: lastInfo } ] });
    handler.engine.pathManager.getters.add("x.y");
    handler.engine.pathManager.setters.add("x.y");
    const ref = refOf("a.b");
    checkDependency(handler as any, ref as any);
    expect(handler.engine.pathManager.addDynamicDependency).not.toHaveBeenCalled();
  });

  it("同一パターンの場合は何もしない", () => {
    const lastInfo = { pattern: "x.y" };
    const handler = createHandler({ refIndex: 0, refStack: [ { info: lastInfo } ] });
    handler.engine.pathManager.getters.add("x.y");
    const ref = refOf("x.y");
    checkDependency(handler as any, ref as any);
    expect(handler.engine.pathManager.addDynamicDependency).not.toHaveBeenCalled();
  });

  it("getters にあり、setters に無く、異なるパターンなら addDynamicDependency を呼ぶ", () => {
    const lastInfo = { pattern: "x.y" };
    const handler = createHandler({ refIndex: 0, refStack: [ { info: lastInfo } ] });
    handler.engine.pathManager.getters.add("x.y");
    const ref = refOf("a.b");
    checkDependency(handler as any, ref as any);
    expect(handler.engine.pathManager.addDynamicDependency).toHaveBeenCalledTimes(1);
    expect(handler.engine.pathManager.addDynamicDependency).toHaveBeenCalledWith("x.y", "a.b");
  });
});
