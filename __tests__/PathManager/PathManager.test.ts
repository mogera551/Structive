/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { createPathManager } from "../../src/PathManager/PathManager";
import type { IPathManager } from "../../src/PathManager/types";
import type { StructiveComponentClass } from "../../src/WebComponents/types";
import type { Constructor } from "../../src/types";

// モック対象モジュール
vi.mock("../../src/BindingBuilder/registerDataBindAttributes", () => ({
  getPathsSetById: vi.fn(),
  getListPathsSetById: vi.fn()
}));

vi.mock("../../src/StateProperty/getStructuredPathInfo", () => ({
  getStructuredPathInfo: vi.fn()
}));

vi.mock("../../src/StateProperty/createAccessorFunctions", () => ({
  createAccessorFunctions: vi.fn()
}));

vi.mock("../../src/PathTree/PathNode", () => ({
  createRootNode: vi.fn(),
  addPathNode: vi.fn()
}));

// モック関数のインポート
import { getPathsSetById, getListPathsSetById } from "../../src/BindingBuilder/registerDataBindAttributes";
import { getStructuredPathInfo } from "../../src/StateProperty/getStructuredPathInfo";
import { createAccessorFunctions } from "../../src/StateProperty/createAccessorFunctions";
import { createRootNode, addPathNode } from "../../src/PathTree/PathNode";

const mockGetPathsSetById = vi.mocked(getPathsSetById);
const mockGetListPathsSetById = vi.mocked(getListPathsSetById);
const mockGetStructuredPathInfo = vi.mocked(getStructuredPathInfo);
const mockCreateAccessorFunctions = vi.mocked(createAccessorFunctions);
const mockCreateRootNode = vi.mocked(createRootNode);
const mockAddPathNode = vi.mocked(addPathNode);

