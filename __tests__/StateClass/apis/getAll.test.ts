/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAll } from "../../../src/StateClass/apis/getAll";

const raiseErrorMock = vi.fn((detail: any) => {
  const message = typeof detail === "string" ? detail : detail?.message ?? "error";
  throw new Error(message);
});
vi.mock("../../../src/utils", () => ({
  raiseError: (detail: any) => raiseErrorMock(detail),
}));

const getStructuredPathInfoMock = vi.fn();
vi.mock("../../../src/StateProperty/getStructuredPathInfo", () => ({
  getStructuredPathInfo: (path: string) => getStructuredPathInfoMock(path),
}));

const getStatePropertyRefMock = vi.fn((info: any, listIndex: any) => ({ info, listIndex }));
vi.mock("../../../src/StatePropertyRef/StatepropertyRef", () => ({
  getStatePropertyRef: (info: any, listIndex: any) => getStatePropertyRefMock(info, listIndex),
}));

const resolveMock = vi.fn();
vi.mock("../../../src/StateClass/apis/resolve", () => ({
  resolve: (_target: any, _prop: any, _receiver: any, _handler: any) => resolveMock,
}));

const getContextListIndexMock = vi.fn();
vi.mock("../../../src/StateClass/methods/getContextListIndex", () => ({
  getContextListIndex: (handler: any, pattern: string) => getContextListIndexMock(handler, pattern),
}));

const getByRefMock = vi.fn();
vi.mock("../../../src/StateClass/methods/getByRef", () => ({
  getByRef: (...args: any[]) => getByRefMock(...args),
}));

function makeReadonlyInfo() {
  return {
    pattern: "items.*.value",
    wildcardInfos: [{ pattern: "items.*", index: 0 }],
    wildcardParentInfos: [{ pattern: "items.*", index: 0 }],
  };
}

function makeReadonlyHandler(lastPattern: string | null = "current.pattern") {
  const addDynamicDependency = vi.fn();
  const onlyGetters = new Set<string>();
  if (lastPattern) {
    onlyGetters.add(lastPattern);
  }
  const pathManager = {
    onlyGetters,
    addDynamicDependency,
  };
  const getListIndexes = vi.fn();
  const engine = { pathManager, getListIndexes };
  const handler = {
    lastRefStack: lastPattern ? { info: { pattern: lastPattern } } : null,
    engine,
  };
  return { handler: handler as any, engine, addDynamicDependency, getListIndexes, onlyGetters };
}

function makeWritableHandler() {
  const getListIndexes = vi.fn();
  const engine = {
    pathManager: {
      onlyGetters: new Set<string>(),
      addDynamicDependency: vi.fn(),
    },
    getListIndexes,
  };
  const handler = {
    lastRefStack: null,
    engine,
  };
  return { handler: handler as any, getListIndexes };
}

beforeEach(() => {
  vi.clearAllMocks();
  getStructuredPathInfoMock.mockReset();
  getStatePropertyRefMock.mockReset();
  resolveMock.mockReset();
  getContextListIndexMock.mockReset();
  getByRefMock.mockReset();
  raiseErrorMock.mockReset();
});

