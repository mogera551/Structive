/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, vi, beforeEach } from "vitest";
import { registerDataBindAttributes, getDataBindAttributesById, getPathsSetById, getListPathsSetById } from "../../src/BindingBuilder/registerDataBindAttributes";
import type { IDataBindAttributes, IBindText } from "../../src/BindingBuilder/types";

// Mock dependencies
vi.mock("../../src/BindingBuilder/createDataBindAttributes", () => ({
  createDataBindAttributes: vi.fn()
}));

vi.mock("../../src/BindingBuilder/getNodesHavingDataBind", () => ({
  getNodesHavingDataBind: vi.fn()
}));

import { createDataBindAttributes } from "../../src/BindingBuilder/createDataBindAttributes";
import { getNodesHavingDataBind } from "../../src/BindingBuilder/getNodesHavingDataBind";

describe("BindingBuilder/registerDataBindAttributes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic functionality", () => {
    test("should register and return data bind attributes", () => {
      const fragment = document.createDocumentFragment();
      const element = document.createElement("div");
      fragment.appendChild(element);

      const mockBindText: IBindText = {
        stateProperty: "user.name",
        nodeProperty: "text",
        inputFilterTexts: [],
        outputFilterTexts: [],
        decorates: []
      };

      const mockDataBindAttribute: IDataBindAttributes = {
        nodeType: "HTMLElement",
        nodePath: [0],
        bindTexts: [mockBindText],
        creatorByText: new Map()
      };

      (getNodesHavingDataBind as any).mockReturnValue([element]);
      (createDataBindAttributes as any).mockReturnValue(mockDataBindAttribute);

      const result = registerDataBindAttributes(1, fragment);

      expect(getNodesHavingDataBind).toHaveBeenCalledWith(fragment);
      expect(createDataBindAttributes).toHaveBeenCalledWith(element);
      expect(result).toEqual([mockDataBindAttribute]);
    });

    test("should handle empty fragments", () => {
      const fragment = document.createDocumentFragment();
      (getNodesHavingDataBind as any).mockReturnValue([]);

      const result = registerDataBindAttributes(2, fragment);

      expect(result).toEqual([]);
    });

    test("should store paths in path sets", () => {
      const fragment = document.createDocumentFragment();
      const element = document.createElement("div");
      fragment.appendChild(element);

      const mockBindText: IBindText = {
        stateProperty: "test.property",
        nodeProperty: "text",
        inputFilterTexts: [],
        outputFilterTexts: [],
        decorates: []
      };

      const mockDataBindAttribute: IDataBindAttributes = {
        nodeType: "HTMLElement",
        nodePath: [0],
        bindTexts: [mockBindText],
        creatorByText: new Map()
      };

      (getNodesHavingDataBind as any).mockReturnValue([element]);
      (createDataBindAttributes as any).mockReturnValue(mockDataBindAttribute);

      registerDataBindAttributes(3, fragment);

      const paths = getPathsSetById(3);
      expect(paths).toContain("test.property");
    });

    test("should store for bindings in list paths", () => {
      const fragment = document.createDocumentFragment();
      const element = document.createElement("ul");
      fragment.appendChild(element);

      const mockBindText: IBindText = {
        stateProperty: "items",
        nodeProperty: "for",
        inputFilterTexts: [],
        outputFilterTexts: [],
        decorates: []
      };

      const mockDataBindAttribute: IDataBindAttributes = {
        nodeType: "HTMLElement",
        nodePath: [0],
        bindTexts: [mockBindText],
        creatorByText: new Map()
      };

      (getNodesHavingDataBind as any).mockReturnValue([element]);
      (createDataBindAttributes as any).mockReturnValue(mockDataBindAttribute);

      registerDataBindAttributes(4, fragment);

      const paths = getPathsSetById(4);
      const listPaths = getListPathsSetById(4);
      
      expect(paths).toContain("items");
      expect(listPaths).toContain("items");
    });

    test("should handle root ID parameter", () => {
      const fragment = document.createDocumentFragment();
      const element = document.createElement("div");
      fragment.appendChild(element);

      const mockBindText: IBindText = {
        stateProperty: "root.test",
        nodeProperty: "text", 
        inputFilterTexts: [],
        outputFilterTexts: [],
        decorates: []
      };

      const mockDataBindAttribute: IDataBindAttributes = {
        nodeType: "HTMLElement",
        nodePath: [0],
        bindTexts: [mockBindText],
        creatorByText: new Map()
      };

      (getNodesHavingDataBind as any).mockReturnValue([element]);
      (createDataBindAttributes as any).mockReturnValue(mockDataBindAttribute);

      registerDataBindAttributes(5, fragment, 100);

      const pathsByRootId = getPathsSetById(100);
      const pathsById = getPathsSetById(5);
      
      expect(pathsByRootId).toContain("root.test");
      expect(pathsById).not.toContain("root.test");
    });
  });

  describe("Retrieval functions", () => {
    test("should retrieve attributes by ID", () => {
      const fragment = document.createDocumentFragment();
      const element = document.createElement("div");
      fragment.appendChild(element);

      const mockBindText: IBindText = {
        stateProperty: "retrieve.test",
        nodeProperty: "text",
        inputFilterTexts: [],
        outputFilterTexts: [],
        decorates: []
      };

      const mockDataBindAttribute: IDataBindAttributes = {
        nodeType: "HTMLElement",
        nodePath: [0],
        bindTexts: [mockBindText],
        creatorByText: new Map()
      };

      (getNodesHavingDataBind as any).mockReturnValue([element]);
      (createDataBindAttributes as any).mockReturnValue(mockDataBindAttribute);

      const result = registerDataBindAttributes(10, fragment);
      const retrieved = getDataBindAttributesById(10);

      expect(retrieved).toEqual(result);
    });

    test("should return empty arrays for non-existent IDs", () => {
      const paths = getPathsSetById(999);
      const listPaths = getListPathsSetById(999);

      expect(paths).toEqual([]);
      expect(listPaths).toEqual([]);
    });
  });

  describe("Edge cases", () => {
    test("should handle multiple bind texts", () => {
      const fragment = document.createDocumentFragment();
      const element = document.createElement("div");
      fragment.appendChild(element);

      const mockBindTexts: IBindText[] = [
        {
          stateProperty: "user.name",
          nodeProperty: "text",
          inputFilterTexts: [],
          outputFilterTexts: [],
          decorates: []
        },
        {
          stateProperty: "items",
          nodeProperty: "for",
          inputFilterTexts: [],
          outputFilterTexts: [],
          decorates: []
        }
      ];

      const mockDataBindAttribute: IDataBindAttributes = {
        nodeType: "HTMLElement",
        nodePath: [0],
        bindTexts: mockBindTexts,
        creatorByText: new Map()
      };

      (getNodesHavingDataBind as any).mockReturnValue([element]);
      (createDataBindAttributes as any).mockReturnValue(mockDataBindAttribute);

      registerDataBindAttributes(20, fragment);

      const paths = getPathsSetById(20);
      const listPaths = getListPathsSetById(20);

      expect(paths).toContain("user.name");
      expect(paths).toContain("items");
      expect(listPaths).toContain("items");
      expect(listPaths).not.toContain("user.name");
    });

    test("should handle errors gracefully", () => {
      const fragment = document.createDocumentFragment();
      const element = document.createElement("div");
      fragment.appendChild(element);

      (getNodesHavingDataBind as any).mockReturnValue([element]);
      (createDataBindAttributes as any).mockImplementation(() => {
        throw new Error("Creation failed");
      });

      expect(() => {
        registerDataBindAttributes(21, fragment);
      }).toThrow("Creation failed");
    });

    test("should handle empty bind texts array", () => {
      const fragment = document.createDocumentFragment();
      const element = document.createElement("div");
      fragment.appendChild(element);

      const mockDataBindAttribute: IDataBindAttributes = {
        nodeType: "HTMLElement",
        nodePath: [0],
        bindTexts: [],
        creatorByText: new Map()
      };

      (getNodesHavingDataBind as any).mockReturnValue([element]);
      (createDataBindAttributes as any).mockReturnValue(mockDataBindAttribute);

      const result = registerDataBindAttributes(22, fragment);

      expect(result).toEqual([mockDataBindAttribute]);
      
      const paths = getPathsSetById(22);
      const listPaths = getListPathsSetById(22);
      
      expect(paths.size).toBe(0);
      expect(listPaths.size).toBe(0);
    });
  });
});