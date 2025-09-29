/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getReadonly } from "../../src/StateClass/traps/getReadonly";
import { getWritable } from "../../src/StateClass/traps/getWritable";
import { set as trapSet } from "../../src/StateClass/traps/set";
import { GetByRefSymbol, SetByRefSymbol, ConnectedCallbackSymbol, DisconnectedCallbackSymbol, SetCacheableSymbol } from "../../src/StateClass/symbols";

// Mocks
const getResolvedPathInfoMock = vi.fn();
vi.mock("../../src/StateProperty/getResolvedPathInfo", () => ({
  getResolvedPathInfo: (prop: any) => getResolvedPathInfoMock(prop)
}));

const getListIndexMock = vi.fn();
vi.mock("../../src/StateClass/methods/getListIndex", () => ({
  getListIndex: (resolved: any, receiver: any, handler: any) => getListIndexMock(resolved, receiver, handler)
}));

const getStatePropertyRefMock = vi.fn((info: any, li: any) => ({ info, li }));
vi.mock("../../src/StatePropertyRef/StatepropertyRef", () => ({
  getStatePropertyRef: (info: any, li: any) => getStatePropertyRefMock(info, li)
}));

const getByRefReadonlyMock = vi.fn();
vi.mock("../../src/StateClass/methods/getByRefReadonly", () => ({
  getByRefReadonly: (target: any, ref: any, receiver: any, handler: any) => getByRefReadonlyMock(target, ref, receiver, handler)
}));

const getByRefWritableMock = vi.fn();
vi.mock("../../src/StateClass/methods/getByRefWritable", () => ({
  getByRefWritable: (target: any, ref: any, receiver: any, handler: any) => getByRefWritableMock(target, ref, receiver, handler)
}));

const setByRefMock = vi.fn();
vi.mock("../../src/StateClass/methods/setByRef", () => ({
  setByRef: (target: any, ref: any, value: any, receiver: any, handler: any) => setByRefMock(target, ref, value, receiver, handler)
}));

const connectedMock = vi.fn();
const disconnectedMock = vi.fn();
vi.mock("../../src/StateClass/apis/connectedCallback", () => ({
  connectedCallback: (...args: any[]) => connectedMock(...args),
}));
vi.mock("../../src/StateClass/apis/disconnectedCallback", () => ({
  disconnectedCallback: (...args: any[]) => disconnectedMock(...args),
}));

const resolveReadonlyMock = vi.fn();
const getAllReadonlyMock = vi.fn();
const trackDependencyMock = vi.fn();
vi.mock("../../src/StateClass/apis/resolveReadonly", () => ({
  resolveReadonly: (t:any, p:any, r:any, h:any) => resolveReadonlyMock(t,p,r,h),
}));
vi.mock("../../src/StateClass/apis/getAllReadonly", () => ({
  getAllReadonly: (t:any, p:any, r:any, h:any) => getAllReadonlyMock(t,p,r,h),
}));
vi.mock("../../src/StateClass/apis/trackDependency", () => ({
  trackDependency: (t:any, p:any, r:any, h:any) => trackDependencyMock(t,p,r,h),
}));

const resolveWritableMock = vi.fn();
const getAllWritableMock = vi.fn();
vi.mock("../../src/StateClass/apis/resolveWritable", () => ({
  resolveWritable: (t:any, p:any, r:any, h:any) => resolveWritableMock(t,p,r,h),
}));
vi.mock("../../src/StateClass/apis/getAllWritable", () => ({
  getAllWritable: (t:any, p:any, r:any, h:any) => getAllWritableMock(t,p,r,h),
}));

const setCacheableMock = vi.fn();
vi.mock("../../src/StateClass/methods/setCacheable", () => ({
  setCacheable: (h:any, cb: any) => setCacheableMock(h, cb),
}));

const navigateMock = vi.fn();
vi.mock("../../src/Router/Router", () => ({
  getRouter: () => ({ navigate: navigateMock })
}));

beforeEach(() => {
  getResolvedPathInfoMock.mockReset();
  getListIndexMock.mockReset();
  getStatePropertyRefMock.mockClear();
  getByRefReadonlyMock.mockReset();
  getByRefWritableMock.mockReset();
  setByRefMock.mockReset();
  connectedMock.mockReset();
  disconnectedMock.mockReset();
  resolveReadonlyMock.mockReset();
  getAllReadonlyMock.mockReset();
  trackDependencyMock.mockReset();
  resolveWritableMock.mockReset();
  getAllWritableMock.mockReset();
  setCacheableMock.mockReset();
  navigateMock.mockReset();

  // return callable functions by default for $-APIs
  resolveReadonlyMock.mockReturnValue(() => {});
  getAllReadonlyMock.mockReturnValue(() => {});
  trackDependencyMock.mockReturnValue(() => {});
  resolveWritableMock.mockReturnValue(() => {});
  getAllWritableMock.mockReturnValue(() => {});
});

function makeReadonlyHandler() {
  return { 
    engine: { owner: { id: 1 } }, 
    lastRefStack: { listIndex: { indexes: [10,20,30] } },
    refStack: [ { listIndex: { indexes: [10,20,30] } } ], 
    refIndex: 0 
  } as any;
}
function makeWritableHandler() {
  return { 
    engine: { owner: { id: 2 } }, 
    lastRefStack: { listIndex: { indexes: [1,2,3] } },
    refStack: [ { listIndex: { indexes: [1,2,3] } } ], 
    refIndex: 0 
  } as any;
}