describe("StateClass/apis getAll (readonly)", () => {
  it("onlyGetters に含まれる場合は依存登録して全インデックスを解決", () => {
    const info = makeReadonlyInfo();
    getStructuredPathInfoMock.mockReturnValue(info);
    const { handler, getListIndexes } = makeReadonlyHandler("last.pattern");
    getListIndexes.mockReturnValue([{ index: 0 }, { index: 1 }]);
    resolveMock.mockImplementation((pattern: string, indexes: number[]) => `${pattern}[${indexes.join(",")}]`);

    const fn = getAll({}, "$getAll", {} as any, handler);
    const result = fn("items.*.value", []);

    expect(result).toEqual(["items.*.value[0]", "items.*.value[1]"]);
    expect(handler.engine.pathManager.addDynamicDependency).toHaveBeenCalledWith("last.pattern", "items.*.value");
  });

  it("onlyGetters に含まれなければ依存登録しない", () => {
    const info = makeReadonlyInfo();
    getStructuredPathInfoMock.mockReturnValue(info);
    const { handler, getListIndexes, onlyGetters } = makeReadonlyHandler("last.pattern");
    onlyGetters.clear();
    getListIndexes.mockReturnValue([{ index: 0 }]);
    resolveMock.mockReturnValue("value");

    const fn = getAll({}, "$getAll", {} as any, handler);
    fn("items.*.value", [0]);

    expect(handler.engine.pathManager.addDynamicDependency).not.toHaveBeenCalled();
  });

  it("lastRefStack が null の場合は依存登録しない", () => {
    const info = makeReadonlyInfo();
    getStructuredPathInfoMock.mockReturnValue(info);
    const { handler, getListIndexes } = makeReadonlyHandler(null);
    handler.lastRefStack = null;
    getListIndexes.mockReturnValue([{ index: 0 }]);
    resolveMock.mockReturnValue("value");

    const fn = getAll({}, "$getAll", {} as any, handler);
    fn("items.*.value", [0]);

    expect(handler.engine.pathManager.addDynamicDependency).not.toHaveBeenCalled();
  });

  it("indexes 未指定時は getContextListIndex が返した値を利用", () => {
    const info = makeReadonlyInfo();
    getStructuredPathInfoMock.mockReturnValue(info);
    const { handler, getListIndexes } = makeReadonlyHandler("last.pattern");
    getContextListIndexMock.mockReturnValue({ indexes: [1] });
    getListIndexes.mockReturnValue([{ index: 0 }, { index: 1 }, { index: 2 }]);
    resolveMock.mockImplementation((pattern: string, indexes: number[]) => `${pattern}[${indexes.join(",")}]`);

    const fn = getAll({}, "$getAll", {} as any, handler);
    const result = fn("items.*.value");

    expect(getContextListIndexMock).toHaveBeenCalledWith(handler, "items.*");
    expect(result).toEqual(["items.*.value[1]"]);
  });

  it("多段ワイルドカードを走査して全ての組み合わせを解決", () => {
    const info = {
      pattern: "groups.*.items.*.value",
      wildcardInfos: [
        { pattern: "groups.*", index: 0 },
        { pattern: "groups.*.items.*", index: 1 },
      ],
      wildcardParentInfos: [
        { pattern: "groups.*", index: 0 },
        { pattern: "groups.*.items.*", index: 1 },
      ],
    };
    getStructuredPathInfoMock.mockReturnValue(info);
    const { handler, getListIndexes } = makeReadonlyHandler("caller.pattern");
    getListIndexes
      .mockReturnValueOnce([{ index: 0 }, { index: 1 }])
      .mockReturnValueOnce([{ index: 0 }])
      .mockReturnValueOnce([{ index: 0 }, { index: 1 }]);
    resolveMock.mockImplementation((_pattern: string, indexes: number[]) => `resolved:${indexes.join("-")}`);

    const fn = getAll({}, "$getAll", {} as any, handler);
    const result = fn("groups.*.items.*.value", []);

    expect(result).toEqual(["resolved:0-0", "resolved:1-0", "resolved:1-1"]);
    expect(getStatePropertyRefMock).toHaveBeenCalled();
    expect(getByRefMock).toHaveBeenCalled();
  });

  it("wildcardInfos に null が含まれていれば例外", () => {
    const { handler } = makeReadonlyHandler("pattern");
    getStructuredPathInfoMock.mockReturnValue({
      pattern: "items.*.value",
      wildcardInfos: [null],
      wildcardParentInfos: [],
    });
    getContextListIndexMock.mockReturnValue(null);

    const fn = getAll({}, "$getAll", {} as any, handler);
    expect(() => fn("items.*.value")).toThrowError(/wildcardPattern is null/);
  });

  it("getListIndexes が null を返した場合は例外", () => {
    const info = makeReadonlyInfo();
    getStructuredPathInfoMock.mockReturnValue(info);
    const { handler, getListIndexes } = makeReadonlyHandler("pattern");
    getListIndexes.mockReturnValue(null);

    const fn = getAll({}, "$getAll", {} as any, handler);
    expect(() => fn("items.*.value", [0])).toThrowError(/ListIndex not found: items\.\*/);
    expect(raiseErrorMock).toHaveBeenCalled();
  });

  it("指定した index に対応する ListIndex が無ければ例外", () => {
    const info = makeReadonlyInfo();
    getStructuredPathInfoMock.mockReturnValue(info);
    const { handler, getListIndexes } = makeReadonlyHandler("pattern");
    getListIndexes.mockReturnValue([{ index: 0 }]);

    const fn = getAll({}, "$getAll", {} as any, handler);
    expect(() => fn("items.*.value", [1])).toThrowError(/ListIndex not found/);
    expect(raiseErrorMock).toHaveBeenCalled();
  });
});

