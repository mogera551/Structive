import { describe, it, expect, beforeEach } from "vitest";
import { createBindingNodeCheckbox } from "../../../src/DataBinding/BindingNode/BindingNodeCheckbox";
import { createBindingStub, createEngineStub, createRendererStub } from "../helpers/bindingNodeHarness";

describe("BindingNodeCheckbox", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("配列に value が含まれると checked", () => {
    const engine = createEngineStub();
    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = "2";
    const binding = createBindingStub(engine, input);

    const node = createBindingNodeCheckbox("checked", [], [])(binding, input, engine.inputFilters);
    binding.bindingState.getFilteredValue.mockReturnValue([1, 2, 3]);
    node.applyChange(createRendererStub());
    expect(input.checked).toBe(true);

    binding.bindingState.getFilteredValue.mockReturnValue([1, 3]);
    node.applyChange(createRendererStub());
    expect(input.checked).toBe(false);
  });

  it("assignValue: 非配列でエラー", () => {
    const engine = createEngineStub();
    const input = document.createElement("input");
    input.type = "checkbox";
    const binding = createBindingStub(engine, input);
    const node = createBindingNodeCheckbox("checked", [], [])(binding, input, engine.inputFilters);
    expect(() => node.assignValue(123 as any)).toThrow(/Value is not array/);
  });
});
