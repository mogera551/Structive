/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { getListIndex } from "../../src/StateClass/methods/getListIndex";
import { GetListIndexesByRefSymbol } from "../../src/StateClass/symbols";

vi.mock("../../src/StatePropertyRef/StatepropertyRef", () => ({
  getStatePropertyRef: (info:any, _li:any) => ({ info, _li })
}));

// mock for getContextListIndex
const getContextListIndexMock = vi.fn();
vi.mock("../../src/StateClass/methods/getContextListIndex", () => ({
  getContextListIndex: (...args:any[]) => getContextListIndexMock(...args)
}));

function makeReceiver(listIndexesByPattern: Record<string, any[] | undefined>) {
  return {
    [GetListIndexesByRefSymbol]: vi.fn((ref:any) => listIndexesByPattern[ref.info.pattern])
  } as any;
}

function makeHandler() {
  return {} as any;
}

const baseInfo = {
  pattern: "a.*.b.*.c",
  wildcardCount: 2,
  wildcardParentInfos: [ { pattern: "a" }, { pattern: "a.*.b" } ],
};

describe("StateClass/methods getListIndex", () => {
  it("wildcardType=none は null", () => {
  const receiver = makeReceiver({});
  const handler = makeHandler();
    const resolved = { wildcardType: "none", info: { pattern: "x" } } as any;
  const r = getListIndex(resolved, receiver, handler);
    expect(r).toBeNull();
  });

  it("wildcardType=context は getContextListIndex の結果を返す", () => {
    getContextListIndexMock.mockReturnValueOnce({ ctx: 1 } as any);

  const receiver = makeReceiver({});
  const handler = makeHandler();
    const resolved = { wildcardType: "context", info: { pattern: "x", lastWildcardPath: { pattern: "x" } } } as any;
  const r = getListIndex(resolved, receiver, handler);
    expect(r).toEqual({ ctx: 1 });
  });

  it("wildcardType=all は親参照を辿って listIndex を返す", () => {
    const listIndexesByPattern = {
      "a": [ { li: 0 }, { li: 1 } ],
      "a.*.b": [ { li: 10 }, { li: 11 } ],
    };
    const receiver = makeReceiver(listIndexesByPattern);
    const handler = makeHandler();
    const resolved = {
      wildcardType: "all",
      info: baseInfo,
      wildcardIndexes: [1, 0],
    } as any;

  const r = getListIndex(resolved, receiver, handler);
    expect(r).toEqual({ li: 10 });
  });

  it("wildcardType=partial はエラー", () => {
  const receiver = makeReceiver({});
  const handler = makeHandler();
    const resolved = { wildcardType: "partial", info: { pattern: "p" } } as any;
  expect(() => getListIndex(resolved, receiver, handler)).toThrowError(/Partial wildcard type is not supported/);
  });

  it("context: lastWildcardPath が null だとエラー", () => {
  const receiver = makeReceiver({});
  const handler = makeHandler();
    const resolved = { wildcardType: "context", info: { pattern: "x", lastWildcardPath: null } } as any;
  expect(() => getListIndex(resolved, receiver, handler)).toThrow(/lastWildcardPath is null/i);
  });

  it("context: getContextListIndex が null を返すとエラー", () => {
    getContextListIndexMock.mockReturnValueOnce(null);
  const receiver = makeReceiver({});
  const handler = makeHandler();
    const resolved = { wildcardType: "context", info: { pattern: "x", lastWildcardPath: { pattern: "x" } } } as any;
  expect(() => getListIndex(resolved, receiver, handler)).toThrow(/ListIndex not found/i);
  });

  it("all: wildcardParentInfos[i] が無いとエラー", () => {
    const receiver = makeReceiver({});
    const handler = makeHandler();
    const resolved = {
      wildcardType: "all",
      info: { pattern: "a.*", wildcardCount: 1, wildcardParentInfos: [] },
      wildcardIndexes: [0],
    } as any;
    expect(() => getListIndex(resolved, receiver, handler)).toThrow(/wildcardParentPattern is null/i);
  });

  it("all: engine.getListIndexes が null/undefined だとエラー", () => {
    const receiver = makeReceiver({
      p: undefined,
    });
    const handler = makeHandler();
    const resolved = {
      wildcardType: "all",
      info: { pattern: "a.*", wildcardCount: 1, wildcardParentInfos: [{ pattern: "p" }] },
      wildcardIndexes: [0],
    } as any;
    expect(() => getListIndex(resolved, receiver, handler)).toThrow(/ListIndex not found: p/);
  });

  it("all: wildcardIndex が無いとエラー", () => {
    const receiver = makeReceiver({ p: [{ li: 0 }] });
    const handler = makeHandler();
    const resolved = {
      wildcardType: "all",
      info: { pattern: "a.*", wildcardCount: 1, wildcardParentInfos: [{ pattern: "p" }] },
      wildcardIndexes: [],
    } as any;
    expect(() => getListIndex(resolved, receiver, handler)).toThrow(/wildcardIndex is null/i);
  });

  it("all: listIndexes[wildcardIndex] が無いとエラー", () => {
    const receiver = makeReceiver({ p: [] });
    const handler = makeHandler();
    const resolved = {
      wildcardType: "all",
      info: { pattern: "a.*", wildcardCount: 1, wildcardParentInfos: [{ pattern: "p" }] },
      wildcardIndexes: [0],
    } as any;
    expect(() => getListIndex(resolved, receiver, handler)).toThrow(/ListIndex not found: p/);
  });

  it("all: wildcardCount が 0 の場合は null を返す", () => {
    const receiver = makeReceiver({});
    const handler = makeHandler();
    const resolved = {
      wildcardType: "all",
      info: { pattern: "items", wildcardCount: 0, wildcardParentInfos: [] },
      wildcardIndexes: [],
    } as any;

    const result = getListIndex(resolved, receiver, handler);
    expect(result).toBeNull();
  });

  it("未知の wildcardType は undefined を返す", () => {
  const receiver = makeReceiver({});
  const handler = makeHandler();
    const resolved = { wildcardType: "unknown", info: { pattern: "x" } } as any;

  const result = getListIndex(resolved, receiver, handler);
    expect(result).toBeUndefined();
  });
});
