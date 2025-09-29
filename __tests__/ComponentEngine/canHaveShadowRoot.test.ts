import { describe, it, expect, vi } from "vitest";
import { canHaveShadowRoot } from "../../src/ComponentEngine/canHaveShadowRoot";

describe("canHaveShadowRoot", () => {
  it("有効なタグ（div）は true になる (環境が attachShadow 対応のとき)", () => {
    const result = canHaveShadowRoot("div");
    // 実環境に依存するが、JSDOM では attachShadow が存在するため true を期待
    expect(typeof (document.createElement("div") as any).attachShadow === "function" ? result : true).toBe(true);
  });

  it("attachShadow 未実装のタグ風に見せた場合は false", () => {
    const origCreate = document.createElement.bind(document);
    const fake = document.createElement("div") as any;
    const original = fake.attachShadow;
    fake.attachShadow = undefined; // 未実装に偽装
    // createElement をスタブして、常に attachShadow のない要素を返す
    (document as any).createElement = vi.fn(() => fake);
    try {
      expect(canHaveShadowRoot("div")).toBe(false);
    } finally {
      (document as any).createElement = origCreate;
      fake.attachShadow = original;
    }
  });

  it("無効タグ名は false を返す (例外パス)", () => {
    expect(canHaveShadowRoot("<invalid>" as any)).toBe(false);
  });
});
