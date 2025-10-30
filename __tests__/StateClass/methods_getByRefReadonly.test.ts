import { describe, it, expect, vi, beforeEach } from "vitest";
import { getByRef } from "../../src/StateClass/methods/getByRef";

const raiseErrorMock = vi.fn((detail: any) => {
  const message = typeof detail === "string" ? detail : detail?.message ?? "error";
  throw new Error(message);
});
vi.mock("../../src/utils", () => ({
  raiseError: (detail: any) => raiseErrorMock(detail),
}));

const checkDependencyMock = vi.fn();
vi.mock("../../src/StateClass/methods/checkDependency", () => ({
  checkDependency: (...args: any[]) => checkDependencyMock(...args),
}));

vi.mock("../../src/StateClass/methods/setStatePropertyRef", () => ({
  setStatePropertyRef: vi.fn(),
}));

function createGetterSet(values: string[] = []) {
  const base = new Set(values);
  return {
    has: (value: string) => base.has(value),
    add: (value: string) => { base.add(value); },
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

function makeHandler() {
  const getters = createGetterSet();
  const lists = new Set<string>();
  const cache = new Map<any, any>();
  const stateOutput = {
    startsWith: vi.fn().mockReturnValue(false),
    get: vi.fn(),
  };
  const refStack: any[] = [null];
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
      version: 1,
      revision: 0,
      revisionByUpdatedPath: new Map<string, number>(),
      calcListDiff: vi.fn(),
    },
  refStack,
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

describe("StateClass/methods getByRef", () => {
  it("キャッシュがヒットした場合でも依存関係を登録して値を返す", () => {
    const { handler, cache } = makeHandler();
    const ref = makeRef("items.*", 1);
    cache.set(ref, { value: "CACHED", version: 1, revision: 0 });

    const value = getByRef({}, ref, {} as any, handler);

    expect(value).toBe("CACHED");
    expect(checkDependencyMock).toHaveBeenCalledTimes(1);
  });

  it("stateOutput.startsWith が true で交差が無い場合は stateOutput.get を返す", () => {
    const { handler, getters, stateOutput } = makeHandler();
    const ref = makeRef("foo.bar", 0, ["foo"]);
    stateOutput.startsWith.mockReturnValue(true);
    stateOutput.get.mockReturnValue("FROM_OUTPUT");
    // intersection が空集合になるように getter セットは空のまま

    const value = getByRef({}, ref, {} as any, handler);

    expect(value).toBe("FROM_OUTPUT");
    expect(stateOutput.get).toHaveBeenCalledWith(ref);
    expect(checkDependencyMock).toHaveBeenCalledTimes(1);
  });

  it("target にプロパティが存在する場合は Reflect.get の結果を返しキャッシュへ保存", () => {
    const { handler, getters, cache, lists } = makeHandler();
    const ref = makeRef("items", 0, []);
    getters.add("items"); // cacheable 条件を満たす
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
