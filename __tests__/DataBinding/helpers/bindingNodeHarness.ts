import { vi } from "vitest";

export function createEngineStub() {
  return {
    inputFilters: {},
    outputFilters: {},
    saveBinding: vi.fn(),
    calcListDiff: vi.fn(),
    getListIndexes: vi.fn(),
  } as any;
}

export function createRendererStub(overrides: Partial<any> = {}) {
  return {
    updatedBindings: new Set(),
    processedRefs: new Set(),
    readonlyState: {},
    render: vi.fn(),
    calcListDiff: vi.fn(),
    ...overrides,
  } as any;
}

export function createBindingStub(engine: any, node: Node) {
  const parentBindContent = { currentLoopContext: null } as any;
  const ref = { key: "ref#1" } as any;
  const bindingState = {
    pattern: "state.path",
    getFilteredValue: vi.fn(() => (null)),
    ref,
  } as any;
  return {
    parentBindContent,
    engine,
    node,
    bindingState,
  } as any;
}
