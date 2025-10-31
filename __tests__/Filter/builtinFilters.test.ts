/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, vi, beforeEach } from "vitest";
import { 
  outputBuiltinFilters, 
  inputBuiltinFilters, 
  builtinFilterFn 
} from "../../src/Filter/builtinFilters";

// getGlobalConfig のモック
vi.mock("../../src/WebComponents/getGlobalConfig.js", () => ({
  getGlobalConfig: () => ({
    locale: "ja-JP"
  })
}));

describe("Filter/builtinFilters", () => {
  describe("Comparison filters", () => {
    describe("eq filter", () => {
      test("should compare numbers correctly", () => {
        const filter = outputBuiltinFilters.eq(["5"]);
        expect(filter(5)).toBe(true);
        expect(filter(3)).toBe(false);
        expect(filter("5")).toBe(true); // strings are compared as strings
      });

      test("should compare strings correctly", () => {
        const filter = outputBuiltinFilters.eq(["hello"]);
        expect(filter("hello")).toBe(true);
        expect(filter("world")).toBe(false);
        // When comparing number to string option, it tries to convert "hello" to number, which fails
        expect(() => filter(5)).toThrow("eq requires a number as option");
      });

      test("should use strict equality for other types", () => {
        const filter = outputBuiltinFilters.eq(["true"]);
        expect(filter("true")).toBe(true);
        expect(filter(true)).toBe(false); // different types
      });

      test("should throw error when no options provided", () => {
        expect(() => outputBuiltinFilters.eq()).toThrow("eq requires at least one option");
      });
    });

    describe("ne filter", () => {
      test("should compare numbers correctly", () => {
        const filter = outputBuiltinFilters.ne(["5"]);
        expect(filter(5)).toBe(false);
        expect(filter(3)).toBe(true);
        expect(filter("5")).toBe(false); // strings are compared as strings
      });

      test("should compare strings correctly", () => {
        const filter = outputBuiltinFilters.ne(["hello"]);
        expect(filter("hello")).toBe(false);
        expect(filter("world")).toBe(true);
      });

      test("should use strict inequality for other types", () => {
        const filter = outputBuiltinFilters.ne(["true"]);
        expect(filter(true)).toBe(true);
        expect(filter("true")).toBe(false);
      });

      test("should throw error when option is not a number", () => {
        const filter = outputBuiltinFilters.ne(["abc"]);
        expect(() => filter(1)).toThrow("ne requires a number as option");
      });

      test("should throw error when no options provided", () => {
        expect(() => outputBuiltinFilters.ne()).toThrow("ne requires at least one option");
      });
    });

    describe("not filter", () => {
      test("should negate boolean values", () => {
        const filter = outputBuiltinFilters.not();
        expect(filter(true)).toBe(false);
        expect(filter(false)).toBe(true);
      });

      test("should throw error for non-boolean values", () => {
        const filter = outputBuiltinFilters.not();
        expect(() => filter("true")).toThrow("not requires a boolean value");
        expect(() => filter(1)).toThrow("not requires a boolean value");
        expect(() => filter(null)).toThrow("not requires a boolean value");
      });
    });

    describe("lt filter", () => {
      test("should compare numbers correctly", () => {
        const filter = outputBuiltinFilters.lt(["10"]);
        expect(filter(5)).toBe(true);
        expect(filter(10)).toBe(false);
        expect(filter(15)).toBe(false);
      });

      test("should throw error for non-number values", () => {
        const filter = outputBuiltinFilters.lt(["10"]);
        expect(() => filter("5")).toThrow("lt requires a number value");
      });

      test("should throw error when no options provided", () => {
        expect(() => outputBuiltinFilters.lt()).toThrow("lt requires at least one option");
      });

      test("should throw error when option is not a number", () => {
        expect(() => outputBuiltinFilters.lt(["abc"])).toThrow("lt requires a number as option");
      });
    });

    describe("le filter", () => {
      test("should compare numbers correctly", () => {
        const filter = outputBuiltinFilters.le(["10"]);
        expect(filter(5)).toBe(true);
        expect(filter(10)).toBe(true);
        expect(filter(15)).toBe(false);
      });

      test("should throw appropriate errors", () => {
        const filter = outputBuiltinFilters.le(["10"]);
        expect(() => filter("5")).toThrow("le requires a number value");
        expect(() => outputBuiltinFilters.le()).toThrow("le requires at least one option");
        expect(() => outputBuiltinFilters.le(["abc"])).toThrow("le requires a number as option");
      });
    });

    describe("gt filter", () => {
      test("should compare numbers correctly", () => {
        const filter = outputBuiltinFilters.gt(["10"]);
        expect(filter(15)).toBe(true);
        expect(filter(10)).toBe(false);
        expect(filter(5)).toBe(false);
      });

      test("should throw appropriate errors", () => {
        const filter = outputBuiltinFilters.gt(["10"]);
        expect(() => filter("15")).toThrow("gt requires a number value");
        expect(() => outputBuiltinFilters.gt()).toThrow("gt requires at least one option");
        expect(() => outputBuiltinFilters.gt(["abc"])).toThrow("gt requires a number as option");
      });
    });

    describe("ge filter", () => {
      test("should compare numbers correctly", () => {
        const filter = outputBuiltinFilters.ge(["10"]);
        expect(filter(15)).toBe(true);
        expect(filter(10)).toBe(true);
        expect(filter(5)).toBe(false);
      });

      test("should throw appropriate errors", () => {
        const filter = outputBuiltinFilters.ge(["10"]);
        expect(() => filter("15")).toThrow("ge requires a number value");
        expect(() => outputBuiltinFilters.ge()).toThrow("ge requires at least one option");
        expect(() => outputBuiltinFilters.ge(["abc"])).toThrow("ge requires a number as option");
      });
    });
  });

  describe("Arithmetic filters", () => {
    describe("inc filter", () => {
      test("should increment numbers", () => {
        const filter = outputBuiltinFilters.inc(["5"]);
        expect(filter(10)).toBe(15);
        expect(filter(-3)).toBe(2);
        expect(filter(0)).toBe(5);
      });

      test("should handle decimal increments", () => {
        const filter = outputBuiltinFilters.inc(["2.5"]);
        expect(filter(10)).toBe(12.5);
      });

      test("should throw appropriate errors", () => {
        const filter = outputBuiltinFilters.inc(["5"]);
        expect(() => filter("10")).toThrow("inc requires a number value");
        expect(() => outputBuiltinFilters.inc()).toThrow("inc requires at least one option");
        expect(() => outputBuiltinFilters.inc(["abc"])).toThrow("inc requires a number as option");
      });
    });

    describe("dec filter", () => {
      test("should decrement numbers", () => {
        const filter = outputBuiltinFilters.dec(["5"]);
        expect(filter(10)).toBe(5);
        expect(filter(3)).toBe(-2);
      });

      test("should throw appropriate errors", () => {
        const filter = outputBuiltinFilters.dec(["5"]);
        expect(() => filter("10")).toThrow("dec requires a number value");
        expect(() => outputBuiltinFilters.dec()).toThrow("dec requires at least one option");
        expect(() => outputBuiltinFilters.dec(["abc"])).toThrow("dec requires a number as option");
      });
    });

    describe("mul filter", () => {
      test("should multiply numbers", () => {
        const filter = outputBuiltinFilters.mul(["3"]);
        expect(filter(5)).toBe(15);
        expect(filter(-2)).toBe(-6);
      });

      test("should handle decimal multiplication", () => {
        const filter = outputBuiltinFilters.mul(["2.5"]);
        expect(filter(4)).toBe(10);
      });

      test("should throw appropriate errors", () => {
        const filter = outputBuiltinFilters.mul(["3"]);
        expect(() => filter("5")).toThrow("mul requires a number value");
        expect(() => outputBuiltinFilters.mul()).toThrow("mul requires at least one option");
        expect(() => outputBuiltinFilters.mul(["abc"])).toThrow("mul requires a number as option");
      });
    });

    describe("div filter", () => {
      test("should divide numbers", () => {
        const filter = outputBuiltinFilters.div(["2"]);
        expect(filter(10)).toBe(5);
        expect(filter(7)).toBe(3.5);
      });

      test("should handle division by zero", () => {
        const filter = outputBuiltinFilters.div(["0"]);
        expect(filter(10)).toBe(Infinity);
      });

      test("should throw appropriate errors", () => {
        const filter = outputBuiltinFilters.div(["2"]);
        expect(() => filter("10")).toThrow("div requires a number value");
        expect(() => outputBuiltinFilters.div()).toThrow("div requires at least one option");
        expect(() => outputBuiltinFilters.div(["abc"])).toThrow("div requires a number as option");
      });
    });
  });

  describe("Number formatting filters", () => {
    describe("fix filter", () => {
      test("should format numbers with specified decimal places", () => {
        const filter = outputBuiltinFilters.fix(["2"]);
        expect(filter(3.14159)).toBe("3.14");
        expect(filter(10)).toBe("10.00");
      });

      test("should use 0 decimal places by default", () => {
        const filter = outputBuiltinFilters.fix();
        expect(filter(3.14159)).toBe("3");
      });

      test("should throw appropriate errors", () => {
        const filter = outputBuiltinFilters.fix(["2"]);
        expect(() => filter("3.14")).toThrow("fix requires a number value");
        expect(() => outputBuiltinFilters.fix(["abc"])).toThrow("fix requires a number as option");
      });
    });

    describe("locale filter", () => {
      test("should format numbers using locale", () => {
        const filter = outputBuiltinFilters.locale();
        expect(typeof filter(1234.567)).toBe("string");
        expect(filter(1234.567)).toContain("1");
      });

      test("should use custom locale", () => {
        const filter = outputBuiltinFilters.locale(["en-US"]);
        expect(typeof filter(1234.567)).toBe("string");
      });

      test("should throw error for non-number values", () => {
        const filter = outputBuiltinFilters.locale();
        expect(() => filter("1234")).toThrow("locale requires a number value");
      });
    });

    describe("round filter", () => {
      test("should round numbers to specified decimal places", () => {
        const filter = outputBuiltinFilters.round(["1"]);
        expect(filter(3.14159)).toBe(3.1);
        expect(filter(3.16)).toBe(3.2);
      });

      test("should round to integers by default", () => {
        const filter = outputBuiltinFilters.round();
        expect(filter(3.14159)).toBe(3);
        expect(filter(3.6)).toBe(4);
      });

      test("should throw appropriate errors", () => {
        const filter = outputBuiltinFilters.round(["1"]);
        expect(() => filter("3.14")).toThrow("round requires a number value");
        expect(() => outputBuiltinFilters.round(["abc"])).toThrow("round requires a number as option");
      });
    });

    describe("floor filter", () => {
      test("should floor numbers to specified decimal places", () => {
        const filter = outputBuiltinFilters.floor(["1"]);
        expect(filter(3.19)).toBe(3.1);
      });

      test("should floor to integers by default", () => {
        const filter = outputBuiltinFilters.floor();
        expect(filter(3.9)).toBe(3);
      });

      test("should throw appropriate errors", () => {
        const filter = outputBuiltinFilters.floor(["1"]);
        expect(() => filter("3.14")).toThrow("floor requires a number value");
        expect(() => outputBuiltinFilters.floor(["abc"])).toThrow("floor requires a number as option");
      });
    });

    describe("ceil filter", () => {
      test("should ceil numbers to specified decimal places", () => {
        const filter = outputBuiltinFilters.ceil(["1"]);
        expect(filter(3.11)).toBe(3.2);
      });

      test("should ceil to integers by default", () => {
        const filter = outputBuiltinFilters.ceil();
        expect(filter(3.1)).toBe(4);
      });

      test("should throw appropriate errors", () => {
        const filter = outputBuiltinFilters.ceil(["1"]);
        expect(() => filter("3.14")).toThrow("ceil requires a number value");
        expect(() => outputBuiltinFilters.ceil(["abc"])).toThrow("ceil requires a number as option");
      });
    });

    describe("percent filter", () => {
      test("should format numbers as percentage", () => {
        const filter = outputBuiltinFilters.percent(["1"]);
        expect(filter(0.5)).toBe("50.0%");
        expect(filter(1.234)).toBe("123.4%");
      });

      test("should use 0 decimal places by default", () => {
        const filter = outputBuiltinFilters.percent();
        expect(filter(0.5)).toBe("50%");
      });

      test("should throw appropriate errors", () => {
        const filter = outputBuiltinFilters.percent(["1"]);
        expect(() => filter("0.5")).toThrow("percent requires a number value");
        expect(() => outputBuiltinFilters.percent(["abc"])).toThrow("percent requires a number as option");
      });
    });
  });

  describe("String manipulation filters", () => {
    describe("uc filter", () => {
      test("should convert to uppercase", () => {
        const filter = outputBuiltinFilters.uc();
        expect(filter("hello")).toBe("HELLO");
        expect(filter("World")).toBe("WORLD");
        expect(filter(123)).toBe("123");
      });
    });

    describe("lc filter", () => {
      test("should convert to lowercase", () => {
        const filter = outputBuiltinFilters.lc();
        expect(filter("HELLO")).toBe("hello");
        expect(filter("World")).toBe("world");
        expect(filter(123)).toBe("123");
      });
    });

    describe("cap filter", () => {
      test("should capitalize first letter", () => {
        const filter = outputBuiltinFilters.cap();
        expect(filter("hello")).toBe("Hello");
        expect(filter("WORLD")).toBe("WORLD");
        expect(filter("a")).toBe("A");
        expect(filter("")).toBe("");
      });
    });

    describe("trim filter", () => {
      test("should trim whitespace", () => {
        const filter = outputBuiltinFilters.trim();
        expect(filter("  hello  ")).toBe("hello");
        expect(filter("\t\nworld\n\t")).toBe("world");
        expect(filter(123)).toBe("123");
      });
    });

    describe("slice filter", () => {
      test("should slice string from specified position", () => {
        const filter = outputBuiltinFilters.slice(["2"]);
        expect(filter("hello")).toBe("llo");
        expect(filter("world")).toBe("rld");
      });

      test("should throw appropriate errors", () => {
        expect(() => outputBuiltinFilters.slice()).toThrow("slice requires at least one option");
        expect(() => outputBuiltinFilters.slice(["abc"])).toThrow("slice requires a number as option");
      });
    });

    describe("substr filter", () => {
      test("should extract substring", () => {
        const filter = outputBuiltinFilters.substr(["1", "3"]);
        expect(filter("hello")).toBe("ell");
        expect(filter("world")).toBe("orl");
      });

      test("should throw appropriate errors", () => {
        expect(() => outputBuiltinFilters.substr()).toThrow("substr requires at least one option");
        expect(() => outputBuiltinFilters.substr(["1"])).toThrow("substr requires at least one option");
        expect(() => outputBuiltinFilters.substr(["abc", "2"])).toThrow("substr requires a number as option");
        expect(() => outputBuiltinFilters.substr(["1", "abc"])).toThrow("substr requires a number as option");
      });
    });

    describe("pad filter", () => {
      test("should pad string with specified character", () => {
        const filter = outputBuiltinFilters.pad(["5", "*"]);
        expect(filter("123")).toBe("**123");
      });

      test("should use '0' as default pad character", () => {
        const filter = outputBuiltinFilters.pad(["5"]);
        expect(filter("123")).toBe("00123");
      });

      test("should throw appropriate errors", () => {
        expect(() => outputBuiltinFilters.pad()).toThrow("pad requires at least one option");
        expect(() => outputBuiltinFilters.pad(["abc"])).toThrow("pad requires a number as option");
      });
    });

    describe("rep filter", () => {
      test("should repeat string specified times", () => {
        const filter = outputBuiltinFilters.rep(["3"]);
        expect(filter("hi")).toBe("hihihi");
        expect(filter("a")).toBe("aaa");
      });

      test("should throw appropriate errors", () => {
        expect(() => outputBuiltinFilters.rep()).toThrow("rep requires at least one option");
        expect(() => outputBuiltinFilters.rep(["abc"])).toThrow("rep requires a number as option");
      });
    });

    describe("rev filter", () => {
      test("should reverse string", () => {
        const filter = outputBuiltinFilters.rev();
        expect(filter("hello")).toBe("olleh");
        expect(filter("12345")).toBe("54321");
        expect(filter(123)).toBe("321");
      });
    });
  });

  describe("Type conversion filters", () => {
    describe("int filter", () => {
      test("should convert to integer", () => {
        const filter = outputBuiltinFilters.int();
        expect(filter("123")).toBe(123);
        expect(filter("123.45")).toBe(123);
        expect(filter(123.45)).toBe(123);
      });

      test("should handle non-numeric strings", () => {
        const filter = outputBuiltinFilters.int();
        expect(filter("abc")).toBeNaN();
        expect(filter("123abc")).toBe(123);
      });
    });

    describe("float filter", () => {
      test("should convert to float", () => {
        const filter = outputBuiltinFilters.float();
        expect(filter("123.45")).toBe(123.45);
        expect(filter("123")).toBe(123);
        expect(filter(123)).toBe(123);
      });

      test("should handle non-numeric strings", () => {
        const filter = outputBuiltinFilters.float();
        expect(filter("abc")).toBeNaN();
        expect(filter("123.45abc")).toBe(123.45);
      });
    });

    describe("boolean filter", () => {
      test("should convert to boolean", () => {
        const filter = outputBuiltinFilters.boolean();
        expect(filter("hello")).toBe(true);
        expect(filter("")).toBe(false);
        expect(filter(1)).toBe(true);
        expect(filter(0)).toBe(false);
        expect(filter(null)).toBe(false);
        expect(filter(undefined)).toBe(false);
      });
    });

    describe("number filter", () => {
      test("should convert to number", () => {
        const filter = outputBuiltinFilters.number();
        expect(filter("123")).toBe(123);
        expect(filter("123.45")).toBe(123.45);
        expect(filter(true)).toBe(1);
        expect(filter(false)).toBe(0);
        expect(filter("abc")).toBeNaN();
      });
    });

    describe("string filter", () => {
      test("should convert to string", () => {
        const filter = outputBuiltinFilters.string();
        expect(filter(123)).toBe("123");
        expect(filter(true)).toBe("true");
        expect(filter(null)).toBe("null");
        expect(filter(undefined)).toBe("undefined");
      });
    });

    describe("null filter", () => {
      test("should convert empty string to null", () => {
        const filter = outputBuiltinFilters.null();
        expect(filter("")).toBe(null);
        expect(filter("hello")).toBe("hello");
        expect(filter(0)).toBe(0);
        expect(filter(false)).toBe(false);
      });
    });
  });

  describe("Date filters", () => {
    const testDate = new Date("2023-12-25T10:30:45");

    describe("date filter", () => {
      test("should format date", () => {
        const filter = outputBuiltinFilters.date();
        const result = filter(testDate);
        expect(typeof result).toBe("string");
        expect(result).toContain("2023");
      });

      test("should use custom locale", () => {
        const filter = outputBuiltinFilters.date(["en-US"]);
        const result = filter(testDate);
        expect(typeof result).toBe("string");
      });

      test("should throw error for non-Date values", () => {
        const filter = outputBuiltinFilters.date();
        expect(() => filter("2023-12-25")).toThrow("date requires a date value");
        expect(() => filter(1703505045000)).toThrow("date requires a date value");
      });
    });

    describe("time filter", () => {
      test("should format time", () => {
        const filter = outputBuiltinFilters.time();
        const result = filter(testDate);
        expect(typeof result).toBe("string");
        expect(result).toContain("10");
        expect(result).toContain("30");
      });

      test("should use custom locale", () => {
        const filter = outputBuiltinFilters.time(["en-US"]);
        const result = filter(testDate);
        expect(typeof result).toBe("string");
      });

      test("should throw error for non-Date values", () => {
        const filter = outputBuiltinFilters.time();
        expect(() => filter("10:30:45")).toThrow("time requires a date value");
      });
    });

    describe("datetime filter", () => {
      test("should format datetime", () => {
        const filter = outputBuiltinFilters.datetime();
        const result = filter(testDate);
        expect(typeof result).toBe("string");
        expect(result).toContain("2023");
        expect(result).toContain("10");
      });

      test("should use custom locale", () => {
        const filter = outputBuiltinFilters.datetime(["en-US"]);
        const result = filter(testDate);
        expect(typeof result).toBe("string");
      });

      test("should throw error for non-Date values", () => {
        const filter = outputBuiltinFilters.datetime();
        expect(() => filter("2023-12-25 10:30:45")).toThrow("datetime requires a date value");
      });
    });

    describe("ymd filter", () => {
      test("should format as YYYY-MM-DD by default", () => {
        const filter = outputBuiltinFilters.ymd();
        expect(filter(testDate)).toBe("2023-12-25");
      });

      test("should use custom separator", () => {
        const filter = outputBuiltinFilters.ymd(["/"]);
        expect(filter(testDate)).toBe("2023/12/25");
      });

      test("should throw error for non-Date values", () => {
        const filter = outputBuiltinFilters.ymd();
        expect(() => filter("2023-12-25")).toThrow("ymd requires a date value");
      });
    });
  });

  describe("Conditional filters", () => {
    describe("falsy filter", () => {
      test("should return true for falsy values", () => {
        const filter = outputBuiltinFilters.falsy();
        expect(filter(false)).toBe(true);
        expect(filter(null)).toBe(true);
        expect(filter(undefined)).toBe(true);
        expect(filter(0)).toBe(true);
        expect(filter("")).toBe(true);
        expect(filter(NaN)).toBe(true);
      });

      test("should return false for truthy values", () => {
        const filter = outputBuiltinFilters.falsy();
        expect(filter(true)).toBe(false);
        expect(filter(1)).toBe(false);
        expect(filter("hello")).toBe(false);
        expect(filter([])).toBe(false);
        expect(filter({})).toBe(false);
      });
    });

    describe("truthy filter", () => {
      test("should return true for truthy values", () => {
        const filter = outputBuiltinFilters.truthy();
        expect(filter(true)).toBe(true);
        expect(filter(1)).toBe(true);
        expect(filter("hello")).toBe(true);
        expect(filter([])).toBe(true);
        expect(filter({})).toBe(true);
      });

      test("should return false for falsy values", () => {
        const filter = outputBuiltinFilters.truthy();
        expect(filter(false)).toBe(false);
        expect(filter(null)).toBe(false);
        expect(filter(undefined)).toBe(false);
        expect(filter(0)).toBe(false);
        expect(filter("")).toBe(false);
        expect(filter(NaN)).toBe(false);
      });
    });

    describe("defaults filter", () => {
      test("should return default value for falsy inputs", () => {
        const filter = outputBuiltinFilters.defaults(["N/A"]);
        expect(filter(false)).toBe("N/A");
        expect(filter(null)).toBe("N/A");
        expect(filter(undefined)).toBe("N/A");
        expect(filter(0)).toBe("N/A");
        expect(filter("")).toBe("N/A");
        expect(filter(NaN)).toBe("N/A");
      });

      test("should return original value for truthy inputs", () => {
        const filter = outputBuiltinFilters.defaults(["N/A"]);
        expect(filter(true)).toBe(true);
        expect(filter(1)).toBe(1);
        expect(filter("hello")).toBe("hello");
        expect(filter([])).toEqual([]);
      });

      test("should throw error when no default provided", () => {
        expect(() => outputBuiltinFilters.defaults()).toThrow("defaults requires at least one option");
      });
    });
  });

  describe("Module exports", () => {
    test("should export outputBuiltinFilters and inputBuiltinFilters as same object", () => {
      expect(outputBuiltinFilters).toBe(inputBuiltinFilters);
    });

    test("should include all expected filters", () => {
      const expectedFilters = [
        "eq", "ne", "not", "lt", "le", "gt", "ge", 
        "inc", "dec", "mul", "div", "fix", "locale",
        "uc", "lc", "cap", "trim", "slice", "substr", "pad", "rep", "rev",
        "int", "float", "round", "floor", "ceil", "percent",
        "date", "time", "datetime", "ymd", 
        "falsy", "truthy", "defaults", 
        "boolean", "number", "string", "null"
      ];

      expectedFilters.forEach(filterName => {
        expect(outputBuiltinFilters).toHaveProperty(filterName);
        expect(typeof outputBuiltinFilters[filterName]).toBe("function");
      });
    });
  });

  describe("builtinFilterFn utility", () => {
    test("should return filter function by name and options", () => {
      const filterFn = builtinFilterFn("uc", [])(outputBuiltinFilters);
      expect(filterFn("hello")).toBe("HELLO");
    });

    test("should handle options correctly", () => {
      const filterFn = builtinFilterFn("eq", ["test"])(outputBuiltinFilters);
      expect(filterFn("test")).toBe(true);
      expect(filterFn("other")).toBe(false);
    });

    test("should throw error for non-existent filter", () => {
      expect(() => builtinFilterFn("nonexistent", [])(outputBuiltinFilters))
  .toThrow("Filter not found: nonexistent");
    });

    test("should work with complex filters", () => {
      const padFilterFn = builtinFilterFn("pad", ["5", "*"])(outputBuiltinFilters);
      expect(padFilterFn("123")).toBe("**123");

      const roundFilterFn = builtinFilterFn("round", ["2"])(outputBuiltinFilters);
      expect(roundFilterFn(3.14159)).toBe(3.14);
    });
  });

  describe("Edge cases and error handling", () => {
    test("should handle empty strings properly", () => {
      expect(outputBuiltinFilters.uc()("")).toBe("");
      expect(outputBuiltinFilters.trim()("")).toBe("");
      expect(outputBuiltinFilters.rev()("")).toBe("");
    });

    test("should handle numeric edge cases", () => {
      expect(outputBuiltinFilters.inc(["0"])(5)).toBe(5);
      expect(outputBuiltinFilters.mul(["1"])(10)).toBe(10);
      expect(outputBuiltinFilters.div(["1"])(10)).toBe(10);
    });

    test("should handle type coercion consistently", () => {
      // String operations should convert to string
      expect(outputBuiltinFilters.uc()(123)).toBe("123");
      // Note: trim filter expects toString() to work, so null will throw
      expect(() => outputBuiltinFilters.trim()(null)).toThrow();
      
      // Numeric operations should validate number type
      const incFilter = outputBuiltinFilters.inc(["1"]);
      expect(() => incFilter("abc")).toThrow("inc requires a number value");
    });
  });
});