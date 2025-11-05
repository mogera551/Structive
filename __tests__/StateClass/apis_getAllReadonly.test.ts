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

describe("StateClass/apis getAll", () => {
  it("onlyGetters に含まれる場合は依存登録して全インデックスを解決", () => {
    const info = makeInfo();
    getStructuredPathInfoMock.mockReturnValue(info);
    const { handler } = makeHandler("last.pattern");
    const receiver = makeReceiver({
      "items.*": [[makeListIndex(0), makeListIndex(1)]],
    });
    resolveMock.mockImplementation((pattern: string, indexes: number[]) => `${pattern}[${indexes.join(",")}]`);

    const fn = getAll({}, "$getAll", receiver, handler);
    const result = fn("items.*.value", []);

    expect(result).toEqual(["items.*.value[0]", "items.*.value[1]"]);
    expect(handler.engine.pathManager.addDynamicDependency).toHaveBeenCalledWith("last.pattern", "items.*.value");
    expect(receiver.__spy).toHaveBeenCalledTimes(1);
  });

  it("onlyGetters に含まれなければ依存登録しない", () => {
    const info = makeInfo();
    getStructuredPathInfoMock.mockReturnValue(info);
    const { handler, onlyGetters } = makeHandler("last.pattern");
    onlyGetters.clear();
    const receiver = makeReceiver({
      "items.*": [[makeListIndex(0)]],
    });
    resolveMock.mockReturnValue("value");

    const fn = getAll({}, "$getAll", receiver, handler);
    fn("items.*.value", [0]);

    expect(handler.engine.pathManager.addDynamicDependency).not.toHaveBeenCalled();
    expect(receiver.__spy).toHaveBeenCalledTimes(1);
  });

  it("lastRefStack が null の場合は依存登録しない", () => {
    const info = makeInfo();
    getStructuredPathInfoMock.mockReturnValue(info);
    const { handler } = makeHandler(null);
    handler.lastRefStack = null;
    const receiver = makeReceiver({
      "items.*": [[makeListIndex(0)]],
    });
    resolveMock.mockReturnValue("value");

    const fn = getAll({}, "$getAll", receiver, handler);
    fn("items.*.value", [0]);

    expect(handler.engine.pathManager.addDynamicDependency).not.toHaveBeenCalled();
    expect(receiver.__spy).toHaveBeenCalledTimes(1);
  });

  it("indexes 未指定時は getContextListIndex が返した値を利用", () => {
    const info = makeInfo();
    getStructuredPathInfoMock.mockReturnValue(info);
    const { handler } = makeHandler("last.pattern");
    getContextListIndexMock.mockReturnValue({ indexes: [1] });
    const receiver = makeReceiver({
      "items.*": [[makeListIndex(0), makeListIndex(1), makeListIndex(2)]],
    });
    resolveMock.mockImplementation((pattern: string, indexes: number[]) => `${pattern}[${indexes.join(",")}]`);

    const fn = getAll({}, "$getAll", receiver, handler);
    const result = fn("items.*.value");

    expect(getContextListIndexMock).toHaveBeenCalledWith(handler, "items.*");
    expect(result).toEqual(["items.*.value[1]"]);
    expect(receiver.__spy).toHaveBeenCalledTimes(1);
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
    const { handler } = makeHandler("caller.pattern");
    const receiver = makeReceiver({
      "groups.*": [[makeListIndex(0), makeListIndex(1)]],
      "groups.*.items.*": [
        [makeListIndex(0)],
        [makeListIndex(0), makeListIndex(1)],
      ],
    });
    resolveMock.mockImplementation((_pattern: string, indexes: number[]) => `resolved:${indexes.join("-")}`);

    const fn = getAll({}, "$getAll", receiver, handler);
    const result = fn("groups.*.items.*.value", []);

    expect(result).toEqual(["resolved:0-0", "resolved:1-0", "resolved:1-1"]);
    expect(getStatePropertyRefMock).toHaveBeenCalled();
    expect(getByRefMock).toHaveBeenCalled();
    expect(receiver.__spy).toHaveBeenCalledTimes(3);
  });

  it("wildcardInfos に null が含まれていれば例外", () => {
    const { handler } = makeHandler("pattern");
    getStructuredPathInfoMock.mockReturnValue({
      pattern: "items.*.value",
      wildcardInfos: [null],
      wildcardParentInfos: [],
    });
    getContextListIndexMock.mockReturnValue(null);

    const receiver = makeReceiver({});
    const fn = getAll({}, "$getAll", receiver, handler);
    expect(() => fn("items.*.value")).toThrowError(/wildcardPattern is null/);
  });

  it("getListIndexes が null を返した場合は例外", () => {
    const info = makeInfo();
    getStructuredPathInfoMock.mockReturnValue(info);
    const { handler } = makeHandler("pattern");
    const receiver = makeReceiver({
      "items.*": null,
    });

    const fn = getAll({}, "$getAll", receiver, handler);
    expect(() => fn("items.*.value", [0])).toThrowError(/ListIndex not found: items\.\*/);
    expect(raiseErrorMock).toHaveBeenCalled();
  });

  it("指定した index に対応する ListIndex が無ければ例外", () => {
    const info = makeInfo();
    getStructuredPathInfoMock.mockReturnValue(info);
    const { handler } = makeHandler("pattern");
    const receiver = makeReceiver({
      "items.*": [[makeListIndex(0)]],
    });

    const fn = getAll({}, "$getAll", receiver, handler);
    expect(() => fn("items.*.value", [1])).toThrowError(/ListIndex not found/);
    expect(raiseErrorMock).toHaveBeenCalled();
  });
});
