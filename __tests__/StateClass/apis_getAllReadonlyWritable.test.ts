/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetByRefSymbol } from "../../src/StateClass/symbols";
import { getAllReadonly } from "../../src/StateClass/apis/getAllReadonly";
import { getAllWritable } from "../../src/StateClass/apis/getAllWritable";

// Shared mocks
const getStructuredPathInfoMock = vi.fn();
vi.mock("../../src/StateProperty/getStructuredPathInfo", () => ({
  getStructuredPathInfo: (path: string) => getStructuredPathInfoMock(path),
}));

const getStatePropertyRefMock = vi.fn((info: any, listIndex: any) => ({ info, listIndex }));
vi.mock("../../src/StatePropertyRef/StatepropertyRef", () => ({
  getStatePropertyRef: (info: any, listIndex: any) => getStatePropertyRefMock(info, listIndex),
}));

const resolveReadonlyMock = vi.fn();
vi.mock("../../src/StateClass/apis/resolveReadonly", () => ({
  resolveReadonly: (t:any, p:any, r:any, h:any) => resolveReadonlyMock(t,p,r,h),
}));

const resolveWritableMock = vi.fn();
vi.mock("../../src/StateClass/apis/resolveWritable", () => ({
  resolveWritable: (t:any, p:any, r:any, h:any) => resolveWritableMock(t,p,r,h),
}));

const getContextListIndexMock = vi.fn();
vi.mock("../../src/StateClass/methods/getContextListIndex", () => ({
  getContextListIndex: (handler: any, pattern: string) => getContextListIndexMock(handler, pattern),
}));

function makeInfo() {
  // 2 段ワイルドカード A -> B
  const A = { pattern: "A" } as any;
  const B = { pattern: "B" } as any;
  const info = {
    pattern: "root.*.child.*.value",
    wildcardParentInfos: [A, B],
    wildcardInfos: [A, B],
  } as any;
  return { info, A, B };
}

function makeHandler(lastPattern: string) {
  const getters = new Set<string>([lastPattern]);
  const setters = new Set<string>();
  const addDynamicDependency = vi.fn();
  const engine = {
    pathManager: { getters, setters, addDynamicDependency },
    getListIndexes: (_ref: any) => null as any, // will be overwritten per test
  };
  const handler = {
    engine,
    refStack: [{ info: { pattern: lastPattern } }],
    refIndex: 0,
  } as any;
  return { handler, engine, addDynamicDependency };
}

beforeEach(() => {
  getStructuredPathInfoMock.mockReset();
  getStatePropertyRefMock.mockReset();
  resolveReadonlyMock.mockReset();
  resolveWritableMock.mockReset();
  getContextListIndexMock.mockReset();
});

