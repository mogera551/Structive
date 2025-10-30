/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { createLoopContext } from "../../src/LoopContext/createLoopContext";
import type { ILoopContext } from "../../src/LoopContext/types";
import type { IBindContent } from "../../src/DataBinding/types";
import type { IStatePropertyRef } from "../../src/StatePropertyRef/types";
import type { IListIndex } from "../../src/ListIndex/types";
import type { IStructuredPathInfo } from "../../src/StateProperty/types";

// モック対象モジュール
vi.mock("../../src/StatePropertyRef/StatepropertyRef", () => ({
  getStatePropertyRef: vi.fn()
}));

// モック関数のインポート
import { getStatePropertyRef } from "../../src/StatePropertyRef/StatepropertyRef";

const mockGetStatePropertyRef = vi.mocked(getStatePropertyRef);

describe("LoopContext/createLoopContext", () => {
  let mockStatePropertyRef: IStatePropertyRef;
  let mockBindContent: IBindContent;
  let mockListIndex: IListIndex;
  let mockInfo: IStructuredPathInfo;
  let loopContext: ILoopContext;

  beforeEach(() => {
    vi.clearAllMocks();

    // モックデータの設定
    mockInfo = {
      pattern: "items",
      pathSegments: ["items"],
      parentPath: "",
      cumulativePathSet: new Set(["items"])
    } as unknown as IStructuredPathInfo;

    mockListIndex = {
      value: 0,
      name: "item"
    } as unknown as IListIndex;

    mockStatePropertyRef = {
      info: mockInfo,
      listIndex: mockListIndex,
      path: "items",
      key: "items"
    } as unknown as IStatePropertyRef;

    mockBindContent = {
      loopContext: null,
      parentBinding: null
    } as unknown as IBindContent;

    mockGetStatePropertyRef.mockReturnValue(mockStatePropertyRef);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("createLoopContext", () => {
    test("should create LoopContext instance", () => {
      loopContext = createLoopContext(mockStatePropertyRef, mockBindContent);
      
      expect(loopContext).toBeDefined();
      expect(loopContext).toHaveProperty("ref");
      expect(loopContext).toHaveProperty("path");
      expect(loopContext).toHaveProperty("info");
      expect(loopContext).toHaveProperty("bindContent");
      expect(loopContext).toHaveProperty("listIndex");
      expect(loopContext).toHaveProperty("parentLoopContext");
      expect(loopContext).toHaveProperty("assignListIndex");
      expect(loopContext).toHaveProperty("clearListIndex");
      expect(loopContext).toHaveProperty("find");
      expect(loopContext).toHaveProperty("walk");
      expect(loopContext).toHaveProperty("serialize");
    });

    test("should initialize with provided ref and bindContent", () => {
      loopContext = createLoopContext(mockStatePropertyRef, mockBindContent);
      
      expect(loopContext.ref).toBe(mockStatePropertyRef);
      expect(loopContext.bindContent).toBe(mockBindContent);
    });
  });

  describe("LoopContext instance", () => {
    beforeEach(() => {
      loopContext = createLoopContext(mockStatePropertyRef, mockBindContent);
    });

    describe("getter properties", () => {
      test("should return correct ref", () => {
        expect(loopContext.ref).toBe(mockStatePropertyRef);
      });

      test("should return correct path from ref.info.pattern", () => {
        expect(loopContext.path).toBe("items");
      });

      test("should return correct info from ref.info", () => {
        expect(loopContext.info).toBe(mockInfo);
      });

      test("should return correct bindContent", () => {
        expect(loopContext.bindContent).toBe(mockBindContent);
      });

      test("should return correct listIndex from ref.listIndex", () => {
        expect(loopContext.listIndex).toBe(mockListIndex);
      });

      test("should complete clearListIndex without error", () => {
        // clearListIndexは実際の実装で正常に動作する
        expect(() => loopContext.clearListIndex()).not.toThrow();
        
        // clearListIndex後の状態は実装依存のため、エラーハンドリングのテストは実装を確認してから行う
      });

      test("should test clearListIndex behavior", () => {
        // clearListIndexが正常に実行されることを確認
        expect(() => loopContext.clearListIndex()).not.toThrow();
        
        // その他の動作は実装に依存する
      });

      test("should validate clearListIndex functionality", () => {
        // clearListIndexの基本機能のテスト
        expect(() => loopContext.clearListIndex()).not.toThrow();
      });
    });

    describe("assignListIndex", () => {
      test("should assign new listIndex and update ref", () => {
        const newListIndex = {
          value: 1,
          name: "newItem"
        } as unknown as IListIndex;

        const newRef = {
          ...mockStatePropertyRef,
          listIndex: newListIndex
        } as unknown as IStatePropertyRef;

        mockGetStatePropertyRef.mockReturnValue(newRef);

        loopContext.assignListIndex(newListIndex);

        expect(mockGetStatePropertyRef).toHaveBeenCalledWith(mockInfo, newListIndex);
        expect(loopContext.ref).toBe(newRef);
        expect(loopContext.listIndex).toBe(newListIndex);
      });
    });

    describe("clearListIndex", () => {
      test("should clear reference successfully", () => {
        expect(() => loopContext.clearListIndex()).not.toThrow();
      });
    });

    describe("error handling", () => {
      test("should throw when ref is accessed after clearing list index", () => {
        loopContext.clearListIndex();
        const accessRef = () => loopContext.ref;
        expect(accessRef).toThrowError("ref is null");
      });

      test("should throw when listIndex is missing on ref", () => {
        const refWithoutListIndex = {
          ...mockStatePropertyRef,
          listIndex: null
        } as unknown as IStatePropertyRef;

        const contextWithoutIndex = createLoopContext(refWithoutListIndex, mockBindContent);
        const accessListIndex = () => contextWithoutIndex.listIndex;
        expect(accessListIndex).toThrowError("listIndex is required");
      });
    });

    describe("parentLoopContext", () => {
      test("should return null when no parent loop context exists", () => {
        expect(loopContext.parentLoopContext).toBeNull();
      });

      test("should find parent loop context through bindContent hierarchy", () => {
        const parentLoopContext = createLoopContext(mockStatePropertyRef, mockBindContent);
        
        const parentBinding = {
          parentBindContent: {
            loopContext: parentLoopContext
          }
        } as unknown;
        
        const childBindContent = {
          loopContext: null,
          parentBinding: parentBinding
        } as unknown as IBindContent;
        
        const childLoopContext = createLoopContext(mockStatePropertyRef, childBindContent);
        
        expect(childLoopContext.parentLoopContext).toBe(parentLoopContext);
      });

      test("should cache parent loop context result", () => {
        const parentLoopContext = createLoopContext(mockStatePropertyRef, mockBindContent);
        
        const parentBinding = {
          parentBindContent: {
            loopContext: parentLoopContext
          }
        } as unknown;
        
        const childBindContent = {
          loopContext: null,
          parentBinding: parentBinding
        } as unknown as IBindContent;
        
        const childLoopContext = createLoopContext(mockStatePropertyRef, childBindContent);
        
        // First access
        expect(childLoopContext.parentLoopContext).toBe(parentLoopContext);
        
        // Second access should use cache
        expect(childLoopContext.parentLoopContext).toBe(parentLoopContext);
      });
    });

    describe("find", () => {
      test("should find loop context by name (self)", () => {
        const result = loopContext.find("items");
        
        expect(result).toBe(loopContext);
      });

      test("should return null when name not found", () => {
        const result = loopContext.find("nonexistent");
        
        expect(result).toBeNull();
      });

      test("should cache find results", () => {
        // First find
        const result1 = loopContext.find("items");
        
        // Second find should use cache
        const result2 = loopContext.find("items");
        
        expect(result1).toBe(loopContext);
        expect(result2).toBe(loopContext);
        expect(result1).toBe(result2);
      });

      test("should cache null results", () => {
        const result1 = loopContext.find("nonexistent");
        const result2 = loopContext.find("nonexistent");
        
        expect(result1).toBeNull();
        expect(result2).toBeNull();
      });
    });

    describe("walk", () => {
      test("should execute callback for self when no parent exists", () => {
        const callback = vi.fn();
        
        loopContext.walk(callback);
        
        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith(loopContext);
      });

      test("should execute callback for self and all parents in correct order", () => {
        // Create grandparent
        const grandparentInfo = { pattern: "root" } as unknown as IStructuredPathInfo;
        const grandparentRef = { info: grandparentInfo, key: "root" } as unknown as IStatePropertyRef;
        const grandparentLoopContext = createLoopContext(grandparentRef, mockBindContent);

        // Create parent with grandparent relationship
        const parentInfo = { pattern: "categories" } as unknown as IStructuredPathInfo;
        const parentRef = { info: parentInfo, key: "categories" } as unknown as IStatePropertyRef;
        const parentBindContent = {
          loopContext: null,
          parentBinding: {
            parentBindContent: {
              loopContext: grandparentLoopContext
            }
          }
        } as unknown as IBindContent;
        const parentLoopContext = createLoopContext(parentRef, parentBindContent);
        
        // Create child with parent relationship
        const childBindContent = {
          loopContext: null,
          parentBinding: {
            parentBindContent: {
              loopContext: parentLoopContext
            }
          }
        } as unknown as IBindContent;
        const childLoopContext = createLoopContext(mockStatePropertyRef, childBindContent);
        
        const callback = vi.fn();
        
        childLoopContext.walk(callback);
        
        expect(callback).toHaveBeenCalledTimes(3);
        expect(callback).toHaveBeenNthCalledWith(1, childLoopContext);
        expect(callback).toHaveBeenNthCalledWith(2, parentLoopContext);
        expect(callback).toHaveBeenNthCalledWith(3, grandparentLoopContext);
      });
    });

    describe("serialize", () => {
      test("should return array with self when no parent exists", () => {
        const result = loopContext.serialize();
        
        expect(result).toEqual([loopContext]);
      });

      test("should return array with all loop contexts in hierarchy order", () => {
        // Create grandparent
        const grandparentInfo = { pattern: "root" } as unknown as IStructuredPathInfo;
        const grandparentRef = { info: grandparentInfo, key: "root" } as unknown as IStatePropertyRef;
        const grandparentLoopContext = createLoopContext(grandparentRef, mockBindContent);

        // Create parent with grandparent relationship
        const parentInfo = { pattern: "categories" } as unknown as IStructuredPathInfo;
        const parentRef = { info: parentInfo, key: "categories" } as unknown as IStatePropertyRef;
        const parentBindContent = {
          loopContext: null,
          parentBinding: {
            parentBindContent: {
              loopContext: grandparentLoopContext
            }
          }
        } as unknown as IBindContent;
        const parentLoopContext = createLoopContext(parentRef, parentBindContent);
        
        // Create child with parent relationship
        const childBindContent = {
          loopContext: null,
          parentBinding: {
            parentBindContent: {
              loopContext: parentLoopContext
            }
          }
        } as unknown as IBindContent;
        const childLoopContext = createLoopContext(mockStatePropertyRef, childBindContent);
        
        const result = childLoopContext.serialize();
        
        expect(result).toEqual([grandparentLoopContext, parentLoopContext, childLoopContext]);
      });
    });

    describe("complex scenarios", () => {
      test("should handle listIndex reassignment correctly", () => {
        const originalListIndex = mockListIndex;
        const newListIndex = {
          value: 5,
          name: "newItem"
        } as unknown as IListIndex;

        const newRef = {
          ...mockStatePropertyRef,
          listIndex: newListIndex
        } as unknown as IStatePropertyRef;

        mockGetStatePropertyRef.mockReturnValue(newRef);

        // Verify initial state
        expect(loopContext.listIndex).toBe(originalListIndex);

        // Assign new list index
        loopContext.assignListIndex(newListIndex);

        // Verify new state
        expect(loopContext.listIndex).toBe(newListIndex);
        expect(mockGetStatePropertyRef).toHaveBeenCalledWith(mockInfo, newListIndex);

        // Clear list index
        loopContext.clearListIndex();

        // Verify clearListIndex functionality
        expect(() => loopContext.clearListIndex()).not.toThrow();
      });

      test("should handle multiple nested find operations", () => {
        // Create a multi-level hierarchy for finding tests
        const rootInfo = { pattern: "users" } as unknown as IStructuredPathInfo;
        const rootRef = { info: rootInfo, key: "users" } as unknown as IStatePropertyRef;
        const rootLoopContext = createLoopContext(rootRef, mockBindContent);

        const level1Info = { pattern: "projects" } as unknown as IStructuredPathInfo;
        const level1Ref = { info: level1Info, key: "projects" } as unknown as IStatePropertyRef;
        const level1BindContent = {
          loopContext: null,
          parentBinding: {
            parentBindContent: {
              loopContext: rootLoopContext
            }
          }
        } as unknown as IBindContent;
        const level1LoopContext = createLoopContext(level1Ref, level1BindContent);

        const level2Info = { pattern: "tasks" } as unknown as IStructuredPathInfo;
        const level2Ref = { info: level2Info, key: "tasks" } as unknown as IStatePropertyRef;
        const level2BindContent = {
          loopContext: null,
          parentBinding: {
            parentBindContent: {
              loopContext: level1LoopContext
            }
          }
        } as unknown as IBindContent;
        const level2LoopContext = createLoopContext(level2Ref, level2BindContent);

        // Test find functionality at different levels
        expect(level2LoopContext.find("tasks")).toBe(level2LoopContext);
        expect(level2LoopContext.find("projects")).toBe(level1LoopContext);
        expect(level2LoopContext.find("users")).toBe(rootLoopContext);
        expect(level2LoopContext.find("nonexistent")).toBeNull();

        // Test serialize functionality
        const serialized = level2LoopContext.serialize();
        expect(serialized).toEqual([rootLoopContext, level1LoopContext, level2LoopContext]);
      });
    });
  });
});