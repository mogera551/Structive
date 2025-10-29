import { describe, it, expect, vi } from "vitest";
import { createBinding } from "../../src/DataBinding/Binding";

describe("Binding", () => {
  const engine: any = {
    inputFilters: {},
    outputFilters: {},
  };

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
  };

  const createBindingNode = vi.fn(() => mockBindingNode as any);
  const createBindingState = vi.fn(() => mockBindingState as any);

  const parentBindContent = {} as any;

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
    const renderer: any = {
      updatedBindings: new Set(),
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
