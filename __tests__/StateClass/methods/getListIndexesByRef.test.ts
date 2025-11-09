import { describe, it, expect, vi, beforeEach } from "vitest";
import { getListIndexesByRef } from "../../../src/StateClass/methods/getListIndexesByRef";

const getByRefMock = vi.fn();
vi.mock("../../../src/StateClass/methods/getByRef", () => ({
  getByRef: (...args: any[]) => getByRefMock(...args),
}));

const raiseErrorMock = vi.fn((detail: any) => {
  const error = new Error(detail?.message ?? "error");
  (error as any).detail = detail;
  throw error;
});
vi.mock("../../../src/utils", () => ({
  raiseError: (detail: any) => raiseErrorMock(detail),
}));

function createHandler(
  listPatterns: string[] = [],
  cacheEntries: Map<any, any> = new Map(),
  options: {
    startsWith?: boolean;
    intersectionSize?: number;
    stateOutputListIndexes?: any[] | null;
  } = {},
) {
  const intersectionSize = options.intersectionSize ?? 1;
  const intersectionMock = vi.fn(() => {
    const result = new Set<any>();
    for (let i = 0; i < intersectionSize; i++) {
      result.add(`path-${i}`);
    }
    return result;
  });
  return {
    engine: {
      pathManager: {
        lists: new Set(listPatterns),
        getters: {
          intersection: intersectionMock,
        },
      },
      stateOutput: {
        startsWith: vi.fn(() => options.startsWith ?? false),
        getListIndexes: vi.fn(() => options.stateOutputListIndexes ?? null),
      },
      getCacheEntry: vi.fn((ref: any) => cacheEntries.has(ref) ? cacheEntries.get(ref) : null),
    },
  } as any;
}

describe("StateClass/methods: getListIndexesByRef", () => {
  beforeEach(() => {
    getByRefMock.mockReset();
    raiseErrorMock.mockReset();
  });

  it("lists に存在しないパターンは LIST-201 エラー", () => {
  const ref = { info: { pattern: "items", cumulativePathSet: new Set(["items"]) } } as any;
    const handler = createHandler();

    expect(() => getListIndexesByRef({}, ref, {} as any, handler)).toThrowError("path is not a list: items");
    expect(raiseErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({ code: "LIST-201", context: { where: "getListIndexesByRef", pattern: "items" } })
    );
    expect(getByRefMock).not.toHaveBeenCalled();
  });

  it("キャッシュ未登録の場合は LIST-202 エラー", () => {
  const ref = { info: { pattern: "items", cumulativePathSet: new Set(["items"]) } } as any;
    const handler = createHandler(["items"]);
    const target = {};
    const receiver = {} as any;

    expect(() => getListIndexesByRef(target, ref, receiver, handler)).toThrowError(
      "List cache entry not found: items"
    );
    expect(getByRefMock).toHaveBeenCalledWith(target, ref, receiver, handler);
    expect(raiseErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({ code: "LIST-202", context: { where: "getListIndexesByRef", pattern: "items" } })
    );
  });

  it("listIndexes が null の場合は LIST-203 エラー", () => {
    const ref = { info: { pattern: "items", cumulativePathSet: new Set(["items"]) } } as any;
    const cacheEntry = { listIndexes: null };
  const cache = new Map([[ref, cacheEntry]]);
  const handler = createHandler(["items"], cache);
    const target = {};
    const receiver = {} as any;

    expect(() => getListIndexesByRef(target, ref, receiver, handler)).toThrowError(
      "List indexes not found in cache entry: items"
    );
    expect(getByRefMock).toHaveBeenCalledWith(target, ref, receiver, handler);
    expect(raiseErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({ code: "LIST-203" })
    );
  });

  it("キャッシュの listIndexes を返し getByRef を呼ぶ", () => {
    const ref = { info: { pattern: "items", cumulativePathSet: new Set(["items"]) } } as any;
    const listIndexes = [{ index: 0 }, { index: 1 }];
    const cacheEntry = { listIndexes };
  const cache = new Map([[ref, cacheEntry]]);
  const handler = createHandler(["items"], cache);
    const receiver = {} as any;
    const target = {};

    const result = getListIndexesByRef(target, ref, receiver, handler);

    expect(result).toBe(listIndexes);
    expect(getByRefMock).toHaveBeenCalledWith(target, ref, receiver, handler);
    expect(raiseErrorMock).not.toHaveBeenCalled();
  });

  it("stateOutput 分岐: startsWith true かつ intersection が空なら stateOutput.getListIndexes を返す", () => {
    const ref = { info: { pattern: "items", cumulativePathSet: new Set(["items"]) } } as any;
    const expected = [{ index: 99 }];
    const handler = createHandler(["items"], new Map(), {
      startsWith: true,
      intersectionSize: 0,
      stateOutputListIndexes: expected,
    });

    const result = getListIndexesByRef({}, ref, {} as any, handler);

    expect(result).toBe(expected);
    expect(handler.engine.stateOutput.getListIndexes).toHaveBeenCalledWith(ref);
    expect(getByRefMock).not.toHaveBeenCalled();
  });

  it("stateOutput 分岐で null が返った場合は空配列を返す", () => {
    const ref = { info: { pattern: "items", cumulativePathSet: new Set(["items"]) } } as any;
    const handler = createHandler(["items"], new Map(), {
      startsWith: true,
      intersectionSize: 0,
      stateOutputListIndexes: null,
    });

    const result = getListIndexesByRef({}, ref, {} as any, handler);

    expect(result).toEqual([]);
    expect(handler.engine.stateOutput.getListIndexes).toHaveBeenCalledWith(ref);
    expect(getByRefMock).not.toHaveBeenCalled();
  });
});
