/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";

const entryRouteMock = vi.fn();
vi.mock("../../src/Router/Router", () => ({ entryRoute: (...a:any[]) => entryRouteMock(...a) }));
const loadMock = vi.fn(async () => ({ html: "<div>", css: "", stateClass: class {} }));
const createMock = vi.fn((_d:any) => ({ define: vi.fn() }));
const regMock = vi.fn();
vi.mock("../../src/WebComponents/loadSingleFileComponent", () => ({ loadSingleFileComponent: () => loadMock() }));
vi.mock("../../src/WebComponents/createComponentClass", () => ({ createComponentClass: (d:any) => createMock(d) }));
vi.mock("../../src/WebComponents/registerComponentClass", () => ({ registerComponentClass: (t:string, c:any) => regMock(t, c) }));

describe("WebComponents/registerSingleFileComponents", () => {
  it("routes を登録後に SFC を登録する", async () => {
    const { registerSingleFileComponents } = await import("../../src/WebComponents/registerSingleFIleComponents");
    await registerSingleFileComponents({ "routes/root": "@routes//root", "x-a": "/a.sfc" } as any);
    expect(entryRouteMock).toHaveBeenCalledWith("routes/root", "//root");
    expect(regMock).toHaveBeenCalledWith("x-a", expect.anything());
  });
});
