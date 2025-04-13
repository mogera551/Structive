// tests/path-utils.test.ts
import { describe, it, expect } from "vitest";
import { resolvePath } from "../src/utils/path";

describe("resolvePath", () => {
  it("resolves a simple path", () => {
    const state = { user: { name: "Alice" } };
    expect(resolvePath(state, "user.name", [])).toBe("Alice");
  });

  it("resolves a wildcard path with one index", () => {
    const state = { list: [{ value: 10 }, { value: 20 }] };
    expect(resolvePath(state, "list.*.value", [1])).toBe(20);
  });

  it("resolves a nested wildcard path", () => {
    const state = {
      regions: [
        { prefectures: [{ name: "A" }, { name: "B" }] },
        { prefectures: [{ name: "C" }, { name: "D" }] }
      ]
    };
    expect(resolvePath(state, "regions.*.prefectures.*.name", [1, 0])).toBe("C");
  });

  it("returns undefined for invalid index", () => {
    const state = { list: [{ value: 10 }] };
    expect(resolvePath(state, "list.*.value", [5])).toBeUndefined();
  });
});
