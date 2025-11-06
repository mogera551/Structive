import { vi } from "vitest";
import { GetByRefSymbol, GetListIndexesByRefSymbol } from "../../../src/StateClass/symbols";

export function createEngineStub() {
  return {
    inputFilters: {},
    outputFilters: {},
    saveBinding: vi.fn(),
    calcListDiff: vi.fn(),
    getListIndexes: vi.fn(),
    saveListAndListIndexes: vi.fn(),
    getListAndListIndexes: vi.fn(() => ({ list: null, listIndexes: null, listClone: null })),
  } as any;
}

export function createRendererStub(overrides: Partial<any> = {}) {
  const defaultDiff = () => ({
    newListValue: [],
    newIndexes: [],
    adds: new Set(),
    removes: new Set(),
    changeIndexes: new Set(),
    overwrites: new Set(),
  });

  const baseReadonlyState = overrides.readonlyState ?? {};
  const calcImpl = overrides.calcListDiff ?? vi.fn(defaultDiff);
  let lastDiff: any;
  let lastDiffRef: any;
  let diffComputed = false;

  const calcWrapper = vi.fn((ref: any) => {
    const result = calcImpl(ref);
    lastDiff = result;
    lastDiffRef = ref;
    diffComputed = true;
    return result;
  });

  const ensureDiff = (ref: any) => {
    if (!diffComputed || lastDiffRef !== ref) {
      lastDiff = calcWrapper(ref);
      lastDiffRef = ref;
      diffComputed = true;
    }
    if (lastDiff === null) {
      throw new Error("ListDiff is null");
    }
    if (lastDiff && typeof lastDiff.__throwMessage === "string") {
      throw new Error(lastDiff.__throwMessage);
    }
    return lastDiff ?? defaultDiff();
  };

  const readonlyState = { ...baseReadonlyState } as any;

  readonlyState[GetByRefSymbol] = typeof baseReadonlyState[GetByRefSymbol] === "function"
    ? vi.fn((ref: any) => baseReadonlyState[GetByRefSymbol](ref))
    : vi.fn((ref: any) => {
        const diff = ensureDiff(ref);
        if (Array.isArray(diff?.newListValue)) {
          return diff.newListValue;
        }
        if (typeof diff?.newListValue !== "undefined") {
          return diff.newListValue ?? [];
        }
        const count = Array.isArray(diff?.newIndexes) ? diff.newIndexes.length : 0;
        if (count > 0) {
          return Array.from({ length: count }, () => ({}));
        }
        return [];
      });

  readonlyState[GetListIndexesByRefSymbol] = typeof baseReadonlyState[GetListIndexesByRefSymbol] === "function"
    ? vi.fn((ref: any) => baseReadonlyState[GetListIndexesByRefSymbol](ref))
    : vi.fn((ref: any) => {
        const diff = ensureDiff(ref);
        if (Array.isArray(diff?.newIndexes)) {
          return diff.newIndexes;
        }
        return diff?.newIndexes ?? [];
      });

  const { calcListDiff: _ignored, readonlyState: _ignoredState, ...rest } = overrides;

  const renderer = {
    updatedBindings: new Set(),
    processedRefs: new Set(),
    updatingRefs: [],
    lastListInfoByRef: new Map<any, any>(),
    readonlyState,
    render: vi.fn(),
    unmountBindContent: vi.fn(),
    ...rest,
  } as any;

  renderer.calcListDiff = calcWrapper;

  return renderer;
}

export function createBindingStub(engine: any, node: Node) {
  const parentBindContent = { currentLoopContext: null } as any;
  const info = { pattern: "state.path", parentInfo: null } as any;
  const ref = { key: "ref#1", info, listIndex: null, parentRef: null } as any;
  const bindingState = {
    pattern: "state.path",
    info,
    getFilteredValue: vi.fn(() => (null)),
    ref,
  } as any;
  return {
    parentBindContent,
    engine,
    node,
    bindingState,
    bindingsByListIndex: new WeakMap(),
  } as any;
}
