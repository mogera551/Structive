/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, beforeEach } from "vitest";
import type { ILoopContext } from "../../src/LoopContext/types";
import type { IBindContent } from "../../src/DataBinding/types";
import type { IStatePropertyRef } from "../../src/StatePropertyRef/types";
import type { IListIndex } from "../../src/ListIndex/types";
import type { IStructuredPathInfo } from "../../src/StateProperty/types";

describe("LoopContext/types", () => {
  describe("ILoopContext interface", () => {
    let mockLoopContext: ILoopContext;
    let mockStatePropertyRef: IStatePropertyRef;
    let mockBindContent: IBindContent;
    let mockListIndex: IListIndex;
    let mockInfo: IStructuredPathInfo;

    beforeEach(() => {
      // モックデータの設定
      mockInfo = {
        pattern: "items",
        pathSegments: ["items"],
        parentPath: "",
        cumulativePathSet: new Set(["items"])
      } as unknown as IStructuredPathInfo;

      mockListIndex = {
        parentListIndex: null,
        id: 0,
        sid: "test-sid",
        position: 0,
        length: 1,
        index: 0,
        version: 1,
        dirty: false,
        indexes: [0],
        listIndexes: [],
        varName: "item",
        at: () => null
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

      // ILoopContextのモック実装
      mockLoopContext = {
        ref: mockStatePropertyRef,
        path: "items",
        info: mockInfo,
        bindContent: mockBindContent,
        listIndex: mockListIndex,
        parentLoopContext: null,
        assignListIndex: (listIndex: IListIndex) => {},
        clearListIndex: () => {},
        find: (name: string) => name === "items" ? mockLoopContext : null,
        walk: (callback: (loopContext: ILoopContext) => void) => {
          callback(mockLoopContext);
        },
        serialize: () => [mockLoopContext]
      };
    });

    test("should have all required readonly properties", () => {
      expect(mockLoopContext).toHaveProperty("ref");
      expect(mockLoopContext).toHaveProperty("path");
      expect(mockLoopContext).toHaveProperty("info");
      expect(mockLoopContext).toHaveProperty("bindContent");
      expect(mockLoopContext).toHaveProperty("listIndex");
      expect(mockLoopContext).toHaveProperty("parentLoopContext");
    });

    test("should have all required methods", () => {
      expect(typeof mockLoopContext.assignListIndex).toBe("function");
      expect(typeof mockLoopContext.clearListIndex).toBe("function");
      expect(typeof mockLoopContext.find).toBe("function");
      expect(typeof mockLoopContext.walk).toBe("function");
      expect(typeof mockLoopContext.serialize).toBe("function");
    });

    test("should return correct readonly ref", () => {
      expect(mockLoopContext.ref).toBe(mockStatePropertyRef);
      expect(mockLoopContext.ref).toHaveProperty("info");
      expect(mockLoopContext.ref).toHaveProperty("listIndex");
      expect(mockLoopContext.ref).toHaveProperty("path");
      expect(mockLoopContext.ref).toHaveProperty("key");
    });

    test("should return correct readonly path", () => {
      expect(mockLoopContext.path).toBe("items");
      expect(typeof mockLoopContext.path).toBe("string");
    });

    test("should return correct readonly info", () => {
      expect(mockLoopContext.info).toBe(mockInfo);
      expect(mockLoopContext.info).toHaveProperty("pattern");
      expect(mockLoopContext.info).toHaveProperty("pathSegments");
      expect(mockLoopContext.info).toHaveProperty("parentPath");
      expect(mockLoopContext.info).toHaveProperty("cumulativePathSet");
    });

    test("should return correct readonly bindContent", () => {
      expect(mockLoopContext.bindContent).toBe(mockBindContent);
      expect(mockLoopContext.bindContent).toHaveProperty("loopContext");
      expect(mockLoopContext.bindContent).toHaveProperty("parentBinding");
    });

    test("should return correct readonly listIndex", () => {
      expect(mockLoopContext.listIndex).toBe(mockListIndex);
      expect(mockLoopContext.listIndex).toHaveProperty("parentListIndex");
      expect(mockLoopContext.listIndex).toHaveProperty("id");
      expect(mockLoopContext.listIndex).toHaveProperty("sid");
      expect(mockLoopContext.listIndex).toHaveProperty("position");
      expect(mockLoopContext.listIndex).toHaveProperty("length");
      expect(mockLoopContext.listIndex).toHaveProperty("index");
      expect(mockLoopContext.listIndex).toHaveProperty("version");
      expect(mockLoopContext.listIndex).toHaveProperty("dirty");
      expect(mockLoopContext.listIndex).toHaveProperty("indexes");
      expect(mockLoopContext.listIndex).toHaveProperty("listIndexes");
      expect(mockLoopContext.listIndex).toHaveProperty("varName");
    });

    test("should return correct readonly parentLoopContext", () => {
      expect(mockLoopContext.parentLoopContext).toBeNull();
      
      // Test with parent - create new mock with parent
      const parentLoopContext = { ...mockLoopContext };
      const childLoopContext: ILoopContext = {
        ...mockLoopContext,
        parentLoopContext: parentLoopContext
      };
      expect(childLoopContext.parentLoopContext).toBe(parentLoopContext);
    });

    describe("assignListIndex method", () => {
      test("should accept IListIndex parameter", () => {
        const newListIndex = {
          parentListIndex: null,
          id: 1,
          sid: "new-sid",
          position: 1,
          length: 1,
          index: 1,
          version: 1,
          dirty: false,
          indexes: [1],
          listIndexes: [],
          varName: "newItem",
          at: () => null
        } as unknown as IListIndex;

        expect(() => {
          mockLoopContext.assignListIndex(newListIndex);
        }).not.toThrow();
      });

      test("should be void return type", () => {
        const newListIndex = {
          parentListIndex: null,
          id: 1,
          sid: "new-sid",
          position: 1,
          length: 1,
          index: 1,
          version: 1,
          dirty: false,
          indexes: [1],
          listIndexes: [],
          varName: "newItem",
          at: () => null
        } as unknown as IListIndex;

        const result = mockLoopContext.assignListIndex(newListIndex);
        expect(result).toBeUndefined();
      });
    });

    describe("clearListIndex method", () => {
      test("should not require parameters", () => {
        expect(() => {
          mockLoopContext.clearListIndex();
        }).not.toThrow();
      });

      test("should be void return type", () => {
        const result = mockLoopContext.clearListIndex();
        expect(result).toBeUndefined();
      });
    });

    describe("find method", () => {
      test("should accept string parameter", () => {
        expect(() => {
          mockLoopContext.find("testName");
        }).not.toThrow();
      });

      test("should return ILoopContext or null", () => {
        const result1 = mockLoopContext.find("items");
        expect(result1).toBe(mockLoopContext);

        const result2 = mockLoopContext.find("nonexistent");
        expect(result2).toBeNull();
      });

      test("should handle string names correctly", () => {
        const selfResult = mockLoopContext.find("items");
        expect(selfResult).toBe(mockLoopContext);

        const nullResult = mockLoopContext.find("notfound");
        expect(nullResult).toBeNull();

        const emptyResult = mockLoopContext.find("");
        expect(emptyResult).toBeNull();
      });
    });

    describe("walk method", () => {
      test("should accept callback function", () => {
        const callback = (loopContext: ILoopContext) => {};
        
        expect(() => {
          mockLoopContext.walk(callback);
        }).not.toThrow();
      });

      test("should be void return type", () => {
        const callback = (loopContext: ILoopContext) => {};
        
        const result = mockLoopContext.walk(callback);
        expect(result).toBeUndefined();
      });

      test("should execute callback with loop context parameter", () => {
        let receivedLoopContext: ILoopContext | null = null;
        
        const callback = (loopContext: ILoopContext) => {
          receivedLoopContext = loopContext;
        };
        
        mockLoopContext.walk(callback);
        
        expect(receivedLoopContext).toBe(mockLoopContext);
      });
    });

    describe("serialize method", () => {
      test("should not require parameters", () => {
        expect(() => {
          mockLoopContext.serialize();
        }).not.toThrow();
      });

      test("should return array of ILoopContext", () => {
        const result = mockLoopContext.serialize();
        
        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(1);
        expect(result[0]).toBe(mockLoopContext);
      });

      test("should handle empty hierarchy", () => {
        const result = mockLoopContext.serialize();
        
        expect(result).toEqual([mockLoopContext]);
      });

      test("should handle multi-level hierarchy", () => {
        // Create a more complex mock with parent
        const grandparent: ILoopContext = {
          ref: { info: { pattern: "root" } } as unknown as IStatePropertyRef,
          path: "root",
          info: { pattern: "root" } as unknown as IStructuredPathInfo,
          bindContent: mockBindContent,
          listIndex: mockListIndex,
          parentLoopContext: null,
          assignListIndex: () => {},
          clearListIndex: () => {},
          find: () => null,
          walk: (callback) => {
            callback(grandparent);
          },
          serialize: () => [grandparent]
        };

        const parent: ILoopContext = {
          ref: { info: { pattern: "parent" } } as unknown as IStatePropertyRef,
          path: "parent",
          info: { pattern: "parent" } as unknown as IStructuredPathInfo,
          bindContent: mockBindContent,
          listIndex: mockListIndex,
          parentLoopContext: grandparent,
          assignListIndex: () => {},
          clearListIndex: () => {},
          find: () => null,
          walk: (callback) => {
            callback(parent);
            callback(grandparent);
          },
          serialize: () => [grandparent, parent]
        };

        const child: ILoopContext = {
          ref: mockStatePropertyRef,
          path: "child",
          info: mockInfo,
          bindContent: mockBindContent,
          listIndex: mockListIndex,
          parentLoopContext: parent,
          assignListIndex: () => {},
          clearListIndex: () => {},
          find: () => null,
          walk: (callback) => {
            callback(child);
            callback(parent);
            callback(grandparent);
          },
          serialize: () => [grandparent, parent, child]
        };

        const result = child.serialize();
        
        expect(result).toHaveLength(3);
        expect(result[0]).toBe(grandparent);
        expect(result[1]).toBe(parent);
        expect(result[2]).toBe(child);
      });
    });

    describe("interface type constraints", () => {
      test("should enforce readonly properties", () => {
        // These should be readonly and not assignable
        // Note: TypeScript would catch these at compile time
        expect(typeof mockLoopContext.ref).not.toBe("undefined");
        expect(typeof mockLoopContext.path).not.toBe("undefined");
        expect(typeof mockLoopContext.info).not.toBe("undefined");
        expect(typeof mockLoopContext.bindContent).not.toBe("undefined");
        expect(typeof mockLoopContext.listIndex).not.toBe("undefined");
      });

      test("should support parent-child relationships", () => {
        const childLoopContext: ILoopContext = {
          ...mockLoopContext,
          parentLoopContext: mockLoopContext
        };

        expect(childLoopContext.parentLoopContext).toBe(mockLoopContext);
      });

      test("should support null parent relationships", () => {
        expect(mockLoopContext.parentLoopContext).toBeNull();
      });

      test("should maintain type consistency across methods", () => {
        // Test that all methods work with the interface
        const newListIndex = mockListIndex;
        mockLoopContext.assignListIndex(newListIndex);
        mockLoopContext.clearListIndex();
        
        const found = mockLoopContext.find("items");
        expect(found).toBeInstanceOf(Object);
        
        const serialized = mockLoopContext.serialize();
        expect(Array.isArray(serialized)).toBe(true);
        
        let walkExecuted = false;
        mockLoopContext.walk(() => {
          walkExecuted = true;
        });
        expect(walkExecuted).toBe(true);
      });
    });

    describe("integration with other interfaces", () => {
      test("should work with IStatePropertyRef", () => {
        expect(mockLoopContext.ref).toBe(mockStatePropertyRef);
        expect(mockLoopContext.ref.info).toBe(mockInfo);
        expect(mockLoopContext.ref.listIndex).toBe(mockListIndex);
      });

      test("should work with IStructuredPathInfo", () => {
        expect(mockLoopContext.info).toBe(mockInfo);
        expect(mockLoopContext.info.pattern).toBe("items");
      });

      test("should work with IListIndex", () => {
        expect(mockLoopContext.listIndex).toBe(mockListIndex);
        expect(mockLoopContext.listIndex.varName).toBe("item");
        expect(mockLoopContext.listIndex.position).toBe(0);
        expect(mockLoopContext.listIndex.index).toBe(0);
      });

      test("should work with IBindContent", () => {
        expect(mockLoopContext.bindContent).toBe(mockBindContent);
      });

      test("should support hierarchical relationships", () => {
        const parentLoop: ILoopContext = { ...mockLoopContext };
        const childLoop: ILoopContext = {
          ...mockLoopContext,
          parentLoopContext: parentLoop
        };

        expect(childLoop.parentLoopContext).toBe(parentLoop);
        expect(parentLoop.parentLoopContext).toBeNull();
      });
    });
  });
});