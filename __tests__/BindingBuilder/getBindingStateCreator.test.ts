/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, vi, beforeEach } from "vitest";
import { getBindingStateCreator } from "../../src/BindingBuilder/getBindingStateCreator";
import type { IFilterText } from "../../src/BindingBuilder/types";

// Mock dependencies
vi.mock("../../src/DataBinding/BindingState/BindingState", () => ({
  createBindingState: vi.fn(() => () => ({ type: "standard", name: "state" }))
}));

vi.mock("../../src/DataBinding/BindingState/BindingStateIndex", () => ({
  createBindingStateIndex: vi.fn(() => () => ({ type: "index", name: "index" }))
}));

import { createBindingState } from "../../src/DataBinding/BindingState/BindingState";
import { createBindingStateIndex } from "../../src/DataBinding/BindingState/BindingStateIndex";

describe("BindingBuilder/getBindingStateCreator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Standard property bindings", () => {
    test("should return standard state creator for normal property names", () => {
      const filterTexts: IFilterText[] = [];

      const creator = getBindingStateCreator("user.name", filterTexts);

      expect(createBindingState).toHaveBeenCalledWith("user.name", filterTexts);
      expect(createBindingStateIndex).not.toHaveBeenCalled();
      expect(typeof creator).toBe("function");
    });

    test("should handle simple property names", () => {
      const filterTexts: IFilterText[] = [
        { name: "trim", options: [] },
        { name: "upperCase", options: [] }
      ];

      const creator = getBindingStateCreator("title", filterTexts);

      expect(createBindingState).toHaveBeenCalledWith("title", filterTexts);
      expect(createBindingStateIndex).not.toHaveBeenCalled();
    });

    test("should handle nested property paths", () => {
      const filterTexts: IFilterText[] = [
        { name: "default", options: ["N/A"] }
      ];

      const creator = getBindingStateCreator("data.user.profile.email", filterTexts);

      expect(createBindingState).toHaveBeenCalledWith("data.user.profile.email", filterTexts);
      expect(createBindingStateIndex).not.toHaveBeenCalled();
    });

    test("should handle array access patterns", () => {
      const filterTexts: IFilterText[] = [];

      const creator = getBindingStateCreator("items[0].name", filterTexts);

      expect(createBindingState).toHaveBeenCalledWith("items[0].name", filterTexts);
      expect(createBindingStateIndex).not.toHaveBeenCalled();
    });

    test("should handle properties with numbers (but not index pattern)", () => {
      const filterTexts: IFilterText[] = [];

      const testCases = [
        "item1",
        "user2.name", 
        "data3.field4",
        "prop123",
        "field_1"
      ];

      testCases.forEach(propertyName => {
        vi.clearAllMocks();
        
        const creator = getBindingStateCreator(propertyName, filterTexts);

        expect(createBindingState).toHaveBeenCalledWith(propertyName, filterTexts);
        expect(createBindingStateIndex).not.toHaveBeenCalled();
      });
    });
  });

  describe("Index property bindings", () => {
    test("should return index state creator for $number pattern", () => {
      const filterTexts: IFilterText[] = [];

      const creator = getBindingStateCreator("$1", filterTexts);

      expect(createBindingStateIndex).toHaveBeenCalledWith("$1", filterTexts);
      expect(createBindingState).not.toHaveBeenCalled();
      expect(typeof creator).toBe("function");
    });

    test("should handle various index patterns", () => {
      const filterTexts: IFilterText[] = [
        { name: "format", options: ["number"] }
      ];

      const indexPatterns = ["$0", "$1", "$2", "$10", "$99", "$123"];

      indexPatterns.forEach(pattern => {
        vi.clearAllMocks();

        const creator = getBindingStateCreator(pattern, filterTexts);

        expect(createBindingStateIndex).toHaveBeenCalledWith(pattern, filterTexts);
        expect(createBindingState).not.toHaveBeenCalled();
      });
    });

    test("should handle index patterns with filters", () => {
      const filterTexts: IFilterText[] = [
        { name: "add", options: ["1"] },
        { name: "format", options: ["ordinal"] }
      ];

      const creator = getBindingStateCreator("$0", filterTexts);

      expect(createBindingStateIndex).toHaveBeenCalledWith("$0", filterTexts);
      expect(createBindingState).not.toHaveBeenCalled();
    });
  });

  describe("Edge cases and validation", () => {
    test("should not match partial index patterns", () => {
      const filterTexts: IFilterText[] = [];

      const nonIndexPatterns = [
        "$",           // Just dollar sign
        "$a",          // Dollar with letter
        "$1a",         // Dollar, number, then letter
        "a$1",         // Letter before dollar-number
        "$$1",         // Double dollar
        "$1$",         // Dollar-number-dollar
        "$01",         // Leading zero (still valid number though)
        "$ 1",         // Space between
        "$-1"          // Negative number
      ];

      nonIndexPatterns.forEach(pattern => {
        vi.clearAllMocks();

        const creator = getBindingStateCreator(pattern, filterTexts);

        if (pattern === "$01") {
          // $01 is actually valid as it matches /^\$\d+$/
          expect(createBindingStateIndex).toHaveBeenCalledWith(pattern, filterTexts);
          expect(createBindingState).not.toHaveBeenCalled();
        } else {
          expect(createBindingState).toHaveBeenCalledWith(pattern, filterTexts);
          expect(createBindingStateIndex).not.toHaveBeenCalled();
        }
      });
    });

    test("should handle empty property name", () => {
      const filterTexts: IFilterText[] = [];

      const creator = getBindingStateCreator("", filterTexts);

      expect(createBindingState).toHaveBeenCalledWith("", filterTexts);
      expect(createBindingStateIndex).not.toHaveBeenCalled();
    });

    test("should handle empty filter texts", () => {
      const creator1 = getBindingStateCreator("property", []);
      expect(createBindingState).toHaveBeenCalledWith("property", []);

      vi.clearAllMocks();

      const creator2 = getBindingStateCreator("$1", []);
      expect(createBindingStateIndex).toHaveBeenCalledWith("$1", []);
    });

    test("should handle complex filter combinations", () => {
      const complexFilters: IFilterText[] = [
        { name: "default", options: ["0"] },
        { name: "number", options: [] },
        { name: "min", options: ["0"] },
        { name: "max", options: ["100"] },
        { name: "format", options: ["currency", "USD"] }
      ];

      const creator1 = getBindingStateCreator("user.balance", complexFilters);
      expect(createBindingState).toHaveBeenCalledWith("user.balance", complexFilters);

      vi.clearAllMocks();

      const creator2 = getBindingStateCreator("$2", complexFilters);
      expect(createBindingStateIndex).toHaveBeenCalledWith("$2", complexFilters);
    });
  });

  describe("Integration scenarios", () => {
    test("should work in loop context scenarios", () => {
      const filterTexts: IFilterText[] = [
        { name: "format", options: ["index"] }
      ];

      // Typical loop scenario: $1 for index, items for data
      const indexCreator = getBindingStateCreator("$1", filterTexts);
      const dataCreator = getBindingStateCreator("items", []);

      expect(createBindingStateIndex).toHaveBeenCalledWith("$1", filterTexts);
      expect(createBindingState).toHaveBeenCalledWith("items", []);
    });

    test("should handle nested loop scenarios", () => {
      const filterTexts: IFilterText[] = [];

      // Multiple index levels
      const outerIndexCreator = getBindingStateCreator("$1", filterTexts);
      const innerIndexCreator = getBindingStateCreator("$2", filterTexts);

      expect(createBindingStateIndex).toHaveBeenCalledTimes(2);
      expect(createBindingStateIndex).toHaveBeenNthCalledWith(1, "$1", filterTexts);
      expect(createBindingStateIndex).toHaveBeenNthCalledWith(2, "$2", filterTexts);
    });

    test("should maintain consistency across multiple calls", () => {
      const filterTexts: IFilterText[] = [{ name: "trim", options: [] }];

      // Multiple calls with same parameters
      const creator1 = getBindingStateCreator("user.name", filterTexts);
      const creator2 = getBindingStateCreator("user.name", filterTexts);

      expect(createBindingState).toHaveBeenCalledTimes(2);
      expect(createBindingState).toHaveBeenNthCalledWith(1, "user.name", filterTexts);
      expect(createBindingState).toHaveBeenNthCalledWith(2, "user.name", filterTexts);

      vi.clearAllMocks();

      // Multiple calls with index pattern
      const indexCreator1 = getBindingStateCreator("$1", filterTexts);
      const indexCreator2 = getBindingStateCreator("$1", filterTexts);

      expect(createBindingStateIndex).toHaveBeenCalledTimes(2);
      expect(createBindingStateIndex).toHaveBeenNthCalledWith(1, "$1", filterTexts);
      expect(createBindingStateIndex).toHaveBeenNthCalledWith(2, "$1", filterTexts);
    });

    test("should handle realistic binding scenarios", () => {
      const scenarios = [
        { name: "user.profile.avatar", expectIndex: false },
        { name: "$1", expectIndex: true },
        { name: "items[0].title", expectIndex: false },
        { name: "$0", expectIndex: true },
        { name: "data.list", expectIndex: false },
        { name: "$item", expectIndex: false },
        { name: "$999", expectIndex: true },
        { name: "component.state.value", expectIndex: false }
      ];

      scenarios.forEach(({ name, expectIndex }) => {
        vi.clearAllMocks();

        const filterTexts: IFilterText[] = [{ name: "test", options: [] }];
        const creator = getBindingStateCreator(name, filterTexts);

        if (expectIndex) {
          expect(createBindingStateIndex).toHaveBeenCalledWith(name, filterTexts);
          expect(createBindingState).not.toHaveBeenCalled();
        } else {
          expect(createBindingState).toHaveBeenCalledWith(name, filterTexts);
          expect(createBindingStateIndex).not.toHaveBeenCalled();
        }
      });
    });
  });
});