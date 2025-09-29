import { describe, it, expect, vi, beforeEach } from "vitest";
import { createBindingNodeCheckbox } from "../../src/DataBinding/BindingNode/BindingNodeCheckbox";
import { createBindingNodeRadio } from "../../src/DataBinding/BindingNode/BindingNodeRadio";
import { createBindingNodeEvent } from "../../src/DataBinding/BindingNode/BindingNodeEvent";
import { createBindingNodeIf } from "../../src/DataBinding/BindingNode/BindingNodeIf";
import { createBindingNodeFor } from "../../src/DataBinding/BindingNode/BindingNodeFor";
import { createBindingStub, createEngineStub, createRendererStub } from "./helpers/bindingNodeHarness";
import * as UpdaterMod from "../../src/Updater/Updater";
import * as registerTemplateMod from "../../src/Template/registerTemplate";
import * as registerAttrMod from "../../src/BindingBuilder/registerDataBindAttributes";

describe("BindingNode controls", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  it("Checkbox: 配列に value が含まれると checked", () => {
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

  it("Radio: 値一致で checked", () => {
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

  it("Event: onClick ハンドラが呼ばれる（preventDefault/stopPropagation）", async () => {
    const engine = createEngineStub();
    const button = document.createElement("button");
    const binding = createBindingStub(engine, button);
    const handler = vi.fn();
    // getValueを経由して関数を返すよう、bindingState側をモック
    binding.bindingState.getValue = vi.fn(() => handler);

    // Updater.update をスタブして、プロキシ生成を回避
    vi.spyOn(UpdaterMod, "update").mockImplementation(async (_engine: any, _lc: any, cb: any) => {
      await cb({} as any, {} as any);
    });

    const node = createBindingNodeEvent("onClick", [], ["preventDefault", "stopPropagation"]) (binding, button, engine.inputFilters);
    const ev = new Event("Click", { bubbles: true, cancelable: true });
    await (node as any).handler(ev);
    expect(handler).toHaveBeenCalled();
  });

  it("If: true でマウント、false でアンマウント", () => {
    const engine = createEngineStub();
    const comment = document.createComment("@@|100");
    const binding = createBindingStub(engine, comment);
    const container = document.createElement("div");
    container.appendChild(comment);

    // テンプレートと属性をスタブ（空のテンプレートでOK）
    const tpl = document.createElement("template");
    tpl.innerHTML = `<div>if-content</div>`;
    vi.spyOn(registerTemplateMod, "getTemplateById").mockReturnValue(tpl);
    vi.spyOn(registerAttrMod, "getDataBindAttributesById").mockReturnValue([] as any);

    // BindContent の生成に必要なテンプレート等は、既存のユニットにより網羅されているため
    // ここでは applyChange のDOM遷移のみを最小限検証する
    binding.bindingState.getFilteredValue.mockReturnValue(true);
    const node = createBindingNodeIf("if", [], [])(binding, comment, engine.inputFilters);
  const renderer1 = createRendererStub({ readonlyState: {} });
  node.applyChange(renderer1);
    expect(container.childNodes.length).toBeGreaterThan(1);

    binding.bindingState.getFilteredValue.mockReturnValue(false);
  const renderer2 = createRendererStub({ readonlyState: {} });
  node.applyChange(renderer2);
    // コメントのみ残る
    expect(container.childNodes.length).toBe(1);
  });

  it("For: newIndexesに応じたBindContentのマウント（最小限）", () => {
    const engine = createEngineStub();
    const comment = document.createComment("@@|200");
    const binding = createBindingStub(engine, comment);
    const container = document.createElement("div");
    container.appendChild(comment);

    // テンプレートと属性をスタブ
    const tpl = document.createElement("template");
    tpl.innerHTML = `<div>for-content</div>`;
    vi.spyOn(registerTemplateMod, "getTemplateById").mockReturnValue(tpl);
    vi.spyOn(registerAttrMod, "getDataBindAttributesById").mockReturnValue([] as any);

    // renderer.calcListDiff が返すダミー差分
    const indexes = [{ index: 0 } as any, { index: 1 } as any];
    const listDiff = {
      oldListValue: [],
      newListValue: [{}, {}],
      newIndexes: indexes,
      adds: new Set(indexes),
      removes: new Set(),
    } as any;
    const renderer = createRendererStub({
      readonlyState: {},
      calcListDiff: vi.fn(() => listDiff),
    });

    const node = createBindingNodeFor("for", [], [])(binding, comment, engine.inputFilters);
    node.applyChange(renderer);
    // コメント + 2要素（BindContent展開）
    expect(container.childNodes.length).toBeGreaterThan(1);
  });
});
