import { describe, it, expect, vi, beforeEach } from "vitest";
import { setByRef } from "../../../src/StateClass/methods/setByRef";
import { GetByRefSymbol, GetListIndexesByRefSymbol } from "../../../src/StateClass/symbols";

vi.mock("../../../src/StateClass/methods/getByRef", () => ({
  getByRef: (target: any, ref: any) => Reflect.get(target, ref.info.pattern),
}));

const getStatePropertyRefMock = vi.fn();
vi.mock("../../../src/StatePropertyRef/StatepropertyRef", () => ({
  getStatePropertyRef: (...args: any[]) => getStatePropertyRefMock(...args),
}));

function createPathManagerSet(initial: string[] = []) {
  const internal = new Set(initial);
  return {
    add: (value: string) => internal.add(value),
    has: (value: string) => internal.has(value),
    clear: () => internal.clear(),
    intersection: (paths: Set<string>) => {
      const result = new Set<string>();
      for (const p of paths) {
        if (internal.has(p)) {
          result.add(p);
        }
      }
      return result;
    },
  };
}

function makeInfo(pattern: string, opts?: Partial<any>): any {
  const segments = pattern.split(".");
  const parentPath = segments.length > 1 ? segments.slice(0, -1).join(".") : null;
  const lastSegment = segments[segments.length - 1];
  const parentInfo: any = parentPath ? makeInfo(parentPath) : null;
  return {
    id: 1,
    sid: pattern,
    pathSegments: segments,
    lastSegment,
    cumulativePaths: [],
    cumulativePathSet: new Set<string>(),
    cumulativeInfos: [],
    cumulativeInfoSet: new Set<any>(),
    parentPath,
    parentInfo,
    wildcardPaths: [],
    wildcardPathSet: new Set<string>(),
    indexByWildcardPath: {},
    wildcardInfos: [],
    wildcardInfoSet: new Set<any>(),
    wildcardParentPaths: [],
    wildcardParentPathSet: new Set<string>(),
    wildcardParentInfos: [],
    wildcardParentInfoSet: new Set<any>(),
    lastWildcardPath: null,
    lastWildcardInfo: null,
    pattern,
    wildcardCount: segments.filter(s => s === "*").length,
    children: {},
    ...opts,
  };
}

function makeHandler(overrides: Partial<any> = {}) {
  const engine = {
    pathManager: {
      setters: createPathManagerSet(),
      getters: createPathManagerSet(),
      elements: createPathManagerSet(),
    },
    stateOutput: {
      startsWith: vi.fn().mockReturnValue(false),
      set: vi.fn(),
    },
  };
  const updater = { enqueueRef: vi.fn(), swapInfoByRef: new Map() };
  const handler = { engine, updater, refStack: [] as any[], refIndex: -1, lastRefStack: null, renderer: null } as any;
  return Object.assign(handler, overrides);
}

function makeRef(info: any, listIndex: any = null) {
  return { info, listIndex } as any;
}

