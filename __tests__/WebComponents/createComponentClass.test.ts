/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mocks
const generateIdMock = vi.fn(() => 123);
vi.mock("../../src/GlobalId/generateId", () => ({ generateId: () => generateIdMock() }));

const registerHtmlMock = vi.fn();
vi.mock("../../src/Template/registerHtml", () => ({ registerHtml: (id:number, html:string) => registerHtmlMock(id, html) }));

const getTemplateByIdMock = vi.fn((id:number) => {
  const t = document.createElement("template");
  t.innerHTML = "<div>tmpl</div>";
  return t;
});
vi.mock("../../src/Template/registerTemplate", () => ({ getTemplateById: (id:number) => getTemplateByIdMock(id) }));

const registerCssMock = vi.fn();
vi.mock("../../src/StyleSheet/regsiterCss", () => ({ registerCss: (id:number, css:string) => registerCssMock(id, css) }));

const getStyleSheetByIdMock = vi.fn((id:number) => new CSSStyleSheet());
vi.mock("../../src/StyleSheet/registerStyleSheet", () => ({ getStyleSheetById: (id:number) => getStyleSheetByIdMock(id) }));

const registerStateClassMock = vi.fn();
const getStateClassByIdMock = vi.fn((id:number) => class {});
vi.mock("../../src/StateClass/registerStateClass", () => ({
  registerStateClass: (id:number, s:any) => registerStateClassMock(id, s),
  getStateClassById : (id:number) => getStateClassByIdMock(id),
}));

const getBaseClassMock = vi.fn((ext?:string) => HTMLElement as any);
vi.mock("../../src/WebComponents/getBaseClass", () => ({ getBaseClass: (ext?:string) => getBaseClassMock(ext) }));

// getComponentConfig を透過モック（必要に応じて動的に戻り値を差し替える）
const getComponentConfigMock = vi.fn((c:any) => c ?? {});
vi.mock("../../src/WebComponents/getComponentConfig", () => ({ getComponentConfig: (c:any) => getComponentConfigMock(c) }));

const findStructiveParentMock = vi.fn(() => ({ tagName: "X-PARENT" }));
vi.mock("../../src/WebComponents/findStructiveParent", () => ({ findStructiveParent: () => findStructiveParentMock() }));

const createPathManagerMock = vi.fn((cls:any) => ({ kind: "pm" }));
vi.mock("../../src/PathManager/PathManager", () => ({ createPathManager: (cls:any) => createPathManagerMock(cls) }));

// ComponentEngine stub
const setupSpy = vi.fn();
const connectedSpy = vi.fn();
const disconnectedSpy = vi.fn();
const registerChildSpy = vi.fn();
const unregisterChildSpy = vi.fn();
const engineObj = {
  setup: setupSpy,
  connectedCallback: connectedSpy,
  disconnectedCallback: disconnectedSpy,
  stateInput: { foo: 1 },
  stateClass: { $isStructive: true },
  waitForInitialize: { promise: Promise.resolve() },
  bindingsByComponent: new Map<any, any>(),
  registerChildComponent: registerChildSpy,
  unregisterChildComponent: unregisterChildSpy,
};
const createComponentEngineMock = vi.fn(() => engineObj);
vi.mock("../../src/ComponentEngine/ComponentEngine", () => ({ createComponentEngine: () => createComponentEngineMock() }));

// Import target after mocks
import { createComponentClass } from "../../src/WebComponents/createComponentClass";

function makeData(overrides?: Partial<{ html:string; css:string; stateClass: any }>) {
  const State = class {} as any;
  return {
    html: "<div>Hello</div>",
    css: ".root{color:red;}",
    stateClass: State,
    ...overrides,
  } as any;
}

