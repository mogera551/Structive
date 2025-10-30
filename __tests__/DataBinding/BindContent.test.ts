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
  let templateSpy: any;

  beforeEach(() => {
    template = document.createElement("template");
    template.innerHTML = `<div id="a"><span id="b"></span></div>`;
    templateSpy = vi.spyOn(registerTemplateMod, "getTemplateById").mockReturnValue(template);

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
      bindingNode: { isBlock: false },
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

  // 2度目の unmount は parentNode が null でも例外なし
  expect(() => bindContent.unmount()).not.toThrow();

  // applyChange は各 binding に委譲
  const renderer: any = { updatedBindings: new Set() };
  bindContent.applyChange(renderer);
  expect(mockBinding.applyChange).toHaveBeenCalledWith(renderer);

  // アンマウント後は親が一致しないため null
  const lastUnmounted = bindContent.getLastNode(host);
  expect(lastUnmounted).toBeNull();
  });

  it("id getter はテンプレートIDを返す", () => {
    const attrs = [{ nodeType: "HTMLElement", nodePath: [0], bindTexts: ["t"], creatorByText: new Map([["t", {}]]) }];
    vi.spyOn(registerAttrMod, "getDataBindAttributesById").mockReturnValueOnce(attrs as any);
    const node = template.content.firstElementChild!;
    vi.spyOn(resolveNodeFromPathMod, "resolveNodeFromPath").mockReturnValueOnce(node);
    vi.spyOn(bindingMod, "createBinding").mockReturnValueOnce({
      init: vi.fn(),
      node,
      bindContents: [],
      applyChange: vi.fn(),
      bindingNode: { isBlock: false },
    } as any);

    const bc = createBindContent(null, templateId, engine, { listIndex: null } as any);
    expect(bc.id).toBe(templateId);
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

    const mockBinding = {
      init: vi.fn(),
      parentBindContent: null,
      node: top,
      bindContents: [],
      applyChange: vi.fn(),
      bindingNode: { isBlock: false },
    } as any;
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

  it("firstChildNode/lastChildNode: 子ノードが無ければ null", () => {
    const attrs = [{ nodeType: "HTMLElement", nodePath: [0], bindTexts: ["t"], creatorByText: new Map([["t", {}]]) }];
    vi.spyOn(registerAttrMod, "getDataBindAttributesById").mockReturnValueOnce(attrs as any);
    const node = template.content.firstElementChild!;
    vi.spyOn(resolveNodeFromPathMod, "resolveNodeFromPath").mockReturnValueOnce(node);
    vi.spyOn(bindingMod, "createBinding").mockReturnValueOnce({
      init: vi.fn(),
      node,
      bindContents: [],
      applyChange: vi.fn(),
      bindingNode: { isBlock: false },
    } as any);

    const bc = createBindContent(null, templateId, engine, { listIndex: null } as any);
    (bc as any).childNodes = [];
    expect(bc.firstChildNode).toBeNull();
    expect(bc.lastChildNode).toBeNull();
  });

  it("blockBindings が存在する場合は hasBlockBinding が true", () => {
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
    vi.spyOn(registerAttrMod, "getDataBindAttributesById").mockReturnValueOnce(attrs as any);
    const top = template.content.firstElementChild!;
    vi.spyOn(resolveNodeFromPathMod, "resolveNodeFromPath").mockReturnValueOnce(top);

    const blockBinding = {
      init: vi.fn(),
      node: top,
      bindContents: [],
      applyChange: vi.fn(),
      bindingNode: { isBlock: true },
    } as any;
    vi.spyOn(bindingMod, "createBinding").mockReturnValueOnce(blockBinding);

    const bc = createBindContent(null, templateId, engine, { listIndex: null } as any);
    expect(bc.hasBlockBinding).toBe(true);
    expect(bc.blockBindings).toContain(blockBinding);
  });

  it("currentLoopContext は親チェーンを遡り一度だけ計算（キャッシュ）", () => {
    const attrs = [{ nodeType: "HTMLElement", nodePath: [0], bindTexts: ["t"], creatorByText: new Map([["t", {}]]) }];
    vi.spyOn(registerAttrMod, "getDataBindAttributesById").mockReturnValue(attrs as any);
    vi.spyOn(resolveNodeFromPathMod, "resolveNodeFromPath").mockReturnValue(template.content.firstElementChild!);
  vi.spyOn(bindingMod, "createBinding").mockReturnValue({ init: vi.fn(), node: template.content.firstElementChild!, bindContents: [], bindingNode: { isBlock: false } } as any);

    const parentLoopCtx = { any: 1 } as any;
    const parentBinding = { parentBindContent: { loopContext: parentLoopCtx } } as any;
    const bc = createBindContent(parentBinding, templateId, engine, { listIndex: null } as any);

    const c1 = (bc as any).currentLoopContext;
    const c2 = (bc as any).currentLoopContext;
    expect(c1).toBe(parentLoopCtx);
    expect(c2).toBe(parentLoopCtx);
  });

  it("currentLoopContext: どこにも LoopContext が無ければ null", () => {
    const attrs = [{ nodeType: "HTMLElement", nodePath: [0], bindTexts: ["t"], creatorByText: new Map([["t", {}]]) }];
    vi.spyOn(registerAttrMod, "getDataBindAttributesById").mockReturnValueOnce(attrs as any);
    vi.spyOn(resolveNodeFromPathMod, "resolveNodeFromPath").mockReturnValueOnce(template.content.firstElementChild!);
    vi.spyOn(bindingMod, "createBinding").mockReturnValueOnce({
      init: vi.fn(),
      node: template.content.firstElementChild!,
      bindContents: [],
      applyChange: vi.fn(),
      bindingNode: { isBlock: false },
    } as any);

    const parentChain = { loopContext: null, parentBinding: null } as any;
    const parentBinding = { parentBindContent: parentChain } as any;
    const bc = createBindContent(parentBinding, templateId, engine, { listIndex: null } as any);
    (bc as any).loopContext = null;
    expect((bc as any).currentLoopContext).toBeNull();
    expect((bc as any).currentLoopContext).toBeNull();
  });

  it("assignListIndex: loopContext が null の場合はエラー", () => {
    const attrs = [{ nodeType: "HTMLElement", nodePath: [0], bindTexts: ["t"], creatorByText: new Map([["t", {}]]) }];
    vi.spyOn(registerAttrMod, "getDataBindAttributesById").mockReturnValue(attrs as any);
    vi.spyOn(resolveNodeFromPathMod, "resolveNodeFromPath").mockReturnValue(template.content.firstElementChild!);
  vi.spyOn(bindingMod, "createBinding").mockReturnValue({ init: vi.fn(), node: template.content.firstElementChild!, bindContents: [], bindingNode: { isBlock: false } } as any);

    const bc = createBindContent(null, templateId, engine, { listIndex: null } as any);
  expect(() => bc.assignListIndex({} as any)).toThrow("LoopContext is null");
  });

  it("assignListIndex: loopContext があれば assignListIndex と init を呼ぶ", () => {
    const attrs = [{ nodeType: "HTMLElement", nodePath: [0], bindTexts: ["t"], creatorByText: new Map([["t", {}]]) }];
    vi.spyOn(registerAttrMod, "getDataBindAttributesById").mockReturnValue(attrs as any);
    vi.spyOn(resolveNodeFromPathMod, "resolveNodeFromPath").mockReturnValue(template.content.firstElementChild!);
  const mockBinding = { init: vi.fn(), node: template.content.firstElementChild!, bindContents: [], bindingNode: { isBlock: false } } as any;
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
  const b1 = { init: vi.fn(), applyChange: vi.fn(), node: template.content.firstElementChild!, bindContents: [], bindingNode: { isBlock: false } } as any;
  const b2 = { init: vi.fn(), applyChange: vi.fn(), node: template.content.firstElementChild!, bindContents: [], bindingNode: { isBlock: false } } as any;
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
  vi.spyOn(bindingMod, "createBinding").mockReturnValue({ init: vi.fn(), node: template.content.firstElementChild!, bindContents: [], bindingNode: { isBlock: false } } as any);

    const bc = createBindContent(null, templateId, engine, { listIndex: null } as any);
    expect(bc.childNodes.length).toBeGreaterThan(0);
    expect(loadSpy).toHaveBeenCalledWith("x-foo");
    expect(loadSpy).toHaveBeenCalledWith("x-bar");
  });

  it("createBindContent: テンプレート未登録なら BIND-101", () => {
    templateSpy.mockReturnValueOnce(undefined as any);
    expect(() => createBindContent(null, templateId, engine, { listIndex: null } as any)).toThrow(`Template not found: ${templateId}`);
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

  it("getLastNode: 子 BindContent の最後のノードを再帰的に返す（子が null なら親の lastChildNode）", () => {
    // 親テンプレート
    template.innerHTML = `<div id="root"><section id="child"></section></div>`;
    vi.spyOn(registerTemplateMod, "getTemplateById").mockReturnValueOnce(template);
    const attrs = [{ nodeType: "HTMLElement", nodePath: [0], bindTexts: ["t"], creatorByText: new Map([ ["t", {}] ]) }];
    vi.spyOn(registerAttrMod, "getDataBindAttributesById").mockReturnValueOnce(attrs as any);
    const rootEl = template.content.firstElementChild!;
    vi.spyOn(resolveNodeFromPathMod, "resolveNodeFromPath").mockReturnValueOnce(rootEl);

    // 親バインディングと子 BindContent を持つ構造を作る
    const childBindContent: any = { getLastNode: vi.fn(() => null) };
    const mockBinding: any = { 
      init: vi.fn(), 
      node: rootEl, 
      bindContents: [childBindContent],
      applyChange: vi.fn(),
      bindingNode: { isBlock: false },
    };
    vi.spyOn(bindingMod, "createBinding").mockReturnValueOnce(mockBinding);

    const loopRef: any = { listIndex: null };
    const bc = createBindContent(null, templateId, engine, loopRef);

    const host = document.createElement("div");
    bc.mount(host);
    // 子の getLastNode が null を返す場合は親の lastChildNode を返す
    const last = bc.getLastNode(host);
    expect(last).toBe(bc.lastChildNode);
  });

  it("getLastNode: 子 BindContent がノードを返す場合はそのノードを返す", () => {
    const attrs = [{ nodeType: "HTMLElement", nodePath: [0], bindTexts: ["t"], creatorByText: new Map([["t", {}]]) }];
    vi.spyOn(registerAttrMod, "getDataBindAttributesById").mockReturnValueOnce(attrs as any);
    const rootEl = template.content.firstElementChild!;
    vi.spyOn(resolveNodeFromPathMod, "resolveNodeFromPath").mockReturnValueOnce(rootEl);
    vi.spyOn(bindingMod, "createBinding").mockReturnValueOnce({
      init: vi.fn(),
      node: rootEl,
      bindContents: [],
      applyChange: vi.fn(),
      bindingNode: { isBlock: false },
    } as any);

    const bc = createBindContent(null, templateId, engine, { listIndex: null } as any);
    const host = document.createElement("div");
    const sentinel = document.createElement("section");
    host.appendChild(sentinel);
    const childTail = document.createElement("span");
    host.appendChild(childTail);
    const childBindContent = { getLastNode: vi.fn(() => childTail) } as any;

    (bc as any).childNodes = [sentinel];
    (bc as any).bindings = [{ node: sentinel, bindContents: [childBindContent] }];

    const last = bc.getLastNode(host);
    expect(childBindContent.getLastNode).toHaveBeenCalledWith(host);
    expect(last).toBe(childTail);
  });

  it("getLastNode: 子 BindContent の解決に失敗した場合は BIND-104", () => {
    template.innerHTML = `<span id="tail"></span>`;
    templateSpy.mockReturnValueOnce(template);
    const attrs = [{ nodeType: "HTMLElement", nodePath: [0], bindTexts: ["t"], creatorByText: new Map([["t", {}]]) }];
    vi.spyOn(registerAttrMod, "getDataBindAttributesById").mockReturnValueOnce(attrs as any);
    const rootEl = template.content.firstElementChild!;
    vi.spyOn(resolveNodeFromPathMod, "resolveNodeFromPath").mockReturnValueOnce(rootEl);
    const binding = {
      init: vi.fn(),
      node: rootEl,
      bindContents: [undefined],
      applyChange: vi.fn(),
      bindingNode: { isBlock: false },
    } as any;
    vi.spyOn(bindingMod, "createBinding").mockReturnValueOnce(binding);

    const bc = createBindContent(null, templateId, engine, { listIndex: null } as any);
    const host = document.createElement("div");
    bc.mount(host);

    (bc as any).bindings = [binding];
    (bc as any).childNodes = [binding.node];
    expect(binding.node).toBe(bc.lastChildNode);
    expect(() => bc.getLastNode(host)).toThrow("Child bindContent not found");
  });
});
