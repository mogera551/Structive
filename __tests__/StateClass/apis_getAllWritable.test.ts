/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAll } from "../../src/StateClass/apis/getAll";
import { GetListIndexesByRefSymbol } from "../../src/StateClass/symbols";

const raiseErrorMock = vi.fn((detail: any) => {
  const message = typeof detail === "string" ? detail : detail?.message ?? "error";
  throw new Error(message);
});
vi.mock("../../src/utils", () => ({
  raiseError: (detail: any) => raiseErrorMock(detail),
}));

const getStructuredPathInfoMock = vi.fn();
vi.mock("../../src/StateProperty/getStructuredPathInfo", () => ({
  getStructuredPathInfo: (path: string) => getStructuredPathInfoMock(path),
}));

const getStatePropertyRefMock = vi.fn((info: any, listIndex: any) => ({ info, listIndex }));
vi.mock("../../src/StatePropertyRef/StatepropertyRef", () => ({
  getStatePropertyRef: (info: any, listIndex: any) => getStatePropertyRefMock(info, listIndex),
}));

const resolveMock = vi.fn();
vi.mock("../../src/StateClass/apis/resolve", () => ({
  resolve: (_target: any, _prop: any, _receiver: any, _handler: any) => resolveMock,
}));

const getContextListIndexMock = vi.fn();
vi.mock("../../src/StateClass/methods/getContextListIndex", () => ({
  getContextListIndex: (handler: any, pattern: string) => getContextListIndexMock(handler, pattern),
}));

const getByRefMock = vi.fn();
vi.mock("../../src/StateClass/methods/getByRef", () => ({
  getByRef: (...args: any[]) => getByRefMock(...args),
}));

type ListIndexEntry = { index: number; parentListIndex?: any; hash?: string };

function makeListIndex(index: number, overrides: Partial<ListIndexEntry> = {}): ListIndexEntry {
  return { index, ...overrides };
}

function makeReceiver(patternMap: Record<string, ListIndexEntry[] | ListIndexEntry[][] | null>) {
  const queues = new Map<string, (ListIndexEntry[] | null)[]>();
  for (const [pattern, value] of Object.entries(patternMap)) {
    if (value === null) {
      queues.set(pattern, [null]);
    } else if (Array.isArray(value) && value.length > 0 && Array.isArray(value[0])) {
      queues.set(pattern, (value as ListIndexEntry[][]).map((entries) => entries.map((entry) => ({ ...entry }))));
    } else {
      queues.set(pattern, [(value as ListIndexEntry[]).map((entry) => ({ ...entry }))]);
    }
  }
  const spy = vi.fn((ref: any) => {
    const pattern = ref.info.pattern;
    const values = queues.get(pattern);
    if (!values || values.length === 0) {
      return null;
    }
    const next = values.length === 1 ? values[0] : values.shift()!;
    return next === null ? null : next.map((entry) => ({ ...entry }));
  });
  const receiver: any = {
    [GetListIndexesByRefSymbol]: spy,
    __spy: spy,
  };
  return receiver;
}

function makeInfo() {
  return {
    pattern: "items.*.value",
    wildcardInfos: [{ pattern: "items.*", index: 0 }],
    wildcardParentInfos: [{ pattern: "items.*", index: 0 }],
  };
}

function makeHandler(lastPattern: string | null = "current.pattern") {
  const addDynamicDependency = vi.fn();
  const onlyGetters = new Set<string>();
  if (lastPattern) {
    onlyGetters.add(lastPattern);
  }
  const pathManager = {
    onlyGetters,
    addDynamicDependency,
  };
  const engine = { pathManager };
  const handler = {
    lastRefStack: lastPattern ? { info: { pattern: lastPattern } } : null,
    engine,
  };
  return { handler: handler as any, engine, addDynamicDependency, onlyGetters };
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

describe("StateClass/apis getAll (writable)", () => {
  it("指定された indexes のみを解決する", () => {
    const info = makeInfo();
    getStructuredPathInfoMock.mockReturnValue(info);
    const { handler } = makeHandler("last.pattern");
    const receiver = makeReceiver({
      "items.*": [[makeListIndex(0), makeListIndex(1)]],
    });
    resolveMock.mockImplementation((pattern: string, indexes: number[]) => `${pattern}:${indexes.join(",")}`);

    const fn = getAll({}, "$getAll", receiver, handler);
    const result = fn("items.*.value", [1]);

    expect(result).toEqual(["items.*.value:1"]);
    expect(receiver.__spy).toHaveBeenCalledTimes(1);
  });

  it("indexes 未指定で全件を解決する", () => {
    const info = makeInfo();
    getStructuredPathInfoMock.mockReturnValue(info);
    const { handler } = makeHandler("last.pattern");
    const receiver = makeReceiver({
      "items.*": [[makeListIndex(0), makeListIndex(1)]],
    });
    getContextListIndexMock.mockReturnValue(null);
    resolveMock.mockImplementation((pattern: string, indexes: number[]) => `${pattern}:${indexes.join(",")}`);

    const fn = getAll({}, "$getAll", receiver, handler);
    const result = fn("items.*.value");

    expect(result).toEqual(["items.*.value:0", "items.*.value:1"]);
    expect(receiver.__spy).toHaveBeenCalledTimes(1);
  });

  it("多段ワイルドカードでも全組み合わせを解決", () => {
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
    const { handler } = makeHandler("caller.pattern");
    const receiver = makeReceiver({
      "groups.*": [[makeListIndex(0)]],
      "groups.*.items.*": [
        [makeListIndex(0), makeListIndex(1)],
      ],
    });
    resolveMock.mockImplementation((_pattern: string, indexes: number[]) => indexes.join("/"));

    const fn = getAll({}, "$getAll", receiver, handler);
    const result = fn("groups.*.items.*.value", []);

    expect(result).toEqual(["0/0", "0/1"]);
    expect(getStatePropertyRefMock).toHaveBeenCalled();
    expect(getByRefMock).toHaveBeenCalled();
    expect(receiver.__spy).toHaveBeenCalledTimes(2);
  });

  it("指定 index の ListIndex が存在しない場合は例外", () => {
    const info = makeInfo();
    getStructuredPathInfoMock.mockReturnValue(info);
    const { handler } = makeHandler("pattern");
    const receiver = makeReceiver({
      "items.*": [[makeListIndex(0)]],
    });

    const fn = getAll({}, "$getAll", receiver, handler);
    expect(() => fn("items.*.value", [2])).toThrowError(/ListIndex not found/);
    expect(raiseErrorMock).toHaveBeenCalled();
  });
});
