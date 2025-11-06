import { describe, it, expect, vi, beforeEach } from "vitest";
import "../helpers/rendererPatch";
import { WILDCARD } from "../../src/constants";
import { GetByRefSymbol, GetListIndexesByRefSymbol, SetCacheableSymbol } from "../../src/StateClass/symbols";

// Mocks
const createReadonlyStateProxyMock = vi.fn();
const createReadonlyStateHandlerMock = vi.fn();
vi.mock("../../src/StateClass/createReadonlyStateProxy", () => ({
  createReadonlyStateProxy: (state: any, handler: any) => createReadonlyStateProxyMock(state, handler),
  createReadonlyStateHandler: (engine: any, updater: any, renderer: any) => createReadonlyStateHandlerMock(engine, updater, renderer),
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

// SUT
import { render } from "../../src/Updater/Renderer";

// Helpers
const makeReadonlyState = (getByRefValue: any = undefined, getListIndexesValue: any = undefined) => ({
  [SetCacheableSymbol]: (cb: Function) => cb(),
  [GetByRefSymbol]: (ref: any) => (typeof getByRefValue === "function" ? getByRefValue(ref) : getByRefValue),
  [GetListIndexesByRefSymbol]: (ref: any) => (typeof getListIndexesValue === "function" ? getListIndexesValue(ref) : getListIndexesValue),
} as any);

const makeEngine = () => {
  const dynamicDependencies = new Map<string, Set<string>>();
  const engine = {
    state: {},
    versionUp: vi.fn(() => 1),
    pathManager: {
      rootNode: { name: "root" },
      dynamicDependencies,
      lists: new Set<string>(),
      elements: new Set<string>(),
    },
    bindingsByListIndex: new WeakMap<any, Set<any>>(),
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

const makeTestUpdater = (
  engine: ReturnType<typeof makeEngine>,
  options: {
    readonlyState?: any;
    readonlyHandler?: any;
    listDiffByRef?: Map<any, any>;
    createReadonlyStateImpl?: (cb: Function) => any;
    getListDiff?: (ref: any) => any;
    setListDiff?: (ref: any, diff: any) => void;
    swapInfoByRef?: Map<any, any>;
    revision?: number;
    version?: number;
  } = {}
) => {
  const listDiffByRef = options.listDiffByRef ?? new Map<any, any>();
  const swapInfoByRef = options.swapInfoByRef ?? new Map<any, any>();
  let updaterRef: any = null;
  const createReadonlyStateImpl = options.createReadonlyStateImpl ?? ((cb: Function) => {
    const handler = options.readonlyHandler ?? createReadonlyStateHandlerMock(engine, updaterRef, null);
    const readonlyState = options.readonlyState ?? createReadonlyStateProxyMock(engine.state, handler);
    if (handler && typeof handler === "object") {
      (handler as any).updater = updaterRef;
    }
    return cb(readonlyState, handler);
  });
  const getListDiffImpl = options.getListDiff ?? ((ref: any) => listDiffByRef.get(ref));
  const setListDiffImpl = options.setListDiff ?? ((ref: any, diff: any) => {
    listDiffByRef.set(ref, diff);
  });
  const updater = {
    version: options.version ?? 0,
    revision: options.revision ?? 0,
    revisionByUpdatedPath: new Map<string, number>(),
    swapInfoByRef,
    enqueueRef: vi.fn(),
    update: vi.fn(),
    createReadonlyState: vi.fn((cb: Function) => createReadonlyStateImpl(cb)),
    calcListDiff: vi.fn(),
    getListDiff: vi.fn((ref: any) => getListDiffImpl(ref)),
    setListDiff: vi.fn((ref: any, diff: any) => setListDiffImpl(ref, diff)),
  } as any;
  updaterRef = updater;
  return { updater, listDiffByRef };
};

describe("Updater/Renderer.render", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createReadonlyStateHandlerMock.mockImplementation((engine: any, updater: any, renderer: any) => ({ engine, updater, renderer }));
    createReadonlyStateProxyMock.mockReturnValue(makeReadonlyState());
    findPathNodeByPathMock.mockImplementation((_root: any, pattern: string) => ({
      childNodeByName: new Map<string, any>(),
      currentPath: pattern,
    }));
    getStructuredPathInfoMock.mockImplementation((path: string) => ({
      pattern: path,
      wildcardCount: 0,
      wildcardParentInfos: [],
    }));
    getStatePropertyRefMock.mockImplementation((info: any, listIndex: any) => ({
      info,
      listIndex,
      key: `${info?.pattern || "unknown"}-${listIndex?.id ?? listIndex?.index ?? "null"}`,
    }));
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
  const { updater } = makeTestUpdater(engine);
  render([ref], engine, updater);

    expect(bindingA.applyChange).toHaveBeenCalledTimes(1);
    expect(bindingB.applyChange).toHaveBeenCalledTimes(1);
  });

  it("バインディングから engine や calcListDiff を利用できる", () => {
    const engine = makeEngine();
    const listDiff = { marker: true } as any;
    const ref = { info: { pattern: "root" }, listIndex: null, key: "root-null" } as any;

    const binding = {
      applyChange: vi.fn((renderer: any) => {
        expect(renderer.engine).toBe(engine);
        expect(renderer.calcListDiff(ref)).toBe(listDiff);
      }),
    } as any;
    engine.getBindings.mockReturnValue([binding]);

    findPathNodeByPathMock.mockReturnValue({ childNodeByName: new Map(), currentPath: "root" });
    createReadonlyStateProxyMock.mockReturnValue(makeReadonlyState("value"));

    const { updater } = makeTestUpdater(engine, {
      getListDiff: (target) => (target === ref ? listDiff : null),
    });

    render([ref], engine, updater);
    expect(binding.applyChange).toHaveBeenCalledTimes(1);
  });

  it("readonlyState / readonlyHandler / engine ゲッターが期待通りの値を返す", () => {
    const engine = makeEngine();
    const ref = { info: { pattern: "root" }, listIndex: null, key: "root-null" } as any;
    const readonlyState = makeReadonlyState("value");
    const readonlyHandler = { handler: true } as any;

    const binding = {
      applyChange: vi.fn((renderer: any) => {
        expect(renderer.readonlyState).toBe(readonlyState);
        expect(renderer.readonlyHandler).toBe(readonlyHandler);
        expect(renderer.engine).toBe(engine);
      }),
    } as any;
    engine.getBindings.mockReturnValue([binding]);

    findPathNodeByPathMock.mockReturnValue({ childNodeByName: new Map(), currentPath: "root" });

    const { updater } = makeTestUpdater(engine, {
      readonlyState,
      readonlyHandler,
      createReadonlyStateImpl: (cb: Function) => cb(readonlyState, readonlyHandler),
    });

    render([ref], engine, updater);
    expect(binding.applyChange).toHaveBeenCalledTimes(1);
  });

  it("エラー: PathNode が見つからない場合は例外を投げる", () => {
    const engine = makeEngine();
    findPathNodeByPathMock.mockReturnValue(null);
    createReadonlyStateProxyMock.mockReturnValue(makeReadonlyState());
    const ref = { info: { pattern: "missing" }, listIndex: null } as any;
  const { updater } = makeTestUpdater(engine);
  expect(() => render([ref], engine, updater)).toThrowError(/PathNode not found: missing/);
  });

  it("ワイルドカード子: calcListDiff と getStatePropertyRef を使用して子を辿る", () => {
    const engine = makeEngine();
    engine.getBindings.mockReturnValue([]);
    engine.pathManager.lists.add("root");

    const childNode = { childNodeByName: new Map(), currentPath: "root.*" } as any;
    const topNode = { childNodeByName: new Map([[WILDCARD, childNode]]), currentPath: "root" } as any;
    findPathNodeByPathMock.mockImplementation((_root: any, pattern: string) => {
      return pattern === "root" ? topNode : null;
    });

    getStructuredPathInfoMock.mockImplementation((path: string) => ({ pattern: path, wildcardCount: path.includes("*") ? 1 : 0, wildcardParentInfos: [] }));

    // 新リスト値は readonlyState 経由で取得、diff は adds [10,20] を返す
    createReadonlyStateProxyMock.mockReturnValue(makeReadonlyState(["a", "b"]));

    const ref = { info: { pattern: "root" }, listIndex: null } as any;
    const { updater, listDiffByRef } = makeTestUpdater(engine);
    listDiffByRef.set(ref, {
      adds: [10, 20],
      removes: [],
      newIndexes: [1, 2],
      overwrites: new Set(),
      same: false,
      oldListValue: [],
      newListValue: ["a", "b"],
      oldIndexes: [],
    } as any);
    render([ref], engine, updater);

    // adds 分だけ子 ref が生成される
    const indexes = getStatePropertyRefMock.mock.calls
      .map((c) => c[1]) // listIndex 引数
      .filter((v) => v === 10 || v === 20);
    expect(indexes).toContain(10);
    expect(indexes).toContain(20);

    // listDiff の保存
  expect(engine.saveListAndListIndexes).not.toHaveBeenCalled();
  });

  it("calcListDiff: getListDiff が undefined の場合は null を返す", () => {
    const engine = makeEngine();
    const ref = { info: { pattern: "root" }, listIndex: null, key: "root-null" } as any;
    const binding = {
      applyChange: vi.fn((renderer: any) => {
        expect(renderer.calcListDiff(ref)).toBeNull();
      }),
    } as any;
    engine.getBindings.mockReturnValue([binding]);

    findPathNodeByPathMock.mockReturnValue({ childNodeByName: new Map(), currentPath: "root" });
    createReadonlyStateProxyMock.mockReturnValue(makeReadonlyState("value"));

    const { updater } = makeTestUpdater(engine, { getListDiff: () => undefined });
    render([ref], engine, updater);

    expect(binding.applyChange).toHaveBeenCalledTimes(1);
  });

  it("changeIndexes 経由で listIndex バインディングが更新される", () => {
    const engine = makeEngine();
    engine.pathManager.lists.add("root");

    const binding: any = { applyChange: vi.fn() };
    binding.applyChange.mockImplementation((renderer: any) => {
      renderer.updatedBindings.add(binding);
    });

    const listIndex = { id: 101 } as any;
    engine.bindingsByListIndex.set(listIndex, new Set([binding]));

    const ref = { info: { pattern: "root" }, listIndex: null, key: "root-null" } as any;
    const diff = {
      oldListValue: [],
      newListValue: [],
      oldIndexes: [],
      newIndexes: [],
      changeIndexes: new Set([listIndex]),
      same: false,
    } as any;

    const { updater } = makeTestUpdater(engine, {
      getListDiff: (target) => (target === ref ? diff : null),
    });

    render([ref], engine, updater);

    expect(binding.applyChange).toHaveBeenCalledTimes(1);
    expect(engine.bindingsByListIndex.get(listIndex)).toBeInstanceOf(Set);
  });

  it("changeIndexes の再適用は updatedBindings によりスキップされる", () => {
    const engine = makeEngine();
    engine.pathManager.lists.add("root");

    const binding: any = { applyChange: vi.fn() };
    binding.applyChange.mockImplementation((renderer: any) => {
      renderer.updatedBindings.add(binding);
    });

    engine.getBindings.mockReturnValueOnce([binding]).mockReturnValue([]);

    const listIndex = { id: 202 } as any;
    engine.bindingsByListIndex.set(listIndex, new Set([binding]));

    const ref = { info: { pattern: "root" }, listIndex: null, key: "root-null" } as any;
    const diff = {
      oldListValue: [],
      newListValue: [],
      oldIndexes: [],
      newIndexes: [],
      changeIndexes: new Set([listIndex]),
      same: false,
    } as any;

    const { updater } = makeTestUpdater(engine, {
      getListDiff: (target) => (target === ref ? diff : null),
    });

    render([ref], engine, updater);

    expect(binding.applyChange).toHaveBeenCalledTimes(1);
  });

  it("changeIndexes と一致するバインディングが未登録の場合でもエラーなく進む", () => {
    const engine = makeEngine();
    engine.pathManager.lists.add("root");

    const listIndex = { id: 303 } as any;
    const ref = { info: { pattern: "root" }, listIndex: null, key: "root-null" } as any;

    const diff = {
      oldListValue: [],
      newListValue: [],
      oldIndexes: [],
      newIndexes: [],
      changeIndexes: new Set([listIndex]),
      same: false,
    } as any;

    const { updater } = makeTestUpdater(engine, {
      getListDiff: (target) => (target === ref ? diff : null),
    });

    render([ref], engine, updater);

    expect(engine.bindingsByListIndex.get(listIndex)).toBeUndefined();
  });

  it("ワイルドカード子: old と new が同一参照なら saveListAndListIndexes は呼ばれない", () => {
    const engine = makeEngine();
    engine.getBindings.mockReturnValue([]);
    engine.pathManager.lists.add("root");

    const childNode = { childNodeByName: new Map(), currentPath: "root.*" } as any;
    const topNode = { childNodeByName: new Map([[WILDCARD, childNode]]), currentPath: "root" } as any;
    findPathNodeByPathMock.mockImplementation((_root: any, pattern: string) => {
      if (pattern === "root") return topNode;
      if (pattern === "root.item") return topNode; // item側の描画でもノードを返す
      return null;
    });

    getStructuredPathInfoMock.mockImplementation((path: string) => ({ pattern: path, wildcardCount: path.includes("*") ? 1 : 0, wildcardParentInfos: [] }));

    const list = [1, 2];
    engine.getListAndListIndexes.mockReturnValue({
      list,
      listIndexes: [],
      listClone: list,
    });
    // readonlyState も同じ参照を返す
    createReadonlyStateProxyMock.mockReturnValue(makeReadonlyState(list));

    const ref = { info: { pattern: "root" }, listIndex: null } as any;
    const { updater, listDiffByRef } = makeTestUpdater(engine);
    listDiffByRef.set(ref, {
      adds: [],
      removes: [],
      newIndexes: [0, 1],
      overwrites: new Set(),
      same: false,
      oldListValue: list,
      newListValue: list,
      oldIndexes: [],
    } as any);
    render([ref], engine, updater);

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
  const { updater } = makeTestUpdater(engine);
  render([ref], engine, updater);

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
  const { updater } = makeTestUpdater(engine);
  render([ref], engine, updater);

    // 最終 depInfo とともに listIndex が使用された子 ref が生成されている（7,8 を使用）
    const finalDepCalls = getStatePropertyRefMock.mock.calls.filter((c) => c[0]?.pattern === "dep/*/x").map((c) => c[1]);
    const finalDepIds = finalDepCalls.map((listIndex) => listIndex?.id).filter((id) => id !== undefined);
    expect(finalDepIds).toEqual(expect.arrayContaining([7, 8]));
  });

  it("動的依存（ワイルドカード）: 親配列情報が単一のケースでも末端を描画する", () => {
    const engine = makeEngine();
    engine.getBindings.mockReturnValue([]);
    engine.pathManager.dynamicDependencies.set("root", new Set(["dep/*"]));

    const topNode = { childNodeByName: new Map(), currentPath: "root" } as any;
    const depNode = { childNodeByName: new Map(), currentPath: "dep/*" } as any;
    findPathNodeByPathMock.mockImplementation((_root: any, pattern: string) => {
      if (pattern === "root") return topNode;
      if (pattern === "dep/*") return depNode;
      return null;
    });

    const depInfo = { pattern: "dep/*", wildcardCount: 1, wildcardParentInfos: [{ pattern: "dep" }] };
    getStructuredPathInfoMock.mockImplementation((path: string) => {
      if (path === "dep/*") return depInfo;
      return { pattern: path, wildcardCount: 0, wildcardParentInfos: [] };
    });

    engine.getListIndexes.mockReturnValue([
      { id: 11, at: vi.fn() },
      { id: 12, at: vi.fn() },
    ]);
    createReadonlyStateProxyMock.mockReturnValue(makeReadonlyState());

    const ref = { info: { pattern: "root" }, listIndex: null } as any;
    const { updater } = makeTestUpdater(engine);
    render([ref], engine, updater);

    const depCalls = getStatePropertyRefMock.mock.calls.filter((c) => c[0]?.pattern === "dep/*");
    expect(depCalls.length).toBeGreaterThan(0);
  });

  it("reorderList: 親リストが先行している場合は要素をスキップする", () => {
    const engine = makeEngine();
    engine.getBindings.mockReturnValue([]);
    engine.pathManager.lists.add("root");
    engine.pathManager.elements.add("root.item");

    const rootNode = { childNodeByName: new Map(), currentPath: "root" } as any;
    const itemNode = { childNodeByName: new Map(), currentPath: "root.item" } as any;
    findPathNodeByPathMock.mockImplementation((_root: any, pattern: string) => {
      if (pattern === "root") return rootNode;
      if (pattern === "root.item") return itemNode;
      return null;
    });

    const listInfo = { pattern: "root", parentInfo: null } as any;
    const listRef = { info: listInfo, listIndex: null, key: "root-null" } as any;
    const itemInfo = { pattern: "root.item", parentInfo: listInfo } as any;
    const listIndex0 = { index: 0, at: vi.fn(() => null) } as any;
    const itemRef = { info: itemInfo, listIndex: listIndex0, key: "root.item-0" } as any;

    getStatePropertyRefMock.mockImplementation((info: any, listIndex: any) => {
      if (info === listInfo && listIndex === null) return listRef;
      return { info, listIndex, key: `${info?.pattern || "unknown"}-${listIndex?.index ?? "null"}` };
    });

    createReadonlyStateProxyMock.mockReturnValue(makeReadonlyState(["a"]));

    const { updater } = makeTestUpdater(engine);
    render([listRef, itemRef], engine, updater);

    expect(engine.getListAndListIndexes).not.toHaveBeenCalled();
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
  const { updater } = makeTestUpdater(engine);
  expect(() => render([ref], engine, updater)).toThrowError(/PathNode not found: missingDep/);
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
  const { updater } = makeTestUpdater(engine);
  render([ref], engine, updater);

    // dep/*/x での子作成は呼ばれない
    const finalDepCalls = getStatePropertyRefMock.mock.calls.filter((c) => c[0]?.pattern === "dep/*/x");
    expect(finalDepCalls.length).toBe(0);
  });

  it("SwapDiff: リストの要素に変更がある場合にSwapDiffが作成される", () => {
    const engine = makeEngine();
    engine.getBindings.mockReturnValue([]);
    engine.pathManager.lists.add("root");

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
    engine.getListAndListIndexes.mockReturnValue({
      list: ["old", "list"],
      listIndexes: [mockListIndex10, mockListIndex20],
      listClone: ["old", "list"],
    });

    createReadonlyStateProxyMock.mockReturnValue(makeReadonlyState(["a", "b", "c"]));

    const ref = { info: { pattern: "root" }, listIndex: null, key: "root-null" } as any;
    const { updater, listDiffByRef } = makeTestUpdater(engine);
    listDiffByRef.set(ref, {
      adds: [mockListIndex10, mockListIndex20],
      removes: [5],
      newIndexes: [1, 2, 3],
      overwrites: new Set([mockOverwriteIndex]),
      same: false,
      oldListValue: ["old", "list"],
      newListValue: ["a", "b", "c"],
      oldIndexes: [mockListIndex10, mockListIndex20],
    } as any);
    render([ref], engine, updater);

    // adds分の子refが作成される
    const indexes = getStatePropertyRefMock.mock.calls
      .map((c) => c[1]) 
      .filter((v) => v && (v.id === 10 || v.id === 20));
    expect(indexes.length).toBe(2);
  });

  it("reorderList: 対応する旧インデックスが存在しない場合は例外", () => {
    const engine = makeEngine();
    engine.getBindings.mockReturnValue([]);
    engine.pathManager.elements.add("root.item");

    const rootNode = { childNodeByName: new Map(), currentPath: "root" } as any;
    findPathNodeByPathMock.mockImplementation((_root: any, pattern: string) => {
      if (pattern === "root") return rootNode;
      return null;
    });

    const listInfo = { pattern: "root", parentInfo: null } as any;
    const itemInfo = { pattern: "root.item", parentInfo: listInfo } as any;
    const listIndex0 = { index: 0, at: vi.fn(() => null) } as any;
    const itemRef = { info: itemInfo, listIndex: listIndex0, key: "root.item-0" } as any;

    const rootRef = { info: listInfo, listIndex: null, key: "root-null" } as any;

    getStatePropertyRefMock.mockImplementation((info: any, listIndex: any) => {
      if (info === listInfo && listIndex === null) return rootRef;
      return { info, listIndex, key: `${info?.pattern || "unknown"}-${listIndex?.index ?? "null"}` };
    });

    engine.getListAndListIndexes.mockReturnValue({
      list: ["keep"],
      listClone: ["keep"],
      listIndexes: [undefined],
    });

    createReadonlyStateProxyMock.mockReturnValue(makeReadonlyState(["keep"]));

    const { updater } = makeTestUpdater(engine);

    expect(() => render([itemRef], engine, updater)).toThrowError(/ListIndex not found/);
  });

  it("readonlyState が未初期化の場合はエラーを投げる", () => {
    const engine = makeEngine();
    engine.pathManager.elements.add("root.item");

    const parentInfo = { pattern: "root", parentInfo: null } as any;
    const listRef = { info: parentInfo, listIndex: null, key: "root-null" } as any;
    const itemInfo = { pattern: "root.item", parentInfo } as any;
    const listIndex = { index: 0, at: vi.fn(() => null) } as any;
    const itemRef = { info: itemInfo, listIndex, key: "root.item-0" } as any;

    getStatePropertyRefMock.mockImplementationOnce((info: any, listIndexArg: any) => {
      if (info === parentInfo && listIndexArg === null) {
        return listRef;
      }
      return { info, listIndex: listIndexArg, key: `${info?.pattern || "unknown"}-${listIndexArg?.index ?? "null"}` };
    });

    findPathNodeByPathMock.mockImplementation((_, pattern: string) => {
      if (pattern === "root") {
        return { childNodeByName: new Map(), currentPath: "root" } as any;
      }
      if (pattern === "root.item") {
        return { childNodeByName: new Map(), currentPath: "root.item" } as any;
      }
      return null;
    });

    const { updater } = makeTestUpdater(engine, {
      createReadonlyStateImpl: (cb: Function) => cb(undefined, {}),
    });

    expect(() => render([itemRef], engine, updater)).toThrowError(/ReadonlyState not initialized/);
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
    engine.getListAndListIndexes.mockReturnValue({
      list: oldListValue,
      listIndexes: oldListIndexes,
      listClone: oldListValue,
    });

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
    const { updater } = makeTestUpdater(engine);
    render([itemRef0, itemRef1], engine, updater);

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
    engine.getListAndListIndexes.mockReturnValue({
      list: oldListValue,
      listIndexes: oldListIndexes,
      listClone: oldListValue,
    });

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

    const { updater } = makeTestUpdater(engine);
    render([itemRef0], engine, updater);

    expect(engine.saveListAndListIndexes).toHaveBeenCalledTimes(1);
    const call = engine.saveListAndListIndexes.mock.calls[0];
    expect(call[0]?.key).toBe("root-null");
    expect(call[1]).toBeNull();
  });

  it("reorderList: oldListValue が indexOf を持たなくても overWrite を記録できる", () => {
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

    const fakeOldList = { indexOf: () => undefined } as any;
    engine.getListAndListIndexes.mockReturnValue({
      list: null,
      listIndexes: [{ index: 0 }],
      listClone: fakeOldList,
    });

    const cache = new Map<string, any>();
    getStatePropertyRefMock.mockImplementation((info: any, listIndex: any) => {
      const k = `${info?.pattern || "unknown"}-${listIndex?.id || "null"}`;
      if (info?.pattern === "root" && listIndex == null) {
        if (!cache.has(k)) cache.set(k, { info, listIndex, key: k });
        return cache.get(k);
      }
      return { info, listIndex, key: k };
    });

    createReadonlyStateProxyMock.mockReturnValue(makeReadonlyState(["fresh"]));

    const { updater } = makeTestUpdater(engine);
    render([itemRef0], engine, updater);

    expect(updater.setListDiff).toHaveBeenCalledTimes(1);
    const diff = updater.setListDiff.mock.calls[0][1];
    expect(diff.overwrites?.size).toBeGreaterThan(0);
  });

  it("reorderList: 差分生成時に旧リスト情報を swapInfoByRef に保持する", () => {
    const engine = makeEngine();
    engine.getBindings.mockReturnValue([]);
    engine.pathManager.elements.add("root.item");

    const parentInfo = { pattern: "root", parentInfo: null } as any;
    const itemInfo = { pattern: "root.item", parentInfo } as any;
    const listIndex0 = { index: 0, at: vi.fn(() => null) } as any;
    const itemRef0 = { info: itemInfo, listIndex: listIndex0, key: "root.item-0" } as any;

    const listRef = { info: parentInfo, listIndex: null, key: "root-null" } as any;
    getStatePropertyRefMock.mockImplementation((info: any, listIndex: any) => {
      if (info === parentInfo && listIndex === null) {
        return listRef;
      }
      return { info, listIndex, key: `${info?.pattern || "unknown"}-${listIndex?.index ?? "null"}` };
    });

    const saveInfo = {
      list: ["old"],
      listIndexes: [{ index: 0 }],
      listClone: ["old"],
    } as any;
    engine.getListAndListIndexes.mockReturnValue(saveInfo);
    createReadonlyStateProxyMock.mockReturnValue(makeReadonlyState(["new"]));

    const customMap = new Map<any, any>();
    const { updater } = makeTestUpdater(engine, { swapInfoByRef: customMap });

    render([itemRef0], engine, updater);

    expect(engine.saveListAndListIndexes).toHaveBeenCalled();
    expect(customMap.get(listRef)).toEqual({
      value: saveInfo.listClone ?? saveInfo.list ?? null,
      listIndexes: saveInfo.listIndexes,
    });
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
    const { updater } = makeTestUpdater(engine);
    render([ref], engine, updater);

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
    
    const ref = { info: { pattern: "root" }, listIndex: null, key: "root-null" } as any;
  const { updater } = makeTestUpdater(engine, { getListDiff: () => null });
  expect(() => render([ref], engine, updater)).toThrowError(/ListDiff is null during renderItem/);
  });

  it("ワイルドカード子: adds が未定義のときは子描画をスキップする", () => {
    const engine = makeEngine();
    engine.getBindings.mockReturnValue([]);
    engine.pathManager.lists.add("root");

    const childNode = { childNodeByName: new Map(), currentPath: "root.*" } as any;
    const topNode = { childNodeByName: new Map([[WILDCARD, childNode]]), currentPath: "root" } as any;
    findPathNodeByPathMock.mockImplementation((_root: any, pattern: string) => {
      if (pattern === "root") return topNode;
      if (pattern === "root.*") return childNode;
      return null;
    });

    getStructuredPathInfoMock.mockImplementation((path: string) => ({ pattern: path, wildcardCount: path.includes("*") ? 1 : 0, wildcardParentInfos: [] }));
    createReadonlyStateProxyMock.mockReturnValue(makeReadonlyState(["value"]));

    const ref = { info: { pattern: "root" }, listIndex: null } as any;
    const { updater, listDiffByRef } = makeTestUpdater(engine);
    listDiffByRef.set(ref, {
      removes: [],
      newIndexes: [],
      overwrites: new Set(),
      same: false,
      oldListValue: [],
      newListValue: [],
      oldIndexes: [],
    } as any);

    render([ref], engine, updater);

    const childCalls = getStatePropertyRefMock.mock.calls.filter((c) => c[0]?.pattern === "root.*");
    expect(childCalls.length).toBe(0);
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
  const { updater } = makeTestUpdater(engine);
  render([ref, ref], engine, updater);

    // bindingのapplyChangeは1回だけ呼ばれる（重複処理が防止される）
    expect(bindingA.applyChange).toHaveBeenCalledTimes(1);
  });

  it("updatedBindings に登録済みのバインディングは2回目以降スキップされる", () => {
    const engine = makeEngine();
    const binding = {
      applyChange: vi.fn((renderer: any) => {
        renderer.updatedBindings.add(binding);
      }),
    } as any;
    engine.getBindings.mockReturnValue([binding, binding]);

    const node = { childNodeByName: new Map(), currentPath: "root" } as any;
    findPathNodeByPathMock.mockReturnValue(node);
    createReadonlyStateProxyMock.mockReturnValue(makeReadonlyState());

    const { updater } = makeTestUpdater(engine);
    const ref = { info: { pattern: "root" }, listIndex: null, key: "root-null" } as any;

    render([ref], engine, updater);
    expect(binding.applyChange).toHaveBeenCalledTimes(1);
  });

  it("readonlyHandler が未初期化の場合はエラーを投げる", () => {
    const engine = makeEngine();
    const binding = {
      applyChange: vi.fn((renderer: any) => {
        renderer.readonlyHandler; // getter 実行でエラー
      }),
    } as any;
    engine.getBindings.mockReturnValue([binding]);

    findPathNodeByPathMock.mockReturnValue({ childNodeByName: new Map(), currentPath: "root" });

    const { updater } = makeTestUpdater(engine, {
      createReadonlyStateImpl: (cb: Function) => cb(makeReadonlyState(), undefined),
    });

    const ref = { info: { pattern: "root" }, listIndex: null, key: "root-null" } as any;
    expect(() => render([ref], engine, updater)).toThrowError(/ReadonlyHandler not initialized/);
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
  const { updater } = makeTestUpdater(engine);
  render([ref], engine, updater);

    // 子ノードのgetStatePropertyRefが呼ばれたことを確認
    const childRefCalls = getStatePropertyRefMock.mock.calls.filter((c) => c[0]?.pattern === "root.child");
    expect(childRefCalls.length).toBeGreaterThan(0);
  });
});

describe("Updater/Renderer エラーハンドリング", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createReadonlyStateHandlerMock.mockImplementation((engine: any, updater: any, renderer: any) => ({ engine, updater, renderer }));
    createReadonlyStateProxyMock.mockReturnValue(makeReadonlyState());
    findPathNodeByPathMock.mockImplementation((_root: any, pattern: string) => ({
      childNodeByName: new Map<string, any>(),
      currentPath: pattern,
    }));
    getStructuredPathInfoMock.mockImplementation((path: string) => ({
      pattern: path,
      wildcardCount: 0,
      wildcardParentInfos: [],
    }));
    getStatePropertyRefMock.mockImplementation((info: any, listIndex: any) => ({
      info,
      listIndex,
      key: `${info?.pattern || "unknown"}-${listIndex?.id ?? listIndex?.index ?? "null"}`,
    }));
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

    const { updater } = makeTestUpdater(engine);
    expect(() => render([itemRef], engine, updater)).toThrowError(/ParentInfo is null for ref: root.item-0/);
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

    const { updater } = makeTestUpdater(engine);
    expect(() => render([itemRef], engine, updater)).toThrowError(/ListIndex is null for ref: root.item-null/);
  });

  it("エラー: engine ゲッターは未初期化のエンジンで例外を投げる", () => {
    const engine = makeEngine();
    const binding = {
      applyChange: vi.fn((renderer: any) => {
        (binding as any).RendererCtor = renderer.constructor;
      }),
    } as any;
    engine.getBindings.mockReturnValue([binding]);

    findPathNodeByPathMock.mockReturnValue({ childNodeByName: new Map(), currentPath: "root" });
    createReadonlyStateProxyMock.mockReturnValue(makeReadonlyState());

    const { updater } = makeTestUpdater(engine);
    const ref = { info: { pattern: "root" }, listIndex: null, key: "root-null" } as any;
    render([ref], engine, updater);

    const RendererCtor = (binding as any).RendererCtor;
    expect(RendererCtor).toBeDefined();

    const dummyUpdater = { createReadonlyState: vi.fn(), getListDiff: vi.fn(), setListDiff: vi.fn() } as any;
    const renderer = new RendererCtor(undefined, dummyUpdater);

    expect(() => renderer.engine).toThrowError(/Engine not initialized/);
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
    engine.getListAndListIndexes.mockReturnValue({ list: null, listIndexes: null, listClone: null });
    
    const topNode = { childNodeByName: new Map(), currentPath: "root" } as any;
    findPathNodeByPathMock.mockImplementation((root: any, pattern: string) => {
      return pattern === "root" ? topNode : null;
    });
    
    createReadonlyStateProxyMock.mockReturnValue(makeReadonlyState(["c", "d"]));

      const { updater } = makeTestUpdater(engine);
      expect(() => render([itemRef], engine, updater)).toThrowError(/OldListValue or OldListIndexes is null for ref: root-null/);
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
    engine.getListAndListIndexes.mockReturnValue({
      list: oldListValue,
      listIndexes: oldListIndexes,
      listClone: oldListValue,
    });
    
    // PathNodeが見つからない場合
    findPathNodeByPathMock.mockReturnValue(null);
    
    createReadonlyStateProxyMock.mockReturnValue(makeReadonlyState(["c", "d"]));

    const { updater } = makeTestUpdater(engine);
    expect(() => render([itemRef], engine, updater)).toThrowError(/PathNode not found: root/);
  });
  
  it("カバレッジ向上: calcListDiff既存のListDiffが存在する場合は再利用", () => {
    const engine = makeEngine();
    engine.getBindings.mockReturnValue([]);
    engine.pathManager.lists.add("root");

    const childNode = { childNodeByName: new Map(), currentPath: "root.*" } as any;
    const topNode = { childNodeByName: new Map([[WILDCARD, childNode]]), currentPath: "root" } as any;
    findPathNodeByPathMock.mockImplementation((_root: any, pattern: string) => {
      return pattern === "root" ? topNode : null;
    });

    getStructuredPathInfoMock.mockImplementation((path: string) => ({ pattern: path, wildcardCount: path.includes("*") ? 1 : 0, wildcardParentInfos: [] }));

  createReadonlyStateProxyMock.mockReturnValue(makeReadonlyState(["a", "b"]));
  const mockListDiff = { adds: [10, 20], removes: [], newIndexes: [1, 2], overwrites: new Set(), same: false, oldListValue: [], newListValue: ["a", "b"], oldIndexes: [] } as any;

  const getListDiffSpy = vi.fn(() => mockListDiff);
  const { updater } = makeTestUpdater(engine, { getListDiff: getListDiffSpy });

  const ref = { info: { pattern: "root" }, listIndex: null, key: "root-null" } as any;
  render([ref], engine, updater);

  expect(getListDiffSpy).toHaveBeenCalled();
  const adds = getStatePropertyRefMock.mock.calls.filter((c) => c[0]?.pattern === "root.*").map((c) => c[1]);
  expect(adds).toEqual(expect.arrayContaining([10, 20]));
  });
});
