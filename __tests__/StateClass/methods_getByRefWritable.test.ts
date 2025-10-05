import { describe, it, expect, vi, beforeEach } from "vitest";
import { getByRefWritable } from "../../src/StateClass/methods/getByRef";

vi.mock("../../src/StateClass/methods/checkDependency", () => ({ checkDependency: () => {} }));

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
      getters: new Set<string>(),
      setters: new Set<string>(),
    },
    stateOutput: {
      startsWith: (info: any) => false,
      get: vi.fn(),
    },
  };
  const handler = {
    engine,
    refStack: [],
    refIndex: -1,
  };
  return Object.assign(handler, overrides);
}

function makeRef(info: any, listIndex: any = null) {
  return { info, listIndex } as any;
}

describe("StateClass/methods: getByRefWritable", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("stateOutput 経由で取得 (startsWith=true, setters 交差なし)", () => {
    const info = makeInfo("a.b");
    const ref = makeRef(info);
    const handler = makeHandler();
    handler.engine.stateOutput.startsWith = () => true;
    handler.engine.pathManager.setters = new Set();
    handler.engine.stateOutput.get = vi.fn().mockReturnValue("WRITE-OUT");
    const value = getByRefWritable({} as any, ref, {} as any, handler as any);
    expect(value).toBe("WRITE-OUT");
  });

  it("target のプロパティから取得 (setStatePropertyRef 経由)", () => {
    const info = makeInfo("a");
    const target: any = { a: 7 };
    const ref = makeRef(info);
    const handler = makeHandler();
    const value = getByRefWritable(target, ref, {} as any, handler as any);
    expect(value).toBe(7);
  });

  it("親を再帰的に辿って取得（通常セグメント）", () => {
    const parent = { a: { b: 42 } };
    const info = makeInfo("a.b");
    const ref = makeRef(info);
    const handler = makeHandler();
    const value = getByRefWritable(parent as any, ref, {} as any, handler as any);
    expect(value).toBe(42);
  });

  it("ワイルドカード最終セグメント: listIndex.index でアクセス", () => {
    const parent = { a: [0, 1, 2, 3] };
    const info = makeInfo("a.*");
    const ref = makeRef(info, { index: 2, parentListIndex: null });
    const handler = makeHandler();
    const value = getByRefWritable(parent as any, ref, {} as any, handler as any);
    expect(value).toBe(2);
  });

  it("エラー: parentInfo が undefined の場合は例外を投げる", () => {
    const info = makeInfo("a.b", { parentInfo: null });
    const ref = makeRef(info);
    const target = {}; // target に "a.b" は存在しない
    const handler = makeHandler();
    expect(() => {
      getByRefWritable(target as any, ref, {} as any, handler as any);
    }).toThrowError(/propRef.stateProp.parentInfo is undefined/);
  });

  it("エラー: ワイルドカードで listIndex.index が undefined の場合は例外を投げる", () => {
    const info = makeInfo("a.b.*");
    const ref = makeRef(info, { index: undefined, parentListIndex: null }); // index が undefined
    const target = { a: { b: [10, 20, 30] } }; // target に "a.b" は存在するが "a.b.*" は存在しない
    const handler = makeHandler();
    expect(() => {
      getByRefWritable(target as any, ref, {} as any, handler as any);
    }).toThrowError(/propRef.listIndex\?\.index is undefined/);
  });
});
