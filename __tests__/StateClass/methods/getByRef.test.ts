import { describe, it, expect, vi, beforeEach } from "vitest";
import { getByRef } from "../../../src/StateClass/methods/getByRef";

const raiseErrorMock = vi.fn((detail: any) => {
  const message = typeof detail === "string" ? detail : detail?.message ?? "error";
  throw new Error(message);
});
vi.mock("../../../src/utils", () => ({
  raiseError: (detail: any) => raiseErrorMock(detail),
}));

const checkDependencyMock = vi.fn();
vi.mock("../../../src/StateClass/methods/checkDependency", () => ({
  checkDependency: (...args: any[]) => checkDependencyMock(...args),
}));

vi.mock("../../../src/StateClass/methods/setStatePropertyRef", () => ({
  setStatePropertyRef: vi.fn(),
}));

function createGetterSet(values: string[] = []) {
  const base = new Set(values);
  return {
    has: (value: string) => base.has(value),
    add: (value: string) => {
      base.add(value);
    },
    intersection: (other: Set<string>) => {
      const result = new Set<string>();
      for (const value of base) {
        if (other.has(value)) {
          result.add(value);
        }
      }
      return result;
    },
  };
}

function makeInfo(pattern: string, wildcardCount = 0, cumulativePaths: string[] = []): any {
  return {
    pattern,
    wildcardCount,
    cumulativePathSet: new Set<string>(cumulativePaths),
  };
}

function makeRef(pattern: string, wildcardCount = 0, cumulativePaths: string[] = []) {
  return { info: makeInfo(pattern, wildcardCount, cumulativePaths) } as any;
}

function makeHandler(options: { version?: number; revision?: number } = {}) {
  const { version = 1, revision = 0 } = options;
  const getters = createGetterSet();
  const lists = new Set<string>();
  const cache = new Map<any, any>();
  const stateOutput = {
    startsWith: vi.fn().mockReturnValue(false),
    get: vi.fn(),
  };
  const handler = {
    engine: {
      pathManager: {
        getters,
        lists,
      },
      cache,
      stateOutput,
    },
    updater: {
      version,
      revision,
      revisionByUpdatedPath: new Map<string, number>(),
      calcListDiff: vi.fn(),
    },
  refStack: [null] as any[],
    refIndex: -1,
    lastRefStack: null,
  };
  return { handler: handler as any, cache, getters, lists, stateOutput };
}

beforeEach(() => {
  vi.clearAllMocks();
  raiseErrorMock.mockReset();
  checkDependencyMock.mockReset();
});

describe("StateClass/methods getByRef (cache & readonly)", () => {
  it("キャッシュがヒットした場合でも依存関係を登録して値を返す", () => {
    const { handler, cache } = makeHandler();
    const ref = makeRef("items.*", 1);
    cache.set(ref, { value: "CACHED", version: 1, revision: 0 });

    const value = getByRef({}, ref, {} as any, handler);

    expect(value).toBe("CACHED");
    expect(checkDependencyMock).toHaveBeenCalledTimes(1);
    expect(checkDependencyMock).toHaveBeenCalledWith(handler, ref);
  });

  it("revision 情報がありつつ変更が無い場合でも依存関係を登録する", () => {
    const { handler, cache } = makeHandler({ version: 2, revision: 3 });
    const ref = makeRef("users.*", 1);
    cache.set(ref, { value: "UNCHANGED", version: 2, revision: 3 });
    handler.updater.revisionByUpdatedPath.set("users.*", 3);

    const value = getByRef({}, ref, {} as any, handler);

    expect(value).toBe("UNCHANGED");
    expect(checkDependencyMock).toHaveBeenCalledTimes(1);
    expect(checkDependencyMock).toHaveBeenCalledWith(handler, ref);
  });

  it("stateOutput.startsWith が true で交差が無い場合は stateOutput.get を返す", () => {
    const { handler, stateOutput, cache, getters } = makeHandler();
    const ref = makeRef("foo.bar", 0, ["foo"]);
    stateOutput.startsWith.mockReturnValue(true);
    stateOutput.get.mockReturnValue("FROM_OUTPUT");
    getters.add("foo.bar");

    const value = getByRef({}, ref, {} as any, handler);

    expect(value).toBe("FROM_OUTPUT");
    expect(stateOutput.get).toHaveBeenCalledWith(ref);
    expect(checkDependencyMock).toHaveBeenCalledTimes(1);
  expect(cache.get(ref)).toBeUndefined();
  });

  it("target にプロパティが存在する場合は Reflect.get の結果を返しキャッシュへ保存", () => {
    const { handler, getters, cache, lists } = makeHandler();
    const ref = makeRef("items", 0, []);
    getters.add("items");
    lists.add("items");
    const target = { items: [1, 2, 3] };

    const result = getByRef(target, ref, target as any, handler);

    expect(result).toEqual([1, 2, 3]);
    expect(cache.get(ref)).toEqual({ value: [1, 2, 3], version: 1, revision: 0 });
    expect(handler.updater.calcListDiff).toHaveBeenCalledWith(ref, [1, 2, 3]);
    expect(handler.lastRefStack).toBeNull();
  });

  it("プロパティが存在しない場合は raiseError を投げる", () => {
    const { handler } = makeHandler();
    const ref = makeRef("missing", 0, []);

    expect(() => getByRef({}, ref, {} as any, handler)).toThrowError(/Property "missing" does not exist/);
    expect(raiseErrorMock).toHaveBeenCalled();
  });
});

