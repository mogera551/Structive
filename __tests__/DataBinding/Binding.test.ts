import { describe, it, expect, vi, beforeEach } from "vitest";
import { createBinding } from "../../src/DataBinding/Binding";

describe("Binding", () => {
  let engine: any;

  const node = document.createElement("div");

  const mockBindingNode = {
    bindContents: [],
    init: vi.fn(),
    notifyRedraw: vi.fn(),
    applyChange: vi.fn(),
    isBlock: false,
  };

  const mockBindingState = {
    init: vi.fn(),
    assignValue: vi.fn(),
    getFilteredValue: vi.fn(),
    isLoopIndex: false,
    ref: { info: { pattern: "state.path" } } as any,
  };

  const createBindingNode = vi.fn(() => mockBindingNode as any);
  const createBindingState = vi.fn(() => mockBindingState as any);

  const parentBindContent = {} as any;

  beforeEach(() => {
    engine = {
      inputFilters: {},
      outputFilters: {},
      pathManager: {
        dynamicDependencies: new Map<string, Set<string>>(),
      },
      getBindings: vi.fn(() => []),
    };
    mockBindingNode.bindContents = [];
    mockBindingNode.init.mockClear();
    mockBindingNode.notifyRedraw.mockClear();
    mockBindingNode.applyChange.mockClear();
    mockBindingState.init.mockClear();
    mockBindingState.assignValue.mockClear();
  mockBindingState.ref = { info: { pattern: "state.path" } } as any;
  mockBindingState.isLoopIndex = false;
  mockBindingState.getFilteredValue.mockClear();
    createBindingNode.mockClear();
    createBindingState.mockClear();
  });

  it("bindContents getter は bindingNode の bindContents を返す", () => {
    const childBindContents = [{ id: 1 }];
    mockBindingNode.bindContents = childBindContents as any;
    const binding = createBinding(parentBindContent, node, engine, createBindingNode as any, createBindingState as any);
    expect(binding.bindContents).toBe(childBindContents);
  });

  it("init は bindingNode と bindingState の init を呼ぶ", () => {
    const binding = createBinding(parentBindContent, node, engine, createBindingNode as any, createBindingState as any);
    binding.init();
    expect(mockBindingNode.init).toHaveBeenCalledTimes(1);
    expect(mockBindingState.init).toHaveBeenCalledTimes(1);
  });

  it("updateStateValue は bindingState.assignValue を呼ぶ", () => {
    const binding = createBinding(parentBindContent, node, engine, createBindingNode as any, createBindingState as any);
    const writeState: any = {};
    const handler: any = {};
    binding.updateStateValue(writeState, handler, 123);
    expect(mockBindingState.assignValue).toHaveBeenCalledWith(writeState, handler, 123);
  });

  it("notifyRedraw は bindingNode.notifyRedraw を委譲", () => {
    const binding = createBinding(parentBindContent, node, engine, createBindingNode as any, createBindingState as any);
    const refs: any[] = [];
    binding.notifyRedraw(refs as any);
    expect(mockBindingNode.notifyRedraw).toHaveBeenCalledWith(refs);
  });

  it("applyChange は renderer.updatedBindings に含まれていない場合のみ bindingNode.applyChange を呼ぶ", () => {
    const binding = createBinding(parentBindContent, node, engine, createBindingNode as any, createBindingState as any);
    engine.getBindings.mockReturnValue([binding]);
    const renderer: any = {
      updatedBindings: new Set(),
      processedRefs: new Set(),
      readonlyState: {},
      readonlyHandler: {},
    };
    binding.applyChange(renderer);
    expect(mockBindingNode.applyChange).toHaveBeenCalledWith(renderer);

    // 2回目は updatedBindings に追加してスキップされること
    (renderer.updatedBindings as Set<any>).add(binding);
    mockBindingNode.applyChange.mockClear();
    binding.applyChange(renderer);
    expect(mockBindingNode.applyChange).not.toHaveBeenCalled();
  });
});
