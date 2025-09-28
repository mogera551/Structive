/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, vi, beforeEach } from "vitest";
import { createDataBindAttributes } from "../../src/BindingBuilder/createDataBindAttributes";
import type { NodeType, IBindText } from "../../src/BindingBuilder/types";

// Mock all dependencies
vi.mock("../../src/BindingBuilder/getNodeType", () => ({
  getNodeType: vi.fn()
}));

vi.mock("../../src/BindingBuilder/getDataBindText", () => ({
  getDataBindText: vi.fn()
}));

vi.mock("../../src/BindingBuilder/replaceTextNodeFromComment", () => ({
  replaceTextNodeFromComment: vi.fn()
}));

vi.mock("../../src/BindingBuilder/removeDataBindAttribute", () => ({
  removeDataBindAttribute: vi.fn()
}));

vi.mock("../../src/BindingBuilder/getAbsoluteNodePath", () => ({
  getAbsoluteNodePath: vi.fn()
}));

vi.mock("../../src/BindingBuilder/parseBindText", () => ({
  parseBindText: vi.fn()
}));

vi.mock("../../src/BindingBuilder/getBindingNodeCreator", () => ({
  getBindingNodeCreator: vi.fn()
}));

vi.mock("../../src/BindingBuilder/getBindingStateCreator", () => ({
  getBindingStateCreator: vi.fn()
}));

import { getNodeType } from "../../src/BindingBuilder/getNodeType";
import { getDataBindText } from "../../src/BindingBuilder/getDataBindText";
import { replaceTextNodeFromComment } from "../../src/BindingBuilder/replaceTextNodeFromComment";
import { removeDataBindAttribute } from "../../src/BindingBuilder/removeDataBindAttribute";
import { getAbsoluteNodePath } from "../../src/BindingBuilder/getAbsoluteNodePath";
import { parseBindText } from "../../src/BindingBuilder/parseBindText";
import { getBindingNodeCreator } from "../../src/BindingBuilder/getBindingNodeCreator";
import { getBindingStateCreator } from "../../src/BindingBuilder/getBindingStateCreator";

