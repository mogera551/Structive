/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolveReadonly } from "../../src/StateClass/apis/resolveReadonly";
import { resolveWritable } from "../../src/StateClass/apis/resolveWritable";

// Mocks for dependencies
const getStructuredPathInfoMock = vi.fn();
vi.mock("../../src/StateProperty/getStructuredPathInfo", () => ({
  getStructuredPathInfo: (path: any) => getStructuredPathInfoMock(path)
}));

const getStatePropertyRefMock = vi.fn((info: any, li: any) => ({ info, li }));
vi.mock("../../src/StatePropertyRef/StatepropertyRef", () => ({
  getStatePropertyRef: (info: any, li: any) => getStatePropertyRefMock(info, li)
}));

const getByRefReadonlyMock = vi.fn();
vi.mock("../../src/StateClass/methods/getByRefReadonly", () => ({
  getByRefReadonly: (target: any, ref: any, receiver: any, handler: any) => getByRefReadonlyMock(target, ref, receiver, handler)
}));

const getByRefWritableMock = vi.fn();
vi.mock("../../src/StateClass/methods/getByRefWritable", () => ({
  getByRefWritable: (target: any, ref: any, receiver: any, handler: any) => getByRefWritableMock(target, ref, receiver, handler)
}));

const setByRefMock = vi.fn();
vi.mock("../../src/StateClass/methods/setByRef", () => ({
  setByRef: (target: any, ref: any, value: any, receiver: any, handler: any) => setByRefMock(target, ref, value, receiver, handler)
}));

function makeHandler(lastPattern: string | null, listIndexesByPattern: Record<string, any[]>) {
  return {
    refStack: [ lastPattern ? { info: { pattern: lastPattern } } : {} ],
    refIndex: 0,
    engine: {
      getListIndexes: (ref: any) => listIndexesByPattern[ref.info.pattern],
      pathManager: {
        getters: new Set(lastPattern ? [lastPattern] : []),
        setters: new Set(),
        addDynamicDependency: vi.fn(),
      },
    },
  } as any;
}

beforeEach(() => {
  getStructuredPathInfoMock.mockReset();
  getStatePropertyRefMock.mockClear();
  getByRefReadonlyMock.mockReset();
  getByRefWritableMock.mockReset();
  setByRefMock.mockReset();
});

