import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MainWrapper } from "../../src/MainWrapper/MainWrapper";
import { config } from "../../src/WebComponents/getGlobalConfig";

// ユニークなタグ名で毎回サブクラスを登録し、jsdom の Custom Elements 制約を回避
let seq = 0;
function createMainWrapperElement(): InstanceType<typeof MainWrapper> {
  const tag = `x-main-wrapper-${seq++}`;
  class TestMainWrapper extends MainWrapper {}
  customElements.define(tag, TestMainWrapper);
  return document.createElement(tag) as InstanceType<typeof MainWrapper>;
}

const original = { ...config };

beforeEach(() => {
  // テストごとにデフォルトへ戻す（必要部分のみ上書き）
  config.enableShadowDom = original.enableShadowDom;
  config.enableRouter = original.enableRouter;
  config.routerTagName = original.routerTagName;
  config.layoutPath = ""; // layout 無しのデフォルト
});

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("MainWrapper", () => {
  it("enableShadowDom=true なら shadowRoot に slot と router が入る", async () => {
    config.enableShadowDom = true;
    config.enableRouter = true;
    const el = createMainWrapperElement();
    document.body.appendChild(el);
    // connectedCallback は async。1tick 待つ
    await Promise.resolve();
    const root = el.shadowRoot!;
    expect(root).toBeTruthy();
    // デフォルトレイアウト（<slot name="router">）が入る
  const slotEl1 = root.querySelector('slot[name="router"]') as HTMLSlotElement | null;
  expect(slotEl1).toBeTruthy();
  expect(slotEl1!.tagName.toLowerCase()).toBe("slot");
    // render で router 要素が追加される（slot 属性が付与される）
    const inserted = root.querySelector('[slot="router"]') as HTMLElement;
    expect(inserted).toBeTruthy();
    expect(inserted.tagName.toLowerCase()).toBe(config.routerTagName);
  });

  it("enableShadowDom=false なら light DOM に描画される", async () => {
    config.enableShadowDom = false;
    config.enableRouter = true;
    const el = createMainWrapperElement();
    document.body.appendChild(el);
    await Promise.resolve();
    const root = el; // light DOM
    // デフォルトレイアウトの slot が入る
  const slotEl2 = root.querySelector('slot[name="router"]') as HTMLSlotElement | null;
  expect(slotEl2).toBeTruthy();
  expect(slotEl2!.tagName.toLowerCase()).toBe("slot");
    // router が light DOM 直下に追加される
    const inserted = root.querySelector('[slot="router"]') as HTMLElement;
    expect(inserted).toBeTruthy();
    expect(inserted.tagName.toLowerCase()).toBe(config.routerTagName);
  });

  it("layoutPath 指定時: fetch 成功で <template> の中身を展開してから router を追加", async () => {
    config.enableShadowDom = true;
    config.enableRouter = true;
    config.layoutPath = "/layout.html";
    const html = `<template><div class="layout"><slot name="router"></slot></div></template>`; // style は入れない（adoptedStyleSheets 分岐を避ける）
    vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: true, text: async () => html } as any);
    const el = createMainWrapperElement();
    // connectedCallback に頼らず、明示的にロード＆レンダリングを行う
    await el.loadLayout();
    el.render();
    document.body.appendChild(el);
    const root = el.shadowRoot!;
    // テンプレート展開部が存在
    expect(root.querySelector('.layout')).toBeTruthy();
    // router も追加される
    const inserted = root.querySelector('[slot="router"]') as HTMLElement;
    expect(inserted).toBeTruthy();
    expect(inserted.tagName.toLowerCase()).toBe(config.routerTagName);
  });

  it("layoutPath 指定時: style を adoptedStyleSheets に追加する", async () => {
    config.enableShadowDom = true;
    config.enableRouter = false;
    config.layoutPath = "/layout-with-style.html";

    const html = `<template><div class="layout"></div></template><style id="layout-style"></style>`;
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(() =>
        Promise.resolve({ ok: true, text: () => Promise.resolve(html) }) as any
      );

    const el = createMainWrapperElement();
    const root = el.shadowRoot!;
    let adoptedSheets: any[] = [];
    Object.defineProperty(root, "adoptedStyleSheets", {
      configurable: true,
      get: () => adoptedSheets,
      set: (value) => {
        adoptedSheets = value as any[];
      }
    });

    await el.loadLayout();

    expect(fetchMock).toHaveBeenCalledWith(config.layoutPath);
    expect(root.querySelector(".layout")).toBeTruthy();
    expect(adoptedSheets).toHaveLength(1);
    const sheetElement = adoptedSheets[0] as HTMLElement;
    expect(sheetElement).toBeInstanceOf(HTMLElement);
    expect(sheetElement.tagName.toLowerCase()).toBe("style");
  });

  it("layoutPath 指定時: 既存 style が含まれていれば adoptedStyleSheets を更新しない", async () => {
    config.enableShadowDom = true;
    config.enableRouter = false;
    config.layoutPath = "/layout-with-style.html";

  const html = `<style></style>`;
    vi.spyOn(globalThis, "fetch").mockImplementation(() =>
      Promise.resolve({ ok: true, text: () => Promise.resolve(html) }) as any
    );

    const el = createMainWrapperElement();
    const root = el.shadowRoot!;
    const fakeSheets = { includes: vi.fn().mockReturnValue(true) };
    const setter = vi.fn();
    Object.defineProperty(root, "adoptedStyleSheets", {
      configurable: true,
      get: () => fakeSheets as any,
      set: setter
    });

    await el.loadLayout();

    expect(fakeSheets.includes).toHaveBeenCalledTimes(1);
    expect(setter).not.toHaveBeenCalled();
  });

  it("layoutPath 指定時: template が存在しない場合は DocumentFragment を追加する", async () => {
    config.enableShadowDom = true;
    config.enableRouter = false;
    config.layoutPath = "/layout-without-template.html";

    const html = `<div class="no-template"></div>`;
    vi.spyOn(globalThis, "fetch").mockImplementation(() =>
      Promise.resolve({ ok: true, text: () => Promise.resolve(html) }) as any
    );

    const el = createMainWrapperElement();
    const root = el.shadowRoot!;
    const appendSpy = vi.spyOn(root, "appendChild");

    await el.loadLayout();

    expect(appendSpy).toHaveBeenCalled();
    const appended = appendSpy.mock.calls[0][0];
    expect(appended).toBeInstanceOf(DocumentFragment);
    expect((appended as DocumentFragment).childNodes.length).toBe(0);
  });

  it("layoutPath 指定時: Shadow DOM 無効でも layout と style を適用する", async () => {
    config.enableShadowDom = false;
    config.enableRouter = false;
    config.layoutPath = "/layout-light.html";

    const html = `<template><section class="light"></section></template><style id="light-style"></style>`;
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(() =>
      Promise.resolve({ ok: true, text: () => Promise.resolve(html) }) as any
    );

    let adopted: any[] = [];
    const descriptor = {
      configurable: true,
      get: () => adopted,
      set: (value: any) => {
        adopted = value as any[];
      }
    };
    Object.defineProperty(document, "adoptedStyleSheets", descriptor);

    try {
      const el = createMainWrapperElement();
      await el.loadLayout();

      expect(fetchMock).toHaveBeenCalledWith(config.layoutPath);
      expect(el.querySelector(".light")).toBeTruthy();
      expect(adopted).toHaveLength(1);
      const sheetElement = adopted[0] as HTMLElement;
      expect(sheetElement).toBeInstanceOf(HTMLElement);
      expect(sheetElement.tagName.toLowerCase()).toBe("style");
    } finally {
      delete (document as any).adoptedStyleSheets;
    }
  });

  it("layoutPath 指定時: fetch 失敗でエラーを投げる", async () => {
    config.enableShadowDom = true;
    config.layoutPath = "/bad.html";
    vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: false } as any);
    const el = createMainWrapperElement();
    // connectedCallback 内の await を直接呼ぶ
    await expect(el.loadLayout()).rejects.toThrow("Failed to load layout from ");
  });

  it("enableRouter=false なら router を追加しない", async () => {
    config.enableShadowDom = true;
    config.enableRouter = false;
    const el = createMainWrapperElement();
    document.body.appendChild(el);
    await Promise.resolve();
    const root = el.shadowRoot!;
    // [slot="router"] は存在しない（slot 要素は name 属性なのでヒットしない）
    expect(root.querySelector('[slot="router"]')).toBeNull();
  });

  it("routerTagName を変更した場合、そのタグが挿入される", async () => {
    config.enableShadowDom = true;
    config.enableRouter = true;
    config.routerTagName = "my-router";
    const el = createMainWrapperElement();
    document.body.appendChild(el);
    await Promise.resolve();
    const root = el.shadowRoot!;
    const inserted = root.querySelector('[slot="router"]') as HTMLElement;
    expect(inserted.tagName.toLowerCase()).toBe("my-router");
  });
});
