import { describe, it, expect } from "vitest";
import { createBindingNodeRadio } from "../../../src/DataBinding/BindingNode/BindingNodeRadio";
import { createBindingStub, createEngineStub, createRendererStub } from "../helpers/bindingNodeHarness";

describe("BindingNodeRadio", () => {
  it("値一致で checked", () => {
    const engine = createEngineStub();
    const input = document.createElement("input");
    input.type = "radio";
    input.value = "A";
    const binding = createBindingStub(engine, input);

    const node = createBindingNodeRadio("checked", [], [])(binding, input, engine.inputFilters);
    binding.bindingState.getFilteredValue.mockReturnValue("A");
    node.applyChange(createRendererStub());
    expect(input.checked).toBe(true);

    binding.bindingState.getFilteredValue.mockReturnValue("B");
    node.applyChange(createRendererStub());
    expect(input.checked).toBe(false);
  });
});
