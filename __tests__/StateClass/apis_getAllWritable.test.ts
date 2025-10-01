/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAllWritable } from "../../src/StateClass/apis/getAllWritable.js";

// Mock utils (payload/legacy 両対応)
const raiseErrorMock = vi.fn((arg: any) => { throw new Error(typeof arg === 'string' ? arg : (arg?.message ?? String(arg))); });
vi.mock("../../src/utils", () => ({
  raiseError: (arg: any) => raiseErrorMock(typeof arg === 'string' ? arg : (arg?.message ?? String(arg)))
}));

// Mock getStructuredPathInfo 
const getStructuredPathInfoMock = vi.fn();
vi.mock("../../src/StateProperty/getStructuredPathInfo", () => ({
  getStructuredPathInfo: (path: string) => getStructuredPathInfoMock(path)
}));

// Mock getStatePropertyRef
const getStatePropertyRefMock = vi.fn((info: any, listIndex: any) => ({ info, listIndex }));
vi.mock("../../src/StatePropertyRef/StatepropertyRef", () => ({
  getStatePropertyRef: (info: any, listIndex: any) => getStatePropertyRefMock(info, listIndex)
}));

// Mock resolve
const resolveMock = vi.fn();
vi.mock("../../src/StateClass/apis/resolve", () => ({
  resolve: (target: any, prop: any, receiver: any, handler: any) => resolveMock
}));

// Mock getContextListIndex
const getContextListIndexMock = vi.fn();
vi.mock("../../src/StateClass/methods/getContextListIndex", () => ({
  getContextListIndex: (handler: any, pattern: string) => getContextListIndexMock(handler, pattern)
}));

function makeInfo() {
  return {
    pattern: "items.*.value",
    wildcardInfos: [{ pattern: "items.*", index: 0 }],
    wildcardParentInfos: [{ pattern: "items.*", index: 0 }]
  };
}

function makeHandler(lastPattern: string = "current.pattern") {
  const addDynamicDependency = vi.fn();
  const pathManager = {
    getters: new Set([lastPattern]),
    setters: new Set(),
    addDynamicDependency
  };
  const getListIndexes = vi.fn();
  const engine = { pathManager, getListIndexes };
  const handler = {
    lastRefStack: { info: { pattern: lastPattern } },
    engine
  };
  return { handler, engine, addDynamicDependency, getListIndexes };
}

beforeEach(() => {
  vi.clearAllMocks();
  getStructuredPathInfoMock.mockReset();
  getStatePropertyRefMock.mockReset();
  resolveMock.mockReset();
  getContextListIndexMock.mockReset();
  raiseErrorMock.mockReset();
});

