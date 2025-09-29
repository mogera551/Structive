/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { findStructiveParent, registerStructiveComponent } from "../../src/WebComponents/findStructiveParent";

describe("WebComponents/findStructiveParent", () => {
  it("登録前は null を返す", () => {
    const child = {} as any;
    expect(findStructiveParent(child)).toBeNull();
  });

  it("registerStructiveComponent 後に親が取得できる", () => {
    const parent = { name: "parent" } as any;
    const child = { name: "child" } as any;
    registerStructiveComponent(parent, child);
    expect(findStructiveParent(child)).toBe(parent);
  });
});
