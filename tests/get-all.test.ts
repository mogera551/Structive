// tests/get-all.test.ts
import { describe, it, expect } from "vitest";
import { getAll } from "../src/utils/path";

describe("getAll", () => {
  it("collects from simple list", () => {
    const state = { list: [{ value: 1 }, { value: 2 }, { value: 3 }] };
    const result = getAll(state, "list.*.value");
    expect(result).toEqual([1, 2, 3]);
  });

  it("collects from nested structure", () => {
    const state = {
      regions: [
        { prefectures: [{ pop: 10 }, { pop: 20 }] },
        { prefectures: [{ pop: 30 }, { pop: 40 }] }
      ]
    };
    expect(getAll(state, "regions.*.prefectures.*.pop")).toEqual([10, 20, 30, 40]);
    expect(getAll(state, "regions.*.prefectures.*.pop", [0])).toEqual([10, 20]);
    expect(getAll(state, "regions.*.prefectures.*.pop", [0, 1])).toEqual([20]);
  });

  it("returns empty array if wildcard not found", () => {
    const state = { list: null };
    const result = getAll(state, "list.*.value");
    expect(result).toEqual([]);
  });

  it("returns single value when no wildcard", () => {
    const state = { item: { name: "X" } };
    const result = getAll(state, "item.name");
    expect(result).toEqual(["X"]);
  });
});