describe("StateClass/apis getAllWritable", () => {
  it("基本的な動作: 全インデックス組み合わせを取得", () => {
    const info = makeInfo();
    getStructuredPathInfoMock.mockReturnValue(info);
    const { handler, getListIndexes } = makeHandler("different.pattern");
    
    // モック設定: getListIndexes が2つのインデックスを返す
    getListIndexes.mockReturnValue([
      { index: 0 }, { index: 1 }
    ]);

    // resolveFn のモック設定
    resolveMock.mockImplementation((pattern: string, indexes: number[]) => 
      `${pattern}[${indexes.join(',')}]`
    );

    const target = {};
    const receiver = {} as any;
    const fn = getAllWritable(target, "$getAll", receiver, handler as any);
    
    const result = fn("items.*.value", []);
    
    expect(result).toEqual([
      "items.*.value[0]",
      "items.*.value[1]"
    ]);
    expect(handler.engine.pathManager.addDynamicDependency).toHaveBeenCalledWith(
      "different.pattern", 
      "items.*.value"
    );
  });

  it("indexes未指定時はgetContextListIndexを使用", () => {
    const info = makeInfo();
    getStructuredPathInfoMock.mockReturnValue(info);
    const { handler, getListIndexes } = makeHandler("same.pattern");
    
    // getContextListIndex がインデックスを返す
    getContextListIndexMock.mockReturnValue({ indexes: [1] });
    getListIndexes.mockReturnValue([
      { index: 0 }, { index: 1 }, { index: 2 }
    ]);

    resolveMock.mockImplementation((pattern: string, indexes: number[]) => 
      `${pattern}[${indexes.join(',')}]`
    );

    const target = {};
    const receiver = {} as any;
    const fn = getAllWritable(target, "$getAll", receiver, handler as any);
    
    // indexes未指定で呼び出し
    const result = fn("items.*.value");
    
    expect(getContextListIndexMock).toHaveBeenCalledWith(handler, "items.*");
    expect(result).toHaveLength(1); // indexes=[1]なので1つのインデックスのみ処理される
    expect(result).toEqual(["items.*.value[1]"]);
  });

  it("同一パターンの場合は依存登録なし", () => {
    const info = makeInfo();
    getStructuredPathInfoMock.mockReturnValue(info);
    const { handler, getListIndexes } = makeHandler("items.*.value"); // 同一パターン
    
    getListIndexes.mockReturnValue([{ index: 0 }]);
    resolveMock.mockImplementation(() => "result");

    const target = {};
    const receiver = {} as any;
    const fn = getAllWritable(target, "$getAll", receiver, handler as any);
    
    fn("items.*.value", [0]);
    
    // 同一パターンなので依存登録されない
    expect(handler.engine.pathManager.addDynamicDependency).not.toHaveBeenCalled();
  });

  it("gettersに含まれない場合は依存登録なし", () => {
    const info = makeInfo();
    getStructuredPathInfoMock.mockReturnValue(info);
    const { handler, getListIndexes } = makeHandler("other.pattern");
    
    // gettersから除外
    handler.engine.pathManager.getters.clear();
    
    getListIndexes.mockReturnValue([{ index: 0 }]);
    resolveMock.mockImplementation(() => "result");

    const target = {};
    const receiver = {} as any;
    const fn = getAllWritable(target, "$getAll", receiver, handler as any);
    
    fn("items.*.value", [0]);
    
    expect(handler.engine.pathManager.addDynamicDependency).not.toHaveBeenCalled();
  });

  it("settersに含まれる場合は依存登録なし", () => {
    const info = makeInfo();
    getStructuredPathInfoMock.mockReturnValue(info);
    const { handler, getListIndexes } = makeHandler("other.pattern");
    
    // settersに追加
    handler.engine.pathManager.setters.add("other.pattern");
    
    getListIndexes.mockReturnValue([{ index: 0 }]);
    resolveMock.mockImplementation(() => "result");

    const target = {};
    const receiver = {} as any;
    const fn = getAllWritable(target, "$getAll", receiver, handler as any);
    
    fn("items.*.value", [0]);
    
    expect(handler.engine.pathManager.addDynamicDependency).not.toHaveBeenCalled();
  });

  it("lastRefStackがnullの場合は依存登録なし", () => {
    const info = makeInfo();
    getStructuredPathInfoMock.mockReturnValue(info);
    const { handler, getListIndexes } = makeHandler();
    
    // lastRefStackをnullに設定
    (handler as any).lastRefStack = null;
    
    getListIndexes.mockReturnValue([{ index: 0 }]);
    resolveMock.mockImplementation(() => "result");

    const target = {};
    const receiver = {} as any;
    const fn = getAllWritable(target, "$getAll", receiver, handler as any);
    
    fn("items.*.value", [0]);
    
    expect(handler.engine.pathManager.addDynamicDependency).not.toHaveBeenCalled();
  });

  it("listIndexes取得に失敗した場合はエラー", () => {
    const info = makeInfo();
    getStructuredPathInfoMock.mockReturnValue(info);
    const { handler, getListIndexes } = makeHandler("other.pattern");
    
    // 常にnullを返す
    getListIndexes.mockReturnValue(null);
    
    const target = {};
    const receiver = {} as any;
    const fn = getAllWritable(target, "$getAll", receiver, handler as any);
    
    expect(() => fn("items.*.value", [0])).toThrow();
    expect(raiseErrorMock).toHaveBeenCalledWith("ListIndex not found: items.*");
  });

  it("エラー: wildcardPattern が null の場合は例外を投げる", () => {
    const handler = makeHandler("current.pattern").handler;
    getStructuredPathInfoMock.mockReturnValue({
      pattern: "items.*.value",
      wildcardInfos: [null], // null を含む
      wildcardParentInfos: []
    });
    getContextListIndexMock.mockReturnValue(null);

    const target = {};
    const receiver = {} as any;
    const fn = getAllWritable(target, "$getAll", receiver, handler as any);
    
    expect(() => {
      fn("items.*.value"); // indexes 未指定なので wildcardInfos[0] が null でエラー
    }).toThrowError(/wildcardPattern is null/);
  });

  it("エラー: ListIndex not found の場合は例外を投げる", () => {
    const handler = makeHandler("current.pattern").handler;
    const getListIndexes = vi.fn();
    handler.engine.getListIndexes = getListIndexes;
    
    getStructuredPathInfoMock.mockReturnValue({
      pattern: "items.*.value",
      wildcardInfos: [{ pattern: "items.*" }],
      wildcardParentInfos: [{ pattern: "items.*" }]
    });
    getContextListIndexMock.mockReturnValue(null);
    getListIndexes.mockReturnValue([]); // 空配列でListIndexが見つからない
    
    const target = {};
    const receiver = {} as any;
    const fn = getAllWritable(target, "$getAll", receiver, handler as any);
    
    expect(() => {
      fn("items.*.value", [0]); // index 0に対応するListIndexが存在しない
    }).toThrowError(/ListIndex not found/);
  });
});