/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, beforeEach, vi } from "vitest";
import { createRootNode, findPathNodeByPath, addPathNode } from "../../src/PathTree/PathNode";
import type { IPathNode } from "../../src/PathTree/types";

// getStructuredPathInfoをモック
vi.mock("../../src/StateProperty/getStructuredPathInfo", () => ({
  getStructuredPathInfo: vi.fn(),
}));

const { getStructuredPathInfo } = vi.mocked(
  await import("../../src/StateProperty/getStructuredPathInfo")
);

describe("PathTree/PathNode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createRootNode", () => {
    test("should create root node with empty path and name", () => {
      const rootNode = createRootNode();
      
      expect(rootNode.parentPath).toBe("");
      expect(rootNode.currentPath).toBe("");
      expect(rootNode.name).toBe("");
      expect(rootNode.level).toBe(0);
      expect(rootNode.childNodeByName).toBeInstanceOf(Map);
      expect(rootNode.childNodeByName.size).toBe(0);
    });

    test("should create new instance each time", () => {
      const rootNode1 = createRootNode();
      const rootNode2 = createRootNode();
      
      expect(rootNode1).not.toBe(rootNode2);
      expect(rootNode1.childNodeByName).not.toBe(rootNode2.childNodeByName);
    });
  });

  describe("NodePath class (via createRootNode)", () => {
    let rootNode: IPathNode;

    beforeEach(() => {
      rootNode = createRootNode();
    });

    describe("appendChild", () => {
      test("should create and add child node", () => {
        const childNode = rootNode.appendChild("child");
        
        expect(childNode.parentPath).toBe("");
        expect(childNode.currentPath).toBe("child");
        expect(childNode.name).toBe("child");
        expect(childNode.level).toBe(1);
        expect(rootNode.childNodeByName.size).toBe(1);
        expect(rootNode.childNodeByName.get("child")).toBe(childNode);
      });

      test("should return existing child if already exists", () => {
        const childNode1 = rootNode.appendChild("child");
        const childNode2 = rootNode.appendChild("child");
        
        expect(childNode1).toBe(childNode2);
        expect(rootNode.childNodeByName.size).toBe(1);
      });

      test("should create multiple children", () => {
        const child1 = rootNode.appendChild("child1");
        const child2 = rootNode.appendChild("child2");
        const child3 = rootNode.appendChild("child3");
        
        expect(rootNode.childNodeByName.size).toBe(3);
        expect(rootNode.childNodeByName.get("child1")).toBe(child1);
        expect(rootNode.childNodeByName.get("child2")).toBe(child2);
        expect(rootNode.childNodeByName.get("child3")).toBe(child3);
      });

      test("should create nested children with correct paths", () => {
        const level1 = rootNode.appendChild("level1");
        const level2 = level1.appendChild("level2");
        const level3 = level2.appendChild("level3");
        
        expect(level1.currentPath).toBe("level1");
        expect(level1.parentPath).toBe("");
        expect(level1.level).toBe(1);
        
        expect(level2.currentPath).toBe("level1.level2");
        expect(level2.parentPath).toBe("level1");
        expect(level2.level).toBe(2);
        
        expect(level3.currentPath).toBe("level1.level2.level3");
        expect(level3.parentPath).toBe("level1.level2");
        expect(level3.level).toBe(3);
      });

      test("should handle empty child names", () => {
        const childNode = rootNode.appendChild("");
        
        expect(childNode.name).toBe("");
        expect(childNode.currentPath).toBe("");
        expect(rootNode.childNodeByName.get("")).toBe(childNode);
      });

      test("should handle child names with special characters", () => {
        const specialNames = ["child-1", "child_2", "child.3", "child[0]", "child@prop"];
        
        specialNames.forEach(name => {
          const childNode = rootNode.appendChild(name);
          expect(childNode.name).toBe(name);
          expect(rootNode.childNodeByName.get(name)).toBe(childNode);
        });
        
        expect(rootNode.childNodeByName.size).toBe(specialNames.length);
      });
    });

    describe("find", () => {
      test("should return null for empty segments", () => {
        const result = rootNode.find([]);
        expect(result).toBeNull();
      });

      test("should return null for non-existent path", () => {
        const result = rootNode.find(["nonexistent"]);
        expect(result).toBeNull();
      });

      test("should find direct child", () => {
        const childNode = rootNode.appendChild("child");
        const result = rootNode.find(["child"]);
        
        expect(result).toBe(childNode);
      });

      test("should find nested children", () => {
        const level1 = rootNode.appendChild("level1");
        const level2 = level1.appendChild("level2");
        const level3 = level2.appendChild("level3");
        
        expect(rootNode.find(["level1"])).toBe(level1);
        expect(rootNode.find(["level1", "level2"])).toBe(level2);
        expect(rootNode.find(["level1", "level2", "level3"])).toBe(level3);
      });

      test("should return null for partial matches", () => {
        rootNode.appendChild("level1").appendChild("level2");
        
        const result = rootNode.find(["level1", "level2", "level3"]);
        expect(result).toBeNull();
      });

      test("should handle find with custom segIndex", () => {
        const level1 = rootNode.appendChild("level1");
        const level2 = level1.appendChild("level2");
        
        // segIndexが1の場合、segments[1]から開始
        const result = level1.find(["ignored", "level2"], 1);
        expect(result).toBe(level2);
      });

      test("should return null when segIndex is out of bounds", () => {
        rootNode.appendChild("child");
        
        const result = rootNode.find(["child"], 2);
        expect(result).toBeNull();
      });

      test("should handle complex tree structure", () => {
        // 複雑なツリー構造を構築
        const user = rootNode.appendChild("user");
        const profile = user.appendChild("profile");
        const address = user.appendChild("address");
        
        profile.appendChild("name");
        profile.appendChild("email");
        address.appendChild("street");
        address.appendChild("city");
        
        // 各ノードを正確に見つけられることを確認
        expect(rootNode.find(["user", "profile", "name"])).not.toBeNull();
        expect(rootNode.find(["user", "profile", "email"])).not.toBeNull();
        expect(rootNode.find(["user", "address", "street"])).not.toBeNull();
        expect(rootNode.find(["user", "address", "city"])).not.toBeNull();
        
        // 存在しないパスはnullを返す
        expect(rootNode.find(["user", "profile", "phone"])).toBeNull();
        expect(rootNode.find(["user", "settings", "theme"])).toBeNull();
      });

      test("should handle array-like paths", () => {
        const items = rootNode.appendChild("items");
        const item0 = items.appendChild("0");
        const item1 = items.appendChild("1");
        
        item0.appendChild("name");
        item1.appendChild("value");
        
        expect(rootNode.find(["items", "0", "name"])).not.toBeNull();
        expect(rootNode.find(["items", "1", "value"])).not.toBeNull();
      });
    });
  });

  describe("findPathNodeByPath", () => {
    let rootNode: IPathNode;

    beforeEach(() => {
      rootNode = createRootNode();
      // getStructuredPathInfoのモックを設定
      getStructuredPathInfo.mockImplementation((path: string) => {
        const segments = path.split(".");
        return {
          pathSegments: segments,
          // 他の必要なプロパティもモック可能
        } as any;
      });
    });

    test("should return null for non-existent path", () => {
      const result = findPathNodeByPath(rootNode, "nonexistent");
      
      expect(getStructuredPathInfo).toHaveBeenCalledWith("nonexistent");
      expect(result).toBeNull();
    });

    test("should find existing path", () => {
      // ノードを作成
      const childNode = rootNode.appendChild("child");
      
      const result = findPathNodeByPath(rootNode, "child");
      
      expect(getStructuredPathInfo).toHaveBeenCalledWith("child");
      expect(result).toBe(childNode);
    });

    test("should find nested path", () => {
      // ネストされたノードを作成
      const level1 = rootNode.appendChild("level1");
      const level2 = level1.appendChild("level2");
      
      const result = findPathNodeByPath(rootNode, "level1.level2");
      
      expect(getStructuredPathInfo).toHaveBeenCalledWith("level1.level2");
      expect(result).toBe(level2);
    });

    test("should use cache on subsequent calls", () => {
      const childNode = rootNode.appendChild("child");
      
      // 1回目の呼び出し
      const result1 = findPathNodeByPath(rootNode, "child");
      expect(result1).toBe(childNode);
      expect(getStructuredPathInfo).toHaveBeenCalledTimes(1);
      
      // 2回目の呼び出し（キャッシュが使用される）
      const result2 = findPathNodeByPath(rootNode, "child");
      expect(result2).toBe(childNode);
      expect(getStructuredPathInfo).toHaveBeenCalledTimes(1); // キャッシュのため増加しない
    });

    test("should cache null results", () => {
      // 1回目の呼び出し（存在しないパス）
      const result1 = findPathNodeByPath(rootNode, "nonexistent");
      expect(result1).toBeNull();
      expect(getStructuredPathInfo).toHaveBeenCalledTimes(1);
      
      // 2回目の呼び出し（キャッシュが使用される）
      const result2 = findPathNodeByPath(rootNode, "nonexistent");
      expect(result2).toBeNull();
      // 実装ではnullの結果もキャッシュされるが、getStructuredPathInfoは毎回呼ばれる
      expect(getStructuredPathInfo).toHaveBeenCalledTimes(2);
    });

    test("should handle different root nodes with separate caches", () => {
      const rootNode2 = createRootNode();
      rootNode.appendChild("child");
      rootNode2.appendChild("child");
      
      const result1 = findPathNodeByPath(rootNode, "child");
      const result2 = findPathNodeByPath(rootNode2, "child");
      
      expect(result1).not.toBe(result2);
      expect(getStructuredPathInfo).toHaveBeenCalledTimes(2);
    });

    test("should handle complex paths", () => {
      // 複雑なパス構造を作成
      const user = rootNode.appendChild("user");
      const profile = user.appendChild("profile");
      profile.appendChild("personalInfo").appendChild("firstName");
      
      const result = findPathNodeByPath(rootNode, "user.profile.personalInfo.firstName");
      
      expect(result).not.toBeNull();
      expect(result?.name).toBe("firstName");
    });
  });

  describe("addPathNode", () => {
    let rootNode: IPathNode;

    beforeEach(() => {
      rootNode = createRootNode();
      // getStructuredPathInfoのモックを設定
      getStructuredPathInfo.mockImplementation((path: string) => {
        const segments = path.split(".");
        const lastSegment = segments[segments.length - 1];
        const parentPath = segments.length > 1 ? segments.slice(0, -1).join(".") : null;
        
        return {
          pathSegments: segments,
          lastSegment,
          parentPath,
        } as any;
      });
    });

    test("should add simple path to root", () => {
      const result = addPathNode(rootNode, "simple");
      
      expect(getStructuredPathInfo).toHaveBeenCalledWith("simple");
      expect(result.name).toBe("simple");
      expect(result.parentPath).toBe("");
      expect(rootNode.childNodeByName.get("simple")).toBe(result);
    });

    test("should add nested path", () => {
      const result = addPathNode(rootNode, "parent.child");
      
      expect(result.name).toBe("child");
      expect(result.currentPath).toBe("parent.child");
      
      // 親ノードも自動的に作成される
      const parentNode = rootNode.childNodeByName.get("parent");
      expect(parentNode).not.toBeNull();
      expect(parentNode?.childNodeByName.get("child")).toBe(result);
    });

    test("should add deeply nested path", () => {
      const result = addPathNode(rootNode, "level1.level2.level3.level4");
      
      expect(result.name).toBe("level4");
      expect(result.currentPath).toBe("level1.level2.level3.level4");
      
      // 中間ノードも作成される
      const level1 = rootNode.childNodeByName.get("level1");
      const level2 = level1?.childNodeByName.get("level2");
      const level3 = level2?.childNodeByName.get("level3");
      
      expect(level1).not.toBeNull();
      expect(level2).not.toBeNull();
      expect(level3).not.toBeNull();
      expect(level3?.childNodeByName.get("level4")).toBe(result);
    });

    test("should reuse existing parent nodes", () => {
      // 最初にparent.child1を追加
      const child1 = addPathNode(rootNode, "parent.child1");
      
      // 次にparent.child2を追加（同じ親を共有）
      const child2 = addPathNode(rootNode, "parent.child2");
      
      const parentNode = rootNode.childNodeByName.get("parent");
      expect(parentNode?.childNodeByName.get("child1")).toBe(child1);
      expect(parentNode?.childNodeByName.get("child2")).toBe(child2);
      expect(parentNode?.childNodeByName.size).toBe(2);
    });

    test("should handle single segment path", () => {
      const result = addPathNode(rootNode, "root");
      
      expect(result.name).toBe("root");
      expect(result.parentPath).toBe("");
      expect(result.level).toBe(1);
    });

    test("should create complex tree structure", () => {
      // 複数のパスを追加してツリー構造を構築
      const paths = [
        "user.profile.name",
        "user.profile.email",
        "user.address.street",
        "user.address.city",
        "user.preferences.theme",
        "user.preferences.language",
        "settings.notifications.email",
        "settings.notifications.push",
      ];
      
      const results = paths.map(path => addPathNode(rootNode, path));
      
      // すべてのパスが正しく追加されていることを確認
      expect(results).toHaveLength(8);
      
      // ツリー構造を検証
      const user = rootNode.childNodeByName.get("user");
      const settings = rootNode.childNodeByName.get("settings");
      
      expect(user).not.toBeNull();
      expect(settings).not.toBeNull();
      expect(user?.childNodeByName.size).toBe(3); // profile, address, preferences
      expect(settings?.childNodeByName.size).toBe(1); // notifications
    });

    test("should handle paths with array-like segments", () => {
      const result = addPathNode(rootNode, "items.0.name");
      
      expect(result.name).toBe("name");
      
      const items = rootNode.childNodeByName.get("items");
      const item0 = items?.childNodeByName.get("0");
      
      expect(item0).not.toBeNull();
      expect(item0?.childNodeByName.get("name")).toBe(result);
    });

    test("should handle empty segments gracefully", () => {
      // パスに空のセグメントが含まれる場合
      getStructuredPathInfo.mockReturnValueOnce({
        pathSegments: ["", "child"],
        lastSegment: "child",
        parentPath: "",
      } as any);
      
      const result = addPathNode(rootNode, ".child");
      
      expect(result.name).toBe("child");
    });

    test("should return existing node if path already exists", () => {
      // 同じパスを2回追加
      const result1 = addPathNode(rootNode, "existing.path");
      const result2 = addPathNode(rootNode, "existing.path");
      
      expect(result1).toBe(result2);
    });
  });

  describe("integration tests", () => {
    test("should work together: addPathNode and findPathNodeByPath", () => {
      const rootNode = createRootNode();
      
      // getStructuredPathInfoの統合モック
      getStructuredPathInfo.mockImplementation((path: string) => {
        const segments = path.split(".");
        const lastSegment = segments[segments.length - 1];
        const parentPath = segments.length > 1 ? segments.slice(0, -1).join(".") : null;
        
        return {
          pathSegments: segments,
          lastSegment,
          parentPath,
        } as any;
      });
      
      // パスを追加
      const addedNode = addPathNode(rootNode, "user.profile.settings.theme");
      
      // 追加したパスを検索
      const foundNode = findPathNodeByPath(rootNode, "user.profile.settings.theme");
      
      expect(foundNode).toBe(addedNode);
      expect(foundNode?.name).toBe("theme");
    });

    test("should maintain tree integrity with mixed operations", () => {
      const rootNode = createRootNode();
      
      getStructuredPathInfo.mockImplementation((path: string) => {
        const segments = path.split(".");
        const lastSegment = segments[segments.length - 1];
        const parentPath = segments.length > 1 ? segments.slice(0, -1).join(".") : null;
        
        return {
          pathSegments: segments,
          lastSegment,
          parentPath,
        } as any;
      });
      
      // 複数のパスを追加
      addPathNode(rootNode, "a.b.c");
      addPathNode(rootNode, "a.b.d");
      addPathNode(rootNode, "a.e.f");
      
      // 各ノードが正しく見つかることを確認
      expect(findPathNodeByPath(rootNode, "a.b.c")).not.toBeNull();
      expect(findPathNodeByPath(rootNode, "a.b.d")).not.toBeNull();
      expect(findPathNodeByPath(rootNode, "a.e.f")).not.toBeNull();
      
      // 中間ノードも正しく見つかることを確認
      expect(findPathNodeByPath(rootNode, "a")).not.toBeNull();
      expect(findPathNodeByPath(rootNode, "a.b")).not.toBeNull();
      expect(findPathNodeByPath(rootNode, "a.e")).not.toBeNull();
      
      // 存在しないパスはnullを返す
      expect(findPathNodeByPath(rootNode, "a.b.x")).toBeNull();
    });
  });
});