import { describe, it, expect, vi, beforeEach } from "vitest";
import { createBindContent } from "../../src/DataBinding/BindContent";

// Template と DataBindAttributes の依存をスタブ
import * as registerTemplateMod from "../../src/Template/registerTemplate";
import * as registerAttrMod from "../../src/BindingBuilder/registerDataBindAttributes";
import * as resolveNodeFromPathMod from "../../src/BindingBuilder/resolveNodeFromPath";
import * as bindingMod from "../../src/DataBinding/Binding";
import * as loadFromImportMapMod from "../../src/WebComponents/loadFromImportMap";

describe("BindContent", () => {
  const templateId = 1001;
  let template: HTMLTemplateElement;
  let engine: any;

  beforeEach(() => {
    template = document.createElement("template");
    template.innerHTML = `<div id="a"><span id="b"></span></div>`;
    vi.spyOn(registerTemplateMod, "getTemplateById").mockReturnValue(template);

    engine = { inputFilters: {}, outputFilters: {} };
  });

  it("createBindContent は fragment から childNodes を持ち、bindings を初期化する", () => {
    // 1つのノードに1つの bindText があると仮定
    const mockCreator = {
      createBindingNode: vi.fn(),
      createBindingState: vi.fn(),
    } as any;
    const attributes = [{
      nodeType: "HTMLElement",
      nodePath: [0, 0],
      bindTexts: [{
        nodeProperty: "text",
        stateProperty: "user.name",
        inputFilterTexts: [],
        outputFilterTexts: [],
        decorates: [],
      }],
      creatorByText: new Map(),
    }];
    attributes[0].creatorByText.set(attributes[0].bindTexts[0], mockCreator);
    vi.spyOn(registerAttrMod, "getDataBindAttributesById").mockReturnValue(attributes as any);

    // resolveNodeFromPath はテンプレート内の span を返す
    const span = template.content.querySelector("#b")!;
    vi.spyOn(resolveNodeFromPathMod, "resolveNodeFromPath").mockReturnValue(span);

    // createBinding をスタブして bindings の長さ確認
    const mockBinding = {
      init: vi.fn(),
      parentBindContent: null,
      node: span,
      bindContents: [],
      applyChange: vi.fn(),
    } as any;
    vi.spyOn(bindingMod, "createBinding").mockReturnValue(mockBinding);

    const loopRef: any = { listIndex: null };
    const bindContent = createBindContent(null, templateId, engine, loopRef);

    expect(bindContent.childNodes.length).toBeGreaterThan(0);
    expect(bindContent.bindings.length).toBe(1);
    expect(mockBinding.init).toHaveBeenCalled();

    // mount/unmount のDOM変化
    const host = document.createElement("div");
    bindContent.mount(host);
    expect(host.childNodes.length).toBe(bindContent.childNodes.length);

  // getLastNode はマウント中は最後の child を返す（ここでは孫 BindContent はなし）
  const lastMounted = bindContent.getLastNode(host);
  expect(lastMounted).toBe(bindContent.lastChildNode);

  bindContent.unmount();
  expect(host.childNodes.length).toBe(0);

  // applyChange は各 binding に委譲
  const renderer: any = { updatedBindings: new Set() };
  bindContent.applyChange(renderer);
  expect(mockBinding.applyChange).toHaveBeenCalledWith(renderer);

  // アンマウント後は親が一致しないため null
  const lastUnmounted = bindContent.getLastNode(host);
  expect(lastUnmounted).toBeNull();
  });

  it("isMounted/firstChildNode/lastChildNode と mountBefore/mountAfter の挿入位置", () => {
    const mockCreator = {
      createBindingNode: vi.fn(),
      createBindingState: vi.fn(),
    } as any;
    const attrs = [{
      nodeType: "HTMLElement",
      nodePath: [0],
      bindTexts: ["t"],
      creatorByText: new Map([["t", mockCreator]]),
    }];
    vi.spyOn(registerAttrMod, "getDataBindAttributesById").mockReturnValue(attrs as any);

    // resolveNodeFromPath はテンプレ直下の要素を返す
    const top = template.content.firstElementChild!;
    vi.spyOn(resolveNodeFromPathMod, "resolveNodeFromPath").mockReturnValue(top);

    const mockBinding = { init: vi.fn(), parentBindContent: null, node: top, bindContents: [], applyChange: vi.fn() } as any;
    vi.spyOn(bindingMod, "createBinding").mockReturnValue(mockBinding);

    const loopRef: any = { listIndex: null };
  const bc = createBindContent(null, templateId, engine, loopRef);
    expect(bc.firstChildNode).toBeTruthy();
    expect(bc.lastChildNode).toBeTruthy();

    const host = document.createElement("div");
    const anchor = document.createElement("hr");
    host.appendChild(anchor);

    // mountBefore: 先頭に入る
    bc.mountBefore(host, host.firstChild);
    expect(host.firstChild).toBe(bc.firstChildNode);
  expect(bc.isMounted).toBe(true);

  // mountAfter: アンカーの直後に入る（いったんアンマウントして検証）
  bc.unmount();
    host.appendChild(anchor); // anchor を再度最後尾に
    bc.mountAfter(host, anchor);
    // anchor の次に bc の最初のノードが来る
    expect(anchor.nextSibling).toBe(bc.firstChildNode);
  });

  it("currentLoopContext は親チェーンを遡り一度だけ計算（キャッシュ）", () => {
    const attrs = [{ nodeType: "HTMLElement", nodePath: [0], bindTexts: ["t"], creatorByText: new Map([["t", {}]]) }];
    vi.spyOn(registerAttrMod, "getDataBindAttributesById").mockReturnValue(attrs as any);
    vi.spyOn(resolveNodeFromPathMod, "resolveNodeFromPath").mockReturnValue(template.content.firstElementChild!);
    vi.spyOn(bindingMod, "createBinding").mockReturnValue({ init: vi.fn(), node: template.content.firstElementChild!, bindContents: [] } as any);

    const parentLoopCtx = { any: 1 } as any;
    const parentBinding = { parentBindContent: { loopContext: parentLoopCtx } } as any;
    const bc = createBindContent(parentBinding, templateId, engine, { listIndex: null } as any);

    const c1 = (bc as any).currentLoopContext;
    const c2 = (bc as any).currentLoopContext;
    expect(c1).toBe(parentLoopCtx);
    expect(c2).toBe(parentLoopCtx);
  });

  it("assignListIndex: loopContext が null の場合はエラー", () => {
    const attrs = [{ nodeType: "HTMLElement", nodePath: [0], bindTexts: ["t"], creatorByText: new Map([["t", {}]]) }];
    vi.spyOn(registerAttrMod, "getDataBindAttributesById").mockReturnValue(attrs as any);
    vi.spyOn(resolveNodeFromPathMod, "resolveNodeFromPath").mockReturnValue(template.content.firstElementChild!);
    vi.spyOn(bindingMod, "createBinding").mockReturnValue({ init: vi.fn(), node: template.content.firstElementChild!, bindContents: [] } as any);

    const bc = createBindContent(null, templateId, engine, { listIndex: null } as any);
  expect(() => bc.assignListIndex({} as any)).toThrow("LoopContext is null");
  });

  it("assignListIndex: loopContext があれば assignListIndex と init を呼ぶ", () => {
    const attrs = [{ nodeType: "HTMLElement", nodePath: [0], bindTexts: ["t"], creatorByText: new Map([["t", {}]]) }];
    vi.spyOn(registerAttrMod, "getDataBindAttributesById").mockReturnValue(attrs as any);
    vi.spyOn(resolveNodeFromPathMod, "resolveNodeFromPath").mockReturnValue(template.content.firstElementChild!);
    const mockBinding = { init: vi.fn(), node: template.content.firstElementChild!, bindContents: [] } as any;
    vi.spyOn(bindingMod, "createBinding").mockReturnValue(mockBinding);

    const bc = createBindContent(null, templateId, engine, { listIndex: null } as any);
    // テスト用に loopContext を差し替え
    const assign = vi.fn();
    (bc as any).loopContext = { assignListIndex: assign };
    bc.bindings = [mockBinding];
    bc.assignListIndex({} as any);
    expect(assign).toHaveBeenCalled();
    expect(mockBinding.init).toHaveBeenCalled();
  });

  it("applyChange: updatedBindings に含まれるものは skip", () => {
    const attrs = [{ nodeType: "HTMLElement", nodePath: [0], bindTexts: ["t1", "t2"], creatorByText: new Map([["t1", {}], ["t2", {}]]) }];
    vi.spyOn(registerAttrMod, "getDataBindAttributesById").mockReturnValue(attrs as any);
    vi.spyOn(resolveNodeFromPathMod, "resolveNodeFromPath").mockReturnValue(template.content.firstElementChild!);
  const b1 = { init: vi.fn(), applyChange: vi.fn(), node: template.content.firstElementChild!, bindContents: [] } as any;
  const b2 = { init: vi.fn(), applyChange: vi.fn(), node: template.content.firstElementChild!, bindContents: [] } as any;
    vi.spyOn(bindingMod, "createBinding").mockReturnValueOnce(b1).mockReturnValueOnce(b2);

    const bc = createBindContent(null, templateId, engine, { listIndex: null } as any);
    const renderer: any = { updatedBindings: new Set([b1]) };
    bc.applyChange(renderer);
    expect(b1.applyChange).not.toHaveBeenCalled();
    expect(b2.applyChange).toHaveBeenCalled();
  });

  it("createContent: lazy-load 未定義カスタム要素を検出して読み込みを要求", () => {
    // テンプレートに未定義要素を含める
    template.innerHTML = `<x-foo></x-foo><x-bar></x-bar>`;
    vi.spyOn(registerTemplateMod, "getTemplateById").mockReturnValue(template);
    // lazy ロードフラグを有効化
    vi.spyOn(loadFromImportMapMod, "hasLazyLoadComponents").mockReturnValue(true as any);
  const loadSpy = vi.spyOn(loadFromImportMapMod, "loadLazyLoadComponent").mockImplementation(() => undefined);

    // 最低限の attributes などを用意
    const attrs = [{ nodeType: "HTMLElement", nodePath: [0], bindTexts: ["t"], creatorByText: new Map([["t", {}]]) }];
    vi.spyOn(registerAttrMod, "getDataBindAttributesById").mockReturnValue(attrs as any);
    vi.spyOn(resolveNodeFromPathMod, "resolveNodeFromPath").mockReturnValue(template.content.firstElementChild!);
    vi.spyOn(bindingMod, "createBinding").mockReturnValue({ init: vi.fn(), node: template.content.firstElementChild!, bindContents: [] } as any);

    const bc = createBindContent(null, templateId, engine, { listIndex: null } as any);
    expect(bc.childNodes.length).toBeGreaterThan(0);
    expect(loadSpy).toHaveBeenCalledWith("x-foo");
    expect(loadSpy).toHaveBeenCalledWith("x-bar");
  });

  it("createBindings: data-bind 未登録でエラー, resolveNodeFromPath 失敗, creator 未登録", () => {
    // data-bind 未登録
    vi.spyOn(registerAttrMod, "getDataBindAttributesById").mockReturnValueOnce(undefined as any);
  expect(() => createBindContent(null, templateId, engine, { listIndex: null } as any)).toThrow("Data-bind is not set");

    // resolveNodeFromPath 失敗
    const attrs1 = [{ nodeType: "HTMLElement", nodePath: [0, 1], bindTexts: ["t1"], creatorByText: new Map([["t1", {}]]) }];
    vi.spyOn(registerAttrMod, "getDataBindAttributesById").mockReturnValueOnce(attrs1 as any);
    vi.spyOn(resolveNodeFromPathMod, "resolveNodeFromPath").mockReturnValueOnce(null as any);
  expect(() => createBindContent(null, templateId, engine, { listIndex: null } as any)).toThrow("Node not found: 0,1");

    // creator 未登録
    const attrs2 = [{ nodeType: "HTMLElement", nodePath: [0], bindTexts: ["no-creator"], creatorByText: new Map() }];
    vi.spyOn(registerAttrMod, "getDataBindAttributesById").mockReturnValueOnce(attrs2 as any);
    vi.spyOn(resolveNodeFromPathMod, "resolveNodeFromPath").mockReturnValueOnce(template.content.firstElementChild!);
  expect(() => createBindContent(null, templateId, engine, { listIndex: null } as any)).toThrow("Creator not found: no-creator");
  });
});
