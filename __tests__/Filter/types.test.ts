/**
 * @vitest-environment jsdom
 */
import { describe, test, expect } from "vitest";
import type { 
  FilterFn, 
  FilterWithOptionsFn, 
  FilterWithOptions, 
  Filters, 
  FilterFnByBuiltinFiltersFn,
  FilterFnByBuiltinFiltersFnByNameAndOptions
} from "../../src/Filter/types";

describe("Filter/types", () => {
  describe("FilterFn type", () => {
    test("should accept function that takes any value and returns any value", () => {
      const filterFn: FilterFn = (value: any) => value.toString();
      
      expect(typeof filterFn).toBe("function");
      expect(filterFn(123)).toBe("123");
      expect(filterFn("hello")).toBe("hello");
      expect(filterFn(true)).toBe("true");
    });

    test("should work with various return types", () => {
      const stringFilter: FilterFn = (value: any) => String(value);
      const numberFilter: FilterFn = (value: any) => Number(value);
      const booleanFilter: FilterFn = (value: any) => Boolean(value);
      
      expect(stringFilter(123)).toBe("123");
      expect(numberFilter("456")).toBe(456);
      expect(booleanFilter(0)).toBe(false);
    });

    test("should handle null and undefined values", () => {
      const nullSafeFilter: FilterFn = (value: any) => value ?? "default";
      
      expect(nullSafeFilter(null)).toBe("default");
      expect(nullSafeFilter(undefined)).toBe("default");
      expect(nullSafeFilter("value")).toBe("value");
    });
  });

  describe("FilterWithOptionsFn type", () => {
    test("should accept function that takes optional string array and returns FilterFn", () => {
      const filterWithOptions: FilterWithOptionsFn = (options?: string[]) => {
        const defaultValue = options?.[0] ?? "default";
        return (value: any) => value ?? defaultValue;
      };
      
      expect(typeof filterWithOptions).toBe("function");
      
      const filter1 = filterWithOptions();
      expect(filter1(null)).toBe("default");
      
      const filter2 = filterWithOptions(["custom"]);
      expect(filter2(null)).toBe("custom");
    });

    test("should handle multiple options", () => {
      const padFilter: FilterWithOptionsFn = (options?: string[]) => {
        const length = Number(options?.[0] ?? 0);
        const padChar = options?.[1] ?? "0";
        return (value: any) => String(value).padStart(length, padChar);
      };
      
      const filter = padFilter(["5", "*"]);
      expect(filter("123")).toBe("**123");
    });

    test("should work without options", () => {
      const simpleFilter: FilterWithOptionsFn = (options?: string[]) => {
        return (value: any) => value.toString().toUpperCase();
      };
      
      const filter = simpleFilter();
      expect(filter("hello")).toBe("HELLO");
    });
  });

  describe("FilterWithOptions type", () => {
    test("should accept record of filter names to FilterWithOptionsFn", () => {
      const filters: FilterWithOptions = {
        upper: (options?: string[]) => (value: any) => value.toString().toUpperCase(),
        lower: (options?: string[]) => (value: any) => value.toString().toLowerCase(),
        default: (options?: string[]) => {
          const defaultValue = options?.[0] ?? "";
          return (value: any) => value ?? defaultValue;
        }
      };
      
      expect(typeof filters.upper).toBe("function");
      expect(typeof filters.lower).toBe("function");
      expect(typeof filters.default).toBe("function");
      
      expect(filters.upper()("hello")).toBe("HELLO");
      expect(filters.lower()("WORLD")).toBe("world");
      expect(filters.default(["N/A"])(null)).toBe("N/A");
    });

    test("should support dynamic filter names", () => {
      const filterName = "customFilter";
      const filters: FilterWithOptions = {
        [filterName]: (options?: string[]) => (value: any) => `custom: ${value}`
      };
      
      expect(filters.customFilter()("test")).toBe("custom: test");
    });
  });

  describe("Filters type", () => {
    test("should accept array of FilterFn", () => {
      const filters: Filters = [
        (value: any) => value.toString(),
        (value: any) => value.toUpperCase(),
        (value: any) => value.trim()
      ];
      
      expect(Array.isArray(filters)).toBe(true);
      expect(filters).toHaveLength(3);
      expect(typeof filters[0]).toBe("function");
      expect(typeof filters[1]).toBe("function");
      expect(typeof filters[2]).toBe("function");
    });

    test("should work with filter chain", () => {
      const filters: Filters = [
        (value: any) => value.toString(),
        (value: any) => value.toUpperCase(),
        (value: any) => `[${value}]`
      ];
      
      const result = filters.reduce((acc, filter) => filter(acc), "hello");
      expect(result).toBe("[HELLO]");
    });

    test("should handle empty filter array", () => {
      const filters: Filters = [];
      
      expect(Array.isArray(filters)).toBe(true);
      expect(filters).toHaveLength(0);
    });
  });

  describe("FilterFnByBuiltinFiltersFn type", () => {
    test("should accept function that takes FilterWithOptions and returns FilterFn", () => {
      const filterFnByBuiltinFilters: FilterFnByBuiltinFiltersFn = (filters: FilterWithOptions) => {
        const upperFilter = filters["upper"];
        if (!upperFilter) throw new Error("Filter not found");
        return upperFilter();
      };
      
      const mockFilters: FilterWithOptions = {
        upper: (options?: string[]) => (value: any) => value.toString().toUpperCase()
      };
      
      const resultFilter = filterFnByBuiltinFilters(mockFilters);
      expect(typeof resultFilter).toBe("function");
      expect(resultFilter("hello")).toBe("HELLO");
    });

    test("should handle missing filters", () => {
      const filterFnByBuiltinFilters: FilterFnByBuiltinFiltersFn = (filters: FilterWithOptions) => {
        const missingFilter = filters["nonexistent"];
        if (!missingFilter) {
          return (value: any) => value; // identity filter
        }
        return missingFilter();
      };
      
      const mockFilters: FilterWithOptions = {};
      
      const resultFilter = filterFnByBuiltinFilters(mockFilters);
      expect(resultFilter("test")).toBe("test");
    });
  });

  describe("FilterFnByBuiltinFiltersFnByNameAndOptions type", () => {
    test("should accept function that takes name and options and returns FilterFnByBuiltinFiltersFn", () => {
      const filterFnByNameAndOptions: FilterFnByBuiltinFiltersFnByNameAndOptions = 
        (name: string, options: string[]) => (filters: FilterWithOptions) => {
          const filter = filters[name];
          if (!filter) throw new Error(`Filter not found: ${name}`);
          return filter(options);
        };
      
      const mockFilters: FilterWithOptions = {
        pad: (options?: string[]) => {
          const length = Number(options?.[0] ?? 0);
          const char = options?.[1] ?? "0";
          return (value: any) => String(value).padStart(length, char);
        }
      };
      
      const filterGetter = filterFnByNameAndOptions("pad", ["5", "*"]);
      const filter = filterGetter(mockFilters);
      expect(filter("123")).toBe("**123");
    });

    test("should handle different filter names and options", () => {
      const filterFnByNameAndOptions: FilterFnByBuiltinFiltersFnByNameAndOptions = 
        (name: string, options: string[]) => (filters: FilterWithOptions) => {
          const filter = filters[name];
          if (!filter) throw new Error(`Filter not found: ${name}`);
          return filter(options);
        };
      
      const mockFilters: FilterWithOptions = {
        slice: (options?: string[]) => {
          const start = Number(options?.[0] ?? 0);
          return (value: any) => String(value).slice(start);
        },
        upper: (options?: string[]) => (value: any) => String(value).toUpperCase()
      };
      
      const sliceGetter = filterFnByNameAndOptions("slice", ["2"]);
      const sliceFilter = sliceGetter(mockFilters);
      expect(sliceFilter("hello")).toBe("llo");
      
      const upperGetter = filterFnByNameAndOptions("upper", []);
      const upperFilter = upperGetter(mockFilters);
      expect(upperFilter("hello")).toBe("HELLO");
    });

    test("should throw error for non-existent filter", () => {
      const filterFnByNameAndOptions: FilterFnByBuiltinFiltersFnByNameAndOptions = 
        (name: string, options: string[]) => (filters: FilterWithOptions) => {
          const filter = filters[name];
          if (!filter) throw new Error(`Filter not found: ${name}`);
          return filter(options);
        };
      
      const mockFilters: FilterWithOptions = {};
      
      const filterGetter = filterFnByNameAndOptions("nonexistent", []);
      expect(() => filterGetter(mockFilters)).toThrow("Filter not found: nonexistent");
    });
  });

  describe("Type integration", () => {
    test("should work together in a complete filter system", () => {
      // Define individual filters
      const upperCase: FilterWithOptionsFn = (options?: string[]) => 
        (value: any) => String(value).toUpperCase();
      
      const addPrefix: FilterWithOptionsFn = (options?: string[]) => {
        const prefix = options?.[0] ?? "";
        return (value: any) => `${prefix}${value}`;
      };
      
      // Create filter collection
      const filterCollection: FilterWithOptions = {
        upper: upperCase,
        prefix: addPrefix
      };
      
      // Create filter getter function
      const getFilter: FilterFnByBuiltinFiltersFnByNameAndOptions = 
        (name: string, options: string[]) => (filters: FilterWithOptions) => {
          const filter = filters[name];
          if (!filter) throw new Error(`Filter not found: ${name}`);
          return filter(options);
        };
      
      // Use the system
      const upperFilter = getFilter("upper", [])(filterCollection);
      const prefixFilter = getFilter("prefix", [">> "])(filterCollection);
      
      expect(upperFilter("hello")).toBe("HELLO");
      expect(prefixFilter("world")).toBe(">> world");
      
      // Create filter chain
      const filterChain: Filters = [upperFilter, prefixFilter];
      const result = filterChain.reduce((acc, filter) => filter(acc), "hello");
      expect(result).toBe(">> HELLO");
    });

    test("should handle complex filter scenarios", () => {
      const complexFilter: FilterWithOptionsFn = (options?: string[]) => {
        const operation = options?.[0] ?? "identity";
        const param = options?.[1] ?? "";
        
        return (value: any) => {
          switch (operation) {
            case "upper": return String(value).toUpperCase();
            case "lower": return String(value).toLowerCase();
            case "prefix": return `${param}${value}`;
            case "suffix": return `${value}${param}`;
            default: return value;
          }
        };
      };
      
      const filters: FilterWithOptions = {
        complex: complexFilter
      };
      
      const getComplexFilter = (operation: string, param?: string) => {
        const options = param ? [operation, param] : [operation];
        return filters.complex(options);
      };
      
      expect(getComplexFilter("upper")("hello")).toBe("HELLO");
      expect(getComplexFilter("prefix", ">> ")("world")).toBe(">> world");
      expect(getComplexFilter("suffix", " <<")("test")).toBe("test <<");
      expect(getComplexFilter("unknown")("value")).toBe("value");
    });
  });
});