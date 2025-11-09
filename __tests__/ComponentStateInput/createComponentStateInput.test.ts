import { describe, it, expect, vi } from "vitest";
import { createComponentStateInput } from "../../src/ComponentStateInput/createComponentStateInput";
import { AssignStateSymbol, NotifyRedrawSymbol } from "../../src/ComponentStateInput/symbols";
import { IListIndex } from "../../src/ListIndex/types";
import { getStructuredPathInfo } from "../../src/StateProperty/getStructuredPathInfo";
import { getStatePropertyRef } from "../../src/StatePropertyRef/StatepropertyRef";

function createListIndex(overrides: Partial<IListIndex> = {}): IListIndex {
  return {
    parentListIndex: overrides.parentListIndex ?? null,
    id: overrides.id ?? 0,
    sid: overrides.sid ?? `test-list-${Math.random().toString(36).slice(2)}`,
    position: overrides.position ?? 0,
    length: overrides.length ?? 0,
    index: overrides.index ?? 0,
    version: overrides.version ?? 0,
    dirty: overrides.dirty ?? false,
    indexes: overrides.indexes ?? [],
    listIndexes: overrides.listIndexes ?? ([] as unknown as WeakRef<IListIndex>[]),
    varName: overrides.varName ?? "item",
    at: overrides.at ?? (() => null),
  };
}

describe("createComponentStateInput", () => {
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

    // createUpdater をスパイし、渡される関数内で SetByRefSymbol が呼ばれるのを検証
    const { SetByRefSymbol } = await import("../../src/StateClass/symbols");
    const updateMod = await import("../../src/Updater/Updater");
    const calls: any[] = [];
    const spy = vi.spyOn(updateMod, "createUpdater");
    spy.mockImplementation(async (_engine: any, cb: any) => {
      const updater = {
        update: vi.fn(async (_loop: any, fn: any) => {
          const stateProxy = {
            [SetByRefSymbol]: vi.fn((ref: any, value: any) => {
              calls.push({ ref, value });
            }),
          } as any;
          await fn(stateProxy, {} as any);
        }),
      };
      await cb(updater);
    });

    const input = createComponentStateInput(engine, binding);
    input[AssignStateSymbol]({ "a.b": 1, "x.y": 2 });

    expect(calls).toHaveLength(2);
    expect(calls[0].value).toBe(1);
    expect(calls[1].value).toBe(2);

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
    const enqueued: any[] = [];
    const spy = vi.spyOn(updateMod, "createUpdater");
    spy.mockImplementation(async (_engine: any, cb: any) => {
      const updater = {
        enqueueRef: vi.fn((ref: any) => {
          enqueued.push(ref);
        }),
      };
      await cb(updater);
    });

    const input = createComponentStateInput(engine, binding);
    const parentInfo = getStructuredPathInfo("parent.values.*.foo");
    const childInfo = getStructuredPathInfo("child.values.*.foo");
    const atIndex = childInfo.wildcardCount - 1;

    const parentListIndex = createListIndex({ sid: "parent-list" });
    const childListIndex = createListIndex({ sid: "child-list", parentListIndex });
    parentListIndex.at = (position: number) => (position === atIndex ? childListIndex : null);

    const ref1 = getStatePropertyRef(parentInfo, parentListIndex); // 対象
    const ref2 = getStatePropertyRef(childInfo, null); // 対象外（try-catch の catch 側）

    input[NotifyRedrawSymbol]([ref1, ref2]);

    expect(enqueued).toHaveLength(1);
    expect(enqueued[0].info.pattern.startsWith("child.")).toBe(true);

    spy.mockRestore();
  });

  it("NotifyRedrawSymbol: ワイルドカード無しのパスも enqueueRef に積む", async () => {
    const engine = {
      getPropertyValue: vi.fn(() => 7),
    } as any;
    const binding = {
      toChildPathFromParentPath: vi.fn((p: string) => p.replace(/^parent\./, "child.")),
    } as any;

    const updateMod = await import("../../src/Updater/Updater");
    const enqueued: any[] = [];
    const spy = vi.spyOn(updateMod, "createUpdater");
    spy.mockImplementation(async (_engine: any, cb: any) => {
      const updater = {
        enqueueRef: vi.fn((ref: any) => {
          enqueued.push(ref);
        }),
      };
      await cb(updater);
    });

    const input = createComponentStateInput(engine, binding);
    const parentInfo = getStructuredPathInfo("parent.profile.name");
    const childInfo = getStructuredPathInfo("child.profile.name");
    const parentRef = getStatePropertyRef(parentInfo, null);

    input[NotifyRedrawSymbol]([parentRef]);

    expect(enqueued).toHaveLength(1);
    expect(enqueued[0].info.pattern).toBe(childInfo.pattern);

    spy.mockRestore();
  });

  it("NotifyRedrawSymbol: listIndex が無い場合は raiseError", async () => {
    const engine = {
      getPropertyValue: vi.fn(() => 0),
    } as any;
    const binding = {
      toChildPathFromParentPath: vi.fn((p: string) => p.replace(/^parent\./, "child.")),
    } as any;

    const updateMod = await import("../../src/Updater/Updater");
    const spy = vi.spyOn(updateMod, "createUpdater");
    spy.mockImplementation((_engine: any, cb: any) => {
      const updater = { enqueueRef: vi.fn() };
      cb(updater);
    });

    const input = createComponentStateInput(engine, binding);
    const parentInfo = getStructuredPathInfo("parent.values.*.foo");
    const parentRef = getStatePropertyRef(parentInfo, null);

    expect(() => input[NotifyRedrawSymbol]([parentRef])).toThrow(/ListIndex not found/);

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
