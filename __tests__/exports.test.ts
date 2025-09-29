import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// 依存モジュールをモック（hoisted で TDZ 回避）
const { regMock, bootMock } = vi.hoisted(() => {
  return {
    regMock: vi.fn(async (_map: Record<string, string>) => {}),
    bootMock: vi.fn(async () => {}),
  };
});
vi.mock("../src/WebComponents/registerSingleFIleComponents.js", () => ({
  registerSingleFileComponents: regMock,
}));
vi.mock("../src/WebComponents/registerSingleFIleComponents", () => ({
  registerSingleFileComponents: regMock,
}));
vi.mock("../src/bootstrap.js", () => ({
  bootstrap: bootMock,
}));
vi.mock("../src/bootstrap", () => ({
  bootstrap: bootMock,
}));

// テスト対象の import（モック適用後）
import { defineComponents, bootstrapStructive, config } from "../src/exports";
import { config as globalConfig } from "../src/WebComponents/getGlobalConfig";

describe("exports.ts", () => {
  const orig = { ...globalConfig };

  beforeEach(() => {
    regMock.mockClear();
    bootMock.mockClear();
    // initialized の影響を避けるためにモジュールリセット
    // ただし、ここでは bootstrapStructive の動作を連続呼び出しで検証したいケースもあるので
    // 個別のテストで resetModules を使う
  });

  afterEach(() => {
    Object.assign(globalConfig, orig);
  });

  it("config は getGlobalConfig() の同一オブジェクトを参照する", () => {
    expect(config).toBe(globalConfig);
    // 一方を変更すればもう一方も反映される
    const key = `__tmp_${Date.now()}` as any;
    (config as any)[key] = 123;
    expect((globalConfig as any)[key]).toBe(123);
    delete (config as any)[key];
  });

  it("defineComponents は registerSingleFileComponents を呼び、autoInit=true で bootstrapStructive を経由して bootstrap を一度呼ぶ", async () => {
    Object.assign(globalConfig, { autoInit: true });
    const map = { A: "/a.js", B: "/b.js" };
    await defineComponents(map);
    expect(regMock).toHaveBeenCalledWith(map);
    expect(bootMock).toHaveBeenCalledTimes(1);

    // 再度 defineComponents を呼んでも bootstrap は一度しか呼ばれない（bootstrapStructive の once ガード）
    await defineComponents(map);
    expect(bootMock).toHaveBeenCalledTimes(1);
  });

  it("autoInit=false のとき defineComponents は bootstrap を呼ばない", async () => {
    Object.assign(globalConfig, { autoInit: false });
    const map = { C: "/c.js" };
    await defineComponents(map);
    expect(regMock).toHaveBeenCalledWith(map);
    expect(bootMock).not.toHaveBeenCalled();
  });

  it("bootstrapStructive は多重呼び出しでも bootstrap は一度だけ", async () => {
    // 前テストで defineComponents(autoInit=true) により initialized が立っている可能性があるため
    // モジュールをリセットし、新しいインスタンスを動的 import して検証する
    vi.resetModules();
    const fresh = await import("../src/exports");
    const { bootstrapStructive: freshBootstrap } = fresh as typeof import("../src/exports");
    Object.assign(globalConfig, { autoInit: false });
    await freshBootstrap();
    await freshBootstrap();
    expect(bootMock).toHaveBeenCalledTimes(1);
  });
});
