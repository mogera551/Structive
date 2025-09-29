import { describe, it, expect, vi, beforeEach } from "vitest";
import { createComponentStateOutput } from "../../src/ComponentStateOutput/createComponentStateOutput";
import { getStructuredPathInfo } from "../../src/StateProperty/getStructuredPathInfo";
import { getStatePropertyRef } from "../../src/StatePropertyRef/StatepropertyRef";
import type { IComponentStateBinding } from "../../src/ComponentStateBinding/types";
import * as Updater from "../../src/Updater/Updater";
import { SetByRefSymbol } from "../../src/StateClass/symbols";

// テスト用の簡易バインディングモックを構築
function makeBindingMock(opts?: {
  childPattern?: string;
  parentFromChild?: (child: string) => string;
}) {
  const childPattern = opts?.childPattern ?? "child.values.*.foo";
  const childInfo = getStructuredPathInfo(childPattern);
  const childPath = childInfo.pattern; // startsWith 判定に使うキー
  const bindingByChildPath = new Map<string, any>();

  const engine = {
    getPropertyValue: vi.fn(() => "PARENT_VALUE"),
    getListIndexes: vi.fn(() => [{ sid: "LI#X", at: () => null }]),
  } as any;

  const fakeBinding: any = {
    engine,
    bindingState: { listIndex: [{ sid: "LI#A", at: () => null }] },
  };
  bindingByChildPath.set(childPath, fakeBinding);

  const binding: IComponentStateBinding & any = {
    startsWithByChildPath: vi.fn((pi: any) => (pi.pattern.startsWith("child.values") ? childPath : null)),
    toParentPathFromChildPath: vi.fn((p: string) => (opts?.parentFromChild ? opts.parentFromChild(p) : p.replace(/^child\./, "parent."))),
    bindingByChildPath,
  };
  return { binding, engine, childInfo, childPath, fakeBinding };
}

describe("ComponentStateOutput", () => {
  let binding: IComponentStateBinding & any;
  let engine: any;
  let childInfo: any;
  let fakeBinding: any;

  beforeEach(() => {
    const m = makeBindingMock();
    binding = m.binding;
    engine = m.engine;
    childInfo = m.childInfo;
    fakeBinding = m.fakeBinding;
  });

  it("startsWith: 子側パターンにマッチすると true", () => {
    const out = createComponentStateOutput(binding);
    expect(out.startsWith(childInfo)).toBe(true);

    const other = getStructuredPathInfo("other.path");
    expect(out.startsWith(other)).toBe(false);
  });

  it("get: 子ref -> 親ref に変換して engine.getPropertyValue を呼ぶ（listIndex は childRef が優先、なければ bindingState.listIndex）", () => {
    const out = createComponentStateOutput(binding);
    // child 側の ref（listIndex なし）
    const childRefNoLI = getStatePropertyRef(childInfo, null);
    const v1 = out.get(childRefNoLI);
    expect(v1).toBe("PARENT_VALUE");
    expect(engine.getPropertyValue).toHaveBeenCalledTimes(1);
    const calledParentRef1 = (engine.getPropertyValue as any).mock.calls[0][0];
    expect(calledParentRef1.info.pattern.startsWith("parent.")).toBe(true);
    // listIndex は bindingState.listIndex が使われる
    expect(calledParentRef1.listIndex).toBe(fakeBinding.bindingState.listIndex);

    // child 側の ref（listIndex あり）
    const childRefWithLI = getStatePropertyRef(childInfo, [{ sid: "LI#B", at: () => null }] as any);
    const v2 = out.get(childRefWithLI);
    expect(v2).toBe("PARENT_VALUE");
    const calledParentRef2 = (engine.getPropertyValue as any).mock.calls[1][0];
    expect(calledParentRef2.listIndex).not.toBe(fakeBinding.bindingState.listIndex);
  });

  it("set: 親ref に変換して update 経由で SetByRefSymbol を叩く", () => {
    const out = createComponentStateOutput(binding);
    // update をスパイして、渡される関数が SetByRefSymbol を叩くことを確認
    const updateSpy = vi.spyOn(Updater, "update");
    updateSpy.mockImplementation(async (_engine: any, _node: any, fn: any) => {
      const setByRef = vi.fn();
      const stateProxy = { [SetByRefSymbol]: setByRef } as any;
      await fn({}, stateProxy);
      expect(setByRef).toHaveBeenCalledTimes(1);
    });

    const childRef = getStatePropertyRef(childInfo, null);
    const ok = out.set(childRef, 123);
    expect(ok).toBe(true);
    expect(updateSpy).toHaveBeenCalledTimes(1);

    updateSpy.mockRestore();
  });

  it("getListIndexes: 親ref に変換して engine.getListIndexes を呼ぶ（listIndex は childRef をそのまま使用）", () => {
    const out = createComponentStateOutput(binding);
    const childRef = getStatePropertyRef(childInfo, [{ sid: "LI#C", at: () => null }] as any);
    const ret = out.getListIndexes(childRef);
    expect(Array.isArray(ret)).toBe(true);
    expect(engine.getListIndexes).toHaveBeenCalledTimes(1);
    const calledParentRef = (engine.getListIndexes as any).mock.calls[0][0];
    // listIndex は childRef のもの
    expect(calledParentRef.listIndex).toBe(childRef.listIndex);
  });

  it("エラー: startsWithByChildPath が null の場合は raiseError", () => {
    const out = createComponentStateOutput({
      ...binding,
      startsWithByChildPath: vi.fn(() => null),
    });
    const childRef = getStatePropertyRef(childInfo, null);
    expect(() => out.get(childRef)).toThrow(/No child path found/);
    expect(() => out.set(childRef, 1)).toThrow(/No child path found/);
    expect(() => out.getListIndexes(childRef)).toThrow(/No child path found/);
  });

  it("エラー: bindingByChildPath に存在しない場合は raiseError", () => {
    // startsWithByChildPath は子側にマッチするが、bindingByChildPath に対応するエントリが無い状況を作る
    const m = makeBindingMock();
    const b2 = {
      ...m.binding,
      // 子側にはマッチさせる
      startsWithByChildPath: vi.fn(() => m.childInfo.pattern),
      // しかしマップは空
      bindingByChildPath: new Map<string, any>(),
    } as any;
    const out = createComponentStateOutput(b2);
    const ref = getStatePropertyRef(childInfo, null);
    expect(() => out.get(ref)).toThrow(/No binding found/);
    expect(() => out.set(ref, 1)).toThrow(/No binding found/);
    expect(() => out.getListIndexes(ref)).toThrow(/No binding found/);
  });
});
