/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const entryRouteMock = vi.fn();
vi.mock("../../src/Router/Router", () => ({ entryRoute: (...args:any[]) => entryRouteMock(...args) }));

const createComponentClassMock = vi.fn((d:any) => ({ define: vi.fn() } as any));
vi.mock("../../src/WebComponents/createComponentClass", () => ({ createComponentClass: (d:any) => createComponentClassMock(d) }));

const loadImportmapMock = vi.fn();
vi.mock("../../src/WebComponents/loadImportmap", () => ({ loadImportmap: () => loadImportmapMock() }));

const loadSingleFileComponentMock = vi.fn(async (alias:string) => ({ html: "<div>", css: "", stateClass: class {} }));
vi.mock("../../src/WebComponents/loadSingleFileComponent", () => ({ loadSingleFileComponent: (a:string) => loadSingleFileComponentMock(a) }));

const registerComponentClassMock = vi.fn();
vi.mock("../../src/WebComponents/registerComponentClass", () => ({ registerComponentClass: (t:string, c:any) => registerComponentClassMock(t, c) }));

import { loadFromImportMap, hasLazyLoadComponents, isLazyLoadComponent, loadLazyLoadComponent } from "../../src/WebComponents/loadFromImportMap";

describe("WebComponents/loadFromImportMap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("routes と components を登録し、lazy は遅延保持する", async () => {
    loadImportmapMock.mockReturnValue({
      imports: {
        "@routes//root": "/root",
        "@routes//users/:id": "/users/:id",
        "@components/x-foo": "/x/foo.js",
        "@components/x-bar#lazy": "/x/bar.js",
      },
    });

    await loadFromImportMap();

  // routes 登録（実装仕様に合わせ、先頭スラッシュ重複やハイフンも許容）
  expect(entryRouteMock).toHaveBeenCalledWith("routes--root", "//root");
  expect(entryRouteMock).toHaveBeenCalledWith("routes--users-", "//users/:id");

    // 非 lazy は即登録
    expect(loadSingleFileComponentMock).toHaveBeenCalledWith("@components/x-foo");
    expect(createComponentClassMock).toHaveBeenCalled();
    expect(registerComponentClassMock).toHaveBeenCalledWith("x-foo", expect.anything());

    // lazy は保持され、isLazyLoadComponent が true
    expect(hasLazyLoadComponents()).toBe(true);
    expect(isLazyLoadComponent("x-bar")).toBe(true);
  });

  it("loadLazyLoadComponent で遅延分を登録し、その後は isLazyLoadComponent が false", async () => {
    loadImportmapMock.mockReturnValue({ imports: { "@components/x-baz#lazy": "/x/baz.js" } });
    await loadFromImportMap();
    expect(isLazyLoadComponent("x-baz")).toBe(true);

    // 実際の登録は queueMicrotask で非同期
    loadLazyLoadComponent("x-baz");
    await Promise.resolve(); // microtask flush
    await Promise.resolve();

    expect(loadSingleFileComponentMock).toHaveBeenCalledWith("@components/x-baz#lazy");
    expect(registerComponentClassMock).toHaveBeenCalledWith("x-baz", expect.anything());
    expect(isLazyLoadComponent("x-baz")).toBe(false);
  });
});
