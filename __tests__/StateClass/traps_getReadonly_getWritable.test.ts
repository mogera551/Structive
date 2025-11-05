/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { get } from "../../src/StateClass/traps/get.js";
import { ConnectedCallbackSymbol, DisconnectedCallbackSymbol, GetByRefSymbol, GetListIndexesByRefSymbol, SetByRefSymbol } from "../../src/StateClass/symbols";

const raiseErrorMock = vi.fn((detail: any) => {
  const message = typeof detail === "string" ? detail : detail?.message ?? "error";
  throw new Error(message);
});
vi.mock("../../src/utils.js", () => ({
  raiseError: (detail: any) => raiseErrorMock(detail),
}));

const getRouterMock = vi.fn();
vi.mock("../../src/Router/Router.js", () => ({
  getRouter: () => getRouterMock(),
}));

const getResolvedPathInfoMock = vi.fn();
vi.mock("../../src/StateProperty/getResolvedPathInfo.js", () => ({
  getResolvedPathInfo: (prop: string) => getResolvedPathInfoMock(prop),
}));

const getListIndexMock = vi.fn();
vi.mock("../../src/StateClass/methods/getListIndex.js", () => ({
  getListIndex: (...args: any[]) => getListIndexMock(...args),
}));

const getListIndexesByRefMock = vi.fn();
vi.mock("../../src/StateClass/methods/getListIndexesByRef.js", () => ({
  getListIndexesByRef: (...args: any[]) => getListIndexesByRefMock(...args),
}));

const getStatePropertyRefMock = vi.fn();
vi.mock("../../src/StatePropertyRef/StatepropertyRef.js", () => ({
  getStatePropertyRef: (info: any, listIndex: any) => getStatePropertyRefMock(info, listIndex),
}));

const getByRefMock = vi.fn();
vi.mock("../../src/StateClass/methods/getByRef.js", () => ({
  getByRef: (...args: any[]) => getByRefMock(...args),
}));

const setByRefMock = vi.fn();
vi.mock("../../src/StateClass/methods/setByRef.js", () => ({
  setByRef: (...args: any[]) => setByRefMock(...args),
}));

const resolveMock = vi.fn();
vi.mock("../../src/StateClass/apis/resolve.js", () => ({
  resolve: (...args: any[]) => resolveMock(...args),
}));

const getAllMock = vi.fn();
vi.mock("../../src/StateClass/apis/getAll.js", () => ({
  getAll: (...args: any[]) => getAllMock(...args),
}));

const trackDependencyMock = vi.fn();
vi.mock("../../src/StateClass/apis/trackDependency.js", () => ({
  trackDependency: (...args: any[]) => trackDependencyMock(...args),
}));

const connectedCallbackMock = vi.fn();
vi.mock("../../src/StateClass/apis/connectedCallback.js", () => ({
  connectedCallback: (...args: any[]) => connectedCallbackMock(...args),
}));

const disconnectedCallbackMock = vi.fn();
vi.mock("../../src/StateClass/apis/disconnectedCallback.js", () => ({
  disconnectedCallback: (...args: any[]) => disconnectedCallbackMock(...args),
}));

vi.mock("../../src/StateClass/traps/indexByIndexName.js", () => ({
  indexByIndexName: { $1: 0, $2: 1 },
}));

function makeHandler(symbols: PropertyKey[] = []) {
  return {
    lastRefStack: { listIndex: { indexes: [10, 20] }, info: { pattern: "a.b" } },
    engine: { owner: { tagName: "X-OWNER" } },
    symbols: new Set(symbols),
  } as any;
}

beforeEach(() => {
  raiseErrorMock.mockReset();
  getRouterMock.mockReset();
  getResolvedPathInfoMock.mockReset();
  getListIndexMock.mockReset();
  getListIndexesByRefMock.mockReset();
  getStatePropertyRefMock.mockReset();
  getByRefMock.mockReset();
  setByRefMock.mockReset();
  resolveMock.mockReset();
  getAllMock.mockReset();
  trackDependencyMock.mockReset();
  connectedCallbackMock.mockReset();
  disconnectedCallbackMock.mockReset();
});

