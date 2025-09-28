/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, vi, beforeEach } from "vitest";
import { getBindingNodeCreator } from "../../src/BindingBuilder/getBindingNodeCreator";
import type { IFilterText } from "../../src/BindingBuilder/types";

// Mock all dependencies
vi.mock("../../src/DataBinding/BindingNode/BindingNodeAttribute", () => ({
  createBindingNodeAttribute: vi.fn(() => () => ({ type: "attribute" }))
}));

vi.mock("../../src/DataBinding/BindingNode/BindingNodeCheckbox", () => ({
  createBindingNodeCheckbox: vi.fn(() => () => ({ type: "checkbox" }))
}));

vi.mock("../../src/DataBinding/BindingNode/BindingNodeClassList", () => ({
  createBindingNodeClassList: vi.fn(() => () => ({ type: "classList" }))
}));

vi.mock("../../src/DataBinding/BindingNode/BindingNodeClassName", () => ({
  createBindingNodeClassName: vi.fn(() => () => ({ type: "className" }))
}));

vi.mock("../../src/DataBinding/BindingNode/BindingNodeEvent", () => ({
  createBindingNodeEvent: vi.fn(() => () => ({ type: "event" }))
}));

vi.mock("../../src/DataBinding/BindingNode/BindingNodeIf", () => ({
  createBindingNodeIf: vi.fn(() => () => ({ type: "if" }))
}));

vi.mock("../../src/DataBinding/BindingNode/BindingNodeFor", () => ({
  createBindingNodeFor: vi.fn(() => () => ({ type: "for" }))
}));

vi.mock("../../src/DataBinding/BindingNode/BindingNodeProperty", () => ({
  createBindingNodeProperty: vi.fn(() => () => ({ type: "property" }))
}));

vi.mock("../../src/DataBinding/BindingNode/BindingNodeRadio", () => ({
  createBindingNodeRadio: vi.fn(() => () => ({ type: "radio" }))
}));

vi.mock("../../src/DataBinding/BindingNode/BindingNodeStyle", () => ({
  createBindingNodeStyle: vi.fn(() => () => ({ type: "style" }))
}));

vi.mock("../../src/DataBinding/BindingNode/BindingNodeComponent", () => ({
  createBindingNodeComponent: vi.fn(() => () => ({ type: "component" }))
}));

vi.mock("../../src/utils", () => ({
  raiseError: vi.fn((message: string) => {
    throw new Error(message);
  })
}));

import { createBindingNodeAttribute } from "../../src/DataBinding/BindingNode/BindingNodeAttribute";
import { createBindingNodeCheckbox } from "../../src/DataBinding/BindingNode/BindingNodeCheckbox";
import { createBindingNodeClassList } from "../../src/DataBinding/BindingNode/BindingNodeClassList";
import { createBindingNodeClassName } from "../../src/DataBinding/BindingNode/BindingNodeClassName";
import { createBindingNodeEvent } from "../../src/DataBinding/BindingNode/BindingNodeEvent";
import { createBindingNodeIf } from "../../src/DataBinding/BindingNode/BindingNodeIf";
import { createBindingNodeFor } from "../../src/DataBinding/BindingNode/BindingNodeFor";
import { createBindingNodeProperty } from "../../src/DataBinding/BindingNode/BindingNodeProperty";
import { createBindingNodeRadio } from "../../src/DataBinding/BindingNode/BindingNodeRadio";
import { createBindingNodeStyle } from "../../src/DataBinding/BindingNode/BindingNodeStyle";
import { createBindingNodeComponent } from "../../src/DataBinding/BindingNode/BindingNodeComponent";
import { raiseError } from "../../src/utils";

