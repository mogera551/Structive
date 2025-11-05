import { describe, it, expect, vi, beforeEach } from "vitest";

import { getByRef } from "../../../src/StateClass/methods/getByRef";
import * as CreateListIndexesMod from "../../../src/StateClass/methods/createListIndexes";
import { IStatePropertyRef } from "../../../src/StatePropertyRef/types";
import { IStructuredPathInfo } from "../../../src/StateProperty/types";
import { IStateHandler } from "../../../src/StateClass/types";

const raiseErrorMock = vi.fn((detail: any) => {
  const message = typeof detail?.message === "string" ? detail.message : String(detail);
  throw new Error(message);
});

vi.mock("../../../src/utils", () => ({
  raiseError: (detail: any) => raiseErrorMock(detail),
}));

const checkDependencyMock = vi.fn();

vi.mock("../../../src/StateClass/methods/checkDependency", () => ({
  checkDependency: (...args: any[]) => checkDependencyMock(...args),
}));

const createListIndexesSpy = vi.spyOn(CreateListIndexesMod, "createListIndexes");

beforeEach(() => {
  raiseErrorMock.mockClear();
  checkDependencyMock.mockClear();
  createListIndexesSpy.mockReset();
});

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

function makeInfo(pattern: string, wildcardCount = 0, cumulativePaths: string[] = []): IStructuredPathInfo {
  return {
    id: 1,
    sid: "1",
    pathSegments: [],
    lastSegment: pattern,
    cumulativePaths,
    cumulativePathSet: new Set(cumulativePaths),
    cumulativeInfos: [],
    cumulativeInfoSet: new Set(),
    parentPath: null,
    parentInfo: null,
    wildcardPaths: [],
    wildcardPathSet: new Set(),
    indexByWildcardPath: {},
    wildcardInfos: [],
    wildcardInfoSet: new Set(),
    wildcardParentPaths: [],
    wildcardParentPathSet: new Set(),
    wildcardParentInfos: [],
    wildcardParentInfoSet: new Set(),
    lastWildcardPath: null,
    lastWildcardInfo: null,
    pattern,
    wildcardCount,
    children: {},
  };
}

function makeRef(pattern: string, options?: { wildcardCount?: number; cumulativePaths?: string[]; listIndex?: any }): IStatePropertyRef {
  const { wildcardCount = 0, cumulativePaths = [], listIndex = null } = options ?? {};
  return {
    info: makeInfo(pattern, wildcardCount, cumulativePaths),
    listIndex,
    key: pattern,
    parentRef: null,
  };
}

function makeHandler(options?: { version?: number; revision?: number; getters?: string[]; lists?: string[]; onlyGetters?: string[] }) {
  const {
    version = 1,
    revision = 0,
    getters: initialGetters = [],
    lists: initialLists = [],
    onlyGetters: initialOnlyGetters = [],
  } = options ?? {};

  const getters = createGetterSet(initialGetters);
  const onlyGetters = createGetterSet(initialOnlyGetters);
  const lists = new Set(initialLists);
  const cache = new Map<any, any>();
  const versionRevisionByPath = new Map<string, { version: number; revision: number }>();
  const stateOutput = {
    startsWith: vi.fn().mockReturnValue(false),
    get: vi.fn(),
  };

  const engine = {
    pathManager: {
      getters,
      lists,
      onlyGetters,
      addDynamicDependency: vi.fn(),
    },
    stateOutput,
    cache,
    versionRevisionByPath,
  } as any;

  const handler: IStateHandler = {
    engine,
    updater: {
      version,
      revision,
      calcListDiff: vi.fn(),
    } as any,
    renderer: null,
    refStack: [null],
    refIndex: -1,
    lastRefStack: null,
    loopContext: null,
    symbols: new Set(),
    apis: new Set(),
    get: vi.fn(),
    set: vi.fn(),
  };

  return {
    handler,
    getters,
    onlyGetters,
    lists,
    cache,
    versionRevisionByPath,
    stateOutput,
  };
}

// �L���b�V���n

