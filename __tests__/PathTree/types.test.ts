/**
 * @vitest-environment jsdom
 */
import { describe, test, expect } from "vitest";
import type { IPathNode } from "../../src/PathTree/types";
import { createRootNode } from "../../src/PathTree/PathNode";

describe("PathTree/types", () => {
  describe("IPathNode interface", () => {
    let pathNode: IPathNode;

    test("should create root path node with expected structure", () => {
      pathNode = createRootNode();

      expect(pathNode).toMatchObject({
        parentPath: "",
        currentPath: "",
        name: "",
        level: 0
      });
      expect(pathNode.childNodeByName).toBeInstanceOf(Map);
    });

    test("should implement IPathNode interface properties", () => {
      pathNode = createRootNode();
      
      // Check required properties exist
      expect(pathNode).toHaveProperty("parentPath");
      expect(pathNode).toHaveProperty("currentPath");
      expect(pathNode).toHaveProperty("name");
      expect(pathNode).toHaveProperty("childNodeByName");
      expect(pathNode).toHaveProperty("level");
      expect(pathNode).toHaveProperty("find");
      expect(pathNode).toHaveProperty("appendChild");
      
      // Check property types
      expect(typeof pathNode.parentPath).toBe("string");
      expect(typeof pathNode.currentPath).toBe("string");
      expect(typeof pathNode.name).toBe("string");
      expect(typeof pathNode.level).toBe("number");
      expect(pathNode.childNodeByName).toBeInstanceOf(Map);
      expect(typeof pathNode.find).toBe("function");
      expect(typeof pathNode.appendChild).toBe("function");
    });

    test("should handle string paths correctly", () => {
      pathNode = createRootNode();
      expect(pathNode.parentPath).toBe("");
      expect(pathNode.currentPath).toBe("");
      expect(pathNode.name).toBe("");
      expect(typeof pathNode.parentPath).toBe("string");
      expect(typeof pathNode.currentPath).toBe("string");
      expect(typeof pathNode.name).toBe("string");
    });

    test("should handle level property correctly", () => {
      pathNode = createRootNode();
      expect(pathNode.level).toBe(0);
      expect(typeof pathNode.level).toBe("number");
    });

    test("should provide childNodeByName as Map", () => {
      pathNode = createRootNode();
      expect(pathNode.childNodeByName).toBeInstanceOf(Map);
      expect(pathNode.childNodeByName.size).toBe(0);
    });

    test("should provide find method", () => {
      pathNode = createRootNode();
      expect(typeof pathNode.find).toBe("function");
      
      // Test find method with empty array - should return null per implementation
      const result = pathNode.find([]);
      expect(result).toBeNull();
    });

    test("should provide appendChild method", () => {
      pathNode = createRootNode();
      expect(typeof pathNode.appendChild).toBe("function");
      
      // Test appendChild method
      const childNode = pathNode.appendChild("testChild");
      expect(childNode).toBeDefined();
      expect(pathNode.childNodeByName.has("testChild")).toBe(true);
      expect(pathNode.childNodeByName.get("testChild")).toBe(childNode);
    });

    test("should handle child nodes via appendChild correctly", () => {
      pathNode = createRootNode();
      
      const childA = pathNode.appendChild("a");
      const childB = pathNode.appendChild("b");
      
      expect(pathNode.childNodeByName.size).toBe(2);
      expect(pathNode.childNodeByName.has("a")).toBe(true);
      expect(pathNode.childNodeByName.has("b")).toBe(true);
      expect(pathNode.childNodeByName.get("a")).toBe(childA);
      expect(pathNode.childNodeByName.get("b")).toBe(childB);
    });

    test("should maintain hierarchy with appendChild", () => {
      const rootNode = createRootNode();
      
      const level1 = rootNode.appendChild("level1");
      const level2 = level1.appendChild("level2");
      const level3 = level2.appendChild("level3");
      
      // Check hierarchy structure
      expect(rootNode.childNodeByName.get("level1")).toBe(level1);
      expect(level1.childNodeByName.get("level2")).toBe(level2);
      expect(level2.childNodeByName.get("level3")).toBe(level3);
    });

    test("should handle find method with path segments", () => {
      pathNode = createRootNode();
      
      // Add child nodes
      pathNode.appendChild("users");
      const usersNode = pathNode.childNodeByName.get("users");
      usersNode?.appendChild("profile");
      const profileNode = usersNode?.childNodeByName.get("profile");
      profileNode?.appendChild("name");
      
      // Test find method
      const foundNode = pathNode.find(["users", "profile", "name"]);
      expect(foundNode).toBeDefined();
      expect(foundNode).toBe(profileNode?.childNodeByName.get("name"));
    });

    test("should handle find method with non-existent path", () => {
      pathNode = createRootNode();
      
      const foundNode = pathNode.find(["nonExistent"]);
      expect(foundNode).toBeNull();
    });

    test("should handle complex nested structures through methods", () => {
      const rootNode = createRootNode();
      
      // Create multi-level hierarchy through appendChild
      const app = rootNode.appendChild("app");
      const users = app.appendChild("users");
      const profile = users.appendChild("profile");
      const settings = profile.appendChild("settings");
      
      // Verify structure through find
      expect(rootNode.find(["app"])).toBe(app);
      expect(rootNode.find(["app", "users"])).toBe(users);
      expect(rootNode.find(["app", "users", "profile"])).toBe(profile);
      expect(rootNode.find(["app", "users", "profile", "settings"])).toBe(settings);
    });
  });
});