import { describe, it, expect, vi, beforeEach } from "vitest";
import { WILDCARD } from "../../src/constants";
import { GetByRefSymbol, GetListIndexesByRefSymbol, SetCacheableSymbol } from "../../src/StateClass/symbols";

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

const getStatePropertyRefMock = vi.fn();
vi.mock("../../src/StatePropertyRef/StatepropertyRef", () => ({
  getStatePropertyRef: (info: any, listIndex: any) => getStatePropertyRefMock(info, listIndex),
}));

import { render } from "../../src/Updater/Renderer";

type TestRef = {
  info: any;
  listIndex: any;
  key: string;
  parentRef: TestRef | null;
};

const makeReadonlyState = (
  options: {
    getByRef?: (ref: TestRef) => any;
    getListIndexes?: (ref: TestRef) => any[];
  } = {}
) => ({
  [SetCacheableSymbol]: (cb: Function) => cb(),
  [GetByRefSymbol]: (ref: TestRef) => (options.getByRef ? options.getByRef(ref) : undefined),
  [GetListIndexesByRefSymbol]: (ref: TestRef) => (options.getListIndexes ? options.getListIndexes(ref) : []),
}) as any;

const makeEngine = () => ({
  state: {},
  pathManager: {
    rootNode: { currentPath: "root", childNodeByName: new Map() },
    dynamicDependencies: new Map<string, Set<string>>(),
    lists: new Set<string>(),
    elements: new Set<string>(),
    getters: {
      intersection: () => new Set<string>(),
    },
  },
  getBindings: vi.fn((_ref: TestRef) => [] as any[]),
  structiveChildComponents: new Set<any>(),
  bindingsByComponent: new WeakMap<any, Set<any>>(),
});

const makeUpdater = () => ({
  version: 0,
  revision: 0,
});

