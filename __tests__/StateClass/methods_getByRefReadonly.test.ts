import { describe, it, expect, vi, beforeEach } from "vitest";
import { getByRef } from "../../src/StateClass/methods/getByRef";
import * as CreateListIndexesMod from "../../src/StateClass/methods/createListIndexes";

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

const createListIndexesSpy = vi.spyOn(CreateListIndexesMod, "createListIndexes");

function createGetterSet(values: string[] = []) {
  const base = new Set(values);
  return {
    has: (value: string) => base.has(value),
    add: (value: string) => {
      base.add(value);
    },
    clear: () => {
      base.clear();
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

function makeInfo(pattern: string, wildcardCount = 0, cumulativePaths: string[] = []) {
  const segments = pattern.split(".");
  return {
    pattern,
    wildcardCount,
    lastSegment: segments[segments.length - 1] ?? pattern,
    cumulativePathSet: new Set<string>(cumulativePaths),
  } as any;
}

function makeRef(pattern: string, options?: { wildcardCount?: number; cumulativePaths?: string[]; listIndex?: any }) {
  const { wildcardCount = 0, cumulativePaths = [], listIndex = null } = options ?? {};
  return { info: makeInfo(pattern, wildcardCount, cumulativePaths), listIndex } as any;
}

function makeHandler() {
  const getters = createGetterSet();
  const lists = new Set<string>();
  const cache = new Map<any, any>();
  const versionRevisionByPath = new Map<string, { version: number; revision: number }>();
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
      getCacheEntry: vi.fn((ref: any) => cache.has(ref) ? cache.get(ref) : null),
      setCacheEntry: vi.fn((ref: any, entry: any) => {
        cache.set(ref, entry);
      }),
      stateOutput,
      versionRevisionByPath,
    },
    updater: {
      version: 1,
      revision: 0,
    },
    refStack,
    refIndex: -1,
    lastRefStack: null,
    renderer: null,
  };
  return { handler: handler as any, cache, getters, lists, stateOutput, versionRevisionByPath };
}

beforeEach(() => {
  vi.clearAllMocks();
  raiseErrorMock.mockReset();
  checkDependencyMock.mockReset();
  createListIndexesSpy.mockReset();
});

describe("StateClass/methods getByRef", () => {
  it("キャッシュがヒットした場合でも依存関係を登録して値を返す", () => {
    const { handler, cache } = makeHandler();
    const ref = makeRef("items.*", { wildcardCount: 1 });
    const entry = { value: "CACHED", version: 1, revision: 0, listIndexes: null, cloneValue: null };
    cache.set(ref, entry);

    const value = getByRef({}, ref, {} as any, handler);

    expect(value).toBe("CACHED");
    expect(cache.get(ref)).toBe(entry);
    expect(checkDependencyMock).toHaveBeenCalledTimes(1);
  });

  it("stateOutput.startsWith が true で交差が無い場合は stateOutput.get を返す", () => {
    const { handler, stateOutput } = makeHandler();
    const ref = makeRef("foo.bar", { cumulativePaths: ["foo"] });
    stateOutput.startsWith.mockReturnValue(true);
    stateOutput.get.mockReturnValue("FROM_OUTPUT");

    const value = getByRef({}, ref, {} as any, handler);

    expect(value).toBe("FROM_OUTPUT");
    expect(stateOutput.get).toHaveBeenCalledWith(ref);
    expect(handler.refIndex).toBe(-1);
    expect(checkDependencyMock).toHaveBeenCalledTimes(1);
  });

  it("target にプロパティが存在する場合は Reflect.get の結果を返しキャッシュへ保存", () => {
    const { handler, cache, getters, lists, versionRevisionByPath } = makeHandler();
    const ref = makeRef("items", { listIndex: { mark: "list" } });
    getters.add("items");
    lists.add("items");
    versionRevisionByPath.set("items", { version: handler.updater.version, revision: handler.updater.revision });
    const target = { items: [1, 2, 3] };
    createListIndexesSpy.mockReturnValue(["IDX"] as any);
    const previousValue = cache.get(ref)?.value;
    const previousIndexes = cache.get(ref)?.listIndexes;

    const result = getByRef(target, ref, target as any, handler);

    const cacheEntry = cache.get(ref);
    expect(result).toEqual([1, 2, 3]);
    expect(createListIndexesSpy).toHaveBeenCalledWith(ref.listIndex, previousValue, [1, 2, 3], previousIndexes ?? []);
    expect(cacheEntry.value).toEqual([1, 2, 3]);
    expect(cacheEntry.listIndexes).toEqual(["IDX"]);
    expect(cacheEntry.version).toBe(handler.updater.version);
    expect(cacheEntry.revision).toBe(handler.updater.revision);
    expect(handler.lastRefStack).toBeNull();
    expect(handler.engine.setCacheEntry).toHaveBeenCalledWith(ref, cacheEntry);
  });

  it("プロパティが存在しない場合は raiseError を投げる", () => {
    const { handler } = makeHandler();
    const ref = makeRef("missing");

    expect(() => getByRef({}, ref, {} as any, handler)).toThrowError(/Property "missing" does not exist/);
    expect(raiseErrorMock).toHaveBeenCalled();
  });
});
