/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { getListIndex } from "../../src/StateClass/methods/getListIndex";

vi.mock("../../src/StatePropertyRef/StatepropertyRef", () => ({
  getStatePropertyRef: (info:any, _li:any) => ({ info, _li })
}));

// mock for getContextListIndex
const getContextListIndexMock = vi.fn();
vi.mock("../../src/StateClass/methods/getContextListIndex", () => ({
  getContextListIndex: (...args:any[]) => getContextListIndexMock(...args)
}));

function makeHandler(listIndexesByPattern: Record<string, any[]>) {
  return {
    engine: {
      getListIndexes: (ref:any) => listIndexesByPattern[ref.info.pattern]
    }
  } as any;
}

const baseInfo = {
  pattern: "a.*.b.*.c",
  wildcardCount: 2,
  wildcardParentInfos: [ { pattern: "a" }, { pattern: "a.*.b" } ],
};

describe("StateClass/methods getListIndex", () => {
  it("wildcardType=none は null", () => {
    const handler = makeHandler({});
    const resolved = { wildcardType: "none", info: { pattern: "x" } } as any;
    const r = getListIndex(resolved, {} as any, handler);
    expect(r).toBeNull();
  });

  it("wildcardType=context は getContextListIndex の結果を返す", () => {
    getContextListIndexMock.mockReturnValueOnce({ ctx: 1 } as any);

    const handler = makeHandler({});
    const resolved = { wildcardType: "context", info: { pattern: "x", lastWildcardPath: { pattern: "x" } } } as any;
    const r = getListIndex(resolved, {} as any, handler);
    expect(r).toEqual({ ctx: 1 });
  });

  it("wildcardType=all は親参照を辿って listIndex を返す", () => {
    const handler = makeHandler({
      "a": [ { li: 0 }, { li: 1 } ],
      "a.*.b": [ { li: 10 }, { li: 11 } ],
    });
    const resolved = {
      wildcardType: "all",
      info: baseInfo,
      wildcardIndexes: [1, 0],
    } as any;

    const r = getListIndex(resolved, {} as any, handler);
    expect(r).toEqual({ li: 10 });
  });

  it("wildcardType=partial はエラー", () => {
    const handler = makeHandler({});
    const resolved = { wildcardType: "partial", info: { pattern: "p" } } as any;
    expect(() => getListIndex(resolved, {} as any, handler)).toThrowError(/Partial wildcard type is not supported/);
  });
});
