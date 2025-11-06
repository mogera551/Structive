import { describe, it, expect } from "vitest";
import { createBindingStateIndex } from "../../../src/DataBinding/BindingState/BindingStateIndex";

function createEngine() {
  return {
    outputFilters: {
      add: (opts: string[]) => (v: any) => Number(v) + Number(opts?.[0] ?? 0),
    },
    bindingsByListIndex: new Map<any, Set<any>>(),
  } as any;
}

function createBinding(engine: any, loop: any) {
  if (loop && typeof loop.serialize === "function") {
    const parentBinding = { bindingsByListIndex: engine.bindingsByListIndex };
    const originalSerialize = loop.serialize.bind(loop);
    loop = {
      ...loop,
      serialize: () => {
        const contexts = originalSerialize();
        return contexts.map((ctx: any) => {
          const bindContent = ctx.bindContent ?? { parentBinding };
          if (bindContent.parentBinding == null) {
            bindContent.parentBinding = parentBinding;
          }
          return { ...ctx, bindContent };
        });
      },
    };
  }
  return {
    engine,
    parentBindContent: { currentLoopContext: loop },
  } as any;
}

describe("BindingStateIndex", () => {
  it("pattern と info のゲッターは未実装で例外", () => {
    const engine = createEngine();
    const binding = createBinding(engine, { serialize: () => [] } as any);
    const factory = createBindingStateIndex("$1", []);
    const bs = factory(binding, engine.outputFilters);
    expect(() => (bs as any).pattern).toThrowError(/Not implemented/);
    expect(() => (bs as any).info).toThrowError(/Not implemented/);
  });

  it("init で対象インデックスに登録され、getValue/getFilteredValue/ref が取得できる", () => {
    const ctx1 = { listIndex: { index: 0, sid: "LI0" }, ref: { key: "K0" } };
    const ctx2 = { listIndex: { index: 1, sid: "LI1" }, ref: { key: "K1" } };
    const root = { serialize: () => [ctx1, ctx2] } as any;
    const engine = createEngine();
    const binding = createBinding(engine, root);

    const factory = createBindingStateIndex("$2", [
      { name: "add", options: ["10"] },
    ]);
    const bs = factory(binding, engine.outputFilters);

    // init 前アクセスはエラー
  expect(() => (bs as any).getValue({} as any)).toThrowError(/listIndex is null/);

    bs.init();

    // Map 登録（listIndex オブジェクトがキー）
    const set = engine.bindingsByListIndex.get(ctx2.listIndex);
    expect(set).toBeInstanceOf(Set);
    expect(set!.has(binding)).toBe(true);

    // 値参照とフィルタ
  expect((bs as any).getValue({} as any, {} as any)).toBe(1);
  expect((bs as any).getFilteredValue({} as any, {} as any)).toBe(11);

    // ref も参照できる
    expect(bs.ref).toBe(ctx2.ref);
  });

  it("init 前に ref を参照するとエラー", () => {
    const engine = createEngine();
    const binding = createBinding(engine, { serialize: () => [] } as any);
    const factory = createBindingStateIndex("$1", []);
    const bs = factory(binding, engine.outputFilters);

    expect(() => bs.ref).toThrow(/ref is null/i);
  });

  it("binding と filters のゲッターが期待通り返る", () => {
    const engine = createEngine();
    const binding = createBinding(engine, { serialize: () => [] } as any);
    const factory = createBindingStateIndex("$1", [{ name: "add", options: ["1"] }]);
    const bs = factory(binding, engine.outputFilters);
    expect((bs as any).binding).toBe(binding);
    expect(Array.isArray((bs as any).filters)).toBe(true);
    expect((bs as any).filters.length).toBe(1);
    expect((bs as any).isLoopIndex).toBe(true);
  });

  it("pattern が数値でない場合はコンストラクタでエラー", () => {
    const engine = createEngine();
    const binding = createBinding(engine, { serialize: () => [] });
    const factory = createBindingStateIndex("abc", []);
    expect(() => factory(binding, engine.outputFilters)).toThrowError(/pattern is not a number/i);
  });

  it("currentLoopContext が null だと init でエラー", () => {
    const engine = createEngine();
    const binding = createBinding(engine, null);
    const factory = createBindingStateIndex("$1", []);
    const bs = factory(binding, engine.outputFilters);
    expect(() => bs.init()).toThrowError(/loopContext is null/i);
  });

  it("シリアライズ結果の範囲外インデックスは init でエラー", () => {
    const root = { serialize: () => [{ listIndex: { index: 0 }, ref: { key: "K0" } }] } as any;
    const engine = createEngine();
    const binding = createBinding(engine, root);
    const factory = createBindingStateIndex("$2", []);
    const bs = factory(binding, engine.outputFilters);
    expect(() => bs.init()).toThrowError("Current loopContext is null");
  });

  it("assignValue は未実装エラー", () => {
    const ctx = { listIndex: { index: 3 }, ref: { key: "K3" } };
    const root = { serialize: () => [ctx] } as any;
    const engine = createEngine();
    const binding = createBinding(engine, root);
    const factory = createBindingStateIndex("$1", []);
    const bs = factory(binding, engine.outputFilters);
    bs.init();
  expect(() => (bs as any).assignValue({} as any, {} as any, 123)).toThrowError(/not implemented/i);
  });

  it("listIndex.index が無い場合は getValue/getFilteredValue がエラー", () => {
    const ctx = { listIndex: { sid: "LI#NO_IDX" }, ref: { key: "K" } };
    const root = { serialize: () => [ctx] } as any;
    const engine = createEngine();
    const binding = createBinding(engine, root);
    const factory = createBindingStateIndex("$1", []);
    const bs = factory(binding, engine.outputFilters);

    bs.init();

    expect(() => bs.getValue({} as any, {} as any)).toThrow(/listIndex is null/i);
    expect(() => bs.getFilteredValue({} as any, {} as any)).toThrow(/listIndex is null/i);
  });

  it("init を複数回呼んでも Set は重複しない", () => {
    const ctx = { listIndex: { index: 2 }, ref: { key: "K2" } };
    const root = { serialize: () => [ctx] } as any;
    const engine = createEngine();
    const binding = createBinding(engine, root);
    const factory = createBindingStateIndex("$1", []);
    const bs = factory(binding, engine.outputFilters);

    bs.init();
    bs.init();

    const set = engine.bindingsByListIndex.get(ctx.listIndex)!;
    expect(set.size).toBe(1);
    expect(set.has(binding)).toBe(true);
  });

  it("親バインディングが無い場合は init でエラー", () => {
    const engine = createEngine();
    const listIndex = { index: 0 };
    const loopContext = {
      serialize: () => [{
        listIndex,
        ref: { key: "REF" },
        bindContent: { parentBinding: null }
      }]
    };
    const binding = {
      engine,
      parentBindContent: { currentLoopContext: loopContext }
    } as any;

    const factory = createBindingStateIndex("$1", []);
    const bs = factory(binding, engine.outputFilters);

    expect(() => bs.init()).toThrowError(/Binding for list is null/);
  });

  it("既存エントリがある場合は Set に追記する", () => {
    const engine = createEngine();
    const listIndex = { index: 5 };
    const parentBinding = { bindingsByListIndex: engine.bindingsByListIndex };
    const existingBinding = { id: "existing" };
    const existingSet = new Set<any>([existingBinding]);
    parentBinding.bindingsByListIndex.set(listIndex, existingSet);

    const loopContext = {
      serialize: () => [{
        listIndex,
        ref: { key: "REF" },
        bindContent: { parentBinding }
      }]
    };

    const binding = {
      engine,
      parentBindContent: { currentLoopContext: loopContext }
    } as any;

    const factory = createBindingStateIndex("$1", []);
    const bs = factory(binding, engine.outputFilters);

    bs.init();

    expect(existingSet.size).toBe(2);
    expect(existingSet.has(binding)).toBe(true);
  });
});
