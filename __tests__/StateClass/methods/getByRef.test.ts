import { describe, it, expect, vi, beforeEach } from "vitest";

const checkDependencyMock = vi.fn();
vi.mock("../../../src/StateClass/methods/checkDependency", () => ({
  checkDependency: (...args: any[]) => checkDependencyMock(...args),
}));

const createListIndexesMock = vi.fn();
vi.mock("../../../src/StateClass/methods/createListIndexes", () => ({
  createListIndexes: (...args: any[]) => createListIndexesMock(...args),
}));

const raiseErrorMock = vi.fn();
vi.mock("../../../src/utils", () => ({
  raiseError: (payload: any) => raiseErrorMock(payload),
}));

import { getByRef } from "../../../src/StateClass/methods/getByRef";

function makeInfo(pattern: string, overrides: Partial<any> = {}): any {
  const segments = pattern.split(".");
  const parentPath = segments.length > 1 ? segments.slice(0, -1).join(".") : null;
  const info = {
    id: 0,
    sid: pattern,
    pathSegments: segments,
    lastSegment: segments[segments.length - 1] ?? pattern,
    parentPath,
    parentInfo: parentPath ? makeInfo(parentPath) : null,
    cumulativePaths: [],
    cumulativePathSet: new Set<string>([pattern]),
    cumulativeInfos: [],
    cumulativeInfoSet: new Set<any>(),
    wildcardPaths: [],
    wildcardPathSet: new Set<string>(),
    wildcardInfos: [],
    wildcardInfoSet: new Set<any>(),
    wildcardParentPaths: [],
    wildcardParentPathSet: new Set<string>(),
    wildcardParentInfos: [],
    wildcardParentInfoSet: new Set<any>(),
    lastWildcardPath: null,
    lastWildcardInfo: null,
    indexByWildcardPath: {},
    children: {},
    pattern,
    wildcardCount: segments.filter(s => s === "*").length,
    ...overrides,
  };
  return info;
}

function makeRef(info: any, listIndex: any = null): any {
  return { info, listIndex };
}

function makeHandler(overrides: Partial<any> = {}): any {
  const cacheStorage = new Map<any, any>();
  const listsSet = new Set<string>();
  const gettersSet = new Set<string>();

  const handler: any = {
    engine: {
      getCacheEntry: vi.fn((key: any) => cacheStorage.has(key) ? cacheStorage.get(key) : null),
      setCacheEntry: vi.fn((key: any, value: any) => {
        cacheStorage.set(key, value);
      }),
      versionRevisionByPath: new Map<string, { version: number; revision: number }>(),
      pathManager: {
        lists: {
          has: (value: string) => listsSet.has(value),
          add: (value: string) => { listsSet.add(value); },
          clear: () => { listsSet.clear(); },
        },
        getters: {
          has: (value: string) => gettersSet.has(value),
          add: (value: string) => { gettersSet.add(value); },
          clear: () => { gettersSet.clear(); },
          intersection: (paths: Set<string>) => {
            const result = new Set<string>();
            for (const path of paths) {
              if (gettersSet.has(path)) {
                result.add(path);
              }
            }
            return result;
          },
        },
      },
      stateOutput: {
        startsWith: vi.fn().mockReturnValue(false),
        get: vi.fn(),
      },
    },
    updater: { version: 0, revision: 0 },
    refStack: [null],
    refIndex: -1,
    lastRefStack: null,
    renderer: null,
  };

  Object.assign(handler, overrides);
  handler.__cacheStorage = cacheStorage;
  handler.__listsSet = listsSet;
  handler.__gettersSet = gettersSet;

  return handler;
}

