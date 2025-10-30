/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const createSingleFileComponentMock = vi.fn(async (text:string) => ({ html: "<p>", css: "", stateClass: class {} }));
vi.mock("../../src/WebComponents/createSingleFileComponent", () => ({ createSingleFileComponent: (t:string) => createSingleFileComponentMock(t) }));

// fetch をモック
const fetchMock = vi.fn(async (url:string) => ({ text: async () => `// sfc from ${url}` }));
globalThis.fetch = fetchMock as any;

let loadSingleFileComponent: typeof import("../../src/WebComponents/loadSingleFileComponent")['loadSingleFileComponent'];
let nativeResolve: ((path: string) => string) | undefined;

describe("WebComponents/loadSingleFileComponent", () => {
  beforeEach(async () => {
    vi.resetModules();
    fetchMock.mockClear();
    fetchMock.mockImplementation(async (url:string) => ({ text: async () => `// sfc from ${url}` }));
    createSingleFileComponentMock.mockClear();
    nativeResolve = (import.meta as any).resolve?.bind(import.meta);
    (globalThis as any).__vite_ssr_import_meta__ = nativeResolve ? { resolve: nativeResolve } : {};
    ({ loadSingleFileComponent } = await import("../../src/WebComponents/loadSingleFileComponent"));
  });

  it("fetch -> text -> createSingleFileComponent の順で処理する", async () => {
    const path = "/path/to/component.sfc";
    const expectedResolved = nativeResolve ? nativeResolve(path) : path;
    const data = await loadSingleFileComponent(path);
    expect(fetch).toHaveBeenCalledWith(expectedResolved);
    expect(createSingleFileComponentMock).toHaveBeenCalledWith(expect.stringContaining(`// sfc from ${expectedResolved}`));
    expect(data.html).toBe("<p>");
  });
});
