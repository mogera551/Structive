import { describe, it, expect, vi } from "vitest";
import { createBindingNodeProperty } from "../../src/DataBinding/BindingNode/BindingNodeProperty";
import { createBindingNodeAttribute } from "../../src/DataBinding/BindingNode/BindingNodeAttribute";
import { createBindingNodeClassName } from "../../src/DataBinding/BindingNode/BindingNodeClassName";
import { createBindingNodeClassList } from "../../src/DataBinding/BindingNode/BindingNodeClassList";
import { createBindingNodeStyle } from "../../src/DataBinding/BindingNode/BindingNodeStyle";
import { createBindingStub, createEngineStub, createRendererStub } from "./helpers/bindingNodeHarness";

describe("BindingNode basic props", () => {
  it("Property: value を反映", () => {
    const engine = createEngineStub();
    const input = document.createElement("input");
    const binding = createBindingStub(engine, input);

    // filteredValue が applyChange 時に 123 を返す
    binding.bindingState.getFilteredValue.mockReturnValue("123");

    const node = createBindingNodeProperty("value", [], [])(binding, input, engine.inputFilters);
    const renderer = createRendererStub({ readonlyState: {} });
    node.applyChange(renderer);
    expect((input as HTMLInputElement).value).toBe("123");
  });

  it("Attribute: attr.src を反映（NaN/undefined/nullは空文字）", () => {
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

  it("ClassName: booleanで add/remove", () => {
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

  it("ClassList: 配列から className 生成", () => {
    const engine = createEngineStub();
    const div = document.createElement("div");
    const binding = createBindingStub(engine, div);
    const node = createBindingNodeClassList("classList", [], [])(binding, div, engine.inputFilters);

    binding.bindingState.getFilteredValue.mockReturnValue(["a", "b", "c"]);
    node.applyChange(createRendererStub());
    expect(div.className).toBe("a b c");
  });

  it("Style: style.color を反映（nullは空文字）", () => {
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
