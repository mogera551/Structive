/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";

const loadMock = vi.fn(async () => ({ html: "<div>", css: "", stateClass: class {} }));
const createMock = vi.fn((_d:any) => ({ define: vi.fn() }));
const regMock = vi.fn();
vi.mock("../../src/WebComponents/loadSingleFileComponent", () => ({ loadSingleFileComponent: () => loadMock() }));
vi.mock("../../src/WebComponents/createComponentClass", () => ({ createComponentClass: (d:any) => createMock(d) }));
vi.mock("../../src/WebComponents/registerComponentClass", () => ({ registerComponentClass: (t:string, c:any) => regMock(t, c) }));

describe("WebComponents/registerSingleFileComponent", () => {
  it("load -> create -> register の順で呼ばれる", async () => {
    const { registerSingleFileComponent } = await import("../../src/WebComponents/registerSingleFileComponent");
    await registerSingleFileComponent("x-foo", "/foo.sfc");
    expect(loadMock).toHaveBeenCalled();
    expect(createMock).toHaveBeenCalled();
    expect(regMock).toHaveBeenCalledWith("x-foo", expect.anything());
  });
});
