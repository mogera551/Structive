/**
 * @vitest-environment jsdom
 */
import { describe, test, expect } from "vitest";
import { 
  optionsRequired, 
  optionMustBeNumber, 
  valueMustBeNumber, 
  valueMustBeBoolean, 
  valueMustBeDate 
} from "../../src/Filter/errorMessages";

describe("Filter/errorMessages", () => {
  describe("optionsRequired", () => {
    test("should throw error with function name in message", () => {
      expect(() => optionsRequired("testFilter")).toThrow("testFilter requires at least one option");
    });

    test("should throw error for different function names", () => {
      expect(() => optionsRequired("eq")).toThrow("eq requires at least one option");
      expect(() => optionsRequired("gt")).toThrow("gt requires at least one option");
      expect(() => optionsRequired("slice")).toThrow("slice requires at least one option");
    });

    test("should return never type", () => {
      // TypeScript should infer this as never, but we can test the throw behavior
      const testFunction = (fnName: string): string => {
        if (fnName === "bad") {
          optionsRequired(fnName); // This should never return
        }
        return "success";
      };

      expect(() => testFunction("bad")).toThrow();
      expect(testFunction("good")).toBe("success");
    });

    test("should handle empty function name", () => {
      expect(() => optionsRequired("")).toThrow(" requires at least one option");
    });

    test("should handle special characters in function name", () => {
      expect(() => optionsRequired("test_filter-v2")).toThrow("test_filter-v2 requires at least one option");
    });
  });

  describe("optionMustBeNumber", () => {
    test("should throw error with function name in message", () => {
      expect(() => optionMustBeNumber("testFilter")).toThrow("testFilter requires a number as option");
    });

    test("should throw error for different function names", () => {
      expect(() => optionMustBeNumber("lt")).toThrow("lt requires a number as option");
      expect(() => optionMustBeNumber("gt")).toThrow("gt requires a number as option");
      expect(() => optionMustBeNumber("inc")).toThrow("inc requires a number as option");
    });

    test("should return never type", () => {
      const testFunction = (fnName: string): number => {
        if (fnName === "invalid") {
          optionMustBeNumber(fnName); // This should never return
        }
        return 42;
      };

      expect(() => testFunction("invalid")).toThrow();
      expect(testFunction("valid")).toBe(42);
    });

    test("should handle empty function name", () => {
      expect(() => optionMustBeNumber("")).toThrow(" requires a number as option");
    });
  });

  describe("valueMustBeNumber", () => {
    test("should throw error with function name in message", () => {
      expect(() => valueMustBeNumber("testFilter")).toThrow("testFilter requires a number value");
    });

    test("should throw error for different function names", () => {
      expect(() => valueMustBeNumber("round")).toThrow("round requires a number value");
      expect(() => valueMustBeNumber("floor")).toThrow("floor requires a number value");
      expect(() => valueMustBeNumber("locale")).toThrow("locale requires a number value");
    });

    test("should return never type", () => {
      const testFunction = (value: any, fnName: string): number => {
        if (typeof value !== "number") {
          valueMustBeNumber(fnName); // This should never return
        }
        return value * 2;
      };

      expect(() => testFunction("string", "multiply")).toThrow();
      expect(testFunction(5, "multiply")).toBe(10);
    });

    test("should handle empty function name", () => {
      expect(() => valueMustBeNumber("")).toThrow(" requires a number value");
    });
  });

  describe("valueMustBeBoolean", () => {
    test("should throw error with function name in message", () => {
      expect(() => valueMustBeBoolean("testFilter")).toThrow("testFilter requires a boolean value");
    });

    test("should throw error for different function names", () => {
      expect(() => valueMustBeBoolean("not")).toThrow("not requires a boolean value");
      expect(() => valueMustBeBoolean("booleanFilter")).toThrow("booleanFilter requires a boolean value");
    });

    test("should return never type", () => {
      const testFunction = (value: any, fnName: string): boolean => {
        if (typeof value !== "boolean") {
          valueMustBeBoolean(fnName); // This should never return
        }
        return !value;
      };

      expect(() => testFunction("string", "not")).toThrow();
      expect(() => testFunction(123, "not")).toThrow();
      expect(testFunction(true, "not")).toBe(false);
      expect(testFunction(false, "not")).toBe(true);
    });

    test("should handle empty function name", () => {
      expect(() => valueMustBeBoolean("")).toThrow(" requires a boolean value");
    });
  });

  describe("valueMustBeDate", () => {
    test("should throw error with function name in message", () => {
      expect(() => valueMustBeDate("testFilter")).toThrow("testFilter requires a date value");
    });

    test("should throw error for different function names", () => {
      expect(() => valueMustBeDate("date")).toThrow("date requires a date value");
      expect(() => valueMustBeDate("time")).toThrow("time requires a date value");
      expect(() => valueMustBeDate("ymd")).toThrow("ymd requires a date value");
    });

    test("should return never type", () => {
      const testFunction = (value: any, fnName: string): string => {
        if (!(value instanceof Date)) {
          valueMustBeDate(fnName); // This should never return
        }
        return value.toISOString();
      };

      expect(() => testFunction("string", "date")).toThrow();
      expect(() => testFunction(123, "date")).toThrow();
      // Invalid Date objects still pass instanceof Date check but may throw on operations
      const invalidDate = new Date("invalid");
      // We expect it to throw because toISOString() on invalid date throws
      expect(() => testFunction(invalidDate, "date")).toThrow();
      
      const validDate = new Date("2023-01-01");
      expect(testFunction(validDate, "date")).toBe(validDate.toISOString());
    });

    test("should handle empty function name", () => {
      expect(() => valueMustBeDate("")).toThrow(" requires a date value");
    });
  });

  describe("Error messages consistency", () => {
    test("should have consistent error message format", () => {
      const fnName = "testFilter";
      
      try {
        optionsRequired(fnName);
      } catch (error) {
        expect((error as Error).message).toMatch(/^testFilter requires/);
      }
      
      try {
        optionMustBeNumber(fnName);
      } catch (error) {
        expect((error as Error).message).toMatch(/^testFilter requires/);
      }
      
      try {
        valueMustBeNumber(fnName);
      } catch (error) {
        expect((error as Error).message).toMatch(/^testFilter requires/);
      }
      
      try {
        valueMustBeBoolean(fnName);
      } catch (error) {
        expect((error as Error).message).toMatch(/^testFilter requires/);
      }
      
      try {
        valueMustBeDate(fnName);
      } catch (error) {
        expect((error as Error).message).toMatch(/^testFilter requires/);
      }
    });

    test("should throw Error instances", () => {
      expect(() => optionsRequired("test")).toThrow(Error);
      expect(() => optionMustBeNumber("test")).toThrow(Error);
      expect(() => valueMustBeNumber("test")).toThrow(Error);
      expect(() => valueMustBeBoolean("test")).toThrow(Error);
      expect(() => valueMustBeDate("test")).toThrow(Error);
    });
  });

  describe("Usage in filter validation scenarios", () => {
    test("should be usable for option validation", () => {
      const mockFilter = (options?: string[]) => {
        const opt = options?.[0] ?? optionsRequired("mockFilter");
        const optValue = Number(opt);
        if (isNaN(optValue)) optionMustBeNumber("mockFilter");
        
        return (value: any) => {
          if (typeof value !== "number") valueMustBeNumber("mockFilter");
          return value + optValue;
        };
      };
      
      // Should throw when no options provided
      expect(() => mockFilter()).toThrow("mockFilter requires at least one option");
      
      // Should throw when option is not a number
      expect(() => mockFilter(["abc"])).toThrow("mockFilter requires a number as option");
      
      // Should throw when value is not a number
      const validFilter = mockFilter(["5"]);
      expect(() => validFilter("not a number")).toThrow("mockFilter requires a number value");
      
      // Should work with valid inputs
      expect(validFilter(10)).toBe(15);
    });

    test("should be usable for type validation", () => {
      const booleanFilter = (value: any) => {
        if (typeof value !== "boolean") valueMustBeBoolean("booleanFilter");
        return !value;
      };
      
      const dateFilter = (value: any) => {
        if (!(value instanceof Date)) valueMustBeDate("dateFilter");
        return value.getFullYear();
      };
      
      expect(() => booleanFilter("true")).toThrow("booleanFilter requires a boolean value");
      expect(() => booleanFilter(1)).toThrow("booleanFilter requires a boolean value");
      expect(booleanFilter(true)).toBe(false);
      expect(booleanFilter(false)).toBe(true);
      
      expect(() => dateFilter("2023-01-01")).toThrow("dateFilter requires a date value");
      expect(() => dateFilter(1672531200000)).toThrow("dateFilter requires a date value");
      expect(dateFilter(new Date("2023-01-01"))).toBe(2023);
    });
  });
});