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
