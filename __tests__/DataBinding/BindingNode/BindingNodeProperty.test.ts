import { describe, it, expect, vi } from "vitest";
import { createBindingNodeProperty } from "../../../src/DataBinding/BindingNode/BindingNodeProperty";
import { createBindingStub, createEngineStub, createRendererStub } from "../helpers/bindingNodeHarness";
import * as UpdaterMod from "../../../src/Updater/Updater";
import * as GetDefaultNameMod from "../../../src/BindingBuilder/getDefaultName";

describe("BindingNodeProperty", () => {
  it("デフォルトプロパティと一致しない場合はイベント登録しない", () => {
    const engine = createEngineStub();
    const div = document.createElement("div");
    const addSpy = vi.spyOn(div, "addEventListener");
    const binding = createBindingStub(engine, div);

    createBindingNodeProperty("value", [], [])(binding, div, engine.inputFilters);

    expect(addSpy).not.toHaveBeenCalled();
  });

  it("二方向要素でも defaultName が異なればイベント登録しない", () => {
    const engine = createEngineStub();
    const input = document.createElement("input");
    const addSpy = vi.spyOn(input, "addEventListener");
    const binding = createBindingStub(engine, input);

    createBindingNodeProperty("textContent", [], [])(binding, input, engine.inputFilters);

    expect(addSpy).not.toHaveBeenCalled();
  });

  it("Property: value を反映", () => {
    const engine = createEngineStub();
    const input = document.createElement("input");
    const binding = createBindingStub(engine, input);

    binding.bindingState.getFilteredValue.mockReturnValue("123");

    const node = createBindingNodeProperty("value", [], [])(binding, input, engine.inputFilters);
    const renderer = createRendererStub({ readonlyState: {} });
    node.applyChange(renderer);
    expect((input as HTMLInputElement).value).toBe("123");
  });

  it("双方向: defaultName 一致 + input で onInput（デコレータ無し）", async () => {
    const engine = createEngineStub();
    const input = document.createElement("input");
    input.type = "text";
    const binding = createBindingStub(engine, input);
    binding.bindingState.getFilteredValue.mockImplementation(() => input.value);

    const spyCreateUpdater = vi.spyOn(UpdaterMod, "createUpdater").mockImplementation(async (_engine: any, cb: any) => {
      const updater = {
        update: vi.fn(async (_loop: any, fn: any) => {
          await fn({} as any, {} as any);
        }),
      };
      await cb(updater);
    });

    const node = createBindingNodeProperty("value", [], [])(binding, input, engine.inputFilters);
    const renderer = createRendererStub({ readonlyState: {} });

    input.value = "";
    binding.bindingState.getFilteredValue.mockReturnValue("hello");
    node.applyChange(renderer);
    expect(input.value).toBe("hello");

    binding.updateStateValue = vi.fn();
    input.value = "world";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(spyCreateUpdater).toHaveBeenCalled();
    expect(binding.updateStateValue).toHaveBeenCalledWith(expect.anything(), expect.anything(), "world");
  });

  it("デコレータ指定 onChange で発火、NaN は空文字でセット", async () => {
    const engine = createEngineStub();
    const input = document.createElement("input");
    const binding = createBindingStub(engine, input);
    const spyCreateUpdater = vi.spyOn(UpdaterMod, "createUpdater").mockImplementation(async (_engine: any, cb: any) => {
      const updater = {
        update: vi.fn(async (_loop: any, fn: any) => {
          await fn({} as any, {} as any);
        }),
      };
      await cb(updater);
    });

  const node = createBindingNodeProperty("value", [], ["onchange"])(binding, input, engine.inputFilters);
    const renderer = createRendererStub({ readonlyState: {} });

    binding.bindingState.getFilteredValue.mockReturnValue(Number.NaN);
    node.applyChange(renderer);
    expect(input.value).toBe("");

    binding.bindingState.getFilteredValue.mockReturnValue("abc");
  renderer.updatedBindings.delete(binding);
    node.applyChange(renderer);
    expect(input.value).toBe("abc");

    binding.updateStateValue = vi.fn();
    input.value = "xyz";
    input.dispatchEvent(new Event("change", { bubbles: true }));
    expect(spyCreateUpdater).toHaveBeenCalled();
    expect(binding.updateStateValue).toHaveBeenCalledWith(expect.anything(), expect.anything(), "xyz");
  });

  it("decorates が複数ある場合はエラー", () => {
    const engine = createEngineStub();
    const input = document.createElement("input");
    const binding = createBindingStub(engine, input);

    expect(() => {
      createBindingNodeProperty("value", [], ["oninput", "onchange"])(binding, input, engine.inputFilters);
    }).toThrow(/Has multiple decorators/);
  });

  it("decorates 未指定かつデフォルトイベントが無い場合はイベント登録しない", () => {
    const engine = createEngineStub();
    const span = document.createElement("span");
    const addSpy = vi.spyOn(span, "addEventListener");
    const binding = createBindingStub(engine, span);

    createBindingNodeProperty("textContent", [], [])(binding, span, engine.inputFilters);

    expect(addSpy).not.toHaveBeenCalled();
  });

  it("defaultEvent の定義が無い場合は readonly にフォールバックする", () => {
    const engine = createEngineStub();
    const input = document.createElement("input");
    const addSpy = vi.spyOn(input, "addEventListener");
    const binding = createBindingStub(engine, input);
    const spyDefaultName = vi.spyOn(GetDefaultNameMod, "getDefaultName").mockReturnValue("customProp" as any);

    createBindingNodeProperty("customProp", [], [])(binding, input, engine.inputFilters);

    expect(addSpy).not.toHaveBeenCalled();
    spyDefaultName.mockRestore();
  });

  it("filters を通して値を変換し init を呼び出せる", () => {
    const engine = createEngineStub();
    engine.inputFilters = {
      upper: () => (value: unknown) => typeof value === "string" ? value.toUpperCase() : value,
    } as any;
    const input = document.createElement("input");
    const binding = createBindingStub(engine, input);
    const filterTexts = [{ name: "upper", options: undefined as any }];

    binding.bindingState.getFilteredValue.mockReturnValue("abc");

  const node = createBindingNodeProperty("value", filterTexts, [])(binding, input, engine.inputFilters);
  node.init();
  const renderer = createRendererStub({ readonlyState: {} });
  node.applyChange(renderer);
  expect(input.value).toBe("abc");

  input.value = "hello";
  expect(node.filteredValue).toBe("HELLO");
  });

  it("HTMLElement 以外は双方向登録せずに終了", () => {
    const engine = createEngineStub();
    const comment = document.createComment("prop");
    const binding = createBindingStub(engine, comment);
    expect(() => {
      createBindingNodeProperty("value", [], [])(binding, comment, engine.inputFilters);
    }).not.toThrow();
  });

  it("decorator 'ro' はリスナーを設定しない", () => {
    const engine = createEngineStub();
    const input = document.createElement("input");
    const addSpy = vi.spyOn(input, "addEventListener");
    const binding = createBindingStub(engine, input);

    createBindingNodeProperty("value", [], ["ro"])(binding, input, engine.inputFilters);

    expect(addSpy).not.toHaveBeenCalled();
  });
});