describe("StateClass/methods: getByRef", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    raiseErrorMock.mockImplementation((payload: any) => {
      const error = new Error(payload.message ?? "raiseError");
      (error as any).code = payload.code;
      throw error;
    });
    checkDependencyMock.mockImplementation(() => {});
    createListIndexesMock.mockImplementation(() => []);
  });

  it("versionRevision が未登録ならキャッシュ値を返す", () => {
    const handler = makeHandler();
    const info = makeInfo("foo", { wildcardCount: 1 });
    const ref = makeRef(info);
    const cacheEntry = { value: "cached", version: 2, revision: 3 };
    handler.__cacheStorage.set(ref, cacheEntry);

    const result = getByRef({}, ref, {} as any, handler);

    expect(result).toBe("cached");
    expect(checkDependencyMock).toHaveBeenCalledWith(handler, ref);
  });

  it("cacheEntry.version が updater.version より新しければキャッシュを返す", () => {
    const handler = makeHandler();
    const info = makeInfo("bar", { wildcardCount: 1 });
    const ref = makeRef(info);
    const cacheEntry = { value: 321, version: 5, revision: 0 };
    handler.__cacheStorage.set(ref, cacheEntry);
    handler.updater.version = 1;
    handler.engine.versionRevisionByPath.set(info.pattern, { version: 2, revision: 0 });

    const result = getByRef({}, ref, {} as any, handler);

    expect(result).toBe(321);
    expect(checkDependencyMock).toHaveBeenCalledWith(handler, ref);
  });

  it("version/revision が一致すればキャッシュを再計算せず返す", () => {
    const handler = makeHandler();
    const info = makeInfo("baz", { wildcardCount: 1 });
    const ref = makeRef(info);
    const cacheEntry = { value: { nested: true }, version: 10, revision: 4 };
    handler.__cacheStorage.set(ref, cacheEntry);
    handler.updater.version = 10;
    handler.updater.revision = 4;
    handler.engine.versionRevisionByPath.set(info.pattern, { version: 10, revision: 4 });

    const result = getByRef({}, ref, {} as any, handler);

    expect(result).toBe(cacheEntry.value);
    expect(checkDependencyMock).toHaveBeenCalledWith(handler, ref);
  });

  it("古い list キャッシュは再取得して renderer へ初期値を保持する", () => {
    const stackMarker = Symbol("stack");
    const handler = makeHandler({ refStack: [stackMarker], refIndex: 0, lastRefStack: stackMarker });
    const info = makeInfo("items");
    const listIndex = { index: 0, parentListIndex: null };
    const ref = makeRef(info, listIndex);
    handler.__listsSet.add(info.pattern);
    const previousEntry = {
      value: ["old"],
      listIndexes: [{ index: 9 }],
      version: 0,
      revision: 0,
    };
    handler.__cacheStorage.set(ref, previousEntry);
    handler.engine.versionRevisionByPath.set(info.pattern, { version: 1, revision: 0 });
    handler.updater.version = 2;
    handler.updater.revision = 3;
    handler.renderer = {
      lastListInfoByRef: new Map<any, any>(),
    };
    createListIndexesMock.mockImplementation(() => [{ index: 1 }]);
    const target = { [info.pattern]: ["fresh"] } as any;
    const previousValue = previousEntry.value;
    const previousIndexes = previousEntry.listIndexes;

    const result = getByRef(target, ref, {} as any, handler);

    expect(result).toEqual(["fresh"]);
    expect(handler.engine.setCacheEntry).toHaveBeenCalledWith(ref, expect.objectContaining({
      value: ["fresh"],
      listIndexes: [{ index: 1 }],
      version: 2,
      revision: 3,
    }));
    const stored = handler.engine.getCacheEntry(ref)!;
    expect(stored.value).toEqual(["fresh"]);
    expect(stored.value).toBe(result);
    expect(stored.listIndexes).toEqual([{ index: 1 }]);
    const lastInfo = handler.renderer.lastListInfoByRef.get(ref);
    expect(lastInfo).toEqual({ value: previousValue, listIndexes: previousIndexes });
    expect(handler.refStack.length).toBe(2);
    expect(handler.refIndex).toBe(0);
    expect(handler.lastRefStack).toBe(stackMarker);
  expect(createListIndexesMock).toHaveBeenCalledWith(listIndex, previousValue, result, previousIndexes);
    expect(checkDependencyMock).toHaveBeenCalledWith(handler, ref);
  });

  it("listIndexes 未定義のケースでも空配列を補完し非配列値をそのまま保持する", () => {
    const stackMarker = Symbol("outer");
    const handler = makeHandler({ refStack: [stackMarker], refIndex: 0, lastRefStack: stackMarker });
    const info = makeInfo("items.object");
    const listIndex = { index: 2, parentListIndex: null };
    const ref = makeRef(info, listIndex);
    handler.__listsSet.add(info.pattern);
    const previousEntry = {
      value: undefined,
      listIndexes: undefined,
      version: 0,
      revision: 0,
    };
    handler.__cacheStorage.set(ref, previousEntry);
    handler.engine.versionRevisionByPath.set(info.pattern, { version: 1, revision: 0 });
    handler.updater.version = 1;
    handler.updater.revision = 1;
    handler.renderer = {
      lastListInfoByRef: new Map<any, any>(),
    };
    createListIndexesMock.mockImplementation((_, prevValue, newValue, prevIndexes) => {
      expect(prevValue).toBeUndefined();
      expect(prevIndexes).toEqual([]);
      return ["new-index"];
    });
    const currentValue = { label: "object" };
    const target = { [info.pattern]: currentValue } as any;
    const previousValue = previousEntry.value;
    const previousIndexes = previousEntry.listIndexes;

    const result = getByRef(target, ref, {} as any, handler);

    expect(result).toBe(currentValue);
    const lastInfo = handler.renderer.lastListInfoByRef.get(ref);
    expect(lastInfo).toEqual({ value: previousValue, listIndexes: previousIndexes ?? [] });
    const stored = handler.engine.getCacheEntry(ref)!;
    expect(stored.value).toBe(result);
    expect(stored.listIndexes).toEqual(["new-index"]);
    expect(handler.engine.setCacheEntry).toHaveBeenCalled();
    expect(checkDependencyMock).toHaveBeenCalledWith(handler, ref);
  });

  it("stateOutput.startsWith が true なら stateOutput.get の結果を返す", () => {
    const handler = makeHandler();
    const info = makeInfo("state");
    const ref = makeRef(info);
    handler.engine.stateOutput.startsWith.mockReturnValue(true);
    handler.engine.stateOutput.get.mockReturnValue("from-output");

    const result = getByRef({}, ref, {} as any, handler);

    expect(result).toBe("from-output");
    expect(handler.engine.stateOutput.get).toHaveBeenCalledWith(ref);
    expect(checkDependencyMock).toHaveBeenCalledWith(handler, ref);
  });

  it("getter 経由で取得した値は listIndexes なしでキャッシュする", () => {
    const handler = makeHandler();
    const info = makeInfo("data");
    const ref = makeRef(info);
    handler.__gettersSet.add(info.pattern);
    const target = { [info.pattern]: 42 } as any;

    const result = getByRef(target, ref, target, handler);

    const stored = handler.engine.getCacheEntry(ref)!;
    expect(result).toBe(42);
    expect(stored.listIndexes).toBeNull();
    expect(handler.engine.setCacheEntry).toHaveBeenCalledTimes(1);
    expect(handler.lastRefStack).toBeNull();
    expect(checkDependencyMock).toHaveBeenCalledWith(handler, ref);
  });

  it("refStack が空なら STC-002 エラーを投げる", () => {
    const handler = makeHandler({ refStack: [], refIndex: -1 });
    const info = makeInfo("target");
    const ref = makeRef(info);
    const target = { [info.pattern]: 1 } as any;

    expect(() => getByRef(target, ref, {} as any, handler)).toThrowError(/handler.refStack is empty in getByRef/);
    expect(raiseErrorMock).toHaveBeenCalledWith(expect.objectContaining({ code: "STC-002" }));
    expect(checkDependencyMock).toHaveBeenCalledWith(handler, ref);
  });

  it("対象プロパティが存在しない場合は STC-001 エラー", () => {
    const handler = makeHandler();
    const info = makeInfo("missing");
    const ref = makeRef(info);

    expect(() => getByRef({}, ref, {} as any, handler)).toThrowError(/Property "missing" does not exist in state\./);
    expect(raiseErrorMock).toHaveBeenCalledWith(expect.objectContaining({ code: "STC-001" }));
    expect(checkDependencyMock).toHaveBeenCalledWith(handler, ref);
  });
});
