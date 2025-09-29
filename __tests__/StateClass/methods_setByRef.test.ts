import { describe, it, expect, vi, beforeEach } from "vitest";
import { setByRef } from "../../src/StateClass/methods/setByRef";

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
      setters: new Set<string>(),
    },
    stateOutput: {
      startsWith: (info: any) => false,
      set: vi.fn(),
    },
  };
  const updater = { enqueueRef: vi.fn() };
  const handler = { engine, updater, refStack: [] as any[], refIndex: -1 } as any;
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
    const handler = makeHandler();
    handler.engine.stateOutput.startsWith = () => true;
    handler.engine.pathManager.setters = new Set();
    handler.engine.stateOutput.set = vi.fn().mockReturnValue("SET-OUT");
    const result = setByRef({} as any, ref, 99, {} as any, handler as any);
    expect(result).toBe("SET-OUT");
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
});