describe("StateClass/traps get", () => {
  it("$1/$2 などのインデックスアクセスを返す", () => {
    const handler = makeHandler();
    expect(get({}, "$1", {} as any, handler)).toBe(10);
    expect(get({}, "$2", {} as any, handler)).toBe(20);
  });

  it("$resolve/$getAll/$trackDependency/$navigate/$component を解決", () => {
    const handler = makeHandler();
    resolveMock.mockReturnValue(() => "resolve");
    getAllMock.mockReturnValue(() => "all");
    trackDependencyMock.mockReturnValue(() => "track");
    const navigateMock = vi.fn();
    getRouterMock.mockReturnValue({ navigate: navigateMock });

    const resolveFn = get({}, "$resolve", {} as any, handler);
    const getAllFn = get({}, "$getAll", {} as any, handler);
    const trackFn = get({}, "$trackDependency", {} as any, handler);
    const navigateFn = get({}, "$navigate", {} as any, handler);
    const component = get({}, "$component", {} as any, handler);

    expect(resolveFn()).toBe("resolve");
    expect(getAllFn()).toBe("all");
    expect(trackFn()).toBe("track");
    navigateFn("/path");
    expect(navigateMock).toHaveBeenCalledWith("/path");
    expect(component).toEqual(handler.engine.owner);
  });

  it("$インデックスで値が存在しない場合はエラーを投げる", () => {
    const handler = makeHandler();
    handler.lastRefStack = { listIndex: { indexes: [123] } } as any;

    expect(() => get({}, "$2", {} as any, handler)).toThrowError(
      "ListIndex not found: $2"
    );
    expect(raiseErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({ code: "LIST-201", context: expect.any(Object) })
    );
  });

  it("listIndex が存在しない場合もエラーを投げる", () => {
    const handler = makeHandler();
    handler.lastRefStack = undefined as any;

    expect(() => get({}, "$1", {} as any, handler)).toThrowError(
      "ListIndex not found: $1"
    );
    expect(raiseErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({ context: { prop: "$1", indexes: null, index: 0 } })
    );
  });

  it("通常プロパティは解決後に getByRef を呼ぶ", () => {
    const handler = makeHandler();
    getResolvedPathInfoMock.mockReturnValue({ info: { pattern: "foo.bar" } });
    getListIndexMock.mockReturnValue({ index: 1 });
    getStatePropertyRefMock.mockReturnValue({ info: { pattern: "foo.bar" }, listIndex: { index: 1 } });
    getByRefMock.mockReturnValue("VALUE");

    const value = get({} as any, "foo.bar", {} as any, handler);

    expect(value).toBe("VALUE");
    expect(getResolvedPathInfoMock).toHaveBeenCalledWith("foo.bar");
    expect(getListIndexMock).toHaveBeenCalled();
    expect(getStatePropertyRefMock).toHaveBeenCalled();
    expect(getByRefMock).toHaveBeenCalled();
  });

  it("シンボル API を返す (GetByRef/SetByRef/connected/disconnected)", () => {
    const handler = makeHandler([GetByRefSymbol, SetByRefSymbol, ConnectedCallbackSymbol, DisconnectedCallbackSymbol]);
    const ref = { info: { pattern: "x" } } as any;
    const target = {};
    const receiver = {};

    const getByRefFn = get(target, GetByRefSymbol, receiver as any, handler);
    getByRefFn(ref);
    expect(getByRefMock).toHaveBeenCalledWith(target, ref, receiver, handler);

    const setByRefFn = get(target, SetByRefSymbol, receiver as any, handler);
    setByRefFn(ref, "value");
    expect(setByRefMock).toHaveBeenCalledWith(target, ref, "value", receiver, handler);

    const connectedFn = get(target, ConnectedCallbackSymbol, receiver as any, handler);
    connectedFn();
    expect(connectedCallbackMock).toHaveBeenCalled();

    const disconnectedFn = get(target, DisconnectedCallbackSymbol, receiver as any, handler);
    disconnectedFn();
    expect(disconnectedCallbackMock).toHaveBeenCalled();
  });

  it("GetListIndexesByRefSymbol は getListIndexesByRef を呼ぶ", () => {
    const handler = makeHandler([GetListIndexesByRefSymbol]);
    const ref = { info: { pattern: "x" } } as any;
    const target = {};
    const receiver = {};

    const getListIndexesFn = get(target, GetListIndexesByRefSymbol, receiver as any, handler);
    getListIndexesFn(ref);

    expect(getListIndexesByRefMock).toHaveBeenCalledWith(target, ref, receiver, handler);
  });

  it("登録されていないシンボルは Reflect.get の結果を返す", () => {
    const custom = Symbol("custom");
    const value = { foo: "bar" };
    const target = { [custom]: value };
    const handler = makeHandler();

    const result = get(target, custom, {} as any, handler);

    expect(result).toBe(value);
  });
});