describe("StateClass traps get/set", () => {
  it("getReadonly: $resolve/$getAll/$trackDependency/$navigate/$component", () => {
    const handler = makeReadonlyHandler();
    const proxy = {} as any; const target = {};
    // $resolve
    const r1 = getReadonly(target, "$resolve", proxy, handler);
    const r2 = getReadonly(target, "$getAll", proxy, handler);
    const r3 = getReadonly(target, "$trackDependency", proxy, handler);
    const nav = getReadonly(target, "$navigate", proxy, handler) as any;
    const comp = getReadonly(target, "$component", proxy, handler);

    expect(typeof r1).toBe("function");
    expect(typeof r2).toBe("function");
    expect(typeof r3).toBe("function");
    expect(comp).toEqual({ id: 1 });
    nav("/x");
    expect(navigateMock).toHaveBeenCalledWith("/x");
  });

  it("getReadonly: 通常文字プロパティは getResolvedPathInfo → getListIndex → getByRef", () => {
    const handler = makeReadonlyHandler();
    const proxy = {} as any; const target = {};
    const resolved = { info: { pattern: "p" } } as any;
    getResolvedPathInfoMock.mockReturnValue(resolved);
    getListIndexMock.mockReturnValue({ li: 0 });
    getByRefReadonlyMock.mockReturnValue("VAL");

    const val = getReadonly(target, "foo", proxy, handler);
    expect(getResolvedPathInfoMock).toHaveBeenCalledWith("foo");
    expect(getListIndexMock).toHaveBeenCalledWith(resolved, proxy, handler);
    expect(getStatePropertyRefMock).toHaveBeenCalledWith(resolved.info, { li: 0 });
    expect(val).toBe("VAL");
  });

  it("getReadonly: $1〜$9 は ref の listIndex/indexes から返す", () => {
    const handler = makeReadonlyHandler();
    const proxy = {} as any; const target = {};
    expect(getReadonly(target, "$1", proxy, handler)).toBe(10);
    expect(getReadonly(target, "$2", proxy, handler)).toBe(20);
    expect(() => getReadonly(target, "$9", proxy, handler)).toThrow();
  });

  it("getReadonly: symbol は GetByRefSymbol/SetCacheableSymbol/Reflect.get", () => {
    const handler = makeReadonlyHandler();
    const proxy = {} as any; const target = {};

    const byRef = getReadonly(target, GetByRefSymbol, proxy, handler) as any;
    getByRefReadonlyMock.mockReturnValue("BYREF");
    const ret = byRef({ k: 1 } as any);
    expect(ret).toBe("BYREF");

    const setCache = getReadonly(target, SetCacheableSymbol, proxy, handler) as any;
    let ran = false;
    setCache(() => { ran = true; });
    expect(setCacheableMock).toHaveBeenCalled();
    expect(ran).toBe(false); // setCacheable 内での実行制御に依存するためここでは呼ばれたことのみ検証

    const sym = Symbol("x");
    (target as any)[sym] = 123;
    expect(getReadonly(target, sym, proxy, handler)).toBe(123);
  });

  it("getWritable: $系と通常、symbol 経由の各ケース", () => {
    const handler = makeWritableHandler();
    const proxy = {} as any; const target = {};

    // $resolve/$getAll/$trackDependency/$navigate/$component
    const a = getWritable(target, "$resolve", proxy, handler);
    const b = getWritable(target, "$getAll", proxy, handler);
    const c = getWritable(target, "$trackDependency", proxy, handler);
    const nav = getWritable(target, "$navigate", proxy, handler) as any;
    const comp = getWritable(target, "$component", proxy, handler);
    expect(typeof a).toBe("function");
    expect(typeof b).toBe("function");
    expect(typeof c).toBe("function");
    expect(comp).toEqual({ id: 2 });
    nav("/to");
    expect(navigateMock).toHaveBeenCalledWith("/to");

    // 通常
    const resolved = { info: { pattern: "p" } } as any;
    getResolvedPathInfoMock.mockReturnValue(resolved);
    getListIndexMock.mockReturnValue({ li: 1 });
    getByRefWritableMock.mockReturnValue("WVAL");
    expect(getWritable(target, "bar", proxy, handler)).toBe("WVAL");

    // symbols
    getByRefWritableMock.mockReturnValue("WB");
    const sByRef = getWritable(target, GetByRefSymbol, proxy, handler) as any;
    expect(sByRef({} as any)).toBe("WB");

    setByRefMock.mockReturnValue("SETB");
    const sSetRef = getWritable(target, SetByRefSymbol, proxy, handler) as any;
    expect(sSetRef({} as any, 3)).toBe("SETB");

    const cc = getWritable(target, ConnectedCallbackSymbol, proxy, handler) as any;
    cc();
    expect(connectedMock).toHaveBeenCalled();

    const dc = getWritable(target, DisconnectedCallbackSymbol, proxy, handler) as any;
    dc();
    expect(disconnectedMock).toHaveBeenCalled();

    const sym = Symbol("y");
    (target as any)[sym] = 555;
    expect(getWritable(target, sym, proxy, handler)).toBe(555);
  });

  it("set trap: 文字列プロパティは setByRef、symbol は Reflect.set", () => {
    const handler = makeWritableHandler();
    const proxy = {} as any; const target: any = {};

    const resolved = { info: { pattern: "p" } } as any;
    getResolvedPathInfoMock.mockReturnValue(resolved);
    getListIndexMock.mockReturnValue({ li: 2 });
    setByRefMock.mockReturnValue(true);

    expect(trapSet(target, "xxx", 10, proxy, handler)).toBe(true);
    expect(getStatePropertyRefMock).toHaveBeenCalledWith(resolved.info, { li: 2 });

    const sym = Symbol("z");
    expect(trapSet(target, sym, 123, proxy, handler)).toBe(true);
    // Reflect.set with receiver sets the property on receiver when target doesn't have it
    expect(proxy[sym]).toBe(123);
  });
});
