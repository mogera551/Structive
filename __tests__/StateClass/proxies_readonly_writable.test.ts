/**
 * @vitest-environment node
 */
import { describe, it, expect, vi } from "vitest";
import { createReadonlyStateProxy } from "../../src/StateClass/createReadonlyStateProxy";
import { useWritableStateProxy } from "../../src/StateClass/useWritableStateProxy";

// trap get のモック（実装に依存しない）
const trapGetReadonlyMock = vi.fn();
vi.mock("../../src/StateClass/traps/getReadonly", () => ({
  getReadonly: (...args: any[]) => trapGetReadonlyMock(...args),
  get: (...args: any[]) => trapGetReadonlyMock(...args),
}));

const trapGetWritableMock = vi.fn();
vi.mock("../../src/StateClass/traps/getWritable", () => ({
  getWritable: (...args: any[]) => trapGetWritableMock(...args),
  get: (...args: any[]) => trapGetWritableMock(...args),
}));

const trapSetMock = vi.fn().mockReturnValue(true);
vi.mock("../../src/StateClass/traps/set", () => ({
  set: (...args: any[]) => trapSetMock(...args)
}));

describe("StateClass proxies", () => {
  it("createReadonlyStateProxy: get は trap を経由し、set はエラー", () => {
    const engine = {} as any;
    const state = { foo: 1 };
    const proxy = createReadonlyStateProxy(engine, state, null);

    trapGetReadonlyMock.mockReturnValue("GOT");

    // get 経由
    // インデックスアクセスで任意プロパティを取得（モックが返した値）
    expect((proxy as any)["any"]).toBe("GOT");

    // set はエラー
    expect(() => {
      (proxy as any)["x"] = 1;
    }).toThrowError(/Cannot set property x of readonly state/);
  });

  it("useWritableStateProxy: get/set が trap 経由で呼ばれる", async () => {
    const engine = {} as any; const updater = {} as any;
    const state = { foo: 1 };

    await useWritableStateProxy(engine, updater, state, null, async (proxy) => {
      trapGetWritableMock.mockReturnValue("WGOT");
      // get
      expect((proxy as any)["k"]).toBe("WGOT");
      // set
      (proxy as any)["k"] = 2;
      expect(trapSetMock).toHaveBeenCalled();
    });
  });
});