describe("StateClass/methods: setByRef", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    getStatePropertyRefMock.mockReset();
    getStatePropertyRefMock.mockImplementation((info: any, listIndex: any) => ({ info, listIndex }));
  });

  it("stateOutput 経由で設定 (startsWith=true, setters 交差なし)", () => {
    const info = makeInfo("a.b");
    const ref = makeRef(info);
    const handler = makeHandler();
    handler.engine.stateOutput.startsWith.mockReturnValue(true);
  handler.engine.pathManager.setters = createPathManagerSet();
    handler.engine.stateOutput.set = vi.fn().mockReturnValue("SET-OUT");
    const result = setByRef({} as any, ref, 99, {} as any, handler as any);
    expect(result).toBe("SET-OUT");
    expect(handler.updater.enqueueRef).toHaveBeenCalledWith(ref);
  });

  it("target のプロパティへ直接設定 (setStatePropertyRef 経由)", () => {
    const info = makeInfo("a");
    const target: any = { a: 0 };
    const ref = makeRef(info);
    const handler = makeHandler();
    const ok = setByRef(target, ref, 5, {} as any, handler as any);
    expect(ok).toBe(true);
    expect(handler.updater.enqueueRef).toHaveBeenCalledWith(ref);
  });

  it("親を再帰して通常セグメントへ設定", () => {
    const info = makeInfo("a.b");
    const ref = makeRef(info);
    const target: any = { a: { b: 1 } };
    const handler = makeHandler();
    const ok = setByRef(target, ref, 777, {} as any, handler as any);
    expect(ok).toBe(true);
    expect(target.a.b).toBe(777);
    expect(handler.updater.enqueueRef).toHaveBeenCalledWith(ref);
  });

  it("ワイルドカード最終セグメント: listIndex.index の要素を設定", () => {
    const info = makeInfo("a.*");
    const ref = makeRef(info, { index: 1, parentListIndex: null });
    const target: any = { a: [10, 20, 30] };
    const handler = makeHandler();
    const ok = setByRef(target, ref, 999, {} as any, handler as any);
    expect(ok).toBe(true);
    expect(target.a[1]).toBe(999);
    expect(handler.updater.enqueueRef).toHaveBeenCalledWith(ref);
  });

  it("エラー: parentInfo が undefined の場合は例外を投げる", () => {
    const info = makeInfo("a.b", { parentInfo: null });
    const ref = makeRef(info);
    const target = {}; // target に "a.b" は存在しない
    const handler = makeHandler();
    expect(() => {
      setByRef(target, ref, 123, {} as any, handler as any);
    }).toThrowError(/propRef.stateProp.parentInfo is undefined/);
  });

  it("エラー: ワイルドカードで listIndex.index が undefined の場合は例外を投げる", () => {
    const info = makeInfo("a.b.*");
    const ref = makeRef(info, { index: undefined, parentListIndex: null }); // index が undefined
    const target = { a: { b: [10, 20, 30] } }; // target に "a.b" は存在するが "a.b.*" は存在しない
    const handler = makeHandler();
    expect(() => {
      setByRef(target, ref, 456, {} as any, handler as any);
    }).toThrowError(/propRef.listIndex\?\.index is undefined/);
  });

  it("elements: 既存 swapInfo を再利用して listIndex を更新", () => {
    const parentInfo = makeInfo("items");
    const info = makeInfo("items.*", { parentInfo, lastSegment: "*", wildcardCount: 1 });
    const listIndex = { index: 0, parentListIndex: { index: 9 } };
    const parentRef = { info: parentInfo, listIndex: listIndex.parentListIndex };
    const ref = makeRef(info, listIndex);
    ref.parentRef = parentRef;
    const handler = makeHandler();
    handler.engine.pathManager.elements = createPathManagerSet([info.pattern]);
    const value = { id: "new" };
    const swapListIndex = { index: 10 };
    const swapInfo = {
      value: [value, { id: "other" }],
      listIndexes: [swapListIndex, { index: 20 }],
    };
    handler.updater.swapInfoByRef.set(parentRef, swapInfo);
    const currentListIndexes = [{ index: 0 }, { index: 1 }];
    const receiver: any = {
      [GetByRefSymbol]: vi.fn(),
      [GetListIndexesByRefSymbol]: vi.fn().mockReturnValue(currentListIndexes),
    };
    const target: any = { items: [1, 2, 3] };
    getStatePropertyRefMock.mockReturnValueOnce(parentRef);

    const ok = setByRef(target, ref, value, receiver, handler as any);

    expect(ok).toBe(true);
    expect(target.items[0]).toBe(value);
    expect(currentListIndexes[0]).toBe(swapListIndex);
    expect(handler.updater.swapInfoByRef.get(parentRef)).toBe(swapInfo);
    expect(receiver[GetListIndexesByRefSymbol]).toHaveBeenCalledTimes(1);
    expect(handler.updater.enqueueRef).toHaveBeenCalledWith(ref);
  });

  it("elements: swapInfo が未登録の場合は生成し index 未一致なら更新しない", () => {
    const parentInfo = makeInfo("fooParent");
    const info = makeInfo("foo", { parentInfo, lastSegment: "foo" });
    const listIndex = { index: 1, parentListIndex: null };
    const parentRef = { info: parentInfo, listIndex: listIndex.parentListIndex };
    const ref = makeRef(info, listIndex);
    ref.parentRef = parentRef;
    const handler = makeHandler();
    handler.engine.pathManager.elements = createPathManagerSet([info.pattern]);
    const existingValues = ["keep"];
    const existingIndexes = [{ index: 0, sid: "idx0" }];
    const existingIndexesLengthBefore = existingIndexes.length;
    const target: any = { foo: "old" };
    const receiver: any = target;
    receiver[GetByRefSymbol] = vi.fn().mockReturnValue(existingValues);
    receiver[GetListIndexesByRefSymbol] = vi.fn().mockReturnValue(existingIndexes);
    const newValue = "new";
    getStatePropertyRefMock.mockReturnValueOnce(parentRef);

    const ok = setByRef(target, ref, newValue, receiver, handler as any);

    expect(ok).toBe(true);
    expect(target.foo).toBe(newValue);
    expect(receiver.foo).toBe(newValue);
  const stored = handler.updater.swapInfoByRef.get(parentRef);
  expect(stored).toBeUndefined();
  expect(handler.updater.swapInfoByRef.has(parentRef)).toBe(false);
    expect(receiver[GetByRefSymbol]).toHaveBeenCalledWith(parentRef);
    expect(receiver[GetListIndexesByRefSymbol]).toHaveBeenCalledTimes(2);
    expect(existingIndexes).toHaveLength(existingIndexesLengthBefore + 1);
    expect(existingIndexes[0]).toEqual({ index: 0, sid: "idx0" });
    const second = existingIndexes[1] as any;
    expect(second?.index).toBe(1);
    expect(second?.parentListIndex).toBeNull();
    expect(handler.updater.enqueueRef).toHaveBeenCalledWith(ref);
  });

  it("elements: swapInfo 未登録でも取得結果が undefined の場合は空配列を利用", () => {
    const parentInfo = makeInfo("bazParent");
    const info = makeInfo("baz", { parentInfo, lastSegment: "baz" });
    const listIndex = { index: 0, parentListIndex: null };
    const parentRef = { info: parentInfo, listIndex: listIndex.parentListIndex };
    const ref = makeRef(info, listIndex);
    ref.parentRef = parentRef;
    const handler = makeHandler();
    handler.engine.pathManager.elements = createPathManagerSet([info.pattern]);
    const target: any = { baz: "old" };
    const receiver: any = target;
    receiver[GetByRefSymbol] = vi.fn().mockReturnValue(undefined);
    receiver[GetListIndexesByRefSymbol] = vi.fn().mockReturnValue(undefined);
    getStatePropertyRefMock.mockReturnValueOnce(parentRef);

    const ok = setByRef(target, ref, "new", receiver, handler as any);

    expect(ok).toBe(true);
    expect(target.baz).toBe("new");
    expect(receiver.baz).toBe("new");
  const stored = handler.updater.swapInfoByRef.get(parentRef);
  expect(stored).toBeUndefined();
  expect(handler.updater.swapInfoByRef.has(parentRef)).toBe(false);
    expect(receiver[GetByRefSymbol]).toHaveBeenCalledWith(parentRef);
    expect(receiver[GetListIndexesByRefSymbol]).toHaveBeenCalledWith(parentRef);
    expect(handler.updater.enqueueRef).toHaveBeenCalledWith(ref);
  });

  it("elements: 既存 swapInfo で listIndexes が未取得なら空配列で更新", () => {
    const parentInfo = makeInfo("items");
    const info = makeInfo("items.*", { parentInfo, lastSegment: "*", wildcardCount: 1 });
    const listIndex = { index: 2, parentListIndex: { index: 99 } };
    const parentRef = { info: parentInfo, listIndex: listIndex.parentListIndex };
    const ref = makeRef(info, listIndex);
    ref.parentRef = parentRef;
    const handler = makeHandler();
    handler.engine.pathManager.elements = createPathManagerSet([info.pattern]);
    const value = { id: "keep" };
    const swapInfo = {
      value: [value, { id: "other" }],
      listIndexes: [{ index: 1 }, { index: 2 }],
    };
    handler.updater.swapInfoByRef.set(parentRef, swapInfo);
    const receiver: any = {
      [GetByRefSymbol]: vi.fn(),
      [GetListIndexesByRefSymbol]: vi.fn().mockReturnValue(undefined),
    };
    const target: any = { items: [value, { id: "extra" }] };

    const ok = setByRef(target, ref, value, receiver, handler as any);

    expect(ok).toBe(true);
    expect(receiver[GetListIndexesByRefSymbol]).toHaveBeenCalledWith(parentRef);
    expect(handler.updater.swapInfoByRef.get(parentRef)).toBe(swapInfo);
    expect(handler.updater.enqueueRef).toHaveBeenCalledWith(ref);
  });

  it("エラー: elements で parentRef が存在しない場合は例外を投げる", () => {
    const info = makeInfo("bar");
    const ref = makeRef(info, { index: 0, parentListIndex: null });
    const handler = makeHandler();
    handler.engine.pathManager.elements = createPathManagerSet([info.pattern]);
    const receiver: any = {
      [GetByRefSymbol]: vi.fn(),
      [GetListIndexesByRefSymbol]: vi.fn(),
    };

    expect(() => {
      setByRef({}, ref, 1, receiver, handler as any);
    }).toThrowError(/propRef.stateProp.parentInfo is undefined/);
  });
});
