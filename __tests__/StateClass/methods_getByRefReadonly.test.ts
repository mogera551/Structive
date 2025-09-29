import { describe, it, expect, vi, beforeEach } from "vitest";
import { getByRefReadonly } from "../../src/StateClass/methods/getByRefReadonly";

// setStatePropertyRef はコールバック（Reflect.get）をそのまま実行するユーティリティなので、ここでは実体を利用
// checkDependency は addDynamicDependency が行儀よく動くことを別テストで担保済み、ここでは副作用を嫌ってモック
vi.mock("../../src/StateClass/methods/checkDependency", () => ({ checkDependency: () => {} }));

function makeInfo(pattern: string, opts?: Partial<any>): any {
  const segments = pattern.split(".");
  const wildcardCount = segments.filter(s => s === "*").length;
  const parentPath = segments.length > 1 ? segments.slice(0, -1).join(".") : null;
  const lastSegment = segments[segments.length - 1];
  const parentInfo: any = parentPath ? makeInfo(parentPath) : null;
  const info: any = {
    id: 1,
    sid: pattern,
    pathSegments: segments,
    lastSegment,
    cumulativePaths: [],
    cumulativePathSet: new Set<string>(),
    cumulativeInfos: [],
    cumulativeInfoSet: new Set<any>(),
    parentPath,
    parentInfo,
    wildcardPaths: [],
    wildcardPathSet: new Set<string>(),
    indexByWildcardPath: {},
    wildcardInfos: [],
    wildcardInfoSet: new Set<any>(),
    wildcardParentPaths: [],
    wildcardParentPathSet: new Set<string>(),
    wildcardParentInfos: [],
    wildcardParentInfoSet: new Set<any>(),
    lastWildcardPath: null,
    lastWildcardInfo: null,
    pattern,
    wildcardCount,
    children: {},
    ...opts,
  };
  return info;
}

function makeHandler(overrides: Partial<any> = {}) {
  const engine = {
    pathManager: {
      getters: new Set<string>(),
      setters: new Set<string>(),
      lists: new Set<string>(),
    },
    stateOutput: {
      startsWith: (info: any) => false,
      get: vi.fn(),
    },
  };
  const handler = {
    engine,
    cache: null as Map<any, any> | null,
    renderer: null as any,
    refStack: [],
    refIndex: -1,
  };
  return Object.assign(handler, overrides);
}

function makeRef(info: any, listIndex: any = null) {
  return { info, listIndex } as any;
}

describe("StateClass/methods: getByRefReadonly", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("cache: ヒットした場合は即返す", () => {
    const info = makeInfo("a");
    const ref = makeRef(info);
    const cache = new Map<any, any>();
    cache.set(ref, 123);
    const handler = makeHandler({ cache });
    const value = getByRefReadonly({} as any, ref, {} as any, handler as any);
    expect(value).toBe(123);
  });

  it("cache: has だが値が undefined の場合は undefined を返す", () => {
    const info = makeInfo("a");
    const ref = makeRef(info);
    const cache = new Map<any, any>();
    // Map には has と get の2通りがあるが、ここでは has(ref)=true かつ get は undefined
    // そのため get -> undefined, has -> true を経て undefined を返す
    (cache as any).get = (k: any) => undefined;
    (cache as any).has = (k: any) => k === ref;
    const handler = makeHandler({ cache });
    const value = getByRefReadonly({} as any, ref, {} as any, handler as any);
    expect(value).toBeUndefined();
  });

  it("stateOutput 経由で取得 (startsWith=true, 交差なし)", () => {
    const info = makeInfo("a.b");
    const ref = makeRef(info);
    const handler = makeHandler();
    handler.engine.stateOutput.startsWith = () => true;
    handler.engine.pathManager.getters = new Set(); // intersection が 0
    handler.engine.stateOutput.get = vi.fn().mockReturnValue("OUT");
    const value = getByRefReadonly({} as any, ref, {} as any, handler as any);
    expect(value).toBe("OUT");
    expect(handler.engine.stateOutput.get).toHaveBeenCalled();
  });

  it("target にパターンがある場合は Reflect.get 経由で取得 (setStatePropertyRef 内)", () => {
    const info = makeInfo("a");
    const ref = makeRef(info);
    const target: any = { a: 10 };
    const handler = makeHandler();
    const value = getByRefReadonly(target, ref, {} as any, handler as any);
    expect(value).toBe(10);
  });

  it("親を再帰的に辿って取得（通常セグメント）", () => {
    const parent = { a: { b: 5 } };
    const info = makeInfo("a.b");
    const ref = makeRef(info, null);
    const handler = makeHandler();
    const value = getByRefReadonly(parent as any, ref, {} as any, handler as any);
    expect(value).toBe(5);
  });

  it("ワイルドカード最終セグメントは listIndex.index でアクセスし、lists に含まれていれば calcListDiff を呼ぶ", () => {
    const parent = { a: [10, 20, 30] };
    const info = makeInfo("a.*");
    const ref = makeRef(info, { index: 1, parentListIndex: null });
    const calcListDiff = vi.fn();
    const handler = makeHandler({ renderer: { calcListDiff }, cache: new Map() });
    handler.engine.pathManager.lists.add("a.*");
    const value = getByRefReadonly(parent as any, ref, {} as any, handler as any);
    expect(value).toBe(20);
    // finally で calcListDiff 呼ばれる
    expect(calcListDiff).toHaveBeenCalled();
  });
});
