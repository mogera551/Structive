/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

import { getReadonly } from "../../src/StateClass/traps/getReadonly";
import { getWritable } from "../../src/StateClass/traps/getWritable";
import { GetByRefSymbol, SetByRefSymbol, ConnectedCallbackSymbol, DisconnectedCallbackSymbol } from "../../src/StateClass/symbols";

// Mocks for dependencies used inside traps
vi.mock("../../src/StateProperty/getResolvedPathInfo", () => ({
  getResolvedPathInfo: (prop: string) => ({ info: prop, pattern: prop })
}));
vi.mock("../../src/StatePropertyRef/StatepropertyRef", () => ({
  getStatePropertyRef: (info: any, _listIndex: any) => ({ info })
}));
vi.mock("../../src/StateClass/methods/getByRefReadonly", () => ({
  getByRefReadonly: (_t:any, ref:any) => ({ readonly: true, ref })
}));
vi.mock("../../src/StateClass/methods/getByRefWritable", () => ({
  getByRefWritable: (_t:any, ref:any) => ({ writable: true, ref })
}));
vi.mock("../../src/StateClass/methods/setByRef", () => ({
  setByRef: (_t:any, _ref:any, value:any) => ({ set: value })
}));

vi.mock("../../src/Router/Router", () => ({ getRouter: () => ({ navigate: vi.fn() }) }));
vi.mock("../../src/StateClass/apis/resolveReadonly", () => ({ resolveReadonly: () => vi.fn() }));
vi.mock("../../src/StateClass/apis/resolveWritable", () => ({ resolveWritable: () => vi.fn() }));
vi.mock("../../src/StateClass/apis/getAllReadonly", () => ({ getAllReadonly: () => vi.fn() }));
vi.mock("../../src/StateClass/apis/getAllWritable", () => ({ getAllWritable: () => vi.fn() }));
vi.mock("../../src/StateClass/apis/trackDependency", () => ({ trackDependency: () => vi.fn() }));
vi.mock("../../src/StateClass/traps/indexByIndexName", () => ({ indexByIndexName: { $1: 0, $2: 1 } }));

function makeHandler() {
  return {
    lastRefStack: { listIndex: { indexes: [10, 20] }, info: { pattern: "a.b" } },
    refStack: [ { listIndex: { indexes: [10, 20] }, info: { pattern: "a.b" } } ],
    refIndex: 0,
    engine: {
      owner: { tagName: "X-OWNER" },
      pathManager: { getters: new Set(), setters: new Set(), addDynamicDependency: vi.fn() }
    }
  } as any;
}

describe("StateClass/traps getReadonly/getWritable", () => {
  beforeEach(() => vi.clearAllMocks());

  it("$1/$2 などのインデックス特殊プロパティを返す", () => {
    const handler = makeHandler();
    const v1 = getReadonly({}, "$1", {} as any, handler);
    const v2 = getWritable({}, "$2", {} as any, handler);
    expect(v1).toBe(10);
    expect(v2).toBe(20);
  });

  it("$navigate/$component/$resolve/$getAll/$trackDependency は所定の関数や値を返す", () => {
    const handler = makeHandler();
    const nav = getReadonly({}, "$navigate", {} as any, handler);
    expect(typeof nav).toBe("function");

    const comp = getWritable({}, "$component", {} as any, handler);
    expect(comp.tagName).toBe("X-OWNER");

    expect(typeof getReadonly({}, "$resolve", {} as any, handler)).toBe("function");
    expect(typeof getWritable({}, "$getAll", {} as any, handler)).toBe("function");
    expect(typeof getWritable({}, "$trackDependency", {} as any, handler)).toBe("function");
  });

  it("通常プロパティは getResolvedPathInfo→getStatePropertyRef→getByRef* の流れ", () => {
    const handler = makeHandler();
    const r = getReadonly({}, "foo.bar", {} as any, handler);
    expect(r).toMatchObject({ readonly: true, ref: { info: "foo.bar" } });

    const w = getWritable({}, "foo.bar", {} as any, handler);
    expect(w).toMatchObject({ writable: true, ref: { info: "foo.bar" } });
  });

  it("Symbol 経由の API(GetByRef/SetByRef/connected/disconnected)", () => {
    const handler = makeHandler();
    const getByRef = getWritable({}, GetByRefSymbol, {} as any, handler);
    expect(typeof getByRef).toBe("function");

    const setByRef = getWritable({}, SetByRefSymbol, {} as any, handler);
    expect(typeof setByRef).toBe("function");

    const onConn = getWritable({}, ConnectedCallbackSymbol, {} as any, handler);
    expect(typeof onConn).toBe("function");

    const onDisc = getWritable({}, DisconnectedCallbackSymbol, {} as any, handler);
    expect(typeof onDisc).toBe("function");
  });
});
