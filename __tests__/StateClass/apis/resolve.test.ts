/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolve } from "../../../src/StateClass/apis/resolve";
import { SetCacheableSymbol, SetByRefSymbol } from "../../../src/StateClass/symbols";

// Mock for utils: payload/legacy string 両対応
const raiseErrorMock = vi.fn((arg: any) => {
  if (typeof arg === "string") {
    throw new Error(arg);
  }
  if (arg && typeof arg === "object") {
    throw new Error(arg.message ?? String(arg));
  }
  throw new Error(String(arg));
});
vi.mock("../../../src/utils", () => ({
  raiseError: (arg: any) => raiseErrorMock(arg)
}));

// Mocks for dependencies
const getStructuredPathInfoMock = vi.fn();
vi.mock("../../../src/StateProperty/getStructuredPathInfo", () => ({
  getStructuredPathInfo: (path: any) => getStructuredPathInfoMock(path)
}));

const getStatePropertyRefMock = vi.fn((info: any, li: any) => ({ info, li }));
vi.mock("../../../src/StatePropertyRef/StatepropertyRef", () => ({
  getStatePropertyRef: (info: any, li: any) => getStatePropertyRefMock(info, li)
}));

const getByRefMock = vi.fn();
vi.mock("../../../src/StateClass/methods/getByRef", () => ({
  getByRef: (target: any, ref: any, receiver: any, handler: any) => getByRefMock(target, ref, receiver, handler)
}));

const setByRefMock = vi.fn();
// We'll use the actual SetCacheableSymbol from the import

vi.mock("../../../src/StateClass/methods/setByRef", () => ({
  setByRef: (target: any, ref: any, value: any, receiver: any, handler: any) => setByRefMock(target, ref, value, receiver, handler)
}));

function makeHandler(lastPattern: string | null, listIndexesByPattern: Record<string, any[]>, isReadonly = false) {
  return {
    lastRefStack: lastPattern ? { info: { pattern: lastPattern } } : null,
    engine: {
      getListIndexes: (ref: any) => listIndexesByPattern[ref.info.pattern],
      pathManager: {
        getters: new Set(lastPattern ? [lastPattern] : []),
        setters: new Set(),
        onlyGetters: new Set(lastPattern ? [lastPattern] : []),
        addDynamicDependency: vi.fn(),
      },
    },
    ...(isReadonly ? { cache: {} } : {})
  } as any;
}

function makeReceiver(isReadonly = false) {
  const receiver = {} as any;
  if (isReadonly) {
    receiver[SetCacheableSymbol] = true;
  } else {
    receiver[SetByRefSymbol] = vi.fn();
  }
  return receiver;
}

beforeEach(() => {
  getStructuredPathInfoMock.mockReset();
  getStatePropertyRefMock.mockClear();
  getByRefMock.mockReset();
  setByRefMock.mockReset();
});