describe("StateClass/apis resolveReadonly & resolveWritable", () => {
  it("resolveReadonly: 取得 + 動的依存登録", () => {
    // info with two wildcards
    const info = {
      pattern: "a.*.b.*.c",
      wildcardParentInfos: [ { pattern: "a" }, { pattern: "a.*.b" } ],
    };
    getStructuredPathInfoMock.mockReturnValue(info);

    const handler = makeHandler("last", {
      "a": [ { li: 0 }, { li: 1 } ],
      "a.*.b": [ { li: 10 }, { li: 11 } ],
    });
    const target = {}; const receiver = {} as any;

    getByRefReadonlyMock.mockReturnValue("READ-VALUE");

    const fn = resolveReadonly(target, "prop", receiver, handler);
    const result = fn("pathStr", [1, 0]);

    expect(result).toBe("READ-VALUE");
    // 最終参照に対する addDynamicDependency 呼び出し
    expect(handler.engine.pathManager.addDynamicDependency).toHaveBeenCalledWith("last", info.pattern);
    // 最終的なref生成（info, 最後のlistIndex）
    const lastCall = getStatePropertyRefMock.mock.calls.at(-1)!;
    expect(lastCall[0]).toBe(info);
    expect(lastCall[1]).toEqual({ li: 10 });
    // 値取得呼び出し
    const readCall = getByRefReadonlyMock.mock.calls[0];
    expect(readCall[0]).toBe(target);
    expect(readCall[2]).toBe(receiver);
    expect(readCall[3]).toBe(handler);
  });

  it("resolveReadonly: 値指定で例外", () => {
    const info = { pattern: "p", wildcardParentInfos: [] };
    getStructuredPathInfoMock.mockReturnValue(info);
    const handler = makeHandler(null, {});
    const target = {}; const receiver = {} as any;

    const fn = resolveReadonly(target, "prop", receiver, handler);
    expect(() => fn("p", [], 123)).toThrowError(/Cannot set value on a readonly proxy: p/);
  });

  it("resolveWritable: 取得 (value 未指定)", () => {
    const info = {
      pattern: "a.*.b.*.c",
      wildcardParentInfos: [ { pattern: "a" }, { pattern: "a.*.b" } ],
    };
    getStructuredPathInfoMock.mockReturnValue(info);

    const handler = makeHandler("lastW", {
      "a": [ { li: 0 }, { li: 1 } ],
      "a.*.b": [ { li: 10 }, { li: 11 } ],
    });
    const target = {}; const receiver = {} as any;

    getByRefWritableMock.mockReturnValue("WRITE-READ");

    const fn = resolveWritable(target, "prop", receiver, handler);
    const result = fn("pathStr", [1, 1]);

    expect(result).toBe("WRITE-READ");
    expect(handler.engine.pathManager.addDynamicDependency).toHaveBeenCalledWith("lastW", info.pattern);
  });

  it("resolveWritable: 設定 (value 指定) は setByRef を呼ぶ", () => {
    const info = {
      pattern: "a.*.b.*.c",
      wildcardParentInfos: [ { pattern: "a" }, { pattern: "a.*.b" } ],
    };
    getStructuredPathInfoMock.mockReturnValue(info);

    const handler = makeHandler(null, {
      "a": [ { li: 0 }, { li: 1 } ],
      "a.*.b": [ { li: 10 }, { li: 11 } ],
    });
    const target = {}; const receiver = {} as any;

    setByRefMock.mockReturnValue("SET-OK");

    const fn = resolveWritable(target, "prop", receiver, handler);
    const result = fn("pathStr", [0, 1], { v: 1 });

    expect(result).toBe("SET-OK");
    const setCall = setByRefMock.mock.calls[0];
    expect(setCall[0]).toBe(target);
    expect(setCall[2]).toEqual({ v: 1 });
    expect(setCall[3]).toBe(receiver);
    expect(setCall[4]).toBe(handler);
  });

  // 追加のブランチテスト
  it("lastInfo が null の場合は動的依存登録しない (readonly)", () => {
    const info = { pattern: "p1", wildcardParentInfos: [] };
    getStructuredPathInfoMock.mockReturnValue(info);
    const handler = makeHandler(null, {});
    const target = {}; const receiver = {} as any;
    getByRefReadonlyMock.mockReturnValue("V");
    const fn = resolveReadonly(target, "prop", receiver, handler);
    const result = fn("p1", []);
    expect(result).toBe("V");
    expect(handler.engine.pathManager.addDynamicDependency).not.toHaveBeenCalled();
  });

  it("lastInfo と同一 pattern の場合は動的依存登録しない (readonly)", () => {
    const info = { pattern: "same", wildcardParentInfos: [] };
    getStructuredPathInfoMock.mockReturnValue(info);
    const handler = makeHandler("same", {});
    const target = {}; const receiver = {} as any;
    getByRefReadonlyMock.mockReturnValue("V");
    const fn = resolveReadonly(target, "prop", receiver, handler);
    const result = fn("same", []);
    expect(result).toBe("V");
    expect(handler.engine.pathManager.addDynamicDependency).not.toHaveBeenCalled();
  });

  it("getters に含まれない場合は動的依存登録しない (writable)", () => {
    const info = { pattern: "pp", wildcardParentInfos: [] };
    getStructuredPathInfoMock.mockReturnValue(info);
    const handler = makeHandler("last", {});
    // handlers の getters を空に
    handler.engine.pathManager.getters = new Set();
    const target = {}; const receiver = {} as any;
    getByRefWritableMock.mockReturnValue("VV");
    const fn = resolveWritable(target, "prop", receiver, handler);
    const result = fn("pp", []);
    expect(result).toBe("VV");
    expect(handler.engine.pathManager.addDynamicDependency).not.toHaveBeenCalled();
  });

  it("setters に含まれる場合は動的依存登録しない (writable)", () => {
    const info = { pattern: "qq", wildcardParentInfos: [] };
    getStructuredPathInfoMock.mockReturnValue(info);
    const handler = makeHandler("last", {});
    handler.engine.pathManager.setters = new Set(["last"]);
    const target = {}; const receiver = {} as any;
    getByRefWritableMock.mockReturnValue("VV");
    const fn = resolveWritable(target, "prop", receiver, handler);
    const result = fn("qq", []);
    expect(result).toBe("VV");
    expect(handler.engine.pathManager.addDynamicDependency).not.toHaveBeenCalled();
  });

  it("indexes が不足する場合は 'index is null' を投げる (readonly)", () => {
    const info = { pattern: "a.*.b", wildcardParentInfos: [ { pattern: "a" } ] };
    getStructuredPathInfoMock.mockReturnValue(info);
    const handler = makeHandler(null, { "a": [ { li: 0 } ] });
    const target = {}; const receiver = {} as any;
    const fn = resolveReadonly(target, "prop", receiver, handler);
    expect(() => fn("p", []))
      .toThrowError(/index is null/);
  });

  it("listIndex が見つからない場合はエラー (writable)", () => {
    const info = { pattern: "a.*.b", wildcardParentInfos: [ { pattern: "a" } ] };
    getStructuredPathInfoMock.mockReturnValue(info);
    // getListIndexes が undefined → [] 扱いになり未検出
    const handler = makeHandler(null, {});
    const target = {}; const receiver = {} as any;
    const fn = resolveWritable(target, "prop", receiver, handler);
    expect(() => fn("p", [0]))
      .toThrowError(/ListIndex not found: a/);
  });

  it("wildcardParentPath が null の場合はエラー (readonly)", () => {
    const info = { pattern: "weird", wildcardParentInfos: [ undefined ] } as any;
    getStructuredPathInfoMock.mockReturnValue(info);
    const handler = makeHandler(null, {});
    const target = {}; const receiver = {} as any;
    const fn = resolveReadonly(target, "prop", receiver, handler);
    expect(() => fn("p", [0]))
      .toThrowError(/wildcardParentPath is null/);
  });
});
