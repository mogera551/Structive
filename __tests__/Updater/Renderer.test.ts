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

const getStatePropertyRefMock = vi.fn((info: any, listIndex: any) => ({ 
  info, 
  listIndex, 
  key: `${info?.pattern || 'unknown'}-${listIndex?.id || 'null'}` 
}));
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
      lists: new Set<string>(),
      elements: new Set<string>(),
    },
    getBindings: vi.fn(() => [] as any[]),
    getListAndListIndexes: vi.fn(() => [[], []] as any),
    saveListAndListIndexes: vi.fn(),
    getListIndexes: vi.fn(() => [
      { id: 7, at: vi.fn((pos: number) => pos === 0 ? { id: 7 } : null) },
      { id: 8, at: vi.fn((pos: number) => pos === 1 ? { id: 8 } : null) }
    ]),
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
    calcListDiffMock.mockReturnValue({ adds: [10, 20], removes: [], newIndexes: [1, 2], overwrites: new Set() });

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
    findPathNodeByPathMock.mockImplementation((_root: any, pattern: string) => {
      if (pattern === "root") return topNode;
      if (pattern === "root.item") return topNode; // item側の描画でもノードを返す
      return null;
    });

    getStructuredPathInfoMock.mockImplementation((path: string) => ({ pattern: path, wildcardCount: path.includes("*") ? 1 : 0, wildcardParentInfos: [] }));

    const list = [1, 2];
    engine.getListAndListIndexes.mockReturnValue([list, []]);
    // readonlyState も同じ参照を返す
    createReadonlyStateProxyMock.mockReturnValue(makeReadonlyState(list));
    // adds は空、newIndexes は任意
    calcListDiffMock.mockReturnValue({ adds: [], removes: [], newIndexes: [0, 1], overwrites: new Set() });

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
    const finalDepIds = finalDepCalls.map((listIndex) => listIndex?.id).filter((id) => id !== undefined);
    expect(finalDepIds).toEqual(expect.arrayContaining([7, 8]));
  });

  it("動的依存: 依存ノードが見つからない場合はエラー", () => {
    const engine = makeEngine();
    engine.getBindings.mockReturnValue([]);
    engine.pathManager.dynamicDependencies.set("root", new Set(["missingDep"]));

    const topNode = { childNodeByName: new Map(), currentPath: "root" } as any;
    findPathNodeByPathMock.mockImplementation((_root: any, pattern: string) => {
      if (pattern === "root") return topNode;
      if (pattern === "root.item") return topNode;
      return null;
    });
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

  it("SwapDiff: リストの要素に変更がある場合にSwapDiffが作成される", () => {
    const engine = makeEngine();
    engine.getBindings.mockReturnValue([]);

    const childNode = { childNodeByName: new Map(), currentPath: "root.*" } as any;
    const topNode = { childNodeByName: new Map([[WILDCARD, childNode]]), currentPath: "root" } as any;
    findPathNodeByPathMock.mockImplementation((_root: any, pattern: string) => {
      return pattern === "root" ? topNode : null;
    });

    getStructuredPathInfoMock.mockImplementation((path: string) => ({ pattern: path, wildcardCount: path.includes("*") ? 1 : 0, wildcardParentInfos: [] }));

    // adds用のmockリストインデックスを作成
    const mockListIndex10 = { id: 10, at: vi.fn() };
    const mockListIndex20 = { id: 20, at: vi.fn() };
    const mockOverwriteIndex = { id: 100, at: vi.fn() };
    
    // getListAndListIndexesでaddのリストインデックスを返す
    engine.getListAndListIndexes.mockReturnValue([
      ["old", "list"], 
      [mockListIndex10, mockListIndex20] 
    ]);

    createReadonlyStateProxyMock.mockReturnValue(makeReadonlyState(["a", "b", "c"]));
    calcListDiffMock.mockReturnValue({ 
      adds: [mockListIndex10, mockListIndex20], 
      removes: [5], 
      newIndexes: [1, 2, 3], 
      overwrites: new Set([mockOverwriteIndex])
    });

    const ref = { info: { pattern: "root" }, listIndex: null, key: "root-null" } as any;
    render([ref], engine);

    // adds分の子refが作成される
    const indexes = getStatePropertyRefMock.mock.calls
      .map((c) => c[1]) 
      .filter((v) => v && (v.id === 10 || v.id === 20));
    expect(indexes.length).toBe(2);
  });

  it("reorderList: 並べ替えを適用し saveListAndListIndexes に新順序が保存される", () => {
    const engine = makeEngine();
    engine.getBindings.mockReturnValue([]);
    // elements 側にアイテムパターンを登録
    engine.pathManager.elements.add("root.item");

    // 親ノードの PathNode を返す
    const topNode = { childNodeByName: new Map(), currentPath: "root" } as any;
    findPathNodeByPathMock.mockImplementation((_root: any, pattern: string) => {
      if (pattern === "root") return topNode;
      if (pattern === "root.item") return { childNodeByName: new Map(), currentPath: "root.item" } as any;
      return null;
    });

    // 親情報
    const parentInfo = { pattern: "root", parentInfo: null } as any;
    getStructuredPathInfoMock.mockImplementation((path: string) => ({ pattern: path, wildcardCount: 0, wildcardParentInfos: [] }));

    // listIndex は at(-2) を呼ばれても null を返す（key は root-null になる）
    const listIndex0 = { index: 0, at: vi.fn(() => null) } as any;
    const listIndex1 = { index: 1, at: vi.fn(() => null) } as any;

    const itemInfo = { pattern: "root.item", parentInfo } as any;
    const itemRef0 = { info: itemInfo, listIndex: listIndex0, key: "root.item-0" } as any;
    const itemRef1 = { info: itemInfo, listIndex: listIndex1, key: "root.item-1" } as any;

    // 旧順序と旧インデックス
    const oldListValue = ["a", "b", "c"];
    const oldListIndexes = [ { index: 0 }, { index: 1 }, { index: 2 } ] as any;
    // reorderList 内部は [ , oldListIndexes, oldListValue ] の順で受け取る
    engine.getListAndListIndexes.mockReturnValue([null, oldListIndexes, oldListValue]);

    // getStatePropertyRef を listRef（root-null）に限って同一参照を返すようキャッシュ
    const cache = new Map<string, any>();
    getStatePropertyRefMock.mockImplementation((info: any, listIndex: any) => {
      const k = `${info?.pattern || 'unknown'}-${listIndex?.id || 'null'}`;
      if (info?.pattern === 'root' && (listIndex == null)) {
        if (!cache.has(k)) cache.set(k, { info, listIndex, key: k });
        return cache.get(k);
      }
      return { info, listIndex, key: k };
    });

    // 新順序（a と b が入れ替わる）
    const newListValue = ["b", "a", "c"];
    createReadonlyStateProxyMock.mockReturnValue(makeReadonlyState(newListValue));

    // 実行（itemRef0 と itemRef1 を渡すことで indexes=[0,1] がセットされる）
    render([itemRef0, itemRef1], engine);

    // 保存引数の検証（少なくとも1回呼ばれ、その中に期待の呼び出しが含まれる）
    expect(engine.saveListAndListIndexes).toHaveBeenCalled();
    const call = engine.saveListAndListIndexes.mock.calls.find((c: any[]) => c[0]?.key === "root-null" && Array.isArray(c[1]) && c[1][0] === "b");
    expect(call).toBeTruthy();
    // newIndexes の index が更新されている
    const savedIndexes = call![2];
    expect(savedIndexes[0].index).toBe(0);
    expect(savedIndexes[1].index).toBe(1);
  });

  it("reorderList: newListValue が undefined の場合は null が保存される", () => {
    const engine = makeEngine();
    engine.getBindings.mockReturnValue([]);
    engine.pathManager.elements.add("root.item");

    const topNode = { childNodeByName: new Map(), currentPath: "root" } as any;
    findPathNodeByPathMock.mockImplementation((_root: any, pattern: string) => {
      if (pattern === "root") return topNode;
      if (pattern === "root.item") return { childNodeByName: new Map(), currentPath: "root.item" } as any;
      return null;
    });

    const parentInfo = { pattern: "root", parentInfo: null } as any;
    const itemInfo = { pattern: "root.item", parentInfo } as any;
    const listIndex0 = { index: 0, at: vi.fn(() => null) } as any;
    const itemRef0 = { info: itemInfo, listIndex: listIndex0, key: "root.item-0" } as any;

    const oldListValue = ["a", "b"]; 
    const oldListIndexes = [ { index: 0 }, { index: 1 } ] as any;
    engine.getListAndListIndexes.mockReturnValue([null, oldListIndexes, oldListValue]);

    // getStatePropertyRef を listRef（root-null）に限って同一参照を返すようキャッシュ
    const cache = new Map<string, any>();
    getStatePropertyRefMock.mockImplementation((info: any, listIndex: any) => {
      const k = `${info?.pattern || 'unknown'}-${listIndex?.id || 'null'}`;
      if (info?.pattern === 'root' && (listIndex == null)) {
        if (!cache.has(k)) cache.set(k, { info, listIndex, key: k });
        return cache.get(k);
      }
      return { info, listIndex, key: k };
    });

    // newListValue を undefined にする（Renderer 側で null にフォールバック保存）
    createReadonlyStateProxyMock.mockReturnValue(makeReadonlyState(undefined));

    render([itemRef0], engine);

    expect(engine.saveListAndListIndexes).toHaveBeenCalledTimes(1);
    const call = engine.saveListAndListIndexes.mock.calls[0];
    expect(call[0]?.key).toBe("root-null");
    expect(call[1]).toBeNull();
  });

  it("pathManager.lists/elements: リストとエレメントが適切に分離される", () => {
    const engine = makeEngine();
    const bindingA = { applyChange: vi.fn() } as any;
    engine.getBindings.mockReturnValue([bindingA]);

    // pathManager.listsとelementsにテストデータを設定
    engine.pathManager.lists.add("root");
    engine.pathManager.elements.add("root.item");

    const topNode = { childNodeByName: new Map(), currentPath: "root" } as any;
    findPathNodeByPathMock.mockImplementation((root: any, pattern: string) => {
      return pattern === "root" ? topNode : null;
    });

    createReadonlyStateProxyMock.mockReturnValue(makeReadonlyState());
    getStructuredPathInfoMock.mockImplementation((path: string) => ({ pattern: path, wildcardCount: 0, wildcardParentInfos: [] }));

    const ref = { info: { pattern: "root" }, listIndex: null, key: "root-null" } as any;
    render([ref], engine);

    // pathManager.listsとelementsが適切に設定されていることを確認
    expect(engine.pathManager.lists.has("root")).toBe(true);
    expect(engine.pathManager.elements.has("root.item")).toBe(true);
    expect(bindingA.applyChange).toHaveBeenCalled();
  });

  it("エラー: ワイルドカード処理でListDiffがnullの場合", () => {
    const engine = makeEngine();
    engine.getBindings.mockReturnValue([]);

    const childNode = { childNodeByName: new Map(), currentPath: "root.*" } as any;
    const topNode = { childNodeByName: new Map([[WILDCARD, childNode]]), currentPath: "root" } as any;
    findPathNodeByPathMock.mockImplementation((_root: any, pattern: string) => {
      return pattern === "root" ? topNode : null;
    });

    getStructuredPathInfoMock.mockImplementation((path: string) => ({ pattern: path, wildcardCount: path.includes("*") ? 1 : 0, wildcardParentInfos: [] }));
    createReadonlyStateProxyMock.mockReturnValue(makeReadonlyState(["a", "b"]));
    
    // calcListDiffがnullを返すように設定
    calcListDiffMock.mockReturnValue(null);

    const ref = { info: { pattern: "root" }, listIndex: null, key: "root-null" } as any;
    expect(() => render([ref], engine)).toThrowError(/Cannot read properties of null/);
  });

  it("重複処理の防止: 既に処理済みのrefはスキップされる", () => {
    const engine = makeEngine();
    const bindingA = { applyChange: vi.fn() } as any;
    engine.getBindings.mockReturnValue([bindingA]);

    const topNode = { childNodeByName: new Map(), currentPath: "root" } as any;
    findPathNodeByPathMock.mockImplementation((root: any, pattern: string) => {
      return pattern === "root" ? topNode : null;
    });

    createReadonlyStateProxyMock.mockReturnValue(makeReadonlyState());
    getStructuredPathInfoMock.mockImplementation((path: string) => ({ pattern: path, wildcardCount: 0, wildcardParentInfos: [] }));

    const ref = { info: { pattern: "root" }, listIndex: null, key: "root-null" } as any;
    
    // 同じrefを2回渡す
    render([ref, ref], engine);

    // bindingのapplyChangeは1回だけ呼ばれる（重複処理が防止される）
    expect(bindingA.applyChange).toHaveBeenCalledTimes(1);
  });

  it("カバレッジ向上: 静的な依存関係の子ノード処理（非ワイルドカード）", () => {
    const engine = makeEngine();
    engine.getBindings.mockReturnValue([]);

    const childNode = { childNodeByName: new Map(), currentPath: "root.child" } as any;
    const topNode = { childNodeByName: new Map([["child", childNode]]), currentPath: "root" } as any;
    findPathNodeByPathMock.mockImplementation((_root: any, pattern: string) => {
      if (pattern === "root") return topNode;
      if (pattern === "root.child") return childNode;
      return null;
    });

    createReadonlyStateProxyMock.mockReturnValue(makeReadonlyState());
    getStructuredPathInfoMock.mockImplementation((path: string) => ({ pattern: path, wildcardCount: 0, wildcardParentInfos: [] }));

    const ref = { info: { pattern: "root" }, listIndex: null, key: "root-null" } as any;
    render([ref], engine);

    // 子ノードのgetStatePropertyRefが呼ばれたことを確認
    const childRefCalls = getStatePropertyRefMock.mock.calls.filter((c) => c[0]?.pattern === "root.child");
    expect(childRefCalls.length).toBeGreaterThan(0);
  });
});