describe("StateClass/apis resolve", () => {
  it("resolve: readonly proxy - 取得 + 動的依存登録", () => {
    // info with two wildcards
    const info = {
      pattern: "a.*.b.*.c",
      wildcardParentInfos: [ { pattern: "a" }, { pattern: "a.*.b" } ],
    };
    getStructuredPathInfoMock.mockReturnValue(info);

    const handler = makeHandler("last", {
      "a": [ { li: 0 }, { li: 1 } ],
      "a.*.b": [ { li: 10 }, { li: 11 } ],
    }, true); // readonly handler
    const target = {}; 
    const receiver = makeReceiver(true); // readonly receiver

    getByRefMock.mockReturnValue("READ-VALUE");

    const fn = resolve(target, "prop", receiver, handler);
    const result = fn("pathStr", [1, 0]);

    expect(result).toBe("READ-VALUE");
    // 最終参照に対する addDynamicDependency 呼び出し
    expect(handler.engine.pathManager.addDynamicDependency).toHaveBeenCalledWith("last", info.pattern);
    // 最終的なref生成（info, 最後のlistIndex）
    const lastCall = getStatePropertyRefMock.mock.calls.at(-1)!;
    expect(lastCall[0]).toBe(info);
    expect(lastCall[1]).toEqual({ li: 10 });
    // 値取得呼び出し
    const readCall = getByRefMock.mock.calls[0];
    expect(readCall[0]).toBe(target);
    expect(readCall[2]).toBe(receiver);
    expect(readCall[3]).toBe(handler);
  });

  it("resolve: readonly proxy - 値指定で例外", () => {
    const info = { pattern: "p", wildcardParentInfos: [] };
    getStructuredPathInfoMock.mockReturnValue(info);
    const handler = makeHandler(null, {}, true); // readonly handler
    const target = {}; 
    const receiver = makeReceiver(true); // readonly receiver

    const fn = resolve(target, "prop", receiver, handler);
    expect(() => fn("p", [], 123)).toThrowError(/Cannot set value on a readonly proxy: p/);
  });

  it("resolve: writable proxy - 取得 (value 未指定)", () => {
    const info = {
      pattern: "a.*.b.*.c",
      wildcardParentInfos: [ { pattern: "a" }, { pattern: "a.*.b" } ],
    };
    getStructuredPathInfoMock.mockReturnValue(info);

    const handler = makeHandler("lastW", {
      "a": [ { li: 0 }, { li: 1 } ],
      "a.*.b": [ { li: 10 }, { li: 11 } ],
    }, false); // writable handler
    const target = {}; 
    const receiver = makeReceiver(false); // writable receiver

    getByRefMock.mockReturnValue("WRITE-READ");

    const fn = resolve(target, "prop", receiver, handler);
    const result = fn("pathStr", [1, 1]);

    expect(result).toBe("WRITE-READ");
    expect(handler.engine.pathManager.addDynamicDependency).toHaveBeenCalledWith("lastW", info.pattern);
    
    // getStatePropertyRef が最終的に正しい ref で呼ばれることを確認
    const lastRefCall = getStatePropertyRefMock.mock.calls.at(-1)!;
    expect(lastRefCall[0]).toBe(info);
    expect(lastRefCall[1]).toEqual({ li: 11 }); // indexes[1, 1] → listIndex at index 1
    // getByRef がワイルドカード階層と最終参照で呼ばれることを確認
    expect(getByRefMock).toHaveBeenCalledTimes(3);
    const writableCall = getByRefMock.mock.calls.at(-1)!;
    expect(writableCall[0]).toBe(target);
    expect(writableCall[2]).toBe(receiver);
    expect(writableCall[3]).toBe(handler);
  });

  it("resolve: writable proxy - 設定 (value 指定) は setByRef を呼ぶ", () => {
    const info = {
      pattern: "a.*.b.*.c",
      wildcardParentInfos: [ { pattern: "a" }, { pattern: "a.*.b" } ],
    };
    getStructuredPathInfoMock.mockReturnValue(info);

    const handler = makeHandler(null, {
      "a": [ { li: 0 }, { li: 1 } ],
      "a.*.b": [ { li: 10 }, { li: 11 } ],
    }, false); // writable handler
    const target = {};
    const receiver = makeReceiver(false); // writable receiver

    setByRefMock.mockReturnValue(undefined);

    const fn = resolve(target, "prop", receiver, handler);
    const result = fn("pathStr", [0, 1], { v: 1 });

    // setByRef を呼んだ後は明示的な戻り値が無いので undefined
    expect(result).toBeUndefined();
    expect(setByRefMock).toHaveBeenCalledTimes(1);
    const setCall = setByRefMock.mock.calls[0];
    expect(setCall[0]).toBe(target);
    expect(setCall[2]).toEqual({ v: 1 });
    expect(setCall[3]).toBe(receiver);
    expect(setCall[4]).toBe(handler);
    
    // getStatePropertyRef が最終的に正しい ref で呼ばれることを確認
    const lastRefCall = getStatePropertyRefMock.mock.calls.at(-1)!;
    expect(lastRefCall[0]).toBe(info);
    expect(lastRefCall[1]).toEqual({ li: 11 }); // indexes[0, 1] → listIndex at index 1
  });

  // 追加のブランチテスト
  it("lastInfo が null の場合は動的依存登録しない (readonly)", () => {
    const info = { pattern: "p1", wildcardParentInfos: [] };
    getStructuredPathInfoMock.mockReturnValue(info);
    const handler = makeHandler(null, {}, true); // readonly handler
    const target = {}; 
    const receiver = makeReceiver(true); // readonly receiver
    getByRefMock.mockReturnValue("V");
    const fn = resolve(target, "prop", receiver, handler);
    const result = fn("p1", []);
    expect(result).toBe("V");
    expect(handler.engine.pathManager.addDynamicDependency).not.toHaveBeenCalled();
  });

  it("lastInfo と同一 pattern の場合は動的依存登録しない (readonly)", () => {
    const info = { pattern: "same", wildcardParentInfos: [] };
    getStructuredPathInfoMock.mockReturnValue(info);
    const handler = makeHandler("same", {}, true); // readonly handler
    const target = {}; 
    const receiver = makeReceiver(true); // readonly receiver
    getByRefMock.mockReturnValue("V");
    const fn = resolve(target, "prop", receiver, handler);
    const result = fn("same", []);
    expect(result).toBe("V");
    expect(handler.engine.pathManager.addDynamicDependency).not.toHaveBeenCalled();
  });

  it("getters に含まれない場合は動的依存登録しない (writable)", () => {
    const info = { pattern: "pp", wildcardParentInfos: [] };
    getStructuredPathInfoMock.mockReturnValue(info);
    const handler = makeHandler("last", {}, false); // writable handler
    handler.engine.pathManager.getters = new Set();
    handler.engine.pathManager.onlyGetters = new Set();
    const target = {}; 
    const receiver = makeReceiver(false); // writable receiver
    getByRefMock.mockReturnValue("VV");
    const fn = resolve(target, "prop", receiver, handler);
    const result = fn("pp", []);
    expect(result).toBe("VV");
    expect(handler.engine.pathManager.addDynamicDependency).not.toHaveBeenCalled();
  });

  it("setters に含まれる場合は動的依存登録しない (writable)", () => {
    const info = { pattern: "qq", wildcardParentInfos: [] };
    getStructuredPathInfoMock.mockReturnValue(info);
    const handler = makeHandler("last", {}, false); // writable handler
    handler.engine.pathManager.setters = new Set(["last"]);
    handler.engine.pathManager.onlyGetters = new Set();
    const target = {}; 
    const receiver = makeReceiver(false); // writable receiver
    getByRefMock.mockReturnValue("VV");
    const fn = resolve(target, "prop", receiver, handler);
    const result = fn("qq", []);
    expect(result).toBe("VV");
    expect(handler.engine.pathManager.addDynamicDependency).not.toHaveBeenCalled();
  });

  it("indexes が不足する場合はエラーを投げる", () => {
    const info = { pattern: "a.*.b", wildcardParentInfos: [ { pattern: "a" } ] };
    getStructuredPathInfoMock.mockReturnValue(info);
    const handler = makeHandler(null, { "a": [ { li: 0 } ] }, true); // readonly handler
    const target = {}; 
    const receiver = makeReceiver(true); // readonly receiver
    const fn = resolve(target, "prop", receiver, handler);
    expect(() => fn("p", []))
      .toThrowError(/indexes length is insufficient: p/);
  });

  it("listIndexes が見つからない場合はエラー", () => {
    const info = { pattern: "a.*.b", wildcardParentInfos: [ { pattern: "a" } ] };
    getStructuredPathInfoMock.mockReturnValue(info);
    // getListIndexes が undefined を返す
    const handler = makeHandler(null, {}, false); // writable handler
    const target = {}; 
    const receiver = makeReceiver(false); // writable receiver
    const fn = resolve(target, "prop", receiver, handler);
    expect(() => fn("p", [0]))
      .toThrowError(/ListIndexes not found: a/);
  });

  it("listIndex が見つからない場合はエラー", () => {
    const info = { pattern: "a.*.b", wildcardParentInfos: [ { pattern: "a" } ] };
    getStructuredPathInfoMock.mockReturnValue(info);
    const handler = makeHandler(null, { "a": [ { li: 0 } ] }, false); // writable handler
    const target = {}; 
    const receiver = makeReceiver(false); // writable receiver
    const fn = resolve(target, "prop", receiver, handler);
    expect(() => fn("p", [1])) // index 1 は存在しない
      .toThrowError(/ListIndex not found: a/);
  });

  it("proxy と handler の不整合でも getter 処理は継続 (Symbol 判定)", () => {
    const info = { pattern: "test", wildcardParentInfos: [] };
    getStructuredPathInfoMock.mockReturnValue(info);
    const handler = makeHandler(null, {}, true); // readonly handler
    const target = {};
    const receiver = makeReceiver(false); // writable receiver (不整合)
    getByRefMock.mockReturnValue("MISMATCH-VALUE");

    const fn = resolve(target, "prop", receiver, handler);
    expect(fn("test", [])).toBe("MISMATCH-VALUE");
    expect(handler.engine.pathManager.addDynamicDependency).not.toHaveBeenCalled();
    expect(getByRefMock).toHaveBeenCalledTimes(1);
  });

  it("ワイルドカードなしのパスで動作確認 (readonly)", () => {
    const info = { pattern: "simple.path", wildcardParentInfos: [] };
    getStructuredPathInfoMock.mockReturnValue(info);
    const handler = makeHandler("different", {}, true); // readonly handler
    const target = {}; 
    const receiver = makeReceiver(true); // readonly receiver
    getByRefMock.mockReturnValue("SIMPLE-VALUE");

    const fn = resolve(target, "prop", receiver, handler);
    const result = fn("simple.path", []);

    expect(result).toBe("SIMPLE-VALUE");
    expect(handler.engine.pathManager.addDynamicDependency).toHaveBeenCalledWith("different", "simple.path");
    
    // ワイルドカードがないので、listIndex は null のまま
    const lastRefCall = getStatePropertyRefMock.mock.calls.at(-1)!;
    expect(lastRefCall[0]).toBe(info);
    expect(lastRefCall[1]).toBeNull();
  });

  it("ワイルドカードなしのパスで動作確認 (writable 設定)", () => {
    const info = { pattern: "simple.path", wildcardParentInfos: [] };
    getStructuredPathInfoMock.mockReturnValue(info);
    const handler = makeHandler(null, {}, false); // writable handler
    const target = {}; 
    const receiver = makeReceiver(false); // writable receiver

    const fn = resolve(target, "prop", receiver, handler);
    const result = fn("simple.path", [], "NEW-VALUE");

    expect(result).toBeUndefined();
    expect(setByRefMock).toHaveBeenCalledTimes(1);
    const setCall = setByRefMock.mock.calls[0];
    expect(setCall[2]).toBe("NEW-VALUE");
    
    // ワイルドカードがないので、listIndex は null のまま
    const lastRefCall = getStatePropertyRefMock.mock.calls.at(-1)!;
    expect(lastRefCall[0]).toBe(info);
    expect(lastRefCall[1]).toBeNull();
  });
});
