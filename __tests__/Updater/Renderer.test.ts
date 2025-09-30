import { describe, it, expect, vi, beforeEach } from "vitest";
import { WILDCARD } from "../../src/constants";
import { GetByRefSymbol, SetCacheableSymbol } from "../../src/StateClass/symbols";

// Mocks
const createReadonlyStateProxyMock = vi.fn();
vi.mock("../../src/StateClass/createReadonlyStateProxy", () => ({
  createReadonlyStateProxy: (engine: any, state: any, renderer: any) => createReadonlyStateProxyMock(engine, state, renderer),
}));

const findPathNodeByPathMock = vi.fn();
vi.mock("../../src/PathTree/PathNode", () => ({
  findPathNodeByPath: (root: any, pattern: string) => findPathNodeByPathMock(root, pattern),
}));

const getStructuredPathInfoMock = vi.fn();
vi.mock("../../src/StateProperty/getStructuredPathInfo", () => ({
  getStructuredPathInfo: (path: string) => getStructuredPathInfoMock(path),
}));

const getStatePropertyRefMock = vi.fn((info: any, listIndex: any) => ({ info, listIndex }));
vi.mock("../../src/StatePropertyRef/StatepropertyRef", () => ({
  getStatePropertyRef: (info: any, listIndex: any) => getStatePropertyRefMock(info, listIndex),
}));

const calcListDiffMock = vi.fn();
vi.mock("../../src/ListDiff/ListDiff", () => ({
  calcListDiff: (listIndex: any, oldList: any, newList: any, oldIndexes: any) => calcListDiffMock(listIndex, oldList, newList, oldIndexes),
}));

// SUT
import { render } from "../../src/Updater/Renderer";

// Helpers
const makeReadonlyState = (getByRefValue: any = undefined) => ({
  [SetCacheableSymbol]: (cb: Function) => cb(),
  [GetByRefSymbol]: () => getByRefValue,
} as any);

const makeEngine = () => {
  const dynamicDependencies = new Map<string, Set<string>>();
  const engine = {
    state: {},
    pathManager: {
      rootNode: { name: "root" },
      dynamicDependencies,
    },
    getBindings: vi.fn(() => [] as any[]),
    getListAndListIndexes: vi.fn(() => [[], []] as any),
    saveListAndListIndexes: vi.fn(),
    getListIndexes: vi.fn(() => [7, 8]),
  } as any;
  return engine;
};