describe("StateClass/methods getByRef", () => {
  it("�L���b�V�������݂� versionRevision �����o�^�Ȃ�L���b�V���l��Ԃ�", () => {
    const ref = makeRef("todos.*", { wildcardCount: 1 });
    const { handler, cache } = makeHandler();
    const cached = { value: "CACHED", version: 1, revision: 0, listIndexes: [], cloneValue: null };
    cache.set(ref, cached);

    const result = getByRef({}, ref, {} as any, handler);

    expect(result).toBe("CACHED");
    expect(cache.get(ref)).toBe(cached);
    expect(checkDependencyMock).toHaveBeenCalledTimes(1);
  });

  it("versionRevision ���ŐV�Ɠ���̏ꍇ�̓L���b�V�����ė��p����", () => {
    const ref = makeRef("items.*", { wildcardCount: 1 });
    const { handler, cache, versionRevisionByPath } = makeHandler();
    const cached = { value: [1, 2], version: 3, revision: 2, listIndexes: [], cloneValue: null };
    cache.set(ref, cached);
    versionRevisionByPath.set(ref.info.pattern, { version: 3, revision: 2 });

    const result = getByRef({}, ref, {} as any, handler);

    expect(result).toEqual([1, 2]);
    expect(cache.get(ref)).toBe(cached);
    expect(checkDependencyMock).toHaveBeenCalledTimes(1);
  });

  it("�L���b�V���� version �����݂�薢���ł��L���b�V����Ԃ�", () => {
    const ref = makeRef("future.*", { wildcardCount: 1 });
    const { handler, cache, versionRevisionByPath } = makeHandler({ version: 1, revision: 0 });
    const cached = { value: "FUTURE", version: 5, revision: 0, listIndexes: [], cloneValue: null };
    cache.set(ref, cached);
    versionRevisionByPath.set(ref.info.pattern, { version: 5, revision: 0 });

    const result = getByRef({}, ref, {} as any, handler);

    expect(result).toBe("FUTURE");
    expect(cache.get(ref)).toBe(cached);
    expect(checkDependencyMock).toHaveBeenCalledTimes(1);
  });

  it("stateOutput.startsWith �� true �Ō������������ stateOutput.get �̌��ʂ�Ԃ�", () => {
    const ref = makeRef("foo.bar", { cumulativePaths: ["foo"] });
    const { handler, stateOutput } = makeHandler();
    stateOutput.startsWith.mockReturnValue(true);
    stateOutput.get.mockReturnValue("FROM_OUTPUT");

    const result = getByRef({}, ref, {} as any, handler);

    expect(result).toBe("FROM_OUTPUT");
    expect(stateOutput.get).toHaveBeenCalledWith(ref);
    expect(handler.refIndex).toBe(-1);
    expect(checkDependencyMock).toHaveBeenCalledTimes(1);
  });

  it("target �Ƀv���p�e�B�����݂���ꍇ�� Reflect.get �̌��ʂ��L���b�V���֕ۑ�", () => {
    const ref = makeRef("items");
    const { handler, cache, getters } = makeHandler({ getters: ["items"] });
    getters.add("items");
    const target = { items: 42 };

    const result = getByRef(target, ref, target as any, handler);

    const cacheEntry = cache.get(ref);
    expect(result).toBe(42);
    expect(cacheEntry.value).toBe(42);
    expect(cacheEntry.listIndexes).toBeNull();
    expect(cacheEntry.cloneValue).toBeNull();
    expect(cacheEntry.version).toBe(handler.updater.version);
    expect(cacheEntry.revision).toBe(handler.updater.revision);
    expect(handler.refIndex).toBe(-1);
    expect(handler.lastRefStack).toBeNull();
    expect(checkDependencyMock).toHaveBeenCalledTimes(1);
  });

  it("list �v���p�e�B�Ȃ� createListIndexes �𗘗p���ăL���b�V�����X�V", () => {
    const listIndex = { sid: "list" } as any;
    const ref = makeRef("todos", { listIndex });
    const { handler, cache, lists, versionRevisionByPath } = makeHandler();
    lists.add(ref.info.pattern);
    const previousEntry = { value: ["old"], listIndexes: ["old-index"], cloneValue: null, version: 0, revision: 0 };
    cache.set(ref, previousEntry);
    versionRevisionByPath.set(ref.info.pattern, { version: handler.updater.version, revision: handler.updater.revision });
    createListIndexesSpy.mockImplementation(() => ["new-index"] as any);
    const target = { todos: ["a", "b"] };

    const result = getByRef(target, ref, target as any, handler);

    const cacheEntry = cache.get(ref);
    expect(result).toEqual(["a", "b"]);
    expect(createListIndexesSpy).toHaveBeenCalledWith(listIndex, previousEntry.value, ["a", "b"], previousEntry.listIndexes);
    expect(cacheEntry.listIndexes).toEqual(["new-index"]);
    expect(cacheEntry.cloneValue).not.toBe(cacheEntry.value);
    expect(cacheEntry.cloneValue).toEqual(cacheEntry.value);
  });

  it("�v���p�e�B�����݂��Ȃ��ꍇ�� STC-001 �G���[�𓊂���", () => {
    const ref = makeRef("missing");
    const { handler } = makeHandler({ getters: ["missing"] });

    expect(() => getByRef({}, ref, {} as any, handler)).toThrowError(/Property "missing" does not exist/);
    expect(raiseErrorMock).toHaveBeenCalledWith(expect.objectContaining({ code: "STC-001" }));
  });

  it("refStack ����̏ꍇ�� STC-002 �G���[�𓊂���", () => {
    const ref = makeRef("value");
    const { handler } = makeHandler({ getters: ["value"] });
    handler.refStack = [];
    const target = { value: 10 };

    expect(() => getByRef(target, ref, target as any, handler)).toThrowError(/handler.refStack is empty/);
    expect(raiseErrorMock).toHaveBeenCalledWith(expect.objectContaining({ code: "STC-002" }));
  });
});
