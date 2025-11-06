import { describe, it, expect, vi, beforeEach } from "vitest";
import { createBindingNodeIf } from "../../../src/DataBinding/BindingNode/BindingNodeIf";
import { createBindingStub, createEngineStub, createRendererStub } from "../helpers/bindingNodeHarness";
import * as registerTemplateMod from "../../../src/Template/registerTemplate";
import * as registerAttrMod from "../../../src/BindingBuilder/registerDataBindAttributes";
import { COMMENT_TEMPLATE_MARK } from "../../../src/constants";

function ensureTemplate(id: number, html = `<div>if-content</div>`) {
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  vi.spyOn(registerTemplateMod, "getTemplateById").mockReturnValue(tpl);
  vi.spyOn(registerAttrMod, "getDataBindAttributesById").mockReturnValue([] as any);
}

describe("BindingNodeIf", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("true でマウント、false でアンマウント", () => {
    const engine = createEngineStub();
    const comment = document.createComment("@@|100");
    const binding = createBindingStub(engine, comment);
    const container = document.createElement("div");
    container.appendChild(comment);

    ensureTemplate(100, `<div>if-content</div>`);

    binding.bindingState.getFilteredValue.mockReturnValue(true);
    const node = createBindingNodeIf("if", [], [])(binding, comment, engine.inputFilters);
    const renderer1 = createRendererStub({ readonlyState: {} });
    node.applyChange(renderer1);
    expect(container.childNodes.length).toBeGreaterThan(1);

    binding.bindingState.getFilteredValue.mockReturnValue(false);
    const renderer2 = createRendererStub({ readonlyState: {} });
    node.applyChange(renderer2);
    expect(container.childNodes.length).toBe(1);
  });

  it("assignValue は未実装エラー", () => {
    ensureTemplate(310, `<div>if-content</div>`);
    const engine = createEngineStub();
    const comment = document.createComment(`${COMMENT_TEMPLATE_MARK}310`);
    const binding = createBindingStub(engine, comment);
    const node = createBindingNodeIf("if", [], [])(binding, comment, engine.inputFilters);
    expect(() => node.assignValue(true)).toThrow(/Not implemented/i);
  });

  it("parentNode が null だとエラー", () => {
    ensureTemplate(400, `<div>if-content</div>`);
    const engine = createEngineStub();
    const comment = document.createComment(`${COMMENT_TEMPLATE_MARK}400`);
    const binding = createBindingStub(engine, comment);
    const node = createBindingNodeIf("if", [], [])(binding, comment, engine.inputFilters);
    binding.bindingState.getFilteredValue.mockReturnValue(true);
    expect(() => node.applyChange(createRendererStub())).toThrow(/ParentNode is null/);
  });

  it("値が boolean でないとエラー", () => {
    ensureTemplate(500, `<div>if-content</div>`);
    const engine = createEngineStub();
    const parent = document.createElement("div");
    const comment = document.createComment(`${COMMENT_TEMPLATE_MARK}500`);
    parent.appendChild(comment);
    const binding = createBindingStub(engine, comment);
    const node = createBindingNodeIf("if", [], [])(binding, comment, engine.inputFilters);
    binding.bindingState.getFilteredValue.mockReturnValue(123);
    expect(() => node.applyChange(createRendererStub({ readonlyState: {} }))).toThrow(/Value is not boolean/);
  });

  it("false 分岐で unmount まで到達", () => {
    ensureTemplate(600, `<div>if-content</div>`);
    const engine = createEngineStub();
    const parent = document.createElement("div");
    const comment = document.createComment(`${COMMENT_TEMPLATE_MARK}600`);
    parent.appendChild(comment);
    const binding = createBindingStub(engine, comment);
    const node = createBindingNodeIf("if", [], [])(binding, comment, engine.inputFilters);
    binding.bindingState.getFilteredValue.mockReturnValue(false);
    node.applyChange(createRendererStub({ readonlyState: {} }));
  });

  it("bindContents getter と updatedBindings は Binding 側で制御される", () => {
    ensureTemplate(700, `<div>if-content</div>`);
    const engine = createEngineStub();
    const parent = document.createElement("div");
    const comment = document.createComment(`${COMMENT_TEMPLATE_MARK}700`);
    parent.appendChild(comment);
    const binding = createBindingStub(engine, comment);
    const node = createBindingNodeIf("if", [], [])(binding, comment, engine.inputFilters);

    binding.bindingState.getFilteredValue.mockReturnValue(true);
    const renderer = createRendererStub({ readonlyState: {} });
    node.applyChange(renderer);
    expect(node.bindContents).toHaveLength(1);

    binding.bindingState.getFilteredValue.mockClear();
    const skipped = createRendererStub({ readonlyState: {}, updatedBindings: new Set([binding]) });
    node.applyChange(skipped);
    expect(binding.bindingState.getFilteredValue).toHaveBeenCalledTimes(1);
  });
});