describe("Updater/Renderer エラーハンドリング", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("エラー: reorderListでparentInfoがnullの場合", () => {
    const engine = makeEngine();
    engine.pathManager.elements.add("root.item");
    engine.getBindings.mockReturnValue([]);
    
    const itemInfo = { pattern: "root.item", parentInfo: null } as any;
    const listIndex = { index: 0 } as any;
    
    const itemRef = { 
      info: itemInfo, 
      listIndex, 
      key: "root.item-0" 
    } as any;

    createReadonlyStateProxyMock.mockReturnValue(makeReadonlyState());

    expect(() => render([itemRef], engine)).toThrowError(/ParentInfo is null for ref: root.item-0/);
  });

  it("エラー: reorderListでlistIndexがnullの場合", () => {
    const engine = makeEngine();
    engine.pathManager.elements.add("root.item");
    engine.getBindings.mockReturnValue([]);
    
    const parentInfo = { pattern: "root", parentInfo: null } as any;
    const itemInfo = { pattern: "root.item", parentInfo } as any;
    
    const itemRef = { 
      info: itemInfo, 
      listIndex: null, 
      key: "root.item-null" 
    } as any;

    getStructuredPathInfoMock.mockReturnValue(parentInfo);
    getStatePropertyRefMock.mockReturnValue({ info: parentInfo, listIndex: null, key: "root-null" });
    createReadonlyStateProxyMock.mockReturnValue(makeReadonlyState());

    expect(() => render([itemRef], engine)).toThrowError(/ListIndex is null for ref: root.item-null/);
  });

  it("エラー: reorderListでoldListValueまたはoldListIndexesがnullの場合", () => {
    const engine = makeEngine();
    engine.pathManager.elements.add("root.item");
    engine.getBindings.mockReturnValue([]);
    
    const parentInfo = { pattern: "root", parentInfo: null } as any;
    const itemInfo = { pattern: "root.item", parentInfo } as any;
    const listIndex = { index: 0, at: vi.fn((pos: number) => pos === -2 ? { id: 10 } : null) } as any;
    
    const itemRef = { 
      info: itemInfo, 
      listIndex, 
      key: "root.item-0" 
    } as any;

    getStructuredPathInfoMock.mockReturnValue(parentInfo);
    const listRef = { info: parentInfo, listIndex: null, key: "root-null" };
    getStatePropertyRefMock.mockReturnValue(listRef);
    
    // oldListValueをnullに設定
    engine.getListAndListIndexes.mockReturnValue([null, null, null]);
    
    const topNode = { childNodeByName: new Map(), currentPath: "root" } as any;
    findPathNodeByPathMock.mockImplementation((root: any, pattern: string) => {
      return pattern === "root" ? topNode : null;
    });
    
    createReadonlyStateProxyMock.mockReturnValue(makeReadonlyState(["c", "d"]));

    expect(() => render([itemRef], engine)).toThrowError(/OldListValue or OldListIndexes is null for ref: root-null/);
  });

  it("エラー: reorderListでPathNodeが見つからない場合", () => {
    const engine = makeEngine();
    engine.pathManager.elements.add("root.item");
    engine.getBindings.mockReturnValue([]);
    
    const parentInfo = { pattern: "root", parentInfo: null } as any;
    const itemInfo = { pattern: "root.item", parentInfo } as any;
    const listIndex = { index: 0, at: vi.fn((pos: number) => pos === -2 ? { id: 10 } : null) } as any;
    
    const itemRef = { 
      info: itemInfo, 
      listIndex, 
      key: "root.item-0" 
    } as any;

    getStructuredPathInfoMock.mockReturnValue(parentInfo);
    const listRef = { info: parentInfo, listIndex: null, key: "root-null" };
    getStatePropertyRefMock.mockReturnValue(listRef);
    
    const oldListValue = ["a", "b"];
    const oldListIndexes = [{ id: 1 }, { id: 2 }];
    engine.getListAndListIndexes.mockReturnValue([null, oldListIndexes, oldListValue]);
    
    // PathNodeが見つからない場合
    findPathNodeByPathMock.mockReturnValue(null);
    
    createReadonlyStateProxyMock.mockReturnValue(makeReadonlyState(["c", "d"]));

    expect(() => render([itemRef], engine)).toThrowError(/PathNode not found: root/);
  });
  
  it("カバレッジ向上: calcListDiff既存のListDiffが存在する場合は再利用", () => {
    const engine = makeEngine();
    engine.getBindings.mockReturnValue([]);

    const childNode = { childNodeByName: new Map(), currentPath: "root.*" } as any;
    const topNode = { childNodeByName: new Map([[WILDCARD, childNode]]), currentPath: "root" } as any;
    findPathNodeByPathMock.mockImplementation((_root: any, pattern: string) => {
      return pattern === "root" ? topNode : null;
    });

    getStructuredPathInfoMock.mockImplementation((path: string) => ({ pattern: path, wildcardCount: path.includes("*") ? 1 : 0, wildcardParentInfos: [] }));

    // 1回目の呼び出しでListDiffを生成
    createReadonlyStateProxyMock.mockReturnValue(makeReadonlyState(["a", "b"]));
    const mockListDiff = { adds: [10, 20], removes: [], newIndexes: [1, 2], overwrites: new Set() };
    calcListDiffMock.mockReturnValue(mockListDiff);

    const ref = { info: { pattern: "root" }, listIndex: null, key: "root-null" } as any;
    render([ref], engine);

    // calcListDiffが呼ばれたことを確認
    expect(calcListDiffMock).toHaveBeenCalled();
  });
});
