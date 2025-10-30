import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Router, entryRoute, getRouter } from "../../src/Router/Router";

// jsdom 環境で customElements を使えるように
beforeEach(() => {
  // ルート定義をクリアする術がないため、テストごとに新たなタグを使って衝突回避
});

afterEach(() => {
  document.body.innerHTML = "";
  document.head.querySelectorAll("base").forEach(el => el.remove());
  history.pushState({}, "", "/");
});

function define(tag: string) {
  if (!customElements.get(tag)) {
    customElements.define(tag, class extends HTMLElement {});
  }
}

let routerSeq = 0;
function createRouterElement(): InstanceType<typeof Router> {
  const tag = `x-router-${routerSeq++}`;
  if (!customElements.get(tag)) {
    class TestRouter extends Router {}
    customElements.define(tag, TestRouter);
  }
  return document.createElement(tag) as InstanceType<typeof Router>;
}

describe("Router", () => {
  it("base タグから basePath を取り出す", () => {
    const base = document.createElement("base");
    base.href = `${window.location.origin}/app/`;
    document.head.appendChild(base);
    const el = createRouterElement();
    document.body.appendChild(el);
    expect(el.basePath).toBe("/app/");
    document.body.removeChild(el);
  });

  it("getRouter は connectedCallback 後に自身を返し、disconnectedCallback 後は null", () => {
    const el = createRouterElement();
    document.body.appendChild(el);
    expect(getRouter()).toBe(el);
    document.body.removeChild(el);
    expect(getRouter()).toBeNull();
  });

  it("popstate で render が呼ばれる", () => {
    const el = createRouterElement();
    const renderSpy = vi.spyOn(el, "render");
    document.body.appendChild(el);
    // connectedCallback 内で popstate dispatch 済みだが、明示的にも発火
    window.dispatchEvent(new Event("popstate"));
    expect(renderSpy).toHaveBeenCalled();
    document.body.removeChild(el);
  });

  it("popstateHandler は preventDefault 後に render を呼ぶ", () => {
    const el = createRouterElement();
    const renderSpy = vi.spyOn(el, "render");
    document.body.appendChild(el);
    const prevent = vi.fn();
    el.popstateHandler({ preventDefault: prevent } as unknown as PopStateEvent);
    expect(prevent).toHaveBeenCalled();
    expect(renderSpy).toHaveBeenCalled();
    document.body.removeChild(el);
  });

  it("entryRoute: 'routes:' プレフィックスは除去される", () => {
    const tag = "x-routes-prefix";
    define(tag);
    entryRoute(tag, "routes:/x");
    const el = createRouterElement();
    document.body.appendChild(el);
    // 404 から開始しないようにパス調整
    history.pushState({}, "", "/x");
    el.render();
    const child = el.querySelector(`[slot="content"]`);
    // 定義済みルートに一致し、404でない
    expect(child?.tagName.toLowerCase()).toBe(tag);
    document.body.removeChild(el);
  });

  it("ルート一致でカスタム要素が生成され、data-state にパラメータが入る", () => {
    const tag = "x-user";
    define(tag);
    entryRoute(tag, "/user/:id");
    const el = createRouterElement();
    document.body.appendChild(el);
    history.pushState({}, "", "/user/42");
    el.render();
    const child = el.querySelector(tag) as HTMLElement;
    expect(child).toBeTruthy();
    expect(child.getAttribute("slot")).toBe("content");
    const state = JSON.parse(child.getAttribute("data-state") || "{}");
    expect(state).toEqual({ id: "42" });
    document.body.removeChild(el);
  });

  it("一致なしでは 404 表示になる", () => {
    const el = createRouterElement();
    document.body.appendChild(el);
    history.pushState({}, "", "/no-match");
    el.render();
    const child = el.querySelector(`[slot="content"]`);
    expect(child?.tagName.toLowerCase()).toBe("h1");
    expect(child?.textContent).toBe("404 Not Found");
    document.body.removeChild(el);
  });

  it("navigate は basePath を考慮して pushState し、render する", () => {
    const el = createRouterElement();
    document.body.appendChild(el);
    const renderSpy = vi.spyOn(el, "render");
    const pushSpy = vi.spyOn(history, "pushState");
    el.basePath = "/app/"; // base がある前提
    el.navigate("/users");
    expect(pushSpy).toHaveBeenCalled();
    expect(window.location.pathname.endsWith("/app/users")).toBe(true);
    expect(renderSpy).toHaveBeenCalled();
    document.body.removeChild(el);
  });

  it("navigate は / で始まらないパスの場合そのまま pushState する", () => {
    const el = createRouterElement();
    document.body.appendChild(el);
    const pushSpy = vi.spyOn(history, "pushState");
    el.navigate("relative-path");
    expect(pushSpy).toHaveBeenCalledWith({}, "", "relative-path");
    document.body.removeChild(el);
  });

  it("lazy-load ルートは isLazyLoadComponent=true なら loadLazyLoadComponent を呼ぶ", async () => {
    const tag = "x-lazy";
    define(tag);
    // isLazyLoadComponent/ loadLazyLoadComponent をモック
    const isLazy = vi.fn().mockReturnValue(true);
    const loadLazy = vi.fn();
    // 既存モジュールキャッシュをクリアしてからモック → 再インポート
    vi.resetModules();
    vi.doMock("../../src/WebComponents/loadFromImportMap", () => ({
      isLazyLoadComponent: (t: string) => isLazy(t),
      loadLazyLoadComponent: (t: string) => loadLazy(t),
    }));
    // ルーターの再読み込み（モック反映版を取得）
    const { Router: MockedRouter, entryRoute: mockedEntry } = await import("../../src/Router/Router");
    mockedEntry(tag, "/lazy");
    const lazyTag = `x-router-lazy-${routerSeq++}`;
    if (!customElements.get(lazyTag)) {
      customElements.define(lazyTag, MockedRouter as unknown as CustomElementConstructor);
    }
    const el = document.createElement(lazyTag) as InstanceType<typeof MockedRouter>;
    document.body.appendChild(el);
    history.pushState({}, "", "/lazy");
    el.render();
    expect(isLazy).toHaveBeenCalledWith(tag);
    expect(loadLazy).toHaveBeenCalledWith(tag);
    document.body.removeChild(el);
  });

  it("location の末尾が originalFileName と一致する場合に末尾空文字へ置換する", () => {
    const el = createRouterElement();
    document.body.appendChild(el);
    el.originalFileName = "index.html";
    history.pushState({}, "", "/index.html");
    el.render();
    const slotContent = el.querySelector('[slot="content"]');
    // 404 表示を確認（ルート未登録かつ originalFileName 分岐経由）
    expect(slotContent?.textContent).toBe("404 Not Found");
    document.body.removeChild(el);
  });
});
