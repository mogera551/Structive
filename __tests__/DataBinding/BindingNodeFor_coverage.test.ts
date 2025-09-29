import { describe, it, expect, vi, beforeEach } from "vitest";
import { createBindingNodeFor } from "../../src/DataBinding/BindingNode/BindingNodeFor";
import { createBindingStub, createEngineStub, createRendererStub } from "./helpers/bindingNodeHarness";
import * as registerTemplateMod from "../../src/Template/registerTemplate";
import * as registerAttrMod from "../../src/BindingBuilder/registerDataBindAttributes";
import * as BindContentMod from "../../src/DataBinding/BindContent";
import * as GetStructuredPathInfoMod from "../../src/StateProperty/getStructuredPathInfo";

describe("BindingNodeFor coverage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  function setupTemplate() {
    const tpl = document.createElement("template");
    tpl.innerHTML = `<div>for-item</div>`;
    vi.spyOn(registerTemplateMod, "getTemplateById").mockReturnValue(tpl);
    vi.spyOn(registerAttrMod, "getDataBindAttributesById").mockReturnValue([] as any);
  }

  function createIndexes(n: number) {
    return Array.from({ length: n }, (_, i) => ({ index: i }) as any);
  }

  it("早期 return: updatedBindings に含まれると何もしない", () => {
    const engine = createEngineStub();
    const comment = document.createComment("@@|300");
    const binding = createBindingStub(engine, comment);
    const container = document.createElement("div");
    container.appendChild(comment);

    const node = createBindingNodeFor("for", [], [])(binding, comment, engine.inputFilters);
    const renderer = createRendererStub({
      updatedBindings: new Set([binding]),
      calcListDiff: vi.fn(),
      readonlyState: {},
    });
    node.applyChange(renderer);
    expect(renderer.calcListDiff).not.toHaveBeenCalled();
    expect(container.childNodes.length).toBe(1); // コメントのみ
  });

  it("全追加 -> 全削除最適化 -> プール再利用（createBindContent が増えない）", () => {
    setupTemplate();
    const spyCreate = vi.spyOn(BindContentMod, "createBindContent");

    const engine = createEngineStub();
    const comment = document.createComment("@@|301");
    const binding = createBindingStub(engine, comment);
    const container = document.createElement("div");
    container.appendChild(comment);

    const node = createBindingNodeFor("for", [], [])(binding, comment, engine.inputFilters);

    // 1) 全追加（2件）: DocumentFragment 経由
    const idxA = createIndexes(2);
    const listDiff1 = {
      oldListValue: [],
      newListValue: [{}, {}],
      newIndexes: idxA,
      adds: new Set(idxA),
      removes: new Set(),
    } as any;
    const renderer1 = createRendererStub({ readonlyState: {}, calcListDiff: vi.fn(() => listDiff1) });
    node.applyChange(renderer1);
    expect(container.childNodes.length).toBeGreaterThan(1);
    expect(spyCreate).toHaveBeenCalledTimes(2);

    // 2) 全削除最適化（old の件数 == removes サイズ）
    const listDiff2 = {
      oldListValue: [{}, {}],
      newListValue: [],
      newIndexes: [],
      adds: new Set(),
      removes: new Set(idxA), // 2件とも削除
    } as any;
    const renderer2 = createRendererStub({ readonlyState: {}, calcListDiff: vi.fn(() => listDiff2) });
    node.applyChange(renderer2);
    // コメントのみ残る
    expect(container.childNodes.length).toBe(1);
    // プールへ移動するだけで新規作成はなし
    expect(spyCreate).toHaveBeenCalledTimes(2);

    // 3) 再度 2 件追加（プール再利用で createBindContent は増えない）
    const idxB = createIndexes(2).map((x) => ({ index: x.index }) as any);
    const listDiff3 = {
      oldListValue: [],
      newListValue: [{}, {}],
      newIndexes: idxB,
      adds: new Set(idxB),
      removes: new Set(),
    } as any;
    const renderer3 = createRendererStub({ readonlyState: {}, calcListDiff: vi.fn(() => listDiff3) });
    node.applyChange(renderer3);
    expect(container.childNodes.length).toBeGreaterThan(1);
    expect(spyCreate).toHaveBeenCalledTimes(2); // 増えない -> プール再利用
  });

  it("部分削除（1件）と 非全追加（1件）", () => {
    setupTemplate();
    const engine = createEngineStub();
    const comment = document.createComment("@@|302");
    const binding = createBindingStub(engine, comment);
    const container = document.createElement("div");
    container.appendChild(comment);
    const node = createBindingNodeFor("for", [], [])(binding, comment, engine.inputFilters);

    // 初期 3件追加
    const idx0 = createIndexes(3);
    const diffAdd3 = {
      oldListValue: [],
      newListValue: [{}, {}, {}],
      newIndexes: idx0,
      adds: new Set(idx0),
      removes: new Set(),
    } as any;
    const r1 = createRendererStub({ readonlyState: {}, calcListDiff: vi.fn(() => diffAdd3) });
    node.applyChange(r1);
    const childCountAfter3 = container.childNodes.length;
    expect(childCountAfter3).toBeGreaterThan(1);

    // 中央の1件を削除（部分削除）
    const idxRemain = [idx0[0], idx0[2]];
    const diffRemove1 = {
      oldListValue: [{}, {}, {}],
      newListValue: [{}, {}],
      newIndexes: idxRemain,
      adds: new Set(),
      removes: new Set([idx0[1]]),
    } as any;
    const r2 = createRendererStub({ readonlyState: {}, calcListDiff: vi.fn(() => diffRemove1) });
    node.applyChange(r2);
    expect(container.childNodes.length).toBeLessThan(childCountAfter3);

    // 新しい1件を追加（非全追加）
    const idxNew = [...idxRemain, { index: 2 } as any];
    const diffAdd1 = {
      oldListValue: [{}, {}],
      newListValue: [{}, {}, {}],
      newIndexes: idxNew,
      adds: new Set([idxNew[2]]),
      removes: new Set(),
    } as any;
    const r3 = createRendererStub({ readonlyState: {}, calcListDiff: vi.fn(() => diffAdd1) });
    node.applyChange(r3);
    expect(container.childNodes.length).toBe(childCountAfter3); // 3件に戻る想定
  });

  it("parentNode が null だとエラー", () => {
    setupTemplate();
    const engine = createEngineStub();
    const comment = document.createComment("@@|303");
    const binding = createBindingStub(engine, comment);
    const node = createBindingNodeFor("for", [], [])(binding, comment, engine.inputFilters);

    const idx = createIndexes(1);
    const diff = {
      oldListValue: [],
      newListValue: [{}],
      newIndexes: idx,
      adds: new Set(idx),
      removes: new Set(),
    } as any;
    const renderer = createRendererStub({ readonlyState: {}, calcListDiff: vi.fn(() => diff) });
    expect(() => node.applyChange(renderer)).toThrowError(/parentNode is null/);
  });

  it("poolLength の setter 負数はエラー", () => {
    const engine = createEngineStub();
    const comment = document.createComment("@@|304");
    const binding = createBindingStub(engine, comment);
    const node = createBindingNodeFor("for", [], [])(binding, comment, engine.inputFilters) as any;
    expect(() => { node.poolLength = -1; }).toThrowError(/length is negative/);
  });

  it("loopInfo はキャッシュされ、getStructuredPathInfo は1回のみ", () => {
    const spy = vi.spyOn(GetStructuredPathInfoMod, "getStructuredPathInfo");
    const engine = createEngineStub();
    const comment = document.createComment("@@|305");
    const binding = createBindingStub(engine, comment);
    const node = createBindingNodeFor("for", [], [])(binding, comment, engine.inputFilters) as any;
    // 2回アクセス
    const a = node.loopInfo;
    const b = node.loopInfo;
    expect(a).toBe(b);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
