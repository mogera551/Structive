/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { disconnectedCallback } from "../../../src/StateClass/apis/disconnectedCallback";

describe("disconnectedCallback", () => {
  it("target に $disconnectedCallback があれば呼ぶ", async () => {
    const receiver = {} as any;
    const called = vi.fn();
    const target = { $disconnectedCallback: called } as any;
    await disconnectedCallback(target, "$disconnectedCallback", receiver, {} as any);
    expect(called).toHaveBeenCalled();
  });
});
