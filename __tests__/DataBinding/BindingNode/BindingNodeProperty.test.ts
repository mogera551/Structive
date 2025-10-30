import { describe, it, expect, vi } from "vitest";
import { createBindingNodeProperty } from "../../../src/DataBinding/BindingNode/BindingNodeProperty";
import { createBindingStub, createEngineStub, createRendererStub } from "../helpers/bindingNodeHarness";
import * as UpdaterMod from "../../../src/Updater/Updater";

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
    const textarea = document.createElement("textarea");
    const addSpy = vi.spyOn(textarea, "addEventListener");
    const binding = createBindingStub(engine, textarea);

    createBindingNodeProperty("textContent", [], [])(binding, textarea, engine.inputFilters);

    expect(addSpy).not.toHaveBeenCalled();
  });

  it("Property: value を反映", () => {
    const engine = createEngineStub();
    const textarea = document.createElement("textarea");
    const binding = createBindingStub(engine, textarea);

    binding.bindingState.getFilteredValue.mockReturnValue("123");

    const node = createBindingNodeProperty("value", [], [])(binding, textarea, engine.inputFilters);
    const renderer = createRendererStub({ readonlyState: {} });
    node.applyChange(renderer);
    expect(textarea.value).toBe("123");
  });

  it("双方向: defaultName 一致 + input で onInput（デコレータ無し）", async () => {
    const engine = createEngineStub();
    const textarea = document.createElement("textarea");
    const binding = createBindingStub(engine, textarea);
    binding.bindingState.getFilteredValue.mockImplementation(() => textarea.value);

    const spyCreateUpdater = vi.spyOn(UpdaterMod, "createUpdater").mockImplementation(async (_engine: any, cb: any) => {
      const updater = {
        update: vi.fn(async (_loop: any, fn: any) => {
          await fn({} as any, {} as any);
        }),
      };
      await cb(updater);
    });

    const node = createBindingNodeProperty("value", [], [])(binding, textarea, engine.inputFilters);
    const renderer = createRendererStub({ readonlyState: {} });

    textarea.value = "";
    binding.bindingState.getFilteredValue.mockReturnValue("hello");
    node.applyChange(renderer);
    expect(textarea.value).toBe("hello");

    binding.updateStateValue = vi.fn();
    textarea.value = "world";
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    expect(spyCreateUpdater).toHaveBeenCalled();
    expect(binding.updateStateValue).toHaveBeenCalledWith(expect.anything(), expect.anything(), "world");
  });

  it("デコレータ指定 onChange で発火、NaN は空文字でセット", async () => {
    const engine = createEngineStub();
    const textarea = document.createElement("textarea");
    const binding = createBindingStub(engine, textarea);
    const spyCreateUpdater = vi.spyOn(UpdaterMod, "createUpdater").mockImplementation(async (_engine: any, cb: any) => {
      const updater = {
        update: vi.fn(async (_loop: any, fn: any) => {
          await fn({} as any, {} as any);
        }),
      };
      await cb(updater);
    });

    const node = createBindingNodeProperty("value", [], ["onchange"])(binding, textarea, engine.inputFilters);
    const renderer = createRendererStub({ readonlyState: {} });

    binding.bindingState.getFilteredValue.mockReturnValue(Number.NaN);
    node.applyChange(renderer);
    expect(textarea.value).toBe("");

    binding.bindingState.getFilteredValue.mockReturnValue("abc");
    renderer.updatedBindings.delete(binding);
    node.applyChange(renderer);
    expect(textarea.value).toBe("abc");

    binding.updateStateValue = vi.fn();
    textarea.value = "xyz";
    textarea.dispatchEvent(new Event("change", { bubbles: true }));
    expect(spyCreateUpdater).toHaveBeenCalled();
    expect(binding.updateStateValue).toHaveBeenCalledWith(expect.anything(), expect.anything(), "xyz");
  });

  it("decorates が複数ある場合はエラー", () => {
    const engine = createEngineStub();
    const textarea = document.createElement("textarea");
    const binding = createBindingStub(engine, textarea);

    expect(() => {
      createBindingNodeProperty("value", [], ["oninput", "onchange"])(binding, textarea, engine.inputFilters);
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

  it("filters を通して値を変換し init を呼び出せる", () => {
    const engine = createEngineStub();
    engine.inputFilters = {
      upper: () => (value: unknown) => typeof value === "string" ? value.toUpperCase() : value,
    } as any;
    const textarea = document.createElement("textarea");
    const binding = createBindingStub(engine, textarea);
    const filterTexts = [{ name: "upper", options: undefined as any }];

    binding.bindingState.getFilteredValue.mockReturnValue("abc");

    const node = createBindingNodeProperty("value", filterTexts, [])(binding, textarea, engine.inputFilters);
    node.init();
    const renderer = createRendererStub({ readonlyState: {} });
    node.applyChange(renderer);
    expect(textarea.value).toBe("abc");

    textarea.value = "hello";
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
    const textarea = document.createElement("textarea");
    const addSpy = vi.spyOn(textarea, "addEventListener");
    const binding = createBindingStub(engine, textarea);

    createBindingNodeProperty("value", [], ["ro"])(binding, textarea, engine.inputFilters);

    expect(addSpy).not.toHaveBeenCalled();
  });

  it("HTMLInputElement 判定のみ通過する要素は BLANK_SET を返して終了", () => {
    const originalConstructors = {
      HTMLElement,
      HTMLInputElement,
      HTMLTextAreaElement,
      HTMLSelectElement,
      HTMLOptionElement,
    };

    class MockHTMLElement {
      addEventListener = vi.fn();
    }

    class MockHTMLInputElement extends MockHTMLElement {
      static [Symbol.hasInstance](instance: any): boolean {
        if (!instance || typeof instance !== "object") return false;
        if (instance.__mockTag === "guard") {
          instance.__mockTag = "post-guard";
          return true;
        }
        return false;
      }
    }

    class MockHTMLTextAreaElement extends MockHTMLElement {
      static [Symbol.hasInstance](instance: any): boolean {
        return instance?.__mockTag === "textarea";
      }
    }

    class MockHTMLSelectElement extends MockHTMLElement {
      static [Symbol.hasInstance](instance: any): boolean {
        return instance?.__mockTag === "select";
      }
    }

    class MockHTMLOptionElement extends MockHTMLElement {
      static [Symbol.hasInstance](instance: any): boolean {
        return instance?.__mockTag === "option";
      }
    }

    Object.defineProperty(globalThis, "HTMLElement", { value: MockHTMLElement, writable: true, configurable: true });
    Object.defineProperty(globalThis, "HTMLInputElement", { value: MockHTMLInputElement, writable: true, configurable: true });
    Object.defineProperty(globalThis, "HTMLTextAreaElement", { value: MockHTMLTextAreaElement, writable: true, configurable: true });
    Object.defineProperty(globalThis, "HTMLSelectElement", { value: MockHTMLSelectElement, writable: true, configurable: true });
    Object.defineProperty(globalThis, "HTMLOptionElement", { value: MockHTMLOptionElement, writable: true, configurable: true });

    try {
      const engine = createEngineStub();
      const fakeNode = new MockHTMLElement() as any;
      fakeNode.__mockTag = "guard";
      const binding = createBindingStub(engine, fakeNode as unknown as Node);

      createBindingNodeProperty("value", [], [])(binding, fakeNode as unknown as Node, engine.inputFilters);

      expect(fakeNode.addEventListener).not.toHaveBeenCalled();
      expect(fakeNode.__mockTag).toBe("post-guard");
    } finally {
      Object.defineProperty(globalThis, "HTMLElement", { value: originalConstructors.HTMLElement, writable: true, configurable: true });
      Object.defineProperty(globalThis, "HTMLInputElement", { value: originalConstructors.HTMLInputElement, writable: true, configurable: true });
      Object.defineProperty(globalThis, "HTMLTextAreaElement", { value: originalConstructors.HTMLTextAreaElement, writable: true, configurable: true });
      Object.defineProperty(globalThis, "HTMLSelectElement", { value: originalConstructors.HTMLSelectElement, writable: true, configurable: true });
      Object.defineProperty(globalThis, "HTMLOptionElement", { value: originalConstructors.HTMLOptionElement, writable: true, configurable: true });
    }
  });

  it("デフォルトイベントが無いプロパティは readonly で終了", () => {
    const originalConstructors = {
      HTMLElement,
      HTMLInputElement,
      HTMLTextAreaElement,
      HTMLSelectElement,
      HTMLOptionElement,
    };

    class MockHTMLElement {
      addEventListener = vi.fn();
    }

    class MockHTMLInputElement extends MockHTMLElement {
      static [Symbol.hasInstance](instance: any): boolean {
        if (!instance || typeof instance !== "object") return false;
        if (instance.__mockTag === "guard-readonly") {
          instance.__mockTag = "post-guard-readonly";
          return true;
        }
        return false;
      }
    }

    class MockHTMLTextAreaElement extends MockHTMLElement {
      static [Symbol.hasInstance](instance: any): boolean {
        return instance?.__mockTag === "textarea";
      }
    }

    class MockHTMLSelectElement extends MockHTMLElement {
      static [Symbol.hasInstance](instance: any): boolean {
        return instance?.__mockTag === "select";
      }
    }

    class MockHTMLOptionElement extends MockHTMLElement {
      static [Symbol.hasInstance](instance: any): boolean {
        return instance?.__mockTag === "option";
      }
    }

    Object.defineProperty(globalThis, "HTMLElement", { value: MockHTMLElement, writable: true, configurable: true });
    Object.defineProperty(globalThis, "HTMLInputElement", { value: MockHTMLInputElement, writable: true, configurable: true });
    Object.defineProperty(globalThis, "HTMLTextAreaElement", { value: MockHTMLTextAreaElement, writable: true, configurable: true });
    Object.defineProperty(globalThis, "HTMLSelectElement", { value: MockHTMLSelectElement, writable: true, configurable: true });
    Object.defineProperty(globalThis, "HTMLOptionElement", { value: MockHTMLOptionElement, writable: true, configurable: true });

    const originalSetHas = Set.prototype.has;
    const fallbackName = "customProp";
    let overrideCount = 0;
    Set.prototype.has = function(value: unknown): boolean {
      if (this instanceof Set && this.size === 0 && value === fallbackName) {
        overrideCount += 1;
        return true;
      }
      return originalSetHas.call(this, value);
    };

    try {
      const engine = createEngineStub();
      const fakeNode = new MockHTMLElement() as any;
      fakeNode.__mockTag = "guard-readonly";
      const binding = createBindingStub(engine, fakeNode as unknown as Node);

      createBindingNodeProperty(fallbackName, [], [])(binding, fakeNode as unknown as Node, engine.inputFilters);

      expect(fakeNode.addEventListener).not.toHaveBeenCalled();
      expect(fakeNode.__mockTag).toBe("post-guard-readonly");
      expect(overrideCount).toBeGreaterThan(0);
    } finally {
      Set.prototype.has = originalSetHas;
      Object.defineProperty(globalThis, "HTMLElement", { value: originalConstructors.HTMLElement, writable: true, configurable: true });
      Object.defineProperty(globalThis, "HTMLInputElement", { value: originalConstructors.HTMLInputElement, writable: true, configurable: true });
      Object.defineProperty(globalThis, "HTMLTextAreaElement", { value: originalConstructors.HTMLTextAreaElement, writable: true, configurable: true });
      Object.defineProperty(globalThis, "HTMLSelectElement", { value: originalConstructors.HTMLSelectElement, writable: true, configurable: true });
      Object.defineProperty(globalThis, "HTMLOptionElement", { value: originalConstructors.HTMLOptionElement, writable: true, configurable: true });
    }
  });

  it("input type=checkbox は change で checked を反映", async () => {
    const engine = createEngineStub();
    const input = document.createElement("input");
    input.type = "checkbox";
    const binding = createBindingStub(engine, input);
    binding.bindingState.getFilteredValue.mockReturnValueOnce(false);

    const spyCreateUpdater = vi.spyOn(UpdaterMod, "createUpdater").mockImplementation(async (_engine: any, cb: any) => {
      const updater = {
        update: vi.fn(async (_loop: any, fn: any) => {
          await fn({} as any, {} as any);
        }),
      };
      await cb(updater);
    });

    const node = createBindingNodeProperty("checked", [], [])(binding, input, engine.inputFilters);
    const renderer = createRendererStub({ readonlyState: {} });
    node.applyChange(renderer);
    expect(input.checked).toBe(false);

    binding.updateStateValue = vi.fn();
    input.checked = true;
    input.dispatchEvent(new Event("change", { bubbles: true }));

    expect(spyCreateUpdater).toHaveBeenCalled();
    expect(binding.updateStateValue).toHaveBeenCalledWith(expect.anything(), expect.anything(), true);
  });

  it("input type=number に valueAsNumber を適用できる", () => {
    const engine = createEngineStub();
    const input = document.createElement("input");
    input.type = "number";
    const binding = createBindingStub(engine, input);
    binding.bindingState.getFilteredValue.mockReturnValue(12.5);

    const node = createBindingNodeProperty("valueAsNumber", [], [])(binding, input, engine.inputFilters);
    const renderer = createRendererStub({ readonlyState: {} });
    node.applyChange(renderer);

    expect(input.valueAsNumber).toBe(12.5);
  });
});
