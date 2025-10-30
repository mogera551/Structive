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

  it("null/undefined/NaN は空文字に変換して比較する", () => {
    const engine = createEngineStub();
    const input = document.createElement("input");
    input.type = "radio";
    input.value = "";
    const binding = createBindingStub(engine, input);

    const node = createBindingNodeRadio("checked", [], [])(binding, input, engine.inputFilters);

    binding.bindingState.getFilteredValue.mockReturnValue(null);
    node.applyChange(createRendererStub());
    expect(input.checked).toBe(true);

    binding.bindingState.getFilteredValue.mockReturnValue(undefined);
    node.applyChange(createRendererStub());
    expect(input.checked).toBe(true);

    binding.bindingState.getFilteredValue.mockReturnValue(Number.NaN);
    node.applyChange(createRendererStub());
    expect(input.checked).toBe(true);
  });

  it("数値は文字列化して比較する", () => {
    const engine = createEngineStub();
    const input = document.createElement("input");
    input.type = "radio";
    input.value = "10";
    const binding = createBindingStub(engine, input);

    const node = createBindingNodeRadio("checked", [], [])(binding, input, engine.inputFilters);
    binding.bindingState.getFilteredValue.mockReturnValue(10);
    node.applyChange(createRendererStub());
    expect(input.checked).toBe(true);

    binding.bindingState.getFilteredValue.mockReturnValue(5);
    node.applyChange(createRendererStub());
    expect(input.checked).toBe(false);
  });
});
