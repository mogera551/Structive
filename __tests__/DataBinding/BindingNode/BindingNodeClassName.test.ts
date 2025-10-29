import { describe, it, expect } from "vitest";
import { createBindingNodeClassName } from "../../../src/DataBinding/BindingNode/BindingNodeClassName";
import { createBindingStub, createEngineStub, createRendererStub } from "../helpers/bindingNodeHarness";

describe("BindingNodeClassName", () => {
  it("booleanで add/remove", () => {
    const engine = createEngineStub();
    const div = document.createElement("div");
    const binding = createBindingStub(engine, div);
    const node = createBindingNodeClassName("class.active", [], [])(binding, div, engine.inputFilters);

    binding.bindingState.getFilteredValue.mockReturnValue(true);
    node.applyChange(createRendererStub());
    expect(div.classList.contains("active")).toBe(true);

    binding.bindingState.getFilteredValue.mockReturnValue(false);
    node.applyChange(createRendererStub());
    expect(div.classList.contains("active")).toBe(false);
  });

  it("assignValue: boolean 以外でエラー", () => {
    const engine = createEngineStub();
    const div = document.createElement("div");
    const binding = createBindingStub(engine, div);
    const node = createBindingNodeClassName("class.active", [], [])(binding, div, engine.inputFilters);
    expect(() => node.assignValue("true" as any)).toThrow(/Value is not boolean/);
  });
});
