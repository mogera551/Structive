import { describe, it, expect } from "vitest";
import { createBindingNodeStyle } from "../../../src/DataBinding/BindingNode/BindingNodeStyle";
import { createBindingStub, createEngineStub, createRendererStub } from "../helpers/bindingNodeHarness";

describe("BindingNodeStyle", () => {
  it("style.color を反映（nullは空文字）", () => {
    const engine = createEngineStub();
    const div = document.createElement("div");
    const binding = createBindingStub(engine, div);
    const node = createBindingNodeStyle("style.color", [], [])(binding, div, engine.inputFilters);

    binding.bindingState.getFilteredValue.mockReturnValue(null);
    node.applyChange(createRendererStub());
    expect(div.style.color).toBe("");

    binding.bindingState.getFilteredValue.mockReturnValue("red");
    node.applyChange(createRendererStub());
    expect(div.style.color).toBe("red");
  });
});
