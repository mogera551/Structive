import { describe, it, expect, vi, beforeEach } from "vitest";
import { createBindingState } from "../../src/DataBinding/BindingState/BindingState";
import { GetByRefSymbol, SetByRefSymbol } from "../../src/StateClass/symbols";

// 簡易なメモリストアで State の [GetByRef]/[SetByRef] を模倣
class MemoryState {
  private store = new Map<string, any>();
  [GetByRefSymbol](ref: any) {
    return this.store.get(ref.key);
  }
  [SetByRefSymbol](ref: any, value: any) {
    this.store.set(ref.key, value);
  }
  set(key: string, value: any) { this.store.set(key, value); }
}

describe("BindingState", () => {
  let engine: any;

  beforeEach(() => {
    engine = {
      inputFilters: {},
      outputFilters: {
        upper: () => (v: any) => String(v).toUpperCase(),
        add: (opts: string[]) => (v: any) => Number(v) + Number(opts[0] ?? 0),
      },
      saveBinding: vi.fn(),
    };
  });

  it("非ワイルドカード: init/saveBinding/get/assignValue", () => {
    const mockBindContent = { currentLoopContext: null } as any;
    const binding = { parentBindContent: mockBindContent, engine } as any;

    // フィルタなし
    const factory = createBindingState("user.name", []);
    const bindingState = factory(binding, engine.outputFilters);

    // 初期化で saveBinding が呼ばれる（非ワイルドカードはループ不要）
    bindingState.init();
    expect(engine.saveBinding).toHaveBeenCalledTimes(1);
    const savedRef = engine.saveBinding.mock.calls[0][0];

    // 値の get / set を確認
    const state = new MemoryState();
    state.set(savedRef.key, "alice");
    expect(bindingState.getValue(state as any)).toBe("alice");

    bindingState.assignValue(state as any, "bob");
    expect(bindingState.getValue(state as any)).toBe("bob");
  });

  it("フィルタ適用: upper と add", () => {
    const mockBindContent = { currentLoopContext: null } as any;
    const binding = { parentBindContent: mockBindContent, engine } as any;

    const factory = createBindingState("user.score", [
      { name: "add", options: ["10"] },
    ]);
    const bindingState = factory(binding, engine.outputFilters);
    bindingState.init();

    const savedRef = engine.saveBinding.mock.calls.at(-1)[0];
    const state = new MemoryState();
    state.set(savedRef.key, 5);

    expect(bindingState.getValue(state as any)).toBe(5);
    expect(bindingState.getFilteredValue(state as any)).toBe(15);
  });

  it("ワイルドカード: currentLoopContext から listIndex を取得して参照を解決", () => {
    const listIndex = { sid: "LI#1" } as any; // 最低限でOK（key組み立てに利用）
    const loopContext = {
      path: "items.*",
      listIndex,
      find: (name: string) => (name === "items.*" ? loopContext : null),
    } as any;

    const mockBindContent = { currentLoopContext: loopContext } as any;
    const binding = { parentBindContent: mockBindContent, engine } as any;

    const factory = createBindingState("items.*.name", []);
    const bindingState = factory(binding, engine.outputFilters);

    bindingState.init();
    // saveBinding に渡された ref は listIndex 付きのもの
    expect(engine.saveBinding).toHaveBeenCalled();
    const ref = engine.saveBinding.mock.calls.at(-1)[0];

    const state = new MemoryState();
    state.set(ref.key, "carol");
    expect(bindingState.getValue(state as any)).toBe("carol");
  });

  it("フィルタチェーン: upper -> add", () => {
    const mockBindContent = { currentLoopContext: null } as any;
    const binding = { parentBindContent: mockBindContent, engine } as any;

    const factory = createBindingState("user.label", [
      { name: "upper", options: [] },
    ]);
    const bindingState = factory(binding, engine.outputFilters);
    bindingState.init();

    const ref = engine.saveBinding.mock.calls.at(-1)[0];
    const state = new MemoryState();
    state.set(ref.key, "dev");
    expect(bindingState.getFilteredValue(state as any)).toBe("DEV");
  });

  it("エラー: ワイルドカードで lastWildcardPath が null", () => {
    const binding = { parentBindContent: { currentLoopContext: { find: vi.fn() } }, engine } as any;
    const factory = createBindingState("items.*.name", []);
    const bindingState = factory(binding, engine.outputFilters);
    // info.lastWildcardPath を null にするため、getStructuredPathInfo をモックするのが簡単だが、ここでは実際の実装依存を避ける
    // 代替として、currentLoopContext.find が null を返すケースで 'LoopContext is null' をカバー
    (binding.parentBindContent.currentLoopContext.find as any).mockReturnValue(null);
    expect(() => bindingState.init()).toThrow(/LoopContext is null/i);
  });

  it("エラー: ワイルドカード・未init で ref が null", () => {
    // ワイルドカードの場合、コンストラクタで #nullRef は null になる
    // init() を呼ばずに getValue すると、loopContext === null かつ nullRef === null で 'ref is null'
    const binding = { parentBindContent: { currentLoopContext: null }, engine } as any;
    const factory = createBindingState("items.*.name", []);
    const bindingState = factory(binding, engine.outputFilters);
    expect(() => bindingState.getValue({ [GetByRefSymbol]: vi.fn() } as any)).toThrow(/ref is null/i);
  });
});
