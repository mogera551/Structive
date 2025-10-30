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

let loadFromImportMap: typeof import("../../src/WebComponents/loadFromImportMap")["loadFromImportMap"];
let hasLazyLoadComponents: typeof import("../../src/WebComponents/loadFromImportMap")["hasLazyLoadComponents"];
let isLazyLoadComponent: typeof import("../../src/WebComponents/loadFromImportMap")["isLazyLoadComponent"];
let loadLazyLoadComponent: typeof import("../../src/WebComponents/loadFromImportMap")["loadLazyLoadComponent"];

describe("WebComponents/loadFromImportMap", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    ({ loadFromImportMap, hasLazyLoadComponents, isLazyLoadComponent, loadLazyLoadComponent } = await import("../../src/WebComponents/loadFromImportMap"));
  });

  it("未対応の alias は無視される", async () => {
    loadImportmapMock.mockReturnValue({ imports: { "misc": "/unused.js" } });
    await loadFromImportMap();

    expect(entryRouteMock).not.toHaveBeenCalled();
    expect(registerComponentClassMock).not.toHaveBeenCalled();
    expect(hasLazyLoadComponents()).toBe(false);
  });

  it("routes と components を登録し、lazy は遅延保持する", async () => {
    loadImportmapMock.mockReturnValue({
      imports: {
        "@routes/root": "/root",
        "@routes/users/:id": "/users/:id",
        "@routes/admin#lazy": "/admin",
        "@components/x-foo": "/x/foo.js",
        "@components/x-bar#lazy": "/x/bar.js",
      },
    });

    await loadFromImportMap();

    // routes 登録（ /root は / に正規化、パラメータは除去 ）
    expect(entryRouteMock).toHaveBeenCalledWith("routes-root", "/");
    expect(entryRouteMock).toHaveBeenCalledWith("routes-users-", "/users/:id");

    // 非 lazy は即登録
    expect(loadSingleFileComponentMock).toHaveBeenCalledWith("@components/x-foo");
    expect(createComponentClassMock).toHaveBeenCalled();
    expect(registerComponentClassMock).toHaveBeenCalledWith("x-foo", expect.anything());

    // lazy は保持され、isLazyLoadComponent が true
    expect(hasLazyLoadComponents()).toBe(true);
    expect(isLazyLoadComponent("x-bar")).toBe(true);
    expect(isLazyLoadComponent("routes-admin")).toBe(true);
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

  it("loadLazyLoadComponent: 未登録タグは warn して終了", async () => {
    loadImportmapMock.mockReturnValue({ imports: {} });
    await loadFromImportMap();

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    loadLazyLoadComponent("missing-tag");

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Alias not found"),
      expect.objectContaining({ code: "IMP-201", severity: "warn" })
    );
    expect(loadSingleFileComponentMock).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
