/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const entryRouteMock = vi.fn();
vi.mock("../../src/Router/Router", () => ({ entryRoute: (...a:any[]) => entryRouteMock(...a) }));
const loadMock = vi.fn(async (_path?: string) => ({ html: "<div>", css: "", stateClass: class {} }));
const createMock = vi.fn((_d:any) => ({ define: vi.fn() }));
const regMock = vi.fn();
vi.mock("../../src/WebComponents/loadSingleFileComponent", () => ({ loadSingleFileComponent: (path:string) => loadMock(path) }));
vi.mock("../../src/WebComponents/createComponentClass", () => ({ createComponentClass: (d:any) => createMock(d) }));
vi.mock("../../src/WebComponents/registerComponentClass", () => ({ registerComponentClass: (t:string, c:any) => regMock(t, c) }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe("WebComponents/registerSingleFileComponents", () => {
  it("routes を登録後に SFC を登録する", async () => {
    const { config } = await import("../../src/WebComponents/getGlobalConfig");
    config.enableRouter = true;
    const { registerSingleFileComponents } = await import("../../src/WebComponents/registerSingleFIleComponents");
    await registerSingleFileComponents({
      "routes/root": "@routes/root",
      "routes/users": "@routes/users",
      "x-a": "/a.sfc",
    } as any);

    expect(entryRouteMock).toHaveBeenCalledWith("routes/root", "/");
    expect(entryRouteMock).toHaveBeenCalledWith("routes/users", "/users");
    expect(loadMock).toHaveBeenCalledTimes(3);
    expect(regMock).toHaveBeenCalledWith("x-a", expect.anything());
  });

  it("enableRouter=false では entryRoute を呼ばない", async () => {
    const { config } = await import("../../src/WebComponents/getGlobalConfig");
    config.enableRouter = false;
    const { registerSingleFileComponents } = await import("../../src/WebComponents/registerSingleFIleComponents");
    await registerSingleFileComponents({ "x-b": "/b.sfc" } as any);

    expect(entryRouteMock).not.toHaveBeenCalled();
    expect(loadMock).toHaveBeenCalledWith("/b.sfc");
  });
});