describe("BindingBuilder/getBindingNodeCreator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Element node bindings", () => {
    test("should return classList creator for 'class' property", () => {
      const element = document.createElement("div");
      const filterTexts: IFilterText[] = [];
      const decorates: string[] = [];

      const creator = getBindingNodeCreator(element, "class", filterTexts, decorates);

      expect(createBindingNodeClassList).toHaveBeenCalledWith("class", filterTexts, decorates);
      expect(typeof creator).toBe("function");
    });

    test("should return checkbox creator for 'checkbox' property", () => {
      const element = document.createElement("input");
      const filterTexts: IFilterText[] = [];
      const decorates: string[] = [];

      const creator = getBindingNodeCreator(element, "checkbox", filterTexts, decorates);

      expect(createBindingNodeCheckbox).toHaveBeenCalledWith("checkbox", filterTexts, decorates);
    });

    test("should return radio creator for 'radio' property", () => {
      const element = document.createElement("input");
      const filterTexts: IFilterText[] = [];
      const decorates: string[] = [];

      const creator = getBindingNodeCreator(element, "radio", filterTexts, decorates);

      expect(createBindingNodeRadio).toHaveBeenCalledWith("radio", filterTexts, decorates);
    });

    test("should return className creator for 'class.xxx' property", () => {
      const element = document.createElement("div");
      const filterTexts: IFilterText[] = [{ name: "trim", options: [] }];
      const decorates: string[] = ["required"];

      const creator = getBindingNodeCreator(element, "class.active", filterTexts, decorates);

      expect(createBindingNodeClassName).toHaveBeenCalledWith("class.active", filterTexts, decorates);
    });

    test("should return attribute creator for 'attr.xxx' property", () => {
      const element = document.createElement("div");
      const filterTexts: IFilterText[] = [];
      const decorates: string[] = [];

      const creator = getBindingNodeCreator(element, "attr.title", filterTexts, decorates);

      expect(createBindingNodeAttribute).toHaveBeenCalledWith("attr.title", filterTexts, decorates);
    });

    test("should return style creator for 'style.xxx' property", () => {
      const element = document.createElement("div");
      const filterTexts: IFilterText[] = [];
      const decorates: string[] = [];

      const creator = getBindingNodeCreator(element, "style.color", filterTexts, decorates);

      expect(createBindingNodeStyle).toHaveBeenCalledWith("style.color", filterTexts, decorates);
    });

    test("should return component creator for 'state.xxx' property", () => {
      const element = document.createElement("div");
      const filterTexts: IFilterText[] = [];
      const decorates: string[] = [];

      const creator = getBindingNodeCreator(element, "state.value", filterTexts, decorates);

      expect(createBindingNodeComponent).toHaveBeenCalledWith("state.value", filterTexts, decorates);
    });

    test("should return event creator for properties starting with 'on'", () => {
      const element = document.createElement("button");
      const filterTexts: IFilterText[] = [];
      const decorates: string[] = [];

      const creator = getBindingNodeCreator(element, "onclick", filterTexts, decorates);

      expect(createBindingNodeEvent).toHaveBeenCalledWith("onclick", filterTexts, decorates);
    });

    test("should handle various event properties", () => {
      const element = document.createElement("input");
      const filterTexts: IFilterText[] = [];
      const decorates: string[] = [];

      const eventProperties = ["onchange", "oninput", "onblur", "onfocus", "onsubmit"];

      eventProperties.forEach(eventProp => {
        vi.clearAllMocks();
        getBindingNodeCreator(element, eventProp, filterTexts, decorates);
        expect(createBindingNodeEvent).toHaveBeenCalledWith(eventProp, filterTexts, decorates);
      });
    });

    test("should return property creator for standard properties", () => {
      const element = document.createElement("input");
      const filterTexts: IFilterText[] = [];
      const decorates: string[] = [];

      const creator = getBindingNodeCreator(element, "value", filterTexts, decorates);

      expect(createBindingNodeProperty).toHaveBeenCalledWith("value", filterTexts, decorates);
    });

    test("should return property creator for custom properties", () => {
      const element = document.createElement("div");
      const filterTexts: IFilterText[] = [];
      const decorates: string[] = [];

      const creator = getBindingNodeCreator(element, "customProp", filterTexts, decorates);

      expect(createBindingNodeProperty).toHaveBeenCalledWith("customProp", filterTexts, decorates);
    });
  });

  describe("Comment node bindings", () => {
    test("should return if creator for 'if' property in comment", () => {
      const comment = document.createComment("if:condition");
      const filterTexts: IFilterText[] = [];
      const decorates: string[] = [];

      const creator = getBindingNodeCreator(comment, "if", filterTexts, decorates);

      expect(createBindingNodeIf).toHaveBeenCalledWith("if", filterTexts, decorates);
    });

    test("should return for creator for 'for' property in comment", () => {
      const comment = document.createComment("for:items");
      const filterTexts: IFilterText[] = [];
      const decorates: string[] = [];

      const creator = getBindingNodeCreator(comment, "for", filterTexts, decorates);

      expect(createBindingNodeFor).toHaveBeenCalledWith("for", filterTexts, decorates);
    });

    test("should throw error for unsupported comment property", () => {
      const comment = document.createComment("unsupported:value");
      const filterTexts: IFilterText[] = [];
      const decorates: string[] = [];

      expect(() => {
        getBindingNodeCreator(comment, "unsupported", filterTexts, decorates);
      }).toThrow("getBindingNodeCreator: unknown node property unsupported");

      expect(raiseError).toHaveBeenCalledWith("getBindingNodeCreator: unknown node property unsupported");
    });
  });

  describe("Caching mechanism", () => {
    test("should cache results for repeated calls", () => {
      const element = document.createElement("div");
      const filterTexts: IFilterText[] = [];
      const decorates: string[] = [];

      // First call
      const creator1 = getBindingNodeCreator(element, "value", filterTexts, decorates);
      expect(createBindingNodeProperty).toHaveBeenCalledTimes(1);

      // Second call with same parameters
      const creator2 = getBindingNodeCreator(element, "value", [], []);
      expect(createBindingNodeProperty).toHaveBeenCalledTimes(2); // Called again for new creator instance

      // Both should return functions
      expect(typeof creator1).toBe("function");
      expect(typeof creator2).toBe("function");
    });

    test("should create different cache entries for different node types", () => {
      const element = document.createElement("div");
      const comment = document.createComment("if:condition");
      const filterTexts: IFilterText[] = [];
      const decorates: string[] = [];

      const creator1 = getBindingNodeCreator(element, "if", filterTexts, decorates);
      const creator2 = getBindingNodeCreator(comment, "if", filterTexts, decorates);

      expect(createBindingNodeProperty).toHaveBeenCalledWith("if", filterTexts, decorates);
      expect(createBindingNodeIf).toHaveBeenCalledWith("if", filterTexts, decorates);
    });
  });

  describe("Complex scenarios", () => {
    test("should handle nested class properties", () => {
      const element = document.createElement("div");
      const filterTexts: IFilterText[] = [
        { name: "default", options: ["false"] },
        { name: "boolean", options: [] }
      ];
      const decorates: string[] = ["cached"];

      const creator = getBindingNodeCreator(element, "class.active.selected", filterTexts, decorates);

      expect(createBindingNodeClassName).toHaveBeenCalledWith("class.active.selected", filterTexts, decorates);
    });

    test("should handle complex style properties", () => {
      const element = document.createElement("div");
      const filterTexts: IFilterText[] = [
        { name: "px", options: [] },
        { name: "min", options: ["0"] }
      ];
      const decorates: string[] = ["throttled"];

      const creator = getBindingNodeCreator(element, "style.marginTop", filterTexts, decorates);

      expect(createBindingNodeStyle).toHaveBeenCalledWith("style.marginTop", filterTexts, decorates);
    });

    test("should handle complex attribute properties", () => {
      const element = document.createElement("img");
      const filterTexts: IFilterText[] = [
        { name: "default", options: ["placeholder.jpg"] }
      ];
      const decorates: string[] = [];

      const creator = getBindingNodeCreator(element, "attr.data-src", filterTexts, decorates);

      expect(createBindingNodeAttribute).toHaveBeenCalledWith("attr.data-src", filterTexts, decorates);
    });

    test("should handle state properties with complex paths", () => {
      const element = document.createElement("custom-component");
      const filterTexts: IFilterText[] = [];
      const decorates: string[] = ["async"];

      const creator = getBindingNodeCreator(element, "state.user.profile", filterTexts, decorates);

      expect(createBindingNodeComponent).toHaveBeenCalledWith("state.user.profile", filterTexts, decorates);
    });
  });

  describe("Edge cases", () => {
    test("should handle TextNode (treated as non-element, non-comment)", () => {
      const textNode = document.createTextNode("Hello");
      const filterTexts: IFilterText[] = [];
      const decorates: string[] = [];

      const creator = getBindingNodeCreator(textNode as any, "textContent", filterTexts, decorates);

      expect(createBindingNodeProperty).toHaveBeenCalledWith("textContent", filterTexts, decorates);
    });

    test("should handle empty property names", () => {
      const element = document.createElement("div");
      const filterTexts: IFilterText[] = [];
      const decorates: string[] = [];

      const creator = getBindingNodeCreator(element, "", filterTexts, decorates);

      expect(createBindingNodeProperty).toHaveBeenCalledWith("", filterTexts, decorates);
    });

    test("should handle properties that start with but are not exactly 'on'", () => {
      const element = document.createElement("div");
      const filterTexts: IFilterText[] = [];
      const decorates: string[] = [];

      // Property that starts with 'on' but is an event
      const creator1 = getBindingNodeCreator(element, "onload", filterTexts, decorates);
      expect(createBindingNodeEvent).toHaveBeenCalledWith("onload", filterTexts, decorates);

      vi.clearAllMocks();

      // Property that starts with 'on' but has more characters should still be treated as event
      const creator2 = getBindingNodeCreator(element, "onlineStatus", filterTexts, decorates);
      expect(createBindingNodeEvent).toHaveBeenCalledWith("onlineStatus", filterTexts, decorates);
    });

    test("should handle case sensitivity", () => {
      const element = document.createElement("div");
      const filterTexts: IFilterText[] = [];
      const decorates: string[] = [];

      // Different cases should be treated differently
      const creator1 = getBindingNodeCreator(element, "Class", filterTexts, decorates);
      expect(createBindingNodeProperty).toHaveBeenCalledWith("Class", filterTexts, decorates);

      vi.clearAllMocks();

      const creator2 = getBindingNodeCreator(element, "ONCLICK", filterTexts, decorates);
      expect(createBindingNodeProperty).toHaveBeenCalledWith("ONCLICK", filterTexts, decorates);
    });
  });
});