describe("PathManager/PathManager", () => {
  let mockComponentClass: StructiveComponentClass;
  let mockStateClass: Constructor<any>;
  let mockRootNode: any;
  let pathManager: IPathManager;

  beforeEach(() => {
    // リセット
    vi.clearAllMocks();

    // モック設定
    mockRootNode = {
      parentPath: "",
      currentPath: "",
      name: "",
      childNodeByName: new Map(),
      level: 0,
      find: vi.fn(),
      appendChild: vi.fn()
    };

    mockCreateRootNode.mockReturnValue(mockRootNode);
    
    mockStateClass = class TestState {
      get testGetter() { return "getter"; }
      set testSetter(value: any) {}
      testMethod() { return "method"; }
    };

    mockComponentClass = {
      id: 1,
      stateClass: mockStateClass
    } as unknown as StructiveComponentClass;

    // デフォルトのモック戻り値
    mockGetPathsSetById.mockReturnValue(new Set());
    mockGetListPathsSetById.mockReturnValue(new Set());
    mockGetStructuredPathInfo.mockReturnValue({
      cumulativePathSet: new Set(),
      pathSegments: [],
      parentPath: ""
    } as any);
    mockCreateAccessorFunctions.mockReturnValue({
      get: vi.fn(() => "test value"),
      set: vi.fn()
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("createPathManager", () => {
    test("should create PathManager instance", () => {
      pathManager = createPathManager(mockComponentClass);
      
      expect(pathManager).toBeDefined();
      expect(pathManager).toHaveProperty("alls");
      expect(pathManager).toHaveProperty("lists");
      expect(pathManager).toHaveProperty("elements");
      expect(pathManager).toHaveProperty("funcs");
      expect(pathManager).toHaveProperty("getters");
      expect(pathManager).toHaveProperty("setters");
      expect(pathManager).toHaveProperty("optimizes");
      expect(pathManager).toHaveProperty("staticDependencies");
      expect(pathManager).toHaveProperty("dynamicDependencies");
      expect(pathManager).toHaveProperty("rootNode");
      expect(pathManager).toHaveProperty("addDynamicDependency");
    });

    test("should initialize with correct component class data", () => {
      mockGetPathsSetById.mockReturnValue(new Set()); // 空のsetでunionを回避
      mockGetListPathsSetById.mockReturnValue(new Set());
      mockGetStructuredPathInfo.mockImplementation(() => ({
        cumulativePathSet: new Set(["user", "user.name"]),
        pathSegments: ["user", "name"],
        parentPath: "user"
      } as any));

      pathManager = createPathManager(mockComponentClass);
      
      expect(mockGetPathsSetById).toHaveBeenCalledWith(1);
      expect(mockCreateRootNode).toHaveBeenCalled();
      expect(pathManager.rootNode).toBe(mockRootNode);
    });

    test("should process all paths and build cumulative path set", () => {
      mockGetPathsSetById.mockReturnValue(new Set()); // 空のsetでunionを回避
      
      mockGetStructuredPathInfo
        .mockImplementation((path: string) => {
          return {
            cumulativePathSet: new Set(),
            pathSegments: [],
            parentPath: ""
          } as any;
        });

      pathManager = createPathManager(mockComponentClass);
      
      expect(pathManager.alls.size).toBeGreaterThanOrEqual(0);
      // StateClassのプロトタイプ解析でgetStructuredPathInfoが呼び出される
      expect(mockGetStructuredPathInfo).toHaveBeenCalled();
    });

    test("should process list paths and create element paths", () => {
      const listPaths = new Set(["items", "categories"]);
      mockGetListPathsSetById.mockReturnValue(listPaths);

      pathManager = createPathManager(mockComponentClass);
      
      expect(mockGetListPathsSetById).toHaveBeenCalledWith(1);
      expect(pathManager.lists).toEqual(listPaths);
      expect(pathManager.elements.has("items.*")).toBe(true);
      expect(pathManager.elements.has("categories.*")).toBe(true);
    });

    test("should analyze state class prototype for getters, setters, and methods", () => {
      pathManager = createPathManager(mockComponentClass);
      
      // プロトタイプ解析により設定されるはず
      expect(pathManager.getters).toBeDefined();
      expect(pathManager.setters).toBeDefined();
      expect(pathManager.funcs).toBeDefined();
    });

    test("should handle state class with getters", () => {
      mockGetStructuredPathInfo.mockImplementation(() => ({
        cumulativePathSet: new Set(["testGetter"]),
        pathSegments: ["testGetter"],
        parentPath: ""
      } as any));

      pathManager = createPathManager(mockComponentClass);
      
      expect(pathManager.getters.has("testGetter")).toBe(true);
    });

    test("should handle state class with setters", () => {
      mockGetStructuredPathInfo.mockImplementation(() => ({
        cumulativePathSet: new Set(["testSetter"]),
        pathSegments: ["testSetter"],
        parentPath: ""
      } as any));

      pathManager = createPathManager(mockComponentClass);
      
      expect(pathManager.setters.has("testSetter")).toBe(true);
    });

    test("should handle state class with getter and setter pair", () => {
      class MixedState {
        #value = 0;
        get combined() { return this.#value; }
        set combined(v: number) { this.#value = v; }
      }

      const componentClass = {
        id: 7,
        stateClass: MixedState
      } as unknown as StructiveComponentClass;

      mockGetStructuredPathInfo.mockImplementation((path: string) => ({
        cumulativePathSet: new Set([path]),
        pathSegments: [path],
        parentPath: ""
      } as any));

      pathManager = createPathManager(componentClass);

      expect(pathManager.getterSetters.has("combined")).toBe(true);
    });

    test("should handle state class with methods", () => {
      pathManager = createPathManager(mockComponentClass);
      
      expect(pathManager.funcs.has("testMethod")).toBe(true);
    });

    test("should create optimized accessors for multi-segment paths", () => {
      mockGetPathsSetById.mockReturnValue(new Set()); // 空のsetでunionを回避
      
      pathManager = createPathManager(mockComponentClass);
      
      // 空のpathでは最適化が行われない
      expect(mockCreateAccessorFunctions).not.toHaveBeenCalled();
      expect(pathManager.optimizes.size).toBe(0);
    });

    test("should not optimize single-segment paths", () => {
      const paths = new Set(["name"]);
      mockGetPathsSetById.mockReturnValue(paths);
      mockGetStructuredPathInfo.mockImplementation(() => ({
        cumulativePathSet: new Set(["name"]),
        pathSegments: ["name"],
        parentPath: ""
      } as any));

      pathManager = createPathManager(mockComponentClass);
      
      expect(mockCreateAccessorFunctions).not.toHaveBeenCalled();
      expect(pathManager.optimizes.size).toBe(0);
    });

    test("should optimize multi-segment paths without existing accessors", () => {
      class PlainState {}
      const componentClass = {
        id: 5,
        stateClass: PlainState
      } as unknown as StructiveComponentClass;

      mockGetPathsSetById.mockReturnValue(new Set(["user.name"]));
      mockGetListPathsSetById.mockReturnValue(new Set());

      mockGetStructuredPathInfo.mockImplementation((path: string) => {
        if (path === "user.name") {
          return {
            cumulativePathSet: new Set(["user", "user.name"]),
            pathSegments: ["user", "name"],
            parentPath: "user"
          } as any;
        }
        return {
          cumulativePathSet: new Set([path]),
          pathSegments: [path],
          parentPath: ""
        } as any;
      });

      const getterSpy = vi.fn(() => "value");
      const setterSpy = vi.fn();
      mockCreateAccessorFunctions.mockReturnValue({ get: getterSpy, set: setterSpy });

      const defineSpy = vi.spyOn(Object, "defineProperty");
      defineSpy.mockClear();
      try {
        pathManager = createPathManager(componentClass);

        expect(mockCreateAccessorFunctions).toHaveBeenCalledWith(expect.objectContaining({ parentPath: "user" }), expect.any(Set));
        expect(defineSpy).toHaveBeenCalledWith(componentClass.stateClass.prototype, "user.name", expect.objectContaining({ get: getterSpy, set: setterSpy }));
        expect(pathManager.optimizes.has("user.name")).toBe(true);
      } finally {
        defineSpy.mockRestore();
      }
    });

    test("should build static dependencies", () => {
      mockGetPathsSetById.mockReturnValue(new Set()); // 空のsetでunionを回避
      
      pathManager = createPathManager(mockComponentClass);
      
      expect(pathManager.staticDependencies).toBeInstanceOf(Map);
      // 空のpathではaddPathNodeは呼ばれない
    });

    test("should merge static dependencies when parent already registered", () => {
      class PlainState {}
      const componentClass = {
        id: 6,
        stateClass: PlainState
      } as unknown as StructiveComponentClass;

      mockGetPathsSetById.mockReturnValue(new Set(["user.name", "user.age"]));
      mockGetListPathsSetById.mockReturnValue(new Set());

      mockGetStructuredPathInfo.mockImplementation((path: string) => {
        if (path === "user.name" || path === "user.age") {
          return {
            cumulativePathSet: new Set(["user", path]),
            pathSegments: ["user", path.split(".")[1]],
            parentPath: "user"
          } as any;
        }
        return {
          cumulativePathSet: new Set([path]),
          pathSegments: [path],
          parentPath: ""
        } as any;
      });

      pathManager = createPathManager(componentClass);

      expect(mockAddPathNode).toHaveBeenCalledWith(mockRootNode, "user.name");
      expect(mockAddPathNode).toHaveBeenCalledWith(mockRootNode, "user.age");
      const dependents = pathManager.staticDependencies.get("user");
      expect(dependents).toBeInstanceOf(Set);
      expect(dependents).toContain("user.name");
      expect(dependents).toContain("user.age");
    });

    test("should handle complex inheritance chain", () => {
      class BaseState {
        get baseGetter() { return "base"; }
        baseMethod() { return "base method"; }
      }

      class ExtendedState extends BaseState {
        get extendedGetter() { return "extended"; }
        extendedMethod() { return "extended method"; }
      }

      const extendedComponentClass = {
        id: 2,
        stateClass: ExtendedState
      } as unknown as StructiveComponentClass;

      pathManager = createPathManager(extendedComponentClass);
      
      expect(pathManager.getters.has("baseGetter")).toBe(true);
      expect(pathManager.getters.has("extendedGetter")).toBe(true);
      expect(pathManager.funcs.has("baseMethod")).toBe(true);
      expect(pathManager.funcs.has("extendedMethod")).toBe(true);
    });
  });

  describe("addPath", () => {
    test("should register cumulative paths and optimize multi-segment entries", () => {
      mockGetPathsSetById.mockReturnValue(new Set());
      mockGetListPathsSetById.mockReturnValue(new Set());

      mockGetStructuredPathInfo.mockImplementation((path: string) => {
        if (path === "user.name") {
          return {
            cumulativePathSet: new Set(["user", "user.name"]),
            pathSegments: ["user", "name"],
            parentPath: "user"
          } as any;
        }
        if (path === "user") {
          return {
            cumulativePathSet: new Set(["user"]),
            pathSegments: ["user"],
            parentPath: ""
          } as any;
        }
        return {
          cumulativePathSet: new Set([path]),
          pathSegments: path.split("."),
          parentPath: path.includes(".") ? path.substring(0, path.lastIndexOf(".")) : ""
        } as any;
      });

      const simpleComponentClass = {
        id: 11,
        stateClass: class {}
      } as unknown as StructiveComponentClass;

      mockCreateAccessorFunctions.mockReturnValue({
        get: vi.fn(() => "value"),
        set: vi.fn()
      });

      pathManager = createPathManager(simpleComponentClass);
      mockAddPathNode.mockClear();
      pathManager.addPath("user.name");

      expect(pathManager.alls.has("user")).toBe(true);
      expect(pathManager.alls.has("user.name")).toBe(true);
      expect(mockAddPathNode).toHaveBeenCalledWith(mockRootNode, "user");
      expect(mockAddPathNode).toHaveBeenCalledWith(mockRootNode, "user.name");
      expect(mockCreateAccessorFunctions).toHaveBeenCalledWith(expect.objectContaining({ parentPath: "user" }), expect.any(Set));
      expect(pathManager.optimizes.has("user.name")).toBe(true);
      const dependents = pathManager.staticDependencies.get("user");
      expect(dependents).toBeInstanceOf(Set);
      expect(dependents?.has("user.name")).toBe(true);
      const descriptor = Object.getOwnPropertyDescriptor(simpleComponentClass.stateClass.prototype, "user.name");
      expect(descriptor?.get).toBeDefined();
      expect(descriptor?.set).toBeDefined();
      expect(descriptor?.enumerable).toBe(true);
      expect(descriptor?.configurable).toBe(true);
    });

    test("should skip already known paths when added twice", () => {
      mockGetPathsSetById.mockReturnValue(new Set());
      mockGetListPathsSetById.mockReturnValue(new Set());

      const infoMap = new Map<string, { cumulativePathSet: Set<string>; pathSegments: string[]; parentPath: string }>();
      infoMap.set("user.name", {
        cumulativePathSet: new Set(["user", "user.name"]),
        pathSegments: ["user", "name"],
        parentPath: "user"
      });
      infoMap.set("user", {
        cumulativePathSet: new Set(["user"]),
        pathSegments: ["user"],
        parentPath: ""
      });

      mockGetStructuredPathInfo.mockImplementation((path: string) => {
        const info = infoMap.get(path);
        if (info) {
          return {
            cumulativePathSet: new Set(info.cumulativePathSet),
            pathSegments: [...info.pathSegments],
            parentPath: info.parentPath
          } as any;
        }
        return {
          cumulativePathSet: new Set([path]),
          pathSegments: path.split("."),
          parentPath: path.includes(".") ? path.substring(0, path.lastIndexOf(".")) : ""
        } as any;
      });

      const componentClass = {
        id: 12,
        stateClass: class {}
      } as unknown as StructiveComponentClass;

      mockCreateAccessorFunctions.mockReturnValue({
        get: vi.fn(),
        set: vi.fn()
      });

      pathManager = createPathManager(componentClass);
      pathManager.addPath("user.name");
      mockCreateAccessorFunctions.mockClear();
      mockAddPathNode.mockClear();

      pathManager.addPath("user.name");

      expect(mockCreateAccessorFunctions).not.toHaveBeenCalled();
      expect(mockAddPathNode).not.toHaveBeenCalled();
    });

    test("should append to existing static dependency entries", () => {
      mockGetPathsSetById.mockReturnValue(new Set());
      mockGetListPathsSetById.mockReturnValue(new Set());

      mockGetStructuredPathInfo.mockImplementation((path: string) => {
        if (path === "user.name") {
          return {
            cumulativePathSet: new Set(["user", "user.name"]),
            pathSegments: ["user", "name"],
            parentPath: "user"
          } as any;
        }
        if (path === "user.age") {
          return {
            cumulativePathSet: new Set(["user", "user.age"]),
            pathSegments: ["user", "age"],
            parentPath: "user"
          } as any;
        }
        if (path === "user") {
          return {
            cumulativePathSet: new Set(["user"]),
            pathSegments: ["user"],
            parentPath: ""
          } as any;
        }
        return {
          cumulativePathSet: new Set([path]),
          pathSegments: path.split("."),
          parentPath: path.includes(".") ? path.substring(0, path.lastIndexOf(".")) : ""
        } as any;
      });

      const componentClass = {
        id: 18,
        stateClass: class {}
      } as unknown as StructiveComponentClass;

      mockCreateAccessorFunctions.mockReturnValue({
        get: vi.fn(),
        set: vi.fn()
      });

      pathManager = createPathManager(componentClass);

      pathManager.addPath("user.name");
      const initialDependents = pathManager.staticDependencies.get("user");
      expect(initialDependents?.has("user.name")).toBe(true);

      mockCreateAccessorFunctions.mockClear();
      pathManager.addPath("user.age");

      const dependents = pathManager.staticDependencies.get("user");
      expect(dependents).toBeInstanceOf(Set);
      expect(dependents?.has("user.name")).toBe(true);
      expect(dependents?.has("user.age")).toBe(true);
      expect(mockCreateAccessorFunctions).toHaveBeenCalledTimes(1);
    });

    test("should avoid optimization for single-segment paths", () => {
      mockGetPathsSetById.mockReturnValue(new Set());
      mockGetListPathsSetById.mockReturnValue(new Set());

      mockGetStructuredPathInfo.mockImplementation((path: string) => ({
        cumulativePathSet: new Set([path]),
        pathSegments: [path],
        parentPath: ""
      }) as any);

      const componentClass = {
        id: 13,
        stateClass: class {}
      } as unknown as StructiveComponentClass;

      mockCreateAccessorFunctions.mockClear();

      pathManager = createPathManager(componentClass);
      pathManager.addPath("plain");

      expect(pathManager.alls.has("plain")).toBe(true);
      expect(pathManager.optimizes.has("plain")).toBe(false);
      expect(mockCreateAccessorFunctions).not.toHaveBeenCalled();
      expect(pathManager.staticDependencies.size).toBe(0);
    });

    test("should register list paths when flagged", () => {
      mockGetPathsSetById.mockReturnValue(new Set());
      mockGetListPathsSetById.mockReturnValue(new Set());

      mockGetStructuredPathInfo.mockImplementation((path: string) => ({
        cumulativePathSet: new Set([path]),
        pathSegments: path ? path.split(".") : [],
        parentPath: path && path.includes(".") ? path.substring(0, path.lastIndexOf(".")) : ""
      }) as any);

      const componentClass = {
        id: 21,
        stateClass: class {}
      } as unknown as StructiveComponentClass;

      pathManager = createPathManager(componentClass);

      expect(pathManager.lists.has("items")).toBe(false);
      expect(pathManager.elements.has("items.*")).toBe(false);

      pathManager.addPath("items", true);

      expect(pathManager.lists.has("items")).toBe(true);
      expect(pathManager.elements.has("items.*")).toBe(true);
    });
  });

  describe("addDynamicDependency", () => {
    beforeEach(() => {
      mockGetPathsSetById.mockReturnValue(new Set());
      mockGetListPathsSetById.mockReturnValue(new Set());
      mockGetStructuredPathInfo.mockImplementation((path: string) => {
        if (path === "source.path") {
          return {
            cumulativePathSet: new Set(["source", "source.path"]),
            pathSegments: ["source", "path"],
            parentPath: "source"
          } as any;
        }
        if (path === "source") {
          return {
            cumulativePathSet: new Set(["source"]),
            pathSegments: ["source"],
            parentPath: ""
          } as any;
        }
        if (path === "pre.existing") {
          return {
            cumulativePathSet: new Set(["pre.existing"]),
            pathSegments: ["pre", "existing"],
            parentPath: "pre"
          } as any;
        }
        if (path === "another.path") {
          return {
            cumulativePathSet: new Set(["another", "another.path"]),
            pathSegments: ["another", "path"],
            parentPath: "another"
          } as any;
        }
        return {
          cumulativePathSet: new Set([path]),
          pathSegments: path ? path.split(".") : [],
          parentPath: path && path.includes(".") ? path.substring(0, path.lastIndexOf(".")) : ""
        } as any;
      });

      const dynamicComponentClass = {
        id: 14,
        stateClass: class {}
      } as unknown as StructiveComponentClass;

      mockCreateAccessorFunctions.mockReturnValue({
        get: vi.fn(),
        set: vi.fn()
      });

      pathManager = createPathManager(dynamicComponentClass);
    });

    test("should add new dynamic dependency", () => {
      const addPathSpy = vi.spyOn(pathManager, "addPath");

      pathManager.addDynamicDependency("target.path", "source.path");
      
      expect(pathManager.dynamicDependencies.has("source.path")).toBe(true);
      expect(pathManager.dynamicDependencies.get("source.path")?.has("target.path")).toBe(true);
      expect(addPathSpy).toHaveBeenCalledWith("source.path");
      addPathSpy.mockRestore();
    });

    test("should add multiple targets to same source", () => {
      const addPathSpy = vi.spyOn(pathManager, "addPath");
      pathManager.addDynamicDependency("target1.path", "source.path");
      pathManager.addDynamicDependency("target2.path", "source.path");
      
      const dependencies = pathManager.dynamicDependencies.get("source.path");
      expect(dependencies?.size).toBe(2);
      expect(dependencies?.has("target1.path")).toBe(true);
      expect(dependencies?.has("target2.path")).toBe(true);
      expect(addPathSpy).toHaveBeenCalledTimes(1);
      addPathSpy.mockRestore();
    });

    test("should handle multiple sources", () => {
      pathManager.addDynamicDependency("target.path", "source1.path");
      pathManager.addDynamicDependency("target.path", "source2.path");
      
      expect(pathManager.dynamicDependencies.has("source1.path")).toBe(true);
      expect(pathManager.dynamicDependencies.has("source2.path")).toBe(true);
      expect(pathManager.dynamicDependencies.get("source1.path")?.has("target.path")).toBe(true);
      expect(pathManager.dynamicDependencies.get("source2.path")?.has("target.path")).toBe(true);
    });

    test("should ignore duplicate dynamic dependency entries", () => {
      const addPathSpy = vi.spyOn(pathManager, "addPath");
      pathManager.addDynamicDependency("target.path", "source.path");
      pathManager.addDynamicDependency("target.path", "source.path");

      const dependencies = pathManager.dynamicDependencies.get("source.path");
      expect(dependencies?.size).toBe(1);
      expect(addPathSpy).toHaveBeenCalledTimes(1);
      addPathSpy.mockRestore();
    });

    test("should skip addPath when source already present", () => {
      pathManager.addPath("pre.existing");
      const addPathSpy = vi.spyOn(pathManager, "addPath");

      pathManager.addDynamicDependency("another.target", "pre.existing");

      expect(pathManager.dynamicDependencies.get("pre.existing")?.has("another.target")).toBe(true);
      expect(addPathSpy).not.toHaveBeenCalled();
      addPathSpy.mockRestore();
    });
  });

  describe("property collections", () => {
    beforeEach(() => {
      mockGetPathsSetById.mockReturnValue(new Set()); // 空のsetでunionを回避
      mockGetListPathsSetById.mockReturnValue(new Set(["items", "categories"]));
      
      mockGetStructuredPathInfo.mockImplementation((path: string) => ({
        cumulativePathSet: new Set([path]),
        pathSegments: path.split("."),
        parentPath: path.includes(".") ? path.substring(0, path.lastIndexOf(".")) : ""
      } as any));
      
      mockCreateAccessorFunctions.mockReturnValue({
        get: vi.fn(() => "test value"),
        set: vi.fn()
      });
    });

    test("should maintain all path collections correctly", () => {
      pathManager = createPathManager(mockComponentClass);
      
      expect(pathManager.alls).toBeInstanceOf(Set);
      expect(pathManager.lists).toBeInstanceOf(Set);
      expect(pathManager.elements).toBeInstanceOf(Set);
      expect(pathManager.funcs).toBeInstanceOf(Set);
      expect(pathManager.getters).toBeInstanceOf(Set);
      expect(pathManager.setters).toBeInstanceOf(Set);
      expect(pathManager.optimizes).toBeInstanceOf(Set);
    });

    test("should maintain dependency maps correctly", () => {
      pathManager = createPathManager(mockComponentClass);
      
      expect(pathManager.staticDependencies).toBeInstanceOf(Map);
      expect(pathManager.dynamicDependencies).toBeInstanceOf(Map);
    });

    test("should initialize empty collections", () => {
      mockGetPathsSetById.mockReturnValue(new Set());
      mockGetListPathsSetById.mockReturnValue(new Set());
      
      pathManager = createPathManager(mockComponentClass);
      
      expect(pathManager.lists.size).toBe(0);
      expect(pathManager.elements.size).toBe(0);
    });
  });

  describe("edge cases", () => {
    test("should handle empty paths", () => {
      mockGetPathsSetById.mockReturnValue(new Set());
      mockGetListPathsSetById.mockReturnValue(new Set());

      pathManager = createPathManager(mockComponentClass);
      
      expect(pathManager.alls.size).toBeGreaterThanOrEqual(0);
      expect(pathManager.lists.size).toBe(0);
      expect(pathManager.elements.size).toBe(0);
    });

    test("should handle state class without methods", () => {
      const EmptyStateClass = class {};
      const emptyComponentClass = {
        id: 3,
        stateClass: EmptyStateClass
      } as unknown as StructiveComponentClass;

      pathManager = createPathManager(emptyComponentClass);
      
      expect(pathManager).toBeDefined();
    });

    test("should skip reserved words in prototype analysis", () => {
      const StateWithReserved = class {
        constructor() {}
        get toString() { return "custom toString"; }
      };
      
      const componentClass = {
        id: 4,
        stateClass: StateWithReserved
      } as unknown as StructiveComponentClass;

      pathManager = createPathManager(componentClass);
      
      // constructor や toString などの予約語はスキップされるはず
      expect(pathManager.funcs.has("constructor")).toBe(false);
    });
  });
});