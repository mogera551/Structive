import { describe, it, expect } from "vitest";
import { createBindingNodeClassList } from "../../../src/DataBinding/BindingNode/BindingNodeClassList";
import { createBindingStub, createEngineStub, createRendererStub } from "../helpers/bindingNodeHarness";

describe("BindingNodeClassList", () => {
  it("配列から className 生成", () => {
    const engine = createEngineStub();
    const div = document.createElement("div");
    const binding = createBindingStub(engine, div);
    const node = createBindingNodeClassList("classList", [], [])(binding, div, engine.inputFilters);

    binding.bindingState.getFilteredValue.mockReturnValue(["a", "b", "c"]);
    node.applyChange(createRendererStub());
    expect(div.className).toBe("a b c");
  });

  it("assignValue: 非配列でエラー", () => {
    const engine = createEngineStub();
    const div = document.createElement("div");
    const binding = createBindingStub(engine, div);
    const node = createBindingNodeClassList("classList", [], [])(binding, div, engine.inputFilters);
    expect(() => node.assignValue("abc" as any)).toThrow(/Value is not array/);
  });
});
