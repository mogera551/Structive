/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("WebComponents/register*", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("registerComponentClass は define を呼ぶ", async () => {
    const defineMock = vi.fn();
    const componentClass = { define: defineMock } as any;
    const { registerComponentClass } = await import("../../src/WebComponents/registerComponentClass");
    registerComponentClass("x-foo", componentClass);
    expect(defineMock).toHaveBeenCalledWith("x-foo");
  });

  it("registerComponentClasses は各 define を呼ぶ", async () => {
    const a = { define: vi.fn() } as any;
    const b = { define: vi.fn() } as any;
    const { registerComponentClasses } = await import("../../src/WebComponents/registerComponentClasses");
    registerComponentClasses({ "x-a": a, "x-b": b } as any);
    expect(a.define).toHaveBeenCalledWith("x-a");
    expect(b.define).toHaveBeenCalledWith("x-b");
  });
});
