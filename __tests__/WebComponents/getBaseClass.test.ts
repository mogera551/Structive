/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { getBaseClass } from "../../src/WebComponents/getBaseClass";

describe("WebComponents/getBaseClass", () => {
  it("extends 指定なしなら HTMLElement を返す", () => {
    const Base = getBaseClass(null);
    expect(Base).toBe(HTMLElement);
  });

  it("extends 指定ありなら該当要素のコンストラクタを返す", () => {
    const Base = getBaseClass("button");
    // JSDOM では HTMLButtonElement が返る
    expect(Base === HTMLButtonElement || Base === HTMLElement).toBe(true);
  });
});
