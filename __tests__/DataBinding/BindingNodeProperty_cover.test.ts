import { describe, it, expect, vi } from "vitest";
import { createBindingNodeProperty } from "../../src/DataBinding/BindingNode/BindingNodeProperty";
import { createEngineStub, createRendererStub, createBindingStub } from "./helpers/bindingNodeHarness";
import * as UpdaterMod from "../../src/Updater/Updater";

describe("BindingNodeProperty coverage", () => {
  it("双方向: defaultName 一致 + input で onInput（デコレータ無し）", async () => {
    const engine = createEngineStub();
    const input = document.createElement("input");
    input.type = "text";
    const binding = createBindingStub(engine, input);
    // filteredValue は現在の input.value を通す（空 -> ""）
    binding.bindingState.getFilteredValue.mockImplementation(() => input.value);
    // update のスタブ（即時コールバック）
    const spyUpdate = vi.spyOn(UpdaterMod, "update").mockImplementation(async (_e: any, _lc: any, cb: any) => {
      await cb({} as any, {} as any);
    });

    const node = createBindingNodeProperty("value", [], [])(binding, input, engine.inputFilters);
    const renderer = createRendererStub({ readonlyState: {} });
    // applyChange: state -> DOM
    input.value = "";
    binding.bindingState.getFilteredValue.mockReturnValue("hello");
    node.applyChange(renderer);
    expect(input.value).toBe("hello");

    // DOM -> state: input イベントで update 経由の更新が呼ばれる
    binding.updateStateValue = vi.fn();
    input.value = "world";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(spyUpdate).toHaveBeenCalled();
    expect(binding.updateStateValue).toHaveBeenCalledWith(expect.anything(), "world");
  });

  it("デコレータ指定 onChange で発火、NaN は空文字でセット", async () => {
    const engine = createEngineStub();
    const input = document.createElement("input");
    const binding = createBindingStub(engine, input);
    const spyUpdate = vi.spyOn(UpdaterMod, "update").mockImplementation(async (_e: any, _lc: any, cb: any) => { await cb({} as any, {} as any); });

    const node = createBindingNodeProperty("value", [], ["onChange"]) (binding, input, engine.inputFilters);
    const renderer = createRendererStub({ readonlyState: {} });

    // NaN -> ""
    binding.bindingState.getFilteredValue.mockReturnValue(Number.NaN);
    node.applyChange(renderer);
    expect(input.value).toBe("");

    // change 発火
    binding.updateStateValue = vi.fn();
    input.value = "x";
    // 装飾子 "onChange" はコンストラクタで "Change" に変換される実装
    input.dispatchEvent(new Event("Change", { bubbles: true }));
    expect(spyUpdate).toHaveBeenCalled();
    expect(binding.updateStateValue).toHaveBeenCalledWith(expect.anything(), "x");
  });

  it("defaultName 不一致のためイベント登録されない（readonly）", async () => {
    const engine = createEngineStub();
    const input = document.createElement("input");
    const binding = createBindingStub(engine, input);
    const node = createBindingNodeProperty("checked", [], [])(binding, input, engine.inputFilters);
    // change を発火させても update は呼ばれない
    const spyUpdate = vi.spyOn(UpdaterMod, "update").mockImplementation(async (_e: any, _lc: any, cb: any) => { await cb({} as any, {} as any); });
    input.dispatchEvent(new Event("change", { bubbles: true }));
    expect(spyUpdate).not.toHaveBeenCalled();
  });

  it("HTMLElement 以外（コメントノード）はイベント登録されない", () => {
    const engine = createEngineStub();
    const comment = document.createComment("@@|v");
    const binding = createBindingStub(engine, comment);
    const node = createBindingNodeProperty("value", [], [])(binding, comment, engine.inputFilters);
    // applyChange 経由で代入時に型的に無視されることを確認
    binding.bindingState.getFilteredValue.mockReturnValue("a");
    // applyChange は assignValue まで通るが、コメントノードにはプロパティが無いため無視
    // ここでは例外が出ないことのみを確認
    const renderer = createRendererStub({ readonlyState: {} });
    expect(() => node.applyChange(renderer)).not.toThrow();
  });
});