describe("StateClass getAll APIs", () => {
  it("getAllReadonly: indexes 未指定 → コンテキスト解決 or 全列挙, 初回 null → GetByRef 経由で再取得して成功", () => {
    const { info, A, B } = makeInfo();
    getStructuredPathInfoMock.mockReturnValue(info);

    const { handler, engine, addDynamicDependency } = makeHandler("LAST");

    // engine.getListIndexes: 初回 A(null) は null → receiver[GetByRefSymbol] 後、配列返却
    let firstA = true;
    engine.getListIndexes = (ref: any) => {
      if (ref.info.pattern === A.pattern) {
        if (firstA && ref.listIndex == null) { firstA = false; return null; }
        return [ { index: 0 } as any, { index: 1 } as any ];
      }
      if (ref.info.pattern === B.pattern) {
        const p = ref.listIndex?.index;
        if (p === 0) return [ { index: 0 } as any, { index: 1 } as any ];
        if (p === 1) return [ { index: 0 } as any ];
      }
      return [] as any;
    };

    // receiver: GetByRefSymbol を呼ばれる
    const gotByRef: any[] = [];
    const receiver: any = {
      [GetByRefSymbol]: (ref: any) => { gotByRef.push(ref); },
    };

    // resolve: 呼ばれた indexes を戻す
    const resolveCalls: any[] = [];
    resolveReadonlyMock.mockReturnValue((path: string, indexes: number[]) => {
      resolveCalls.push({ path, indexes });
      return indexes.join(":");
    });

    const fn = getAllReadonly({}, "$getAll", receiver, handler) as any;
    const values = fn("ANY"); // indexes 未指定 → [] → 全列挙

    // LAST != info.pattern かつ getters に含み setters に含まれない → 依存登録
    expect(addDynamicDependency).toHaveBeenCalledWith("LAST", info.pattern);

    // A: [0,1], B: for 0 → [0,1], for 1 → [0] → 組合せ 3 通り
    expect(values).toEqual(["0:0", "0:1", "1:0"]);
    expect(resolveCalls.map(c => c.indexes)).toEqual([[0,0],[0,1],[1,0]]);
    expect(gotByRef.length).toBe(1);
  });

  it("getAllReadonly: indexes 未指定で getContextListIndex を採用", () => {
    const { info, A, B } = makeInfo();
    getStructuredPathInfoMock.mockReturnValue(info);

    // A では見つからず、B でコンテキスト indexes を採用
    getContextListIndexMock.mockImplementation((_h: any, pattern: string) => {
      if (pattern === A.pattern) return null;
      if (pattern === B.pattern) return { indexes: [1, 0] };
      return null;
    });

    const { handler, engine, addDynamicDependency } = makeHandler("LAST");
    engine.getListIndexes = (ref: any) => {
      if (ref.info.pattern === A.pattern) return [ { index: 0 } as any, { index: 1 } as any ];
      if (ref.info.pattern === B.pattern) {
        const p = ref.listIndex?.index;
        if (p === 1) return [ { index: 0 } as any ];
        if (p === 0) return [ { index: 0 } as any, { index: 1 } as any ];
      }
      return [] as any;
    };

    resolveReadonlyMock.mockReturnValue((_path: string, idx: number[]) => idx.join(":"));
    const receiver: any = { [GetByRefSymbol]: vi.fn() };
    const fn = getAllReadonly({}, "$getAll", receiver, handler) as any;
    const values = fn("P");
    expect(values).toEqual(["1:0"]);
    expect(addDynamicDependency).toHaveBeenCalledWith("LAST", info.pattern);
  });

  it("getAllReadonly: engine.getListIndexes が 2 回とも null → 例外", () => {
    const { info, A } = makeInfo();
    getStructuredPathInfoMock.mockReturnValue(info);
    const { handler, engine } = makeHandler("LAST");

    engine.getListIndexes = () => null as any;
    const receiver: any = { [GetByRefSymbol]: vi.fn() };
    resolveReadonlyMock.mockReturnValue(() => { /* unused */ });

    const fn = getAllReadonly({}, "$getAll", receiver, handler) as any;
    expect(() => fn("P"))
      .toThrowError(new RegExp(`ListIndex is not found: ${A.pattern}`));
  });

  it("getAllReadonly: indexes 指定で範囲外 → 例外", () => {
    const { info, A, B } = makeInfo();
    getStructuredPathInfoMock.mockReturnValue(info);
    const { handler, engine } = makeHandler("LAST");

    engine.getListIndexes = (ref: any) => {
      if (ref.info.pattern === A.pattern) return [ { index: 0 } as any, { index: 1 } as any ];
      if (ref.info.pattern === B.pattern) return [ { index: 0 } as any ];
      return [] as any;
    };
    const receiver: any = { [GetByRefSymbol]: vi.fn() };
    resolveReadonlyMock.mockReturnValue(() => { /* unused */ });

    const fn = getAllReadonly({}, "$getAll", receiver, handler) as any;
    expect(() => fn("P", [99, 0]))
      .toThrowError(new RegExp(`ListIndex not found: ${A.pattern}`));
  });

  it("getAllWritable: 全列挙と indexes 指定、依存登録ロジック", () => {
    const { info, A, B } = makeInfo();
    getStructuredPathInfoMock.mockReturnValue(info);
    const { handler, engine, addDynamicDependency } = makeHandler("LAST");

    engine.getListIndexes = (ref: any) => {
      if (ref.info.pattern === A.pattern) return [ { index: 0 } as any, { index: 1 } as any ];
      if (ref.info.pattern === B.pattern) {
        const p = ref.listIndex?.index;
        if (p === 0) return [ { index: 0 } as any, { index: 1 } as any ];
        if (p === 1) return [ { index: 0 } as any ];
      }
      return [] as any;
    };

    const receiver: any = {};

    // resolve: 呼ばれた indexes を戻す
    const resolveCalls: any[] = [];
    resolveWritableMock.mockReturnValue((path: string, indexes: number[]) => {
      resolveCalls.push({ path, indexes });
      return indexes.join("/");
    });

    // indexes 未指定 → 全列挙
    const fn = getAllWritable({}, "$getAll", receiver, handler) as any;
    const values = fn("P");
    expect(values).toEqual(["0/0", "0/1", "1/0"]);
    expect(resolveCalls.map(c => c.indexes)).toEqual([[0,0],[0,1],[1,0]]);
    expect(addDynamicDependency).toHaveBeenCalledWith("LAST", info.pattern);

    // indexes 指定 → 一部のみ
    resolveCalls.length = 0;
    const values2 = fn("P", [1,0]);
    expect(values2).toEqual(["1/0"]);
    expect(resolveCalls.map(c => c.indexes)).toEqual([[1,0]]);
  });

  it("getAllWritable: engine.getListIndexes が null → 例外", () => {
    const { info, A } = makeInfo();
    getStructuredPathInfoMock.mockReturnValue(info);
    const { handler, engine } = makeHandler("LAST");
    engine.getListIndexes = () => null as any;

    resolveWritableMock.mockReturnValue(() => { /* unused */ });

    const receiver: any = {
      [GetByRefSymbol]: vi.fn(),
    };
    const fn = getAllWritable({}, "$getAll", receiver, handler) as any;
    expect(() => fn("P"))
      .toThrowError(new RegExp(`ListIndex not found: ${A.pattern}`));
  });

  it("addDynamicDependency: lastInfo が null または同一パターンなら未登録", () => {
    const { info, A, B } = makeInfo();
    getStructuredPathInfoMock.mockReturnValue(info);

    // lastInfo が null の readonly
    {
      const getters = new Set<string>();
      const setters = new Set<string>();
      const addDynamicDependency = vi.fn();
      const engine = {
        pathManager: { getters, setters, addDynamicDependency },
        getListIndexes: (ref: any) => {
          if (ref.info.pattern === A.pattern) return [ { index: 0 } as any ];
          if (ref.info.pattern === B.pattern) return [ { index: 0 } as any ];
          return [] as any;
        },
      };
      const handler: any = { engine, refStack: [{}], refIndex: 0 };
      resolveReadonlyMock.mockReturnValue((_p: string, idx: number[]) => idx.join(":"));
      const receiver: any = { [GetByRefSymbol]: vi.fn() };
      const fn = getAllReadonly({}, "$getAll", receiver, handler) as any;
      const vals = fn("P");
      expect(vals).toEqual(["0:0"]);
      expect(addDynamicDependency).not.toHaveBeenCalled();
    }

    // lastInfo と info.pattern が同一の writable
    {
      const getters = new Set<string>([info.pattern]);
      const setters = new Set<string>();
      const addDynamicDependency = vi.fn();
      const engine = {
        pathManager: { getters, setters, addDynamicDependency },
        getListIndexes: (ref: any) => {
          if (ref.info.pattern === A.pattern) return [ { index: 0 } as any ];
          if (ref.info.pattern === B.pattern) return [ { index: 0 } as any ];
          return [] as any;
        },
      };
      const handler: any = { engine, refStack: [{ info: { pattern: info.pattern } }], refIndex: 0 };
      resolveWritableMock.mockReturnValue((_p: string, idx: number[]) => idx.join("/"));
      const receiver: any = { [GetByRefSymbol]: vi.fn() };
      const fn = getAllWritable({}, "$getAll", receiver, handler) as any;
      const vals = fn("P");
      expect(vals).toEqual(["0/0"]);
      expect(addDynamicDependency).not.toHaveBeenCalled();
    }
  });

  it("getAllReadonly: getters に含まれない → 依存登録なし", () => {
    const { info, A, B } = makeInfo();
    getStructuredPathInfoMock.mockReturnValue(info);
    const getters = new Set<string>(); // not containing LAST
    const setters = new Set<string>();
    const addDynamicDependency = vi.fn();
    const engine = {
      pathManager: { getters, setters, addDynamicDependency },
      getListIndexes: (ref: any) => {
        if (ref.info.pattern === A.pattern) return [ { index: 0 } as any ];
        if (ref.info.pattern === B.pattern) return [ { index: 0 } as any ];
        return [] as any;
      },
    };
    const handler: any = { engine, refStack: [{ info: { pattern: "LAST" } }], refIndex: 0 };
    resolveReadonlyMock.mockReturnValue((_p: string, idx: number[]) => idx.join(":"));
    const receiver: any = { [GetByRefSymbol]: vi.fn() };
    const fn = getAllReadonly({}, "$getAll", receiver, handler) as any;
    const vals = fn("P");
    expect(vals).toEqual(["0:0"]);
    expect(addDynamicDependency).not.toHaveBeenCalled();
  });

  it("getAllReadonly: setters に含まれる → 依存登録なし", () => {
    const { info, A, B } = makeInfo();
    getStructuredPathInfoMock.mockReturnValue(info);
    const getters = new Set<string>(["LAST"]);
    const setters = new Set<string>(["LAST"]);
    const addDynamicDependency = vi.fn();
    const engine = {
      pathManager: { getters, setters, addDynamicDependency },
      getListIndexes: (ref: any) => {
        if (ref.info.pattern === A.pattern) return [ { index: 0 } as any ];
        if (ref.info.pattern === B.pattern) return [ { index: 0 } as any ];
        return [] as any;
      },
    };
    const handler: any = { engine, refStack: [{ info: { pattern: "LAST" } }], refIndex: 0 };
    resolveReadonlyMock.mockReturnValue((_p: string, idx: number[]) => idx.join(":"));
    const receiver: any = { [GetByRefSymbol]: vi.fn() };
    const fn = getAllReadonly({}, "$getAll", receiver, handler) as any;
    const vals = fn("P");
    expect(vals).toEqual(["0:0"]);
    expect(addDynamicDependency).not.toHaveBeenCalled();
  });

  it("getAllReadonly: lastInfo と同一パターン → 依存登録なし", () => {
    const { info, A, B } = makeInfo();
    getStructuredPathInfoMock.mockReturnValue(info);
    const getters = new Set<string>([info.pattern]);
    const setters = new Set<string>();
    const addDynamicDependency = vi.fn();
    const engine = {
      pathManager: { getters, setters, addDynamicDependency },
      getListIndexes: (ref: any) => {
        if (ref.info.pattern === A.pattern) return [ { index: 0 } as any ];
        if (ref.info.pattern === B.pattern) return [ { index: 0 } as any ];
        return [] as any;
      },
    };
    const handler: any = { engine, refStack: [{ info: { pattern: info.pattern } }], refIndex: 0 };
    resolveReadonlyMock.mockReturnValue((_p: string, idx: number[]) => idx.join(":"));
    const receiver: any = { [GetByRefSymbol]: vi.fn() };
    const fn = getAllReadonly({}, "$getAll", receiver, handler) as any;
    const vals = fn("P");
    expect(vals).toEqual(["0:0"]);
    expect(addDynamicDependency).not.toHaveBeenCalled();
  });
});