describe("BindingBuilder/createDataBindAttributes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up default mocks
    vi.mocked(getNodeType).mockReturnValue("HTMLElement" as NodeType);
    vi.mocked(getDataBindText).mockReturnValue("");
    vi.mocked(replaceTextNodeFromComment).mockImplementation((node: any) => node);
    vi.mocked(removeDataBindAttribute).mockImplementation(() => {});
    vi.mocked(getAbsoluteNodePath).mockReturnValue([0]);
    vi.mocked(parseBindText).mockReturnValue([]);
    vi.mocked(getBindingNodeCreator).mockReturnValue(() => ({} as any));
    vi.mocked(getBindingStateCreator).mockReturnValue(() => ({} as any));
  });

  describe("Basic functionality", () => {
    test("should create data bind attributes with empty bind texts", () => {
      const node = document.createElement("div");

      const result = createDataBindAttributes(node);

      expect(result).toBeDefined();
      expect(result.nodeType).toBe("HTMLElement");
      expect(result.nodePath).toEqual([0]);
      expect(result.bindTexts).toEqual([]);
      expect(result.creatorByText.size).toBe(0);
    });

    test("should handle different node types", () => {
      const testCases: { node: Node; expectedType: NodeType }[] = [
        { node: document.createElement("div"), expectedType: "HTMLElement" },
        { node: document.createElement("template"), expectedType: "Template" },
        { node: document.createTextNode("text"), expectedType: "Text" },
        { node: document.createElementNS("http://www.w3.org/2000/svg", "circle"), expectedType: "SVGElement" }
      ];

      testCases.forEach(({ node, expectedType }, index) => {
        vi.mocked(getNodeType).mockReturnValueOnce(expectedType);

        const result = createDataBindAttributes(node);

        expect(result.nodeType).toBe(expectedType);
        expect(getNodeType).toHaveBeenNthCalledWith(index + 1, node);
      });
    });

    test("should process node path correctly", () => {
      const node = document.createElement("span");
      const expectedPath = [1, 2, 3];

      vi.mocked(getAbsoluteNodePath).mockReturnValue(expectedPath);

      const result = createDataBindAttributes(node);

      expect(result.nodePath).toEqual(expectedPath);
      expect(getAbsoluteNodePath).toHaveBeenCalledWith(node);
    });

    test("should process bind texts", () => {
      const node = document.createElement("input");
      const bindText: IBindText = {
        nodeProperty: "value",
        stateProperty: "user.name",
        inputFilterTexts: [],
        outputFilterTexts: [],
        decorates: []
      };

      vi.mocked(getDataBindText).mockReturnValue("value:user.name");
      vi.mocked(parseBindText).mockReturnValue([bindText]);

      const result = createDataBindAttributes(node);

      expect(result.bindTexts).toHaveLength(1);
      expect(result.bindTexts[0]).toBe(bindText);
      expect(result.creatorByText.size).toBe(1);
      expect(result.creatorByText.has(bindText)).toBe(true);

      expect(parseBindText).toHaveBeenCalledWith("value:user.name");
    });

    test("should create binding creators for each bind text", () => {
      const node = document.createElement("input");
      const bindText1: IBindText = {
        nodeProperty: "value",
        stateProperty: "user.name",
        inputFilterTexts: [{ name: "trim", options: [] }],
        outputFilterTexts: [],
        decorates: ["required"]
      };

      const bindText2: IBindText = {
        nodeProperty: "placeholder",
        stateProperty: "labels.name",
        inputFilterTexts: [],
        outputFilterTexts: [{ name: "upperCase", options: [] }],
        decorates: []
      };

      const mockNodeCreator1 = () => ({ type: "node1" } as any);
      const mockStateCreator1 = () => ({ type: "state1" } as any);
      const mockNodeCreator2 = () => ({ type: "node2" } as any);
      const mockStateCreator2 = () => ({ type: "state2" } as any);

      vi.mocked(parseBindText).mockReturnValue([bindText1, bindText2]);
      vi.mocked(getBindingNodeCreator)
        .mockReturnValueOnce(mockNodeCreator1)
        .mockReturnValueOnce(mockNodeCreator2);
      vi.mocked(getBindingStateCreator)
        .mockReturnValueOnce(mockStateCreator1)
        .mockReturnValueOnce(mockStateCreator2);

      const result = createDataBindAttributes(node);

      expect(result.bindTexts).toHaveLength(2);
      expect(result.creatorByText.size).toBe(2);

      const creator1 = result.creatorByText.get(bindText1)!;
      const creator2 = result.creatorByText.get(bindText2)!;

      expect(creator1.createBindingNode).toBe(mockNodeCreator1);
      expect(creator1.createBindingState).toBe(mockStateCreator1);
      expect(creator2.createBindingNode).toBe(mockNodeCreator2);
      expect(creator2.createBindingState).toBe(mockStateCreator2);

      // Verify creator functions were called with correct parameters
      expect(getBindingNodeCreator).toHaveBeenNthCalledWith(1, node, "value", [{ name: "trim", options: [] }], ["required"]);
      expect(getBindingNodeCreator).toHaveBeenNthCalledWith(2, node, "placeholder", [], []);
      expect(getBindingStateCreator).toHaveBeenNthCalledWith(1, "user.name", []);
      expect(getBindingStateCreator).toHaveBeenNthCalledWith(2, "labels.name", [{ name: "upperCase", options: [] }]);
    });

    test("should call all utility functions in correct order", () => {
      const node = document.createElement("div");
      const modifiedNode = document.createElement("div");

      vi.mocked(getNodeType).mockReturnValue("HTMLElement" as NodeType);
      vi.mocked(getDataBindText).mockReturnValue("textContent:data.text");
      vi.mocked(replaceTextNodeFromComment).mockReturnValue(modifiedNode);
      vi.mocked(parseBindText).mockReturnValue([]);

      const result = createDataBindAttributes(node);

      // Verify call order and parameters
      expect(getNodeType).toHaveBeenCalledWith(node);
      expect(getDataBindText).toHaveBeenCalledWith("HTMLElement", node);
      expect(replaceTextNodeFromComment).toHaveBeenCalledWith(node, "HTMLElement");
      expect(removeDataBindAttribute).toHaveBeenCalledWith(modifiedNode, "HTMLElement");
      expect(getAbsoluteNodePath).toHaveBeenCalledWith(modifiedNode);
      expect(parseBindText).toHaveBeenCalledWith("textContent:data.text");

      expect(result).toBeDefined();
    });
  });

  describe("Edge cases", () => {
    test("should handle empty bind text", () => {
      const node = document.createElement("div");

      vi.mocked(getDataBindText).mockReturnValue("");
      vi.mocked(parseBindText).mockReturnValue([]);

      const result = createDataBindAttributes(node);

      expect(result.bindTexts).toEqual([]);
      expect(result.creatorByText.size).toBe(0);
      expect(parseBindText).toHaveBeenCalledWith("");
    });

    test("should handle complex binding expressions", () => {
      const node = document.createElement("div");
      const complexBindText: IBindText = {
        nodeProperty: "style.backgroundColor",
        stateProperty: "theme.colors.primary",
        inputFilterTexts: [
          { name: "default", options: ["#fff"] },
          { name: "validate", options: ["color"] }
        ],
        outputFilterTexts: [
          { name: "lighten", options: ["10"] },
          { name: "hex", options: [] }
        ],
        decorates: ["cached", "throttled"]
      };

      vi.mocked(getDataBindText).mockReturnValue("style.backgroundColor:theme.colors.primary|default('#fff')|validate('color')|@cached|@throttled|lighten('10')|hex");
      vi.mocked(parseBindText).mockReturnValue([complexBindText]);

      const result = createDataBindAttributes(node);

      expect(result.bindTexts[0]).toBe(complexBindText);
      expect(getBindingNodeCreator).toHaveBeenCalledWith(
        expect.any(Object),
        "style.backgroundColor",
        [
          { name: "default", options: ["#fff"] },
          { name: "validate", options: ["color"] }
        ],
        ["cached", "throttled"]
      );
      expect(getBindingStateCreator).toHaveBeenCalledWith(
        "theme.colors.primary",
        [
          { name: "lighten", options: ["10"] },
          { name: "hex", options: [] }
        ]
      );
    });

    test("should handle nodes with special replacements", () => {
      const originalNode = document.createElement("div");
      const replacedNode = document.createElement("span");

      vi.mocked(replaceTextNodeFromComment).mockReturnValue(replacedNode);

      const result = createDataBindAttributes(originalNode);

      expect(replaceTextNodeFromComment).toHaveBeenCalledWith(originalNode, "HTMLElement");
      expect(removeDataBindAttribute).toHaveBeenCalledWith(replacedNode, "HTMLElement");
      expect(getAbsoluteNodePath).toHaveBeenCalledWith(replacedNode);
    });

    test("should maintain consistency across multiple calls", () => {
      const node = document.createElement("input");
      const bindText: IBindText = {
        nodeProperty: "value",
        stateProperty: "data.value",
        inputFilterTexts: [],
        outputFilterTexts: [],
        decorates: []
      };

      vi.mocked(parseBindText).mockReturnValue([bindText]);

      // Call multiple times
      const result1 = createDataBindAttributes(node);
      const result2 = createDataBindAttributes(node);

      // Should have similar structure (though different instances)
      expect(result1.nodeType).toBe(result2.nodeType);
      expect(result1.nodePath).toEqual(result2.nodePath);
      expect(result1.bindTexts.length).toBe(result2.bindTexts.length);
      expect(result1.creatorByText.size).toBe(result2.creatorByText.size);
    });
  });
});