/**
 * @vitest-environment jsdom
 */
import { describe, test, expect } from "vitest";
import type { 
  NodeType, 
  NodePath, 
  IDataBindAttributes, 
  IFilterText, 
  IBindText, 
  IBindingCreator 
} from "../../src/BindingBuilder/types";

describe("BindingBuilder/types", () => {
  describe("NodeType", () => {
    test("should define correct node type values", () => {
      const htmlElement: NodeType = "HTMLElement";
      const svgElement: NodeType = "SVGElement";
      const text: NodeType = "Text";
      const template: NodeType = "Template";

      expect(htmlElement).toBe("HTMLElement");
      expect(svgElement).toBe("SVGElement");
      expect(text).toBe("Text");
      expect(template).toBe("Template");
    });

    test("should be assignable to string", () => {
      const nodeType: NodeType = "HTMLElement";
      const str: string = nodeType;
      expect(str).toBe("HTMLElement");
    });

    test("should support all supported node types", () => {
      const supportedTypes: NodeType[] = [
        "HTMLElement",
        "SVGElement", 
        "Text",
        "Template"
      ];

      supportedTypes.forEach(type => {
        expect(typeof type).toBe("string");
      });
    });
  });

  describe("NodePath", () => {
    test("should be an array of numbers", () => {
      const path: NodePath = [0, 1, 2];
      expect(Array.isArray(path)).toBe(true);
      expect(path).toHaveLength(3);
      expect(path[0]).toBe(0);
      expect(path[1]).toBe(1);
      expect(path[2]).toBe(2);
    });

    test("should handle empty path", () => {
      const emptyPath: NodePath = [];
      expect(Array.isArray(emptyPath)).toBe(true);
      expect(emptyPath).toHaveLength(0);
    });

    test("should handle single element path", () => {
      const singlePath: NodePath = [5];
      expect(singlePath).toHaveLength(1);
      expect(singlePath[0]).toBe(5);
    });

    test("should handle deep nested path", () => {
      const deepPath: NodePath = [0, 2, 1, 3, 0, 1];
      expect(deepPath).toHaveLength(6);
      expect(deepPath[deepPath.length - 1]).toBe(1);
    });
  });

  describe("IFilterText", () => {
    test("should have name and options properties", () => {
      const filterText: IFilterText = {
        name: "upperCase",
        options: ["option1", "option2"]
      };

      expect(filterText.name).toBe("upperCase");
      expect(Array.isArray(filterText.options)).toBe(true);
      expect(filterText.options).toHaveLength(2);
      expect(filterText.options[0]).toBe("option1");
      expect(filterText.options[1]).toBe("option2");
    });

    test("should handle filter with no options", () => {
      const filterText: IFilterText = {
        name: "trim",
        options: []
      };

      expect(filterText.name).toBe("trim");
      expect(filterText.options).toHaveLength(0);
    });

    test("should handle filter with single option", () => {
      const filterText: IFilterText = {
        name: "slice",
        options: ["2"]
      };

      expect(filterText.name).toBe("slice");
      expect(filterText.options).toHaveLength(1);
      expect(filterText.options[0]).toBe("2");
    });

    test("should handle filter with multiple options", () => {
      const filterText: IFilterText = {
        name: "pad",
        options: ["10", "0", "left"]
      };

      expect(filterText.name).toBe("pad");
      expect(filterText.options).toHaveLength(3);
      expect(filterText.options).toEqual(["10", "0", "left"]);
    });
  });

  describe("IBindText", () => {
    test("should have all required properties", () => {
      const bindText: IBindText = {
        nodeProperty: "textContent",
        stateProperty: "user.name",
        inputFilterTexts: [{ name: "trim", options: [] }],
        outputFilterTexts: [{ name: "upperCase", options: [] }],
        decorates: ["required", "validation"]
      };

      expect(bindText.nodeProperty).toBe("textContent");
      expect(bindText.stateProperty).toBe("user.name");
      expect(Array.isArray(bindText.inputFilterTexts)).toBe(true);
      expect(Array.isArray(bindText.outputFilterTexts)).toBe(true);
      expect(Array.isArray(bindText.decorates)).toBe(true);
      expect(bindText.inputFilterTexts).toHaveLength(1);
      expect(bindText.outputFilterTexts).toHaveLength(1);
      expect(bindText.decorates).toHaveLength(2);
    });

    test("should handle empty filter arrays", () => {
      const bindText: IBindText = {
        nodeProperty: "value",
        stateProperty: "data.field",
        inputFilterTexts: [],
        outputFilterTexts: [],
        decorates: []
      };

      expect(bindText.inputFilterTexts).toHaveLength(0);
      expect(bindText.outputFilterTexts).toHaveLength(0);
      expect(bindText.decorates).toHaveLength(0);
    });

    test("should handle multiple filters", () => {
      const bindText: IBindText = {
        nodeProperty: "innerHTML",
        stateProperty: "content.html",
        inputFilterTexts: [
          { name: "trim", options: [] },
          { name: "sanitize", options: ["html"] }
        ],
        outputFilterTexts: [
          { name: "format", options: ["markdown"] },
          { name: "escape", options: [] }
        ],
        decorates: ["async", "cached", "validated"]
      };

      expect(bindText.inputFilterTexts).toHaveLength(2);
      expect(bindText.outputFilterTexts).toHaveLength(2);
      expect(bindText.decorates).toHaveLength(3);
      expect(bindText.inputFilterTexts[0].name).toBe("trim");
      expect(bindText.inputFilterTexts[1].name).toBe("sanitize");
      expect(bindText.outputFilterTexts[0].name).toBe("format");
      expect(bindText.outputFilterTexts[1].name).toBe("escape");
    });

    test("should support various node properties", () => {
      const nodeProperties = [
        "textContent",
        "innerHTML", 
        "value",
        "checked",
        "disabled",
        "style.color",
        "class.active",
        "attr.title",
        "onclick"
      ];

      nodeProperties.forEach(prop => {
        const bindText: IBindText = {
          nodeProperty: prop,
          stateProperty: "state.value",
          inputFilterTexts: [],
          outputFilterTexts: [],
          decorates: []
        };
        expect(bindText.nodeProperty).toBe(prop);
      });
    });

    test("should support various state properties", () => {
      const stateProperties = [
        "simpleProperty",
        "nested.property",
        "deeply.nested.property",
        "array[0]",
        "object.array[1].property",
        "$1",
        "$index"
      ];

      stateProperties.forEach(prop => {
        const bindText: IBindText = {
          nodeProperty: "textContent",
          stateProperty: prop,
          inputFilterTexts: [],
          outputFilterTexts: [],
          decorates: []
        };
        expect(bindText.stateProperty).toBe(prop);
      });
    });
  });

  describe("IBindingCreator", () => {
    test("should have createBindingNode and createBindingState functions", () => {
      const mockCreateBindingNode = (() => ({} as any)) as any;
      const mockCreateBindingState = (() => ({} as any)) as any;

      const creator: IBindingCreator = {
        createBindingNode: mockCreateBindingNode,
        createBindingState: mockCreateBindingState
      };

      expect(typeof creator.createBindingNode).toBe("function");
      expect(typeof creator.createBindingState).toBe("function");
    });

    test("should be callable functions with proper signatures", () => {
      const mockBindingNode = {
        node: document.createElement("div"),
        name: "testNode",
        subName: "testSub",
        decorates: [],
        binding: {} as any,
        filters: {} as any,
        isSelectElement: false,
        isFor: false,
        bindContents: [],
        value: "test",
        filteredValue: "test",
        init: () => {},
        assignValue: () => {},
        updateElements: () => {},
        notifyRedraw: () => {},
        applyChange: () => {}
      };

      const mockBindingState = {
        pattern: "test.pattern",
        info: {} as any,
        listIndex: null,
        ref: {} as any,
        filters: {} as any,
        init: () => {},
        assignValue: () => {},
        getValue: () => "test",
        getFilteredValue: () => "filtered"
      };

      const creator: IBindingCreator = {
        createBindingNode: () => mockBindingNode as any,
        createBindingState: () => mockBindingState as any
      };

      const binding = {} as any;
      const node = document.createElement("div");
      const filters = {} as any;
      const state = {} as any;

      const bindingNode = creator.createBindingNode(binding, node, filters);
      const bindingState = creator.createBindingState(binding, filters);

      expect(bindingNode).toBe(mockBindingNode);
      expect(bindingState).toBe(mockBindingState);
      expect(bindingState.getValue(state)).toBe("test");
    });
  });

  describe("IDataBindAttributes", () => {
    test("should have all required properties", () => {
      const mockBindText: IBindText = {
        nodeProperty: "textContent",
        stateProperty: "user.name", 
        inputFilterTexts: [],
        outputFilterTexts: [],
        decorates: []
      };

      const mockCreator: IBindingCreator = {
        createBindingNode: () => ({} as any),
        createBindingState: () => ({} as any)
      };

      const attributes: IDataBindAttributes = {
        nodeType: "HTMLElement",
        nodePath: [0, 1, 2],
        bindTexts: [mockBindText],
        creatorByText: new Map([[mockBindText, mockCreator]])
      };

      expect(attributes.nodeType).toBe("HTMLElement");
      expect(Array.isArray(attributes.nodePath)).toBe(true);
      expect(attributes.nodePath).toHaveLength(3);
      expect(Array.isArray(attributes.bindTexts)).toBe(true);
      expect(attributes.bindTexts).toHaveLength(1);
      expect(attributes.creatorByText instanceof Map).toBe(true);
      expect(attributes.creatorByText.size).toBe(1);
    });

    test("should handle multiple bind texts with creators", () => {
      const bindText1: IBindText = {
        nodeProperty: "textContent",
        stateProperty: "data.title",
        inputFilterTexts: [],
        outputFilterTexts: [],
        decorates: []
      };

      const bindText2: IBindText = {
        nodeProperty: "value", 
        stateProperty: "data.content",
        inputFilterTexts: [],
        outputFilterTexts: [],
        decorates: []
      };

      const creator1: IBindingCreator = {
        createBindingNode: () => ({} as any),
        createBindingState: () => ({} as any)
      };

      const creator2: IBindingCreator = {
        createBindingNode: () => ({} as any),
        createBindingState: () => ({} as any)
      };

      const attributes: IDataBindAttributes = {
        nodeType: "HTMLElement",
        nodePath: [1],
        bindTexts: [bindText1, bindText2],
        creatorByText: new Map([
          [bindText1, creator1],
          [bindText2, creator2]
        ])
      };

      expect(attributes.bindTexts).toHaveLength(2);
      expect(attributes.creatorByText.size).toBe(2);
      expect(attributes.creatorByText.get(bindText1)).toBe(creator1);
      expect(attributes.creatorByText.get(bindText2)).toBe(creator2);
    });

    test("should handle empty bind texts", () => {
      const attributes: IDataBindAttributes = {
        nodeType: "Text",
        nodePath: [],
        bindTexts: [],
        creatorByText: new Map()
      };

      expect(attributes.bindTexts).toHaveLength(0);
      expect(attributes.creatorByText.size).toBe(0);
    });

    test("should support different node types", () => {
      const nodeTypes: NodeType[] = ["HTMLElement", "SVGElement", "Text", "Template"];

      nodeTypes.forEach(nodeType => {
        const attributes: IDataBindAttributes = {
          nodeType: nodeType,
          nodePath: [0],
          bindTexts: [],
          creatorByText: new Map()
        };
        expect(attributes.nodeType).toBe(nodeType);
      });
    });
  });

  describe("Type integration", () => {
    test("should work together in a complete binding scenario", () => {
      // Create filter texts
      const inputFilter: IFilterText = {
        name: "trim",
        options: []
      };

      const outputFilter: IFilterText = {
        name: "format",
        options: ["currency", "USD"]
      };

      // Create bind text
      const bindText: IBindText = {
        nodeProperty: "textContent",
        stateProperty: "user.balance",
        inputFilterTexts: [inputFilter],
        outputFilterTexts: [outputFilter],
        decorates: ["required"]
      };

      // Create binding creator
      const creator: IBindingCreator = {
        createBindingNode: () => ({ 
          node: document.createElement("div"),
          name: "testNode",
          subName: "testSub",
          decorates: [],
          binding: {} as any,
          filters: {} as any,
          isSelectElement: false,
          isFor: false,
          bindContents: [],
          value: 1000,
          filteredValue: 1000,
          init: () => {},
          assignValue: () => {},
          updateElements: () => {},
          notifyRedraw: () => {},
          applyChange: () => {}
        } as any),
        createBindingState: () => ({ 
          pattern: "user.balance",
          info: {} as any,
          listIndex: null,
          ref: {} as any,
          filters: {} as any,
          init: () => {},
          assignValue: () => {},
          getValue: () => 1000,
          getFilteredValue: () => "$1,000.00"
        } as any)
      };

      // Create data bind attributes
      const attributes: IDataBindAttributes = {
        nodeType: "HTMLElement",
        nodePath: [0, 2, 1],
        bindTexts: [bindText],
        creatorByText: new Map([[bindText, creator]])
      };

      // Verify the complete integration
      expect(attributes.bindTexts).toContain(bindText);
      expect(attributes.creatorByText.get(bindText)).toBe(creator);
      expect(bindText.inputFilterTexts).toContain(inputFilter);
      expect(bindText.outputFilterTexts).toContain(outputFilter);
      expect(inputFilter.name).toBe("trim");
      expect(outputFilter.options).toEqual(["currency", "USD"]);
      
      // Test functionality with proper parameters
      const mockBinding = {} as any;
      const mockFilters = {} as any;
      const mockNode = document.createElement("div");
      const mockState = {} as any;

      const node = creator.createBindingNode(mockBinding, mockNode, mockFilters);
      const state = creator.createBindingState(mockBinding, mockFilters);
      expect(typeof node.init).toBe("function");
      expect(typeof state.getValue).toBe("function");
      expect(state.getValue(mockState)).toBe(1000);
    });

    test("should handle complex nested scenarios", () => {
      const complexBindText: IBindText = {
        nodeProperty: "style.backgroundColor",
        stateProperty: "theme.colors.primary",
        inputFilterTexts: [
          { name: "default", options: ["#ffffff"] },
          { name: "validate", options: ["color"] }
        ],
        outputFilterTexts: [
          { name: "lighten", options: ["10"] },
          { name: "hex", options: [] }
        ],
        decorates: ["cached", "throttled", "validated"]
      };

      const complexAttributes: IDataBindAttributes = {
        nodeType: "HTMLElement",
        nodePath: [0, 1, 2, 0, 1],
        bindTexts: [complexBindText],
        creatorByText: new Map([[
          complexBindText, 
          {
            createBindingNode: () => ({} as any),
            createBindingState: () => ({} as any)
          }
        ]])
      };

      expect(complexBindText.nodeProperty.includes(".")).toBe(true);
      expect(complexBindText.stateProperty.includes(".")).toBe(true);
      expect(complexBindText.inputFilterTexts).toHaveLength(2);
      expect(complexBindText.outputFilterTexts).toHaveLength(2);
      expect(complexBindText.decorates).toHaveLength(3);
      expect(complexAttributes.nodePath).toHaveLength(5);
    });
  });
});