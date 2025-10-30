import { describe, it, expect, vi, afterEach } from "vitest";
import { createBindingNodeEvent } from "../../../src/DataBinding/BindingNode/BindingNodeEvent";
import { createBindingStub, createEngineStub, createRendererStub } from "../helpers/bindingNodeHarness";
import * as UpdaterMod from "../../../src/Updater/Updater";
import * as UtilsMod from "../../../src/utils";

describe("BindingNodeEvent", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("onClick ハンドラが呼ばれる（preventDefault/stopPropagation）", async () => {
    const engine = createEngineStub();
    const button = document.createElement("button");
    const binding = createBindingStub(engine, button);
    const handler = vi.fn();
    binding.bindingState.getValue = vi.fn(() => handler);

    vi.spyOn(UpdaterMod, "createUpdater").mockImplementation(async (_engine: any, cb: any) => {
      const updater = {
        update: vi.fn(async (_loop: any, fn: any) => {
          await fn({} as any, {} as any);
        }),
      };
      await cb(updater);
    });

    const node = createBindingNodeEvent("onClick", [], ["preventDefault", "stopPropagation"])(binding, button, engine.inputFilters);
    const ev = new Event("click", { bubbles: true, cancelable: true });
    const preventSpy = vi.spyOn(ev, "preventDefault");
    const stopSpy = vi.spyOn(ev, "stopPropagation");
    await (node as any).handler(ev);
    expect(handler).toHaveBeenCalled();
    expect(preventSpy).toHaveBeenCalledTimes(1);
    expect(stopSpy).toHaveBeenCalledTimes(1);
  });

  it("ループコンテキストの index を引数として渡す", async () => {
    const engine = createEngineStub();
    const button = document.createElement("button");
    const binding = createBindingStub(engine, button);
    const handler = vi.fn();
    binding.bindingState.getValue = vi.fn(() => handler);
    const loopContext = {
      serialize: vi.fn(() => [
        { listIndex: { index: 2 } },
        { listIndex: { index: 5 } },
      ]),
    };
    binding.parentBindContent.currentLoopContext = loopContext as any;

    const updateSpy = vi.fn(async (_loop: any, fn: any) => {
      await fn({} as any, {} as any);
    });
    vi.spyOn(UpdaterMod, "createUpdater").mockImplementation(async (_engine: any, cb: any) => {
      const updater = { update: updateSpy };
      await cb(updater);
    });

    const node = createBindingNodeEvent("onClick", [], [])(binding, button, engine.inputFilters);
    const ev = new Event("click", { bubbles: true, cancelable: true });
    await (node as any).handler(ev);
    expect(loopContext.serialize).toHaveBeenCalled();
    expect(updateSpy).toHaveBeenCalledWith(loopContext, expect.any(Function));
    expect(handler).toHaveBeenCalledWith(ev, 2, 5);
  });

  it("バインディング値が関数でない場合はエラー", async () => {
    const engine = createEngineStub();
    const button = document.createElement("button");
    const binding = createBindingStub(engine, button);
    binding.bindingState.getValue = vi.fn(() => 123);
    vi.spyOn(UtilsMod, "raiseError").mockImplementation(() => {
      throw new Error("BIND-201");
    });
    vi.spyOn(UpdaterMod, "createUpdater").mockImplementation(async (_engine: any, cb: any) => {
      const updater = {
        update: vi.fn(async (_loop: any, fn: any) => {
          await fn({} as any, {} as any);
        }),
      };
      await cb(updater);
    });

  const node = createBindingNodeEvent("onClick", [], [])(binding, button, engine.inputFilters);
  const ev = new Event("click", { bubbles: true, cancelable: true });
  await expect((node as any).handler(ev)).rejects.toThrow("BIND-201");
  });

  it("update/applyChange は no-op", () => {
    const engine = createEngineStub();
    const button = document.createElement("button");
    const binding = createBindingStub(engine, button);
    binding.bindingState.getValue = vi.fn(() => vi.fn());
    const node = createBindingNodeEvent("onClick", [], [])(binding, button, engine.inputFilters);
    expect(() => (node as any).update()).not.toThrow();
    expect(() => (node as any).applyChange(createRendererStub())).not.toThrow();
  });
});
