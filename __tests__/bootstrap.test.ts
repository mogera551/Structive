import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// モジュールモック（loadFromImportMap）
const loadMock = vi.fn(async () => {});
vi.mock("../src/WebComponents/loadFromImportMap.js", () => ({
  loadFromImportMap: () => loadMock(),
}));
vi.mock("../src/WebComponents/loadFromImportMap", () => ({
  loadFromImportMap: () => loadMock(),
}));

// bootstrap を後から import（モック適用後）
import { bootstrap } from "../src/bootstrap";
import { config } from "../src/WebComponents/getGlobalConfig";

describe("bootstrap", () => {
  const orig = { ...config };
  let defineSpy: any;

  beforeEach(() => {
    // customElements.define をスパイ
    defineSpy = vi.spyOn(customElements, "define");
    loadMock.mockClear();
  });

  afterEach(() => {
    defineSpy.mockRestore();
    // config を元に戻す
    Object.assign(config, orig);
    // DOM クリーンアップ（追加した main 要素など）
    document.body.innerHTML = "";
  });

  it("autoLoadFromImportMap が true のとき loadFromImportMap を呼ぶ", async () => {
    Object.assign(config, { autoLoadFromImportMap: true, enableRouter: false, enableMainWrapper: false });
    await bootstrap();
    expect(loadMock).toHaveBeenCalled();
  });

  it("enableRouter が true のとき routerTagName で define される", async () => {
    const tag = `view-router-${Date.now()}`;
    Object.assign(config, { enableRouter: true, routerTagName: tag, enableMainWrapper: false, autoLoadFromImportMap: false });
    await bootstrap();
    // 定義呼び出し検証
    const called = defineSpy.mock.calls.some((args:any[]) => args[0] === tag);
    expect(called).toBe(true);
  });

  it("enableMainWrapper が true のとき mainTagName で define され、autoInsertMainWrapper で body に追加", async () => {
    const tag = `app-main-${Date.now()}`;
    Object.assign(config, { enableRouter: false, enableMainWrapper: true, mainTagName: tag, autoInsertMainWrapper: true });
    await bootstrap();
    const called = defineSpy.mock.calls.some((args:any[]) => args[0] === tag);
    expect(called).toBe(true);
    // 末尾が追加したタグになっていること
    const last = document.body.lastElementChild as HTMLElement | null;
    expect(last).not.toBeNull();
    expect(last!.tagName.toLowerCase()).toBe(tag);
  });
});