describe("StateClass/methods getByRef (revision scenarios)", () => {
  it("revision が進んだ場合は新しい値でキャッシュを更新", () => {
    const { handler, cache, getters, lists } = makeHandler({ version: 2, revision: 1 });
    const ref = makeRef("items", 0, []);
    getters.add("items");
    lists.add("items");
    cache.set(ref, { value: "OLD", version: 1, revision: 0 });
    handler.updater.revisionByUpdatedPath.set("items", 1);
    const target = { items: 99 };

    const value = getByRef(target, ref, target as any, handler);

    expect(value).toBe(99);
    expect(cache.get(ref)).toEqual({ value: 99, version: 2, revision: 1 });
    expect(handler.updater.calcListDiff).toHaveBeenCalledTimes(1);
    const diffCall = handler.updater.calcListDiff.mock.calls[0];
    expect(diffCall[0]).toBe(ref);
    expect(diffCall[1]).toBe(99);
  });

  it("cacheEntry.version が現在より大きい場合はキャッシュを返す", () => {
    const { handler, cache } = makeHandler({ version: 1 });
    handler.updater.version = 1;
    const ref = makeRef("items.*", 1);
    cache.set(ref, { value: "FUTURE", version: 3, revision: 0 });
    handler.updater.revisionByUpdatedPath.set("items.*", 0);

    const value = getByRef({}, ref, {} as any, handler);

    expect(value).toBe("FUTURE");
  });

  it("stateOutput.startsWith が true でも交差がある場合は通常取得", () => {
    const { handler, getters } = makeHandler();
    const ref = makeRef("foo.bar", 0, ["foo"]);
    getters.add("foo");
    handler.engine.stateOutput.startsWith.mockReturnValue(true);
    const target = { "foo.bar": "VALUE" } as any;

    const result = getByRef(target, ref, target, handler);

    expect(result).toBe("VALUE");
    expect(handler.engine.stateOutput.get).not.toHaveBeenCalled();
    expect(handler.engine.cache.get(ref)).toBeUndefined();
  });

  it("lists に含まれない場合は calcListDiff を呼ばない", () => {
    const { handler, getters, lists } = makeHandler();
    const ref = makeRef("items", 0);
    getters.add("items");
    lists.clear();
    const target = { items: [5] };

    const result = getByRef(target, ref, target as any, handler);

    expect(result).toEqual([5]);
    expect(handler.updater.calcListDiff).not.toHaveBeenCalled();
  });

  it("refIndex がスタックサイズに達した場合は null を push する", () => {
    const { handler, getters } = makeHandler();
    const ref = makeRef("items", 0, []);
    const prevRef = { id: "prev" } as any;
    getters.add("items");
    handler.refStack = [prevRef] as any[];
    handler.refIndex = 0;
    handler.lastRefStack = prevRef;
    const target = { items: 1 };

    const value = getByRef(target, ref, target as any, handler);

    expect(value).toBe(1);
    expect(handler.refStack.length).toBe(2);
    expect(handler.refStack[1]).toBeNull();
    expect(handler.lastRefStack).toBe(prevRef);
  });

  it("refStack が空の場合は STC-002 エラーを投げる", () => {
    const { handler, getters } = makeHandler();
    const ref = makeRef("items", 0, []);
    getters.add("items");
    handler.refStack = [];
    handler.refIndex = -1;

    expect(() => getByRef({ items: 1 }, ref, {} as any, handler)).toThrowError(/refStack is empty/);
    expect(raiseErrorMock).toHaveBeenCalledWith(expect.objectContaining({ code: "STC-002" }));
  });
});
