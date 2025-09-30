import { describe, it, expect } from "vitest";
import { createBindingNodeCheckbox } from "../../src/DataBinding/BindingNode/BindingNodeCheckbox";
import { createBindingNodeClassList } from "../../src/DataBinding/BindingNode/BindingNodeClassList";
import { createBindingNodeClassName } from "../../src/DataBinding/BindingNode/BindingNodeClassName";
import { BindingNodeBlock } from "../../src/DataBinding/BindingNode/BindingNodeBlock";
import { createBindingNodeIf } from "../../src/DataBinding/BindingNode/BindingNodeIf";
import { COMMENT_TEMPLATE_MARK } from "../../src/constants";
import { createBindingStub, createEngineStub, createRendererStub } from "./helpers/bindingNodeHarness";
import { registerTemplate } from "../../src/Template/registerTemplate";

/**
 * 低下していた分岐のカバレッジを補うための追加テスト
 */
describe("BindingNode additional coverage", () => {
  const ensureTemplate1 = () => {
    const tpl = document.createElement("template");
    // 中身は空でOK（BindContent は空配列の bindings を許容）
    registerTemplate(1, tpl, 1);
  };
  it("BindingNodeBlock: invalid node でエラー", () => {
    const engine = createEngineStub();
    const binding = createBindingStub(engine, {} as any);
    const fakeNode = {} as unknown as Node; // textContent が undefined の Node 擬似体
    expect(() => new (BindingNodeBlock as any)(binding, fakeNode, "block", [], [])).toThrow("Invalid node");
  });

  it("Checkbox: 非配列でエラー", () => {
    const engine = createEngineStub();
    const input = document.createElement("input");
    input.type = "checkbox";
    const binding = createBindingStub(engine, input);
    const node = createBindingNodeCheckbox("checked", [], [])(binding, input, engine.inputFilters);
    expect(() => node.assignValue(123 as any)).toThrow(/Value is not array/);
  });

  it("ClassList: 非配列でエラー", () => {
    const engine = createEngineStub();
    const div = document.createElement("div");
    const binding = createBindingStub(engine, div);
    const node = createBindingNodeClassList("classList", [], [])(binding, div, engine.inputFilters);
    expect(() => node.assignValue("abc" as any)).toThrow(/Value is not array/);
  });

  it("ClassName: boolean 以外でエラー", () => {
    const engine = createEngineStub();
    const div = document.createElement("div");
    const binding = createBindingStub(engine, div);
    const node = createBindingNodeClassName("class.active", [], [])(binding, div, engine.inputFilters);
    expect(() => node.assignValue("true" as any)).toThrow(/Value is not boolean/);
  });

  it("If: assignValue は未実装エラー", () => {
    ensureTemplate1();
    const engine = createEngineStub();
    const comment = document.createComment(`${COMMENT_TEMPLATE_MARK}1`);
    const binding = createBindingStub(engine, comment);
    const node = createBindingNodeIf("if", [], [])(binding, comment, engine.inputFilters);
    expect(() => node.assignValue(true)).toThrow(/Not implemented/i);
  });

  it("If: parentNode が null だとエラー", () => {
    ensureTemplate1();
    const engine = createEngineStub();
    const comment = document.createComment(`${COMMENT_TEMPLATE_MARK}1`);
    const binding = createBindingStub(engine, comment);
    const node = createBindingNodeIf("if", [], [])(binding, comment, engine.inputFilters);
    binding.bindingState.getFilteredValue.mockReturnValue(true);
    expect(() => node.applyChange(createRendererStub())).toThrow(/ParentNode is null/);
  });

  it("If: 値が boolean でないとエラー", () => {
    ensureTemplate1();
    const engine = createEngineStub();
    const parent = document.createElement("div");
    const comment = document.createComment(`${COMMENT_TEMPLATE_MARK}1`);
    parent.appendChild(comment);
    const binding = createBindingStub(engine, comment);
    const node = createBindingNodeIf("if", [], [])(binding, comment, engine.inputFilters);
    binding.bindingState.getFilteredValue.mockReturnValue(123);
    expect(() => node.applyChange(createRendererStub({ readonlyState: {} }))).toThrow(/Value is not boolean/);
  });

  it("If: false 分岐で unmount まで到達", () => {
    ensureTemplate1();
    const engine = createEngineStub();
    const parent = document.createElement("div");
    const comment = document.createComment(`${COMMENT_TEMPLATE_MARK}1`);
    parent.appendChild(comment);
    const binding = createBindingStub(engine, comment);
    const node = createBindingNodeIf("if", [], [])(binding, comment, engine.inputFilters);
    binding.bindingState.getFilteredValue.mockReturnValue(false);
    // 例外が出ないことのみ確認（unmount 分岐の通過を狙う）
    node.applyChange(createRendererStub({ readonlyState: {} }));
  });
});
