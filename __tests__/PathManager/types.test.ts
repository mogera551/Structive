/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, beforeEach } from "vitest";
import type { IPathManager, Dependencies } from "../../src/PathManager/types";
import type { IPathNode } from "../../src/PathTree/types";

describe("PathManager/types", () => {
  describe("Dependencies type", () => {
    test("should create Dependencies map with string keys and Set values", () => {
      const dependencies: Dependencies<string> = new Map();
      
      expect(dependencies).toBeInstanceOf(Map);
      expect(dependencies.size).toBe(0);
    });

    test("should support string keys and string Set values", () => {
      const dependencies: Dependencies<string> = new Map();
      const sourceKey = "parent.path";
      const targetSet = new Set(["child1.path", "child2.path"]);
      
      dependencies.set(sourceKey, targetSet);
      
      expect(dependencies.has(sourceKey)).toBe(true);
      expect(dependencies.get(sourceKey)).toBe(targetSet);
      expect(dependencies.get(sourceKey)?.size).toBe(2);
    });

    test("should work with generic type parameter", () => {
      const numericDependencies: Dependencies<number> = new Map();
      numericDependencies.set(1, new Set([2, 3]));
      
      expect(numericDependencies.get(1)?.has(2)).toBe(true);
      expect(numericDependencies.get(1)?.has(3)).toBe(true);
    });

    test("should support Map operations", () => {
      const dependencies: Dependencies<string> = new Map();
      
      // Test Map interface methods
      expect(typeof dependencies.set).toBe("function");
      expect(typeof dependencies.get).toBe("function");
      expect(typeof dependencies.has).toBe("function");
      expect(typeof dependencies.delete).toBe("function");
      expect(typeof dependencies.clear).toBe("function");
      expect(typeof dependencies.keys).toBe("function");
      expect(typeof dependencies.values).toBe("function");
      expect(typeof dependencies.entries).toBe("function");
      expect(typeof dependencies.forEach).toBe("function");
    });
  });

  describe("IPathManager interface", () => {
    let mockPathManager: IPathManager;
    let mockRootNode: IPathNode;

    beforeEach(() => {
      mockRootNode = {
        parentPath: "",
        currentPath: "",
        name: "",
        childNodeByName: new Map(),
        level: 0,
        find: () => null,
        appendChild: () => mockRootNode
      };

      mockPathManager = {
        alls: new Set<string>(),
        lists: new Set<string>(),
        elements: new Set<string>(),
        funcs: new Set<string>(),
        getters: new Set<string>(),
        setters: new Set<string>(),
        optimizes: new Set<string>(),
        staticDependencies: new Map<string, Set<string>>(),
        dynamicDependencies: new Map<string, Set<string>>(),
        rootNode: mockRootNode,
        addDynamicDependency: (target: string, source: string) => {}
      };
    });

    test("should have all required Set properties", () => {
      expect(mockPathManager.alls).toBeInstanceOf(Set);
      expect(mockPathManager.lists).toBeInstanceOf(Set);
      expect(mockPathManager.elements).toBeInstanceOf(Set);
      expect(mockPathManager.funcs).toBeInstanceOf(Set);
      expect(mockPathManager.getters).toBeInstanceOf(Set);
      expect(mockPathManager.setters).toBeInstanceOf(Set);
      expect(mockPathManager.optimizes).toBeInstanceOf(Set);
    });

    test("should have all required Map properties", () => {
      expect(mockPathManager.staticDependencies).toBeInstanceOf(Map);
      expect(mockPathManager.dynamicDependencies).toBeInstanceOf(Map);
    });

    test("should have rootNode as IPathNode", () => {
      expect(mockPathManager.rootNode).toBeDefined();
      expect(mockPathManager.rootNode).toHaveProperty("parentPath");
      expect(mockPathManager.rootNode).toHaveProperty("currentPath");
      expect(mockPathManager.rootNode).toHaveProperty("name");
      expect(mockPathManager.rootNode).toHaveProperty("childNodeByName");
      expect(mockPathManager.rootNode).toHaveProperty("level");
      expect(mockPathManager.rootNode).toHaveProperty("find");
      expect(mockPathManager.rootNode).toHaveProperty("appendChild");
    });

    test("should have addDynamicDependency method", () => {
      expect(typeof mockPathManager.addDynamicDependency).toBe("function");
    });

    test("should support all paths management", () => {
      mockPathManager.alls.add("user.name");
      mockPathManager.alls.add("user.email");
      mockPathManager.alls.add("profile.age");
      
      expect(mockPathManager.alls.size).toBe(3);
      expect(mockPathManager.alls.has("user.name")).toBe(true);
      expect(mockPathManager.alls.has("user.email")).toBe(true);
      expect(mockPathManager.alls.has("profile.age")).toBe(true);
    });

    test("should support list paths management", () => {
      mockPathManager.lists.add("items");
      mockPathManager.lists.add("categories");
      
      expect(mockPathManager.lists.size).toBe(2);
      expect(mockPathManager.lists.has("items")).toBe(true);
      expect(mockPathManager.lists.has("categories")).toBe(true);
    });

    test("should support element paths management", () => {
      mockPathManager.elements.add("items.*");
      mockPathManager.elements.add("categories.*");
      
      expect(mockPathManager.elements.size).toBe(2);
      expect(mockPathManager.elements.has("items.*")).toBe(true);
      expect(mockPathManager.elements.has("categories.*")).toBe(true);
    });

    test("should support function paths management", () => {
      mockPathManager.funcs.add("calculateTotal");
      mockPathManager.funcs.add("validateForm");
      
      expect(mockPathManager.funcs.size).toBe(2);
      expect(mockPathManager.funcs.has("calculateTotal")).toBe(true);
      expect(mockPathManager.funcs.has("validateForm")).toBe(true);
    });

    test("should support getter paths management", () => {
      mockPathManager.getters.add("fullName");
      mockPathManager.getters.add("isValid");
      
      expect(mockPathManager.getters.size).toBe(2);
      expect(mockPathManager.getters.has("fullName")).toBe(true);
      expect(mockPathManager.getters.has("isValid")).toBe(true);
    });

    test("should support setter paths management", () => {
      mockPathManager.setters.add("userName");
      mockPathManager.setters.add("password");
      
      expect(mockPathManager.setters.size).toBe(2);
      expect(mockPathManager.setters.has("userName")).toBe(true);
      expect(mockPathManager.setters.has("password")).toBe(true);
    });

    test("should support optimized paths management", () => {
      mockPathManager.optimizes.add("user.profile.details.address");
      mockPathManager.optimizes.add("settings.preferences.display");
      
      expect(mockPathManager.optimizes.size).toBe(2);
      expect(mockPathManager.optimizes.has("user.profile.details.address")).toBe(true);
      expect(mockPathManager.optimizes.has("settings.preferences.display")).toBe(true);
    });

    test("should support static dependencies management", () => {
      const childrenSet = new Set(["user.name", "user.email"]);
      mockPathManager.staticDependencies.set("user", childrenSet);
      
      expect(mockPathManager.staticDependencies.size).toBe(1);
      expect(mockPathManager.staticDependencies.has("user")).toBe(true);
      expect(mockPathManager.staticDependencies.get("user")).toBe(childrenSet);
      expect(mockPathManager.staticDependencies.get("user")?.size).toBe(2);
    });

    test("should support dynamic dependencies management", () => {
      const targetSet = new Set(["computed.fullName"]);
      mockPathManager.dynamicDependencies.set("user.name", targetSet);
      
      expect(mockPathManager.dynamicDependencies.size).toBe(1);
      expect(mockPathManager.dynamicDependencies.has("user.name")).toBe(true);
      expect(mockPathManager.dynamicDependencies.get("user.name")).toBe(targetSet);
    });

    test("should handle complex dependency relationships", () => {
      // 静的依存関係の設定
      mockPathManager.staticDependencies.set("user", new Set(["user.name", "user.email"]));
      mockPathManager.staticDependencies.set("user.profile", new Set(["user.profile.age", "user.profile.bio"]));
      
      // 動的依存関係の設定
      mockPathManager.dynamicDependencies.set("user.name", new Set(["computed.displayName"]));
      mockPathManager.dynamicDependencies.set("user.email", new Set(["computed.displayName", "computed.contactInfo"]));
      
      // 静的依存関係の確認
      expect(mockPathManager.staticDependencies.get("user")?.has("user.name")).toBe(true);
      expect(mockPathManager.staticDependencies.get("user")?.has("user.email")).toBe(true);
      expect(mockPathManager.staticDependencies.get("user.profile")?.has("user.profile.age")).toBe(true);
      expect(mockPathManager.staticDependencies.get("user.profile")?.has("user.profile.bio")).toBe(true);
      
      // 動的依存関係の確認
      expect(mockPathManager.dynamicDependencies.get("user.name")?.has("computed.displayName")).toBe(true);
      expect(mockPathManager.dynamicDependencies.get("user.email")?.has("computed.displayName")).toBe(true);
      expect(mockPathManager.dynamicDependencies.get("user.email")?.has("computed.contactInfo")).toBe(true);
    });

    test("should work with addDynamicDependency method", () => {
      let capturedTarget: string = "";
      let capturedSource: string = "";
      
      mockPathManager.addDynamicDependency = (target: string, source: string) => {
        capturedTarget = target;
        capturedSource = source;
        const existing = mockPathManager.dynamicDependencies.get(source) || new Set();
        existing.add(target);
        mockPathManager.dynamicDependencies.set(source, existing);
      };
      
      mockPathManager.addDynamicDependency("target.path", "source.path");
      
      expect(capturedTarget).toBe("target.path");
      expect(capturedSource).toBe("source.path");
      expect(mockPathManager.dynamicDependencies.get("source.path")?.has("target.path")).toBe(true);
    });

    test("should handle empty collections", () => {
      expect(mockPathManager.alls.size).toBe(0);
      expect(mockPathManager.lists.size).toBe(0);
      expect(mockPathManager.elements.size).toBe(0);
      expect(mockPathManager.funcs.size).toBe(0);
      expect(mockPathManager.getters.size).toBe(0);
      expect(mockPathManager.setters.size).toBe(0);
      expect(mockPathManager.optimizes.size).toBe(0);
      expect(mockPathManager.staticDependencies.size).toBe(0);
      expect(mockPathManager.dynamicDependencies.size).toBe(0);
    });

    test("should maintain separate collections for different path types", () => {
      const path = "test.path";
      
      mockPathManager.alls.add(path);
      mockPathManager.lists.add(path);
      mockPathManager.elements.add(path + ".*");
      mockPathManager.funcs.add(path);
      mockPathManager.getters.add(path);
      mockPathManager.setters.add(path);
      mockPathManager.optimizes.add(path);
      
      // 各コレクションは独立している
      expect(mockPathManager.alls.has(path)).toBe(true);
      expect(mockPathManager.lists.has(path)).toBe(true);
      expect(mockPathManager.elements.has(path + ".*")).toBe(true);
      expect(mockPathManager.funcs.has(path)).toBe(true);
      expect(mockPathManager.getters.has(path)).toBe(true);
      expect(mockPathManager.setters.has(path)).toBe(true);
      expect(mockPathManager.optimizes.has(path)).toBe(true);
      
      // 各コレクションのサイズは1
      expect(mockPathManager.alls.size).toBe(1);
      expect(mockPathManager.lists.size).toBe(1);
      expect(mockPathManager.elements.size).toBe(1);
      expect(mockPathManager.funcs.size).toBe(1);
      expect(mockPathManager.getters.size).toBe(1);
      expect(mockPathManager.setters.size).toBe(1);
      expect(mockPathManager.optimizes.size).toBe(1);
    });
  });
});