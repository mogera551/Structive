import { describe, it, expect } from "vitest";
import { isVoidElement } from "../../src/ComponentEngine/isVoidElement";

describe("isVoidElement", () => {
  it("void 要素は true", () => {
    expect(isVoidElement("img")).toBe(true);
    expect(isVoidElement("input")).toBe(true);
    expect(isVoidElement("br")).toBe(true);
  });

  it("非 void 要素は false", () => {
    expect(isVoidElement("div")).toBe(false);
    expect(isVoidElement("span")).toBe(false);
    expect(isVoidElement("section")).toBe(false);
  });

  it("大文字でも正しく判定される", () => {
    expect(isVoidElement("IMG")).toBe(true);
    expect(isVoidElement("DIV")).toBe(false);
  });
});
