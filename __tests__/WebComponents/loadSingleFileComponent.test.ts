/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";

const createSingleFileComponentMock = vi.fn(async (text:string) => ({ html: "<p>", css: "", stateClass: class {} }));
vi.mock("../../src/WebComponents/createSingleFileComponent", () => ({ createSingleFileComponent: (t:string) => createSingleFileComponentMock(t) }));

// fetch をモック
globalThis.fetch = vi.fn(async (url:string) => ({ text: async () => `// sfc from ${url}` })) as any;

// Vite SSR では import.meta が __vite_ssr_import_meta__ に変換されるため、ここで resolve をスタブ
(globalThis as any).__vite_ssr_import_meta__ = { resolve: (p:string) => p };
const { loadSingleFileComponent } = await import("../../src/WebComponents/loadSingleFileComponent");

describe("WebComponents/loadSingleFileComponent", () => {
  it("fetch -> text -> createSingleFileComponent の順で処理する", async () => {
    const data = await loadSingleFileComponent("/path/to/component.sfc");
    expect(fetch).toHaveBeenCalledWith("/path/to/component.sfc");
    expect(createSingleFileComponentMock).toHaveBeenCalledWith(expect.stringContaining("// sfc from /path/to/component.sfc"));
    expect(data.html).toBe("<p>");
  });
});
