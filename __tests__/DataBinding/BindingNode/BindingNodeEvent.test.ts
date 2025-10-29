import { describe, it, expect, vi } from "vitest";
import { createBindingNodeEvent } from "../../../src/DataBinding/BindingNode/BindingNodeEvent";
import { createBindingStub, createEngineStub, createRendererStub } from "../helpers/bindingNodeHarness";
import * as UpdaterMod from "../../../src/Updater/Updater";

describe("BindingNodeEvent", () => {
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
    const ev = new Event("Click", { bubbles: true, cancelable: true });
    await (node as any).handler(ev);
    expect(handler).toHaveBeenCalled();
  });
});
