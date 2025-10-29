/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { connectedCallback } from "../../../src/StateClass/apis/connectedCallback";

describe("connectedCallback", () => {
  it("target に $connectedCallback があれば呼ぶ", async () => {
    const receiver = {} as any;
    const called = vi.fn();
    const target = { $connectedCallback: called } as any;
    await connectedCallback(target, "$connectedCallback", receiver, {} as any);
    expect(called).toHaveBeenCalled();
  });
});