describe("Updater/Renderer.render", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("単純ケース: バインディング applyChange が呼ばれる", () => {
    const engine = makeEngine();
    const bindingA = { applyChange: vi.fn() } as any;
    const bindingB = { applyChange: vi.fn() } as any;
    engine.getBindings.mockReturnValueOnce([bindingA, bindingB]);

    // ルートノードのみ、子なし
    const topNode = { childNodeByName: new Map(), currentPath: "root" } as any;
    findPathNodeByPathMock.mockImplementation((root: any, pattern: string) => {
      return pattern === "root" ? topNode : null;
    });

    // Readonly state は即 cb 実行
    createReadonlyStateProxyMock.mockReturnValue(makeReadonlyState());

    const ref = { info: { pattern: "root" }, listIndex: null } as any;
    render([ref], engine);

    expect(bindingA.applyChange).toHaveBeenCalledTimes(1);
    expect(bindingB.applyChange).toHaveBeenCalledTimes(1);
  });

  it("エラー: PathNode が見つからない場合は例外を投げる", () => {
    const engine = makeEngine();
    findPathNodeByPathMock.mockReturnValue(null);
    createReadonlyStateProxyMock.mockReturnValue(makeReadonlyState());
    const ref = { info: { pattern: "missing" }, listIndex: null } as any;
    expect(() => render([ref], engine)).toThrowError(/PathNode not found: missing/);
  });

  it("ワイルドカード子: calcListDiff と getStatePropertyRef を使用して子を辿る", () => {
    const engine = makeEngine();
    engine.getBindings.mockReturnValue([]);

    const childNode = { childNodeByName: new Map(), currentPath: "root.*" } as any;
    const topNode = { childNodeByName: new Map([[WILDCARD, childNode]]), currentPath: "root" } as any;
    findPathNodeByPathMock.mockImplementation((_root: any, pattern: string) => {
      return pattern === "root" ? topNode : null;
    });

    getStructuredPathInfoMock.mockImplementation((path: string) => ({ pattern: path, wildcardCount: path.includes("*") ? 1 : 0, wildcardParentInfos: [] }));

    // 新リスト値は readonlyState 経由で取得、diff は adds [10,20] を返す
    createReadonlyStateProxyMock.mockReturnValue(makeReadonlyState(["a", "b"]));
    calcListDiffMock.mockReturnValue({ adds: [10, 20], removes: [], newIndexes: [1, 2] });

    const ref = { info: { pattern: "root" }, listIndex: null } as any;
    render([ref], engine);

    // adds 分だけ子 ref が生成される
    const indexes = getStatePropertyRefMock.mock.calls
      .map((c) => c[1]) // listIndex 引数
      .filter((v) => v === 10 || v === 20);
    expect(indexes).toContain(10);
    expect(indexes).toContain(20);

    // listDiff の保存
    expect(engine.saveListAndListIndexes).toHaveBeenCalledTimes(1);
    expect(engine.saveListAndListIndexes.mock.calls[0][2]).toEqual([1, 2]);
  });

  it("ワイルドカード子: old と new が同一参照なら saveListAndListIndexes は呼ばれない", () => {
    const engine = makeEngine();
    engine.getBindings.mockReturnValue([]);

    const childNode = { childNodeByName: new Map(), currentPath: "root.*" } as any;
    const topNode = { childNodeByName: new Map([[WILDCARD, childNode]]), currentPath: "root" } as any;
    findPathNodeByPathMock.mockImplementation((_root: any, pattern: string) => (pattern === "root" ? topNode : null));

    getStructuredPathInfoMock.mockImplementation((path: string) => ({ pattern: path, wildcardCount: path.includes("*") ? 1 : 0, wildcardParentInfos: [] }));

    const list = [1, 2];
    engine.getListAndListIndexes.mockReturnValue([list, []]);
    // readonlyState も同じ参照を返す
    createReadonlyStateProxyMock.mockReturnValue(makeReadonlyState(list));
    // adds は空、newIndexes は任意
    calcListDiffMock.mockReturnValue({ adds: [], removes: [], newIndexes: [0, 1] });

    const ref = { info: { pattern: "root" }, listIndex: null } as any;
    render([ref], engine);

    expect(engine.saveListAndListIndexes).not.toHaveBeenCalled();
  });

  it("動的依存（非ワイルドカード）: 依存パスのノードを辿る", () => {
    const engine = makeEngine();
    engine.getBindings.mockReturnValue([]);
    engine.pathManager.dynamicDependencies.set("root", new Set(["dep"]));

    const topNode = { childNodeByName: new Map(), currentPath: "root" } as any;
    const depNode = { childNodeByName: new Map(), currentPath: "dep" } as any;
    findPathNodeByPathMock.mockImplementation((_root: any, pattern: string) => {
      if (pattern === "root") return topNode;
      if (pattern === "dep") return depNode;
      return null;
    });

    getStructuredPathInfoMock.mockImplementation((path: string) => ({ pattern: path, wildcardCount: 0, wildcardParentInfos: [] }));
    createReadonlyStateProxyMock.mockReturnValue(makeReadonlyState());

    const ref = { info: { pattern: "root" }, listIndex: null } as any;
    render([ref], engine);

    // dep への getStatePropertyRef 呼び出しは listIndex=null
    const depRefCall = getStatePropertyRefMock.mock.calls.find((c) => c[0]?.pattern === "dep");
    expect(depRefCall).toBeTruthy();
    expect(depRefCall?.[1]).toBeNull();
  });

  it("動的依存（ワイルドカード）: ワーカル依存を多段で展開して最終 depInfo で子を作る", () => {
    const engine = makeEngine();
    engine.getBindings.mockReturnValue([]);
    engine.pathManager.dynamicDependencies.set("root", new Set(["dep/*/x"]));

    const topNode = { childNodeByName: new Map(), currentPath: "root" } as any;
    const depNode = { childNodeByName: new Map(), currentPath: "dep/*/x" } as any;
    findPathNodeByPathMock.mockImplementation((_root: any, pattern: string) => {
      if (pattern === "root") return topNode;
      if (pattern === "dep/*/x") return depNode;
      return null;
    });

    const depInfo = { pattern: "dep/*/x", wildcardCount: 1, wildcardParentInfos: [{ pattern: "dep" }, { pattern: "dep/*" }] };
    getStructuredPathInfoMock.mockImplementation((path: string) => {
      if (path === "dep/*/x") return depInfo;
      return { pattern: path, wildcardCount: 0, wildcardParentInfos: [] };
    });

    createReadonlyStateProxyMock.mockReturnValue(makeReadonlyState());

    const ref = { info: { pattern: "root" }, listIndex: null } as any;
    render([ref], engine);

    // 最終 depInfo とともに listIndex が使用された子 ref が生成されている（7,8 を使用）
    const finalDepCalls = getStatePropertyRefMock.mock.calls.filter((c) => c[0]?.pattern === "dep/*/x").map((c) => c[1]);
    expect(finalDepCalls).toEqual(expect.arrayContaining([7, 8]));
  });

  it("動的依存: 依存ノードが見つからない場合はエラー", () => {
    const engine = makeEngine();
    engine.getBindings.mockReturnValue([]);
    engine.pathManager.dynamicDependencies.set("root", new Set(["missingDep"]));

    const topNode = { childNodeByName: new Map(), currentPath: "root" } as any;
    findPathNodeByPathMock.mockImplementation((_root: any, pattern: string) => (pattern === "root" ? topNode : null));
    getStructuredPathInfoMock.mockImplementation((path: string) => ({ pattern: path, wildcardCount: 0, wildcardParentInfos: [] }));
    createReadonlyStateProxyMock.mockReturnValue(makeReadonlyState());

    const ref = { info: { pattern: "root" }, listIndex: null } as any;
    expect(() => render([ref], engine)).toThrowError(/PathNode not found: missingDep/);
  });

  it("動的依存（ワイルドカード）: getListIndexes が null の場合は子展開しない", () => {
    const engine = makeEngine();
    engine.getBindings.mockReturnValue([]);
    engine.pathManager.dynamicDependencies.set("root", new Set(["dep/*/x"]));

    const topNode = { childNodeByName: new Map(), currentPath: "root" } as any;
    const depNode = { childNodeByName: new Map(), currentPath: "dep/*/x" } as any;
    findPathNodeByPathMock.mockImplementation((_root: any, pattern: string) => {
      if (pattern === "root") return topNode;
      if (pattern === "dep/*/x") return depNode;
      return null;
    });

    const depInfo = { pattern: "dep/*/x", wildcardCount: 1, wildcardParentInfos: [{ pattern: "dep" }, { pattern: "dep/*" }] };
    getStructuredPathInfoMock.mockImplementation((path: string) => (path === "dep/*/x" ? depInfo : { pattern: path, wildcardCount: 0, wildcardParentInfos: [] }));

    // listIndexes を返さない
    engine.getListIndexes.mockReturnValue(null);
    createReadonlyStateProxyMock.mockReturnValue(makeReadonlyState());

    const ref = { info: { pattern: "root" }, listIndex: null } as any;
    render([ref], engine);

    // dep/*/x での子作成は呼ばれない
    const finalDepCalls = getStatePropertyRefMock.mock.calls.filter((c) => c[0]?.pattern === "dep/*/x");
    expect(finalDepCalls.length).toBe(0);
  });
});
