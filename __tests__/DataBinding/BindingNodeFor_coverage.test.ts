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

  it("assignValue は未実装エラー", () => {
    const engine = createEngineStub();
    const comment = document.createComment("@@|310");
    const binding = createBindingStub(engine, comment);
    const node = createBindingNodeFor("for", [], [])(binding, comment, engine.inputFilters) as any;
    expect(() => node.assignValue([1,2,3])).toThrow(/Not implemented/i);
  });

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
  expect(() => node.applyChange(renderer)).toThrowError(/parentNode is null/i);
  });

  it("removes が undefined でも例外なし（空更新）", () => {
    const engine = createEngineStub();
    const comment = document.createComment("@@|306");
    const binding = createBindingStub(engine, comment);
    const container = document.createElement("div");
    container.appendChild(comment);
    const node = createBindingNodeFor("for", [], [])(binding, comment, engine.inputFilters);

    const diff = {
      oldListValue: [],
      newListValue: [],
      newIndexes: [],
      adds: undefined,
      removes: undefined,
    } as any;
    const renderer = createRendererStub({ readonlyState: {}, calcListDiff: vi.fn(() => diff) });
    expect(() => node.applyChange(renderer)).not.toThrow();
    expect(container.childNodes.length).toBe(1);
  });

  it("removes: 未登録インデックスで BindContent not found", () => {
    const engine = createEngineStub();
    const comment = document.createComment("@@|307");
    const binding = createBindingStub(engine, comment);
    const container = document.createElement("div");
    container.appendChild(comment);
    const node = createBindingNodeFor("for", [], [])(binding, comment, engine.inputFilters);

    const idx = createIndexes(1);
    const diff = {
      // oldListValue と removes のサイズをずらして全削除最適化を回避
      oldListValue: [{}, {}],
      newListValue: [{}],
      newIndexes: [{ index: 0 }],
      adds: new Set(),
      removes: new Set(idx), // map 未登録のまま removes を要求
    } as any;
    const renderer = createRendererStub({ readonlyState: {}, calcListDiff: vi.fn(() => diff) });
    expect(() => node.applyChange(renderer)).toThrow(/BindContent not found/);
  });

  it("reuse: 未登録だと BindContent not found", () => {
    const engine = createEngineStub();
    const comment = document.createComment("@@|308");
    const binding = createBindingStub(engine, comment);
    const container = document.createElement("div");
    container.appendChild(comment);
    const node = createBindingNodeFor("for", [], [])(binding, comment, engine.inputFilters);

    const idx = createIndexes(1);
    const diff = {
      oldListValue: [],
      newListValue: [{}],
      newIndexes: idx,
      adds: new Set(), // 追加ではなく再利用扱いにする
      removes: new Set(),
    } as any;
    const renderer = createRendererStub({ readonlyState: {}, calcListDiff: vi.fn(() => diff) });
    expect(() => node.applyChange(renderer)).toThrow(/BindContent not found/);
  });

  it("reuse: 並びが正しければ再マウントしない（insertBefore が呼ばれない）", () => {
    setupTemplate();
    const engine = createEngineStub();
    const comment = document.createComment("@@|309");
    const binding = createBindingStub(engine, comment);
    const container = document.createElement("div");
    container.appendChild(comment);
    const node = createBindingNodeFor("for", [], [])(binding, comment, engine.inputFilters);

    // 初回: 全追加で2件
    const idx2 = createIndexes(2);
    const diff1 = {
      oldListValue: [],
      newListValue: [{}, {}],
      newIndexes: idx2,
      adds: new Set(idx2),
      removes: new Set(),
    } as any;
    const r1 = createRendererStub({ readonlyState: {}, calcListDiff: vi.fn(() => diff1) });
    node.applyChange(r1);

    // 2回目: 順序そのまま、追加なし（再利用のみ）
    const diff2 = {
      oldListValue: [{}, {}],
      newListValue: [{}, {}],
      newIndexes: idx2,
      adds: new Set(),
      removes: new Set(),
    } as any;
    const r2 = createRendererStub({ readonlyState: {}, calcListDiff: vi.fn(() => diff2) });
    const spyInsert = vi.spyOn(container, "insertBefore");
    node.applyChange(r2);
    expect(spyInsert).not.toHaveBeenCalled();
  });

  it("poolLength の setter 負数はエラー", () => {
    const engine = createEngineStub();
    const comment = document.createComment("@@|304");
    const binding = createBindingStub(engine, comment);
    const node = createBindingNodeFor("for", [], [])(binding, comment, engine.inputFilters) as any;
  expect(() => { node.poolLength = -1; }).toThrowError(/length is negative/i);
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

  it("全削除最適化: 親ノードがこのノードのみを含む場合の最適化", () => {
    setupTemplate();
    const engine = createEngineStub();
    const comment = document.createComment("@@|310");
    const binding = createBindingStub(engine, comment);
    const container = document.createElement("div");
    container.appendChild(comment);
    const node = createBindingNodeFor("for", [], [])(binding, comment, engine.inputFilters);

    // 初期: 2件追加
    const idx2 = createIndexes(2);
    const diff1 = {
      oldListValue: [],
      newListValue: [{}, {}],
      newIndexes: idx2,
      adds: new Set(idx2),
      removes: new Set(),
    } as any;
    const r1 = createRendererStub({ readonlyState: {}, calcListDiff: vi.fn(() => diff1) });
    node.applyChange(r1);
    expect(container.childNodes.length).toBeGreaterThan(1);

    // 親ノードにテキストノード（空白）を追加してブランクノード処理をテスト
    const blankTextNode = document.createTextNode("   ");
    container.appendChild(blankTextNode);
    const initialLength = container.childNodes.length;
    
    // 全削除: 親ノードがこのノードのみを含む場合（ブランクノードは無視）
    const diff2 = {
      oldListValue: [{}, {}],
      newListValue: [],
      newIndexes: [],
      adds: new Set(),
      removes: new Set(idx2),
    } as any;
    const r2 = createRendererStub({ readonlyState: {}, calcListDiff: vi.fn(() => diff2) });
    node.applyChange(r2);
    // 全削除最適化でinnerHTML = '' が実行されるため、コメントのみ残る（ブランクテキストも削除される）
    expect(container.childNodes.length).toBe(1);
    expect(container.firstChild).toBe(comment);
  });

  it("全追加最適化: DocumentFragment を使用した一括追加", () => {
    setupTemplate();
    const engine = createEngineStub();
    const comment = document.createComment("@@|311");
    const binding = createBindingStub(engine, comment);
    const container = document.createElement("div");
    container.appendChild(comment);
    const node = createBindingNodeFor("for", [], [])(binding, comment, engine.inputFilters);

    // 一度削除してプールに要素を溜める
    const idx3 = createIndexes(3);
    const diff1 = {
      oldListValue: [],
      newListValue: [{}, {}, {}],
      newIndexes: idx3,
      adds: new Set(idx3),
      removes: new Set(),
    } as any;
    const r1 = createRendererStub({ readonlyState: {}, calcListDiff: vi.fn(() => diff1) });
    node.applyChange(r1);

    const diff2 = {
      oldListValue: [{}, {}, {}],
      newListValue: [],
      newIndexes: [],
      adds: new Set(),
      removes: new Set(idx3),
    } as any;
    const r2 = createRendererStub({ readonlyState: {}, calcListDiff: vi.fn(() => diff2) });
    node.applyChange(r2);

    // 全追加最適化: DocumentFragment 経由での一括追加
    const idxNew = createIndexes(2);
    const diff3 = {
      oldListValue: [],
      newListValue: [{}, {}],
      newIndexes: idxNew,
      adds: new Set(idxNew),
      removes: new Set(),
    } as any;
    const r3 = createRendererStub({ readonlyState: {}, calcListDiff: vi.fn(() => diff3) });
    const spyInsert = vi.spyOn(container, "insertBefore");
    node.applyChange(r3);
    expect(container.childNodes.length).toBeGreaterThan(1);
    // DocumentFragment による一括挿入が行われる
    expect(spyInsert).toHaveBeenCalled();
  });

  it("並び替え処理: changeIndexes による DOM 位置調整", () => {
    setupTemplate();
    const engine = createEngineStub();
    const comment = document.createComment("@@|312");
    const binding = createBindingStub(engine, comment);
    const container = document.createElement("div");
    container.appendChild(comment);
    const node = createBindingNodeFor("for", [], [])(binding, comment, engine.inputFilters);

    // 初期: 3件追加
    const idx3 = createIndexes(3);
    const diff1 = {
      oldListValue: [],
      newListValue: [{}, {}, {}],
      newIndexes: idx3,
      adds: new Set(idx3),
      removes: new Set(),
    } as any;
    const r1 = createRendererStub({ readonlyState: {}, calcListDiff: vi.fn(() => diff1) });
    node.applyChange(r1);

    // 並び替え: changeIndexes を使用（既存のインデックスを利用）
    const changeIndexes = new Set([idx3[1], idx3[2]]);
    const diff2 = {
      oldListValue: [{}, {}, {}],
      newListValue: [{}, {}, {}],
      newIndexes: idx3,
      adds: new Set(),
      removes: new Set(),
      changeIndexes: changeIndexes,
    } as any;
    const r2 = createRendererStub({ readonlyState: {}, calcListDiff: vi.fn(() => diff2) });
    node.applyChange(r2);
    expect(container.childNodes.length).toBeGreaterThan(1);
  });

  it("並び替え処理: changeIndexes で未登録インデックスはエラー", () => {
    setupTemplate();
    const engine = createEngineStub();
    const comment = document.createComment("@@|313");
    const binding = createBindingStub(engine, comment);
    const container = document.createElement("div");
    container.appendChild(comment);
    const node = createBindingNodeFor("for", [], [])(binding, comment, engine.inputFilters);

    // 並び替え: 未登録のインデックスを指定
    const changeIndexes = new Set([{ index: 0 }]); // 未登録
    const diff = {
      oldListValue: [],
      newListValue: [],
      newIndexes: [],
      adds: new Set(),
      removes: new Set(),
      changeIndexes: changeIndexes,
    } as any;
    const r = createRendererStub({ readonlyState: {}, calcListDiff: vi.fn(() => diff) });
    expect(() => node.applyChange(r)).toThrow(/BindContent not found/);
  });

  it("上書き処理: overwrites による要素の再描画", () => {
    setupTemplate();
    const engine = createEngineStub();
    const comment = document.createComment("@@|314");
    const binding = createBindingStub(engine, comment);
    const container = document.createElement("div");
    container.appendChild(comment);
    const node = createBindingNodeFor("for", [], [])(binding, comment, engine.inputFilters);

    // 初期: 2件追加
    const idx2 = createIndexes(2);
    const diff1 = {
      oldListValue: [],
      newListValue: [{}, {}],
      newIndexes: idx2,
      adds: new Set(idx2),
      removes: new Set(),
    } as any;
    const r1 = createRendererStub({ readonlyState: {}, calcListDiff: vi.fn(() => diff1) });
    node.applyChange(r1);

    // 上書き処理: overwrites を使用
    const overwrites = new Set([idx2[0]]);
    const diff2 = {
      oldListValue: [{}, {}],
      newListValue: [{ updated: true }, {}],
      newIndexes: idx2,
      adds: new Set(),
      removes: new Set(),
      overwrites: overwrites,
    } as any;
    const r2 = createRendererStub({ readonlyState: {}, calcListDiff: vi.fn(() => diff2) });
    node.applyChange(r2);
    expect(container.childNodes.length).toBeGreaterThan(1);
  });

  it("上書き処理: overwrites で未登録インデックスはエラー", () => {
    setupTemplate();
    const engine = createEngineStub();
    const comment = document.createComment("@@|315");
    const binding = createBindingStub(engine, comment);
    const container = document.createElement("div");
    container.appendChild(comment);
    const node = createBindingNodeFor("for", [], [])(binding, comment, engine.inputFilters);

    // 上書き処理: 未登録のインデックスを指定
    const overwrites = new Set([{ index: 0 }]); // 未登録
    const diff = {
      oldListValue: [],
      newListValue: [],
      newIndexes: [],
      adds: new Set(),
      removes: new Set(),
      overwrites: overwrites,
    } as any;
    const r = createRendererStub({ readonlyState: {}, calcListDiff: vi.fn(() => diff) });
    expect(() => node.applyChange(r)).toThrow(/BindContent not found/);
  });

  it("ListDiff が null の場合はエラー", () => {
    setupTemplate();
    const engine = createEngineStub();
    const comment = document.createComment("@@|316");
    const binding = createBindingStub(engine, comment);
    const container = document.createElement("div");
    container.appendChild(comment);
    const node = createBindingNodeFor("for", [], [])(binding, comment, engine.inputFilters);

    const renderer = createRendererStub({ readonlyState: {}, calcListDiff: vi.fn(() => null) });
    expect(() => node.applyChange(renderer)).toThrow(/ListDiff is null/);
  });

  it("全削除時の Last content is null エラー", () => {
    setupTemplate();
    const engine = createEngineStub();
    const comment = document.createComment("@@|317");
    const binding = createBindingStub(engine, comment);
    const container = document.createElement("div");
    container.appendChild(comment);
    const node = createBindingNodeFor("for", [], [])(binding, comment, engine.inputFilters);

    // bindContentsを直接空にしてLast content is nullエラーを発生させる
    (node as any)["#bindContents"] = [];

    const idx1 = createIndexes(1);
    const diff = {
      oldListValue: [{}],
      newListValue: [],
      newIndexes: [],
      adds: new Set(),
      removes: new Set(idx1),
    } as any;
    const renderer = createRendererStub({ readonlyState: {}, calcListDiff: vi.fn(() => diff) });
    expect(() => node.applyChange(renderer)).toThrow(/Last content is null/);
  });

  it("全削除最適化: ブランクノード処理でfirstNodeがnull以外", () => {
    setupTemplate();
    const engine = createEngineStub();
    const comment = document.createComment("@@|318");
    const binding = createBindingStub(engine, comment);
    const container = document.createElement("div");
    
    // 先頭に通常のノードを配置
    const normalNode = document.createElement("span");
    container.appendChild(normalNode);
    container.appendChild(comment);
    
    const node = createBindingNodeFor("for", [], [])(binding, comment, engine.inputFilters);

    // 初期: 1件追加
    const idx1 = createIndexes(1);
    const diff1 = {
      oldListValue: [],
      newListValue: [{}],
      newIndexes: idx1,
      adds: new Set(idx1),
      removes: new Set(),
    } as any;
    const r1 = createRendererStub({ readonlyState: {}, calcListDiff: vi.fn(() => diff1) });
    node.applyChange(r1);

    // 全削除: 親ノードにその他のノードがあるため最適化されない
    const diff2 = {
      oldListValue: [{}],
      newListValue: [],
      newIndexes: [],
      adds: new Set(),
      removes: new Set(idx1),
    } as any;
    const r2 = createRendererStub({ readonlyState: {}, calcListDiff: vi.fn(() => diff2) });
    node.applyChange(r2);
    
    // 通常の削除処理が実行される（最適化されない）
    expect(container.childNodes.length).toBeGreaterThan(1);
    expect(container.contains(normalNode)).toBe(true);
  });
});
