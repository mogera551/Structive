import { describe, it, expect } from "vitest";
import { createBindingNodeAttribute } from "../../../src/DataBinding/BindingNode/BindingNodeAttribute";
import { createBindingStub, createEngineStub, createRendererStub } from "../helpers/bindingNodeHarness";

describe("BindingNodeAttribute", () => {
  it("attr.src を反映（NaN/undefined/nullは空文字）", () => {
    const engine = createEngineStub();
    const img = document.createElement("img");
    const binding = createBindingStub(engine, img);

    binding.bindingState.getFilteredValue.mockReturnValue(undefined);
    const node = createBindingNodeAttribute("attr.src", [], [])(binding, img, engine.inputFilters);
    node.applyChange(createRendererStub());
    expect(img.getAttribute("src")).toBe("");

    binding.bindingState.getFilteredValue.mockReturnValue("/path.png");
    node.applyChange(createRendererStub());
    expect(img.getAttribute("src")).toBe("/path.png");
  });
});
