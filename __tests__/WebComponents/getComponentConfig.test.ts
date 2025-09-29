/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { getComponentConfig } from "../../src/WebComponents/getComponentConfig";

vi.mock("../../src/WebComponents/getGlobalConfig", () => ({
  getGlobalConfig: () => ({ enableShadowDom: true }),
}));

describe("WebComponents/getComponentConfig", () => {
  it("ユーザ未指定はグローバル設定を採用し、enableWebComponents は true", () => {
    const conf = getComponentConfig({} as any);
    expect(conf.enableWebComponents).toBe(true);
    expect(conf.enableShadowDom).toBe(true);
    expect(conf.extends).toBeNull();
  });

  it("ユーザ指定が優先される", () => {
    const conf = getComponentConfig({ enableWebComponents: false, enableShadowDom: false, extends: "button" } as any);
    expect(conf.enableWebComponents).toBe(false);
    expect(conf.enableShadowDom).toBe(false);
    expect(conf.extends).toBe("button");
  });
});