describe("Updater/Renderer (real implementation)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createReadonlyStateHandlerMock.mockImplementation((engine: any, updater: any, renderer: any) => ({ engine, updater, renderer }));
    createReadonlyStateProxyMock.mockReturnValue(makeReadonlyState());
    findPathNodeByPathMock.mockReturnValue({ currentPath: "root", childNodeByName: new Map() });
    getStructuredPathInfoMock.mockImplementation((path: string) => ({ pattern: path, wildcardCount: 0, wildcardParentInfos: [] }));
    getStatePropertyRefMock.mockImplementation((info: any, listIndex: any) => ({
      info,
      listIndex,
      key: `${info?.pattern ?? "unknown"}-${listIndex?.id ?? listIndex?.index ?? "null"}`,
      parentRef: null,
    }));
  });

  it("リスト参照と依存関係をRenderできる", () => {
    const engine = makeEngine();
    engine.pathManager.lists.add("list");
    engine.pathManager.elements.add("list.item");
    engine.pathManager.dynamicDependencies.set("list", new Set(["dep/*/leaf", "plain"]));

    const wildcardNode = { currentPath: "list.*", childNodeByName: new Map() };
    const detailNode = { currentPath: "list.detail", childNodeByName: new Map() };
    const listNode = {
      currentPath: "list",
      childNodeByName: new Map([[WILDCARD, wildcardNode], ["detail", detailNode]]),
    };
    const plainNode = { currentPath: "plain", childNodeByName: new Map() };
    const depLeafNode = { currentPath: "dep/*/leaf", childNodeByName: new Map() };

    const nodeMap = new Map<string, any>([
      ["list", listNode],
      ["list.*", wildcardNode],
      ["list.detail", detailNode],
      ["plain", plainNode],
      ["dep/*/leaf", depLeafNode],
    ]);
    findPathNodeByPathMock.mockImplementation((_root: any, pattern: string) => nodeMap.get(pattern) ?? null);

    const listInfo = { pattern: "list", wildcardCount: 0, wildcardParentInfos: [], parentInfo: null };
    const listWildcardInfo = { pattern: "list.*", wildcardCount: 1, wildcardParentInfos: [listInfo] };
    const listDetailInfo = { pattern: "list.detail", wildcardCount: 0, wildcardParentInfos: [], parentInfo: listInfo };
    const listItemInfo = { pattern: "list.item", wildcardCount: 0, wildcardParentInfos: [], parentInfo: listInfo };
    const plainInfo = { pattern: "plain", wildcardCount: 0, wildcardParentInfos: [] };
    const depInfo = { pattern: "dep", wildcardCount: 0, wildcardParentInfos: [] };
    const depStarInfo = { pattern: "dep/*", wildcardCount: 1, wildcardParentInfos: [depInfo] };
    const depLeafInfo = { pattern: "dep/*/leaf", wildcardCount: 1, wildcardParentInfos: [depInfo, depStarInfo] };

    const infoMap = new Map<string, any>([
      ["list", listInfo],
      ["list.*", listWildcardInfo],
      ["list.detail", listDetailInfo],
      ["list.item", listItemInfo],
      ["plain", plainInfo],
      ["dep", depInfo],
      ["dep/*", depStarInfo],
      ["dep/*/leaf", depLeafInfo],
    ]);
    getStructuredPathInfoMock.mockImplementation((path: string) => infoMap.get(path) ?? { pattern: path, wildcardCount: 0, wildcardParentInfos: [] });

    const listIndexA = { id: 1, index: 0 };
    const listIndexB = { id: 2, index: 1 };
    const depIndex = { id: 10, index: 0 };
    const depNestedIndex = { id: 20, index: 0 };
    const listIndexesByPattern = new Map<string, any[]>([
      ["list", [listIndexA, listIndexB]],
      ["dep", [depIndex]],
      ["dep/*", [depNestedIndex]],
    ]);
    const readonlyHandler = { handler: true };
    const readonlyState = makeReadonlyState({
      getListIndexes: (ref: TestRef) => listIndexesByPattern.get(ref.info.pattern) ?? [],
    });
    createReadonlyStateHandlerMock.mockReturnValue(readonlyHandler);
    createReadonlyStateProxyMock.mockReturnValue(readonlyState);

    const updater = makeUpdater();

    const listRef: TestRef = { info: listInfo, listIndex: null, key: "list-null", parentRef: null };
    const itemRef: TestRef = { info: listItemInfo, listIndex: { index: 0 }, key: "list.item-0", parentRef: listRef };

    const bindCallLog: string[] = [];
    let capturedRenderer: any = null;
    const listBinding = {
      applyChange: vi.fn((renderer: any) => {
        capturedRenderer = renderer;
        bindCallLog.push("list");
        expect(renderer.engine).toBe(engine);
        expect(renderer.updatingRefs).toEqual(expect.arrayContaining([listRef, itemRef]));
        expect(renderer.updatingRefSet.has(itemRef)).toBe(true);
        expect(renderer.updatedBindings.size).toBeGreaterThanOrEqual(0);
        expect(renderer.processedRefs.size).toBeGreaterThanOrEqual(0);
        expect(renderer.readonlyState).toBe(readonlyState);
        expect(renderer.readonlyHandler).toBe(readonlyHandler);
        renderer.updatedBindings.add(listBinding as any);
        renderer.lastListInfoByRef.set(listRef, { value: "latest", listIndexes: [listIndexA] });
      }),
    } as any;
    const wildcardBinding = {
      applyChange: vi.fn((renderer: any) => {
        bindCallLog.push("wildcard");
        renderer.updatedBindings.add(wildcardBinding as any);
      }),
    } as any;
    const detailBinding = {
      applyChange: vi.fn((renderer: any) => {
        bindCallLog.push("detail");
        renderer.updatedBindings.add(detailBinding as any);
      }),
    } as any;

    engine.getBindings.mockImplementation((ref: TestRef) => {
      switch (ref.info.pattern) {
        case "list":
          return [listBinding];
        case "list.*":
          return [wildcardBinding];
        case "list.detail":
          return [detailBinding];
        default:
          return [];
      }
    });

    getStatePropertyRefMock.mockImplementation((info: any, listIndex: any) => ({
      info,
      listIndex,
      key: `${info?.pattern ?? "unknown"}-${listIndex?.id ?? listIndex?.index ?? "null"}`,
      parentRef: info === listDetailInfo ? listRef : null,
    }));

    render([listRef, itemRef], engine as any, updater as any);

    expect(bindCallLog).toEqual(expect.arrayContaining(["list", "wildcard"]));
    expect(capturedRenderer).not.toBeNull();

    const secondaryHandler = { handler: "secondary" };
    const secondaryState = makeReadonlyState();
    createReadonlyStateHandlerMock.mockReturnValueOnce(secondaryHandler);
    createReadonlyStateProxyMock.mockReturnValueOnce(secondaryState);
    capturedRenderer.createReadonlyState((state: any, handler: any) => {
      expect(state).toBe(secondaryState);
      expect(handler).toBe(secondaryHandler);
    });

    expect(createReadonlyStateProxyMock).toHaveBeenCalledTimes(2);
    expect(createReadonlyStateHandlerMock).toHaveBeenCalledTimes(2);
    expect(capturedRenderer.processedRefs.has(listRef)).toBe(true);
    expect(capturedRenderer.processedRefs.has(itemRef)).toBe(true);
    expect(() => capturedRenderer.readonlyState).toThrowError(/ReadonlyState not initialized/);
    expect(() => capturedRenderer.readonlyHandler).toThrowError(/ReadonlyHandler not initialized/);
  });

  it("engineゲッターは未初期化時にUPD-001を投げる", () => {
    const engine = makeEngine();
    const updater = makeUpdater();
    let RendererCtor: any = null;

    createReadonlyStateHandlerMock.mockImplementation((eng: any, upd: any, renderer: any) => {
      RendererCtor = renderer.constructor;
      return { eng, upd, renderer };
    });

    render([], engine as any, updater as any);

    expect(RendererCtor).not.toBeNull();

    const rendererWithoutEngine = new RendererCtor(null as any, updater as any);
    let caught: any;
    expect(() => {
      try {
        void rendererWithoutEngine.engine;
      } catch (error) {
        caught = error;
        throw error;
      }
    }).toThrowError(/Engine not initialized/);
    expect(caught?.code).toBe("UPD-001");
  });

  it("親リストがitemsに含まれない要素は並べ替え処理で親を更新する", () => {
    const engine = makeEngine();
    engine.pathManager.elements.add("list.item");
    engine.pathManager.lists.add("list");

    const listInfo = { pattern: "list", wildcardCount: 0, wildcardParentInfos: [], parentInfo: null };
    const listRef: TestRef = { info: listInfo, listIndex: null, key: "list-null", parentRef: null };
    const itemInfo = { pattern: "list.item", wildcardCount: 0, wildcardParentInfos: [], parentInfo: listInfo };
    const itemIndex = { index: 7 };
    const itemRef: TestRef = { info: itemInfo, listIndex: itemIndex, key: "list.item-7", parentRef: listRef };

    const listIndexFromReadonly = { index: 100 };
    createReadonlyStateProxyMock.mockReturnValue(makeReadonlyState({
      getListIndexes: (ref: TestRef) => (ref === listRef ? [listIndexFromReadonly] : []),
    }));

    const listBinding = {
      applyChange: vi.fn((renderer: any) => {
        renderer.updatedBindings.add(listBinding as any);
      }),
    } as any;
    engine.getBindings.mockImplementation((ref: TestRef) => (ref === listRef ? [listBinding] : []));

    findPathNodeByPathMock.mockImplementation((_root: any, pattern: string) => ({
      currentPath: pattern,
      childNodeByName: new Map(),
    }));
    getStructuredPathInfoMock.mockImplementation((path: string) => (path === "list" ? listInfo : itemInfo));

    render([itemRef], engine as any, makeUpdater() as any);

    expect(listBinding.applyChange).toHaveBeenCalledTimes(1);
    expect(listIndexFromReadonly.index).toBe(100);
  });

  it("リストインデックスが取得できなくても親リストの並べ替え処理は空配列で進む", () => {
    const engine = makeEngine();
    engine.pathManager.elements.add("list.item");
    engine.pathManager.lists.add("list");

    const listInfo = { pattern: "list", wildcardCount: 0, wildcardParentInfos: [], parentInfo: null };
    const listRef: TestRef = { info: listInfo, listIndex: null, key: "list-null", parentRef: null };
    const itemInfo = { pattern: "list.item", wildcardCount: 0, wildcardParentInfos: [], parentInfo: listInfo };
    const itemRef: TestRef = { info: itemInfo, listIndex: { index: 5 }, key: "list.item-5", parentRef: listRef };

    createReadonlyStateProxyMock.mockReturnValue(makeReadonlyState({
      getListIndexes: (ref: TestRef) => (ref === listRef ? (undefined as unknown as any[]) : []),
    }));

    const listBinding = {
      applyChange: vi.fn(),
    } as any;
    engine.getBindings.mockImplementation((ref: TestRef) => (ref === listRef ? [listBinding] : []));

    render([itemRef], engine as any, makeUpdater() as any);

    expect(listBinding.applyChange).toHaveBeenCalledTimes(1);
  });

  it("reorderList は updatedBindings 済みのバインディングをスキップする", () => {
    const engine = makeEngine();
    engine.pathManager.elements.add("list.item");
    engine.pathManager.lists.add("list");

    const listInfo = { pattern: "list", wildcardCount: 0, wildcardParentInfos: [], parentInfo: null };
    const listRef: TestRef = { info: listInfo, listIndex: null, key: "list-null", parentRef: null };
    const itemInfo = { pattern: "list.item", wildcardCount: 0, wildcardParentInfos: [], parentInfo: listInfo };
    const itemRef: TestRef = { info: itemInfo, listIndex: { index: 0 }, key: "list.item-0", parentRef: listRef };

    const binding = { applyChange: vi.fn() } as any;
    engine.getBindings.mockImplementation((ref: TestRef) => (ref === listRef ? [binding] : []));

    const defaultHandlerImpl = (eng: any, upd: any, renderer: any) => ({ engine: eng, updater: upd, renderer });
    createReadonlyStateHandlerMock.mockImplementation(defaultHandlerImpl);
    createReadonlyStateHandlerMock.mockImplementationOnce((eng: any, upd: any, renderer: any) => {
      renderer.updatedBindings.add(binding);
      return defaultHandlerImpl(eng, upd, renderer);
    });

    findPathNodeByPathMock.mockImplementation((_root: any, pattern: string) => ({
      currentPath: pattern,
      childNodeByName: new Map(),
    }));

    render([itemRef], engine as any, makeUpdater() as any);

    expect(binding.applyChange).not.toHaveBeenCalled();
  });

  it("renderItem は updatedBindings 済みのバインディングをスキップする", () => {
    const engine = makeEngine();

    const ref: TestRef = { info: { pattern: "root" }, listIndex: null, key: "root-null", parentRef: null };
    const binding = { applyChange: vi.fn() } as any;

    engine.getBindings.mockReturnValue([binding]);

    const defaultHandlerImpl = (eng: any, upd: any, renderer: any) => ({ engine: eng, updater: upd, renderer });
    createReadonlyStateHandlerMock.mockImplementation(defaultHandlerImpl);
    createReadonlyStateHandlerMock.mockImplementationOnce((eng: any, upd: any, renderer: any) => {
      renderer.updatedBindings.add(binding);
      return defaultHandlerImpl(eng, upd, renderer);
    });

    findPathNodeByPathMock.mockReturnValue({ currentPath: "root", childNodeByName: new Map() });

    render([ref], engine as any, makeUpdater() as any);

    expect(binding.applyChange).not.toHaveBeenCalled();
  });

  it("構造化子コンポーネントに notifyRedraw を伝播する", () => {
    const engine = makeEngine();
    const childComponent = {};
    const childBinding = { notifyRedraw: vi.fn() } as any;

    engine.structiveChildComponents.add(childComponent);
    engine.bindingsByComponent.set(childComponent, new Set([childBinding]));
    engine.getBindings.mockReturnValue([]);

    findPathNodeByPathMock.mockReturnValue({ currentPath: "root", childNodeByName: new Map() });

    const ref: TestRef = { info: { pattern: "root" }, listIndex: null, key: "root-null", parentRef: null };

    render([ref], engine as any, makeUpdater() as any);

    expect(childBinding.notifyRedraw).toHaveBeenCalledTimes(1);
    expect(childBinding.notifyRedraw).toHaveBeenCalledWith([ref]);
  });

  it("構造化子コンポーネントがバインディングを持たなくてもエラーなく進む", () => {
    const engine = makeEngine();
    const childComponent = {};

    engine.structiveChildComponents.add(childComponent);
    engine.getBindings.mockReturnValue([]);
    findPathNodeByPathMock.mockReturnValue({ currentPath: "root", childNodeByName: new Map() });

    const ref: TestRef = { info: { pattern: "root" }, listIndex: null, key: "root-null", parentRef: null };

    expect(() => render([ref], engine as any, makeUpdater() as any)).not.toThrow();
  });

  it("parentRef が null の要素は UPD-004 を投げる", () => {
    const engine = makeEngine();
    engine.pathManager.elements.add("list.item");
    const badInfo = { pattern: "list.item", wildcardCount: 0, wildcardParentInfos: [], parentInfo: { pattern: "list" } };
    const badRef: TestRef = { info: badInfo, listIndex: { index: 0 }, key: "bad", parentRef: null };

    expect(() => render([badRef], engine as any, makeUpdater() as any)).toThrowError(/ParentInfo is null/);
  });

  it("PathNode が存在しない場合は PATH-101", () => {
    const engine = makeEngine();
    const ref: TestRef = { info: { pattern: "missing" }, listIndex: null, key: "missing", parentRef: null };
    findPathNodeByPathMock.mockReturnValueOnce(null);

    expect(() => render([ref], engine as any, makeUpdater() as any)).toThrowError(/PathNode not found: missing/);
  });

  it("動的依存のノードがなければ PATH-101", () => {
    const engine = makeEngine();
    engine.pathManager.dynamicDependencies.set("root", new Set(["missingDep"]));
    const rootNode = { currentPath: "root", childNodeByName: new Map() };
    findPathNodeByPathMock.mockImplementation((_root: any, pattern: string) => {
      if (pattern === "root") {
        return rootNode;
      }
      return null;
    });

    const ref: TestRef = { info: { pattern: "root" }, listIndex: null, key: "root", parentRef: null };

    expect(() => render([ref], engine as any, makeUpdater() as any)).toThrowError(/PathNode not found: missingDep/);
  });

  it("リスト参照でインデックスが未取得の場合でも空集合として差分計算する", () => {
    const engine = makeEngine();
    engine.pathManager.lists.add("list");

    const listInfo = { pattern: "list", wildcardCount: 0, wildcardParentInfos: [], parentInfo: null };
    const listRef: TestRef = { info: listInfo, listIndex: null, key: "list-null", parentRef: null };

    findPathNodeByPathMock.mockImplementation((_root: any, pattern: string) => ({
      currentPath: pattern,
      childNodeByName: new Map(),
    }));
    getStructuredPathInfoMock.mockImplementation(() => listInfo);

    createReadonlyStateProxyMock.mockReturnValue(makeReadonlyState({
      getListIndexes: () => (undefined as unknown as any[]),
    }));

    const listBinding = {
      applyChange: vi.fn((renderer: any) => {
  expect(renderer.lastListInfoByRef.has(listRef)).toBe(false);
      }),
    } as any;
    engine.getBindings.mockReturnValue([listBinding]);

    render([listRef], engine as any, makeUpdater() as any);

    expect(listBinding.applyChange).toHaveBeenCalledTimes(1);
  });

  it("動的依存で親情報が1段しかなくても null フォールバックで探索を終了する", () => {
    const engine = makeEngine();
    engine.pathManager.dynamicDependencies.set("root", new Set(["dep/*"]));

    const rootNode = { currentPath: "root", childNodeByName: new Map() };
    const depWildcardNode = { currentPath: "dep/*", childNodeByName: new Map() };
    findPathNodeByPathMock.mockImplementation((_root: any, pattern: string) => {
      if (pattern === "root") {
        return rootNode;
      }
      if (pattern === "dep/*") {
        return depWildcardNode;
      }
      return null;
    });

    const rootInfo = { pattern: "root", wildcardCount: 0, wildcardParentInfos: [] };
    const depBaseInfo = { pattern: "dep", wildcardCount: 0, wildcardParentInfos: [] };
    const depWildcardInfo = { pattern: "dep/*", wildcardCount: 1, wildcardParentInfos: [depBaseInfo] };
    getStructuredPathInfoMock.mockImplementation((path: string) => {
      switch (path) {
        case "root":
          return rootInfo;
        case "dep/*":
          return depWildcardInfo;
        case "dep":
          return depBaseInfo;
        default:
          return { pattern: path, wildcardCount: 0, wildcardParentInfos: [] };
      }
    });

  const getListIndexesSpy = vi.fn(() => (undefined as unknown as any[]));
    createReadonlyStateProxyMock.mockReturnValue(makeReadonlyState({
      getListIndexes: getListIndexesSpy,
    }));

    const rootRef: TestRef = { info: rootInfo, listIndex: null, key: "root-null", parentRef: null };

    render([rootRef], engine as any, makeUpdater() as any);

    expect(getListIndexesSpy).toHaveBeenCalled();
    expect(findPathNodeByPathMock).toHaveBeenCalledWith(rootNode, "dep/*");
  });
});