describe("WebComponents/createComponentClass", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    engineObj.stateClass = { $isStructive: true };
    engineObj.bindingsByComponent = new Map<any, any>();
    // ensure customElements.define doesn't actually register
    vi.spyOn(customElements, "define").mockImplementation(() => undefined as any);
  });

  it("初期登録と静的アクセサのキャッシュ/リセット(html/css/template/styleSheet/stateClass/pathManager)", () => {
    const data = makeData();
    const Cls = createComponentClass(data);

    // id は generateId の戻り
    expect(Cls.id).toBe(123);
    expect(Cls.html).toBe(data.html);
    expect(Cls.css).toBe(data.css);

    // 初期 html/css 登録
    expect(registerHtmlMock).toHaveBeenCalledWith(123, data.html);
    expect(registerCssMock).toHaveBeenCalledWith(123, data.css);
    expect(registerStateClassMock).toHaveBeenCalledWith(123, data.stateClass);

    // template/styleSheet/stateClass は getById を通じて一度だけ取得されキャッシュ
    const t1 = Cls.template;
    const t2 = Cls.template;
    expect(t1).toBe(t2);
    expect(getTemplateByIdMock).toHaveBeenCalledTimes(1);

    const s1 = Cls.styleSheet;
    const s2 = Cls.styleSheet;
    expect(s1).toBe(s2);
    expect(getStyleSheetByIdMock).toHaveBeenCalledTimes(1);

    const st1 = Cls.stateClass;
    const st2 = Cls.stateClass;
    expect(st1).toBe(st2);
    expect(getStateClassByIdMock).toHaveBeenCalledTimes(1);

    // pathManager も一度だけ
    const pm1 = Cls.pathManager;
    const pm2 = Cls.pathManager;
    expect(pm1).toBe(pm2);
    expect(createPathManagerMock).toHaveBeenCalledTimes(1);

    // html を更新すると registerHtml が呼ばれ、template/pathManager がリセットされ再取得
    Cls.html = "<span>World</span>";
    expect(registerHtmlMock).toHaveBeenLastCalledWith(123, "<span>World</span>");
    const t3 = Cls.template;
    expect(t3).not.toBe(t1);
    expect(getTemplateByIdMock).toHaveBeenCalledTimes(2);

    const pm3 = Cls.pathManager;
    expect(pm3).not.toBe(pm1);
    expect(createPathManagerMock).toHaveBeenCalledTimes(2);

    // css を更新すると registerCss が呼ばれ、styleSheet がリセットされ再取得
    Cls.css = ".root{color:blue;}";
    expect(registerCssMock).toHaveBeenLastCalledWith(123, ".root{color:blue;}");
    const s3 = Cls.styleSheet;
    expect(s3).not.toBe(s1);
    expect(getStyleSheetByIdMock).toHaveBeenCalledTimes(2);
  });

  it("エンジン生成とライフサイクル委譲/各アクセサ", () => {
    // jsdom では HTMLElement を直接 new できないため、ベースをプレーンなクラスに差し替える
    getBaseClassMock.mockReturnValueOnce(class {} as any);

    const Cls = createComponentClass(makeData());
    const inst = new (Cls as any)();

    // createComponentEngine が呼ばれ setup 実行
    expect(createComponentEngineMock).toHaveBeenCalledTimes(1);
    expect(setupSpy).toHaveBeenCalled();

    // lifecycle 委譲
    inst.connectedCallback();
    expect(connectedSpy).toHaveBeenCalled();
    inst.disconnectedCallback();
    expect(disconnectedSpy).toHaveBeenCalled();

    // state / isStructive / waitForInitialize
    expect(inst.state).toBe(engineObj.stateInput);
    expect(inst.isStructive).toBe(true);
    engineObj.stateClass = {} as any;
    expect(inst.isStructive).toBe(false);
    engineObj.stateClass = { $isStructive: true } as any;
    expect(inst.waitForInitialize).toBe(engineObj.waitForInitialize);

    // bindings の委譲
    expect(inst.getBindingsFromChild({ tagName: "X-NONE" } as any)).toBeNull();
    const child: any = { tagName: "X-CHILD" };
    const bindingsSet = new Set<any>([{ id: 1 }]);
    engineObj.bindingsByComponent.set(child, bindingsSet);
    expect(inst.getBindingsFromChild(child)).toBe(bindingsSet);

    // child register/unregister の委譲
    inst.registerChildComponent(child);
    expect(registerChildSpy).toHaveBeenCalledWith(child);
    inst.unregisterChildComponent(child);
    expect(unregisterChildSpy).toHaveBeenCalledWith(child);

    // parentStructiveComponent は初回のみ探索
    const p1 = inst.parentStructiveComponent;
    const p2 = inst.parentStructiveComponent;
    expect(p1).toBe(p2);
    expect(findStructiveParentMock).toHaveBeenCalledTimes(1);
  });

  it("define は extends あり/なしで customElements.define の引数が変わる", () => {
    const defineSpy = vi.spyOn(customElements, "define").mockImplementation(() => undefined as any);

    // extends あり
    getComponentConfigMock.mockReturnValueOnce({ extends: "button" });
    getBaseClassMock.mockReturnValueOnce(HTMLButtonElement as any);
    const WithExt = createComponentClass(makeData());
    WithExt.define("x-with-ext-cc");
    expect(defineSpy).toHaveBeenCalledWith("x-with-ext-cc", WithExt, { extends: "button" });

    // extends なし
    getComponentConfigMock.mockReturnValueOnce({});
    getBaseClassMock.mockReturnValueOnce(HTMLElement as any);
    const NoExt = createComponentClass(makeData());
    NoExt.define("x-no-ext-cc");
    expect(defineSpy).toHaveBeenCalledWith("x-no-ext-cc", NoExt);
  });

  it("filters が提供される (input/output)", () => {
    const Cls = createComponentClass(makeData());
    expect(typeof (Cls as any).inputFilters.eq).toBe("function");
    expect(typeof (Cls as any).outputFilters.uc).toBe("function");
  });
});