describe("StateClass/apis getAll (writable)", () => {
  it("指定された indexes のみを解決する", () => {
    const info = makeReadonlyInfo();
    getStructuredPathInfoMock.mockReturnValue(info);
    const { handler, getListIndexes } = makeWritableHandler();
    handler.lastRefStack = { info: { pattern: "caller.pattern" } };
    handler.engine.pathManager.onlyGetters.add("caller.pattern");
    getListIndexes.mockReturnValue([{ index: 0 }, { index: 1 }]);
    resolveMock.mockImplementation((pattern: string, indexes: number[]) => `${pattern}:${indexes.join(",")}`);

    const fn = getAll({}, "$getAll", {} as any, handler);
    const result = fn("items.*.value", [1]);

    expect(result).toEqual(["items.*.value:1"]);
    expect(getListIndexes).toHaveBeenCalledTimes(1);
  });

  it("getContextListIndex が null の場合は空配列として扱い全件を解決", () => {
    const info = makeReadonlyInfo();
    getStructuredPathInfoMock.mockReturnValue(info);
    const { handler, getListIndexes } = makeWritableHandler();
    getContextListIndexMock.mockReturnValue(null);
    getListIndexes.mockReturnValue([{ index: 0 }, { index: 1 }]);
    resolveMock.mockImplementation((pattern: string, indexes: number[]) => `${pattern}:${indexes.join(",")}`);

    const fn = getAll({}, "$getAll", {} as any, handler);
    const result = fn("items.*.value");

    expect(result).toEqual(["items.*.value:0", "items.*.value:1"]);
  });

  it("各ワイルドカード解決で getStatePropertyRef と getByRef が呼ばれる", () => {
    const info = {
      pattern: "groups.*.items.*.value",
      wildcardInfos: [
        { pattern: "groups.*", index: 0 },
        { pattern: "groups.*.items.*", index: 1 },
      ],
      wildcardParentInfos: [
        { pattern: "groups.*", index: 0 },
        { pattern: "groups.*.items.*", index: 1 },
      ],
    };
    getStructuredPathInfoMock.mockReturnValue(info);
    const { handler, getListIndexes } = makeWritableHandler();
    getListIndexes
      .mockReturnValueOnce([{ index: 0 }])
      .mockReturnValueOnce([{ index: 0 }, { index: 1 }]);
    resolveMock.mockImplementation((_pattern: string, indexes: number[]) => indexes.join("/"));

    const fn = getAll({}, "$getAll", {} as any, handler);
    fn("groups.*.items.*.value", []);

    expect(getStatePropertyRefMock).toHaveBeenCalledTimes(2);
    expect(getByRefMock).toHaveBeenCalledTimes(2);
  });

  it("指定 index の ListIndex が存在しない場合は例外", () => {
    const info = makeReadonlyInfo();
    getStructuredPathInfoMock.mockReturnValue(info);
    const { handler, getListIndexes } = makeWritableHandler();
    getListIndexes.mockReturnValue([{ index: 0 }]);

    const fn = getAll({}, "$getAll", {} as any, handler);
    expect(() => fn("items.*.value", [2])).toThrowError(/ListIndex not found/);
    expect(raiseErrorMock).toHaveBeenCalled();
  });
});
