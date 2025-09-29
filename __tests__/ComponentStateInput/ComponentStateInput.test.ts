import { describe, it, expect, vi } from "vitest";
import { createComponentStateInput } from "../../src/ComponentStateInput/createComponentStateInput";
import { AssignStateSymbol, NotifyRedrawSymbol } from "../../src/ComponentStateInput/symbols";
import { getStructuredPathInfo } from "../../src/StateProperty/getStructuredPathInfo";
import { getStatePropertyRef } from "../../src/StatePropertyRef/StatepropertyRef";

describe("ComponentStateInput", () => {
  it("get/set 経由で engine.getPropertyValue / setPropertyValue が呼ばれる", () => {
    const engine = {
      getPropertyValue: vi.fn(() => 42),
      setPropertyValue: vi.fn(() => true),
    } as any;
    const binding = {
      toChildPathFromParentPath: vi.fn((p: string) => p.replace(/^parent\./, "child.")),
    } as any;

    const input = createComponentStateInput(engine, binding);

    const v = input["user.name"]; // get trap
    expect(v).toBe(42);
    expect(engine.getPropertyValue).toHaveBeenCalledTimes(1);

    input["user.name"] = "Bob"; // set trap
    expect(engine.setPropertyValue).toHaveBeenCalledTimes(1);
  });

  it("AssignStateSymbol: 複数キーを SetByRefSymbol で更新する", async () => {
    const engine = {
      getPropertyValue: vi.fn(() => 0),
      setPropertyValue: vi.fn(),
    } as any;
    const binding = {} as any;

    // update をスパイし、渡される関数内で SetByRefSymbol が呼ばれるのを検証
    const { update } = await import("../../src/Updater/Updater");
    const { SetByRefSymbol } = await import("../../src/StateClass/symbols");
    const updateMod = await import("../../src/Updater/Updater");
    const spy = vi.spyOn(updateMod, "update");
    spy.mockImplementation(async (_engine: any, _node: any, fn: any) => {
      const setByRef = vi.fn();
      const stateProxy = { [SetByRefSymbol]: setByRef } as any;
      await fn({}, stateProxy);
      // 2キー渡して2回呼ばれる
      expect(setByRef).toHaveBeenCalledTimes(2);
    });

    const input = createComponentStateInput(engine, binding);
    input[AssignStateSymbol]({ "a.b": 1, "x.y": 2 });

    spy.mockRestore();
  });

  it("NotifyRedrawSymbol: 対象外パスは無視、対象は enqueueRef に積む", async () => {
    const engine = {
      getPropertyValue: vi.fn(() => 99),
    } as any;
    const binding = {
      toChildPathFromParentPath: vi.fn((p: string) => {
        if (p.startsWith("parent.")) return p.replace(/^parent\./, "child.");
        throw new Error("not match");
      }),
    } as any;

    const updateMod = await import("../../src/Updater/Updater");
    const spy = vi.spyOn(updateMod, "update");
    spy.mockImplementation(async (_engine: any, _node: any, fn: any) => {
      const enq = vi.fn();
      const updater = { enqueueRef: enq } as any;
      await fn(updater, {} as any);
      expect(enq).toHaveBeenCalledTimes(1);
      const calledRef = enq.mock.calls[0][0];
      expect(calledRef.info.pattern.startsWith("child.")).toBe(true);
    });

    const input = createComponentStateInput(engine, binding);
    const parentInfo = getStructuredPathInfo("parent.values.*.foo");
    const childInfo = getStructuredPathInfo("child.values.*.foo");
    const ref1 = getStatePropertyRef(parentInfo, null); // 対象
    const ref2 = getStatePropertyRef(childInfo, null); // 対象外（try-catch の catch 側）

    input[NotifyRedrawSymbol]([ref1, ref2]);

    spy.mockRestore();
  });

  it("未対応のプロパティキーは raiseError", () => {
    const engine = {
      getPropertyValue: vi.fn(() => 0),
      setPropertyValue: vi.fn(),
    } as any;
    const binding = {} as any;
    const input = createComponentStateInput(engine, binding);

    // 数値キーは文字列化されるため例外にならない。未対応判定を通すには未知のシンボルを使う
    const unknown = Symbol("unknown-key");
    expect(() => (input as any)[unknown]).toThrow(/not supported/);
    expect(() => ((input as any)[unknown] = 1)).toThrow(/not supported/);
  });
});
