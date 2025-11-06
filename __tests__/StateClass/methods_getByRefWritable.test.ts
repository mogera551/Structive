import { describe, it, expect, vi, beforeEach } from "vitest";
import { getByRef } from "../../src/StateClass/methods/getByRef";
import * as CreateListIndexesMod from "../../src/StateClass/methods/createListIndexes";

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

function makeHandler(options?: { version?: number; revision?: number; getters?: string[]; lists?: string[] }) {
  const {
    version = 2,
    revision = 1,
    getters: initialGetters = [],
    lists: initialLists = [],
  } = options ?? {};

  const getters = createGetterSet(initialGetters);
  const lists = new Set(initialLists);
  const cache = new Map<any, any>();
  const versionRevisionByPath = new Map<string, { version: number; revision: number }>();
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
      getCacheEntry: vi.fn((ref: any) => cache.has(ref) ? cache.get(ref) : null),
      setCacheEntry: vi.fn((ref: any, entry: any) => {
        cache.set(ref, entry);
      }),
      stateOutput,
      versionRevisionByPath,
    },
    updater: {
      version,
      revision,
    },
    refStack: [null],
    refIndex: -1,
    lastRefStack: null,
    renderer: null,
  };

  return { handler: handler as any, cache, getters, lists, stateOutput, versionRevisionByPath };
}

beforeEach(() => {
  vi.clearAllMocks();
  checkDependencyMock.mockReset();
  createListIndexesSpy.mockReset();
});

describe("StateClass/methods getByRef (revision scenarios)", () => {
  it("revision が進んだ場合は新しい値でキャッシュを更新", () => {
    const { handler, cache, getters, lists, versionRevisionByPath } = makeHandler({ getters: ["items"], lists: ["items"] });
    const ref = makeRef("items", { listIndex: { name: "list" } });
    const previous = { value: "OLD", version: 1, revision: 0, listIndexes: ["old"], cloneValue: null };
    cache.set(ref, previous);
    versionRevisionByPath.set("items", { version: handler.updater.version, revision: handler.updater.revision });
    createListIndexesSpy.mockReturnValue(["new-index"] as any);
    const target = { items: [1, 2, 3] };
    const previousValue = previous.value;
    const previousIndexes = previous.listIndexes;

    const value = getByRef(target, ref, target as any, handler);

    const cacheEntry = cache.get(ref);
    expect(value).toEqual([1, 2, 3]);
    expect(createListIndexesSpy).toHaveBeenCalledWith(ref.listIndex, previousValue, [1, 2, 3], previousIndexes);
    expect(cacheEntry.value).toEqual([1, 2, 3]);
    expect(cacheEntry.version).toBe(handler.updater.version);
    expect(cacheEntry.revision).toBe(handler.updater.revision);
    expect(cacheEntry.listIndexes).toEqual(["new-index"]);
    expect(handler.engine.setCacheEntry).toHaveBeenCalledWith(ref, cacheEntry);
  });

  it("cacheEntry.version が現在より大きい場合はキャッシュを返す", () => {
    const { handler, cache, versionRevisionByPath } = makeHandler({ version: 1, revision: 0, getters: ["items.*"], lists: ["items.*"] });
    const ref = makeRef("items.*", { wildcardCount: 1 });
    const future = { value: "FUTURE", version: 3, revision: 0, listIndexes: [], cloneValue: null };
    cache.set(ref, future);
    versionRevisionByPath.set(ref.info.pattern, { version: 3, revision: 0 });

    const value = getByRef({}, ref, {} as any, handler);

    expect(value).toBe("FUTURE");
    expect(cache.get(ref)).toBe(future);
  });

  it("stateOutput.startsWith が true でも交差がある場合は通常取得", () => {
    const { handler, getters, stateOutput } = makeHandler({ getters: ["foo"] });
    const ref = makeRef("foo.bar", { cumulativePaths: ["foo"] });
    getters.add("foo");
    stateOutput.startsWith.mockReturnValue(true);
    const target = { "foo.bar": "VALUE" } as any;

    const result = getByRef(target, ref, target, handler);

    expect(result).toBe("VALUE");
    expect(stateOutput.get).not.toHaveBeenCalled();
  });

  it("lists に含まれない場合は createListIndexes を呼ばない", () => {
    const { handler, cache, getters, lists } = makeHandler({ getters: ["items"] });
    const ref = makeRef("items");
    getters.add("items");
    lists.clear();
    const target = { items: [5] };

    const result = getByRef(target, ref, target as any, handler);

    const cacheEntry = cache.get(ref);
    expect(result).toEqual([5]);
    expect(cacheEntry.listIndexes).toBeNull();
    expect(createListIndexesSpy).not.toHaveBeenCalled();
  });
});
