/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAllReadonly } from "../../src/StateClass/apis/getAllReadonly.js";

// Mock utils
const raiseErrorMock = vi.fn((msg: string) => { throw new Error(msg); });
vi.mock("../../src/utils", () => ({
  raiseError: (msg: string) => raiseErrorMock(msg)
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

// Mock symbols
vi.mock("../../src/StateClass/symbols", () => ({
  GetByRefSymbol: Symbol.for("GetByRef")
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

describe("StateClass/apis getAllReadonly", () => {
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
    const receiver = { [Symbol.for("GetByRef")]: vi.fn() } as any;
    const fn = getAllReadonly(target, "$getAll", receiver, handler as any);
    
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
    const receiver = { [Symbol.for("GetByRef")]: vi.fn() } as any;
    const fn = getAllReadonly(target, "$getAll", receiver, handler as any);
    
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
    const receiver = { [Symbol.for("GetByRef")]: vi.fn() } as any;
    const fn = getAllReadonly(target, "$getAll", receiver, handler as any);
    
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
    const receiver = { [Symbol.for("GetByRef")]: vi.fn() } as any;
    const fn = getAllReadonly(target, "$getAll", receiver, handler as any);
    
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
    const receiver = { [Symbol.for("GetByRef")]: vi.fn() } as any;
    const fn = getAllReadonly(target, "$getAll", receiver, handler as any);
    
    fn("items.*.value", [0]);
    
    expect(handler.engine.pathManager.addDynamicDependency).not.toHaveBeenCalled();
  });

  it("listIndexes取得失敗時にGetByRefSymbolで再取得", () => {
    const info = makeInfo();
    getStructuredPathInfoMock.mockReturnValue(info);
    const { handler, getListIndexes } = makeHandler("other.pattern");
    
    const receiver = { [Symbol.for("GetByRef")]: vi.fn() } as any;
    
    // 1回目はnull、2回目は正常値を返す
    getListIndexes
      .mockReturnValueOnce(null)
      .mockReturnValueOnce([{ index: 0 }]);
    
    resolveMock.mockImplementation(() => "result");

    const target = {};
    const fn = getAllReadonly(target, "$getAll", receiver, handler as any);
    
    const result = fn("items.*.value", [0]);
    
    // GetByRefSymbolが呼ばれることを確認
    expect(receiver[Symbol.for("GetByRef")]).toHaveBeenCalled();
    expect(result).toEqual(["result"]);
  });

  it("listIndexes取得に2回失敗した場合はエラー", () => {
    const info = makeInfo();
    getStructuredPathInfoMock.mockReturnValue(info);
    const { handler, getListIndexes } = makeHandler("other.pattern");
    
    const receiver = { [Symbol.for("GetByRef")]: vi.fn() } as any;
    
    // 2回ともnullを返す
    getListIndexes.mockReturnValue(null);
    
    const target = {};
    const fn = getAllReadonly(target, "$getAll", receiver, handler as any);
    
    expect(() => fn("items.*.value", [0])).toThrow();
    expect(raiseErrorMock).toHaveBeenCalledWith("ListIndex is not found: items.*");
  });

  it("多重ワイルドカード階層の処理", () => {
    const info = {
      pattern: "groups.*.items.*.value",
      wildcardInfos: [
        { pattern: "groups.*", index: 0 },
        { pattern: "groups.*.items.*", index: 1 }
      ],
      wildcardParentInfos: [
        { pattern: "groups.*", index: 0 },
        { pattern: "groups.*.items.*", index: 1 }
      ]
    };
    getStructuredPathInfoMock.mockReturnValue(info);
    const { handler, getListIndexes } = makeHandler("other.pattern");
    
    // 階層ごとのListIndexesを設定
    getListIndexes
      .mockReturnValueOnce([{ index: 0 }, { index: 1 }]) // groups.*
      .mockReturnValueOnce([{ index: 0 }]) // groups.0.items.*
      .mockReturnValueOnce([{ index: 0 }, { index: 1 }]); // groups.1.items.*
    
    resolveMock.mockImplementation((pattern: string, indexes: number[]) => 
      `result[${indexes.join(',')}]`
    );

    const target = {};
    const receiver = { [Symbol.for("GetByRef")]: vi.fn() } as any;
    const fn = getAllReadonly(target, "$getAll", receiver, handler as any);
    
    const result = fn("groups.*.items.*.value", []);
    
    // 2つのグループ × それぞれのアイテム数 = 3つの結果
    expect(result).toEqual([
      "result[0,0]", // groups[0].items[0]
      "result[1,0]", // groups[1].items[0] 
      "result[1,1]"  // groups[1].items[1]
    ]);
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
    const receiver = { [Symbol.for("GetByRef")]: vi.fn() } as any;
    const fn = getAllReadonly(target, "$getAll", receiver, handler as any);
    
    fn("items.*.value", [0]);
    
    expect(handler.engine.pathManager.addDynamicDependency).not.toHaveBeenCalled();
  });
});