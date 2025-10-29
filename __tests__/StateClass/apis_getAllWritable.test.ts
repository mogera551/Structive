/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAll } from "../../src/StateClass/apis/getAll.js";

const raiseErrorMock = vi.fn((detail: any) => {
  const message = typeof detail === "string" ? detail : detail?.message ?? "error";
  throw new Error(message);
});
vi.mock("../../src/utils.js", () => ({
  raiseError: (detail: any) => raiseErrorMock(detail),
}));

const getStructuredPathInfoMock = vi.fn();
vi.mock("../../src/StateProperty/getStructuredPathInfo.js", () => ({
  getStructuredPathInfo: (path: string) => getStructuredPathInfoMock(path),
}));

const getStatePropertyRefMock = vi.fn((info: any, listIndex: any) => ({ info, listIndex }));
vi.mock("../../src/StatePropertyRef/StatepropertyRef.js", () => ({
  getStatePropertyRef: (info: any, listIndex: any) => getStatePropertyRefMock(info, listIndex),
}));

const resolveMock = vi.fn();
vi.mock("../../src/StateClass/apis/resolve.js", () => ({
  resolve: (_target: any, _prop: any, _receiver: any, _handler: any) => resolveMock,
}));

const getContextListIndexMock = vi.fn();
vi.mock("../../src/StateClass/methods/getContextListIndex.js", () => ({
  getContextListIndex: (handler: any, pattern: string) => getContextListIndexMock(handler, pattern),
}));

const getByRefMock = vi.fn();
vi.mock("../../src/StateClass/methods/getByRef.js", () => ({
  getByRef: (...args: any[]) => getByRefMock(...args),
}));

function makeInfo() {
  return {
    pattern: "items.*.value",
    wildcardInfos: [{ pattern: "items.*", index: 0 }],
    wildcardParentInfos: [{ pattern: "items.*", index: 0 }],
  };
}

function makeHandler() {
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

describe("StateClass/apis getAll (writable scenarios)", () => {
  it("指定された indexes のみを解決する", () => {
    const info = makeInfo();
    getStructuredPathInfoMock.mockReturnValue(info);
    const { handler, getListIndexes } = makeHandler();
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
    const info = makeInfo();
    getStructuredPathInfoMock.mockReturnValue(info);
    const { handler, getListIndexes } = makeHandler();
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
    const { handler, getListIndexes } = makeHandler();
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
    const info = makeInfo();
    getStructuredPathInfoMock.mockReturnValue(info);
    const { handler, getListIndexes } = makeHandler();
    getListIndexes.mockReturnValue([{ index: 0 }]);

    const fn = getAll({}, "$getAll", {} as any, handler);
    expect(() => fn("items.*.value", [2])).toThrowError(/ListIndex not found/);
    expect(raiseErrorMock).toHaveBeenCalled();
  });
});
