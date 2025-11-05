import { describe, it, expect, vi, beforeEach } from "vitest";
import { setByRef } from "../../src/StateClass/methods/setByRef";

vi.mock("../../src/StateClass/methods/getByRef", () => ({
  getByRef: (target: any, ref: any) => Reflect.get(target, ref.info.pattern),
}));

function createPathManagerSet(initial: string[] = []) {
  const internal = new Set(initial);
  return {
    add: (value: string) => internal.add(value),
    has: (value: string) => internal.has(value),
    clear: () => internal.clear(),
    intersection: (paths: Set<string>) => {
      const result = new Set<string>();
      for (const p of paths) {
        if (internal.has(p)) {
          result.add(p);
        }
      }
      return result;
    },
  };
}

function makeInfo(pattern: string, opts?: Partial<any>): any {
  const segments = pattern.split(".");
  const parentPath = segments.length > 1 ? segments.slice(0, -1).join(".") : null;
  const lastSegment = segments[segments.length - 1];
  const parentInfo: any = parentPath ? makeInfo(parentPath) : null;
  return {
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
    wildcardCount: segments.filter(s => s === "*").length,
    children: {},
    ...opts,
  };
}

function makeHandler(overrides: Partial<any> = {}) {
  const engine = {
    pathManager: {
      setters: createPathManagerSet(),
      getters: createPathManagerSet(),
      elements: createPathManagerSet(),
    },
    stateOutput: {
      startsWith: vi.fn().mockReturnValue(false),
      set: vi.fn(),
    },
  };
  const updater = { enqueueRef: vi.fn(), swapInfoByRef: new Map() };
  const handler = { engine, updater, refStack: [] as any[], refIndex: -1, lastRefStack: null, renderer: null } as any;
  return Object.assign(handler, overrides);
}

function makeRef(info: any, listIndex: any = null) {
  return { info, listIndex } as any;
}

describe("StateClass/methods: setByRef", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("stateOutput 経由で設定 (startsWith=true, setters 交差なし)", () => {
    const info = makeInfo("a.b");
    const ref = makeRef(info);
    const handler = makeHandler({ refStack: [null] });
    handler.engine.stateOutput.startsWith.mockReturnValue(true);
    handler.engine.pathManager.setters = createPathManagerSet();
    handler.engine.stateOutput.set = vi.fn().mockReturnValue("SET-OUT");
    const result = setByRef({} as any, ref, 99, {} as any, handler as any);
    expect(result).toBe("SET-OUT");
    expect(handler.updater.enqueueRef).toHaveBeenCalledWith(ref);
  });

  it("stateOutput.startsWith が true でも setters に交差がある場合は通常設定", () => {
    const info = makeInfo("a.b", { cumulativePathSet: new Set(["a"]) });
    const ref = makeRef(info);
    const target: any = { a: { b: 1 } };
    const handler = makeHandler();
    handler.engine.stateOutput.startsWith.mockReturnValue(true);
    handler.engine.pathManager.setters = createPathManagerSet(["a"]);

    const ok = setByRef(target, ref, 42, target as any, handler as any);

    expect(ok).toBe(true);
    expect(target.a.b).toBe(42);
    expect(handler.engine.stateOutput.set).not.toHaveBeenCalled();
    expect(handler.updater.enqueueRef).toHaveBeenCalledWith(ref);
  });

  it("target のプロパティへ直接設定 (setStatePropertyRef 経由)", () => {
    const info = makeInfo("a");
    const target: any = { a: 0 };
    const ref = makeRef(info);
    const handler = makeHandler();
    const ok = setByRef(target, ref, 5, {} as any, handler as any);
    expect(ok).toBe(true);
    expect(handler.updater.enqueueRef).toHaveBeenCalledWith(ref);
  });

  it("親を再帰して通常セグメントへ設定", () => {
    const info = makeInfo("a.b");
    const ref = makeRef(info);
    const target: any = { a: { b: 1 } };
    const handler = makeHandler();
    const ok = setByRef(target, ref, 777, {} as any, handler as any);
    expect(ok).toBe(true);
    expect(target.a.b).toBe(777);
    expect(handler.updater.enqueueRef).toHaveBeenCalledWith(ref);
  });

  it("ワイルドカード最終セグメント: listIndex.index の要素を設定", () => {
    const info = makeInfo("a.*");
    const ref = makeRef(info, { index: 1, parentListIndex: null });
    const target: any = { a: [10, 20, 30] };
    const handler = makeHandler();
    const ok = setByRef(target, ref, 999, {} as any, handler as any);
    expect(ok).toBe(true);
    expect(target.a[1]).toBe(999);
    expect(handler.updater.enqueueRef).toHaveBeenCalledWith(ref);
  });

  it("ネストした呼び出しでも refStack を復元", () => {
    const parentRef = { info: { pattern: "parent" } };
    const info = makeInfo("child");
    const ref = makeRef(info);
    const target: any = { child: 1 };
    const handler = makeHandler({
      refStack: [parentRef, null],
      refIndex: 0,
      lastRefStack: parentRef,
    });

    const ok = setByRef(target, ref, 314, target as any, handler as any);

    expect(ok).toBe(true);
    expect(target.child).toBe(314);
    expect(handler.refIndex).toBe(0);
    expect(handler.lastRefStack).toBe(parentRef);
    expect(handler.refStack[1]).toBeNull();
  });

  it("エラー: parentInfo が undefined の場合は例外を投げる", () => {
    const info = makeInfo("a.b", { parentInfo: null });
    const ref = makeRef(info);
    const target = {}; // target に "a.b" は存在しない
    const handler = makeHandler();
    expect(() => {
      setByRef(target, ref, 123, {} as any, handler as any);
    }).toThrowError(/propRef.stateProp.parentInfo is undefined/);
  });

  it("エラー: ワイルドカードで listIndex.index が undefined の場合は例外を投げる", () => {
    const info = makeInfo("a.b.*");
    const ref = makeRef(info, { index: undefined, parentListIndex: null }); // index が undefined
    const target = { a: { b: [10, 20, 30] } }; // target に "a.b" は存在するが "a.b.*" は存在しない
    const handler = makeHandler();
    expect(() => {
      setByRef(target, ref, 456, {} as any, handler as any);
    }).toThrowError(/propRef.listIndex\?\.index is undefined/);
  });
});
